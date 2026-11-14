import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ROUTE_PAIRS } from '../src/config/route-map';
import { localizePath } from '../src/config/routes';

test('NL keeps its paths', () => {
  assert.equal(localizePath('/quizzen'), '/quizzen');
  assert.equal(localizePath('/bijbelquiz/genesis-1'), '/bijbelquiz/genesis-1');
});

test('route pairs have unique sources and the same params', () => {
  const nl = new Set(ROUTE_PAIRS.map((p) => p[0]));
  const en = new Set(ROUTE_PAIRS.map((p) => p[1]));
  assert.equal(nl.size, ROUTE_PAIRS.length);
  assert.equal(en.size, ROUTE_PAIRS.length);
  for (const [a, b] of ROUTE_PAIRS) {
    assert.deepEqual(a.match(/:\w+/g), b.match(/:\w+/g));
  }
});
