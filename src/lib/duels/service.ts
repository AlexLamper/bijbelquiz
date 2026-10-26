import mongoose from 'mongoose';

import { Duel, PlayerGroup, User, connectDB } from '@/database';
import type { DuelEndReason, DuelMode, DuelStatus, IDuel, IDuelAnswer } from '@/database';
import { AvatarConfig, resolveAvatar } from '@/lib/avatar';
import { getLevelInfo } from '@/lib/gamification';
import { calculateNextStreak } from '@/lib/streak';
import { DuelError, duelNotFound, duelValidationError, isVersionConflict } from './errors';
import {
  buildDuelInviteMessage,
  buildDuelInviteUrl,
  createInviteToken,
  normalizeInviteToken,
} from './invite';
import { pickDuelRounds } from './questions';
import {
  DUEL_QUESTIONS_PER_ROUND,
  DUEL_ROUNDS,
  DUEL_TURN_TIMEOUT_MS,
  FINISHED_DUELS_LISTED,
  MAX_ACTIVE_DUELS_PER_USER,
  MAX_OPEN_DUELS_PER_USER,
  ResultMark,
  Side,
  answersInRound,
  currentTurn,
  isRoundDone,
  nextQuestionIndex,
  opponentMark,
  ownMark,
  roundStarter,
  scoreOf,
} from './rules';

/**
 * Everything a duel can do, independent of HTTP.
 *
 * Every read is shaped for one viewer: the same duel looks different to both
 * players, because neither may see the other's picks (or the right answers)
 * for a question they have not answered themselves yet.
 */

// ---------------------------------------------------------------------------
// View types - the JSON the app and the website receive
// ---------------------------------------------------------------------------

export interface DuelPlayerView {
  id: string;
  name: string;
  level: number;
  avatar: AvatarConfig;
}

export interface DuelAnswerOptionView {
  id: string;
  text: string;
}

export interface DuelQuestionView {
  index: number;
  text: string;
  answers: DuelAnswerOptionView[];
  myAnswerId: string | null;
  myResult: ResultMark;
  /** Only once the viewer answered this question too (or the duel is over). */
  opponentAnswerId: string | null;
  opponentResult: ResultMark;
  /** Only once the viewer answered this question (or the duel is over). */
  correctAnswerId: string | null;
  explanation: string | null;
  bibleReference: string | null;
  xpEarned: number;
}

export interface DuelRoundView {
  index: number;
  number: number;
  topic: string;
  topicKind: string;
  starter: 'me' | 'opponent';
  myResults: ResultMark[];
  opponentResults: ResultMark[];
  myScore: number;
  /** Counts only answers the viewer may see. */
  opponentScore: number;
  questionsVisible: boolean;
  /** Empty when the round is not visible yet, and always in list responses. */
  questions: DuelQuestionView[];
}

export type DuelTurnView = 'me' | 'opponent' | 'matching' | 'none';
export type DuelOutcome = 'won' | 'lost' | 'tie' | null;

export interface DuelView {
  id: string;
  mode: DuelMode;
  status: DuelStatus;
  endReason: DuelEndReason | null;
  isChallenger: boolean;
  me: DuelPlayerView;
  opponent: DuelPlayerView | null;
  myScore: number;
  opponentScore: number;
  turn: DuelTurnView;
  /** 1-based round of the current move; the last round once finished. */
  currentRound: number;
  totalRounds: number;
  questionsPerRound: number;
  /** The question to play next, when it is the viewer's turn. */
  nextQuestionIndex: number | null;
  outcome: DuelOutcome;
  canDecline: boolean;
  canForfeit: boolean;
  inviteUrl: string | null;
  inviteToken: string | null;
  xpEarned: number;
  rounds: DuelRoundView[];
  createdAt: string;
  updatedAt: string;
  lastMoveAt: string;
  turnDeadline: string | null;
  finishedAt: string | null;
}

export interface DuelListView {
  myTurn: DuelView[];
  waiting: DuelView[];
  finished: DuelView[];
  record: { wins: number; losses: number; ties: number };
  turnCount: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toObjectId(value: string): mongoose.Types.ObjectId | null {
  return mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === value
    ? new mongoose.Types.ObjectId(value)
    : null;
}

function idOf(value: unknown): string | null {
  return value == null ? null : String(value);
}

function sideOf(duel: IDuel, viewerId: string): Side | null {
  if (idOf(duel.challengerId) === viewerId) return 'challenger';
  if (idOf(duel.opponentId) === viewerId) return 'opponent';
  return null;
}

function answersOf(duel: IDuel, side: Side): IDuelAnswer[] {
  return side === 'challenger' ? duel.challengerAnswers : duel.opponentAnswers;
}

function deadlineFrom(now: Date): Date {
  return new Date(now.getTime() + DUEL_TURN_TIMEOUT_MS);
}

/** `runningKey` of a friend duel: the same for both directions. */
function pairKey(a: mongoose.Types.ObjectId, b: mongoose.Types.ObjectId): string {
  return `pair:${[String(a), String(b)].sort().join(':')}`;
}

/** `runningKey` of a random search that is still waiting for an opponent. */
function searchKey(challenger: mongoose.Types.ObjectId): string {
  return `random:${String(challenger)}`;
}

function isDuplicateRunningKey(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { code, keyPattern } = error as { code?: unknown; keyPattern?: Record<string, unknown> };
  return code === 11000 && !!keyPattern && 'runningKey' in keyPattern;
}

/**
 * Runs a load-change-save again when another request saved the same duel in
 * between. Every attempt reloads the duel, so the retry sees what the other
 * request did: a double tap finds its own answer already recorded, a second
 * joiner finds the seat taken. Without this both surfaced as a 409.
 */
async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= attempts || !isVersionConflict(error)) throw error;
    }
  }
}

