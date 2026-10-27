import nodemailer from 'nodemailer';

/**
 * Account mail (the password reset link) over the same SMTP settings the bug
 * report form uses. Without SMTP configured nothing is sent: the mail is
 * logged instead, link included outside production so a local reset can be
 * finished from the dev server log.
 */

export interface AccountMail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.ACCOUNT_FROM_EMAIL || process.env.SMTP_FROM_EMAIL;
  if (!host || !user || !pass || !from) return null;
  return { host, port: Number(process.env.SMTP_PORT || 587), user, pass, from };
}

export function isMailConfigured(): boolean {
  return smtpConfig() !== null;
}

export async function sendAccountMail(mail: AccountMail): Promise<void> {
  const config = smtpConfig();

  if (!config) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[ACCOUNT_MAIL] SMTP is not configured; mail not sent:', mail.subject);
    } else {
      console.info(`[ACCOUNT_MAIL] SMTP is not configured; mail not sent.\nAan: ${mail.to}\nOnderwerp: ${mail.subject}\n\n${mail.text}`);
    }
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({ from: config.from, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html });
}
