#!/usr/bin/env node
/**
 * Renders the scenes of one scene module to PNG so they can be looked at
 * while they are being written, without touching the manifest or the real
 * cover folder.
 *
 * USAGE
 *   node --import tsx scripts/lib/quiz-cover-preview.mts <module> <EXPORT> --out <dir> [slug...]
 *
 *   <module>   path to a scene module, e.g. scripts/lib/quiz-cover-scenes-lucas.mts
 *   <EXPORT>   the exported Record<string, Scene>, e.g. LUCAS_SCENES
 *   --out      folder for the PNGs (created if missing)
 *   [slug...]  only these slugs; default is every scene in the module
 *   --full     render at full size (1408x792); default is half size
 *   --sheet    also write contact-sheet.png with every rendered cover
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

import { H, W } from './quiz-cover-primitives.mjs';
import { renderSceneFor, type Scene } from './quiz-cover-scene-kit.mjs';

const argv = process.argv.slice(2);
const outIdx = argv.indexOf('--out');
const positional = argv.filter((a, i) => !a.startsWith('--') && i !== outIdx + 1);
const [modulePath, exportName, ...only] = positional;
const outDir = outIdx === -1 ? 'covers-preview' : argv[outIdx + 1];
const full = argv.includes('--full');
const wantSheet = argv.includes('--sheet');

if (!modulePath || !exportName) {
  console.error('usage: quiz-cover-preview.mts <module> <EXPORT> --out <dir> [slug...]');
  process.exit(2);
}

const mod = (await import(pathToFileURL(path.resolve(modulePath)).href)) as Record<string, unknown>;
const scenes = mod[exportName] as Record<string, Scene> | undefined;
if (!scenes || typeof scenes !== 'object') {
  console.error(`${exportName} is not exported from ${modulePath}`);
  process.exit(2);
}

const slugs = only.length ? only : Object.keys(scenes);
const missing = slugs.filter((s) => !scenes[s]);
if (missing.length) {
  console.error(`Not in ${exportName}: ${missing.join(', ')}`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const scale = full ? 1 : 0.5;
const width = Math.round(W * scale);
const height = Math.round(H * scale);
const files: string[] = [];

for (const slug of slugs) {
  const svg = renderSceneFor(slug, scenes[slug]);
  const file = path.join(outDir, `${slug}.png`);
  await sharp(Buffer.from(svg), { density: 144 * scale })
    .resize(width, height)
    .png({ palette: true, colors: 200, dither: 1, compressionLevel: 9 })
    .toFile(file);
  files.push(file);
  console.log(`wrote ${file}`);
}

if (wantSheet && files.length) {
  const cols = Math.min(4, files.length);
  const cw = 352;
  const ch = 198;
  const rows = Math.ceil(files.length / cols);
  const tiles = [];
  for (let i = 0; i < files.length; i += 1) {
    tiles.push({
      input: await sharp(files[i]).resize(cw - 4, ch - 4).png().toBuffer(),
      left: (i % cols) * cw + 2,
      top: Math.floor(i / cols) * ch + 2,
    });
  }
  const sheet = path.join(outDir, 'contact-sheet.png');
  await sharp({ create: { width: cols * cw, height: rows * ch, channels: 3, background: '#111111' } })
    .composite(tiles)
    .png()
    .toFile(sheet);
  console.log(`wrote ${sheet}`);
}
