import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { connectDB, User } from '@/database';
import { getPremiumSnapshot, manualGrantExpired, recomputeUserPremium } from '@/lib/premium-state';
import { normalizeUserSettings, type UserSettings } from '@/lib/user-settings';
import { resolveAvatar } from '@/lib/avatar';
import { appleWebCookies, appleWebProviders, linkAppleWebUser } from '@/lib/auth/apple-web';
import { currentUserAgent, signupFields, touchLastActive, webPlatformFromUserAgent } from '@/lib/admin/platform';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  // Only set when Apple sign-in is configured; see `lib/auth/apple-web.ts`.
  cookies: appleWebCookies(),
  providers: [
    // "Doorgaan met Apple": present only when the APPLE_WEB_* env vars are set.
    ...appleWebProviders(),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email en wachtwoord zijn verplicht');
        }

        await connectDB();
        const email = credentials.email.toLowerCase();
        const user = await User.findOne({ email });

        if (!user) {
          throw new Error('Geen gebruiker gevonden met dit emailadres');
        }

        if (!user.password) {
          throw new Error('Dit account heeft geen wachtwoord (probeer inloggen met Google)');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error('Onjuist wachtwoord');
        }

        return {
          ...getPremiumSnapshot(user),
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          xp: user.xp,
          role: user.role,
          image: user.image,
        };
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'apple') {
        try {
          return await linkAppleWebUser(user, account.providerAccountId);
        } catch (error) {
          console.error('Error saving Apple user', error);
          return false;
        }
      }
      if (account?.provider === 'google') {
        const { email, name, image } = user;
        try {
          if (!email) {
            return false;
          }
          await connectDB();
          const userExists = await User.findOne({ email });

          if (!userExists) {
            await User.create({
              email,
              name: name || undefined,
              image: image || undefined,
              isPremium: false,
              ...signupFields(webPlatformFromUserAgent(await currentUserAgent()), 'google'),
            });
          } else if (!userExists.image && image) {
            userExists.image = image;
            await userExists.save();
          }
          return true;
        } catch (error) {
          console.error("Error saving user", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        // Indien ingelogd, zorg ervoor dat we het MongoDB ID gebruiken, 
        // niet het Google ID (wat standaard gebeurt bij OAuth).
        if (user.email) {
          await connectDB();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.id = dbUser._id.toString();
            token.name = dbUser.name || user.name || token.name;
            token.isPremium = getPremiumSnapshot(dbUser).isPremium;
            token.xp = dbUser.xp;
            token.role = dbUser.role;
            token.image = dbUser.image || user.image || token.image;
            token.settings = normalizeUserSettings(dbUser.settings);
            // The mascot stands in for a profile photo everywhere it appears,
            // so it travels on the session rather than being fetched per view.
            token.avatar = resolveAvatar(dbUser.avatar, dbUser._id.toString());
          }
        } else {
          token.id = user.id;
          token.name = user.name || token.name;
          token.isPremium = Boolean(user.isPremium);
          token.xp = user.xp;
          token.role = user.role;
          token.image = user.image || token.image;
          token.settings = normalizeUserSettings(user.settings);
          token.avatar = resolveAvatar(undefined, String(user.id));
        }
      }

      if (trigger === 'update' && session?.name) {
        token.name = session.name;
      }

      // Bij een handmatige update (zoals na betaling) halen we de status opnieuw op uit de DB
      if (trigger === 'update' || token.id) {
        // Alleen checken als het een geldig MongoDB ID lijkt (24 hex chars)
        if (token.id && token.id.match(/^[0-9a-fA-F]{24}$/)) {
          await connectDB();
          const dbUser = await User.findById(token.id);
          if (dbUser) {
            token.name = dbUser.name || token.name;
            token.isPremium = getPremiumSnapshot(dbUser).isPremium;
            token.xp = dbUser.xp;
            token.role = dbUser.role;
            token.image = dbUser.image || token.image;
            // Re-read on every refresh, so a preference saved on one device is
            // live on the next session read anywhere else.
            token.settings = normalizeUserSettings(dbUser.settings);
            // A dated beheer grant that ran out still has the stored flag on:
            // the snapshot above already ignores it; clear it once so the
            // queries that read `isPremium` directly agree.
            if (dbUser.isPremium && manualGrantExpired(dbUser)) {
              await recomputeUserPremium(String(dbUser._id), {}).catch(() => null);
            }
            // "Seen today": one conditional write per account per day.
            await touchLastActive(String(dbUser._id), webPlatformFromUserAgent(await currentUserAgent()), dbUser);
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
        if (token) {
            session.user.id = token.id;
            session.user.name = typeof token.name === 'string' ? token.name : session.user.name;
            session.user.isPremium = token.isPremium;
          session.user.xp = token.xp ?? 0;
            session.user.role = token.role;
            session.user.image = typeof token.image === 'string' ? token.image : session.user.image;
            // Normalized again rather than trusted: a token minted before this
            // field existed carries no settings at all.
            session.user.avatar = resolveAvatar(
              token.avatar as Parameters<typeof resolveAvatar>[0],
              String(token.id || '')
            );
            session.user.settings = normalizeUserSettings(
              token.settings as Partial<UserSettings> | undefined
            );
        }
        return session;
    },
  },
  pages: {
    signIn: '/inloggen',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
