import assert from 'node:assert/strict';
import { test } from 'node:test';

import { normalizePath } from '@/lib/analytics/routes';

test('duel play pages collapse onto one analytics route', () => {
  assert.deepEqual(normalizePath('/duels/6ae065fe86a8728b27b50674'), {
    path: '/duels/[id]',
    param: '6ae065fe86a8728b27b50674',
  });
  assert.deepEqual(normalizePath('/duels'), { path: '/duels', param: null });
});

test('an invite page view never records the invite token', () => {
  const normalized = normalizePath('/duel/bjjbyKTEQDLJ');
  assert.equal(normalized.path, '/duel/[token]');
  assert.ok(!String(normalized.param).includes('bjjbyKTEQDLJ'));
});
