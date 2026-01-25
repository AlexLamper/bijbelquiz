import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { decode } from 'next-auth/jwt';
import { NextRequest } from 'next/server';

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
              role: decoded.role as string,
            },
            expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          };
        }
      } catch (error) {
        console.error('Failed to decode mobile token', error);
      }
    }
  }

  return null;
}
