import mongoose from 'mongoose';

import { User, connectDB } from '@/database';

/**
 * Taken off the call site rather than named directly: Mongoose renamed this
 * type between major versions (`FilterQuery` to `QueryFilter`), and deriving
 * it means the next rename is not a compile error here.
 */
type UserFilter = Parameters<typeof User.countDocuments>[0];

/**
 * Accounts that hold Premium without anybody having paid for it.
 *
 * Two developer accounts and the reviewer account Apple signs in with when it
 * tests a build. All three carry a real `isPremium` flag, because they have to
 * - the reviewer must be able to open the premium surfaces, and the developer
 * accounts exist to check that those surfaces work. That makes them
 * indistinguishable from customers to any query that simply counts
 * `isPremium: true`.
 *
 * They are excluded from the premium figures on the admin pages rather than
 * having their flag removed: the flag is doing a real job. Reporting is where
 * the distinction belongs, because reporting is the only place where "how many
 * people pay us" is the question being asked.
 *
 * The list is matched case-insensitively and resolved to ids once, so a
 * mixed-case address in an older document cannot slip through.
 */
export const INTERNAL_ACCOUNT_EMAILS = [
  'aplamper06@gmail.com',
  'devlamper06@gmail.com',
  'applereview@bijbelquiz.nl',
] as const;

const NORMALIZED = new Set<string>(INTERNAL_ACCOUNT_EMAILS.map((email) => email.toLowerCase()));

/** True for an address that belongs to a test or reviewer account. */
export function isInternalAccount(email: string | null | undefined): boolean {
  return typeof email === 'string' && NORMALIZED.has(email.trim().toLowerCase());
}

const CACHE_MS = 5 * 60 * 1000;

let cache: { at: number; ids: Promise<mongoose.Types.ObjectId[]> } | null = null;

async function resolve(): Promise<mongoose.Types.ObjectId[]> {
  await connectDB();

  const rows = await User.find({
    email: { $in: INTERNAL_ACCOUNT_EMAILS.map((email) => new RegExp(`^${email}$`, 'i')) },
  })
    .select('_id')
    .lean();

  return rows.map((row) => row._id as mongoose.Types.ObjectId);
}

/**
 * The ids behind those addresses.
 *
 * Memoised for five minutes because the statistics page fires half a dozen
 * reports in parallel and every one of them needs the same three ids; the
 * promise itself is cached, so concurrent callers share one lookup rather than
 * racing to issue their own. An account added to the list above shows up at
 * the next refresh, which is soon enough for something that changes once a year.
 */
export async function getInternalAccountIds(): Promise<mongoose.Types.ObjectId[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.ids;

  const ids = resolve().catch((error) => {
    // A failed lookup must not take the admin page down, but it also must not
    // be cached: falling back to "exclude nobody" over-reports premium, so the
    // next call retries rather than living with it for five minutes.
    console.error('[INTERNAL_ACCOUNTS]', error);
    cache = null;
    return [];
  });

  cache = { at: Date.now(), ids };
  return ids;
}

/** How many of the listed accounts actually exist, for the footnotes. */
export async function getInternalAccountCount(): Promise<number> {
  return (await getInternalAccountIds()).length;
}

/**
 * `{ isPremium: true }` with the internal accounts taken out. Use this instead
 * of the raw flag anywhere a number is presented as paying customers.
 */
export async function premiumUserFilter(): Promise<UserFilter> {
  const ids = await getInternalAccountIds();
  return ids.length > 0 ? { isPremium: true, _id: { $nin: ids } } : { isPremium: true };
}
