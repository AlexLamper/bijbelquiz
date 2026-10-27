import mongoose from 'mongoose';

import { User, connectDB } from '@/database';
import { startOfAmsterdamDay, shiftDayKey } from '@/lib/admin/time';
import { getPremiumSnapshot, manualGrantActive, recomputeUserPremium, PREMIUM_SNAPSHOT_FIELDS } from '@/lib/premium-state';

/**
 * "Premium geven" in beheer: a dated manual grant on the account.
 *
 * Stored as `premiumGranted: true` plus `premiumGrantedUntil` (null = no end
 * date), who/when/why, and an entry in `premiumGrantLog`. It goes through the
 * one Premium recompute (`recomputeUserPremium`), so it never switches off or
 * is switched off by Stripe, the stores, lifetime or a group licence, and it
 * ends by itself: every read compares the end date.
 */

export const GRANT_DURATIONS = ['7d', '1m', '3m', '1y', 'lifetime', 'custom'] as const;
export type GrantDuration = (typeof GRANT_DURATIONS)[number];

export const GRANT_DURATION_LABELS: Record<GrantDuration, string> = {
  '7d': '7 dagen',
  '1m': '1 maand',
  '3m': '3 maanden',
  '1y': '1 jaar',
  lifetime: 'Levenslang',
  custom: 'Tot een datum',
};

export const GRANT_NOTE_MAX = 300;
const MAX_YEARS_AHEAD = 10;

export function isGrantDuration(value: unknown): value is GrantDuration {
  return typeof value === 'string' && (GRANT_DURATIONS as readonly string[]).includes(value);
}

export type GrantInputError = { ok: false; error: string; field: string };

/**
 * The end moment for a grant made at `now`, or an error for the form.
 * Presets count from now (calendar months, so "1 maand" from 31 jan is 3 mrt
 * as `Date` rolls over); a bare custom date means the end of that Amsterdam
 * day; lifetime has no end (null).
 */
export function resolveGrantUntil(
  duration: unknown,
  until: unknown,
  now: Date = new Date(),
): { ok: true; duration: GrantDuration; until: Date | null } | GrantInputError {
  if (!isGrantDuration(duration)) {
    return { ok: false, error: 'Kies hoe lang Premium geldt.', field: 'duration' };
  }

  const at = new Date(now.getTime());
  switch (duration) {
    case 'lifetime':
      return { ok: true, duration, until: null };
    case '7d':
      return { ok: true, duration, until: new Date(at.getTime() + 7 * 24 * 60 * 60 * 1000) };
    case '1m':
      at.setUTCMonth(at.getUTCMonth() + 1);
      return { ok: true, duration, until: at };
    case '3m':
      at.setUTCMonth(at.getUTCMonth() + 3);
      return { ok: true, duration, until: at };
    case '1y':
      at.setUTCFullYear(at.getUTCFullYear() + 1);
      return { ok: true, duration, until: at };
    case 'custom': {
      if (typeof until !== 'string' || !until.trim()) {
        return { ok: false, error: 'Kies een einddatum.', field: 'until' };
      }
      const text = until.trim();
      let end: Date;
      if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        // End of that Amsterdam day: the start of the next one, minus 1 ms.
        end = new Date(startOfAmsterdamDay(shiftDayKey(text, 1)).getTime() - 1);
      } else {
        end = new Date(text);
      }
      if (Number.isNaN(end.getTime())) {
        return { ok: false, error: 'Deze datum klopt niet.', field: 'until' };
      }
      if (end.getTime() <= now.getTime()) {
        return { ok: false, error: 'De einddatum moet in de toekomst liggen.', field: 'until' };
      }
      const max = new Date(now.getTime());
      max.setUTCFullYear(max.getUTCFullYear() + MAX_YEARS_AHEAD);
      if (end.getTime() > max.getTime()) {
        return { ok: false, error: `Kies een datum binnen ${MAX_YEARS_AHEAD} jaar, of kies Levenslang.`, field: 'until' };
      }
      return { ok: true, duration, until: end };
    }
  }
}

export function readGrantNote(value: unknown): { ok: true; note: string | null } | GrantInputError {
  if (value === undefined || value === null) return { ok: true, note: null };
  if (typeof value !== 'string') return { ok: false, error: 'De notitie moet tekst zijn.', field: 'note' };
  const note = value.trim();
  if (note.length > GRANT_NOTE_MAX) {
    return { ok: false, error: `De notitie mag hoogstens ${GRANT_NOTE_MAX} tekens zijn.`, field: 'note' };
  }
  return { ok: true, note: note || null };
}

export interface GrantActor {
  id: string;
  email?: string | null;
  name?: string | null;
}

export type PremiumSource = 'lifetime' | 'stripe' | 'store' | 'group' | 'manual';
export const PREMIUM_SOURCES: readonly PremiumSource[] = ['lifetime', 'stripe', 'store', 'group', 'manual'];

export const PREMIUM_SOURCE_LABELS: Record<PremiumSource, string> = {
  lifetime: 'Levenslang',
  stripe: 'Website (Stripe)',
  store: 'App Store / Play',
  group: 'Groepslicentie',
  manual: 'Gegeven door beheer',
};

export type PremiumFieldsLike = Parameters<typeof getPremiumSnapshot>[0] & {
  stripeCurrentPeriodEnd?: Date | string | null;
};