function finish(
  duel: IDuel,
  reason: DuelEndReason,
  winnerId: mongoose.Types.ObjectId | null,
  now: Date,
): void {
  duel.status = 'finished';
  duel.endReason = reason;
  duel.winnerId = winnerId;
  duel.finishedAt = now;
  duel.turnUserId = null;
  duel.turnSide = null;
  // $unset, so the pair (or the searcher) can start a new one.
  duel.runningKey = undefined;
}

/** Recomputes scores and whose move it is; finishes the duel when all is played. */
function refreshTurn(duel: IDuel, now: Date): void {
  duel.challengerScore = scoreOf(duel.challengerAnswers);
  duel.opponentScore = scoreOf(duel.opponentAnswers);

  const turn = currentTurn(
    duel.challengerAnswers,
    duel.opponentAnswers,
    duel.rounds.length || DUEL_ROUNDS,
  );
  duel.turnSlot = turn.slot;

  if (turn.side === null) {
    const winner =
      duel.challengerScore === duel.opponentScore
        ? null
        : duel.challengerScore > duel.opponentScore
          ? duel.challengerId
          : duel.opponentId;
    finish(duel, 'completed', winner, now);
    return;
  }

  duel.turnSide = turn.side;
  duel.turnUserId = turn.side === 'challenger' ? duel.challengerId : duel.opponentId ?? null;
}

/**
 * Settles a duel nobody moved in for a week. Returns true when it changed.
 *
 * A player who never made a single move in this duel did not really lose it -
 * they never accepted - so that ends without a winner. Somebody who stopped
 * halfway loses to the player left waiting.
 */
function settleIfExpired(duel: IDuel, now: Date): boolean {
  if (duel.status === 'finished') return false;
  if (!duel.turnDeadline || duel.turnDeadline.getTime() > now.getTime()) return false;

  if (!duel.opponentId || !duel.turnSide) {
    finish(duel, 'expired', null, now);
    return true;
  }

  const stalled = duel.turnSide;
  if (answersOf(duel, stalled).length === 0) {
    finish(duel, 'expired', null, now);
    return true;
  }

  const loser = stalled === 'challenger' ? duel.challengerId : duel.opponentId;
  const winner = stalled === 'challenger' ? duel.opponentId : duel.challengerId;
  finish(duel, 'timeout', winner, now);
  duel.forfeitedBy = loser;
  return true;
}

async function saveSettled(duels: IDuel[], now: Date): Promise<void> {
  await Promise.all(
    duels.map(async (duel) => {
      if (!settleIfExpired(duel, now)) return;
      try {
        await duel.save();
      } catch {
        // Somebody moved at the same moment; the next read settles it.
      }
    }),
  );
}

async function loadPlayers(ids: Array<string | null>): Promise<Map<string, DuelPlayerView>> {
  const unique = Array.from(new Set(ids.filter((id): id is string => !!id)));
  if (unique.length === 0) return new Map();

  const users = await User.find({ _id: { $in: unique } })
    .select('name xp avatar')
    .lean();

  return new Map(
    users.map((user) => {
      const id = String(user._id);
      return [
        id,
        {
          id,
          name: user.name?.trim() || 'Speler',
          level: getLevelInfo(user.xp ?? 0).level,
          avatar: resolveAvatar(user.avatar, id),
        },
      ];
    }),
  );
}

