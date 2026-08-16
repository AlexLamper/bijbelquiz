/**
 * The player mascot.
 *
 * Every account owns a small vector creature that stands in for a profile
 * photo: on the profile page, in the leaderboard, and next to their name in a
 * multiplayer lobby. It is stored as four short enum values rather than an
 * image, which keeps it in the user document, makes it free to render at any
 * size, and lets the Flutter app draw the identical figure offline.
 *
 * The geometry lives in `buildAvatarShapes` as a flat list of primitives. The
 * Dart port (`lib/core/avatar/avatar_catalog.dart`) mirrors this file shape for
 * shape, so a mascot looks the same on the website and in the app. Change one,
 * change the other.
 */

export type AvatarCharacter = 'lam' | 'leeuw' | 'duif' | 'uil' | 'hert' | 'os';
export type AvatarColor = 'zand' | 'lapis' | 'klei' | 'olijf' | 'roos' | 'leisteen';
export type AvatarBackground = 'perkament' | 'hemel' | 'salie' | 'zonsopgang' | 'nacht' | 'blos';
export type AvatarAccessory = 'geen' | 'bril' | 'pet' | 'sjaal' | 'kroon';

export interface AvatarConfig {
  character: AvatarCharacter;
  color: AvatarColor;
  background: AvatarBackground;
  accessory: AvatarAccessory;
}

export const DEFAULT_AVATAR: AvatarConfig = {
  character: 'lam',
  color: 'zand',
  background: 'perkament',
  accessory: 'geen',
};

/* ── Catalogue ────────────────────────────────────────────────────────────── */

export interface AvatarOption<T extends string> {
  id: T;
  label: string;
}

export const AVATAR_CHARACTERS: AvatarOption<AvatarCharacter>[] = [
  { id: 'lam', label: 'Lam' },
  { id: 'leeuw', label: 'Leeuw' },
  { id: 'duif', label: 'Duif' },
  { id: 'uil', label: 'Uil' },
  { id: 'hert', label: 'Hert' },
  { id: 'os', label: 'Os' },
];

interface ColorRamp {
  base: string;
  shade: string;
  light: string;
}

export const AVATAR_COLORS: (AvatarOption<AvatarColor> & ColorRamp)[] = [
  { id: 'zand', label: 'Zand', base: '#E2C48D', shade: '#C4A268', light: '#F2E3C6' },
  { id: 'lapis', label: 'Lapis', base: '#6A87C4', shade: '#4C68A2', light: '#CBD8EE' },
  { id: 'klei', label: 'Klei', base: '#CE8163', shade: '#AC6446', light: '#F0CDBD' },
  { id: 'olijf', label: 'Olijf', base: '#7E9A6B', shade: '#5F7A4E', light: '#D3E0C9' },
  { id: 'roos', label: 'Roos', base: '#D18BA0', shade: '#B06B81', light: '#F1D3DC' },
  { id: 'leisteen', label: 'Leisteen', base: '#8A93A6', shade: '#6A7386', light: '#D5DAE3' },
];

export const AVATAR_BACKGROUNDS: (AvatarOption<AvatarBackground> & { fill: string })[] = [
  { id: 'perkament', label: 'Perkament', fill: '#F1EFE9' },
  { id: 'hemel', label: 'Hemel', fill: '#DCE6F5' },
  { id: 'salie', label: 'Salie', fill: '#DFE9DC' },
  { id: 'zonsopgang', label: 'Zonsopgang', fill: '#FAE3D2' },
  { id: 'nacht', label: 'Nacht', fill: '#2A3242' },
  { id: 'blos', label: 'Blos', fill: '#F6E0E6' },
];

export const AVATAR_ACCESSORIES: AvatarOption<AvatarAccessory>[] = [
  { id: 'geen', label: 'Geen' },
  { id: 'bril', label: 'Bril' },
  { id: 'pet', label: 'Pet' },
  { id: 'sjaal', label: 'Sjaal' },
  { id: 'kroon', label: 'Kroon' },
];

const INK = '#1B1A18';
const CREAM = '#F7F3EA';
const BEAK = '#E0A24B';
const GOLD = '#D9A441';
const CAP = '#35548C';
const SCARF = '#A04A2F';

/* ── Parsing ──────────────────────────────────────────────────────────────── */

function pick<T extends string>(options: { id: T }[], value: unknown, fallback: T): T {
  return options.some((option) => option.id === value) ? (value as T) : fallback;
}

