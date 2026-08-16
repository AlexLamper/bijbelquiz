import mongoose from 'mongoose';

import { MultiplayerRoom, PlayerGroup, User, UserProgress, connectDB } from '@/database';
import { AvatarConfig, resolveAvatar } from '@/lib/avatar';
import type { LeaderboardPeriod } from '@/lib/leaderboard';

/**
 * Saved groups: the people you played with, kept.
 *
 * A room is thrown away when it finishes, and with it the only social graph
 * this product ever gets. Saving it costs one tap on the results screen and
 * buys the two things that bring people back - a leaderboard small enough to
 * be winnable, and a re-invite that does not require retyping anybody's name.
 *
 * The rules that matter:
 *  - Membership is by user id, so a renamed account stays in its group.
 *  - The owner cannot remove themselves; they leave, which deletes the group
 *    if they were the last one and hands ownership on otherwise.
 *  - A group needs two people. A leaderboard of one is a mirror.
 */

/** Above this, the group list stops being a list and starts being a problem. */
export const MAX_GROUPS_PER_USER = 20;

/** A room seats 20 at most, so this only ever bites on repeated saves. */
export const MAX_GROUP_MEMBERS = 50;

const MIN_GROUP_MEMBERS = 2;

export interface PlayerGroupMember {
  id: string;
  name: string;
  isOwner: boolean;
  avatar: AvatarConfig;
}

export interface PlayerGroupSummary {
  id: string;
  name: string;
  memberCount: number;
  isOwner: boolean;
  createdFromRoomCode: string | null;
  createdAt: string;
  members: PlayerGroupMember[];
}

export interface PlayerGroupLeaderboardEntry {
  _id: string;
  name: string;
  xp: number;
  streak: number;
  avatar: AvatarConfig;
  levelTitle: string;
  isPremium: boolean;
  rank: number;
}

export interface PlayerGroupLeaderboard {
  group: PlayerGroupSummary;
  period: LeaderboardPeriod;
  entries: PlayerGroupLeaderboardEntry[];
  currentUserRank: number | null;
}

export type PlayerGroupResult<T> =
  | ({ ok: true } & T)
  | { ok: false; error: string; status: number };

function fail(error: string, status: number): { ok: false; error: string; status: number } {
  return { ok: false, error, status };
}

function toObjectId(value: string): mongoose.Types.ObjectId | null {
  return mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(value) : null;
}

/** Thirty days back, matching the site-wide monthly leaderboard exactly. */
function monthlyStart(): Date {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

function sanitizeName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 60);
}

interface GroupDocumentShape {
  _id: mongoose.Types.ObjectId;
  name: string;
  ownerId: mongoose.Types.ObjectId;
  memberIds: mongoose.Types.ObjectId[];
  createdFromRoomCode: string | null;
  createdAt: Date;
}

/**
 * Turns stored documents into summaries, resolving member names in one query.
 *
 * Batched across every group at once rather than per group: the profile screen
 * asks for the whole list, and a lookup per group is how a five-group list
 * becomes six round trips.
 */
async function summarize(groups: GroupDocumentShape[], viewerId: string): Promise<PlayerGroupSummary[]> {
  const allMemberIds = groups.flatMap((group) => group.memberIds);
  if (allMemberIds.length === 0) {
    return groups.map((group) => ({
      id: String(group._id),
      name: group.name,
      memberCount: 0,
      isOwner: String(group.ownerId) === viewerId,
      createdFromRoomCode: group.createdFromRoomCode ?? null,
      createdAt: new Date(group.createdAt).toISOString(),
      members: [],
    }));
  }

  const users = await User.find({ _id: { $in: allMemberIds } })
    .select('name avatar')
    .lean();

  const byId = new Map(users.map((user) => [String(user._id), user]));

  return groups.map((group) => {
    const ownerId = String(group.ownerId);
    const members = group.memberIds.map((memberId) => {
      const id = String(memberId);
      const user = byId.get(id);
      return {
        id,
        name: user?.name || 'Speler',
        isOwner: id === ownerId,
        avatar: resolveAvatar(user?.avatar, id),
      };
    });

    return {
      id: String(group._id),
      name: group.name,
      memberCount: members.length,
      isOwner: ownerId === viewerId,
      createdFromRoomCode: group.createdFromRoomCode ?? null,
      createdAt: new Date(group.createdAt).toISOString(),
      members,
    };
  });
}

