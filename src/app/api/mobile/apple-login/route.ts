import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import appleSignin from 'apple-signin-auth';
import connectDB from '@/database/db';
import User from '@/database/models/User';
import { getPremiumSnapshot } from '@/lib/premium-state';

interface AppleIdTokenPayload {
  sub: string;
  email?: string;
}

function getJwtSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() || undefined;
}

function resolveDisplayName(givenName?: string, familyName?: string, email?: string) {
  const fromNameParts = [givenName, familyName].filter(Boolean).join(' ').trim();
  if (fromNameParts) {
    return fromNameParts;
  }

  if (email && email.includes('@')) {
    return email.split('@')[0];
  }

  return 'BijbelQuiz gebruiker';
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { identityToken, givenName, familyName, email } = body as {
      identityToken?: string;
      givenName?: string;
      familyName?: string;
      email?: string;
    };

    if (!identityToken) {
      return NextResponse.json(
        { error: 'identityToken is required' },
        { status: 400 },
      );
    }

    const clientId = process.env.APPLE_CLIENT_ID;
    if (!clientId) {
      console.error('[APPLE_LOGIN_SERVER_CONFIG_ERROR] APPLE_CLIENT_ID is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      );
    }

    let applePayload: AppleIdTokenPayload;
    try {
      applePayload = (await appleSignin.verifyIdToken(identityToken, {
        audience: clientId,
      })) as AppleIdTokenPayload;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown_error';
      console.error('[APPLE_LOGIN_AUTH_FAILED]', { reason: 'invalid_identity_token', message });
      return NextResponse.json(
        { error: 'Invalid Apple identity token' },
        { status: 401 },
      );
    }

    const appleUserId = applePayload.sub;
    const normalizedEmail = normalizeEmail(applePayload.email ?? email);

    if (!appleUserId) {
      return NextResponse.json(
        { error: 'Could not extract user identity from Apple token' },
        { status: 401 },
      );
    }

    let user = await User.findOne({ appleId: appleUserId });

    if (!user && normalizedEmail) {
      user = await User.findOne({ email: normalizedEmail });
    }

    if (user) {
      let updateNeeded = false;

      if (!user.appleId) {
        user.appleId = appleUserId;
        updateNeeded = true;
      }

      if ((!user.name || user.name.trim() === '') && (givenName || familyName)) {
        user.name = resolveDisplayName(givenName, familyName, normalizedEmail);
        updateNeeded = true;
      }

      if (updateNeeded) {
        await user.save();
      }
    } else {
      if (!normalizedEmail) {
        return NextResponse.json(
          {
            error:
              'No email address available. Please allow email access when signing in with Apple.',
          },
          { status: 422 },
        );
      }

      try {
        user = await User.create({
          email: normalizedEmail,
          name: resolveDisplayName(givenName, familyName, normalizedEmail),
          appleId: appleUserId,
          isPremium: false,
          xp: 0,
          level: 1,
          levelTitle: 'Zoeker',
          streak: 0,
          bestStreak: 0,
          badges: [],
          role: 'user',
        });
      } catch (error: unknown) {
        const duplicateKeyErrorCode = 11000;
        const err = error as { code?: number };
        if (err.code !== duplicateKeyErrorCode) {
          throw error;
        }

        user =
          (await User.findOne({ appleId: appleUserId })) ||
          (normalizedEmail ? await User.findOne({ email: normalizedEmail }) : null);

        if (!user) {
          throw error;
        }

        if (!user.appleId) {
          user.appleId = appleUserId;
          await user.save();
        }
      }
    }

    const token = jwt.sign({ userId: user._id }, getJwtSecret(), { expiresIn: '30d' });
    const premium = getPremiumSnapshot(user);

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        xp: user.xp || 0,
        isPremium: premium.isPremium,
        premiumStripe: premium.premiumStripe,
        premiumStore: premium.premiumStore,
        storePremiumExpiresAt: premium.storePremiumExpiresAt,
      },
    });
  } catch (error) {
    console.error('[APPLE_LOGIN_ERROR]', error);
    return NextResponse.json(
      { error: 'Internal server error during Apple login' },
      { status: 500 },
    );
  }
}
