import { MultiplayerError } from './errors';
import type { PersistedRoom, RoomRepository } from './repository';
import type { RoomStatus } from './types';

/**
 * In-memory repository used by unit tests. NOT suitable for production -
 * each serverless instance would have its own copy. Use MongoRoomRepository
 * for any deployed code path.
 */
export class InMemoryRoomRepository implements RoomRepository {
  private readonly rooms = new Map<string, PersistedRoom>();

  async insert(room: PersistedRoom): Promise<void> {
    if (this.rooms.has(room.code)) {
      throw new MultiplayerError('ROOM_CODE_TAKEN', 'Room code already in use', 409);
    }
    this.rooms.set(room.code, this.deepClone(room));
  }

  async findByCode(code: string): Promise<PersistedRoom | null> {
    const room = this.rooms.get(code.toUpperCase());
    return room ? this.deepClone(room) : null;
  }

  async save(room: PersistedRoom, expectedRevision: number): Promise<boolean> {
    const existing = this.rooms.get(room.code);
    if (!existing) {
      return false;
    }

    if (existing.revision !== expectedRevision) {
      return false;
    }

    const next = this.deepClone(room);
    next.revision = expectedRevision + 1;
    next.updatedAtMs = Date.now();
    this.rooms.set(room.code, next);
    room.revision = next.revision;
    return true;
  }

  async delete(code: string): Promise<void> {
    this.rooms.delete(code.toUpperCase());
  }

  async listAll() {
    return Array.from(this.rooms.values()).map((r) => ({
      code: r.code,
      id: r.id,
      status: r.status as RoomStatus,
      quizTitle: r.quizTitle,
      hostUserId: r.hostUserId,
      playerCount: r.players.length,
      updatedAtMs: r.updatedAtMs,
    }));
  }

  private deepClone(room: PersistedRoom): PersistedRoom {
    return {
      ...room,
      players: room.players.map((p) => ({ ...p })),
      questions: room.questions.map((q) => ({
        ...q,
        answers: q.answers.map((a) => ({ ...a })),
      })),
      submittedAnswers: { ...room.submittedAnswers },
    };
  }
}
