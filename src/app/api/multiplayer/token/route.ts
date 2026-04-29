import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getJwtSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
      },
      { status: 401 },
    );
  }

  const token = jwt.sign({ userId }, getJwtSecret(), { expiresIn: '2h' });

  return NextResponse.json(
    {
      token,
    },
    { status: 200 },
  );
}
