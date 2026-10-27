import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server-core';

import { AnalyticsEvent, Payment, User, connectDB } from '@/database';
import { grantPremium, resolveGrantUntil, revokePremiumGrant, summarizePremium } from '@/lib/admin/premium-grants';
import { getPremiumSnapshot, recomputeUserPremium, updateUserPremiumFromStore, updateUserPremiumFromStripe } from '@/lib/premium-state';
import { effectivePremiumOr, resetInternalAccountCache } from '@/lib/analytics/internal-accounts';
import { mobilePremiumPayload } from '@/lib/mobile-premium';
import { signMobileToken } from '@/lib/mobile-auth';
import { getPremiumStats } from '@/lib/premium-stats';
import { listAdminUsers, readUserListQuery, getAdminUserDetail } from '@/lib/admin/users';
import { getAudienceStats, resetAudienceCache } from '@/lib/admin/audience';
import {
  appPlatformFromRequest,
  deriveSignupMethod,
  deriveSignupPlatform,
  touchLastActive,
  webPlatformFromUserAgent,
} from '@/lib/admin/platform';
import { POST as grantRoute, DELETE as revokeRoute } from '@/app/api/mobile/admin/users/[id]/premium/route';
import { GET as usersRoute } from '@/app/api/mobile/admin/users/route';

/**
 * "Premium geven" in beheer and the platform split, against a real mongod.
 * Covers: grant, expiry (read side and the stored flag), revoke, no
 * clobbering with Stripe / store, the audit trail, admin-only routes, and the
 * user list / platform derivation that the admin pages and app read.
 */

let mongod: MongoMemoryServer;
const DAY = 24 * 60 * 60 * 1000;
let counter = 0;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('bijbelquiz-admin-grants-test');
  process.env.NEXTAUTH_SECRET = 'test-secret-admin-grants';
  await connectDB();
  await Promise.all([User.init(), Payment.init(), AnalyticsEvent.init()]);
  resetInternalAccountCache();
  resetAudienceCache();
});

after(async () => {
  await mongoose.disconnect();
  await mongod?.stop();
});

async function makeUser(fields: Record<string, unknown> = {}): Promise<string> {
  counter += 1;
  const user = await User.create({ email: `grant-${counter}@test.local`, name: `Grant ${counter}`, ...fields });
  return String(user._id);
}

async function load(id: string) {
  const user = await User.findById(id).lean();
  assert.ok(user);
  return user;
}

const admin = { id: new mongoose.Types.ObjectId().toString(), email: 'admin@test.local', name: 'Admin' };

describe('grant durations', () => {
  const now = new Date('2026-10-27T10:00:00Z');

  test('presets count from now; lifetime has no end', () => {
    const week = resolveGrantUntil('7d', null, now);
    assert.ok(week.ok);
    assert.equal(week.until?.toISOString(), '2026-11-03T10:00:00.000Z');
    const month = resolveGrantUntil('1m', null, now);
    assert.ok(month.ok && month.until?.toISOString() === '2026-11-27T10:00:00.000Z');
    const quarter = resolveGrantUntil('3m', null, now);
    assert.ok(quarter.ok && quarter.until?.toISOString() === '2027-01-27T10:00:00.000Z');
    const year = resolveGrantUntil('1y', null, now);
    assert.ok(year.ok && year.until?.toISOString() === '2027-10-27T10:00:00.000Z');
    const lifetime = resolveGrantUntil('lifetime', null, now);
    assert.ok(lifetime.ok && lifetime.until === null);
  });

  test('a custom date ends at the end of that Amsterdam day', () => {
    const custom = resolveGrantUntil('custom', '2026-12-31', now);
    assert.ok(custom.ok);
    // CET (UTC+1): midnight 1 jan Amsterdam is 23:00 UTC on 31 dec.
    assert.equal(custom.until?.toISOString(), '2026-12-31T22:59:59.999Z');
  });

  test('invalid input is refused with the field', () => {
    assert.deepEqual(resolveGrantUntil('forever', null, now), { ok: false, error: 'Kies hoe lang Premium geldt.', field: 'duration' });
    const past = resolveGrantUntil('custom', '2026-01-01', now);
    assert.equal(past.ok, false);
    assert.equal(!past.ok && past.field, 'until');
    assert.equal(resolveGrantUntil('custom', 'niet-een-datum', now).ok, false);
    assert.equal(resolveGrantUntil('custom', '2040-01-01', now).ok, false);
    assert.equal(resolveGrantUntil('custom', undefined, now).ok, false);
  });
});

