import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

import { createT, createTList, getDefaultLocale, t, tList } from '@/i18n';
import en from '@/i18n/en.json';
import nl from '@/i18n/nl.json';

function keys(node: unknown, prefix = ''): string[] {
  if (typeof node === 'string' || Array.isArray(node)) return [prefix];
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) =>
    keys(v, prefix ? `${prefix}.${k}` : k),
  );
}

describe('i18n', () => {
  afterEach(() => {
    delete process.env.SITE;
  });

  test('en has exactly the keys of nl', () => {
    assert.deepEqual(keys(en).sort(), keys(nl).sort());
  });

  test('NL build defaults to Dutch, intl build to English', () => {
    assert.equal(getDefaultLocale(), 'nl');
    assert.equal(t('common.cancel'), 'Annuleren');
    process.env.SITE = 'intl';
    assert.equal(getDefaultLocale(), 'en');
    assert.equal(t('common.cancel'), 'Cancel');
  });

  test('lists resolve per locale', () => {
    assert.ok(createTList('en')('meta.keywords').includes('bible quiz'));
    assert.ok(tList('meta.keywords').includes('bijbel quiz'));
    assert.deepEqual(createTList('nl')('nope'), []);
  });

  test('explicit locale, interpolation and fallbacks', () => {
    assert.equal(createT('en')('common.back'), 'Back');
    assert.equal(createT('nl')('missing.key'), 'missing.key');
    assert.equal(createT('en')('common.back', { x: 1 }), 'Back');
  });
});
