export type MultiplayerErrorCode =
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'ROOM_ALREADY_STARTED'
  | 'ROOM_FINISHED'
  | 'PLAYER_NOT_IN_ROOM'
  | 'NOT_HOST'
  | 'MIN_PLAYERS_REQUIRED'
  | 'QUESTION_MISMATCH'
  | 'ANSWER_ALREADY_SUBMITTED'
  | 'GAME_NOT_IN_PROGRESS'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'QUIZ_NOT_FOUND'
  | 'INTERNAL_ERROR';

export class MultiplayerError extends Error {
  public readonly code: MultiplayerErrorCode;
  public readonly status: number;

  constructor(code: MultiplayerErrorCode, message: string, status: number) {
    super(message);
    this.name = 'MultiplayerError';
    this.code = code;
    this.status = status;
  }
}

export function isMultiplayerError(error: unknown): error is MultiplayerError {
  return error instanceof MultiplayerError;
}

export function validationError(message: string): MultiplayerError {
  return new MultiplayerError('VALIDATION_ERROR', message, 400);
}

export function unauthorizedError(message = 'Unauthorized'): MultiplayerError {
  return new MultiplayerError('UNAUTHORIZED', message, 401);
}
