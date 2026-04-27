import { NextRequest, NextResponse } from 'next/server';
import { ZodSchema } from 'zod';
import { isMultiplayerError, MultiplayerError, validationError } from './errors';

export function multiplayerErrorResponse(error: unknown): NextResponse {
  if (isMultiplayerError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
      },
    },
    { status: 500 },
  );
}

export async function parseJsonBody<T>(req: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    throw validationError('Invalid JSON body');
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw validationError(result.error.issues[0]?.message ?? 'Invalid request body');
  }

  return result.data;
}

export function normalizeRoomCode(roomCodeRaw: string): string {
  const roomCode = roomCodeRaw.trim().toUpperCase();
  if (!roomCode) {
    throw new MultiplayerError('VALIDATION_ERROR', 'roomCode is required', 400);
  }

  return roomCode;
}
