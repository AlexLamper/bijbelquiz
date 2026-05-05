import { connectDB } from '@/database';
import MultiplayerRoom, {
  IMultiplayerRoom,
  IRoomPlayer,
  IRoomQuestion,
} from '@/database/models/MultiplayerRoom';
import type { PersistedRoom, PersistedRoomPlayer, RoomRepository } from './repository';
import { MultiplayerError } from './errors';
import type { ImmutableQuestion, RoomStatus } from './types';

const DUPLICATE_KEY_CODE = 11000;

function playerToPersisted(player: IRoomPlayer): PersistedRoomPlayer {
  return {
    id: player.id,
    name: player.name,
    score: player.score,
    correctAnswers: player.correctAnswers,
    isHost: player.isHost,
    isConnected: player.isConnected,
    hasAnswered: player.hasAnswered,
    lastSeenAtMs: player.lastSeenAt instanceof Date ? player.lastSeenAt.getTime() : Date.now(),
  };
}

function persistedToPlayer(player: PersistedRoomPlayer): Partial<IRoomPlayer> {
  return {
    id: player.id,
    name: player.name,
    score: player.score,
    correctAnswers: player.correctAnswers,
    isHost: player.isHost,
    isConnected: player.isConnected,
    hasAnswered: player.hasAnswered,
    lastSeenAt: new Date(player.lastSeenAtMs),
  };
}

function questionToPersisted(question: IRoomQuestion): ImmutableQuestion {
  return {
    id: question.id,
    text: question.text,
    bibleReference: question.bibleReference ?? '',
    correctAnswerId: question.correctAnswerId,
    answers: question.answers.map((answer) => ({ id: answer.id, text: answer.text })),
  };
}

function submittedAnswersToObject(value: unknown): Record<string, string> {
  if (!value) {
    return {};
  }

  if (value instanceof Map) {
    const out: Record<string, string> = {};
    value.forEach((answerId, userId) => {
      if (typeof userId === 'string' && typeof answerId === 'string') {
        out[userId] = answerId;
      }
    });
    return out;
  }

  if (typeof value === 'object' && value !== null) {
    const out: Record<string, string> = {};
    for (const [userId, answerId] of Object.entries(value as Record<string, unknown>)) {
      if (typeof answerId === 'string') {
        out[userId] = answerId;
      }
    }
    return out;
  }

  return {};
}

function docToPersisted(doc: IMultiplayerRoom): PersistedRoom {
  return {
    code: doc.code,
    id: String(doc._id),
    quizId: doc.quizId,
    quizTitle: doc.quizTitle,
    hostUserId: doc.hostUserId,
    maxPlayers: doc.maxPlayers,
    currentQuestionIndex: doc.currentQuestionIndex,
    totalQuestions: doc.totalQuestions,
    status: doc.status as RoomStatus,
    players: (doc.players ?? []).map(playerToPersisted),
    questions: (doc.questions ?? []).map(questionToPersisted),
    questionDeadlineAtMs: doc.questionDeadlineAt ? doc.questionDeadlineAt.getTime() : null,
    questionResultUntilAtMs: doc.questionResultUntilAt ? doc.questionResultUntilAt.getTime() : null,
    questionSequence: doc.questionSequence ?? 0,
    submittedAnswers: submittedAnswersToObject(doc.submittedAnswers),
    expiresAtMs: doc.expiresAt instanceof Date ? doc.expiresAt.getTime() : Date.now() + 86_400_000,
    revision: doc.revision ?? 0,
    createdAtMs: doc.createdAt instanceof Date ? doc.createdAt.getTime() : Date.now(),
    updatedAtMs: doc.updatedAt instanceof Date ? doc.updatedAt.getTime() : Date.now(),
  };
}

function persistedToDocFields(room: PersistedRoom): Partial<IMultiplayerRoom> {
  return {
    code: room.code,
    quizId: room.quizId,
    quizTitle: room.quizTitle,
    hostUserId: room.hostUserId,
    maxPlayers: room.maxPlayers,
    currentQuestionIndex: room.currentQuestionIndex,
    totalQuestions: room.totalQuestions,
    status: room.status,
    players: room.players.map((player) => persistedToPlayer(player) as IRoomPlayer),
    questions: room.questions.map((q) => ({
      id: q.id,
      text: q.text,
      bibleReference: q.bibleReference,
      correctAnswerId: q.correctAnswerId,
      answers: q.answers.map((a) => ({ id: a.id, text: a.text })),
    })) as IRoomQuestion[],
    questionDeadlineAt: room.questionDeadlineAtMs ? new Date(room.questionDeadlineAtMs) : null,
    questionResultUntilAt: room.questionResultUntilAtMs ? new Date(room.questionResultUntilAtMs) : null,
    questionSequence: room.questionSequence,
    submittedAnswers: new Map(Object.entries(room.submittedAnswers)),
    expiresAt: new Date(room.expiresAtMs),
  };
}

/**
 * MongoDB-backed implementation. Used in production (Vercel serverless).
 *
 * Concurrency: each `save()` increments `revision` atomically and matches the
 * expected revision in the update filter. If another instance updated the
 * room first, the filter doesn't match and we return false so the service can
 * retry with the latest state.
 */
export class MongoRoomRepository implements RoomRepository {
  async insert(room: PersistedRoom): Promise<void> {
    await connectDB();

    try {
      await MultiplayerRoom.create({
        ...persistedToDocFields(room),
        revision: 0,
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: number }).code === DUPLICATE_KEY_CODE
      ) {
        throw new MultiplayerError('ROOM_CODE_TAKEN', 'Room code already in use', 409);
      }
      throw error;
    }
  }

  async findByCode(code: string): Promise<PersistedRoom | null> {
    await connectDB();
    const doc = await MultiplayerRoom.findOne({ code: code.toUpperCase() });
    return doc ? docToPersisted(doc) : null;
  }

  async save(room: PersistedRoom, expectedRevision: number): Promise<boolean> {
    await connectDB();

    const fields = persistedToDocFields(room);
    const nextRevision = expectedRevision + 1;

    const result = await MultiplayerRoom.findOneAndUpdate(
      { code: room.code, revision: expectedRevision },
      {
        $set: {
          ...fields,
          revision: nextRevision,
        },
      },
      { new: true },
    );

    if (!result) {
      return false;
    }

    room.revision = nextRevision;
    return true;
  }

  async delete(code: string): Promise<void> {
    await connectDB();
    await MultiplayerRoom.deleteOne({ code: code.toUpperCase() });
  }

  async listAll() {
    await connectDB();
    const docs = await MultiplayerRoom.find({})
      .select('code _id status quizTitle hostUserId players updatedAt')
      .lean();

    return docs.map((d) => {
      const updatedAt = (d as { updatedAt?: Date }).updatedAt;
      return {
        code: d.code as string,
        id: String(d._id),
        status: d.status as RoomStatus,
        quizTitle: d.quizTitle as string,
        hostUserId: d.hostUserId as string,
        playerCount: Array.isArray(d.players) ? d.players.length : 0,
        updatedAtMs: updatedAt instanceof Date ? updatedAt.getTime() : Date.now(),
      };
    });
  }
}
