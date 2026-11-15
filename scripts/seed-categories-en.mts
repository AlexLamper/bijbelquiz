#!/usr/bin/env node
/**
 * Creates or updates the English categories (docs/quizzes-en/categories.json)
 * in the database MONGODB_URI points at - the intl one. Matching is on `slug`.
 *
 * USAGE
 *   node --import tsx scripts/seed-categories-en.mts           # dry run
 *   node --import tsx scripts/seed-categories-en.mts --apply   # write
 *
 * Refuses to run when the database already holds Dutch categories (a slug like
 * `oude-testament`), so it can never write English categories into the NL
 * database by pointing at the wrong MONGODB_URI.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import mongoose from 'mongoose';

for (const file of ['.env', '.env.local']) {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[line.slice(0, eq).trim()] = value;
  }
}

const APPLY = process.argv.includes('--apply');

interface CategoryFile {
  slug: string;
  title: string;
  description?: string;
  sortOrder?: number;
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is niet gezet (gecontroleerd: .env en .env.local).');
    process.exit(2);
  }
  const categories = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'docs/quizzes-en/categories.json'), 'utf8'),
  ) as CategoryFile[];

  const { connectDB, Category } = await import('@/database');
  await connectDB();

  const dutch = await Category.countDocuments({ slug: { $in: ['oude-testament', 'nieuwe-testament'] } });
  if (dutch > 0) {
    console.error('Deze database bevat Nederlandse categorieen: dit is de NL-database. Gestopt.');
    await mongoose.disconnect();
    process.exit(1);
  }

  for (const category of categories) {
    const existing = await Category.findOne({ slug: category.slug });
    console.log(`${existing ? 'UPDATE' : 'NIEUW '} ${category.slug}  (${category.title})`);
    if (!APPLY) continue;
    const body = { ...category, lang: 'en', isActive: true };
    if (existing) {
      existing.set(body);
      await existing.save();
    } else {
      await Category.create(body);
    }
  }
  if (!APPLY) console.log('\nDry run, niets geschreven. Voeg --apply toe om te schrijven.');
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
