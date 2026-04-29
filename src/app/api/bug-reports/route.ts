import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bugReportSchema = z.object({
  name: z.string().trim().max(120).optional().or(z.literal('')),
  email: z.string().trim().email().max(190).optional().or(z.literal('')),
  message: z.string().trim().min(10).max(4000),
  pageUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
});

function normalizeOptional(input: string | undefined): string | undefined {
  const value = input?.trim();
  return value ? value : undefined;
}

function getEmailConfig() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.BUG_REPORT_FROM_EMAIL || process.env.SMTP_FROM_EMAIL;
  const to = process.env.BUG_REPORT_TO_EMAIL || 'devlamper06@gmail.com';

  if (!host || !user || !pass || !from) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    to,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as unknown;
    const parsed = bugReportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Ongeldige invoer. Controleer je melding en probeer opnieuw.',
        },
        { status: 400 }
      );
    }

    const config = getEmailConfig();
    if (!config) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Bug report e-mail is nog niet geconfigureerd op de server. Gebruik tijdelijk de directe e-mail knop.',
        },
        { status: 503 }
      );
    }

    const payload = {
      name: normalizeOptional(parsed.data.name),
      email: normalizeOptional(parsed.data.email),
      message: parsed.data.message.trim(),
      pageUrl: normalizeOptional(parsed.data.pageUrl),
      submittedAt: new Date().toISOString(),
      userAgent: req.headers.get('user-agent') || 'unknown',
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    };

    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });

    await transporter.sendMail({
      from: config.from,
      to: config.to,
      replyTo: payload.email,
      subject: `[BijbelQuiz] Nieuwe bug report`,
      text: [
        'Nieuwe bug report ontvangen',
        '',
        `Naam: ${payload.name || 'Niet ingevuld'}`,
        `E-mail: ${payload.email || 'Niet ingevuld'}`,
        `Pagina: ${payload.pageUrl || 'Onbekend'}`,
        `Ingezonden op: ${payload.submittedAt}`,
        `IP: ${payload.ip}`,
        `User-Agent: ${payload.userAgent}`,
        '',
        'Melding:',
        payload.message,
      ].join('\n'),
    });

    return NextResponse.json({
      success: true,
      message: 'Bedankt. Je bug report is doorgestuurd.',
    });
  } catch (error) {
    console.error('Failed to send bug report email:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Er ging iets mis bij het verzenden. Probeer opnieuw of stuur direct een e-mail.',
      },
      { status: 500 }
    );
  }
}