import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, User } from '@/database';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }

    const body = await req.json();

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        $set: {
          "onboarding.bibleReadingFrequency": body.bibleReadingFrequency || '',
          "onboarding.knowledgeLevel": body.knowledgeLevel || '',
          "onboarding.interests": body.interests || []
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      onboarding: updatedUser.onboarding,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        onboardingCompleted: !!(updatedUser.onboarding && updatedUser.onboarding.knowledgeLevel)
      }
    });

  } catch (error) {
    console.error('[ONBOARDING_POST]', error);
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 });
  }
}
