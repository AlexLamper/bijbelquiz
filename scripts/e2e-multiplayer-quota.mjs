#!/usr/bin/env node
/**
 * Paywall-clarity regression test.
 *
 * Free accounts may host a fixed number of games, ever. While credits remain
 * the page must show the counter and say nothing about Premium; once they are
 * gone it has to say so unmistakably rather than just greying out a button.
 * This renders the real page for four account states and asserts the copy that
 * must (and must not) appear in each.
 *
 * USAGE
 *   node scripts/e2e-multiplayer-quota.mjs
 *   BASE_URL=http://localhost:3010 node scripts/e2e-multiplayer-quota.mjs
 *
 * Creates throwaway `e2e-quota-*@bijbelquiz.test` users and deletes them again.
 */
import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

for (const f of ['.env', '.env.local']) {
  const p = path.resolve(f);
  if (!fs.existsSync(p)) continue;
  for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const l = raw.trim();
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i < 0) continue;
    process.env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
}

const BASE = process.env.BASE_URL || 'http://localhost:3010';

class Jar {
  constructor() { this.c = new Map(); }
  absorb(res) {
    for (const raw of res.headers.getSetCookie?.() ?? []) {
      const [pair] = raw.split(';');
      const i = pair.indexOf('=');
      const k = pair.slice(0, i).trim();
      const v = pair.slice(i + 1).trim();
      if (v === '') this.c.delete(k); else this.c.set(k, v);
    }
  }
  header() { return [...this.c].map(([k, v]) => `${k}=${v}`).join('; '); }
}

async function req(jar, p, opts = {}) {
  const res = await fetch(new URL(p, BASE), {
    ...opts, redirect: 'manual',
    headers: { cookie: jar.header(), ...(opts.headers || {}) },
  });
  jar.absorb(res);
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body, text };
}

async function login(jar, email, password) {
  const csrf = await req(jar, '/api/auth/csrf');
  return req(jar, '/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      csrfToken: csrf.body.csrfToken, email, password, json: 'true',
      callbackUrl: `${BASE}/samen-spelen`,
    }).toString(),
  });
}

