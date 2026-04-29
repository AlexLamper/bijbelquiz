import type { MultiplayerErrorCode } from '@/lib/multiplayer/errors';
import type {
  RoomPlayerSnapshot,
  RoomResultEntry,
  RoomSnapshot,
  RoomStatus,
} from '@/lib/multiplayer/types';

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

export type MultiplayerWsOutboundCommandType = 'join_room' | 'leave_room';

export interface MultiplayerWsJoinRoomCommand {
  type: 'join_room';
  payload: {
    roomCode: string;
  };
}

export interface MultiplayerWsLeaveRoomCommand {
  type: 'leave_room';
  payload: {
    roomCode?: string;
  };
}

export type MultiplayerWsOutboundCommand = MultiplayerWsJoinRoomCommand | MultiplayerWsLeaveRoomCommand;

export interface MultiplayerWsRoomJoinedEvent {
  type: 'room_joined';
  payload: {
    room: RoomSnapshot;
  };
}

export interface MultiplayerWsPlayerJoinedEvent {
  type: 'player_joined';
  payload: {
    roomCode: string;
    player: RoomPlayerSnapshot;
    room: RoomSnapshot;
  };
}

export interface MultiplayerWsPlayerLeftEvent {
  type: 'player_left';
  payload: {
    roomCode: string;
    playerId: string;
    room: RoomSnapshot;
  };
}

export interface MultiplayerWsQuestionStartedEvent {
  type: 'question_started';
  payload: {
    roomCode: string;
    room: RoomSnapshot;
  };
}

export interface MultiplayerWsProgressUpdatedEvent {
  type: 'progress_updated';
  payload: {
    roomCode: string;
    answeredCount: number;
    totalActivePlayers: number;
    room: RoomSnapshot;
  };
}

export interface MultiplayerWsQuestionResolvedEvent {
  type: 'question_resolved';
  payload: {
    roomCode: string;
    reason: 'timer' | 'all_answered';
    questionId: string | null;
    correctAnswerId: string | null;
    room: RoomSnapshot;
  };
}

export interface MultiplayerWsGameFinishedEvent {
  type: 'game_finished';
  payload: {
    roomCode: string;
    room: RoomSnapshot;
    results: RoomResultEntry[];
  };
}

export interface MultiplayerWsRoomUpdatedEvent {
  type: 'room_updated';
  payload: {
    roomCode: string;
    room: RoomSnapshot;
  };
}

export interface MultiplayerWsErrorEvent {
  type: 'error';
  payload: {
    code: MultiplayerErrorCode | 'INTERNAL_ERROR' | string;
    message: string;
  };
}

export type MultiplayerWsInboundEvent =
  | MultiplayerWsRoomJoinedEvent
  | MultiplayerWsPlayerJoinedEvent
  | MultiplayerWsPlayerLeftEvent
  | MultiplayerWsQuestionStartedEvent
  | MultiplayerWsProgressUpdatedEvent
  | MultiplayerWsQuestionResolvedEvent
  | MultiplayerWsGameFinishedEvent
  | MultiplayerWsRoomUpdatedEvent
  | MultiplayerWsErrorEvent;

export interface MultiplayerStateTransition {
  from: RoomStatus;
  to: RoomStatus;
}

export type MultiplayerConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected';