export interface PremiumSummary {
  active: boolean;
  /** The one shown: lifetime, stripe, store, group, manual in that order. */
  source: PremiumSource | null;
  sources: PremiumSource[];
  /** When the shown source ends; null when it has no (known) end. */
  until: string | null;
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Every source giving Premium right now, and the one to show. */
export function summarizePremium(user: PremiumFieldsLike, now: number = Date.now()): PremiumSummary {
  const snapshot = getPremiumSnapshot(user);
  const sources: PremiumSource[] = [];
  if (snapshot.premiumLifetime) sources.push('lifetime');
  if (snapshot.premiumStripe) sources.push('stripe');
  if (snapshot.premiumStore) sources.push('store');
  if (snapshot.premiumGroup) sources.push('group');
  if (manualGrantActive(user, now)) sources.push('manual');
  // A stored flag nothing else explains (should not happen after a recompute).
  if (snapshot.isPremium && sources.length === 0) sources.push('manual');

  const source = sources[0] ?? null;
  let until: string | null = null;
  if (source === 'stripe') until = iso(user.stripeCurrentPeriodEnd);
  else if (source === 'store') until = iso(snapshot.storePremiumExpiresAt);
  else if (source === 'group') until = iso(snapshot.groupPremiumUntil);
  else if (source === 'manual') until = iso(snapshot.premiumGrantedUntil);

  return { active: snapshot.isPremium || sources.length > 0, source, sources, until };
}

export interface GrantLogEntryOut {
  action: 'grant' | 'revoke';
  duration: string | null;
  until: string | null;
  note: string | null;
  at: string;
  by: { id: string | null; name: string | null; email: string | null };
}

export type GrantResult =
  | { ok: true; premium: PremiumSummary; grant: GrantLogEntryOut }
  | { ok: false; status: number; error: string; field?: string };

function logOut(entry: {
  action: 'grant' | 'revoke';
  duration?: string | null;
  until?: Date | null;
  note?: string | null;
  by?: unknown;
  byEmail?: string | null;
  byName?: string | null;
  at: Date;
}): GrantLogEntryOut {
  return {
    action: entry.action,
    duration: entry.duration ?? null,
    until: iso(entry.until ?? null),
    note: entry.note ?? null,
    at: iso(entry.at) ?? '',
    by: { id: entry.by ? String(entry.by) : null, name: entry.byName ?? null, email: entry.byEmail ?? null },
  };
}

export { logOut as grantLogEntryOut };

const SUMMARY_FIELDS = `${PREMIUM_SNAPSHOT_FIELDS} stripeCurrentPeriodEnd`;

async function summaryFor(userId: string): Promise<PremiumSummary> {
  const user = await User.findById(userId).select(SUMMARY_FIELDS).lean<PremiumFieldsLike>();
  return summarizePremium(user ?? {});
}

/** Give (or extend/shorten) the manual grant. Input is validated here. */
export async function grantPremium(
  userId: string,
  input: { duration?: unknown; until?: unknown; note?: unknown },
  actor: GrantActor,
  now: Date = new Date(),
): Promise<GrantResult> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return { ok: false, status: 404, error: 'Gebruiker niet gevonden.' };
  const resolved = resolveGrantUntil(input.duration, input.until, now);
  if (!resolved.ok) return { ok: false, status: 400, error: resolved.error, field: resolved.field };
  const note = readGrantNote(input.note);
  if (!note.ok) return { ok: false, status: 400, error: note.error, field: note.field };

  await connectDB();
  const actorId = mongoose.Types.ObjectId.isValid(actor.id) ? new mongoose.Types.ObjectId(actor.id) : null;
  const entry = {
    action: 'grant' as const,
    duration: resolved.duration,
    until: resolved.until,
    note: note.note,
    by: actorId,
    byEmail: actor.email ?? null,
    byName: actor.name ?? null,
    at: now,
  };

  const written = await recomputeUserPremium(
    userId,
    {
      premiumGranted: true,
      premiumGrantedUntil: resolved.until,
      premiumGrantedAt: now,
      premiumGrantedBy: actorId,
      premiumGrantedNote: note.note,
    },
    { logEntry: entry },
  );
  if (!written) return { ok: false, status: 404, error: 'Gebruiker niet gevonden.' };

  return { ok: true, premium: await summaryFor(userId), grant: logOut(entry) };
}

/** End the manual grant now. Other sources stay as they are. */
export async function revokePremiumGrant(
  userId: string,
  input: { note?: unknown },
  actor: GrantActor,
  now: Date = new Date(),
): Promise<GrantResult> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return { ok: false, status: 404, error: 'Gebruiker niet gevonden.' };
  const note = readGrantNote(input.note);
  if (!note.ok) return { ok: false, status: 400, error: note.error, field: note.field };

  await connectDB();
  const current = await User.findById(userId).select(PREMIUM_SNAPSHOT_FIELDS).lean<PremiumFieldsLike>();
  if (!current) return { ok: false, status: 404, error: 'Gebruiker niet gevonden.' };
  if (!manualGrantActive(current, now.getTime())) {
    return { ok: false, status: 400, error: 'Dit account heeft geen Premium van beheer om in te trekken.' };
  }

  const actorId = mongoose.Types.ObjectId.isValid(actor.id) ? new mongoose.Types.ObjectId(actor.id) : null;
  const entry = {
    action: 'revoke' as const,
    duration: null,
    until: null,
    note: note.note,
    by: actorId,
    byEmail: actor.email ?? null,
    byName: actor.name ?? null,
    at: now,
  };

  const written = await recomputeUserPremium(
    userId,
    // `premiumGranted: false` is the explicit "taken away" the recompute keeps.
    { premiumGranted: false, premiumGrantedUntil: null },
    { logEntry: entry },
  );
  if (!written) return { ok: false, status: 404, error: 'Gebruiker niet gevonden.' };

  return { ok: true, premium: await summaryFor(userId), grant: logOut(entry) };
}