const results = [];
function check(label, ok, detail) {
  results.push({ ok, label, detail });
  console.log(`  ${ok ? '[32m✓[0m' : '[31m✗[0m'} ${label}${detail ? ` [90m${detail}[0m` : ''}`);
}

/** Mirrors MULTIPLAYER_FREE_ROOM_QUOTA in src/lib/premium-benefits.ts. */
const FREE_GAME_QUOTA = 5;

const LOCKED_MARKERS = [
  'Je gratis spellen zijn op',
  `Je hebt je ${FREE_GAME_QUOTA} gratis spellen gespeeld`,
  'Word Premium om te hosten',
  'Meedoen blijft gratis',
];

const counterFor = (left) => `${left} van de ${FREE_GAME_QUOTA} gratis spellen over`;

/**
 * The period key the server computes, in Europe/Amsterdam.
 *
 * Mirrors `currentMonthlyPeriod` in src/lib/multiplayer/quota.ts. Duplicated
 * rather than imported because this script runs under plain node; the shape is
 * pinned by tests/quota-monthly.test.ts on the other side.
 */
function currentPeriod(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${year}-${month}`;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const hash = await bcrypt.hash('Test1234!', 10);
  const ids = [];

  const mk = async (label, fields) => {
    const email = `e2e-quota-${label}-${Date.now()}@bijbelquiz.test`;
    const r = await db.collection('users').insertOne({
      name: `Quota ${label}`, email, password: hash,
      xp: 0, level: 1, createdAt: new Date(), updatedAt: new Date(), ...fields,
    });
    ids.push(r.insertedId);
    return email;
  };

  try {
    const fresh = await mk('fresh', { isPremium: false, multiplayerGamesHosted: 0 });
    // Two games left is where the counter is meant to stop being a footnote.
    const warning = await mk('warning', {
      isPremium: false,
      multiplayerGamesHosted: FREE_GAME_QUOTA - 2,
    });
    const used = await mk('used', { isPremium: false, multiplayerGamesHosted: FREE_GAME_QUOTA });
    // No counter at all: an account from before the quota existed.
    const legacy = await mk('legacy', { isPremium: false, freeMultiplayerRoomCreated: true });
    const premium = await mk('premium', { isPremium: true, multiplayerGamesHosted: 99 });

    // The discovery pack is spent and the stored month is last month's, so the
    // refill has to fire on read without any job having run.
    const refilled = await mk('refilled', {
      isPremium: false,
      multiplayerGamesHosted: FREE_GAME_QUOTA,
      multiplayerMonthlyPeriod: '2000-01',
      multiplayerMonthlyGamesHosted: 1,
    });

    // Same account one game later: this month's allowance is already gone.
    const spentThisMonth = await mk('monthly-spent', {
      isPremium: false,
      multiplayerGamesHosted: FREE_GAME_QUOTA + 1,
      multiplayerMonthlyPeriod: currentPeriod(),
      multiplayerMonthlyGamesHosted: 1,
    });

    console.log('\n[1m── Free account, all games used[0m');
    const usedJar = new Jar();
    await login(usedJar, used, 'Test1234!');
    const usedPage = await req(usedJar, '/samen-spelen');
    check('page renders', usedPage.status === 200, `got ${usedPage.status}`);
    for (const marker of LOCKED_MARKERS) {
      check(`shows "${marker}"`, usedPage.text.includes(marker));
    }
    check('create button is NOT offered', !usedPage.text.includes('>Spel starten<'));

    console.log('\n[1m── Free account, games still available[0m');
    const freshJar = new Jar();
    await login(freshJar, fresh, 'Test1234!');
    const freshPage = await req(freshJar, '/samen-spelen');
    check('page renders', freshPage.status === 200, `got ${freshPage.status}`);
    check('shows the full counter', freshPage.text.includes(counterFor(FREE_GAME_QUOTA)));
    check('no "games used up" banner', !freshPage.text.includes('Je gratis spellen zijn op'));
    check('says a credit is spent at start', freshPage.text.includes('telt pas mee als je het spel echt start'));
    check('create button offered', freshPage.text.includes('Spel starten'));

    const legacyJar = new Jar();
    await login(legacyJar, legacy, 'Test1234!');
    const legacyPage = await req(legacyJar, '/samen-spelen');
    check('legacy page renders', legacyPage.status === 200, `got ${legacyPage.status}`);
    check('old single room counts as one game used', legacyPage.text.includes(counterFor(FREE_GAME_QUOTA - 1)));
    check('legacy account may still host', legacyPage.text.includes('Spel starten'));

    console.log('\n[1m── Premium account[0m');
    const premJar = new Jar();
    await login(premJar, premium, 'Test1234!');
    const premPage = await req(premJar, '/samen-spelen');
    check('page renders', premPage.status === 200, `got ${premPage.status}`);
    check('no quota banner despite 99 games hosted', !premPage.text.includes('Je gratis spellen zijn op'));
    check('no free-game counter', !premPage.text.includes('gratis spellen over'));
    check('shows the unlimited badge', premPage.text.includes('onbeperkt spellen'));
    check('create button offered', premPage.text.includes('Spel starten'));

    console.log('\n[1m── Warning before the wall[0m');
    const warnJar = new Jar();
    await login(warnJar, warning, 'Test1234!');
    const warnPage = await req(warnJar, '/samen-spelen');
    check('page renders', warnPage.status === 200, `got ${warnPage.status}`);
    check('warns two games early', warnPage.text.includes('Nog 2 gratis spellen'));
    check(
      'the warning links to Premium with its own trigger',
      warnPage.text.includes('/premium?reden=host_quota_warning'),
    );
    check('can still host', warnPage.text.includes('Spel starten'));

    console.log('\n[1m── Monthly refill[0m');
    const refillJar = new Jar();
    await login(refillJar, refilled, 'Test1234!');
    const refillPage = await req(refillJar, '/samen-spelen');
    check('page renders', refillPage.status === 200, `got ${refillPage.status}`);
    check(
      'a stale month refills without a job having run',
      refillPage.text.includes('Nog 1 gratis spel deze maand'),
    );
    check(
      'the monthly notice replaces the discovery notice',
      refillPage.text.includes('Dit is je gratis spel voor deze maand'),
    );
    check(
      'it does not fall back to the discovery counter',
      !refillPage.text.includes('gratis spellen over'),
    );
    check('may host again', refillPage.text.includes('Spel starten'));

    // The capability endpoint is what the app reads, so it has to agree with
    // the page: a refill the website shows but the app does not is worse than
    // no refill at all.
    const refillCapability = await req(refillJar, '/api/multiplayer/rooms');
    check(
      'the capability endpoint reports one game left',
      refillCapability.body?.freeRoomsRemaining === 1,
      `got ${JSON.stringify(refillCapability.body?.freeRoomsRemaining)}`,
    );
    check(
      'the capability endpoint flags the monthly allowance',
      refillCapability.body?.onMonthlyAllowance === true,
    );

    const spentJar = new Jar();
    await login(spentJar, spentThisMonth, 'Test1234!');
    const spentPage = await req(spentJar, '/samen-spelen');
    check('page renders', spentPage.status === 200, `got ${spentPage.status}`);
    check(
      'a spent month locks hosting again',
      spentPage.text.includes('Je maandspel is gebruikt'),
    );
    check('create button is NOT offered', !spentPage.text.includes('>Spel starten<'));

    const spentCapability = await req(spentJar, '/api/multiplayer/rooms');
    check(
      'the capability endpoint refuses a second game this month',
      spentCapability.body?.canCreateRoom === false,
      `got ${JSON.stringify(spentCapability.body?.canCreateRoom)}`,
    );
    console.log('\n[1m── Price ladder[0m');
    const premiumPage = await req(freshJar, '/premium');
    check('premium page renders', premiumPage.status === 200, `got ${premiumPage.status}`);
    check('offers a monthly plan', premiumPage.text.includes('Per maand'));
    check('offers lifetime', premiumPage.text.includes('Levenslang'));

    // The yearly card is gated on a real Stripe price. Without one it must be
    // absent rather than rendering a button whose checkout answers 500.
    if (process.env.STRIPE_PRICE_YEARLY) {
      check('offers a yearly plan', premiumPage.text.includes('Per jaar'));
      check('yearly is priced', premiumPage.text.includes('39,99'));
      // 5,99 x 12 = 71,88 against 39,99, so the claim must read 44%.
      check('the saving is computed, not hardcoded', premiumPage.text.includes('Bespaar 44%'));
      check('shows the monthly equivalent', premiumPage.text.includes('3,33 per maand'));
      check('posts the plan to checkout', premiumPage.text.includes('value="yearly"'));
    } else {
      check(
        'the yearly card is hidden while STRIPE_PRICE_YEARLY is unset',
        !premiumPage.text.includes('Start jaarabonnement'),
        'set STRIPE_PRICE_YEARLY to test the full ladder',
      );
    }

    const triggeredPage = await req(freshJar, '/premium?reden=host_quota_exhausted');
    check(
      'a trigger changes the headline',
      triggeredPage.text.includes('Speel onbeperkt samen verder'),
      'host_quota_exhausted',
    );
    const directPage = await req(freshJar, '/premium?reden=onzin');
    check(
      'an unknown trigger falls back to the direct headline',
      directPage.text.includes('Kies jouw Premium plan'),
    );
  } finally {
    await db.collection('users').deleteMany({ _id: { $in: ids } });
    await mongoose.disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n[1m${results.length - failed.length}/${results.length} checks passed[0m`);
  if (failed.length) process.exit(1);
}

main().catch((e) => { console.error('CHECK ERROR', e); process.exit(1); });
