import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Lead from '@/models/Lead';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email } = await req.json();

    // If both fields are empty, we just track the interaction or ignore (user skipped)
    // But the prompt implies we want to capture data if provided.
    // However, the button "Bekijk Antwoorden" is always active.
    
    if (name || email) {
        await Lead.create({
            name,
            email,
            source: 'quiz-end-popup'
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
