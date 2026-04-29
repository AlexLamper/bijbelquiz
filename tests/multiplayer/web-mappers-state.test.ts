import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseApiError,
  parseResultsResponse,
  parseRoomResponse,
  parseWsEvent,
} from '@/lib/multiplayer-web/mappers';
import { isValidRoomTransition, resolveRoomStatus } from '@/lib/multiplayer-web/state-machine';

function createRoomSnapshot(status: 'lobby' | 'in_progress' | 'question_result' | 'finished') {
  return {
    id: 'room-1',
    code: 'ABC123',
    quizId: 'quiz-1',
    quizTitle: 'Test Quiz',
    hostUserId: 'host',
    maxPlayers: 8,
    currentQuestionIndex: status === 'lobby' ? -1 : 0,
    totalQuestions: 5,
    status,
    players: [
      {
        id: 'host',
        name: 'Host',
        score: 2,
        correctAnswers: 2,
        isHost: true,
        isConnected: true,
        hasAnswered: false,
      },
      {
        id: 'p2',
        name: 'Player Two',
        score: 1,
        correctAnswers: 1,
        isHost: false,
        isConnected: true,
        hasAnswered: true,
      },
    ],
    currentQuestion:
      status === 'lobby' || status === 'finished'
        ? null
        : {
            id: 'q1',
            text: 'Vraag 1?',
            bibleReference: 'Johannes 3:16',
            questionNumber: 1,
            totalQuestions: 5,
            remainingSeconds: 12,
            answers: [
              { id: 'a1', text: 'Antwoord 1' },
              { id: 'a2', text: 'Antwoord 2' },
            ],
          },
  };
}

test('parseRoomResponse parses room payload', () => {
  const payload = {
    room: createRoomSnapshot('lobby'),
  };

  const parsed = parseRoomResponse(payload);
  assert.equal(parsed.room.code, 'ABC123');
  assert.equal(parsed.room.players.length, 2);
  assert.equal(parsed.room.status, 'lobby');
});

test('parseResultsResponse parses results payload', () => {
  const payload = {
    results: [
      {
        rank: 1,
        playerId: 'host',
        playerName: 'Host',
        score: 5,
        correctAnswers: 5,
      },
    ],
  };

  const parsed = parseResultsResponse(payload);
  assert.equal(parsed.results[0].playerName, 'Host');
  assert.equal(parsed.results[0].rank, 1);
});

test('parseApiError returns null for invalid shape', () => {
  const parsed = parseApiError({ message: 'no error object' });
  assert.equal(parsed, null);
});

test('parseWsEvent parses game_finished event', () => {
  const payload = {
    type: 'game_finished',
    payload: {
      roomCode: 'ABC123',
      room: createRoomSnapshot('finished'),
      results: [
        {
          rank: 1,
          playerId: 'host',
          playerName: 'Host',
          score: 5,
          correctAnswers: 5,
        },
      ],
    },
  };

  const parsed = parseWsEvent(payload);
  assert.equal(parsed.type, 'game_finished');
  assert.equal(parsed.payload.room.status, 'finished');
  assert.equal(parsed.payload.results.length, 1);
});

test('parseWsEvent throws on unsupported event', () => {
  assert.throws(() => {
    parseWsEvent({
      type: 'unknown_event',
      payload: {},
    });
  });
});

test('state machine validates transitions', () => {
  assert.equal(isValidRoomTransition('lobby', 'in_progress'), true);
  assert.equal(isValidRoomTransition('finished', 'in_progress'), false);
});

test('resolveRoomStatus prevents invalid status regression', () => {
  assert.equal(resolveRoomStatus('finished', 'in_progress'), 'finished');
  assert.equal(resolveRoomStatus('lobby', 'in_progress'), 'in_progress');
  assert.equal(resolveRoomStatus(null, 'lobby'), 'lobby');
});
