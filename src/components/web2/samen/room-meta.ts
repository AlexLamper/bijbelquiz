import mongoose from 'mongoose';
import { connectDB, Category, MultiplayerRoom, Quiz } from '@/database';

export interface RoomQuizMeta {
  /** "Nieuwe Testament", for the quiz card in the waiting room. */
  categoryTitle: string | null;
}

/**
 * The one thing about a room's quiz the room snapshot does not carry: its
 * category. Read once per page load on the server; the snapshot (title,
 * chapter, question count) still comes from the polling transport. Never
 * throws - a missing room or quiz just means no category line.
 */
export async function loadRoomQuizMeta(roomCode: string): Promise<RoomQuizMeta> {
  try {
    await connectDB();
    const room = (await MultiplayerRoom.findOne({ code: roomCode.trim().toUpperCase() })
      .select('quizId')
      .lean()) as { quizId?: string } | null;
    if (!room?.quizId || !mongoose.Types.ObjectId.isValid(room.quizId)) return { categoryTitle: null };

    const quiz = (await Quiz.findById(room.quizId).select('categoryId').lean()) as { categoryId?: unknown } | null;
    if (!quiz?.categoryId) return { categoryTitle: null };

    const category = (await Category.findById(quiz.categoryId).select('title').lean()) as { title?: unknown } | null;
    return { categoryTitle: category?.title ? String(category.title) : null };
  } catch {
    return { categoryTitle: null };
  }
}
