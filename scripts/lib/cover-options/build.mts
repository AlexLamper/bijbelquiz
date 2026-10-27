#!/usr/bin/env node
/**
 * Renders the cover style options for the six sample quizzes.
 *
 * Output goes ONLY to .local/cover-options/ - the real covers
 * (public/images/quizzes, src/lib/quiz-covers.generated.ts) are not touched.
 *
 *   node --import tsx scripts/lib/cover-options/build.mts            # all options + sheets + index
 *   node --import tsx scripts/lib/cover-options/build.mts a c        # only options A and C (no index)
 *   node --import tsx scripts/lib/cover-options/build.mts --svg      # keep the SVG next to each PNG
 *
 * Text (option D's chapter numeral, the comparison sheets) is set in Fredoka
 * and Nunito. librsvg finds them through fontconfig, so this script points
 * FONTCONFIG_FILE at .local/cover-options/_fonts before sharp loads.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const outRoot = path.join(root, '.local/cover-options');
const fontDir = path.join(outRoot, '_fonts');
if (fs.existsSync(fontDir)) {
  const conf = path.join(fontDir, 'fonts.conf');
  fs.writeFileSync(
    conf,
    `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><include ignore_missing="yes">/etc/fonts/fonts.conf</include><dir>${fontDir}</dir><cachedir>${path.join(fontDir, 'cache')}</cachedir></fontconfig>`,
  );
  process.env.FONTCONFIG_FILE = conf;
}

const { default: sharp } = await import('sharp');
const { SAMPLES } = await import('./samples.mjs');
const { OPTIONS } = await import('./options.mjs');
const { writeSheet } = await import('./sheet.mjs');
const { writeIndex } = await import('./index-page.mjs');

const argv = process.argv.slice(2);
const keepSvg = argv.includes('--svg');
const picked = argv.filter((a) => !a.startsWith('--')).map((a) => a.toLowerCase());
const options = picked.length ? OPTIONS.filter((o) => picked.includes(o.letter.toLowerCase())) : OPTIONS;

export const FULL = { w: 1408, h: 792 };
export const THUMB = { w: 400, h: 225 };

for (const option of options) {
  const dir = path.join(outRoot, option.id);
  fs.mkdirSync(path.join(dir, 'thumbs'), { recursive: true });
  const t0 = Date.now();
  for (const sample of SAMPLES) {
    const svg = option.render(sample);
    if (keepSvg) fs.writeFileSync(path.join(dir, `${sample.slug}.svg`), svg);
    const full = path.join(dir, `${sample.slug}.png`);
    await sharp(Buffer.from(svg), { density: 72 })
      .resize(FULL.w, FULL.h)
      .png({ palette: true, colors: 250, dither: 0.6, compressionLevel: 9 })
      .toFile(full);
    // Thumbnail from the full PNG, the way generate-quiz-thumbnails.py does it.
    await sharp(full).resize(THUMB.w, THUMB.h, { kernel: 'lanczos3' }).png().toFile(path.join(dir, 'thumbs', `${sample.slug}.png`));
    await sharp(full).resize(800, 450).webp({ quality: 82 }).toFile(path.join(dir, 'thumbs', `${sample.slug}.webp`));
  }
  const ms = (Date.now() - t0) / SAMPLES.length;
  await writeSheet(option, dir);
  console.log(`${option.letter} ${option.name}: 6 covers, ${Math.round(ms)} ms per cover -> ${path.relative(root, dir)}`);
}

if (!picked.length) {
  writeIndex(outRoot);
  console.log(`index: ${path.relative(root, path.join(outRoot, 'index.html'))}`);
}
