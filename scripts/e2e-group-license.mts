#!/usr/bin/env node --import tsx
/**
 * Group licence regression test.
 *
 * A group licence is the one thing in this product where one person's payment
 * decides whether thirty other people have Premium tonight. Everything that
 * can go wrong is a rule, not a rendering problem, so this drives the library
 * directly rather than through the UI: grant, redeem, seat limit, expiry,
 * ownership, and whether membership actually flips `isPremium`.
 *
 * Written as .mts and run through tsx because `grantGroupLicense` and
 * `getPremiumSnapshot` are the units under test; reimplementing them in plain
 * JS would test a copy.
 *
 * USAGE
 *   npm run test:group-license
 *   node --import tsx scripts/e2e-group-license.mts
 *
 * Creates throwaway `e2e-glic-*@bijbelquiz.test` users and deletes them, along
 * with every licence they own, at the end.
 */
import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';

for (const f of ['.env', '.env.local']) {
  const p = path.resolve(f);
  if (!fs.existsSync(p)) continue;
  for (const raw of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const l = raw.trim();
    if (!l || l.startsWith('#')) continue;
    const i = l.indexOf('=');
    if (i < 0) continue;
    process.env[l.slice(0, i).trim()] = l
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
}

const results: Array<{ ok: boolean; label: string; detail?: string }> = [];

function check(label: string, ok: boolean, detail?: string) {
  results.push({ ok, label, detail });
  const mark = ok ? '\x1b[32m✓\x1b[0m' : '\x1b[31m✗\x1b[0m';
  console.log(`  ${mark} ${label}${detail ? ` \x1b[90m${detail}\x1b[0m` : ''}`);
}

function section(title: string) {
  console.log(`\n\x1b[1m── ${title}\x1b[0m`);
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Add it to .env.local.');
    process.exit(1);
  }

  const { connectDB, GroupLicense, User } = await import('@/database');
  const {
    GROUP_LICENSE_SEATS,
    endGroupLicense,
    grantGroupLicense,
    hasGroupLicensePremium,
    joinGroupLicense,
    removeGroupMember,
    summarizeLicensesFor,
  } = await import('@/lib/group-license');
  const { getPremiumSnapshot } = await import('@/lib/premium-state');

  await connectDB();

  const stamp = Date.now();
  const createdUserIds: mongoose.Types.ObjectId[] = [];

  const mkUser = async (label: string) => {
    const user = await User.create({
      name: `Licence ${label}`,
      email: `e2e-glic-${label}-${stamp}@bijbelquiz.test`,
      xp: 0,
      level: 1,
    });
    createdUserIds.push(user._id as mongoose.Types.ObjectId);
    return String(user._id);
  };

  const isPremiumNow = async (userId: string) => {
    const fresh = await User.findById(userId)
      .select('isPremium hasLifetimePremium premiumStripe premiumStore storePremiumExpiresAt groupPremiumUntil')
      .lean();
    return getPremiumSnapshot(fresh!).isPremium;
  };

  try {
    const owner = await mkUser('owner');
    const member = await mkUser('member');
    const outsider = await mkUser('outsider');

    section('Buying a licence');
    check('the owner starts without Premium', !(await isPremiumNow(owner)));

    const granted = await grantGroupLicense({ ownerId: owner, name: 'Jeugdgroep De Ark' });
    check('a grant returns a join code', Boolean(granted.joinCode), granted.joinCode);
    check(
      'the code avoids ambiguous characters',
      !/[IO01]/.test(granted.joinCode),
      granted.joinCode,
    );
    check('the buyer gets Premium immediately', await isPremiumNow(owner));
    check('the buyer occupies a seat', (await summarizeLicensesFor(owner))[0]?.seatsUsed === 1);

    section('Redeeming the code');
    check('a member starts without Premium', !(await isPremiumNow(member)));

    const joined = await joinGroupLicense(member, granted.joinCode.toLowerCase());
    check('a lowercase code still redeems', joined.ok);
    check("the member's isPremium flips to true", await isPremiumNow(member));
    check('membership is visible to the premium check', await hasGroupLicensePremium(member));
    check(
      'the member sees the licence in their own list',
      (await summarizeLicensesFor(member)).length === 1,
    );
    check(
      'the member is not marked as owner',
      (await summarizeLicensesFor(member))[0]?.isOwner === false,
    );

    const rejoined = await joinGroupLicense(member, granted.joinCode);
    check('redeeming twice is idempotent, not an error', rejoined.ok);
    check(
      'and does not consume a second seat',
      (await summarizeLicensesFor(owner))[0]?.seatsUsed === 2,
    );

    const badCode = await joinGroupLicense(outsider, 'ZZZZZZ');
    check('an unknown code is refused', !badCode.ok);

    section('Seat limit');
    // Fill the licence to its last seat by hand: creating 28 accounts to prove
    // an arithmetic rule is not worth the runtime.
    const licenseDoc = await GroupLicense.findById(granted.id);
    const filler = Array.from(
      { length: GROUP_LICENSE_SEATS - 2 },
      () => new mongoose.Types.ObjectId(),
    );
    licenseDoc!.memberIds.push(...filler);
    await licenseDoc!.save();

    const seatFull = await joinGroupLicense(outsider, granted.joinCode);
    check('a full licence refuses a new member', !seatFull.ok);
    check(
      'and says so in Dutch rather than a code',
      !seatFull.ok && seatFull.error.includes('zit vol'),
      !seatFull.ok ? seatFull.error : undefined,
    );
    check('the refused user gets no Premium', !(await isPremiumNow(outsider)));

    // Put it back so the ownership checks below run against a sane licence.
    licenseDoc!.memberIds = licenseDoc!.memberIds.filter(
      (id) => !filler.some((f) => f.equals(id)),
    );
    await licenseDoc!.save();

    section('Ownership');
    const selfRemoval = await removeGroupMember(owner, granted.id, owner);
    check('the owner cannot remove themselves', !selfRemoval.ok);
    check('the owner still has Premium afterwards', await isPremiumNow(owner));

    const memberRemovingOwner = await removeGroupMember(member, granted.id, owner);
    check('a member cannot remove the owner', !memberRemovingOwner.ok);

    const removed = await removeGroupMember(owner, granted.id, member);
    check('the owner can remove a member', removed.ok);
    check(
      "the removed member's Premium goes with it",
      !(await hasGroupLicensePremium(member)),
    );

    section('Expiry');
    const expiredOwner = await mkUser('expired');
    const expiredGrant = await grantGroupLicense({
      ownerId: expiredOwner,
      name: 'Verlopen groep',
      expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    });

    const joinExpired = await joinGroupLicense(outsider, expiredGrant.joinCode);
    check('an expired licence refuses a new member', !joinExpired.ok);
    check(
      'and an expired licence grants nobody Premium',
      !(await hasGroupLicensePremium(expiredOwner)),
    );

    section('Cancellation');
    const cancelOwner = await mkUser('cancelled');
    const subscriptionId = `sub_e2e_${stamp}`;
    await grantGroupLicense({
      ownerId: cancelOwner,
      name: 'Opgezegde groep',
      stripeSubscriptionId: subscriptionId,
    });
    check('the owner has Premium while it runs', await hasGroupLicensePremium(cancelOwner));

    // The default cancellation lets the group play out the term it paid for.
    await endGroupLicense(subscriptionId);
    check(
      'a plain cancellation leaves access until the paid-for date',
      await isPremiumNow(cancelOwner),
    );

    await endGroupLicense(subscriptionId, { immediate: true });
    check(
      'an immediate cancellation (a refund) takes access back now',
      !(await isPremiumNow(cancelOwner)),
    );
  } finally {
    await GroupLicense.deleteMany({ ownerId: { $in: createdUserIds } });
    await User.deleteMany({ _id: { $in: createdUserIds } });
    await mongoose.disconnect();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n\x1b[1m${results.length - failed.length}/${results.length} checks passed\x1b[0m`);
  if (failed.length) process.exit(1);
}

main().catch((error) => {
  console.error('CHECK ERROR', error);
  process.exit(1);
});
