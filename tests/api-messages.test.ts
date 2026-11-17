import assert from 'node:assert/strict';
import { test } from 'node:test';

import { msg } from '@/lib/api-messages';

function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const keys = ['SITE', 'SITE_LOCALE', 'NEXT_PUBLIC_SITE', 'NEXT_PUBLIC_SITE_LOCALE'];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  for (const k of keys) delete process.env[k];
  Object.assign(process.env, env);
  try { fn(); } finally { for (const k of keys) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; } }
}

test('NL keeps the Dutch message, placeholders filled', () => {
  withEnv({}, () => {
    assert.equal(msg('Gebruiker niet gevonden'), 'Gebruiker niet gevonden');
    assert.equal(msg('Of vul de code in: {code}', { code: 'AB12CD' }), 'Of vul de code in: AB12CD');
  });
});

test('intl sites get their language; unknown messages fall back to the text', () => {
  withEnv({ SITE: 'intl', SITE_LOCALE: 'de' }, () => {
    assert.equal(msg('Gebruiker niet gevonden'), 'Benutzer nicht gefunden');
    assert.equal(msg('Of vul de code in: {code}', { code: 'X' }), 'Oder gib den Code ein: X');
    assert.equal(msg('iets onbekends'), 'iets onbekends');
  });
  withEnv({ SITE: 'intl', SITE_LOCALE: 'en' }, () => {
    assert.equal(msg('Doe je mee met {title} op BijbelQuiz?', { title: 'Genesis 1' }), 'Will you join Genesis 1 on Bible Quizzes?');
  });
});
