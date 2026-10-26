import { NextResponse } from 'next/server';

/**
 * Duel errors use the multiplayer envelope - `{ error: { code, message } }` -
 * so the app can branch on a stable code while showing the Dutch message as
 * written. Every message here is meant for the player.
 */

export type DuelErrorCode =
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'DUEL_NOT_FOUND'
  | 'PLAYER_NOT_FOUND'
  | 'AMBIGUOUS_PLAYER'
  | 'CANNOT_CHALLENGE_SELF'
  | 'INVITE_NOT_FOUND'
  | 'OWN_INVITE'
  | 'DUEL_TAKEN'
  | 'DUEL_FINISHED'
  | 'NOT_YOUR_TURN'
  | 'QUESTION_MISMATCH'
  | 'ANSWER_ALREADY_SUBMITTED'
  | 'NOT_ALLOWED'
  | 'TOO_MANY_OPEN_DUELS'
  | 'TOO_MANY_DUELS'
  | 'RATE_LIMITED'
  | 'NO_QUESTIONS'
  | 'CONCURRENCY_CONFLICT'
  | 'INTERNAL_ERROR';

export class DuelError extends Error {
  public readonly code: DuelErrorCode;
  public readonly status: number;

  constructor(code: DuelErrorCode, message: string, status: number) {
    super(message);
    this.name = 'DuelError';
    this.code = code;
    this.status = status;
  }
}

export function isDuelError(error: unknown): error is DuelError {
  return error instanceof DuelError;
}

export function duelNotFound(): DuelError {
  return new DuelError('DUEL_NOT_FOUND', 'Dit duel bestaat niet (meer).', 404);
}

export function duelValidationError(message: string): DuelError {
  return new DuelError('VALIDATION_ERROR', message, 400);
}

function isVersionConflict(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name?: unknown }).name === 'VersionError'
  );
}

export function duelErrorResponse(error: unknown, logTag = '[DUELS]'): NextResponse {
  if (isDuelError(error)) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  }

  if (isVersionConflict(error)) {
    return NextResponse.json(
      {
        error: {
          code: 'CONCURRENCY_CONFLICT',
          message: 'Het duel veranderde net. Ververs en probeer het opnieuw.',
        },
      },
      { status: 409 },
    );
  }

  console.error(logTag, error);
  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'Er ging iets mis. Probeer het zo opnieuw.' } },
    { status: 500 },
  );
}
