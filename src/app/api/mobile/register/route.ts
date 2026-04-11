import { NextResponse } from 'next/server';
import connectDB from '@/database/db';
import User from '@/database/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      xp: 0,
      isPremium: false,
      role: 'user'
    });

    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';
    const token = jwt.sign({ userId: user._id }, secret, { expiresIn: '30d' });

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
    console.error('Register Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