describe('grant, expiry and revoke', () => {
  test('a grant gives Premium everywhere and is logged with who and why', async () => {
    const id = await makeUser();
    const result = await grantPremium(id, { duration: '1m', note: 'Prijs zomerquiz' }, admin);
    assert.ok(result.ok);
    assert.equal(result.premium.active, true);
    assert.equal(result.premium.source, 'manual');

    const user = await load(id);
    assert.equal(user.isPremium, true);
    assert.equal(user.premiumGranted, true);
    assert.equal(user.premiumGrantedNote, 'Prijs zomerquiz');
    assert.equal(String(user.premiumGrantedBy), admin.id);
    assert.equal(user.premiumGrantLog?.length, 1);
    assert.equal(user.premiumGrantLog?.[0].action, 'grant');
    assert.equal(user.premiumGrantLog?.[0].byEmail, 'admin@test.local');
    assert.equal(getPremiumSnapshot(user).isPremium, true);

    const payload = mobilePremiumPayload(user);
    assert.equal(payload.isPremium, true);
    assert.equal(payload.premiumSource, 'manual');
    assert.equal(payload.manualPremiumUntil, new Date(user.premiumGrantedUntil!).toISOString());
  });

  test('an expired grant stops counting on read, before anything rewrites the flag', async () => {
    const id = await makeUser();
    await grantPremium(id, { duration: '7d' }, admin);
    // Time passes: the end date is now behind us, the stored flag still true.
    await User.updateOne({ _id: id }, { $set: { premiumGrantedUntil: new Date(Date.now() - 1000) } });

    const user = await load(id);
    assert.equal(user.isPremium, true, 'stored flag is stale until a recompute');
    assert.equal(getPremiumSnapshot(user).isPremium, false);
    assert.equal(mobilePremiumPayload(user).isPremium, false);
    assert.equal(summarizePremium(user).active, false);
    assert.equal(await User.countDocuments({ _id: id, $or: effectivePremiumOr() }), 0, 'reports leave it out');

    // The lazy recompute (session refresh / profile) clears the flag.
    const written = await recomputeUserPremium(id, {});
    assert.equal(written?.isPremium, false);
  });

  test('revoke ends a grant now and is logged; a second revoke is refused', async () => {
    const id = await makeUser();
    await grantPremium(id, { duration: 'lifetime' }, admin);
    const revoked = await revokePremiumGrant(id, { note: 'Per ongeluk' }, admin);
    assert.ok(revoked.ok);
    assert.equal(revoked.premium.active, false);
    const user = await load(id);
    assert.equal(user.isPremium, false);
    assert.equal(user.premiumGranted, false);
    assert.deepEqual(user.premiumGrantLog?.map((entry) => entry.action), ['grant', 'revoke']);

    const again = await revokePremiumGrant(id, {}, admin);
    assert.equal(again.ok, false);
    assert.equal(!again.ok && again.status, 400);
  });

  test('a legacy hand-set isPremium can be revoked', async () => {
    const id = await makeUser({ isPremium: true });
    const revoked = await revokePremiumGrant(id, {}, admin);
    assert.ok(revoked.ok);
    assert.equal((await load(id)).isPremium, false);
  });

  test('a new preset replaces the end date of a running grant', async () => {
    const id = await makeUser();
    await grantPremium(id, { duration: '1y' }, admin);
    await grantPremium(id, { duration: '7d' }, admin);
    const user = await load(id);
    const until = new Date(user.premiumGrantedUntil!).getTime();
    assert.ok(until < Date.now() + 8 * DAY && until > Date.now() + 6 * DAY);
    assert.equal(user.premiumGrantLog?.length, 2);
  });
});

