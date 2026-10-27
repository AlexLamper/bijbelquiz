import mongoose from 'mongoose';

import { User, connectDB } from '@/database';
import { startOfAmsterdamToday } from '@/lib/admin/time';

/**
 * Where people come from: the platform an account was created on and the one
 * it was last seen on.
 *
 * Recorded at account creation (`signupPlatform`, `signupMethod`) and, at most
 * once per Amsterdam day, on the first visit or app open (`lastActiveAt`,
 * `lastSeenPlatform`). Accounts from before this was recorded have no stored
 * value; `deriveSignupPlatform` reads one from their earliest analytics event
 * (or an App Store / Play payment), which is honest but less precise, so such
 * values are flagged as derived and may be `web` or `app` without the detail.
 */

export * from './platform-labels';
import { isSignupPlatform, type MethodKey, type PlatformKey, type SignupMethod, type SignupPlatform } from './platform-labels';

const MOBILE_UA = /Mobi|Android|iPhone|iPad|iPod|Silk|Kindle|Opera Mini|IEMobile|webOS|BlackBerry/i;

/** Website visitor: phone/tablet browser or desktop, from the user agent. */
export function webPlatformFromUserAgent(userAgent: string | null | undefined): 'web-desktop' | 'web-mobile' {
  return userAgent && MOBILE_UA.test(userAgent) ? 'web-mobile' : 'web-desktop';
}

/** The analytics `device` prop (mobile/tablet/desktop) as a web platform key. */
export function webPlatformFromDevice(device: unknown): 'web-desktop' | 'web-mobile' | null {
  if (device === 'mobile' || device === 'tablet') return 'web-mobile';
  if (device === 'desktop') return 'web-desktop';
  return null;
}

function readAppPlatform(value: unknown): 'ios' | 'android' | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (v === 'ios' || v === 'iphone' || v === 'ipad') return 'ios';
  if (v === 'android') return 'android';
  return null;
}

/**
 * The app's OS for a request to `/api/mobile/**`: the `X-Client-Platform`
 * header (sent by newer app builds), a `platform` field in the body, or a
 * user agent that names the OS. Null when none says (older builds send the
 * plain Dart user agent).
 */
export function appPlatformFromRequest(req: Request, bodyPlatform?: unknown): 'ios' | 'android' | null {
  const header = readAppPlatform(req.headers.get('x-client-platform'));
  if (header) return header;
  const body = readAppPlatform(bodyPlatform);
  if (body) return body;
  const ua = req.headers.get('user-agent') || '';
  if (/iPhone|iPad|iOS|CFNetwork|Darwin/i.test(ua)) return 'ios';
  if (/Android|okhttp/i.test(ua)) return 'android';
  return null;
}

/**
 * The user agent of the request being handled, for code without a `Request`
 * in hand (the next-auth callbacks). Null outside a request.
 */
export async function currentUserAgent(): Promise<string | null> {
  try {
    const { headers } = await import('next/headers');
    return (await headers()).get('user-agent');
  } catch {
    return null;
  }
}

/** Fields to put on a new account. */
export function signupFields(platform: SignupPlatform | null, method: SignupMethod) {
  return platform ? { signupPlatform: platform, signupMethod: method } : { signupMethod: method };
}

type MethodSource = {
  signupMethod?: string | null;
  password?: string | null;
  googleId?: string | null;
  appleId?: string | null;
};

/**
 * Stored method, or for older accounts the one their credentials imply. An
 * account with a password started as e-mail: Google and Apple accounts get
 * no password (a reset can add one later, which this cannot see).
 */
export function deriveSignupMethod(user: MethodSource & { hasPassword?: boolean }): MethodKey {
  const stored = user.signupMethod;
  if (stored === 'email' || stored === 'google' || stored === 'apple') return stored;
  if (user.password || user.hasPassword) return 'email';
  if (user.googleId) return 'google';
  if (user.appleId) return 'apple';
  return 'onbekend';
}

export interface PlatformEvidence {
  /** Platform of the account's earliest analytics event. */
  firstEventPlatform?: string | null;
  /** The device of the earliest web visit (session_start), if any. */
  firstWebDevice?: string | null;
  /** `app_store` / `play_store` of a store payment, if any. */
  store?: string | null;
}

