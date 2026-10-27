/**
 * One comparison sheet per option: the six covers as 2.0 quiz cards, the same
 * six at app-thumbnail size, and two quiz-detail crops (the 240px-high hero
 * crops the cover to its middle band, so that is where the subject must sit).
 */

import path from 'node:path';
import sharp from 'sharp';

import { BRAND, SAMPLES } from './samples.mjs';
import type { CoverOption } from './options.mjs';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function rounded(file: string, w: number, h: number, r: number, crop?: { h: number }): Promise<Buffer> {
  let img = sharp(file).resize(w, crop ? Math.round((w * 792) / 1408) : h, { kernel: 'lanczos3' });
  if (crop) {
    const full = Math.round((w * 792) / 1408);
    img = sharp(await img.png().toBuffer()).extract({ left: 0, top: Math.round((full - crop.h) / 2), width: w, height: crop.h });
  }
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="${r}" fill="#fff"/></svg>`);
  return img.composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

export async function writeSheet(option: CoverOption, dir: string): Promise<string> {
  const Wd = 1840;
  const M = 40;
  const cw = 560;
  const gap = 40;
  const coverW = cw - 16;
  const coverH = Math.round((coverW * 9) / 16);
  const cardH = 8 + coverH + 92;
  const top = 132;
  const gridH = cardH * 2 + gap;
  const tY = top + gridH + 70;
  const tw = 176;
  const th = 99;
  const dY = tY + th + 40 + 70;
  const dw = 860;
  const dh = 292;
  const Hd = dY + dh + 56;

  const svg: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Hd}">`,
    `<rect width="${Wd}" height="${Hd}" fill="${BRAND.bg}"/>`,
    `<text x="${M}" y="74" font-family="Fredoka" font-weight="600" font-size="44" fill="${BRAND.ink}">Optie ${option.letter} - ${esc(option.name)}</text>`,
    `<text x="${M}" y="110" font-family="Nunito" font-weight="600" font-size="20" fill="#6B675F">${esc(option.tagline)}</text>`,
  ];
  const comps: sharp.OverlayOptions[] = [];

  for (let i = 0; i < SAMPLES.length; i += 1) {
    const s = SAMPLES[i];
    const x = M + (i % 3) * (cw + gap);
    const y = top + Math.floor(i / 3) * (cardH + gap);
    svg.push(`<rect x="${x + 0.5}" y="${y + 0.5}" width="${cw - 1}" height="${cardH - 1}" rx="16" fill="#fff" stroke="${BRAND.line}"/>`);
    svg.push(`<text x="${x + 18}" y="${y + 8 + coverH + 34}" font-family="Nunito" font-weight="800" font-size="15" letter-spacing="0.6" fill="${BRAND.lapis}">${esc(s.reference.toUpperCase())}</text>`);
    svg.push(`<text x="${x + 18}" y="${y + 8 + coverH + 64}" font-family="Fredoka" font-weight="600" font-size="24" fill="${BRAND.ink}">${esc(s.title)}</text>`);
    svg.push(`<text x="${x + cw - 18}" y="${y + 8 + coverH + 34}" text-anchor="end" font-family="Nunito" font-weight="700" font-size="14" fill="#8A857B">${esc(s.kind)}</text>`);
    comps.push({ input: await rounded(path.join(dir, `${s.slug}.png`), coverW, coverH, 10), left: x + 8, top: y + 8 });
  }

  svg.push(`<text x="${M}" y="${tY - 18}" font-family="Nunito" font-weight="800" font-size="18" fill="${BRAND.ink}">Klein, zoals in een lijst in de app (176 px breed)</text>`);
  for (let i = 0; i < SAMPLES.length; i += 1) {
    comps.push({ input: await rounded(path.join(dir, 'thumbs', `${SAMPLES[i].slug}.png`), tw, th, 8), left: M + i * (tw + 24), top: tY });
  }

  svg.push(`<text x="${M}" y="${dY - 18}" font-family="Nunito" font-weight="800" font-size="18" fill="${BRAND.ink}">Quizpagina: de kop snijdt de cover bij tot de middelste band</text>`);
  for (const [k, idx] of [0, 3].entries()) {
    const x = M + k * (dw + 40);
    comps.push({ input: await rounded(path.join(dir, `${SAMPLES[idx].slug}.png`), dw, dh, 10, { h: dh }), left: x, top: dY });
    const chipW = Math.round(SAMPLES[idx].reference.length * 9 + 30);
    comps.push({
      input: Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${chipW}" height="30"><rect width="${chipW}" height="30" rx="15" fill="#fff"/>` +
          `<text x="15" y="21" font-family="Nunito" font-weight="800" font-size="15" fill="${BRAND.lapis}">${esc(SAMPLES[idx].reference)}</text></svg>`,
      ),
      left: x + 16,
      top: dY + 16,
    });
  }
  svg.push('</svg>');

  const out = path.join(dir, 'vergelijking.png');
  await sharp(Buffer.from(svg.join('')))
    .composite(comps)
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}
