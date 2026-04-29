import type { RoomStatus } from '@/lib/multiplayer/types';
import type { MultiplayerStateTransition } from './contracts';

const validTransitions: MultiplayerStateTransition[] = [
  { from: 'lobby', to: 'lobby' },
  { from: 'lobby', to: 'in_progress' },
  { from: 'lobby', to: 'finished' },
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
