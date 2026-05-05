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

export interface MultiplayerStateTransition {
  from: RoomStatus;
  to: RoomStatus;
}
