import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/get-session';
import { connectDB, User } from '@bijbelquiz/database';

export async function GET(req: NextRequest) {
  const session = await getSession(req);

  if (!session || !session.user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    await connectDB();
    const user = await User.findById(session.user.id).lean();

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      xp: user.xp || 0,
      isPremium: !!user.isPremium,
      streak: user.streak || 0,
      level: user.level || 1,
      levelTitle: user.levelTitle || 'Manna Verzamelaar',
    });
  } catch (error) {
    console.error('[USER_ME_GET]', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
