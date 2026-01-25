import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, User } from '@bijbelquiz/database';

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session || !session.user?.email) {
    return new NextResponse("Log eerst in!", { status: 401 });
  }

  try {
    await connectDB();
    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email },
      { isPremium: true },
      { new: true }
    );

    if (!updatedUser) {
      return new NextResponse("Gebruiker niet gevonden in database", { status: 404 });
    }

    return new NextResponse(`Succes! Gebruiker ${updatedUser.email} is nu Premium. Herlaad de website om het resultaat te zien.`, { status: 200 });
  } catch (error) {
    const errorWithMessage = error as { message: string };
    return new NextResponse("Fout: " + errorWithMessage.message, { status: 500 });
  }
}
