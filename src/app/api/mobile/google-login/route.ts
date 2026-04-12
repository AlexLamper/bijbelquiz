import { NextResponse } from 'next/server';
import connectDB from '@/database/db';
import User from '@/database/models/User';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { idToken } = body;

    if (!idToken) {
      return NextResponse.json({ error: 'Google ID token is required' }, { status: 400 });
    }

    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken,
      // Pass the Web Client ID here because Google signs the token with it
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
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

    // Return the standard expected payload format
    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        xp: user.xp || 0,
        isPremium: user.isPremium || false,
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Google Mobile Login Error:', error);
    return NextResponse.json({ error: 'Internal server error during Google login' }, { status: 500 });
  }
}
