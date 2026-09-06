import type { RoomStatus } from '@/lib/multiplayer/types';
import type { MultiplayerStateTransition } from './contracts';

const validTransitions: MultiplayerStateTransition[] = [
  { from: 'lobby', to: 'lobby' },
  { from: 'lobby', to: 'reading' },
  { from: 'lobby', to: 'in_progress' },
  // The server advances timers lazily, so a single poll can cross more than one
  // transition: a client whose snapshot arrives after the first question's
  // deadline sees `lobby -> question_result` directly. Treating that as invalid
  // made `mergeRoom` reject every later snapshot, freezing the player in the
  // wachtkamer while the rest of the room played on.
  { from: 'lobby', to: 'question_result' },
  { from: 'lobby', to: 'finished' },
  // The reading phase precedes question 1; the host then advances out of it.
  // Lazy timer advancement can still collapse several steps into one poll.
  { from: 'reading', to: 'reading' },
  { from: 'reading', to: 'in_progress' },
  { from: 'reading', to: 'question_result' },
  { from: 'reading', to: 'finished' },
  { from: 'in_progress', to: 'in_progress' },
  { from: 'in_progress', to: 'question_result' },
  { from: 'in_progress', to: 'finished' },
  { from: 'question_result', to: 'question_result' },
  { from: 'question_result', to: 'in_progress' },
  { from: 'question_result', to: 'finished' },
  { from: 'finished', to: 'finished' },
];

const transitionKeySet = new Set(validTransitions.map((transition) => `${transition.from}->${transition.to}`));

export function isValidRoomTransition(current: RoomStatus, next: RoomStatus): boolean {
  return transitionKeySet.has(`${current}->${next}`);
}

export function resolveRoomStatus(current: RoomStatus | null, next: RoomStatus): RoomStatus {
  if (!current) {
    return next;
  }

  if (isValidRoomTransition(current, next)) {
    return next;
  }

  return current;
}
