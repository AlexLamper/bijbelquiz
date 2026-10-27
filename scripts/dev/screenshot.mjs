#!/usr/bin/env node
/**
 * Full-page screenshots of a route at the two design sizes (desktop 1440,
 * phone 390), to put next to docs/web-2/screenshots/P-<Name>-{desktop,mobile}.png.
 *
 *   node scripts/dev/screenshot.mjs /dev/ui
 *   node scripts/dev/screenshot.mjs /dashboard --login alex@voorbeeld.nl
 *   node scripts/dev/screenshot.mjs /beheer --login beheer@voorbeeld.nl --out .local/shots --name beheer
 *   node scripts/dev/screenshot.mjs /premium --dark
 *
 * Options
 *   --login <email>   sign in as a seeded account (mints the NextAuth cookie,
 *                     no form driving; the user must exist in MONGODB_URI)
 *   --out <dir>       output directory (default .local/screenshots)
 *   --name <base>     file name base (default: from the route)
 *   --dark            force the dark theme
 *   --only desktop|mobile
 *   --base <url>      dev server (default BASE_URL or http://localhost:3100)
 *
 * Needs a running dev server (`PORT=3100 npm run dev`) and, for --login,
 * the local MongoDB with the seed.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import mongoose from 'mongoose';
import { encode } from 'next-auth/jwt';
import { chromium } from 'playwright';

for (const file of ['.env', '.env.local']) {
  const filePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(filePath)) continue;
  for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const args = process.argv.slice(2);
function option(name, fallback = null) {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
}
const route = args.find((arg) => arg.startsWith('/')) ?? '/';
const LOGIN = option('--login');
const OUT_DIR = path.resolve(process.cwd(), option('--out', '.local/screenshots'));
const NAME = option('--name') ?? (route === '/' ? 'home' : route.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase());
const DARK = args.includes('--dark');
const ONLY = option('--only');
const BASE_URL = (option('--base') ?? process.env.BASE_URL ?? 'http://localhost:3100').replace(/\/$/, '');

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

async function sessionCookieFor(email) {
  const uri = process.env.MONGODB_URI;
  const secret = process.env.NEXTAUTH_SECRET;
  if (!uri || !secret) throw new Error('--login needs MONGODB_URI and NEXTAUTH_SECRET in .env.local');
  await mongoose.connect(uri);
  const user = await mongoose.connection.db.collection('users').findOne({ email: email.toLowerCase() });
  await mongoose.disconnect();
  if (!user) throw new Error(`No user ${email} in the database; run the seed first.`);
  const id = String(user._id);
  const token = await encode({
    token: { id, sub: id, name: user.name, email: user.email, isPremium: Boolean(user.isPremium || user.hasLifetimePremium || user.premiumStripe), xp: user.xp ?? 0, role: user.role ?? 'user' },
    secret,
  });
  const url = new URL(BASE_URL);
  const secure = url.protocol === 'https:';
  return { name: secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token', value: token, domain: url.hostname, path: '/', httpOnly: true, secure, sameSite: 'Lax' };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const cookie = LOGIN ? await sessionCookieFor(LOGIN) : null;
  // CHROMIUM_PATH: use a browser installed outside Playwright's own cache.
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );
  try {
    for (const [name, viewport] of Object.entries(VIEWPORTS)) {
      if (ONLY && ONLY !== name) continue;
      const context = await browser.newContext({ ...viewport, locale: 'nl-NL', colorScheme: DARK ? 'dark' : 'light' });
      if (cookie) await context.addCookies([cookie]);
      if (DARK) await context.addInitScript(() => window.localStorage.setItem('theme', 'dark'));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 120_000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(400);
      const file = path.join(OUT_DIR, `${NAME}-${name}${DARK ? '-dark' : ''}.png`);
      await page.screenshot({ path: file, fullPage: true });
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      console.log(`${file}  (${viewport.viewport.width}px viewport, page ${width}px wide${width > viewport.viewport.width ? ' - HORIZONTAL OVERFLOW' : ''})`);
      if (errors.length) console.log('  page errors:', errors.join(' | '));
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
