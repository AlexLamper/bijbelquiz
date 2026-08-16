import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { decode } from 'next-auth/jwt';
import { NextRequest } from 'next/server';
import { connectDB, User } from '@/database';
import { getMobileUserId } from './mobile-auth';
import { getPremiumSnapshot } from './premium-state';

export async function getSession(req?: NextRequest) {
  // 1. Try standard NextAuth session (cookies)
  const session = await getServerSession(authOptions);
  if (session) return session;

  // 2. Try Bearer token (Mobile)
  if (req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = await decode({
          token,
          secret: process.env.NEXTAUTH_SECRET || '',
        });

        if (decoded) {
          return {
            user: {
              id: decoded.id as string,
              email: decoded.email as string,
              name: decoded.name as string,
              isPremium: decoded.isPremium as boolean,
              xp: (decoded.xp as number) ?? 0,
              role: decoded.role as string,
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }
      } catch (error) {
        console.error('Failed to decode mobile token', error);
      }

      // 3. Fall back to the Flutter token format: a plain HS256 JWT with
      //    `userId`. Without this branch every shared route silently treats
      //    the mobile app as anonymous.
      const userId = getMobileUserId(req);
      if (userId) {
        await connectDB();
        const user = await User.findById(userId)
          .select('email name xp role isPremium premiumStripe premiumStore storePremiumExpiresAt hasLifetimePremium')
          .lean();

        if (user) {
          return {
            user: {
              id: userId,
              email: user.email as string,
              name: user.name as string,
              isPremium: getPremiumSnapshot(user).isPremium,
              xp: (user.xp as number) ?? 0,
              role: user.role as string,
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }
      }
    }
  }

  return null;
}
