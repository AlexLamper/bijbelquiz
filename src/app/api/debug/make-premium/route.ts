import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/db';
import User from '@/models/User';

export async function GET() {
  const session = await getServerSession(authOptions);

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
  } catch (error: any) {
    return new NextResponse("Fout: " + error.message, { status: 500 });
  }
}
