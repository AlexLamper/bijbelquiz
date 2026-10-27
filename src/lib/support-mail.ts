/**
 * Server logic behind the contact form (`/contact`) and the bug report form
 * (`/foutmelding`, the 404 page and the error page).
 *
 * Kept free of Next.js so it can be tested directly: the API routes only turn
 * a request into `SubmissionMeta`, call a handler and send its result back.
 *
 * Spam protection is two cheap layers that do not bother a real visitor:
 * - a honeypot field (`website`) that is hidden from people; a bot that fills
 *   it gets a normal "sent" answer, but nothing is mailed;
 * - a per-IP rate limit (in memory, per server instance), enough to stop a
 *   script from flooding the support inbox.
 *
 * Mail goes out through nodemailer with the SMTP_* environment variables.
 * When SMTP is not configured (local development) the message is logged
 * instead, so the forms work end to end without a mail server.
 */
import nodemailer from 'nodemailer';
import { z } from 'zod';

import { SUPPORT_EMAIL } from '@/lib/support-email';
import { CONTACT_SUBJECTS } from '@/lib/support-mail-subjects';

export { CONTACT_SUBJECTS, type ContactSubject } from '@/lib/support-mail-subjects';

/* ── Validation ──────────────────────────────────────────────────────────── */

const honeypot = z.string().max(500).optional();

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Vul je naam in.').max(120, 'Je naam is te lang.'),
  email: z.string().trim().max(190, 'Dit e-mailadres is te lang.').pipe(z.email('Vul een geldig e-mailadres in.')),
  subject: z.enum(CONTACT_SUBJECTS, { message: 'Kies een onderwerp.' }),
  message: z
    .string()
    .trim()
    .min(10, 'Schrijf iets meer, minstens 10 tekens.')
    .max(4000, 'Je bericht is te lang (maximaal 4000 tekens).'),
  website: honeypot,
});

export type ContactInput = z.infer<typeof contactSchema>;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : undefined));

export const bugReportSchema = z.object({
  name: optionalText(120),
  email: z
    .string()
    .trim()
    .max(190, 'Dit e-mailadres is te lang.')
    .optional()
    .transform((value) => (value ? value : undefined))
    .pipe(z.email('Vul een geldig e-mailadres in, of laat het leeg.').optional()),
  message: z
    .string()
    .trim()
    .min(10, 'Schrijf iets meer, minstens 10 tekens.')
    .max(4000, 'Je melding is te lang (maximaal 4000 tekens).'),
  /** Free text on purpose: people type "bijbelquiz.com/quiz/x" without https. */
  pageUrl: optionalText(500),
  website: honeypot,
});

export type BugReportInput = z.infer<typeof bugReportSchema>;

/** Field name -> first error message, for showing next to the inputs. */
export type FieldErrors = Partial<Record<string, string>>;

function fieldErrorsOf(error: z.ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/* ── Rate limiting ───────────────────────────────────────────────────────── */

export interface RateLimiter {
  /** Records a hit for `key`; false when the key is over its limit. */
  hit(key: string, now?: number): boolean;
  reset(): void;
}

/** Fixed-window limiter in memory: `limit` hits per `windowMs` per key. */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }): RateLimiter {
  const windows = new Map<string, { start: number; count: number }>();

  return {
    hit(key, now = Date.now()) {
      // Drop stale windows now and then so the map cannot grow without bound.
      if (windows.size > 5000) {
        for (const [k, w] of windows) if (now - w.start >= windowMs) windows.delete(k);
      }
      const current = windows.get(key);
      if (!current || now - current.start >= windowMs) {
        windows.set(key, { start: now, count: 1 });
        return true;
      }
      current.count += 1;
      return current.count <= limit;
    },
    reset() {
      windows.clear();
    },
  };
}

/** 5 messages per 10 minutes per IP, shared by the contact and bug forms. */
export const supportRateLimiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

/* ── Sending ─────────────────────────────────────────────────────────────── */

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
}

type Env = Record<string, string | undefined>;

export function smtpConfigFrom(env: Env = process.env): SmtpConfig | null {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS;
  const from = (env.SMTP_FROM_EMAIL || env.BUG_REPORT_FROM_EMAIL)?.trim();
  if (!host || !user || !pass || !from) return null;
  const port = Number(env.SMTP_PORT || 587);
  return { host, port: Number.isFinite(port) ? port : 587, user, pass, from };
}

export interface SupportMail {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}

export interface MailDeps {
  env?: Env;
  /** Sends a mail; defaults to nodemailer with `smtpConfigFrom(env)`. */
  send?: (mail: SupportMail & { from: string }, config: SmtpConfig) => Promise<void>;
  log?: (message: string) => void;
}

async function sendWithNodemailer(mail: SupportMail & { from: string }, config: SmtpConfig) {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });
  await transporter.sendMail(mail);
}

