import type { MultiplayerErrorCode } from '@/lib/multiplayer/errors';
import type { RoomResultEntry, RoomSnapshot, RoomStatus } from '@/lib/multiplayer/types';

export interface MultiplayerApiErrorBody {
  error: {
    code: MultiplayerErrorCode | 'INTERNAL_ERROR' | string;
    message: string;
  };
}

export interface MultiplayerTokenResponse {
  token: string;
}

export interface MultiplayerRoomResponse {
  room: RoomSnapshot;
}

export interface MultiplayerResultsResponse {
  results: RoomResultEntry[];
}

export interface MultiplayerOkResponse {
  ok: true;
}

/** Body of `GET /api/multiplayer/rooms` — what this user may do. */
export interface MultiplayerCapability {
  canCreateRoom: boolean;
  isPremium: boolean;
  hasUsedFreeRoom: boolean;
  freeRoomsRemaining: number | null;
  maxPlayersFree: number;
  maxPlayersPremium: number;
  maxPlayersForUser: number;
}

/**
 * Body of `GET /api/multiplayer/config`. Server-owned timings so no client
 * hardcodes values that live in env vars.
 */
export interface MultiplayerRuntimeConfig {
  questionTimerSeconds: number;
  questionResultDelayMs: number;
  playerOfflineAfterMs: number;
  minPlayersToStart: number;
  pollIntervalsMs: Record<RoomStatus, number>;
}

export interface MultiplayerStateTransition {
  from: RoomStatus;
  to: RoomStatus;
}
