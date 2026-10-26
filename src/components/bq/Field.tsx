'use client';

import * as React from 'react';
import { ChevronDown, Eye, EyeOff, Search } from 'lucide-react';

import { cn } from '@/lib/utils';
import { IconButton } from './Button';

/**
 * Form controls from the designs: 52px tall (44px in the `sm` size used in
 * settings rows), radius 12, 1px #BDB9B0 border, Nunito 600 16px.
 */

const control = cva2();

function cva2() {
  return {
    base: [
      'w-full min-w-0 bg-card text-ink font-semibold placeholder:text-ink-faint',
      'border border-input-line rounded-[12px] outline-none',
      'focus-visible:border-lapis focus-visible:ring-2 focus-visible:ring-lapis/25',
      'disabled:opacity-60 disabled:bg-chip',
      'aria-[invalid=true]:border-coral-strong aria-[invalid=true]:ring-coral-strong/20',
    ].join(' '),
    size: {
      md: 'h-[52px] px-4 text-base',
      sm: 'h-11 px-3.5 text-[15px] font-bold',
    } as const,
  };
}

export type ControlSize = 'md' | 'sm';

/* ── Field wrapper ───────────────────────────────────────────────────────── */

export interface FieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  /** Rendered to the right of the label ("Wachtwoord vergeten?"). */
  aside?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + hint/error, 6px apart like the sign-in form. */
export function Field({ label, htmlFor, aside, hint, error, required, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <span className="flex items-baseline justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-extrabold text-ink">
          {label}
          {required && (
            <span aria-hidden="true" className="text-coral-text">
              {' '}
              *
            </span>
          )}
        </label>
        {aside && <span className="text-sm font-extrabold [&_a]:no-underline">{aside}</span>}
      </span>
      {children}
      {error ? (
        <p role="alert" className="m-0 text-[13px] font-bold text-coral-text">
          {error}
        </p>
      ) : hint ? (
        <p className="m-0 text-[13px] font-semibold text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── Input ───────────────────────────────────────────────────────────────── */

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: ControlSize;
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, size = 'md', invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(control.base, control.size[size], className)}
      {...props}
    />
  );
});

/** Password input with a "tonen/verbergen" eye button inside. */
export const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(function PasswordInput(
  { className, size = 'md', ...props },
  ref,
) {
  const [shown, setShown] = React.useState(false);
  return (
    <div className="relative">
      <Input ref={ref} type={shown ? 'text' : 'password'} size={size} className={cn('pr-[52px]', className)} {...props} />
      <IconButton
        shape="plain"
        size={size === 'md' ? 'lg' : 'sm'}
        aria-label={shown ? 'Wachtwoord verbergen' : 'Wachtwoord tonen'}
        aria-pressed={shown}
        onClick={() => setShown((value) => !value)}
        className={cn('absolute right-1 top-1', size === 'sm' && 'top-1')}
      >
        {shown ? <EyeOff className="size-5" strokeWidth={2.2} /> : <Eye className="size-5" strokeWidth={2.2} />}
      </IconButton>
    </div>
  );
});

/** The search box of the quiz index: 52px, magnifier on the left. */
export const SearchInput = React.forwardRef<HTMLInputElement, InputProps>(function SearchInput(
  { className, size = 'md', ...props },
  ref,
) {
  return (
    <label
      className={cn(
        'flex items-center gap-2.5 min-w-0 bg-card border border-line rounded-[12px] px-4 text-ink-muted',
        'focus-within:border-lapis focus-within:ring-2 focus-within:ring-lapis/25',
        size === 'md' ? 'h-[52px]' : 'h-11',
        className,
      )}
    >
      <Search className="size-5 shrink-0" strokeWidth={2.2} aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        className="flex-1 min-w-0 h-full bg-transparent border-0 outline-none p-0 text-base font-semibold text-ink placeholder:text-ink-faint"
        {...props}
      />
    </label>
  );
});

/* ── Textarea ────────────────────────────────────────────────────────────── */

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, invalid, rows = 5, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(control.base, 'px-4 py-3.5 text-base leading-6 resize-y', className)}
      {...props}
    />
  );
});

/* ── Select ──────────────────────────────────────────────────────────────── */

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  size?: ControlSize;
  invalid?: boolean;
}

/** Native select with the design's chevron; options come as children. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, size = 'md', invalid, children, ...props },
  ref,
) {
  return (
    <span className={cn('relative flex min-w-0', className)}>
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(control.base, control.size[size], 'appearance-none pr-10 font-bold')}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 -mt-2.5 size-5 text-ink-muted"
        strokeWidth={2.2}
        aria-hidden="true"
      />
    </span>
  );
});

/* ── Switch ──────────────────────────────────────────────────────────────── */

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  /** Accessible name; required because the switch has no text. */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/** 48x28 toggle, lapis when on. */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, className, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        'relative inline-flex w-12 h-7 shrink-0 items-center rounded-full border-0 p-[3px] transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis disabled:opacity-50',
        checked ? 'bg-lapis' : 'bg-track',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn('block size-[22px] rounded-full bg-white transition-transform', checked ? 'translate-x-5' : 'translate-x-0')}
      />
    </button>
  );
});

/* ── Checkbox ────────────────────────────────────────────────────────────── */

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, ...props },
  ref,
) {
  const autoId = React.useId();
  const inputId = id ?? autoId;
  return (
    <label htmlFor={inputId} className={cn('flex items-start gap-3 cursor-pointer text-[15px] font-semibold text-ink-soft', className)}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 accent-lapis rounded-[6px] border-input-line"
        {...props}
      />
      <span>{label}</span>
    </label>
  );
});

/* ── Divider with text ───────────────────────────────────────────────────── */

/** "of met e-mail": a hairline on either side of a short label. */
export function TextDivider({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div aria-hidden="true" className={cn('flex items-center gap-3 text-[13px] font-bold text-ink-muted', className)}>
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