/** Mails `mail`, or logs it when SMTP is not configured. */
export async function deliverSupportMail(mail: SupportMail, deps: MailDeps = {}): Promise<'sent' | 'logged'> {
  const config = smtpConfigFrom(deps.env ?? process.env);
  if (!config) {
    const log = deps.log ?? ((message: string) => console.info(message));
    log(['[support-mail] SMTP is niet ingesteld, bericht niet verstuurd:', `Aan: ${mail.to}`, `Onderwerp: ${mail.subject}`, mail.text].join('\n'));
    return 'logged';
  }
  await (deps.send ?? sendWithNodemailer)({ ...mail, from: config.from }, config);
  return 'sent';
}

/* ── Handlers ────────────────────────────────────────────────────────────── */

export interface SubmissionMeta {
  ip: string;
  userAgent: string;
  now?: Date;
}

export interface SubmissionResult {
  status: number;
  body: { success: boolean; message: string; errors?: FieldErrors };
}

export interface HandlerDeps extends MailDeps {
  limiter?: RateLimiter;
}

const RATE_LIMITED: SubmissionResult = {
  status: 429,
  body: { success: false, message: 'Je hebt net al een paar berichten gestuurd. Probeer het over een paar minuten opnieuw.' },
};

const SEND_FAILED: SubmissionResult = {
  status: 500,
  body: { success: false, message: 'Er ging iets mis bij het versturen. Probeer het opnieuw, of mail ons direct.' },
};

function toAddress(env: Env, specific?: string) {
  return env[specific ?? '']?.trim() || env.SUPPORT_TO_EMAIL?.trim() || SUPPORT_EMAIL;
}

export async function handleContactSubmission(
  body: unknown,
  meta: SubmissionMeta,
  deps: HandlerDeps = {},
): Promise<SubmissionResult> {
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      body: { success: false, message: 'Controleer de velden en probeer het opnieuw.', errors: fieldErrorsOf(parsed.error) },
    };
  }

  const ok: SubmissionResult = { status: 200, body: { success: true, message: 'Bedankt, we hebben je bericht ontvangen.' } };
  // A bot filled the hidden field: answer as if it worked, send nothing.
  if (parsed.data.website) return ok;

  const limiter = deps.limiter ?? supportRateLimiter;
  if (!limiter.hit(`ip:${meta.ip}`, meta.now?.getTime())) return RATE_LIMITED;

  const { name, email, subject, message } = parsed.data;
  const env = deps.env ?? process.env;
  const submittedAt = (meta.now ?? new Date()).toISOString();

  try {
    await deliverSupportMail(
      {
        to: toAddress(env, 'CONTACT_TO_EMAIL'),
        replyTo: email,
        subject: `[BijbelQuiz] Contact: ${subject}`,
        text: [
          'Nieuw bericht via het contactformulier',
          '',
          `Naam: ${name}`,
          `E-mail: ${email}`,
          `Onderwerp: ${subject}`,
          `Ingezonden op: ${submittedAt}`,
          `IP: ${meta.ip}`,
          `User-Agent: ${meta.userAgent}`,
          '',
          'Bericht:',
          message,
        ].join('\n'),
      },
      deps,
    );
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return SEND_FAILED;
  }
  return ok;
}

export async function handleBugReport(
  body: unknown,
  meta: SubmissionMeta,
  deps: HandlerDeps = {},
): Promise<SubmissionResult> {
  const parsed = bugReportSchema.safeParse(body);
  if (!parsed.success) {
    return {
      status: 400,
      body: { success: false, message: 'Ongeldige invoer. Controleer je melding en probeer opnieuw.', errors: fieldErrorsOf(parsed.error) },
    };
  }

  const ok: SubmissionResult = { status: 200, body: { success: true, message: 'Bedankt. Je melding is doorgestuurd.' } };
  if (parsed.data.website) return ok;

  const limiter = deps.limiter ?? supportRateLimiter;
  if (!limiter.hit(`ip:${meta.ip}`, meta.now?.getTime())) return RATE_LIMITED;

  const { name, email, message, pageUrl } = parsed.data;
  const env = deps.env ?? process.env;
  const submittedAt = (meta.now ?? new Date()).toISOString();

  try {
    await deliverSupportMail(
      {
        to: toAddress(env, 'BUG_REPORT_TO_EMAIL'),
        replyTo: email,
        subject: '[BijbelQuiz] Nieuwe foutmelding',
        text: [
          'Nieuwe foutmelding ontvangen',
          '',
          `Naam: ${name || 'Niet ingevuld'}`,
          `E-mail: ${email || 'Niet ingevuld'}`,
          `Pagina: ${pageUrl || 'Onbekend'}`,
          `Ingezonden op: ${submittedAt}`,
          `IP: ${meta.ip}`,
          `User-Agent: ${meta.userAgent}`,
          '',
          'Melding:',
          message,
        ].join('\n'),
      },
      deps,
    );
  } catch (error) {
    console.error('Failed to send bug report email:', error);
    return SEND_FAILED;
  }
  return ok;
}

/** The client IP from the usual proxy headers (first hop of x-forwarded-for). */
export function clientIpFrom(headers: { get(name: string): string | null }): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim() || 'unknown';
  return headers.get('x-real-ip')?.trim() || 'unknown';
}
