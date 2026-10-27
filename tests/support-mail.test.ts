import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clientIpFrom,
  createRateLimiter,
  deliverSupportMail,
  handleBugReport,
  handleContactSubmission,
  smtpConfigFrom,
  type SupportMail,
} from '@/lib/support-mail';

const SMTP_ENV = {
  SMTP_HOST: 'smtp.example.org',
  SMTP_PORT: '465',
  SMTP_USER: 'user',
  SMTP_PASS: 'secret',
  SMTP_FROM_EMAIL: 'noreply@bijbelquiz.com',
};

const META = { ip: '203.0.113.7', userAgent: 'test-agent', now: new Date('2026-10-27T10:00:00Z') };

const VALID_CONTACT = {
  name: 'Lotte',
  email: 'lotte@voorbeeld.nl',
  subject: 'Premium en betalen',
  message: 'Hoe kan ik mijn abonnement opzeggen?',
};

function recorder() {
  const sent: Array<SupportMail & { from: string }> = [];
  const logs: string[] = [];
  return {
    sent,
    logs,
    send: async (mail: SupportMail & { from: string }) => {
      sent.push(mail);
    },
    log: (message: string) => logs.push(message),
  };
}

test('a valid contact message is mailed to support with the sender as reply-to', async () => {
  const rec = recorder();
  const result = await handleContactSubmission(VALID_CONTACT, META, {
    env: SMTP_ENV,
    send: rec.send,
    limiter: createRateLimiter({ limit: 5, windowMs: 60_000 }),
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(rec.sent.length, 1);
  const mail = rec.sent[0]!;
  assert.equal(mail.to, 'info@bijbelquiz.com');
  assert.equal(mail.from, 'noreply@bijbelquiz.com');
  assert.equal(mail.replyTo, 'lotte@voorbeeld.nl');
  assert.match(mail.subject, /Premium en betalen/);
  assert.match(mail.text, /Hoe kan ik mijn abonnement opzeggen\?/);
  assert.match(mail.text, /IP: 203\.0\.113\.7/);
});

test('invalid contact input is refused with a message per field', async () => {
  const rec = recorder();
  const result = await handleContactSubmission(
    { name: '', email: 'geen-adres', subject: 'Iets wat niet bestaat', message: 'kort' },
    META,
    { env: SMTP_ENV, send: rec.send, limiter: createRateLimiter({ limit: 5, windowMs: 60_000 }) },
  );

  assert.equal(result.status, 400);
  assert.equal(result.body.success, false);
  assert.ok(result.body.errors?.name);
  assert.ok(result.body.errors?.email);
  assert.ok(result.body.errors?.subject);
  assert.ok(result.body.errors?.message);
  assert.equal(rec.sent.length, 0);

  const garbage = await handleContactSubmission(null, META, { env: SMTP_ENV, send: rec.send });
  assert.equal(garbage.status, 400);
});

test('a filled honeypot looks like success but sends nothing', async () => {
  const rec = recorder();
  const result = await handleContactSubmission({ ...VALID_CONTACT, website: 'http://spam.example' }, META, {
    env: SMTP_ENV,
    send: rec.send,
    limiter: createRateLimiter({ limit: 5, windowMs: 60_000 }),
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.success, true);
  assert.equal(rec.sent.length, 0);
});

test('the rate limit stops a flood from one IP and lifts after the window', async () => {
  const rec = recorder();
  const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
  const deps = { env: SMTP_ENV, send: rec.send, limiter };

  assert.equal((await handleContactSubmission(VALID_CONTACT, META, deps)).status, 200);
  assert.equal((await handleContactSubmission(VALID_CONTACT, META, deps)).status, 200);
  assert.equal((await handleContactSubmission(VALID_CONTACT, META, deps)).status, 429);
  // Another visitor is not affected.
  assert.equal((await handleContactSubmission(VALID_CONTACT, { ...META, ip: '198.51.100.1' }, deps)).status, 200);
  // A minute later the first one may send again.
  const later = { ...META, now: new Date(META.now.getTime() + 61_000) };
  assert.equal((await handleContactSubmission(VALID_CONTACT, later, deps)).status, 200);
  assert.equal(rec.sent.length, 4);
});

test('without SMTP the message is logged instead of sent', async () => {
  const rec = recorder();
  const outcome = await deliverSupportMail(
    { to: 'info@bijbelquiz.com', subject: 'Test', text: 'Hallo' },
    { env: {}, send: rec.send, log: rec.log },
  );
  assert.equal(outcome, 'logged');
  assert.equal(rec.sent.length, 0);
  assert.equal(rec.logs.length, 1);
  assert.match(rec.logs[0]!, /Hallo/);

  const result = await handleContactSubmission(VALID_CONTACT, META, {
    env: {},
    send: rec.send,
    log: rec.log,
    limiter: createRateLimiter({ limit: 5, windowMs: 60_000 }),
  });
  assert.equal(result.status, 200);
  assert.equal(rec.sent.length, 0);
});

test('a failing mail server gives a 500 the form can show', async () => {
  const result = await handleContactSubmission(VALID_CONTACT, META, {
    env: SMTP_ENV,
    send: async () => {
      throw new Error('connection refused');
    },
    limiter: createRateLimiter({ limit: 5, windowMs: 60_000 }),
  });
  assert.equal(result.status, 500);
  assert.equal(result.body.success, false);
});

test('bug reports accept an empty e-mail and a page without https', async () => {
  const rec = recorder();
  const deps = { env: SMTP_ENV, send: rec.send, limiter: createRateLimiter({ limit: 5, windowMs: 60_000 }) };

  const ok = await handleBugReport(
    { message: 'De quiz over Genesis laadt niet.', pageUrl: 'bijbelquiz.com/quiz/genesis-37', email: '' },
    META,
    deps,
  );
  assert.equal(ok.status, 200);
  assert.equal(rec.sent.length, 1);
  assert.equal(rec.sent[0]!.replyTo, undefined);
  assert.match(rec.sent[0]!.text, /Pagina: bijbelquiz\.com\/quiz\/genesis-37/);

  const badEmail = await handleBugReport({ message: 'De quiz laadt niet goed.', email: 'nope' }, META, deps);
  assert.equal(badEmail.status, 400);
  assert.ok(badEmail.body.errors?.email);

  const tooShort = await handleBugReport({ message: 'kapot' }, META, deps);
  assert.equal(tooShort.status, 400);
  assert.ok(tooShort.body.errors?.message);
});

test('SMTP config needs host, user, password and sender', () => {
  assert.equal(smtpConfigFrom({}), null);
  assert.equal(smtpConfigFrom({ ...SMTP_ENV, SMTP_PASS: '' }), null);
  assert.deepEqual(smtpConfigFrom({ ...SMTP_ENV, SMTP_PORT: undefined }), {
    host: 'smtp.example.org',
    port: 587,
    user: 'user',
    pass: 'secret',
    from: 'noreply@bijbelquiz.com',
  });
});

test('the client IP is the first hop of x-forwarded-for', () => {
  const headers = (values: Record<string, string>) => ({ get: (name: string) => values[name] ?? null });
  assert.equal(clientIpFrom(headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' })), '203.0.113.7');
  assert.equal(clientIpFrom(headers({ 'x-real-ip': '198.51.100.2' })), '198.51.100.2');
  assert.equal(clientIpFrom(headers({})), 'unknown');
});
