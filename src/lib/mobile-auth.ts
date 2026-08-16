import jwt from 'jsonwebtoken';

/**
 * Tokens handed out by `/api/mobile/{login,register,google-login,apple-login}`
 * are plain HS256 JWTs carrying `userId` — a different shape from the NextAuth
 * JWE the web uses. Every mobile route reads them through here so the format
 * lives in exactly one place.
 */

export function getMobileTokenSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || 'development_fallback_secret'
  );
}

/** Sign a mobile session token for `userId`. Valid for 30 days. */
export function signMobileToken(userId: string): string {
  return jwt.sign({ userId }, getMobileTokenSecret(), { expiresIn: '30d' });
}

/** Extract the bearer token from an incoming request, or null. */
export function readBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token || null;
}

/**
 * Resolve the user id from a mobile bearer token, or null when the header is
 * missing, malformed, expired, or not a mobile token.
 */
export function getMobileUserId(req: Request): string | null {
  const token = readBearerToken(req);
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, getMobileTokenSecret());
    if (typeof decoded === 'object' && decoded && typeof decoded.userId === 'string') {
      return decoded.userId;
    }
    // Mongoose ObjectIds serialize to an object in some older tokens.
    if (typeof decoded === 'object' && decoded && decoded.userId) {
      return String(decoded.userId);
    }
  } catch {
    // An unreadable token is simply an unauthenticated request.
  }

  return null;
}
