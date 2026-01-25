import { NextRequest, NextResponse } from 'next/server';
import { connectDB, User } from '@bijbelquiz/database';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create the same payload NextAuth uses
    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      isPremium: user.isPremium,
      role: user.role,
      // Add expiration if needed, otherwise uses default
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
        isPremium: user.isPremium,
      },
      token,
    });
  } catch (error) {
    console.error('[MOBILE_LOGIN_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
