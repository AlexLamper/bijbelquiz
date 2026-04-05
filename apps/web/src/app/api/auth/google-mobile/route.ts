import { NextRequest, NextResponse } from 'next/server';
import { connectDB, User } from '@bijbelquiz/database';
import { encode } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, name, image, googleId } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();

    // Find or create user with Google credentials
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user from Google sign-in
      user = await User.create({
        email: email.toLowerCase(),
        name: name || 'User',
        image: image || undefined,
        googleId: googleId || undefined,
        isPremium: false,
        xp: 0,
      });
    } else {
      // Update existing user with Google data if not already set
      if (!user.googleId && googleId) {
        user.googleId = googleId;
      }
      if (!user.image && image) {
        user.image = image;
      }
      await user.save();
    }

    // Create JWT token in NextAuth format
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      isPremium: user.isPremium,
      xp: user.xp,
      role: user.role,
    };

    const token = await encode({
      token: tokenPayload,
      secret: process.env.NEXTAUTH_SECRET || '',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image,
        isPremium: user.isPremium,
        xp: user.xp,
      },
      token,
    });
  } catch (error) {
    console.error('[GOOGLE_MOBILE_AUTH_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
