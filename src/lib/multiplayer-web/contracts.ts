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

/** Body of `GET /api/multiplayer/rooms` - what this user may do. */
export interface MultiplayerCapability {
  canCreateRoom: boolean;
  isPremium: boolean;
  /** Legacy alias for "no free games left"; prefer `freeRoomsRemaining`. */
  hasUsedFreeRoom: boolean;
  /** Free games left, or `null` for Premium (unlimited). */
  freeRoomsRemaining: number | null;
  /** Total free games a non-premium account gets. */
  freeRoomsQuota: number;
  /** Free games already spent, or `null` for Premium. */
  freeRoomsUsed: number | null;
  /**
   * True once the one-off discovery pack is gone and the account is running on
   * the monthly allowance. `freeRoomsRemaining` then counts this month, not
   * the lifetime pack, so the copy has to change with it.
   */
  onMonthlyAllowance: boolean;
  /** Free games a non-premium account gets back each calendar month. */
  monthlyRoomsQuota: number;
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