describe('no clobbering with Stripe and the stores', () => {
  test('Stripe ending does not end a grant; the grant ending does not end Stripe', async () => {
    const id = await makeUser({ premiumStripe: true, isPremium: true, stripeSubscriptionStatus: 'active' });
    await grantPremium(id, { duration: '1m' }, admin);

    await updateUserPremiumFromStripe(id, false, { stripeSubscriptionStatus: 'canceled' });
    let user = await load(id);
    assert.equal(user.isPremium, true, 'the grant keeps Premium');
    assert.equal(summarizePremium(user).source, 'manual');

    // And the other way: a running subscription survives a revoke and an expiry.
    await updateUserPremiumFromStripe(id, true, { stripeSubscriptionStatus: 'active' });
    await revokePremiumGrant(id, {}, admin);
    user = await load(id);
    assert.equal(user.isPremium, true);
    assert.equal(user.premiumStripe, true);
    assert.deepEqual(summarizePremium(user).sources, ['stripe']);
  });

  test('a store expiry keeps the grant, and an expired grant keeps the store purchase', async () => {
    const id = await makeUser();
    await updateUserPremiumFromStore(id, true, new Date(Date.now() + 30 * DAY));
    await grantPremium(id, { duration: '7d' }, admin);
    await updateUserPremiumFromStore(id, false, null);
    let user = await load(id);
    assert.equal(user.isPremium, true);
    assert.deepEqual(summarizePremium(user).sources, ['manual']);

    await updateUserPremiumFromStore(id, true, new Date(Date.now() + 30 * DAY));
    await User.updateOne({ _id: id }, { $set: { premiumGrantedUntil: new Date(Date.now() - 1000) } });
    await recomputeUserPremium(id, {});
    user = await load(id);
    assert.equal(user.isPremium, true, 'store Premium stays');
    assert.deepEqual(summarizePremium(user).sources, ['store']);
  });

  test('premium stats count an active grant as manual and drop an expired one', async () => {
    const before = await getPremiumStats();
    const id = await makeUser();
    await grantPremium(id, { duration: '7d' }, admin);
    const during = await getPremiumStats();
    assert.equal(during.breakdown.other, before.breakdown.other + 1);
    await User.updateOne({ _id: id }, { $set: { premiumGrantedUntil: new Date(Date.now() - 1000) } });
    const afterExpiry = await getPremiumStats();
    assert.equal(afterExpiry.breakdown.other, before.breakdown.other);
    assert.equal(afterExpiry.premiumUsers, before.premiumUsers);
  });
});

