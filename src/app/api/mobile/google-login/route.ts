import { NextResponse } from 'next/server';
import connectDB from '@/database/db';
import User from '@/database/models/User';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { getPremiumSnapshot } from '@/lib/premium-state';
import {
  getAllowedGoogleAudiences,
  getPrimaryAudience,
  isGoogleAudienceValid,
  isGoogleEmailVerified,
  isGoogleIssuerValid,
} from '@/lib/auth/google-id-token';

const client = new OAuth2Client();

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'Google ID token is required' }, { status: 400 });
    }

    const ticket = await client.verifyIdToken({ idToken });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      console.error('[GOOGLE_LOGIN_AUTH_FAILED]', {
        reason: 'missing_payload_or_email',
        aud: payload ? getPrimaryAudience(payload) : undefined,
        iss: payload?.iss,
        sub: payload?.sub,
      });
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const allowedAudiences = getAllowedGoogleAudiences();
    const audience = getPrimaryAudience(payload);

    if (!isGoogleIssuerValid(payload.iss)) {
      console.error('[GOOGLE_LOGIN_AUTH_FAILED]', {
        reason: 'invalid_issuer',
        aud: audience,
        iss: payload.iss,
        sub: payload.sub,
      });
      return NextResponse.json({ error: 'Invalid Google token issuer' }, { status: 401 });
    }

    if (!isGoogleAudienceValid(payload.aud, allowedAudiences)) {
      console.error('[GOOGLE_LOGIN_AUTH_FAILED]', {
        reason: 'invalid_audience',
        aud: audience,
        iss: payload.iss,
        sub: payload.sub,
      });
      return NextResponse.json({ error: 'Invalid Google token audience' }, { status: 401 });
    }

    if (!isGoogleEmailVerified(payload.email_verified)) {
      console.error('[GOOGLE_LOGIN_AUTH_FAILED]', {
        reason: 'email_not_verified',
        aud: audience,
        iss: payload.iss,
        sub: payload.sub,
      });
      return NextResponse.json({ error: 'Google account email is not verified' }, { status: 401 });
    }

    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });

    // If user does not exist, create them
    if (!user) {
      user = await User.create({
        email,
        name: name || '',
        image: picture || '',
        googleId,
        isPremium: false,
        xp: 0,
        level: 1,
        levelTitle: 'Beginner',
        streak: 0,
        bestStreak: 0,
        badges: [],
        role: 'user'
      });
    } else {
      // If user exists but used email/password before, link the Google ID and grab their picture
      let updateNeeded = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updateNeeded = true;
      }
      if (!user.image && picture) {
        user.image = picture;
        updateNeeded = true;
      }
      if (updateNeeded) {
        await user.save();
      }
    }

    // Generate JWT token exactly like the email/password login
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });
    const premium = getPremiumSnapshot(user);

    // Return the standard expected payload format
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
      }
    }, { status: 200 });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'unknown_error';
    if (typeof errorMessage === 'string' && errorMessage.toLowerCase().includes('token')) {
      console.error('[GOOGLE_LOGIN_AUTH_FAILED]', {
        reason: 'invalid_token',
        aud: undefined,
        iss: undefined,
        sub: undefined,
        message: errorMessage,
      });
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    console.error('[GOOGLE_MOBILE_LOGIN_ERROR]', {
      reason: 'unexpected_server_error',
      message: errorMessage,
    });
    return NextResponse.json({ error: 'Internal server error during Google login' }, { status: 500 });
  }
}
