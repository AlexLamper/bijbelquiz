import jwt from 'jsonwebtoken';
import AppleProvider from 'next-auth/providers/apple';
import type { CookiesOptions } from 'next-auth';

import { connectDB, User } from '@/database';
import { currentUserAgent, signupFields, webPlatformFromUserAgent } from '@/lib/admin/platform';

/**
 * "Doorgaan met Apple" on the website (the app has its own native flow in
 * `/api/mobile/apple-login`).
 *
 * Off unless configured, so the button only shows where it works:
 * - `APPLE_WEB_CLIENT_ID`: the Services ID (not the app's bundle id), with
 *   `<site>/api/auth/callback/apple` as its return URL;
 * - and either `APPLE_WEB_CLIENT_SECRET` (a ready client-secret JWT), or
 *   `APPLE_TEAM_ID` + `APPLE_KEY_ID` + `APPLE_PRIVATE_KEY` (the .p8 contents,
 *   `\n` escapes allowed), from which the secret is signed here at start-up.
 *   Apple accepts at most 180 days for that secret, so a process running
 *   longer than that needs a restart (any deploy does it).
 */

const SECRET_LIFETIME_S = 180 * 24 * 60 * 60 - 60;

function clientSecret(clientId: string): string | null {
  const ready = process.env.APPLE_WEB_CLIENT_SECRET?.trim();
  if (ready) return ready;

  const teamId = process.env.APPLE_TEAM_ID?.trim();
  const keyId = process.env.APPLE_KEY_ID?.trim();
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
  if (!teamId || !keyId || !privateKey) return null;

  try {
    const now = Math.floor(Date.now() / 1000);
    return jwt.sign(
      { iss: teamId, iat: now, exp: now + SECRET_LIFETIME_S, aud: 'https://appleid.apple.com', sub: clientId },
      privateKey,
      { algorithm: 'ES256', keyid: keyId },
    );
  } catch (error) {
    console.error('[APPLE_WEB] Could not sign the Apple client secret; Apple sign-in stays off.', error);
    return null;
  }
}

let cached: { clientId: string; clientSecret: string } | null | undefined;

function appleWebConfig() {
  if (cached !== undefined) return cached;
  const clientId = process.env.APPLE_WEB_CLIENT_ID?.trim();
  const secret = clientId ? clientSecret(clientId) : null;
  cached = clientId && secret ? { clientId, clientSecret: secret } : null;
  return cached;
}

/** Whether the website offers Apple sign-in. Server only. */
export function isAppleWebSignInEnabled(): boolean {
  return appleWebConfig() !== null;
}

export function appleWebProviders() {
  const config = appleWebConfig();
  return config ? [AppleProvider({ clientId: config.clientId, clientSecret: config.clientSecret })] : [];
}

/**
 * The `signIn` step for Apple: find the account by its Apple id (the app may
 * have made it) or by e-mail, link the Apple id, or create the account. The
 * e-mail on `user` is then set to the stored one, because the `jwt` callback
 * finds the account by e-mail and an app-made account may carry a different
 * (relay) address than this sign-in reports.
 */
export async function linkAppleWebUser(
  user: { email?: string | null; name?: string | null },
  appleUserId: string,
): Promise<boolean> {
  await connectDB();

  const email = user.email?.trim().toLowerCase() || undefined;
  let account = await User.findOne({ appleId: appleUserId });
  if (!account && email) account = await User.findOne({ email });

  if (account) {
    if (!account.appleId) {
      account.appleId = appleUserId;
      await account.save();
    }
  } else {
    if (!email) return false;
    const name = user.name?.trim() || email.split('@')[0];
    account = await User.create({
      email,
      name,
      appleId: appleUserId,
      isPremium: false,
      ...signupFields(webPlatformFromUserAgent(await currentUserAgent()), 'apple'),
    });
  }

  user.email = account.email;
  return true;
}

/**
 * Apple returns with a cross-site `form_post`, which does not carry `lax`
 * cookies. The PKCE verifier and the callback URL must therefore be `none`
 * (which requires `secure`, so https only). Only when Apple is on; everything
 * else keeps next-auth's defaults.
 */
export function appleWebCookies(): Partial<CookiesOptions> | undefined {
  if (!appleWebConfig()) return undefined;
  const secure = (process.env.NEXTAUTH_URL || '').startsWith('https://');
  if (!secure) return undefined;

  const options = { httpOnly: true, sameSite: 'none' as const, path: '/', secure: true };
  return {
    pkceCodeVerifier: { name: '__Secure-next-auth.pkce.code_verifier', options: { ...options, maxAge: 60 * 15 } },
    callbackUrl: { name: '__Secure-next-auth.callback-url', options },
  };
}
