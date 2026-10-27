#!/usr/bin/env node
/**
 * Draws and rasterises one cover per quiz, in the "Licht landschap" style.
 *
 * WHY THIS EXISTS
 *
 * Most quizzes would otherwise share their category's picture. Instead every
 * quiz gets a cover drawn here: a light silhouette landscape composed from
 * `lib/quiz-cover-scenes*.mts` (one scene per slug, matched to the chapter the
 * quiz asks about) through `lib/quiz-cover-scene-kit.mts` (sky, haze, depth
 * layers, sun, one palette per book group).
 *
 * SVG in, PNG out. The art is deterministic - every random number comes from a
 * seed derived from the slug - so re-running produces the same files and a
 * rerun is never a silent redesign.
 *
 * The slug list is `src/lib/quiz-covers.generated.ts`: every slug in it gets
 * public/images/quizzes/<slug>.png (1408x792) and
 * public/images/quizzes/thumbs/<slug>.webp (800x450, the settings of
 * generate-quiz-thumbnails.py). Pass `--add <slug>` to put a new quiz on the list.
 *
 * USAGE
 *   node --import tsx scripts/generate-quiz-covers.mts                 # all covers + thumbs
 *   node --import tsx scripts/generate-quiz-covers.mts marcus-bijbelquiz-deel-1 ...
 *   node --import tsx scripts/generate-quiz-covers.mts --book jesaja   # one book
 *   node --import tsx scripts/generate-quiz-covers.mts --sheets <dir>  # + a contact sheet per book
 *   node --import tsx scripts/generate-quiz-covers.mts --sheet <file.png> # + one sheet of everything drawn
 *   node --import tsx scripts/generate-quiz-covers.mts --out <dir>     # render elsewhere (no thumbs, no slug list)
 *   node --import tsx scripts/generate-quiz-covers.mts --svg           # keep the .svg too
 *   node --import tsx scripts/generate-quiz-covers.mts --add <slug>    # a new quiz (needs a scene)
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { SCENES, SCENE_MODULES, renderScene } from './lib/quiz-cover-scenes.mjs';
import { H, W } from './lib/quiz-cover-primitives.mjs';
import { bookOf } from './lib/quiz-cover-scene-kit.mjs';

// A slug defined in two scene modules would be drawn by whichever module is
// spread last, silently. Refuse instead.
{
  const owner = new Map<string, string>();
  for (const [name, scenes] of Object.entries(SCENE_MODULES)) {
    for (const slug of Object.keys(scenes)) {
      const previous = owner.get(slug);
      if (previous) {
        console.error(`Scene "${slug}" is defined in both ${previous} and ${name}.`);
        process.exit(1);
      }
      owner.set(slug, name);
    }
  }
}

const root = process.cwd();
const argv = process.argv.slice(2);
const flag = (name: string) => argv.includes(name);
const value = (name: string) => {
  const i = argv.indexOf(name);
  return i === -1 ? undefined : argv[i + 1];
};
const valued = new Set(['--out', '--book', '--sheets', '--sheet', '--add']);
const only = argv.filter((a, i) => !a.startsWith('--') && !valued.has(argv[i - 1]));
const keepSvg = flag('--svg');
const outArg = value('--out');
const book = value('--book');
const sheetsArg = value('--sheets');
const sheetArg = value('--sheet');
const added = value('--add');

const generated = path.join(root, 'src/lib/quiz-covers.generated.ts');
const previous = fs.readFileSync(generated, 'utf8');
const listed = [...previous.matchAll(/^ {2}'([^']+)',$/gm)].map((m) => m[1]);
const allSlugs = [...new Set([...listed, ...(added ? [added] : [])])].sort();

const missing = allSlugs.filter((s) => !SCENES[s]);
if (missing.length) {
  console.error(`No scene defined for: ${missing.join(', ')}`);
  process.exit(1);
}
const extra = Object.keys(SCENES).filter((s) => !allSlugs.includes(s));
if (extra.length) console.warn(`Scenes not on the slug list (not drawn; use --add): ${extra.join(', ')}`);

let targets = allSlugs;
if (only.length) targets = targets.filter((s) => only.includes(s));
if (book) targets = targets.filter((s) => bookOf(s) === book);
if (!targets.length) {
  console.error(`Nothing matched: ${[...only, book ?? ''].join(' ')}`);
  process.exit(1);
}

const outDir = path.join(root, outArg ?? 'public/images/quizzes');
const thumbDir = outArg ? null : path.join(outDir, 'thumbs');
fs.mkdirSync(outDir, { recursive: true });
if (thumbDir) fs.mkdirSync(thumbDir, { recursive: true });

let bytes = 0;
const t0 = Date.now();
for (const slug of targets) {
  const svg = renderScene(slug);
  if (keepSvg) fs.writeFileSync(path.join(outDir, `${slug}.svg`), svg, 'utf8');
  const file = path.join(outDir, `${slug}.png`);
  const png = await sharp(Buffer.from(svg), { density: 144 })
    .resize(W, H)
    // A palette PNG holds this kind of art at a fraction of the size; the
    // dither keeps the sky gradients from banding.
    .png({ palette: true, colors: 240, dither: 0.8, compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(file, png);
  bytes += png.length;
  // Same size and quality as scripts/generate-quiz-thumbnails.py (800 wide, WebP q78, method 6).
  if (thumbDir) {
    await sharp(png)
      .resize(800, Math.round((H * 800) / W), { kernel: 'lanczos3' })
      .webp({ quality: 78, effort: 6 })
      .toFile(path.join(thumbDir, `${slug}.webp`));
  }
}

console.log(
  `Wrote ${targets.length} covers to ${path.relative(root, outDir)}${thumbDir ? ' (+ thumbs)' : ''} ` +
    `(${W}x${H}, ${(bytes / 1024 / 1024).toFixed(1)} MB, ${Math.round(bytes / targets.length / 1024)} KB average, ` +
    `${Math.round((Date.now() - t0) / targets.length)} ms per cover).`,
);

if (sheetsArg) {
  // One sheet per book, at thumbnail size: a series only reads as a family,
  // and repeats only show, when the covers are side by side.
  const sheetDir = path.join(root, sheetsArg);
  fs.mkdirSync(sheetDir, { recursive: true });
  const byBook = new Map<string, string[]>();
  for (const slug of targets) byBook.set(bookOf(slug), [...(byBook.get(bookOf(slug)) ?? []), slug]);
  for (const [name, slugs] of byBook) {
    const order = slugs.sort((a, b) => (Number(a.match(/(\d+)$/)?.[1] ?? 0) - Number(b.match(/(\d+)$/)?.[1] ?? 0)) || a.localeCompare(b));
    const file = path.join(sheetDir, `${name}.png`);
    await contactSheet(order.map((s) => ({ file: path.join(outDir, `${s}.png`), label: s.replace(/-bijbelquiz-deel-/, ' ') })), file, 6);
  }
  console.log(`Contact sheets: ${path.relative(root, sheetDir)} (${byBook.size})`);
}

if (sheetArg) {
  await contactSheet(targets.map((s) => ({ file: path.join(outDir, `${s}.png`), label: s.replace(/-bijbelquiz-deel-/, ' ') })), path.join(root, sheetArg), 6);
  console.log(`Contact sheet: ${sheetArg}`);
}

/** A grid of covers with a small label under each. */
export async function contactSheet(items: { file: string; label: string }[], file: string, cols = 6): Promise<void> {
  const cw = 300;
  const ch = 169;
  const lab = 22;
  const g = 8;
  const rows = Math.ceil(items.length / cols);
  const width = cols * (cw + g) + g;
  const height = rows * (ch + lab + g) + g;
  const tiles: sharp.OverlayOptions[] = [];
  const text: string[] = [];
  for (let i = 0; i < items.length; i += 1) {
    const x = g + (i % cols) * (cw + g);
    const y = g + Math.floor(i / cols) * (ch + lab + g);
    tiles.push({ input: await sharp(items[i].file).resize(cw, ch, { kernel: 'lanczos3' }).png().toBuffer(), left: x, top: y });
    text.push(`<text x="${x + 2}" y="${y + ch + 16}" font-family="DejaVu Sans" font-size="13" fill="#333">${items[i].label}</text>`);
  }
  tiles.push({ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${text.join('')}</svg>`), left: 0, top: 0 });
  await sharp({ create: { width, height, channels: 3, background: '#ECEAE4' } }).composite(tiles).png().toFile(file);
}

// The runtime needs to know which slugs have a cover, and it cannot read the
// folder - the answer is needed in a browser bundle. Rewritten only after a
// full run into the real folder, so it never describes a partial render.
if (!only.length && !book && !outArg) {
  const header = previous.slice(0, previous.indexOf('const SLUGS'));
  fs.writeFileSync(
    generated,
    `${header}const SLUGS = [\n${allSlugs.map((s) => `  '${s}',`).join('\n')}\n] as const;\n\n` +
      `export const QUIZ_COVER_SLUGS: ReadonlySet<string> = new Set(SLUGS);\n\n` +
      `/** The drawn cover for this slug, or null when none was rendered for it. */\n` +
      `export function coverForSlug(slug: string | null | undefined): string | null {\n` +
      `  if (!slug) return null;\n` +
      `  const key = slug.trim().toLowerCase();\n` +
      `  return QUIZ_COVER_SLUGS.has(key) ? \`/images/quizzes/\${key}.png\` : null;\n` +
      `}\n`,
    'utf8',
  );
  console.log(`Slug list: ${path.relative(root, generated)} (${allSlugs.length} covers).`);
}