function placeholderPlayer(id: string): DuelPlayerView {
  return { id, name: 'Speler', level: 1, avatar: resolveAvatar(undefined, id) };
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

export function serializeDuel(
  duel: IDuel,
  viewerId: string,
  players: Map<string, DuelPlayerView>,
  options: { includeQuestions: boolean },
): DuelView {
  const mySide = sideOf(duel, viewerId) ?? 'challenger';
  const theirSide: Side = mySide === 'challenger' ? 'opponent' : 'challenger';
  const myAnswers = answersOf(duel, mySide);
  const theirAnswers = answersOf(duel, theirSide);
  const finished = duel.status === 'finished';
  const totalRounds = duel.rounds.length || DUEL_ROUNDS;
  const turn = currentTurn(duel.challengerAnswers, duel.opponentAnswers, totalRounds);

  const opponentId = mySide === 'challenger' ? idOf(duel.opponentId) : idOf(duel.challengerId);

  const rounds: DuelRoundView[] = duel.rounds.map((round, roundIndex) => {
    const questionCount = round.questions.length || DUEL_QUESTIONS_PER_ROUND;
    const isMyCurrentRound = !finished && turn.side === mySide && turn.round === roundIndex;
    const questionsVisible =
      finished || answersInRound(myAnswers, roundIndex).length > 0 || isMyCurrentRound;

    const myResults: ResultMark[] = [];
    const opponentResults: ResultMark[] = [];
    let myScore = 0;
    let opponentScore = 0;

    for (let question = 0; question < questionCount; question += 1) {
      const mine = myAnswers.find((a) => a.round === roundIndex && a.question === question);
      const theirs = theirAnswers.find((a) => a.round === roundIndex && a.question === question);
      const own = ownMark(mine);
      const other = opponentMark({ viewerAnswered: !!mine, opponentAnswer: theirs, finished });
      myResults.push(own);
      opponentResults.push(other);
      if (own === 'correct') myScore += 1;
      if (other === 'correct') opponentScore += 1;
    }

    const questions: DuelQuestionView[] =
      options.includeQuestions && questionsVisible
        ? round.questions.map((question, questionIndex) => {
            const mine = myAnswers.find(
              (a) => a.round === roundIndex && a.question === questionIndex,
            );
            const theirs = theirAnswers.find(
              (a) => a.round === roundIndex && a.question === questionIndex,
            );
            const revealed = !!mine || finished;
            const correct = question.answers.find((answer) => answer.isCorrect);

            return {
              index: questionIndex,
              text: question.text,
              answers: question.answers.map((answer) => ({ id: answer.answerId, text: answer.text })),
              myAnswerId: mine?.answerId ?? null,
              myResult: ownMark(mine),
              opponentAnswerId: revealed && theirs ? theirs.answerId : null,
              opponentResult: opponentMark({
                viewerAnswered: !!mine,
                opponentAnswer: theirs,
                finished,
              }),
              correctAnswerId: revealed ? correct?.answerId ?? null : null,
              explanation: revealed ? question.explanation ?? null : null,
              bibleReference: revealed ? question.bibleReference ?? null : null,
              xpEarned: mine?.xp ?? 0,
            };
          })
        : [];

    return {
      index: roundIndex,
      number: roundIndex + 1,
      topic: round.topic,
      topicKind: round.topicKind,
      starter: roundStarter(roundIndex) === mySide ? 'me' : 'opponent',
      myResults,
      opponentResults,
      myScore,
      opponentScore,
      questionsVisible,
      questions,
    };
  });

  let turnView: DuelTurnView = 'none';
  if (!finished && turn.side) {
    if (turn.side === mySide) turnView = 'me';
    else turnView = opponentId ? 'opponent' : 'matching';
  }

  let outcome: DuelOutcome = null;
  if (finished) {
    const winner = idOf(duel.winnerId);
    if (winner) outcome = winner === viewerId ? 'won' : 'lost';
    else if (duel.endReason === 'completed') outcome = 'tie';
  }

  const isChallenger = mySide === 'challenger';
  // Only the sender sees the link, and only while the seat is still empty.
  const ownOpenInvite =
    isChallenger && duel.mode === 'invite' && duel.inviteToken && !duel.opponentId && !finished
      ? duel.inviteToken
      : null;
  const canDecline = !finished && !isChallenger && duel.opponentAnswers.length === 0;

  return {
    id: String(duel._id),
    mode: duel.mode,
    status: duel.status,
    endReason: duel.endReason ?? null,
    isChallenger,
    me: players.get(viewerId) ?? placeholderPlayer(viewerId),
    opponent: opponentId ? players.get(opponentId) ?? placeholderPlayer(opponentId) : null,
    myScore: rounds.reduce((sum, round) => sum + round.myScore, 0),
    opponentScore: rounds.reduce((sum, round) => sum + round.opponentScore, 0),
    turn: turnView,
    currentRound: Math.min(turn.round, totalRounds - 1) + 1,
    totalRounds,
    questionsPerRound: DUEL_QUESTIONS_PER_ROUND,
    nextQuestionIndex: turnView === 'me' ? nextQuestionIndex(myAnswers, turn.round) : null,
    outcome,
    canDecline,
    canForfeit: !finished && !canDecline,
    inviteUrl: ownOpenInvite ? buildDuelInviteUrl(ownOpenInvite) : null,
    inviteToken: ownOpenInvite,
    xpEarned: isChallenger ? duel.challengerXp : duel.opponentXp,
    rounds,
    createdAt: new Date(duel.createdAt).toISOString(),
    updatedAt: new Date(duel.updatedAt).toISOString(),
    lastMoveAt: new Date(duel.lastMoveAt).toISOString(),
    turnDeadline: !finished && duel.turnDeadline ? new Date(duel.turnDeadline).toISOString() : null,
    finishedAt: duel.finishedAt ? new Date(duel.finishedAt).toISOString() : null,
  };
}

async function viewOf(duel: IDuel, viewerId: string): Promise<DuelView> {
  const players = await loadPlayers([viewerId, idOf(duel.challengerId), idOf(duel.opponentId)]);
  return serializeDuel(duel, viewerId, players, { includeQuestions: true });
}

// ---------------------------------------------------------------------------
// Guards and limits
// ---------------------------------------------------------------------------

async function loadOwnDuel(viewerId: string, duelId: string): Promise<IDuel> {
  const objectId = toObjectId(duelId);
  if (!objectId) throw duelNotFound();
  const duel = await Duel.findById(objectId);
  // Somebody else's duel answers exactly like a missing one.
  if (!duel || !sideOf(duel, viewerId)) throw duelNotFound();
  return duel;
}

const CREATIONS_PER_HOUR = 30;
const creationLog = new Map<string, number[]>();

/**
 * In-memory, like the room limit in `lib/multiplayer/rate-limit.ts`: it only
 * has to stop a loop, and a restart forgiving everybody is acceptable.
 */
function assertCreationAllowed(userId: string): void {
  const now = Date.now();
  const recent = (creationLog.get(userId) ?? []).filter((at) => now - at < 60 * 60 * 1000);
  if (recent.length >= CREATIONS_PER_HOUR) {
    throw new DuelError(
      'RATE_LIMITED',
      'Je hebt in korte tijd veel duels gemaakt. Probeer het over een uurtje opnieuw.',
      429,
    );
  }
  recent.push(now);
  creationLog.set(userId, recent);
  if (creationLog.size > 1000) {
    for (const [key, times] of creationLog) {
      if (times.every((at) => now - at >= 60 * 60 * 1000)) creationLog.delete(key);
    }
  }
}

/**
 * Both limits skip duels past their deadline: those are over, they just have
 * not been read (and settled) yet.
 */
async function assertActiveLimit(
  userId: mongoose.Types.ObjectId,
  whose: 'mine' | 'opponent' = 'mine',
): Promise<void> {
  const active = await Duel.countDocuments({
    participants: userId,
    status: { $in: ['open', 'active'] },
    turnDeadline: { $gt: new Date() },
  });
  if (active >= MAX_ACTIVE_DUELS_PER_USER) {
    throw new DuelError(
      'TOO_MANY_DUELS',
      whose === 'mine'
        ? `Je hebt al ${MAX_ACTIVE_DUELS_PER_USER} lopende duels. Speel er eerst een paar uit.`
        : 'Deze speler heeft al heel veel lopende duels. Probeer het later opnieuw.',
      429,
    );
  }
}

async function assertOpenLimit(userId: mongoose.Types.ObjectId): Promise<void> {
  const open = await Duel.countDocuments({
    challengerId: userId,
    status: 'open',
    opponentId: null,
    turnDeadline: { $gt: new Date() },
  });
  if (open >= MAX_OPEN_DUELS_PER_USER) {
    throw new DuelError(
      'TOO_MANY_OPEN_DUELS',
      'Je hebt al een paar duels klaarstaan die op een tegenstander wachten.',
      429,
    );
  }
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function listDuels(viewerId: string): Promise<DuelListView> {
  const me = toObjectId(viewerId);
  if (!me) throw new DuelError('UNAUTHORIZED', 'Niet geautoriseerd', 401);
  await connectDB();

  const now = new Date();
  const running = await Duel.find({ participants: me, status: { $in: ['open', 'active'] } })
    .sort({ updatedAt: -1 })
    .limit(MAX_ACTIVE_DUELS_PER_USER + 10);
  await saveSettled(running, now);

  const [finished, wins, losses, ties] = await Promise.all([
    Duel.find({ participants: me, status: 'finished', opponentId: { $ne: null } })
      .sort({ finishedAt: -1 })
      .limit(FINISHED_DUELS_LISTED),
    Duel.countDocuments({ participants: me, status: 'finished', winnerId: me }),
    Duel.countDocuments({
      participants: me,
      status: 'finished',
      winnerId: { $nin: [null, me] },
    }),
    Duel.countDocuments({
      participants: me,
      status: 'finished',
      endReason: 'completed',
      winnerId: null,
    }),
  ]);

  const stillRunning = running.filter((duel) => duel.status !== 'finished');
  const all = [...stillRunning, ...finished];
  const players = await loadPlayers(
    all.flatMap((duel) => [idOf(duel.challengerId), idOf(duel.opponentId)]).concat(viewerId),
  );

  const views = stillRunning.map((duel) =>
    serializeDuel(duel, viewerId, players, { includeQuestions: false }),
  );
  const myTurn = views.filter((view) => view.turn === 'me');
  const waiting = views.filter((view) => view.turn !== 'me');

  return {
    myTurn,
    waiting,
    finished: finished.map((duel) =>
      serializeDuel(duel, viewerId, players, { includeQuestions: false }),
    ),
    record: { wins, losses, ties },
    turnCount: myTurn.length,
  };
}

export async function getDuel(viewerId: string, duelId: string): Promise<DuelView> {
  await connectDB();
  return withRetry(async () => {
    const duel = await loadOwnDuel(viewerId, duelId);
    const now = new Date();
    if (settleIfExpired(duel, now)) {
      await duel.save();
    }
    return viewOf(duel, viewerId);
  });
}

export interface InvitePreview {
  challenger: DuelPlayerView;
  joinable: boolean;
  status: DuelStatus;
}

/** What the `/duel/<token>` page and the app show before joining. */
export async function getInvitePreview(rawToken: string): Promise<InvitePreview> {
  const token = normalizeInviteToken(rawToken);
  if (!token) throw new DuelError('INVITE_NOT_FOUND', 'Deze uitnodiging bestaat niet.', 404);
  await connectDB();

  const duel = await withRetry(async () => {
    const found = await Duel.findOne({ inviteToken: token });
    if (!found) throw new DuelError('INVITE_NOT_FOUND', 'Deze uitnodiging bestaat niet.', 404);
    if (settleIfExpired(found, new Date())) {
      await found.save();
    }
    return found;
  });

  const challengerId = String(duel.challengerId);
  const players = await loadPlayers([challengerId]);
  return {
    challenger: players.get(challengerId) ?? placeholderPlayer(challengerId),
    joinable: duel.status === 'open' && !duel.opponentId,
    status: duel.status,
  };
}

export interface DuelPlayerListItem extends DuelPlayerView {
  source: 'group' | 'duel' | 'search';
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Who to challenge.
 *
 * There is no friends list in this product. The closest thing is the people
 * you already played with - your saved player groups and earlier duel
 * opponents - so that is the list; `q` searches every account by name.
 */
export async function listDuelPlayers(
  viewerId: string,
  rawQuery: string | null,
): Promise<{ players: DuelPlayerListItem[]; query: string | null }> {
  const me = toObjectId(viewerId);
  if (!me) throw new DuelError('UNAUTHORIZED', 'Niet geautoriseerd', 401);
  await connectDB();

  const query = rawQuery?.replace(/\s+/g, ' ').trim().slice(0, 40) ?? '';

  if (query.length > 0) {
    if (query.length < 2) return { players: [], query };
    const users = await User.find({ _id: { $ne: me }, name: new RegExp(escapeRegex(query), 'i') })
      .select('name xp avatar')
      .sort({ xp: -1 })
      .limit(20)
      .lean();

    return {
      query,
      players: users.map((user) => {
        const id = String(user._id);
        return {
          id,
          name: user.name?.trim() || 'Speler',
          level: getLevelInfo(user.xp ?? 0).level,
          avatar: resolveAvatar(user.avatar, id),
          source: 'search' as const,
        };
      }),
    };
  }

  const [groups, duels] = await Promise.all([
    PlayerGroup.find({ memberIds: me }).select('memberIds updatedAt').lean(),
    Duel.find({ participants: me, opponentId: { $ne: null } })
      .select('challengerId opponentId updatedAt')
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean(),
  ]);

  const seen = new Map<string, { source: 'group' | 'duel'; at: number }>();
  for (const duel of duels) {
    const other =
      String(duel.challengerId) === viewerId ? idOf(duel.opponentId) : idOf(duel.challengerId);
    if (!other || other === viewerId || seen.has(other)) continue;
    seen.set(other, { source: 'duel', at: new Date(duel.updatedAt).getTime() });
  }
  for (const group of groups) {
    for (const member of group.memberIds) {
      const id = String(member);
      if (id === viewerId || seen.has(id)) continue;
      seen.set(id, { source: 'group', at: new Date(group.updatedAt).getTime() });
    }
  }

  const ordered = Array.from(seen.entries())
    .sort((a, b) => b[1].at - a[1].at)
    .slice(0, 30);
  const players = await loadPlayers(ordered.map(([id]) => id));

  return {
    query: null,
    players: ordered
      .map(([id, meta]): DuelPlayerListItem | null => {
        const player = players.get(id);
        return player ? { ...player, source: meta.source } : null;
      })
      .filter((player): player is DuelPlayerListItem => player !== null),
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export type CreateDuelInput =
  | { mode: 'friend'; opponentId?: string; opponentName?: string }
  | { mode: 'random' }
  | { mode: 'invite' };

export interface CreateDuelResult {
  duel: DuelView;
  /** False when an existing duel was returned instead of a new one. */
  created: boolean;
  /** Random only: true when this request joined somebody's open duel. */
  matched: boolean;
  inviteUrl: string | null;
  /** Invite only: the token, so a client can build the link on its own domain. */
  inviteToken: string | null;
  inviteMessage: string | null;
}

async function resolveOpponent(
  input: { opponentId?: string; opponentName?: string },
): Promise<mongoose.Types.ObjectId> {
  if (input.opponentId) {
    const id = toObjectId(input.opponentId);
    const exists = id ? await User.exists({ _id: id }) : null;
    if (!id || !exists) {
      throw new DuelError('PLAYER_NOT_FOUND', 'Deze speler bestaat niet (meer).', 404);
    }
    return id;
  }

  const name = input.opponentName?.replace(/\s+/g, ' ').trim() ?? '';
  if (!name) throw duelValidationError('Kies wie je wilt uitdagen.');

  const matches = await User.find({ name: new RegExp(`^${escapeRegex(name)}$`, 'i') })
    .select('_id')
    .limit(2)
    .lean();
  if (matches.length === 0) {
    throw new DuelError('PLAYER_NOT_FOUND', `Er is geen speler die "${name}" heet.`, 404);
  }
  if (matches.length > 1) {
    throw new DuelError(
      'AMBIGUOUS_PLAYER',
      `Er zijn meerdere spelers die "${name}" heten. Kies er een uit de lijst.`,
      409,
    );
  }
  return matches[0]._id as mongoose.Types.ObjectId;
}

function newDuelFields(
  mode: DuelMode,
  challenger: mongoose.Types.ObjectId,
  now: Date,
): Record<string, unknown> {
  return {
    mode,
    challengerId: challenger,
    challengerAnswers: [],
    opponentAnswers: [],
    turnSlot: 0,
    turnSide: 'challenger',
    turnUserId: challenger,
    lastMoveAt: now,
    turnDeadline: deadlineFrom(now),
  };
}

function existingResult(view: DuelView, matched = false): CreateDuelResult {
  return { duel: view, created: false, matched, inviteUrl: null, inviteToken: null, inviteMessage: null };
}

export async function createDuel(viewerId: string, input: CreateDuelInput): Promise<CreateDuelResult> {
  const me = toObjectId(viewerId);
  if (!me) throw new DuelError('UNAUTHORIZED', 'Niet geautoriseerd', 401);
  await connectDB();
  // A retry only happens when settling an expired duel lost a race, which is
  // before anything is created or counted against the hourly limit.
  return withRetry(() => createDuelOnce(me, viewerId, input));
}

async function createDuelOnce(
  me: mongoose.Types.ObjectId,
  viewerId: string,
  input: CreateDuelInput,
): Promise<CreateDuelResult> {
  const now = new Date();

  if (input.mode === 'friend') {
    const opponent = await resolveOpponent(input);
    if (opponent.equals(me)) {
      throw new DuelError('CANNOT_CHALLENGE_SELF', 'Je kunt jezelf niet uitdagen.', 400);
    }

    // One running duel per pair: a second challenge opens the first.
    const existing = await Duel.findOne({
      status: { $in: ['open', 'active'] },
      participants: { $all: [me, opponent] },
    });
    if (existing && !settleIfExpired(existing, now)) {
      return existingResult(await viewOf(existing, viewerId));
    }
    if (existing) await existing.save();

    await assertActiveLimit(me);
    // The limit is per player, so it holds for the one being challenged too.
    await assertActiveLimit(opponent, 'opponent');
    assertCreationAllowed(viewerId);
    const rounds = await pickDuelRounds();

    const key = pairKey(me, opponent);
    try {
      const duel = await Duel.create({
        ...newDuelFields('friend', me, now),
        status: 'active',
        opponentId: opponent,
        participants: [me, opponent],
        runningKey: key,
        rounds,
      });
      return { duel: await viewOf(duel, viewerId), created: true, matched: false, inviteUrl: null, inviteToken: null, inviteMessage: null };
    } catch (error) {
      // The same challenge (or the reverse one) was made a moment earlier.
      if (!isDuplicateRunningKey(error)) throw error;
      const running = await Duel.findOne({ runningKey: key });
      if (!running) throw error;
      return existingResult(await viewOf(running, viewerId));
    }
  }

  if (input.mode === 'random') {
    // Already looking for somebody: hand back that duel rather than a second.
    const mine = await Duel.findOne({
      challengerId: me,
      mode: 'random',
      status: 'open',
      opponentId: null,
    });
    if (mine && !settleIfExpired(mine, now)) {
      return existingResult(await viewOf(mine, viewerId));
    }
    if (mine) await mine.save();

    await assertActiveLimit(me);

    // Nobody to be matched with twice at once.
    const runningWith = (await Duel.distinct('participants', {
      participants: me,
      status: { $in: ['open', 'active'] },
    })) as mongoose.Types.ObjectId[];
    const excluded = [me, ...runningWith];

    // Prefer duels whose starter already played round 1: the joiner can play
    // straight away instead of waiting for both.
    const candidates = await Duel.find({
      mode: 'random',
      status: 'open',
      opponentId: null,
      challengerId: { $nin: excluded },
      turnDeadline: { $gt: now },
    })
      .sort({ turnSlot: -1, createdAt: 1 })
      .limit(5);

    for (const candidate of candidates) {
      candidate.opponentId = me;
      candidate.participants = [candidate.challengerId, me];
      candidate.status = 'active';
      candidate.turnDeadline = deadlineFrom(now);
      // No longer a search: its starter may look for the next opponent.
      candidate.runningKey = undefined;
      refreshTurn(candidate, now);
      try {
        await candidate.save();
        return existingResult(await viewOf(candidate, viewerId), true);
      } catch (error) {
        // Somebody else took this seat a moment earlier; try the next one.
        if (!isVersionConflict(error)) throw error;
      }
    }

    await assertOpenLimit(me);
    assertCreationAllowed(viewerId);
    const rounds = await pickDuelRounds();
    const key = searchKey(me);
    try {
      const duel = await Duel.create({
        ...newDuelFields('random', me, now),
        status: 'open',
        opponentId: null,
        participants: [me],
        runningKey: key,
        rounds,
      });
      return { duel: await viewOf(duel, viewerId), created: true, matched: false, inviteUrl: null, inviteToken: null, inviteMessage: null };
    } catch (error) {
      // A second tap on "zoek een tegenstander" got here first.
      if (!isDuplicateRunningKey(error)) throw error;
      const searching = await Duel.findOne({ runningKey: key });
      if (!searching) throw error;
      return existingResult(await viewOf(searching, viewerId));
    }
  }

  // Invite link.
  await assertActiveLimit(me);
  await assertOpenLimit(me);
  assertCreationAllowed(viewerId);
  const rounds = await pickDuelRounds();
  const token = createInviteToken();
  const duel = await Duel.create({
    ...newDuelFields('invite', me, now),
    status: 'open',
    opponentId: null,
    participants: [me],
    inviteToken: token,
    rounds,
  });
  const view = await viewOf(duel, viewerId);
  return {
    duel: view,
    created: true,
    matched: false,
    inviteUrl: buildDuelInviteUrl(token),
    inviteToken: token,
    inviteMessage: buildDuelInviteMessage(token, view.me.name),
  };
}

/**
 * Takes the empty seat of an invite duel.
 *
 * Free for whoever holds the link: there is no premium check anywhere in the
 * duel flow, so an invited friend never meets a paywall.
 */
export async function joinDuelByInvite(viewerId: string, rawToken: string): Promise<{ duel: DuelView; joined: boolean }> {
  const me = toObjectId(viewerId);
  if (!me) throw new DuelError('UNAUTHORIZED', 'Niet geautoriseerd', 401);
  const token = normalizeInviteToken(rawToken);
  if (!token) throw new DuelError('INVITE_NOT_FOUND', 'Deze uitnodiging bestaat niet.', 404);
  await connectDB();

  // Two people opening the link at once: the retry tells the slower one the
  // seat is taken (or, for a double tap, that they already joined).
  return withRetry(async () => {
    const duel = await Duel.findOne({ inviteToken: token });
    if (!duel) throw new DuelError('INVITE_NOT_FOUND', 'Deze uitnodiging bestaat niet.', 404);

    if (duel.challengerId.equals(me)) {
      throw new DuelError(
        'OWN_INVITE',
        'Dit is je eigen uitnodiging. Stuur de link naar iemand anders.',
        409,
      );
    }
    if (duel.opponentId?.equals(me)) {
      return { duel: await viewOf(duel, viewerId), joined: false };
    }
    if (duel.opponentId) {
      throw new DuelError('DUEL_TAKEN', 'Iemand anders speelt dit duel al.', 409);
    }

    const now = new Date();
    if (settleIfExpired(duel, now)) {
      await duel.save();
    }
    if (duel.status === 'finished') {
      throw new DuelError('DUEL_FINISHED', 'Deze uitnodiging is verlopen of geannuleerd.', 410);
    }

    await assertActiveLimit(me);

    duel.opponentId = me;
    duel.participants = [duel.challengerId, me];
    duel.status = 'active';
    duel.turnDeadline = deadlineFrom(now);
    refreshTurn(duel, now);
    await duel.save();

    return { duel: await viewOf(duel, viewerId), joined: true };
  });
}

export interface SubmitAnswerInput {
  roundIndex: number;
  questionIndex: number;
  answerId: string;
}

export interface SubmitAnswerResult {
  result: DuelQuestionView & {
    roundIndex: number;
    questionIndex: number;
    isCorrect: boolean;
    roundComplete: boolean;
    alreadyRecorded: boolean;
  };
  duel: DuelView;
}

/**
 * XP and the streak, the way a solo quiz awards them: XP lands on the account
 * (with level and title recomputed) and a finished round counts as playing
 * today. No `UserProgress` row is written - that collection is per quiz, and
 * a duel round would skew "quizzes played" and the average score.
 */
async function awardDuelProgress(
  userId: string,
  xp: number,
  roundDone: boolean,
  now: Date,
): Promise<void> {
  if (xp <= 0 && !roundDone) return;

  const user = await User.findById(userId).select('xp streak bestStreak lastPlayedAt').lean();
  if (!user) return;

  const set: Record<string, unknown> = {};
  const levelInfo = getLevelInfo((user.xp ?? 0) + Math.max(0, xp));
  set.level = levelInfo.level;
  set.levelTitle = levelInfo.title;

  if (roundDone) {
    const previous = user.lastPlayedAt ? new Date(user.lastPlayedAt) : null;
    const { nextStreak } = calculateNextStreak(previous, user.streak ?? 0, now);
    set.lastPlayedAt = now;
    set.streak = nextStreak;
    set.bestStreak = Math.max(user.bestStreak ?? 0, nextStreak);
  }

  await User.updateOne(
    { _id: userId },
    xp > 0 ? { $inc: { xp }, $set: set } : { $set: set },
  );
}

function answerResult(
  view: DuelView,
  roundIndex: number,
  questionIndex: number,
  alreadyRecorded: boolean,
): SubmitAnswerResult {
  const round = view.rounds[roundIndex];
  const question = round?.questions[questionIndex];
  if (!question) throw duelValidationError('Onbekende vraag.');

  return {
    result: {
      ...question,
      roundIndex,
      questionIndex,
      isCorrect: question.myResult === 'correct',
      roundComplete: round.myResults.every((mark) => mark === 'correct' || mark === 'wrong'),
      alreadyRecorded,
    },
    duel: view,
  };
}

export async function submitDuelAnswer(
  viewerId: string,
  duelId: string,
  input: SubmitAnswerInput,
): Promise<SubmitAnswerResult> {
  await connectDB();
  // A double tap that arrives while the first one is still saving loses the
  // race; its retry then finds the answer recorded and returns it as such.
  return withRetry(async () => {
    const duel = await loadOwnDuel(viewerId, duelId);
    const side = sideOf(duel, viewerId) as Side;
    const now = new Date();

    const myAnswers = answersOf(duel, side);
    const { roundIndex, questionIndex, answerId } = input;

    // A double tap on a slow connection: same answer again is not an error.
    const existing = myAnswers.find((a) => a.round === roundIndex && a.question === questionIndex);
    if (existing) {
      if (existing.answerId === answerId) {
        return answerResult(await viewOf(duel, viewerId), roundIndex, questionIndex, true);
      }
      throw new DuelError('ANSWER_ALREADY_SUBMITTED', 'Deze vraag heb je al beantwoord.', 409);
    }

    if (settleIfExpired(duel, now)) {
      await duel.save();
    }
    if (duel.status === 'finished') {
      throw new DuelError('DUEL_FINISHED', 'Dit duel is al afgelopen.', 409);
    }

    const turn = currentTurn(duel.challengerAnswers, duel.opponentAnswers, duel.rounds.length || DUEL_ROUNDS);
    if (turn.side !== side) {
      throw new DuelError('NOT_YOUR_TURN', 'Je tegenstander is nu aan de beurt.', 409);
    }

    const round = duel.rounds[roundIndex];
    const questionCount = round?.questions.length ?? DUEL_QUESTIONS_PER_ROUND;
    if (turn.round !== roundIndex || nextQuestionIndex(myAnswers, roundIndex, questionCount) !== questionIndex) {
      throw new DuelError(
        'QUESTION_MISMATCH',
        'Deze vraag is nu niet aan de beurt. Ververs het duel.',
        409,
      );
    }

    const question = round?.questions[questionIndex];
    const choice = question?.answers.find((answer) => answer.answerId === answerId);
    if (!question || !choice) throw duelValidationError('Onbekend antwoord.');

    const correct = choice.isCorrect === true;
    const xp = correct ? Math.max(0, question.xp ?? 0) : 0;
    myAnswers.push({ round: roundIndex, question: questionIndex, answerId, correct, xp, answeredAt: now });
    if (side === 'challenger') duel.challengerXp += xp;
    else duel.opponentXp += xp;

    const roundDone = isRoundDone(myAnswers, roundIndex, questionCount);
    duel.lastMoveAt = now;
    duel.turnDeadline = deadlineFrom(now);
    refreshTurn(duel, now);
    await duel.save();

    // Only after the save: a write that lost the race must not pay out.
    await awardDuelProgress(viewerId, xp, roundDone, now);

    return answerResult(await viewOf(duel, viewerId), roundIndex, questionIndex, false);
  });
}

/** The challenged player says no before playing anything. No winner. */
export async function declineDuel(viewerId: string, duelId: string): Promise<DuelView> {
  await connectDB();
  return withRetry(async () => {
    const duel = await loadOwnDuel(viewerId, duelId);
    const now = new Date();

    if (settleIfExpired(duel, now)) await duel.save();
    if (duel.status === 'finished') {
      throw new DuelError('DUEL_FINISHED', 'Dit duel is al afgelopen.', 409);
    }
    if (sideOf(duel, viewerId) !== 'opponent' || duel.opponentAnswers.length > 0) {
      throw new DuelError(
        'NOT_ALLOWED',
        'Afwijzen kan alleen voordat je hebt gespeeld. Je kunt nog wel opgeven.',
        409,
      );
    }

    finish(duel, 'declined', null, now);
    await duel.save();
    return viewOf(duel, viewerId);
  });
}

/**
 * Gives up. The other player wins; a duel still waiting for a second player is
 * simply cancelled.
 */
export async function forfeitDuel(viewerId: string, duelId: string): Promise<DuelView> {
  await connectDB();
  return withRetry(async () => {
    const duel = await loadOwnDuel(viewerId, duelId);
    const now = new Date();

    if (settleIfExpired(duel, now)) await duel.save();
    if (duel.status === 'finished') {
      throw new DuelError('DUEL_FINISHED', 'Dit duel is al afgelopen.', 409);
    }

    if (!duel.opponentId) {
      finish(duel, 'cancelled', null, now);
    } else {
      const side = sideOf(duel, viewerId) as Side;
      const winner = side === 'challenger' ? duel.opponentId : duel.challengerId;
      finish(duel, 'forfeit', winner, now);
      duel.forfeitedBy = side === 'challenger' ? duel.challengerId : duel.opponentId;
    }

    await duel.save();
    return viewOf(duel, viewerId);
  });
}
