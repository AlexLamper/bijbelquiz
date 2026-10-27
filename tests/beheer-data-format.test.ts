import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  formatDateTime,
  formatShare,
  formatShortDateTime,
  formatWhole,
  niceMax,
} from '../src/components/web2/beheer-2/parts';

test('niceMax picks a clean axis top with a clean half-way tick', () => {
  assert.equal(niceMax(794), 800);
  assert.equal(niceMax(239), 250);
  assert.equal(niceMax(155), 200);
  assert.equal(niceMax(1667), 2000);
  assert.equal(niceMax(13), 15);
  assert.equal(niceMax(0), 2);
  assert.equal(niceMax(1), 2);
});

test('percentages keep one decimal only under 10%', () => {
  assert.equal(formatShare(6.8), '6,8%');
  assert.equal(formatShare(58.4), '58%');
  assert.equal(formatWhole(2.4), '2%');
});

test('admin date-times print in Amsterdam time, dd-mm-yyyy', () => {
  const at = '2026-10-26T13:32:10Z';
  assert.equal(formatDateTime(at), '26-10-2026 14:32:10');
  assert.equal(formatDateTime(at, false), '26-10-2026 14:32');
  assert.equal(formatShortDateTime(at), '26-10 14:32');
  assert.equal(formatDateTime(null), '-');
});