/**
 * Coerce anything stored or posted into a valid config.
 *
 * Unknown ids fall back to the default part rather than failing, so a client
 * built against a newer catalogue can never write a mascot that an older one
 * refuses to draw.
 */
export function normalizeAvatar(value: unknown): AvatarConfig {
  const raw = (value ?? {}) as Partial<Record<keyof AvatarConfig, unknown>>;

  return {
    character: pick(AVATAR_CHARACTERS, raw.character, DEFAULT_AVATAR.character),
    color: pick(AVATAR_COLORS, raw.color, DEFAULT_AVATAR.color),
    background: pick(AVATAR_BACKGROUNDS, raw.background, DEFAULT_AVATAR.background),
    accessory: pick(AVATAR_ACCESSORIES, raw.accessory, DEFAULT_AVATAR.accessory),
  };
}

/**
 * A stable mascot for an account that has never opened the customiser.
 *
 * Deriving it from the user id means the leaderboard is a wall of different
 * creatures on day one instead of the same beige lamb repeated forty times,
 * and the same account keeps the same face until they choose otherwise.
 */
export function avatarFromSeed(seed: string): AvatarConfig {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return {
    character: AVATAR_CHARACTERS[hash % AVATAR_CHARACTERS.length].id,
    color: AVATAR_COLORS[Math.floor(hash / 7) % AVATAR_COLORS.length].id,
    background: AVATAR_BACKGROUNDS[Math.floor(hash / 53) % AVATAR_BACKGROUNDS.length].id,
    accessory: 'geen',
  };
}

/** The stored config when set, otherwise a seeded one. Never null. */
export function resolveAvatar(stored: unknown, seed: string): AvatarConfig {
  if (stored && typeof stored === 'object' && (stored as { character?: unknown }).character) {
    return normalizeAvatar(stored);
  }

  return avatarFromSeed(seed || 'bijbelquiz');
}

/* ── Geometry ─────────────────────────────────────────────────────────────── */

export type AvatarShape =
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: string }
  | { kind: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill: string; rotate?: number }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx: number; fill: string; rotate?: number }
  | { kind: 'path'; d: string; fill?: string; stroke?: string; strokeWidth?: number }
  | { kind: 'ring'; cx: number; cy: number; r: number; stroke: string; strokeWidth: number };

function ramp(color: AvatarColor): ColorRamp {
  const found = AVATAR_COLORS.find((entry) => entry.id === color);
  return found ?? AVATAR_COLORS[0];
}

export function avatarBackgroundFill(background: AvatarBackground): string {
  const found = AVATAR_BACKGROUNDS.find((entry) => entry.id === background);
  return (found ?? AVATAR_BACKGROUNDS[0]).fill;
}

/** Head centre and radii, shared by every species so faces always line up. */
const HEAD = { cx: 50, cy: 56, rx: 26, ry: 24 };

function eyes(offsetY = 0, radius = 4.4): AvatarShape[] {
  const y = 52 + offsetY;
  return [
    { kind: 'circle', cx: 40.5, cy: y, r: radius, fill: CREAM },
    { kind: 'circle', cx: 59.5, cy: y, r: radius, fill: CREAM },
    { kind: 'circle', cx: 41.4, cy: y + 0.4, r: radius * 0.55, fill: INK },
    { kind: 'circle', cx: 60.4, cy: y + 0.4, r: radius * 0.55, fill: INK },
    { kind: 'circle', cx: 39.9, cy: y - 1.1, r: radius * 0.2, fill: CREAM },
    { kind: 'circle', cx: 58.9, cy: y - 1.1, r: radius * 0.2, fill: CREAM },
  ];
}

function smile(y = 66): AvatarShape {
  return {
    kind: 'path',
    d: `M44 ${y} Q50 ${y + 4.5} 56 ${y}`,
    stroke: INK,
    strokeWidth: 2,
  };
}

/**
 * Every primitive that makes up one mascot, painted back to front.
 *
 * Kept as data rather than markup so the React renderer and the Dart renderer
 * can each turn the same list into their own output.
 */
