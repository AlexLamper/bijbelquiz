import mongoose from 'mongoose';

import { GroupLicense, User, connectDB } from '@/database';

/**
 * Group licences: one purchase, many people with Premium.
 *
 * Membership grants Premium at read time rather than writing `isPremium` onto
 * every member. Copying the flag would mean an expiring licence has to find and
 * unset thirty user documents, and would clobber the state of a member who also
 * pays for themselves. Reading instead means the licence lapsing is enough.
 */

/** Seats included in the standard licence. */
export const GROUP_LICENSE_SEATS = 30;

/** Yearly list price, mirrored in the pricing copy. */
export const GROUP_LICENSE_PRICE_LABEL =
  process.env.NEXT_PUBLIC_GROUP_LICENSE_PRICE_LABEL || '€99,00';

/** Ambiguous characters are left out: this code is read aloud in a room. */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;
const MAX_CODE_ATTEMPTS = 25;

export interface GroupLicenseSummary {
  id: string;
  name: string;
  joinCode: string;
  seats: number;
  seatsUsed: number;
  seatsFree: number;
  expiresAt: string | null;
  status: 'active' | 'cancelled' | 'expired';
  isOwner: boolean;
  members: Array<{ id: string; name: string; isOwner: boolean }>;
}

function randomCode(): string {
  let code = '';
  for (let index = 0; index < CODE_LENGTH; index += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** A licence is only live while it is active and not past its end date. */
function isLive(license: { status: string; expiresAt?: Date | null }): boolean {
  if (license.status !== 'active') return false;
  if (!license.expiresAt) return true;
  return new Date(license.expiresAt).getTime() > Date.now();
}

/**
 * Push the licence's end date onto its members' user documents.
 *
 * `getPremiumSnapshot` is synchronous and runs on nearly every request, so it
 * reads a date on the user rather than querying licences. This is the write
 * that keeps that date true. Members already holding a *later* expiry (a
 * second, longer licence) keep theirs - `$max` never shortens somebody's
 * access.
 */
async function syncMemberPremium(
  memberIds: mongoose.Types.ObjectId[],
  until: Date | null,
): Promise<void> {
  if (memberIds.length === 0) return;

  if (!until) {
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { groupPremiumUntil: null } });
    return;
  }

  await User.updateMany({ _id: { $in: memberIds } }, { $max: { groupPremiumUntil: until } });
}

/** Default term when a caller does not supply one: one year. */
function defaultExpiry(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date;
}

/**
 * Whether this account has Premium through somebody else's licence.
 *
 * Called on every premium resolution, so it is a single indexed query and
 * nothing more.
 */
