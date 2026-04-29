import type { RoomResultEntry, RoomSnapshot } from '@/lib/multiplayer/types';
import {
  parseApiError,
  parseOkResponse,
  parseResultsResponse,
  parseRoomResponse,
  parseTokenResponse,
} from './mappers';

interface JsonFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

interface AuthHeadersInput {
  token: string;
}

interface CreateRoomInput extends AuthHeadersInput {
  quizId: string;
  maxPlayers?: number;
}

interface RoomCodeInput extends AuthHeadersInput {
  roomCode: string;
}

interface SubmitAnswerInput extends RoomCodeInput {
  questionId: string;
  answerId: string;
}

export class MultiplayerClientHttpError extends Error {
  public readonly status: number;
  public readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'MultiplayerClientHttpError';
    this.status = status;
    this.code = code;
  }
}

function buildAuthHeaders(input: AuthHeadersInput): HeadersInit {
  return {
    Authorization: `Bearer ${input.token}`,
  };
}

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}

async function jsonFetch(path: string, options: JsonFetchOptions): Promise<unknown> {
  const response = await fetch(path, {
    cache: 'no-store',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const parsedError = parseApiError(body);
    throw new MultiplayerClientHttpError(
      response.status,
      parsedError?.error.code ?? 'INTERNAL_ERROR',
      parsedError?.error.message ?? 'Unexpected multiplayer API error',
    );
  }

  return body;
}

export async function getMultiplayerAuthToken(): Promise<string> {
  const body = await jsonFetch('/api/multiplayer/token', {
    method: 'GET',
  });

  return parseTokenResponse(body).token;
}

export async function createRoom(input: CreateRoomInput): Promise<RoomSnapshot> {
  const body = await jsonFetch('/api/mobile/multiplayer/rooms', {
    method: 'POST',
    headers: buildAuthHeaders(input),
    body: {
      quizId: input.quizId,
      ...(input.maxPlayers ? { maxPlayers: input.maxPlayers } : {}),
    },
  });

  return parseRoomResponse(body).room;
}

export async function joinRoom(input: RoomCodeInput): Promise<RoomSnapshot> {
  const roomCode = normalizeRoomCode(input.roomCode);
  const body = await jsonFetch(`/api/mobile/multiplayer/rooms/${encodeURIComponent(roomCode)}/join`, {
    method: 'POST',
    headers: buildAuthHeaders(input),
  });

  return parseRoomResponse(body).room;
}

export async function getRoomSnapshot(input: RoomCodeInput): Promise<RoomSnapshot> {
  const roomCode = normalizeRoomCode(input.roomCode);
  const body = await jsonFetch(`/api/mobile/multiplayer/rooms/${encodeURIComponent(roomCode)}`, {
    method: 'GET',
    headers: buildAuthHeaders(input),
  });

  return parseRoomResponse(body).room;
}

export async function startRoom(input: RoomCodeInput): Promise<RoomSnapshot> {
  const roomCode = normalizeRoomCode(input.roomCode);
  const body = await jsonFetch(`/api/mobile/multiplayer/rooms/${encodeURIComponent(roomCode)}/start`, {
    method: 'POST',
    headers: buildAuthHeaders(input),
  });

  return parseRoomResponse(body).room;
}

export async function submitAnswer(input: SubmitAnswerInput): Promise<void> {
  const roomCode = normalizeRoomCode(input.roomCode);
  const body = await jsonFetch(`/api/mobile/multiplayer/rooms/${encodeURIComponent(roomCode)}/answer`, {
    method: 'POST',
    headers: buildAuthHeaders(input),
    body: {
      questionId: input.questionId,
      answerId: input.answerId,
    },
  });

  parseOkResponse(body);
}

export async function getResults(input: RoomCodeInput): Promise<RoomResultEntry[]> {
  const roomCode = normalizeRoomCode(input.roomCode);
  const body = await jsonFetch(`/api/mobile/multiplayer/rooms/${encodeURIComponent(roomCode)}/results`, {
    method: 'GET',
    headers: buildAuthHeaders(input),
  });

  return parseResultsResponse(body).results;
}

export async function leaveRoom(input: RoomCodeInput): Promise<void> {
  const roomCode = normalizeRoomCode(input.roomCode);
  const body = await jsonFetch(`/api/mobile/multiplayer/rooms/${encodeURIComponent(roomCode)}/leave`, {
    method: 'POST',
    headers: buildAuthHeaders(input),
  });

  parseOkResponse(body);
}
