/**
 * Environment loading shared by the Stripe scripts.
 *
 * Mirrors Next.js precedence (`.env.local` over `.env`) with one deliberate
 * difference: a variable already present in the process environment is never
 * overwritten. That is what makes
 *
 *   STRIPE_SECRET_KEY=sk_live_... npx tsx scripts/stripe-audit.mts
 *
 * inspect the live account from a machine whose `.env.local` points at test
 * mode - without it the file would silently win and the run would report on the
 * wrong account.
 */

import fs from 'node:fs';
import path from 'node:path';

export function loadEnvFiles(files: string[] = ['.env', '.env.local']): void {
  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) continue;

    for (const rawLine of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
      const line = rawLine.replace(/^﻿/, '').trim();
      if (!line || line.startsWith('#')) continue;

      const eq = line.indexOf('=');
      if (eq === -1) continue;

      const key = line.slice(0, eq).trim();
      if (process.env[key] !== undefined) continue;

      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] = value;
    }
  }
}

export type StripeMode = 'live' | 'test';

export function stripeModeOf(secretKey: string): StripeMode {
  return secretKey.startsWith('sk_live') || secretKey.startsWith('rk_live') ? 'live' : 'test';
}