export async function hasGroupLicensePremium(userId: string | null | undefined): Promise<boolean> {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return false;

  await connectDB();

  const license = await GroupLicense.findOne({
    memberIds: new mongoose.Types.ObjectId(userId),
    status: 'active',
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .select('_id')
    .lean();

  return Boolean(license);
}

/** The licence this user owns, if any. */
export async function findOwnedLicense(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  await connectDB();
  return GroupLicense.findOne({ ownerId: userId }).sort({ createdAt: -1 });
}

/** Every licence this user is in, owned or joined. */
export async function summarizeLicensesFor(userId: string): Promise<GroupLicenseSummary[]> {
  if (!mongoose.Types.ObjectId.isValid(userId)) return [];

  await connectDB();

  const objectId = new mongoose.Types.ObjectId(userId);
  const licenses = await GroupLicense.find({
    $or: [{ ownerId: objectId }, { memberIds: objectId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  if (licenses.length === 0) return [];

  const memberIds = [...new Set(licenses.flatMap((license) => license.memberIds.map(String)))];
  const users = await User.find({ _id: { $in: memberIds } })
    .select('name')
    .lean();
  const namesById = new Map(users.map((user) => [String(user._id), user.name || 'Speler']));

  return licenses.map((license) => {
    const seatsUsed = license.memberIds.length;
    const ownerIdString = String(license.ownerId);

    return {
      id: String(license._id),
      name: license.name,
      joinCode: license.joinCode,
      seats: license.seats,
      seatsUsed,
      seatsFree: Math.max(0, license.seats - seatsUsed),
      expiresAt: license.expiresAt ? new Date(license.expiresAt).toISOString() : null,
      status: isLive(license) ? license.status : 'expired',
      isOwner: ownerIdString === userId,
      members: license.memberIds.map((memberId) => ({
        id: String(memberId),
        name: namesById.get(String(memberId)) ?? 'Speler',
        isOwner: String(memberId) === ownerIdString,
      })),
    };
  });
}

/**
 * Create a licence, or extend the one this owner already has.
 *
 * Called from the payment webhook, so it has to be idempotent: Stripe retries,
 * and a second delivery of the same event must not hand out a second licence
 * with a second code the group would have to learn.
 */
export async function grantGroupLicense(input: {
  ownerId: string;
  name?: string;
  seats?: number;
  expiresAt?: Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
}): Promise<{ id: string; joinCode: string }> {
  await connectDB();

  const ownerObjectId = new mongoose.Types.ObjectId(input.ownerId);
  const seats = input.seats ?? GROUP_LICENSE_SEATS;

  const existing = input.stripeSubscriptionId
    ? await GroupLicense.findOne({ stripeSubscriptionId: input.stripeSubscriptionId })
    : await GroupLicense.findOne({ ownerId: ownerObjectId });

  if (existing) {
    existing.status = 'active';
    existing.seats = Math.max(existing.seats, seats);
    existing.expiresAt = input.expiresAt ?? defaultExpiry();
    if (input.name) existing.name = input.name;
    if (input.stripeCustomerId) existing.stripeCustomerId = input.stripeCustomerId;
    if (input.stripeSubscriptionId) existing.stripeSubscriptionId = input.stripeSubscriptionId;
    // The buyer always holds a seat; a renewal must not drop them.
    if (!existing.memberIds.some((id) => id.equals(ownerObjectId))) {
      existing.memberIds.push(ownerObjectId);
    }
    await existing.save();
    // A renewal has to extend everybody, not only the person who paid.
    await syncMemberPremium(existing.memberIds, existing.expiresAt);
    return { id: String(existing._id), joinCode: existing.joinCode };
  }

  const owner = await User.findById(ownerObjectId).select('name').lean();
  const name = input.name || `Groep van ${owner?.name || 'BijbelQuiz'}`;

  // Retried rather than pre-checked: uniqueness is enforced by the index, and
  // a check-then-insert would still race.
  const expiresAt = input.expiresAt ?? defaultExpiry();

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
    try {
      const created = await GroupLicense.create({
        name,
        ownerId: ownerObjectId,
        joinCode: randomCode(),
        seats,
        memberIds: [ownerObjectId],
        expiresAt,
        status: 'active',
        stripeCustomerId: input.stripeCustomerId ?? undefined,
        stripeSubscriptionId: input.stripeSubscriptionId ?? undefined,
      });

      await syncMemberPremium([ownerObjectId], expiresAt);

      return { id: String(created._id), joinCode: created.joinCode };
    } catch (error) {
      const isDuplicate = (error as { code?: number })?.code === 11000;
      if (!isDuplicate) throw error;
    }
  }

  throw new Error('Could not allocate a unique group licence code');
}

export type JoinResult =
  | { ok: true; license: GroupLicenseSummary }
  | { ok: false; status: number; error: string };

/** Redeem a join code. Idempotent for somebody who is already a member. */
export async function joinGroupLicense(userId: string, rawCode: string): Promise<JoinResult> {
  await connectDB();

  const joinCode = rawCode.trim().toUpperCase();
  if (joinCode.length < 4) {
    return { ok: false, status: 400, error: 'Deze groepscode klopt niet.' };
  }

  const license = await GroupLicense.findOne({ joinCode });
  if (!license) {
    return { ok: false, status: 404, error: 'We kennen deze groepscode niet.' };
  }

  if (!isLive(license)) {
    return {
      ok: false,
      status: 403,
      error: 'Deze groepslicentie is verlopen. Vraag de beheerder om te verlengen.',
    };
  }

  const objectId = new mongoose.Types.ObjectId(userId);
  const alreadyMember = license.memberIds.some((id) => id.equals(objectId));

  if (!alreadyMember) {
    if (license.memberIds.length >= license.seats) {
      return {
        ok: false,
        status: 409,
        error: `Deze groep zit vol (${license.seats} plekken). Vraag de beheerder om plek vrij te maken.`,
      };
    }

    // Guarded by the seat count in the filter, so two people redeeming the
    // last seat at the same moment cannot both get in.
    const updated = await GroupLicense.findOneAndUpdate(
      { _id: license._id, [`memberIds.${license.seats - 1}`]: { $exists: false } },
      { $addToSet: { memberIds: objectId } },
      { new: true },
    );

    if (!updated) {
      return {
        ok: false,
        status: 409,
        error: `Deze groep zit vol (${license.seats} plekken). Vraag de beheerder om plek vrij te maken.`,
      };
    }

    await syncMemberPremium([objectId], license.expiresAt);
  }

  const summaries = await summarizeLicensesFor(userId);
  const summary = summaries.find((entry) => entry.id === String(license._id));

  return summary
    ? { ok: true, license: summary }
    : { ok: false, status: 500, error: 'Deelnemen is niet gelukt.' };
}

/** Owner removes somebody. The owner's own seat cannot be given up. */
export async function removeGroupMember(
  ownerId: string,
  licenseId: string,
  memberId: string,
): Promise<{ ok: boolean; error?: string; status?: number }> {
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(licenseId) || !mongoose.Types.ObjectId.isValid(memberId)) {
    return { ok: false, status: 400, error: 'Onbekend lid.' };
  }

  const license = await GroupLicense.findOne({ _id: licenseId, ownerId });
  if (!license) {
    return { ok: false, status: 404, error: 'Groepslicentie niet gevonden.' };
  }

  if (String(license.ownerId) === memberId) {
    return { ok: false, status: 400, error: 'De beheerder houdt altijd een plek.' };
  }

  const memberObjectId = new mongoose.Types.ObjectId(memberId);

  await GroupLicense.updateOne(
    { _id: license._id },
    { $pull: { memberIds: memberObjectId } },
  );

  // Access goes with the seat. A removed member who is in another live licence
  // gets their date restored below rather than losing access they still have.
  await syncMemberPremium([memberObjectId], null);

  const stillCovered = await GroupLicense.findOne({
    memberIds: memberObjectId,
    status: 'active',
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .select('expiresAt')
    .lean();

  if (stillCovered) {
    await syncMemberPremium([memberObjectId], stillCovered.expiresAt ?? defaultExpiry());
  }

  return { ok: true };
}

/**
 * End a licence, e.g. when its subscription is cancelled or refunded.
 *
 * Members keep access until the date they already paid for; only an explicit
 * `immediate` revokes it now. Cutting a group off mid-term because a card
 * expired is how you turn one billing problem into thirty complaints.
 */
export async function endGroupLicense(
  stripeSubscriptionId: string,
  options: { immediate?: boolean } = {},
): Promise<void> {
  await connectDB();

  const license = await GroupLicense.findOne({ stripeSubscriptionId });
  if (!license) return;

  license.status = 'cancelled';
  if (options.immediate) license.expiresAt = new Date();
  await license.save();

  if (options.immediate) {
    await syncMemberPremium(license.memberIds, null);
  }
}

/** Rename a licence. Members see this name, so the owner controls it. */
export async function renameGroupLicense(
  ownerId: string,
  licenseId: string,
  name: string,
): Promise<{ ok: boolean; error?: string; status?: number }> {
  const trimmed = name.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2 || trimmed.length > 60) {
    return { ok: false, status: 400, error: 'Groepsnaam moet tussen 2 en 60 tekens zijn.' };
  }

  await connectDB();

  const updated = await GroupLicense.findOneAndUpdate(
    { _id: licenseId, ownerId },
    { $set: { name: trimmed } },
  );

  return updated ? { ok: true } : { ok: false, status: 404, error: 'Groepslicentie niet gevonden.' };
}