/** The stored platform, or one derived from the evidence. */
export function deriveSignupPlatform(
  stored: string | null | undefined,
  evidence: PlatformEvidence = {},
): { platform: PlatformKey; derived: boolean } {
  if (isSignupPlatform(stored)) return { platform: stored, derived: false };

  const first = evidence.firstEventPlatform;
  if (first === 'ios' || first === 'android') return { platform: first, derived: true };
  if (first === 'web') return { platform: webPlatformFromDevice(evidence.firstWebDevice) ?? 'web', derived: true };
  if (evidence.store === 'app_store' || evidence.store === 'mac_app_store') return { platform: 'ios', derived: true };
  if (evidence.store === 'play_store') return { platform: 'android', derived: true };
  return { platform: 'onbekend', derived: true };
}

/**
 * Evidence for many users at once: one aggregation over their analytics
 * events and one over their store payments. Only for accounts without a
 * stored platform, so the set shrinks as new accounts carry it.
 */
export async function loadPlatformEvidence(userIds: Array<string | mongoose.Types.ObjectId>): Promise<Map<string, PlatformEvidence>> {
  const out = new Map<string, PlatformEvidence>();
  const ids = userIds
    .map((id) => (typeof id === 'string' ? (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : null) : id))
    .filter((id): id is mongoose.Types.ObjectId => Boolean(id));
  if (ids.length === 0) return out;

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) return out;

  // `$min` over {t, ...} picks the earliest row per account without sorting
  // the whole event history (documents compare field by field, `t` first).
  const [events, webStarts, payments] = await Promise.all([
    db
      .collection('analyticsevents')
      .aggregate([
        { $match: { userId: { $in: ids } } },
        { $group: { _id: '$userId', first: { $min: { t: '$createdAt', p: '$platform' } } } },
      ])
      .toArray(),
    db
      .collection('analyticsevents')
      .aggregate([
        { $match: { userId: { $in: ids }, name: 'session_start', platform: 'web' } },
        { $group: { _id: '$userId', first: { $min: { t: '$createdAt', d: '$props.device' } } } },
      ])
      .toArray(),
    db
      .collection('payments')
      .aggregate([
        { $match: { user: { $in: ids }, provider: 'revenuecat', store: { $type: 'string' } } },
        { $group: { _id: '$user', first: { $min: { t: '$createdAt', s: '$store' } } } },
      ])
      .toArray(),
  ]);

  const devices = new Map(webStarts.map((row) => [String(row._id), row.first?.d]));
  for (const row of events) {
    const device = devices.get(String(row._id));
    out.set(String(row._id), {
      firstEventPlatform: typeof row.first?.p === 'string' ? row.first.p : null,
      firstWebDevice: typeof device === 'string' ? device : null,
    });
  }
  for (const row of payments) {
    const key = String(row._id);
    out.set(key, { ...(out.get(key) ?? {}), store: typeof row.first?.s === 'string' ? row.first.s : null });
  }
  return out;
}

/**
 * Record "seen today on this platform", at most one write per account per
 * Amsterdam day: the filter only matches when the stored moment is before
 * today's midnight, so the other calls of the day are a cheap no-op match.
 *
 * `known` lets a caller that already holds the user skip the round trip.
 */
export async function touchLastActive(
  userId: string,
  platform: SignupPlatform | null,
  known?: { lastActiveAt?: Date | string | null },
): Promise<void> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return;
  const today = startOfAmsterdamToday();
  if (known && known.lastActiveAt && new Date(known.lastActiveAt).getTime() >= today.getTime()) return;
  try {
    await connectDB();
    await User.updateOne(
      { _id: userId, $or: [{ lastActiveAt: { $lt: today } }, { lastActiveAt: null }] },
      { $set: { lastActiveAt: new Date(), ...(platform ? { lastSeenPlatform: platform } : {}) } },
      // Never bump `updatedAt` for a visit.
      { timestamps: false },
    );
  } catch (error) {
    console.error('[LAST_ACTIVE]', error);
  }
}
