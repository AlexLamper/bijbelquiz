'use client';

import * as React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

/**
 * The three tab styles in the designs:
 *
 * - `segmented`  Ranglijst "Deze maand / Altijd": grey tray, 48px, the active
 *                tab is a white card with lapis text. Equal widths.
 * - `compact`    Settings "Licht / Donker / Systeem" and the legal pages:
 *                a small tray, 36-38px, active tab white or lapis-tint.
 * - `pills`      Quiz filters "Alles / Oude Testament / ...": round chips,
 *                active one lapis. Scrolls sideways on phones.
 *
 * Each item may carry `href` (rendered as links, `aria-current`) or the group
 * is controlled with `value` / `onChange` (rendered as buttons, `aria-pressed`
 * or `role=tab`). Use `role="tablist"` semantics only when panels follow.
 */
export interface TabItem<T extends string = string> {
  value: T;
  label: React.ReactNode;
  href?: string;
  disabled?: boolean;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  value?: T;
  onChange?: (value: T) => void;
  variant?: 'segmented' | 'compact' | 'pills';
  /** Accessible name of the group. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** `tabs` when the tabs switch panels on the same page; `radio` otherwise. */
  semantics?: 'tabs' | 'radio';
  className?: string;
}

export function Tabs<T extends string = string>({
  items,
  value,
  onChange,
  variant = 'segmented',
  semantics = 'radio',
  className,
  ...rest
}: TabsProps<T>) {
  const isLinks = items.every((item) => item.href);

  const tray = {
    segmented: 'grid gap-1 p-1 rounded-[14px] bg-segment',
    compact: 'inline-flex gap-1 p-1 rounded-[12px] bg-chip',
    pills: 'flex gap-2 overflow-x-auto [scrollbar-width:none] -mx-4 px-4 m:mx-0 m:px-0',
  }[variant];

  const item = {
    segmented: 'h-12 rounded-[10px] text-base',
    compact: 'h-9 px-4 rounded-[9px] text-[15px]',
    pills: 'h-10 px-4 rounded-full text-[15px] shrink-0',
  }[variant];

  const active = {
    segmented: 'bg-card border border-line text-lapis font-extrabold',
    compact: 'bg-card border border-line text-ink font-extrabold',
    pills: 'bg-lapis border border-lapis text-white font-extrabold hover:text-white',
  }[variant];

  const idle = {
    segmented: 'bg-transparent border border-transparent text-ink-muted font-bold hover:text-ink',
    compact: 'bg-transparent border border-transparent text-ink-soft font-bold hover:text-ink',
    pills: 'bg-card border border-line text-ink-soft font-bold hover:text-ink hover:border-input-line',
  }[variant];

  const groupRole = isLinks ? undefined : semantics === 'tabs' ? 'tablist' : 'radiogroup';
  const Tray = isLinks ? 'nav' : 'div';

  return (
    <Tray
      role={groupRole}
      className={cn(tray, className)}
      style={variant === 'segmented' ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` } : undefined}
      {...rest}
    >
      {items.map((tab) => {
        const selected = tab.value === value;
        const classes = cn(
          'inline-flex items-center justify-center whitespace-nowrap no-underline transition-colors',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis',
          item,
          selected ? active : idle,
          tab.disabled && 'opacity-50 pointer-events-none',
        );
        if (tab.href) {
          return (
            <Link key={tab.value} href={tab.href} aria-current={selected ? 'page' : undefined} className={classes}>
              {tab.label}
            </Link>
          );
        }
        return (
          <button
            key={tab.value}
            type="button"
            role={semantics === 'tabs' ? 'tab' : 'radio'}
            aria-selected={semantics === 'tabs' ? selected : undefined}
            aria-checked={semantics === 'radio' ? selected : undefined}
            disabled={tab.disabled}
            onClick={() => onChange?.(tab.value)}
            className={classes}
          >
            {tab.label}
          </button>
        );
      })}
    </Tray>
  );
}
