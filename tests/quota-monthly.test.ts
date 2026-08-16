import assert from 'node:assert/strict';
import test from 'node:test';

import { currentMonthlyPeriod } from '@/lib/multiplayer/quota';
import {
  MULTIPLAYER_FREE_ROOM_QUOTA,
  MULTIPLAYER_MONTHLY_FREE_ROOMS,
} from '@/lib/premium-benefits';

/**
 * The monthly free-game refill.
 *
 * The refill has no scheduled job behind it: the period key simply changes and
 * a counter written under the old key stops matching. That makes the key the
 * whole mechanism, so it is worth pinning against timezones, DST and year
 * boundaries - the three ways a month key silently goes wrong.
 *
 * The atomic `$ne` month-claim needs a real database and is covered by
 * `scripts/e2e-multiplayer-quota.mjs`.
 */

test('the period key is a calendar month in Amsterdam, not UTC', () => {
  // 23:30 UTC on 31 January is already 1 February in Amsterdam (UTC+1 in
  // winter). Reading this in UTC would keep the account on January's spent
  // allowance for another hour every month.
  assert.equal(
    currentMonthlyPeriod(new Date('2026-01-31T23:30:00Z')),
    '2026-02',
  );

  // And the mirror image: 00:30 UTC on 1 February is still 01:30 on 1 February
  // in Amsterdam, so this one does not move.
  assert.equal(
    currentMonthlyPeriod(new Date('2026-02-01T00:30:00Z')),
    '2026-02',
  );
});

test('the period key survives summer time', () => {
  // Amsterdam is UTC+2 from the last Sunday in March. 22:30 UTC on 30 June is
  // 00:30 on 1 July locally.
  assert.equal(currentMonthlyPeriod(new Date('2026-06-30T22:30:00Z')), '2026-07');
  assert.equal(currentMonthlyPeriod(new Date('2026-06-30T21:00:00Z')), '2026-06');
});

test('the period key rolls over the year correctly', () => {
  assert.equal(currentMonthlyPeriod(new Date('2026-12-31T23:30:00Z')), '2027-01');
  assert.equal(currentMonthlyPeriod(new Date('2026-12-31T22:00:00Z')), '2026-12');
});

test('the period key is always zero-padded and sortable', () => {
  for (let month = 0; month < 12; month += 1) {
    const key = currentMonthlyPeriod(new Date(Date.UTC(2026, month, 15, 12)));
    assert.match(key, /^\d{4}-\d{2}$/, `month ${month} produced "${key}"`);
  }

  // Sortable as plain strings, which is what makes a `$ne` comparison enough.
  assert.ok(currentMonthlyPeriod(new Date('2026-09-15T12:00:00Z')) > '2026-08');
  assert.ok(currentMonthlyPeriod(new Date('2026-09-15T12:00:00Z')) < '2026-10');
});

test('the two allowances are distinct sizes', () => {
  // The discovery pack is a one-off; the monthly refill is a trickle. If these
  // ever became equal the "1 van de 5" copy and the "nog 1 deze maand" copy
  // would be describing the same thing, and the paywall would stop making
  // sense.
  assert.equal(MULTIPLAYER_FREE_ROOM_QUOTA, 5);
  assert.equal(MULTIPLAYER_MONTHLY_FREE_ROOMS, 1);
  assert.ok(MULTIPLAYER_MONTHLY_FREE_ROOMS < MULTIPLAYER_FREE_ROOM_QUOTA);
});
