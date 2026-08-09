import type { RoomResultEntry, RoomSnapshot } from '@/lib/multiplayer/types';
import type { MultiplayerCapability, MultiplayerRuntimeConfig } from './contracts';
import {
  parseApiError,
  parseCapabilityResponse,
  parseConfigResponse,
  parseOkResponse,
  parseOptionalRoomResponse,
  parseResultsResponse,
  parseRoomResponse,
  parseTokenResponse,
} from './mappers';

/**
 * Thin HTTP client for the multiplayer API.
 *
 * Every call targets the canonical `/api/multiplayer/*` routes — the same ones
 * the Flutter app should use. (`/api/mobile/multiplayer/*` still exists as an
 * alias for already-shipped mobile builds, but nothing here points at it.)
 *
 * Callers pass an `AbortSignal` wherever a request can be superseded, so a
 * poll that is no longer relevant is actually cancelled rather than left to
 * land late and overwrite fresher state.
 */

interface JsonFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

interface AuthHeadersInput {
  token: string;
  signal?: AbortSignal;
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

/** True when a request failed because the caller's token is no longer valid. */
export function isUnauthorized(error: unknown): boolean {
  return error instanceof MultiplayerClientHttpError && error.status === 401;
}

/** True when the caller aborted the request themselves (not a real failure). */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'AbortError';
}

const API_ROOT = '/api/multiplayer';

function buildAuthHeaders(input: AuthHeadersInput): HeadersInit {
  return {
    Authorization: `Bearer ${input.token}`,
  };
}

function normalizeRoomCode(roomCode: string): string {
  return roomCode.trim().toUpperCase();
}

function roomPath(roomCode: string, suffix = ''): string {
  return `${API_ROOT}/rooms/${encodeURIComponent(normalizeRoomCode(roomCode))}${suffix}`;
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

export async function getMultiplayerAuthToken(signal?: AbortSignal): Promise<string> {
  const body = await jsonFetch(`${API_ROOT}/token`, {
    method: 'GET',
    signal,
  });

  return parseTokenResponse(body).token;
}

export async function getMultiplayerConfig(signal?: AbortSignal): Promise<MultiplayerRuntimeConfig> {
  const body = await jsonFetch(`${API_ROOT}/config`, { method: 'GET', signal });
  return parseConfigResponse(body);
}

export async function getCapability(input: AuthHeadersInput): Promise<MultiplayerCapability> {
  const body = await jsonFetch(`${API_ROOT}/rooms`, {
    method: 'GET',
    headers: buildAuthHeaders(input),
    signal: input.signal,
  });

  return parseCapabilityResponse(body);
}

export async function createRoom(input: CreateRoomInput): Promise<RoomSnapshot> {
  const body = await jsonFetch(`${API_ROOT}/rooms`, {
    method: 'POST',
    headers: buildAuthHeaders(input),
    signal: input.signal,
    body: {
      quizId: input.quizId,
      ...(input.maxPlayers ? { maxPlayers: input.maxPlayers } : {}),
    },
  });

  return parseRoomResponse(body).room;
}

export async function joinRoom(input: RoomCodeInput): Promise<RoomSnapshot> {
  const body = await jsonFetch(roomPath(input.roomCode, '/join'), {
    method: 'POST',
    headers: buildAuthHeaders(input),
    signal: input.signal,
  });

  return parseRoomResponse(body).room;
}

export async function getRoomSnapshot(input: RoomCodeInput): Promise<RoomSnapshot> {
  const body = await jsonFetch(roomPath(input.roomCode), {
    method: 'GET',
    headers: buildAuthHeaders(input),
    signal: input.signal,
  });

  return parseRoomResponse(body).room;
}

/** The room this user is already in, or null. Used to resume after a reload. */
export async function getActiveRoom(input: AuthHeadersInput): Promise<RoomSnapshot | null> {
  const body = await jsonFetch(`${API_ROOT}/rooms/active`, {
    method: 'GET',
    headers: buildAuthHeaders(input),
    signal: input.signal,
  });

  return parseOptionalRoomResponse(body).room;
}

export async function startRoom(input: RoomCodeInput): Promise<RoomSnapshot> {
  const body = await jsonFetch(roomPath(input.roomCode, '/start'), {
    method: 'POST',
    headers: buildAuthHeaders(input),
    signal: input.signal,
  });

  return parseRoomResponse(body).room;
}

/**
 * Returns the post-answer snapshot so the caller can paint the result
 * immediately instead of waiting a poll interval for it.
 */
export async function submitAnswer(input: SubmitAnswerInput): Promise<RoomSnapshot | null> {
  const body = await jsonFetch(roomPath(input.roomCode, '/answer'), {
    method: 'POST',
    headers: buildAuthHeaders(input),
    signal: input.signal,
    body: {
      questionId: input.questionId,
      answerId: input.answerId,
    },
  });

  parseOkResponse(body);
  return parseOptionalRoomResponse(body).room;
}

export async function getResults(input: RoomCodeInput): Promise<RoomResultEntry[]> {
  const body = await jsonFetch(roomPath(input.roomCode, '/results'), {
    method: 'GET',
    headers: buildAuthHeaders(input),
    signal: input.signal,
  });

  return parseResultsResponse(body).results;
}

export async function leaveRoom(input: RoomCodeInput): Promise<void> {
  const body = await jsonFetch(roomPath(input.roomCode, '/leave'), {
    method: 'POST',
    headers: buildAuthHeaders(input),
    signal: input.signal,
  });

  parseOkResponse(body);
}
