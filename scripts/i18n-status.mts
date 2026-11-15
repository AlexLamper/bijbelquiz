#!/usr/bin/env node
/**
 * Translation coverage per language, against nl.json (the source of truth).
 *
 *   node --import tsx scripts/i18n-status.mts            # table of all languages
 *   node --import tsx scripts/i18n-status.mts es         # list the missing keys of es
 *
 * A language without a dictionary file is reported as 0% (it shows English).
 */

import fs from 'node:fs';
import path from 'node:path';

const DIR = path.resolve(process.cwd(), 'src/i18n');
const LANGS = ['en', 'es', 'pt', 'de', 'fr'];

function flatten(node: unknown, prefix = '', out: Map<string, string> = new Map()): Map<string, string> {
  if (Array.isArray(node)) {
    out.set(prefix, JSON.stringify(node));
  } else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) flatten(value, prefix ? `${prefix}.${key}` : key, out);
  } else if (typeof node === 'string') {
    out.set(prefix, node);
  }
  return out;
}

function load(lang: string): Map<string, string> | null {
  const file = path.join(DIR, `${lang}.json`);
  return fs.existsSync(file) ? flatten(JSON.parse(fs.readFileSync(file, 'utf8'))) : null;
}

const source = load('nl');
if (!source) throw new Error('src/i18n/nl.json ontbreekt');
const only = process.argv[2];

for (const lang of LANGS) {
  if (only && only !== lang) continue;
  const dict = load(lang);
  if (!dict) {
    console.log(`${lang}: geen dictionary (toont Engels)`);
    continue;
  }
  const missing = [...source.keys()].filter((key) => !dict.has(key));
  const placeholderMismatch = [...source.keys()].filter((key) => {
    const a = (source.get(key)!.match(/\{\w+\}/g) ?? []).sort().join();
    const b = (dict.get(key)?.match(/\{\w+\}/g) ?? []).sort().join();
    return dict.has(key) && a !== b;
  });
  const pct = Math.round(((source.size - missing.length) / source.size) * 100);
  console.log(`${lang}: ${pct}% (${source.size - missing.length}/${source.size}), ${missing.length} ontbreken, ${placeholderMismatch.length} met afwijkende {placeholders}`);
  if (only) {
    for (const key of missing) console.log(`  ontbreekt: ${key}`);
    for (const key of placeholderMismatch) console.log(`  placeholders: ${key}`);
  }
}
