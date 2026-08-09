import assert from 'node:assert/strict';
import test from 'node:test';
import { MultiplayerClientHttpError } from '@/lib/multiplayer-web/client';
import { MultiplayerTokenStore } from '@/lib/multiplayer-web/token-store';

/** Build a JWT-shaped string whose payload expires `seconds` from now. */
function fakeJwt(seconds: number, label = 'tok'): string {
  const payload = Buffer.from(
    JSON.stringify({ userId: 'u1', label, exp: Math.floor(Date.now() / 1000) + seconds }),
  ).toString('base64url');
  return `header.${payload}.signature`;
}

function stubTokenEndpoint(tokens: string[]) {
  const originalFetch = globalThis.fetch;
  let calls = 0;

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    if (String(input).endsWith('/api/multiplayer/token')) {
      const token = tokens[Math.min(calls, tokens.length - 1)];
      calls += 1;
      return new Response(JSON.stringify({ token }), { status: 200 });
    }
    return new Response('Not Found', { status: 404 });
  }) as typeof fetch;

  return {
    get calls() {
      return calls;
    },
    restore() {
      globalThis.fetch = originalFetch;
    },
  };
}

test('token store caches a token that is still comfortably valid', async () => {
  const endpoint = stubTokenEndpoint([fakeJwt(3600, 'first'), fakeJwt(3600, 'second')]);

  try {
    const store = new MultiplayerTokenStore();
    const first = await store.get();
    const second = await store.get();

    assert.equal(first, second);
    assert.equal(endpoint.calls, 1);
  } finally {
    endpoint.restore();
  }
});

test('token store re-mints a token that is about to expire', async () => {
  // 60s of life left is inside the 5-minute refresh margin.
  const endpoint = stubTokenEndpoint([fakeJwt(60, 'stale'), fakeJwt(3600, 'fresh')]);

  try {
    const store = new MultiplayerTokenStore();
    const first = await store.get();
    const second = await store.get();

    assert.notEqual(first, second);
    assert.equal(endpoint.calls, 2);
  } finally {
    endpoint.restore();
  }
});

test('token store collapses concurrent mints into one request', async () => {
  const endpoint = stubTokenEndpoint([fakeJwt(3600)]);

  try {
    const store = new MultiplayerTokenStore();
    const [a, b, c] = await Promise.all([store.get(), store.get(), store.get()]);

    assert.equal(a, b);
    assert.equal(b, c);
    assert.equal(endpoint.calls, 1);
  } finally {
    endpoint.restore();
  }
});

test('token store retries a 401 once with a freshly minted token', async () => {
  const endpoint = stubTokenEndpoint([fakeJwt(3600, 'expired-server-side'), fakeJwt(3600, 'renewed')]);

  try {
    const store = new MultiplayerTokenStore();
    const seenTokens: string[] = [];

    const result = await store.run(async (token) => {
      seenTokens.push(token);
      if (seenTokens.length === 1) {
        throw new MultiplayerClientHttpError(401, 'UNAUTHORIZED', 'Unauthorized');
      }
      return 'ok';
    });

    assert.equal(result, 'ok');
    assert.equal(seenTokens.length, 2);
    assert.notEqual(seenTokens[0], seenTokens[1]);
    assert.equal(endpoint.calls, 2);
  } finally {
    endpoint.restore();
  }
});

test('token store does not retry non-auth failures', async () => {
  const endpoint = stubTokenEndpoint([fakeJwt(3600)]);

  try {
    const store = new MultiplayerTokenStore();
    let attempts = 0;

    await assert.rejects(
      store.run(async () => {
        attempts += 1;
        throw new MultiplayerClientHttpError(404, 'ROOM_NOT_FOUND', 'Room not found');
      }),
      (error: unknown) =>
        error instanceof MultiplayerClientHttpError && error.code === 'ROOM_NOT_FOUND',
    );

    assert.equal(attempts, 1);
  } finally {
    endpoint.restore();
  }
});

test('token store surfaces a persistent 401 instead of looping', async () => {
  const endpoint = stubTokenEndpoint([fakeJwt(3600, 'a'), fakeJwt(3600, 'b')]);

  try {
    const store = new MultiplayerTokenStore();
    let attempts = 0;

    await assert.rejects(
      store.run(async () => {
        attempts += 1;
        throw new MultiplayerClientHttpError(401, 'UNAUTHORIZED', 'Unauthorized');
      }),
      (error: unknown) => error instanceof MultiplayerClientHttpError && error.status === 401,
    );

    assert.equal(attempts, 2);
  } finally {
    endpoint.restore();
  }
});
