import mongoose from 'mongoose';

import {
  AnalyticsEvent,
  connectDB,
  Duel,
  GroupLicense,
  Lead,
  MultiplayerRoom,
  Payment,
  PlayerGroup,
  Quiz,
  User,
  UserProgress,
} from '@/database';
import { resolvePremiumSubscription } from '@/lib/premium-subscription';

/**
 * Deleting an account, for `/account-verwijderen` (web) and the same route
 * from the app.
 *
 * What goes, matching the copy on the page:
 * - the user document (profile, login links, XP, streak, badges, settings),
 * - quiz attempts (`UserProgress`), duels, multiplayer seats and hosted rooms,
 *   memberships of saved player groups and group licences,
 * - leads left with the account's e-mail address.
 *
 * What stays, without a link to the person: payments (bookkeeping), analytics
 * events (the user id is cleared) and quizzes an admin account authored.
 *
 * A running Stripe subscription or an active group licence the account pays
 * for blocks the deletion: deleting the account would not stop the billing,
 * and afterwards nobody could reach the portal to stop it.
 */

/** Stripe statuses that still charge, or will. */
const BILLING_STATUSES = new Set(['active', 'trialing', 'past_due', 'unpaid', 'incomplete']);

export function subscriptionBlocksDeletion(status: string | null | undefined, cancelAtPeriodEnd: boolean): boolean {
  return BILLING_STATUSES.has((status || '').toLowerCase()) && !cancelAtPeriodEnd;
}

export type DeletionResult =
  | { ok: true }
  | { ok: false; code: 'NOT_FOUND' | 'ACTIVE_SUBSCRIPTION' | 'ACTIVE_GROUP_LICENSE'; message: string; status: number };

export async function deleteAccount(userId: string): Promise<DeletionResult> {
  if (!mongoose.isValidObjectId(userId)) {
    return { ok: false, code: 'NOT_FOUND', message: 'Account niet gevonden.', status: 404 };
  }

  await connectDB();
  const id = new mongoose.Types.ObjectId(userId);
  const user = await User.findById(id);
  if (!user) {
    return { ok: false, code: 'NOT_FOUND', message: 'Account niet gevonden.', status: 404 };
  }

  if (user.stripeSubscriptionId || (user.isPremium && !user.hasLifetimePremium && user.stripeCustomerId)) {
    const subscription = await resolvePremiumSubscription(user);
    const fresh = await User.findById(id).select('stripeSubscriptionStatus').lean();
    if (subscriptionBlocksDeletion(fresh?.stripeSubscriptionStatus, subscription.cancelAtPeriodEnd)) {
      return {
        ok: false,
        code: 'ACTIVE_SUBSCRIPTION',
        status: 409,
        message: 'Je hebt nog een lopend Premium-abonnement. Zeg het eerst op via Premium beheren, daarna kun je je account verwijderen.',
      };
    }
  }

  const ownsActiveLicense = await GroupLicense.exists({ ownerId: id, status: 'active' });
  if (ownsActiveLicense) {
    return {
      ok: false,
      code: 'ACTIVE_GROUP_LICENSE',
      status: 409,
      message: 'Je beheert nog een actieve groepslicentie. Neem contact met ons op om die over te dragen of te stoppen.',
    };
  }

  const userIdString = id.toString();

  await Promise.all([
    UserProgress.deleteMany({ userId: id }),
    Duel.deleteMany({ $or: [{ participants: id }, { challengerId: id }, { opponentId: id }] }),
    MultiplayerRoom.deleteMany({ hostUserId: userIdString }),
    MultiplayerRoom.updateMany({ 'players.id': userIdString }, { $pull: { players: { id: userIdString } } }),
    GroupLicense.deleteMany({ ownerId: id }),
    GroupLicense.updateMany({ memberIds: id }, { $pull: { memberIds: id } }),
    AnalyticsEvent.updateMany({ userId: id }, { $set: { userId: null } }),
    // Bookkeeping keeps the payment, not the person: `user` is required on new
    // documents, and an update without validators may unset it.
    Payment.updateMany({ user: id }, { $unset: { user: 1 } }),
    Quiz.updateMany({ createdBy: id }, { $unset: { createdBy: 1 } }),
    user.email ? Lead.deleteMany({ email: user.email }) : Promise.resolve(),
  ]);

  // Saved groups: leave them; hand ownership on; drop the ones nobody is left in.
  await PlayerGroup.updateMany({ memberIds: id }, { $pull: { memberIds: id } });
  const ownedGroups = await PlayerGroup.find({ ownerId: id }).select('memberIds');
  for (const group of ownedGroups) {
    if (group.memberIds.length < 2) {
      await PlayerGroup.deleteOne({ _id: group._id });
    } else {
      await PlayerGroup.updateOne({ _id: group._id }, { $set: { ownerId: group.memberIds[0] } });
    }
  }

  await User.deleteOne({ _id: id });
  return { ok: true };
}