/** Every group this user belongs to, newest first. */
export async function listFor(userId: string): Promise<PlayerGroupSummary[]> {
  const objectId = toObjectId(userId);
  if (!objectId) return [];

  await connectDB();

  const groups = await PlayerGroup.find({ memberIds: objectId })
    .sort({ createdAt: -1 })
    .limit(MAX_GROUPS_PER_USER)
    .lean();

  return summarize(groups as unknown as GroupDocumentShape[], userId);
}

/**
 * Saves the players of a finished room as a group.
 *
 * Only offered once the room is over, because the player list is only complete
 * then - somebody who joins at question three would otherwise be missing from
 * a group saved at question two.
 *
 * Idempotent per room: saving the same room twice returns the existing group
 * rather than making a duplicate, which is what a double tap on a slow
 * connection would otherwise produce.
 */
export async function createFromRoom(
  userId: string,
  roomCode: string,
  requestedName?: string,
): Promise<PlayerGroupResult<{ group: PlayerGroupSummary; created: boolean }>> {
  const ownerObjectId = toObjectId(userId);
  if (!ownerObjectId) return fail('Onbekende gebruiker.', 401);

  const code = String(roomCode || '').trim().toUpperCase();
  if (!code) return fail('Onbekende kamer.', 400);

  await connectDB();

  const room = await MultiplayerRoom.findOne({ code }).select('code players status quizTitle').lean();
  if (!room) return fail('Deze kamer bestaat niet meer.', 404);

  const playerIds = (room.players || []).map((player) => String(player.id));
  if (!playerIds.includes(userId)) {
    return fail('Je hebt niet in deze kamer gespeeld.', 403);
  }

  const existing = await PlayerGroup.findOne({
    createdFromRoomCode: code,
    ownerId: ownerObjectId,
  }).lean();

  if (existing) {
    const [summary] = await summarize([existing as unknown as GroupDocumentShape], userId);
    return { ok: true, group: summary, created: false };
  }

  const memberIds = Array.from(new Set(playerIds))
    .map(toObjectId)
    .filter((id): id is mongoose.Types.ObjectId => id !== null)
    .slice(0, MAX_GROUP_MEMBERS);

  if (memberIds.length < MIN_GROUP_MEMBERS) {
    return fail('Een groep heeft minstens twee spelers nodig.', 400);
  }

  const ownedCount = await PlayerGroup.countDocuments({ memberIds: ownerObjectId });
  if (ownedCount >= MAX_GROUPS_PER_USER) {
    return fail(`Je kunt maximaal ${MAX_GROUPS_PER_USER} groepen bewaren.`, 400);
  }

  const name = sanitizeName(requestedName || '') || defaultGroupName(room.quizTitle);

  const created = await PlayerGroup.create({
    name,
    ownerId: ownerObjectId,
    memberIds,
    createdFromRoomCode: code,
  });

  const [summary] = await summarize(
    [created.toObject() as unknown as GroupDocumentShape],
    userId,
  );

  return { ok: true, group: summary, created: true };
}

/**
 * The name offered when the user does not type one.
 *
 * The quiz title is the only thing on hand that means anything to the people
 * involved - "Groep 1" is what nobody comes back to.
 */
function defaultGroupName(quizTitle?: string | null): string {
  const title = sanitizeName(quizTitle || '');
  if (!title) return 'Mijn speelgroep';
  return sanitizeName(`Groep ${title}`);
}

/** Owner-only rename. */
export async function renameGroup(
  userId: string,
  groupId: string,
  rawName: string,
): Promise<PlayerGroupResult<{ group: PlayerGroupSummary }>> {
  const ownerObjectId = toObjectId(userId);
  const groupObjectId = toObjectId(groupId);
  if (!ownerObjectId || !groupObjectId) return fail('Onbekende groep.', 400);

  const name = sanitizeName(rawName);
  if (name.length < 2) return fail('Kies een naam van minstens twee tekens.', 400);

  await connectDB();

  const updated = await PlayerGroup.findOneAndUpdate(
    { _id: groupObjectId, ownerId: ownerObjectId },
    { $set: { name } },
    { new: true },
  ).lean();

  if (!updated) return fail('Alleen de eigenaar kan de groep hernoemen.', 403);

  const [summary] = await summarize([updated as unknown as GroupDocumentShape], userId);
  return { ok: true, group: summary };
}

/**
 * Removes a member, or leaves the group when removing yourself.
 *
 * An owner leaving hands the group to the next member rather than deleting it
 * out from under everybody else; the group is only deleted when the last
 * person walks out, or when it drops below two people and stops being a group
 * at all.
 */