export function buildAvatarShapes(config: AvatarConfig): AvatarShape[] {
  const { base, shade, light } = ramp(config.color);
  const shapes: AvatarShape[] = [
    { kind: 'rect', x: 0, y: 0, width: 100, height: 100, rx: 50, fill: avatarBackgroundFill(config.background) },
  ];

  switch (config.character) {
    case 'lam': {
      shapes.push(
        { kind: 'ellipse', cx: 22, cy: 54, rx: 9, ry: 5.5, fill: shade, rotate: -28 },
        { kind: 'ellipse', cx: 78, cy: 54, rx: 9, ry: 5.5, fill: shade, rotate: 28 },
        { kind: 'circle', cx: 33, cy: 36, r: 11, fill: light },
        { kind: 'circle', cx: 50, cy: 30, r: 12, fill: light },
        { kind: 'circle', cx: 67, cy: 36, r: 11, fill: light },
        { kind: 'ellipse', cx: HEAD.cx, cy: HEAD.cy, rx: HEAD.rx, ry: HEAD.ry, fill: base },
        { kind: 'ellipse', cx: 50, cy: 64, rx: 11, ry: 8, fill: light },
        ...eyes(),
        { kind: 'ellipse', cx: 50, cy: 62, rx: 2.6, ry: 2, fill: INK },
        smile(66),
      );
      break;
    }

    case 'leeuw': {
      for (let index = 0; index < 12; index += 1) {
        const angle = (Math.PI * 2 * index) / 12;
        shapes.push({
          kind: 'circle',
          cx: 50 + Math.cos(angle) * 29,
          cy: 56 + Math.sin(angle) * 27,
          r: 9.5,
          fill: shade,
        });
      }
      shapes.push(
        { kind: 'circle', cx: 31, cy: 39, r: 6.5, fill: base },
        { kind: 'circle', cx: 69, cy: 39, r: 6.5, fill: base },
        { kind: 'ellipse', cx: HEAD.cx, cy: HEAD.cy, rx: HEAD.rx, ry: HEAD.ry, fill: base },
        { kind: 'ellipse', cx: 50, cy: 65, rx: 12, ry: 8.5, fill: light },
        ...eyes(),
        { kind: 'path', d: 'M46.5 61.5 L53.5 61.5 L50 65.5 Z', fill: INK },
        smile(67),
      );
      break;
    }

    case 'duif': {
      shapes.push(
        { kind: 'ellipse', cx: 19, cy: 62, rx: 10, ry: 17, fill: shade, rotate: -22 },
        { kind: 'ellipse', cx: 81, cy: 62, rx: 10, ry: 17, fill: shade, rotate: 22 },
        { kind: 'circle', cx: 44, cy: 30, r: 4, fill: light },
        { kind: 'circle', cx: 52, cy: 27, r: 4.5, fill: light },
        { kind: 'circle', cx: 60, cy: 30, r: 4, fill: light },
        { kind: 'ellipse', cx: HEAD.cx, cy: HEAD.cy, rx: HEAD.rx, ry: HEAD.ry, fill: base },
        ...eyes(-2),
        { kind: 'path', d: 'M43.5 61 L56.5 61 L50 71 Z', fill: BEAK },
        { kind: 'ellipse', cx: 30, cy: 60, rx: 5, ry: 3.5, fill: light },
        { kind: 'ellipse', cx: 70, cy: 60, rx: 5, ry: 3.5, fill: light },
      );
      break;
    }

    case 'uil': {
      shapes.push(
        { kind: 'path', d: 'M27 44 L31 25 L44 36 Z', fill: shade },
        { kind: 'path', d: 'M73 44 L69 25 L56 36 Z', fill: shade },
        { kind: 'ellipse', cx: HEAD.cx, cy: HEAD.cy, rx: HEAD.rx, ry: HEAD.ry, fill: base },
        { kind: 'circle', cx: 39, cy: 52, r: 12.5, fill: light },
        { kind: 'circle', cx: 61, cy: 52, r: 12.5, fill: light },
        { kind: 'circle', cx: 39.8, cy: 52.5, r: 5.6, fill: INK },
        { kind: 'circle', cx: 60.2, cy: 52.5, r: 5.6, fill: INK },
        { kind: 'circle', cx: 37.6, cy: 50.3, r: 1.9, fill: CREAM },
        { kind: 'circle', cx: 58, cy: 50.3, r: 1.9, fill: CREAM },
        { kind: 'path', d: 'M45.5 62 L54.5 62 L50 70 Z', fill: BEAK },
        { kind: 'path', d: 'M34 72 Q50 79 66 72', stroke: shade, strokeWidth: 2.4 },
      );
      break;
    }

    case 'hert': {
      shapes.push(
        {
          kind: 'path',
          d: 'M38 38 L33 24 M33 24 L26 20 M33 24 L34 15',
          stroke: shade,
          strokeWidth: 3.4,
        },
        {
          kind: 'path',
          d: 'M62 38 L67 24 M67 24 L74 20 M67 24 L66 15',
          stroke: shade,
          strokeWidth: 3.4,
        },
        { kind: 'ellipse', cx: 24, cy: 47, rx: 8, ry: 5, fill: shade, rotate: -35 },
        { kind: 'ellipse', cx: 76, cy: 47, rx: 8, ry: 5, fill: shade, rotate: 35 },
        { kind: 'ellipse', cx: HEAD.cx, cy: HEAD.cy, rx: HEAD.rx, ry: HEAD.ry, fill: base },
        { kind: 'ellipse', cx: 50, cy: 66, rx: 10, ry: 7.5, fill: light },
        ...eyes(),
        { kind: 'ellipse', cx: 50, cy: 63.5, rx: 3, ry: 2.2, fill: INK },
        smile(68),
      );
      break;
    }

    case 'os': {
      shapes.push(
        {
          kind: 'path',
          d: 'M30 40 Q14 38 12 24 Q22 30 32 30',
          fill: CREAM,
        },
        {
          kind: 'path',
          d: 'M70 40 Q86 38 88 24 Q78 30 68 30',
          fill: CREAM,
        },
        { kind: 'ellipse', cx: 22, cy: 50, rx: 8, ry: 5.5, fill: shade, rotate: -20 },
        { kind: 'ellipse', cx: 78, cy: 50, rx: 8, ry: 5.5, fill: shade, rotate: 20 },
        { kind: 'ellipse', cx: HEAD.cx, cy: HEAD.cy, rx: HEAD.rx, ry: HEAD.ry, fill: base },
        { kind: 'rect', x: 37, y: 60, width: 26, height: 15, rx: 7.5, fill: light },
        ...eyes(-2),
        { kind: 'ellipse', cx: 44.5, cy: 67, rx: 2.2, ry: 2.8, fill: INK },
        { kind: 'ellipse', cx: 55.5, cy: 67, rx: 2.2, ry: 2.8, fill: INK },
      );
      break;
    }
  }

  switch (config.accessory) {
    case 'bril':
      shapes.push(
        { kind: 'ring', cx: 40.5, cy: 52, r: 8.5, stroke: INK, strokeWidth: 2.2 },
        { kind: 'ring', cx: 59.5, cy: 52, r: 8.5, stroke: INK, strokeWidth: 2.2 },
        { kind: 'path', d: 'M49 52 L51 52', stroke: INK, strokeWidth: 2.2 },
      );
      break;

    case 'pet':
      shapes.push(
        { kind: 'path', d: 'M25 40 Q50 18 75 40 Z', fill: CAP },
        { kind: 'rect', x: 22, y: 38, width: 56, height: 6, rx: 3, fill: '#2A4373' },
      );
      break;

    case 'sjaal':
      shapes.push(
        { kind: 'rect', x: 27, y: 76, width: 46, height: 10, rx: 5, fill: SCARF },
        { kind: 'rect', x: 60, y: 82, width: 10, height: 16, rx: 4, fill: '#883B23', rotate: 12 },
      );
      break;

    case 'kroon':
      shapes.push(
        { kind: 'path', d: 'M30 34 L36 20 L43 30 L50 16 L57 30 L64 20 L70 34 Z', fill: GOLD },
        { kind: 'circle', cx: 36, cy: 20, r: 2.4, fill: CREAM },
        { kind: 'circle', cx: 50, cy: 16, r: 2.8, fill: CREAM },
        { kind: 'circle', cx: 64, cy: 20, r: 2.4, fill: CREAM },
      );
      break;

    case 'geen':
    default:
      break;
  }

  return shapes;
}

/** A short human label, e.g. "Lam met kroon". Used in alt text and pickers. */
export function describeAvatar(config: AvatarConfig): string {
  const character = AVATAR_CHARACTERS.find((entry) => entry.id === config.character)?.label ?? 'Mascotte';
  if (config.accessory === 'geen') {
    return character;
  }

  const accessory = AVATAR_ACCESSORIES.find((entry) => entry.id === config.accessory)?.label ?? '';
  return `${character} met ${accessory.toLowerCase()}`;
}
