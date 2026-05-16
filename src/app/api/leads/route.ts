import { NextRequest, NextResponse } from 'next/server';
import { connectDB, Lead } from '@/database';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = (await req.json().catch(() => ({}))) as {
      name?: string;
      email?: string;
      source?: string;
    };
    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const source = body.source?.trim() || 'quiz-end-popup';

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'E-mailadres is verplicht.' },
        { status: 400 }
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Vul een geldig e-mailadres in.' },
        { status: 400 }
      );
    }

    const existing = await Lead.findOne({ email, source }).select('_id').lean();
    if (!existing) {
      await Lead.create({
        name,
        email,
        source,
      });
    }

    return NextResponse.json({ success: true, message: 'Lead saved successfully' });
  } catch (error) {
    console.error('Error saving lead:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