export async function removeMember(
  userId: string,
  groupId: string,
  memberId: string,
): Promise<PlayerGroupResult<{ group: PlayerGroupSummary | null }>> {
  const actorObjectId = toObjectId(userId);
  const groupObjectId = toObjectId(groupId);
  const targetObjectId = toObjectId(memberId);
  if (!actorObjectId || !groupObjectId || !targetObjectId) return fail('Onbekende groep.', 400);

  await connectDB();

  const group = await PlayerGroup.findById(groupObjectId);
  if (!group) return fail('Deze groep bestaat niet meer.', 404);

  const isOwner = String(group.ownerId) === userId;
  const isSelf = memberId === userId;

  if (!isOwner && !isSelf) {
    return fail('Alleen de eigenaar kan iemand verwijderen.', 403);
  }

  if (!group.memberIds.some((id) => String(id) === memberId)) {
    return fail('Deze speler zit niet in de groep.', 404);
  }

  const remaining = group.memberIds.filter((id) => String(id) !== memberId);

  if (remaining.length < MIN_GROUP_MEMBERS) {
    await PlayerGroup.deleteOne({ _id: groupObjectId });
    return { ok: true, group: null };
  }

  group.memberIds = remaining;
  if (isSelf && isOwner) {
    group.ownerId = remaining[0];
  }
  await group.save();

  // A member who just left cannot see the group any more, so there is nothing
  // to hand back to them.
  if (isSelf) return { ok: true, group: null };

  const [summary] = await summarize([group.toObject() as unknown as GroupDocumentShape], userId);
  return { ok: true, group: summary };
}

/**
 * The group's standings.
 *
 * All-time reads the running `xp` total off the user document, the same field
 * the global board uses, so the two can never disagree. Monthly re-sums the
 * last thirty days of `UserProgress` because a running total cannot be sliced
 * by date after the fact.
 *
 * Members with no XP are kept in the list at zero. On a board of eight people
 * a missing row reads as a bug, and "everyone is here, you are last" is the
 * whole point of a small leaderboard.
 */
export async function leaderboardFor(
  userId: string,
  groupId: string,
  period: LeaderboardPeriod,
): Promise<PlayerGroupResult<{ leaderboard: PlayerGroupLeaderboard }>> {
  const viewerObjectId = toObjectId(userId);
  const groupObjectId = toObjectId(groupId);
  if (!viewerObjectId || !groupObjectId) return fail('Onbekende groep.', 400);

  await connectDB();

  const group = await PlayerGroup.findOne({
    _id: groupObjectId,
    memberIds: viewerObjectId,
  }).lean();

  if (!group) return fail('Deze groep bestaat niet, of je hoort er niet bij.', 404);

  const doc = group as unknown as GroupDocumentShape;
  const [summary] = await summarize([doc], userId);

  const users = await User.find({ _id: { $in: doc.memberIds } })
    .select('name avatar xp streak levelTitle isPremium')
    .lean();

  let xpById = new Map<string, number>(
    users.map((user) => [String(user._id), Number(user.xp) || 0]),
  );

  if (period === 'monthly') {
    const rows = await UserProgress.aggregate([
      {
        $match: {
          userId: { $in: doc.memberIds },
          completedAt: { $gte: monthlyStart() },
          xpEarned: { $gt: 0 },
        },
      },
      { $group: { _id: '$userId', xp: { $sum: '$xpEarned' } } },
    ]);

    const monthly = new Map<string, number>(rows.map((row) => [String(row._id), Number(row.xp) || 0]));
    xpById = new Map(users.map((user) => [String(user._id), monthly.get(String(user._id)) || 0]));
  }

  const entries = users
    .map((user) => {
      const id = String(user._id);
      return {
        _id: id,
        name: user.name || 'Speler',
        xp: xpById.get(id) || 0,
        streak: Number(user.streak) || 0,
        avatar: resolveAvatar(user.avatar, id),
        levelTitle: user.levelTitle || 'Beginner',
        isPremium: Boolean(user.isPremium),
        rank: 0,
      };
    })
    // Ties break on name so the order does not shuffle between two loads of a
    // board where nobody has played yet.
    .sort((a, b) => b.xp - a.xp || a.name.localeCompare(b.name, 'nl'))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));

  const currentUserRank = entries.find((entry) => entry._id === userId)?.rank ?? null;

  return {
    ok: true,
    leaderboard: { group: summary, period, entries, currentUserRank },
  };
}
