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

/**
 * Body of `GET /api/multiplayer/rooms` - what this user may do.
 *
 * Hosting is no longer metered, so most of this is now constant. The fields
 * stay because published app builds parse them: an installed app that suddenly
 * reads `undefined` where it expected a number renders worse than one that
 * reads the "unlimited" value it already knows how to handle.
 */
export interface MultiplayerCapability {
  canCreateRoom: boolean;
  /** Whether the account holds a licence. Reported, never enforced. */
  isPremium: boolean;
  /** Legacy field; always false. */
  hasUsedFreeRoom: boolean;
  /** Always `null`, which every client already reads as "unlimited". */
  freeRoomsRemaining: number | null;
  /** Always `null`: there is no quota. */
  freeRoomsQuota: number | null;
  /** Games hosted so far. Kept because it is a genuine statistic. */
  freeRoomsUsed: number | null;
  /** Legacy field; always false. */
  onMonthlyAllowance: boolean;
  /** Always `null`: there is no monthly allowance. */
  monthlyRoomsQuota: number | null;
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
