import { connectDB, Quiz, User } from '@/database';
import { validationError } from './errors';
import {
  ImmutableAnswer,
  ImmutableQuestion,
  MultiplayerDataProvider,
  ProviderQuizSnapshot,
} from './types';

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  return value as Record<string, unknown>;
}

function toIdString(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (value && typeof value === 'object' && 'toString' in value) {
    const maybeToString = value.toString;
    if (typeof maybeToString === 'function') {
      const result = maybeToString.call(value);
      if (typeof result === 'string' && result.length > 0 && result !== '[object Object]') {
        return result;
      }
    }
  }

  return null;
}

function parseAnswers(questionRecord: Record<string, unknown>, questionIndex: number): ImmutableAnswer[] {
  const rawAnswers = questionRecord.answers;
  if (!Array.isArray(rawAnswers)) {
    return [];
  }

  const parsedAnswers: ImmutableAnswer[] = [];

  rawAnswers.forEach((rawAnswer, answerIndex) => {
    const answerRecord = asRecord(rawAnswer);
    if (!answerRecord) {
      return;
    }

    const text = typeof answerRecord.text === 'string' ? answerRecord.text.trim() : '';
    if (!text) {
      return;
    }

    const fallbackId = `Q${questionIndex + 1}A${answerIndex + 1}`;
    const id = toIdString(answerRecord._id) ?? fallbackId;

    parsedAnswers.push({ id, text });
  });

  return parsedAnswers;
}

function parseQuestions(rawQuestions: unknown): ImmutableQuestion[] {
  if (!Array.isArray(rawQuestions)) {
    return [];
  }

  const parsedQuestions: ImmutableQuestion[] = [];

  rawQuestions.forEach((rawQuestion, questionIndex) => {
    const questionRecord = asRecord(rawQuestion);
    if (!questionRecord) {
      return;
    }

    const text = typeof questionRecord.text === 'string' ? questionRecord.text.trim() : '';
    if (!text) {
      return;
    }

    const answers = parseAnswers(questionRecord, questionIndex);
    if (answers.length < 2) {
      return;
    }

    const rawAnswers = Array.isArray(questionRecord.answers)
      ? (questionRecord.answers as unknown[])
      : [];

    let correctAnswerId: string | null = null;
    rawAnswers.forEach((rawAnswer, answerIndex) => {
      const answerRecord = asRecord(rawAnswer);
      if (!answerRecord) {
        return;
      }

      const isCorrect = answerRecord.isCorrect === true;
      if (!isCorrect) {
        return;
      }

      const fallbackId = `Q${questionIndex + 1}A${answerIndex + 1}`;
      const answerId = toIdString(answerRecord._id) ?? fallbackId;
      correctAnswerId = answerId;
    });

    if (!correctAnswerId) {
      return;
    }

    const id = toIdString(questionRecord._id) ?? `Q${questionIndex + 1}`;
    const bibleReference =
      typeof questionRecord.bibleReference === 'string' && questionRecord.bibleReference.trim().length > 0
        ? questionRecord.bibleReference.trim()
        : '';

    parsedQuestions.push({
      id,
      text,
      bibleReference,
      answers,
      correctAnswerId,
    });
  });

  return parsedQuestions;
}

export class MongoMultiplayerDataProvider implements MultiplayerDataProvider {
  async getUserDisplayName(userId: string): Promise<string | null> {
    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user) {
      return null;
    }

    const userRecord = asRecord(user);
    if (!userRecord) {
      return null;
    }

    const name = typeof userRecord.name === 'string' ? userRecord.name.trim() : '';
    if (name.length > 0) {
      return name;
    }

    return 'Player';
  }

  async getQuizSnapshot(quizId: string): Promise<ProviderQuizSnapshot | null> {
    await connectDB();

    const quiz = await Quiz.findById(quizId).lean();
    if (!quiz) {
      return null;
    }

    const quizRecord = asRecord(quiz);
    if (!quizRecord) {
      return null;
    }

    const id = toIdString(quizRecord._id) ?? quizId;
    const title = typeof quizRecord.title === 'string' ? quizRecord.title : 'Quiz';
    const questions = parseQuestions(quizRecord.questions);

    if (questions.length === 0) {
      throw validationError('Quiz has no valid multiplayer questions');
    }

    return {
      id,
      title,
      questions,
    };
  }
}
