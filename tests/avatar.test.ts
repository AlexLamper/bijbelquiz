import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AVATAR_ACCESSORIES,
  AVATAR_BACKGROUNDS,
  AVATAR_CHARACTERS,
  AVATAR_COLORS,
  DEFAULT_AVATAR,
  avatarFromSeed,
  buildAvatarShapes,
  describeAvatar,
  normalizeAvatar,
  resolveAvatar,
} from '@/lib/avatar';

test('unknown catalogue ids fall back instead of throwing', () => {
  const avatar = normalizeAvatar({
    character: 'draak',
    color: 'neon',
    background: 'perkament',
    accessory: undefined,
  });

  assert.equal(avatar.character, DEFAULT_AVATAR.character);
  assert.equal(avatar.color, DEFAULT_AVATAR.color);
  assert.equal(avatar.background, 'perkament');
  assert.equal(avatar.accessory, DEFAULT_AVATAR.accessory);
});

test('normalizing null yields a drawable default', () => {
  assert.deepEqual(normalizeAvatar(null), DEFAULT_AVATAR);
  assert.deepEqual(normalizeAvatar(undefined), DEFAULT_AVATAR);
});

test('a seeded mascot is stable for the same account', () => {
  const first = avatarFromSeed('507f1f77bcf86cd799439011');
  const second = avatarFromSeed('507f1f77bcf86cd799439011');

  assert.deepEqual(first, second);
});

test('different accounts get different seeded mascots', () => {
  const seeds = ['user-a', 'user-b', 'user-c', 'user-d', 'user-e'];
  const drawn = new Set(seeds.map((seed) => JSON.stringify(avatarFromSeed(seed))));

  // A fresh leaderboard has to look like a crowd, not forty identical lambs.
  assert.ok(drawn.size > 1);
});

test('resolveAvatar prefers what the user stored', () => {
  const stored = resolveAvatar(
    { character: 'uil', color: 'lapis', background: 'nacht', accessory: 'kroon' },
    'ignored-seed',
  );

  assert.equal(stored.character, 'uil');
  assert.equal(stored.accessory, 'kroon');
});

test('resolveAvatar seeds when nothing is stored', () => {
  const derived = resolveAvatar(null, 'abc123');
  assert.deepEqual(derived, avatarFromSeed('abc123'));
});

test('a half-written avatar document is repaired, not rejected', () => {
  const partial = resolveAvatar({ character: 'hert' }, 'abc123');

  assert.equal(partial.character, 'hert');
  assert.equal(partial.color, DEFAULT_AVATAR.color);
});

test('every combination produces drawable shapes', () => {
  for (const character of AVATAR_CHARACTERS) {
    for (const accessory of AVATAR_ACCESSORIES) {
      const shapes = buildAvatarShapes({
        character: character.id,
        color: 'zand',
        background: 'perkament',
        accessory: accessory.id,
      });

      assert.ok(shapes.length > 3, `${character.id}/${accessory.id} drew almost nothing`);
      // The backdrop is always first, so the figure never floats on nothing.
      assert.equal(shapes[0].kind, 'rect');
    }
  }
});

test('the chosen colour and background reach the shapes', () => {
  const shapes = buildAvatarShapes({
    character: 'lam',
    color: 'klei',
    background: 'nacht',
    accessory: 'geen',
  });

  const fills = shapes.map((shape) => ('fill' in shape ? shape.fill : undefined));

  assert.ok(fills.includes('#2A3242'));
  assert.ok(fills.includes('#CE8163'));
});

test('describeAvatar names the accessory only when there is one', () => {
  assert.equal(
    describeAvatar({ character: 'leeuw', color: 'zand', background: 'hemel', accessory: 'geen' }),
    'Leeuw',
  );
  assert.equal(
    describeAvatar({ character: 'leeuw', color: 'zand', background: 'hemel', accessory: 'kroon' }),
    'Leeuw met kroon',
  );
});

test('the catalogue the Flutter app mirrors has not shifted', () => {
  // The app ships its own copy of these ids and hex values (see
  // `lib/core/avatar/avatar_catalog.dart`). Adding a part is fine; renaming or
  // reordering one silently changes what every seeded account looks like on
  // whichever platform updates second, so this pins them.
  assert.deepEqual(
    AVATAR_CHARACTERS.map((option) => option.id),
    ['lam', 'leeuw', 'duif', 'uil', 'hert', 'os'],
  );
  assert.deepEqual(
    AVATAR_COLORS.map((option) => option.id),
    ['zand', 'lapis', 'klei', 'olijf', 'roos', 'leisteen'],
  );
  assert.deepEqual(
    AVATAR_BACKGROUNDS.map((option) => option.id),
    ['perkament', 'hemel', 'salie', 'zonsopgang', 'nacht', 'blos'],
  );
  assert.deepEqual(
    AVATAR_ACCESSORIES.map((option) => option.id),
    ['geen', 'bril', 'pet', 'sjaal', 'kroon'],
  );
});
