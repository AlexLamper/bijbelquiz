#!/usr/bin/env node
/**
 * Draws and rasterises one cover per quiz.
 *
 * WHY THIS EXISTS
 *
 * 87 of the 101 quizzes rendered the same two images, because a quiz with no
 * `imageUrl` of its own falls back to its category's picture. Buying 95
 * illustrations was not on the table, so the covers are drawn here instead:
 * flat vector scenes composed from `lib/quiz-cover-primitives.mts`, one per
 * quiz, matched to the Bible chapter that quiz actually asks about.
 *
 * SVG in, PNG out. The art is deterministic - every random number comes from a
 * seed derived from the slug - so re-running produces byte-identical files and
 * a rerun is never a silent redesign.
 *
 * USAGE
 *   node --import tsx scripts/generate-quiz-covers.mts                # all
 *   node --import tsx scripts/generate-quiz-covers.mts marcus-bijbelquiz-deel-1
 *   node --import tsx scripts/generate-quiz-covers.mts --svg          # keep .svg too
 *   node --import tsx scripts/generate-quiz-covers.mts --sheet        # + contact sheet
 *   node --import tsx scripts/generate-quiz-covers.mts --out <dir>
 *
 * Then point the database at them:
 *   node --import tsx scripts/assign-quiz-images.mts --apply
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';
import { SCENES, renderScene } from './lib/quiz-cover-scenes.mjs';
import { H, W } from './lib/quiz-cover-primitives.mjs';

type ManifestQuiz = { slug: string; title: string; file: string; imageUrl: string; scene: string };
type Manifest = { template: string; targetDir: string; quizzes: ManifestQuiz[] };

const root = process.cwd();
const argv = process.argv.slice(2);
const keepSvg = argv.includes('--svg');
const wantSheet = argv.includes('--sheet');
const outIdx = argv.indexOf('--out');
const only = argv.filter((a, i) => !a.startsWith('--') && !(outIdx !== -1 && i === outIdx + 1));

const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'docs/quiz-image-prompts/manifest.json'), 'utf8'),
) as Manifest;

const outDir = path.join(root, outIdx === -1 ? manifest.targetDir : argv[outIdx + 1]);
fs.mkdirSync(outDir, { recursive: true });

const missing = manifest.quizzes.filter((q) => !SCENES[q.slug]);
if (missing.length) {
  console.error(`No scene defined for: ${missing.map((q) => q.slug).join(', ')}`);
  process.exit(1);
}
const extra = Object.keys(SCENES).filter((s) => !manifest.quizzes.some((q) => q.slug === s));
if (extra.length) console.warn(`Scenes with no manifest entry (ignored): ${extra.join(', ')}`);

const targets = only.length ? manifest.quizzes.filter((q) => only.includes(q.slug)) : manifest.quizzes;
if (!targets.length) {
  console.error(`Nothing matched: ${only.join(', ')}`);
  process.exit(1);
}

let bytes = 0;
for (const quiz of targets) {
  const svg = renderScene(quiz.slug);
  if (keepSvg) fs.writeFileSync(path.join(outDir, `${quiz.slug}.svg`), svg, 'utf8');

  const file = path.join(outDir, quiz.file);
  await sharp(Buffer.from(svg), { density: 144 })
    .resize(W, H)
    // A palette PNG holds this kind of flat art at a fifth of the size; the
    // dither keeps the sky gradients from banding.
    .png({ palette: true, colors: 200, dither: 1, compressionLevel: 9 })
    .toFile(file);
  bytes += fs.statSync(file).size;
}

if (wantSheet) {
  // One image of the whole set. Ninety-nine covers are only "a family" if you
  // can see them side by side, and opening them one at a time will not tell you.
  const cols = 8;
  const cw = 260;
  const ch = 146;
  const rows = Math.ceil(targets.length / cols);
  const tiles = [];
  for (let i = 0; i < targets.length; i += 1) {
    tiles.push({
      input: await sharp(path.join(outDir, targets[i].file)).resize(cw - 4, ch - 4).png().toBuffer(),
      left: (i % cols) * cw + 2,
      top: Math.floor(i / cols) * ch + 2,
    });
  }
  const sheet = path.join(root, 'docs/quiz-image-prompts/contact-sheet.png');
  fs.mkdirSync(path.dirname(sheet), { recursive: true });
  await sharp({ create: { width: cols * cw, height: rows * ch, channels: 3, background: '#111111' } })
    .composite(tiles)
    .png()
    .toFile(sheet);
  console.log(`Contact sheet: ${path.relative(root, sheet)}`);
}

console.log(
  `Wrote ${targets.length} covers to ${path.relative(root, outDir)} ` +
    `(${W}x${H}, ${(bytes / 1024 / 1024).toFixed(1)} MB total, ` +
    `${Math.round(bytes / targets.length / 1024)} KB average).`,
);

// The runtime needs to know which slugs have a cover, and it cannot read the
// folder - the answer is needed in a browser bundle. Writing the list here,
// from the same manifest that was just drawn, is what keeps it honest: the
// list cannot name a file this script did not produce. Only skipped when the
// run was narrowed to a few slugs or redirected elsewhere, because then it
// would describe a partial render.
if (!only.length && outIdx === -1) {
  const slugs = [...new Set(manifest.quizzes.map((q) => q.slug))].sort();
  const generated = path.join(root, 'src/lib/quiz-covers.generated.ts');
  const previous = fs.existsSync(generated) ? fs.readFileSync(generated, 'utf8') : '';
  const header = previous.slice(0, previous.indexOf('const SLUGS'));

  fs.writeFileSync(
    generated,
    `${header}const SLUGS = [\n${slugs.map((s) => `  '${s}',`).join('\n')}\n] as const;\n\n` +
      `export const QUIZ_COVER_SLUGS: ReadonlySet<string> = new Set(SLUGS);\n\n` +
      `/** The drawn cover for this slug, or null when none was rendered for it. */\n` +
      `export function coverForSlug(slug: string | null | undefined): string | null {\n` +
      `  if (!slug) return null;\n` +
      `  const key = slug.trim().toLowerCase();\n` +
      `  return QUIZ_COVER_SLUGS.has(key) ? \`/images/quizzes/\${key}.png\` : null;\n` +
      `}\n`,
    'utf8',
  );
  console.log(`Slug list: ${path.relative(root, generated)} (${slugs.length} covers).`);
}
