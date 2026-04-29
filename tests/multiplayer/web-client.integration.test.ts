import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRoom,
  getMultiplayerAuthToken,
  getResults,
  getRoomSnapshot,
  joinRoom,
  leaveRoom,
  MultiplayerClientHttpError,
  startRoom,
  submitAnswer,
} from '@/lib/multiplayer-web/client';

type FetchCall = {
  input: RequestInfo | URL;
  init?: RequestInit;
};

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
        score: 0,
        correctAnswers: 0,
        isHost: true,
        isConnected: true,
        hasAnswered: false,
      },
      {
        id: 'p2',
        name: 'Player Two',
        score: 0,
        correctAnswers: 0,
        isHost: false,
        isConnected: true,
        hasAnswered: false,
      },
    ],
    currentQuestion:
      status === 'in_progress' || status === 'question_result'
        ? {
            id: 'q1',
            text: 'Vraag 1?',
            bibleReference: 'Johannes 3:16',
            questionNumber: 1,
            totalQuestions: 5,
            remainingSeconds: 15,
            answers: [
              { id: 'a1', text: 'Antwoord 1' },
              { id: 'a2', text: 'Antwoord 2' },
            ],
          }
        : null,
  };
}

function readHeader(headers: HeadersInit | undefined, name: string): string | null {
  if (!headers) {
    return null;
  }

  const expectedName = name.toLowerCase();

  if (headers instanceof Headers) {
    return headers.get(name);
  }

  if (Array.isArray(headers)) {
    const found = headers.find(([key]) => key.toLowerCase() === expectedName);
    return found ? found[1] : null;
  }

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === expectedName) {
      return String(value);
    }
  }

  return null;
}

test('web multiplayer client flow hits expected mobile endpoints and payload shapes', async () => {
  const originalFetch = globalThis.fetch;
  const calls: FetchCall[] = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ input, init });

    const url = String(input);
    const method = init?.method ?? 'GET';

    if (url === '/api/multiplayer/token' && method === 'GET') {
      return new Response(JSON.stringify({ token: 'token-1' }), { status: 200 });
    }

    if (url === '/api/mobile/multiplayer/rooms' && method === 'POST') {
      return new Response(JSON.stringify({ room: createRoomSnapshot('lobby') }), { status: 200 });
    }

    if (url === '/api/mobile/multiplayer/rooms/ABC123/join' && method === 'POST') {
      return new Response(JSON.stringify({ room: createRoomSnapshot('lobby') }), { status: 200 });
    }

    if (url === '/api/mobile/multiplayer/rooms/ABC123/start' && method === 'POST') {
      return new Response(JSON.stringify({ room: createRoomSnapshot('in_progress') }), { status: 200 });
    }

    if (url === '/api/mobile/multiplayer/rooms/ABC123/answer' && method === 'POST') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    if (url === '/api/mobile/multiplayer/rooms/ABC123' && method === 'GET') {
      return new Response(JSON.stringify({ room: createRoomSnapshot('in_progress') }), { status: 200 });
    }

    if (url === '/api/mobile/multiplayer/rooms/ABC123/results' && method === 'GET') {
      return new Response(
        JSON.stringify({
          results: [
            {
              rank: 1,
              playerId: 'host',
              playerName: 'Host',
              score: 3,
              correctAnswers: 3,
            },
          ],
        }),
        { status: 200 },
      );
    }

    if (url === '/api/mobile/multiplayer/rooms/ABC123/leave' && method === 'POST') {
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  }) as typeof fetch;

  try {
    const token = await getMultiplayerAuthToken();
    assert.equal(token, 'token-1');

    const created = await createRoom({ token, quizId: 'quiz-1', maxPlayers: 8 });
    assert.equal(created.code, 'ABC123');

    const joined = await joinRoom({ token, roomCode: 'abc123' });
    assert.equal(joined.code, 'ABC123');

    const started = await startRoom({ token, roomCode: 'abc123' });
    assert.equal(started.status, 'in_progress');

    await submitAnswer({
      token,
      roomCode: 'abc123',
      questionId: 'q1',
      answerId: 'a1',
    });

    const snapshot = await getRoomSnapshot({ token, roomCode: 'abc123' });
    assert.equal(snapshot.currentQuestion?.id, 'q1');

    const results = await getResults({ token, roomCode: 'abc123' });
    assert.equal(results[0].playerName, 'Host');

    await leaveRoom({ token, roomCode: 'abc123' });

    assert.equal(calls.length, 8);

    const createCall = calls[1];
    assert.equal(String(createCall.input), '/api/mobile/multiplayer/rooms');
    assert.equal(createCall.init?.method, 'POST');
    assert.equal(readHeader(createCall.init?.headers, 'authorization'), 'Bearer token-1');

    const createBody = JSON.parse(String(createCall.init?.body));
    assert.equal(createBody.quizId, 'quiz-1');
    assert.equal(createBody.maxPlayers, 8);

    const answerCall = calls[4];
    assert.equal(String(answerCall.input), '/api/mobile/multiplayer/rooms/ABC123/answer');
    assert.equal(answerCall.init?.method, 'POST');
    const answerBody = JSON.parse(String(answerCall.init?.body));
    assert.equal(answerBody.questionId, 'q1');
    assert.equal(answerBody.answerId, 'a1');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('web multiplayer client maps API errors to typed http error', async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async () => {
    return new Response(
      JSON.stringify({
        error: {
          code: 'ROOM_NOT_FOUND',
          message: 'Room not found',
        },
      }),
      { status: 404 },
    );
  }) as typeof fetch;

  try {
    await assert.rejects(
      joinRoom({ token: 'token-1', roomCode: 'missing' }),
      (error: unknown) => {
        return (
          error instanceof MultiplayerClientHttpError
          && error.code === 'ROOM_NOT_FOUND'
          && error.status === 404
        );
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
