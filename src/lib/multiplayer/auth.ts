import { NextRequest } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { decode } from 'next-auth/jwt';
import { AuthenticatedMultiplayerUser } from './types';
import { unauthorizedError } from './errors';

function getJwtSecret(): string {
  return process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret';
}

function resolveUserId(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as JwtPayload & {
    userId?: unknown;
    id?: unknown;
    sub?: unknown;
  };

  const candidates = [record.userId, record.id, record.sub];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }

  return null;
}

async function decodeToken(token: string): Promise<string | null> {
  const secret = getJwtSecret();

  try {
    const decoded = jwt.verify(token, secret);
    const userId = resolveUserId(decoded);
    if (userId) {
      return userId;
    }
  } catch {
    // Fall through to NextAuth token decode.
  }

  try {
    const decoded = await decode({
      token,
      secret,
    });

    const userId = resolveUserId(decoded);
    if (userId) {
      return userId;
    }
  } catch {
    return null;
  }

  return null;
}

export async function verifyMultiplayerToken(token: string | null): Promise<AuthenticatedMultiplayerUser> {
  if (!token || token.trim().length === 0) {
    throw unauthorizedError('Unauthorized');
  }

  const userId = await decodeToken(token.trim());
  if (!userId) {
    throw unauthorizedError('Unauthorized');
  }

  return { userId };
}

export async function authenticateMultiplayerRequest(req: NextRequest): Promise<AuthenticatedMultiplayerUser> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw unauthorizedError('Unauthorized');
  }

  const token = authHeader.slice('Bearer '.length).trim();
  return verifyMultiplayerToken(token);
}
