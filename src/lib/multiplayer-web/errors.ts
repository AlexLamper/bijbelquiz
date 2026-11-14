import type { MultiplayerErrorCode } from '@/lib/multiplayer/errors';
import { MultiplayerClientHttpError } from './client';
import { t } from '@/i18n';

export function toUserMessage(error: unknown): string {
  if (error instanceof MultiplayerClientHttpError) {
    const byCode: Partial<Record<MultiplayerErrorCode, string>> = {
      ROOM_NOT_FOUND: t('lib.mp.roomNotFound'),
      ROOM_FULL: t('lib.mp.roomFull'),
      ROOM_ALREADY_STARTED: t('lib.mp.started'),
      ROOM_FINISHED: t('lib.mp.finished'),
      PLAYER_NOT_IN_ROOM: t('lib.mp.notIn'),
      NOT_HOST: t('lib.mp.notHost'),
      MIN_PLAYERS_REQUIRED: t('lib.mp.minPlayers'),
      QUESTION_MISMATCH: t('lib.mp.mismatch'),
      ANSWER_ALREADY_SUBMITTED: t('lib.mp.answered'),
      GAME_NOT_IN_PROGRESS: t('lib.mp.notRunning'),
      VALIDATION_ERROR: t('lib.mp.invalid'),
      // PREMIUM_REQUIRED is intentionally omitted: the server returns a
      // contextual message (free quota used vs. above free player cap) that
      // we want to surface verbatim to drive the right paywall framing.
      UNAUTHORIZED: t('lib.mp.expired'),
      QUIZ_NOT_FOUND: t('lib.mp.quizGone'),
      INTERNAL_ERROR: t('lib.mp.server'),
    };

    return byCode[error.code as MultiplayerErrorCode] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return t('lib.mp.unexpected');
}
