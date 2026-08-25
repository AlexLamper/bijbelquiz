'use client';

import { normalizePath } from './routes';

/**
 * Turning a DOM node into a stable identity for a button or link.
 *
 * The point of the control reports is to be able to say "nobody has pressed
 * this in a month, delete it", which only works if the same control produces
 * the same id on every render, on every page, for every visitor. Three
 * strategies, in order of how much they can be trusted:
 *
 *  1. An explicit `data-analytics-id`. Survives copy changes and translation.
 *     Worth adding to anything you are actually considering removing.
 *  2. A link's destination. A link to `/premium` is the same control wherever
 *     it appears, which is exactly the grouping you want when asking whether
 *     the route is reachable in practice.
 *  3. A button's accessible name. Free, covers everything, and drifts if the
 *     wording changes - a renamed button looks like a new one and the old row
 *     stops growing. Acceptable, because copy changes are rare and visible.
 */

export type ControlKind = 'button' | 'link';

export interface ControlDescriptor {
  /** Stable across renders and visitors. Grouped by in every report. */
  id: string;
  /** Human-readable, for the admin table. Not stable; never grouped by. */
  label: string;
  kind: ControlKind;
  /** Destination for links, normalised to a route pattern. */
  href: string | null;
}

const CONTROL_SELECTOR = '[data-analytics-id],a[href],button,[role="button"]';

/** Elements whose clicks say nothing about whether a feature is used. */
const IGNORED_SELECTOR = '[data-analytics-ignore],[data-analytics-ignore] *';

const MAX_ID_LENGTH = 80;
const MAX_LABEL_LENGTH = 60;

// Combining marks left behind by NFD, written as a built regex so the source
// file stays plain ASCII.
const COMBINING_MARKS = new RegExp('[\\u0300-\\u036f]', 'g');

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function textOf(el: Element): string {
  return (el.textContent || '').replace(/\s+/g, ' ').trim();
}

/**
 * The name a screen reader would announce, which is also the best available
 * description of what the person thought they were pressing.
 */
function accessibleName(el: Element): string {
  const explicit =
    el.getAttribute('data-analytics-label') ||
    el.getAttribute('aria-label') ||
    el.getAttribute('title');
  if (explicit) return explicit.replace(/\s+/g, ' ').trim();

  const text = textOf(el);
  if (text) return text;

  // Icon-only controls usually still carry a visually hidden label.
  const hidden = el.querySelector('.sr-only');
  if (hidden) return textOf(hidden);

  const image = el.querySelector('img[alt]');
  const alt = image?.getAttribute('alt');
  return alt ? alt.replace(/\s+/g, ' ').trim() : '';
}

/** `/quiz/genesis` becomes `/quiz/[id]`; an off-site link becomes its host. */
function describeHref(raw: string): { href: string; id: string } | null {
  if (!raw || raw.startsWith('#') || raw.startsWith('javascript:')) return null;

  if (/^(mailto|tel):/i.test(raw)) {
    const scheme = raw.split(':', 1)[0].toLowerCase();
    return { href: scheme, id: `link:${scheme}` };
  }

  try {
    const url = new URL(raw, window.location.origin);

    if (url.origin !== window.location.origin) {
      return { href: url.host, id: `link:extern:${slug(url.host)}` };
    }

    const { path } = normalizePath(url.pathname);
    return { href: path, id: `link:${path}` };
  } catch {
    return null;
  }
}

/**
 * Walk up from whatever was clicked to the control that contains it, and
 * describe it. Returns null when the node is not inside anything interactive,
 * or is inside a subtree marked `data-analytics-ignore`.
 */
export function describeControl(target: EventTarget | null): ControlDescriptor | null {
  if (!(target instanceof Element)) return null;

  const el = target.closest<HTMLElement>(CONTROL_SELECTOR);
  if (!el || el.matches(IGNORED_SELECTOR)) return null;

  return describeElement(el);
}

/** Describe an element already known to be a control. */
export function describeElement(el: Element): ControlDescriptor | null {
  if (el.matches(IGNORED_SELECTOR)) return null;

  const label = accessibleName(el).slice(0, MAX_LABEL_LENGTH);
  const anchor = el instanceof HTMLAnchorElement ? el : null;
  const kind: ControlKind = anchor ? 'link' : 'button';

  const explicit = el.getAttribute('data-analytics-id');
  if (explicit) {
    const destination = anchor ? describeHref(anchor.getAttribute('href') || '') : null;
    return {
      id: explicit.slice(0, MAX_ID_LENGTH),
      label: label || explicit,
      kind,
      href: destination?.href ?? null,
    };
  }

  if (anchor) {
    const destination = describeHref(anchor.getAttribute('href') || '');
    if (!destination) return null;
    return { id: destination.id.slice(0, MAX_ID_LENGTH), label, kind, href: destination.href };
  }

  // A button with no accessible name cannot be told apart from any other
  // nameless button, so grouping them would produce a meaningless top row.
  // They are reported as one bucket, which is itself a finding worth seeing.
  const name = slug(label);
  return {
    id: (name ? `button:${name}` : 'button:zonder-naam').slice(0, MAX_ID_LENGTH),
    label: label || 'Knop zonder toegankelijke naam',
    kind,
    href: null,
  };
}

/** Every control currently in the document, for the impression sweep. */
export function findControls(root: ParentNode = document): Element[] {
  return Array.from(root.querySelectorAll(CONTROL_SELECTOR));
}

export { CONTROL_SELECTOR };
