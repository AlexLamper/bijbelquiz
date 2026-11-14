/**
 * Minimal i18n: dictionaries are JSON, `nl.json` is the source of truth.
 *
 * - No dependencies, no React context: `t()` is a plain function, so it works
 *   in server components, client components, route handlers and emails.
 * - The locale defaults to the site's default locale (NL build -> 'nl'), so
 *   existing Dutch pages behave exactly as before.
 * - Client components receive the locale as a prop (or a future provider) and
 *   call `createT(locale)`; they must not read server-only env vars.
 * - A missing key in a locale falls back to Dutch, then to the key itself.
 *
 * Plan and checklist: I18N-ROADMAP.md
 */

import { getSiteConfig } from '@/config/site';

import en from './en.json';
import nl from './nl.json';

type Dictionary = { [key: string]: string | string[] | Dictionary };

export type Locale = 'nl' | 'en';

const dictionaries: Record<Locale, Dictionary> = { nl, en };

export type TranslateParams = Record<string, string | number>;
export type Translator = (key: string, params?: TranslateParams) => string;
export type ListTranslator = (key: string) => string[];

export const isLocale = (value: string): value is Locale => value in dictionaries;

export function getDefaultLocale(): Locale {
  const locale = getSiteConfig().defaultLocale;
  return isLocale(locale) ? locale : 'nl';
}

function lookupNode(dictionary: Dictionary, key: string): string | string[] | Dictionary | undefined {
  let node: string | string[] | Dictionary | undefined = dictionary;
  for (const part of key.split('.')) {
    if (typeof node !== 'object' || node === null || Array.isArray(node)) return undefined;
    node = node[part];
  }
  return node;
}

function lookup(dictionary: Dictionary, key: string): string | undefined {
  const node = lookupNode(dictionary, key);
  return typeof node === 'string' ? node : undefined;
}

function lookupList(dictionary: Dictionary, key: string): string[] | undefined {
  const node = lookupNode(dictionary, key);
  return Array.isArray(node) ? node : undefined;
}

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function createT(locale: Locale = getDefaultLocale()): Translator {
  return (key, params) => {
    const text = lookup(dictionaries[locale], key) ?? lookup(nl, key) ?? key;
    return interpolate(text, params);
  };
}

/** Lists (e.g. keywords) are stored as JSON arrays; falls back to Dutch, then []. */
export function createTList(locale: Locale = getDefaultLocale()): ListTranslator {
  return (key) => lookupList(dictionaries[locale], key) ?? lookupList(nl, key) ?? [];
}

/** Translate with the site's default locale (server-side convenience). */
export const t: Translator = (key, params) => createT()(key, params);

export const tList: ListTranslator = (key) => createTList()(key);
