#!/usr/bin/env node
/**
 * Removes Next.js Turbopack dev lock file if present.
 * Prevents "Unable to acquire lock at .next/dev/lock" after a crashed or
 * killed dev server left a stale lock behind.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = path.join(root, '.next', 'dev', 'lock');

try {
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    console.log('[clear-next-dev-lock] Removed stale lock:', lockPath);
  }
} catch (error) {
  console.warn('[clear-next-dev-lock]', error.message);
}