describe('admin-only routes', () => {
  function request(method: string, token: string | null, body?: unknown) {
    return new Request('http://localhost/api/mobile/admin/x', {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  test('no token 401, a normal account 403, an admin 200 with the audit actor', async () => {
    const target = await makeUser();
    const normal = await makeUser();
    const adminId = await makeUser({ role: 'admin', name: 'Beheerder' });
    const params = { params: Promise.resolve({ id: target }) };

    assert.equal((await grantRoute(request('POST', null, { duration: '7d' }), params)).status, 401);
    assert.equal((await grantRoute(request('POST', 'garbage', { duration: '7d' }), params)).status, 401);
    assert.equal((await grantRoute(request('POST', signMobileToken(normal), { duration: '7d' }), params)).status, 403);
    assert.equal((await usersRoute(request('GET', signMobileToken(normal)))).status, 403);
    assert.equal((await User.findById(target).lean())?.premiumGranted, undefined, 'nothing written');

    const bad = await grantRoute(request('POST', signMobileToken(adminId), { duration: 'x' }), params);
    assert.equal(bad.status, 400);
    assert.equal((await bad.json()).field, 'duration');

    const ok = await grantRoute(request('POST', signMobileToken(adminId), { duration: '3m', note: 'Bedankt' }), params);
    assert.equal(ok.status, 200);
    const json = await ok.json();
    assert.equal(json.premium.source, 'manual');
    assert.equal(json.grant.by.email, (await User.findById(adminId).lean())?.email);

    const revoked = await revokeRoute(request('DELETE', signMobileToken(adminId), {}), params);
    assert.equal(revoked.status, 200);
    assert.equal((await revoked.json()).premium.active, false);
  });
});

describe('signup platform and the user list', () => {
  test('user agents and app headers map to platform keys', () => {
    assert.equal(webPlatformFromUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148'), 'web-mobile');
    assert.equal(webPlatformFromUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120'), 'web-desktop');
    assert.equal(webPlatformFromUserAgent(null), 'web-desktop');
    const req = (headers: Record<string, string>) => new Request('http://x', { headers });
    assert.equal(appPlatformFromRequest(req({ 'x-client-platform': 'android' })), 'android');
    assert.equal(appPlatformFromRequest(req({ 'user-agent': 'Dart/3.5 (dart:io)' })), null);
    assert.equal(appPlatformFromRequest(req({}), 'ios'), 'ios');
  });

  test('older accounts get a derived platform and method', () => {
    assert.deepEqual(deriveSignupPlatform('ios'), { platform: 'ios', derived: false });
    assert.deepEqual(deriveSignupPlatform(undefined, { firstEventPlatform: 'android' }), { platform: 'android', derived: true });
    assert.deepEqual(deriveSignupPlatform(undefined, { firstEventPlatform: 'web', firstWebDevice: 'mobile' }), {
      platform: 'web-mobile',
      derived: true,
    });
    assert.deepEqual(deriveSignupPlatform(undefined, { firstEventPlatform: 'web' }), { platform: 'web', derived: true });
    assert.deepEqual(deriveSignupPlatform(undefined, { store: 'play_store' }), { platform: 'android', derived: true });
    assert.deepEqual(deriveSignupPlatform(undefined, {}), { platform: 'onbekend', derived: true });
    assert.equal(deriveSignupMethod({ password: 'hash' }), 'email');
    assert.equal(deriveSignupMethod({ googleId: 'g' }), 'google');
    assert.equal(deriveSignupMethod({ signupMethod: 'apple', password: 'x' }), 'apple');
    assert.equal(deriveSignupMethod({}), 'onbekend');
  });

  test('list filters by stored and derived platform, Premium source and search', async () => {
    const tag = `plat${Date.now()}`;
    const stored = await makeUser({ name: `${tag} Anna`, signupPlatform: 'android', signupMethod: 'google' });
    const legacy = await makeUser({ name: `${tag} Bram` });
    await AnalyticsEvent.create([
      { name: 'quiz_started', userId: legacy, platform: 'android', createdAt: new Date(Date.now() - 5 * DAY) },
      { name: 'page_view', userId: legacy, platform: 'web', createdAt: new Date(Date.now() - DAY) },
    ]);
    resetAudienceCache();
    await grantPremium(stored, { duration: '7d' }, admin);

    const android = await listAdminUsers(readUserListQuery(new URLSearchParams({ q: tag, platform: 'android' })));
    assert.deepEqual(android.users.map((user) => user.id).sort(), [stored, legacy].sort());
    const legacyRow = android.users.find((user) => user.id === legacy)!;
    assert.equal(legacyRow.signupPlatformDerived, true);

    const manual = await listAdminUsers(readUserListQuery(new URLSearchParams({ q: tag, source: 'manual' })));
    assert.deepEqual(manual.users.map((user) => user.id), [stored]);
    const free = await listAdminUsers(readUserListQuery(new URLSearchParams({ q: tag, premium: 'no' })));
    assert.deepEqual(free.users.map((user) => user.id), [legacy]);

    const sorted = await listAdminUsers(readUserListQuery(new URLSearchParams({ q: tag, sort: 'name', order: 'asc' })));
    assert.deepEqual(sorted.users.map((user) => user.name), [`${tag} Anna`, `${tag} Bram`]);

    const detail = await getAdminUserDetail(stored);
    assert.ok(detail);
    assert.equal(detail.premium.manual.active, true);
    assert.equal(detail.grantLog[0].action, 'grant');
    assert.equal(detail.user.signupMethod, 'google');
  });

  test('last active is written at most once per day', async () => {
    const id = await makeUser();
    await touchLastActive(id, 'ios');
    const first = (await load(id)).lastActiveAt;
    assert.ok(first);
    await touchLastActive(id, 'web-desktop');
    const user = await load(id);
    assert.equal(new Date(user.lastActiveAt!).getTime(), new Date(first).getTime());
    assert.equal(user.lastSeenPlatform, 'ios');
  });

  test('audience stats split registrations by platform and count grants', async () => {
    resetAudienceCache();
    const stats = await getAudienceStats();
    const sum = Object.values(stats.registrations.allTime.byPlatform).reduce((a, b) => a + (b ?? 0), 0);
    assert.equal(sum, stats.registrations.allTime.total);
    assert.equal(stats.registrations.allTime.total, await User.countDocuments());
    assert.ok((stats.registrations.today.byPlatform.android ?? 0) >= 1);
    assert.ok(stats.premium.grantsActive >= 1);
    assert.equal(stats.registrations.weekly.length, 12);
  });
});
