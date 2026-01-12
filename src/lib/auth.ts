import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectDB from './db';
import User from '@/models/User';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
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
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          isPremium: user.isPremium,
          image: user.image,
        };
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
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
            });
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
        token.id = user.id;
        token.isPremium = user.isPremium;
      }

      // Bij een handmatige update (zoals na betaling) halen we de status opnieuw op uit de DB
      if (trigger === 'update' || !token.id) {
        await connectDB();
        const dbUser = await User.findById(token.id);
        if (dbUser) {
          token.isPremium = dbUser.isPremium;
        }
      }

      return token;
    },
    async session({ session, token }) {
        if (token) {
            session.user.id = token.id;
            session.user.isPremium = token.isPremium;
        }
        return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
