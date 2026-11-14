import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

import { ACCOUNT_NAV, FOOTER_NAV, MAIN_NAV } from '@/components/bq/nav';
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

  test('every nav label/title key exists in nl and en', () => {
    const links = [...MAIN_NAV, ...ACCOUNT_NAV, ...FOOTER_NAV.flatMap((group) => group.links)];
    const nlKeys = new Set(keys(nl));
    const enKeys = new Set(keys(en));
    for (const key of [...links.map((l) => l.labelKey), ...FOOTER_NAV.map((g) => g.titleKey).filter((k) => k !== 'brand')]) {
      assert.ok(nlKeys.has(key), `nl missing ${key}`);
      assert.ok(enKeys.has(key), `en missing ${key}`);
    }
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
