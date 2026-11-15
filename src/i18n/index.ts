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
import es from './es.json';
import pt from './pt.json';
import de from './de.json';
import fr from './fr.json';
import nl from './nl.json';

type Dictionary = { [key: string]: string | string[] | Dictionary };

export type Locale = 'nl' | 'en' | 'es' | 'pt' | 'de' | 'fr';

// Only languages that have a dictionary file are listed. A new language is
// added by creating `<locale>.json` and one import + one line here (see
// docs/setup/new-language.md).
const dictionaries: Partial<Record<Locale, Dictionary>> & Record<'nl' | 'en', Dictionary> = { nl, en, es, pt, de, fr };

export type TranslateParams = Record<string, string | number>;
export type Translator = (key: string, params?: TranslateParams) => string;
export type ListTranslator = (key: string) => string[];

export const isLocale = (value: string): value is Locale => value in dictionaries;

/** locale -> English -> Dutch: a language that is not fully translated shows English, not Dutch. */
function chain(locale: Locale): Dictionary[] {
  if (locale === 'nl') return [nl];
  return [dictionaries[locale] ?? en, en, nl];
}

const KNOWN_LOCALES: readonly string[] = ['nl', 'en', 'es', 'pt', 'de', 'fr'];

export function getDefaultLocale(): Locale {
  const locale = getSiteConfig().defaultLocale;
  // A language without a dictionary yet is still that language (html lang,
  // number formats); its text falls back to English through `chain`.
  return KNOWN_LOCALES.includes(locale) ? (locale as Locale) : 'nl';
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
    let text: string | undefined;
    for (const dictionary of chain(locale)) {
      text = lookup(dictionary, key);
      if (text !== undefined) break;
    }
    return interpolate(text ?? key, params);
  };
}

/** Lists (e.g. keywords) are stored as JSON arrays; falls back to Dutch, then []. */
export function createTList(locale: Locale = getDefaultLocale()): ListTranslator {
  return (key) => {
    for (const dictionary of chain(locale)) {
      const list = lookupList(dictionary, key);
      if (list) return list;
    }
    return [];
  };
}

/** Translate with the site's default locale (server-side convenience). */
export const t: Translator = (key, params) => createT()(key, params);

export const tList: ListTranslator = (key) => createTList()(key);
