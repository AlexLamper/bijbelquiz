export type RoomStatus = 'lobby' | 'in_progress' | 'question_result' | 'finished';

export interface RoomPlayerSnapshot {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  isHost: boolean;
  isConnected: boolean;
  hasAnswered: boolean;
}

export interface RoomAnswerSnapshot {
  id: string;
  text: string;
}

export interface RoomCurrentQuestionSnapshot {
  id: string;
  text: string;
  bibleReference: string;
  questionNumber: number;
  totalQuestions: number;
  remainingSeconds: number;
  answers: RoomAnswerSnapshot[];
}

export interface RoomSnapshot {
  id: string;
  code: string;
  quizId: string;
  quizTitle: string;
  hostUserId: string;
  maxPlayers: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: RoomStatus;
  players: RoomPlayerSnapshot[];
  currentQuestion: RoomCurrentQuestionSnapshot | null;
}

export interface RoomResultEntry {
  rank: number;
  playerId: string;
  playerName: string;
  score: number;
  correctAnswers: number;
}

export interface ImmutableAnswer {
  id: string;
  text: string;
}

export interface ImmutableQuestion {
  id: string;
  text: string;
  bibleReference: string;
  answers: ImmutableAnswer[];
  correctAnswerId: string;
}

export interface RoomPlayerState {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  isHost: boolean;
  isConnected: boolean;
  hasAnswered: boolean;
}

export interface RoomSession {
  id: string;
  code: string;
  quizId: string;
  quizTitle: string;
  hostUserId: string;
  maxPlayers: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  status: RoomStatus;
  players: RoomPlayerState[];
  questions: ImmutableQuestion[];
  questionDeadlineAtMs: number | null;
  questionSequence: number;
  submittedAnswers: Map<string, string>;
  questionTimerHandle: ReturnType<typeof setTimeout> | null;
  resultTimerHandle: ReturnType<typeof setTimeout> | null;
}

export interface ProviderQuizSnapshot {
  id: string;
  title: string;
  questions: ImmutableQuestion[];
}

export interface MultiplayerDataProvider {
  getUserDisplayName(userId: string): Promise<string | null>;
  getQuizSnapshot(quizId: string): Promise<ProviderQuizSnapshot | null>;
}

export interface MultiplayerServiceConfig {
  questionTimerSeconds: number;
  questionResultDelayMs: number;
  now: () => number;
  setTimeoutFn: (callback: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimeoutFn: (timer: ReturnType<typeof setTimeout>) => void;
  createRoomId: () => string;
  createRoomCode: () => string;
}

export type MultiplayerBroadcastEventName =
  | 'player_joined'
  | 'player_left'
  | 'question_started'
  | 'progress_updated'
  | 'question_resolved'
  | 'game_finished'
  | 'room_updated';

export interface MultiplayerBroadcastEvent {
  type: MultiplayerBroadcastEventName;
  roomCode: string;
  payload: Record<string, unknown>;
}

export interface AuthenticatedMultiplayerUser {
  userId: string;
}
