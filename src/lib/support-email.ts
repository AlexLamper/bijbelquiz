import { getSiteConfig } from '@/config/site';

/** Canonical public support inbox for BijbelQuiz (mailto, privacy text, SMTP fallback). */
export const SUPPORT_EMAIL = getSiteConfig().supportEmail;

/** Address shown in UI; optional overrides via env (e.g. staging). */
export function supportEmail(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() ||
    process.env.NEXT_PUBLIC_BUG_REPORT_EMAIL?.trim();
  return fromEnv || SUPPORT_EMAIL;
}
