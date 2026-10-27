import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

/**
 * Small building blocks shared by the beheer pages (P-Beheer, P-BeheerQuizzen,
 * P-BeheerQuizEditor). The admin designs use a denser control size than the
 * public site: 44px inputs with radius 10 and the light line, 13px labels,
 * section titles in Nunito 800 17px. Everything here is server-safe.
 */

/** White section card with the admin padding (18px 20px). */
export function AdminSection({
  className,
  children,
  padding = 'default',
  ...props
}: React.HTMLAttributes<HTMLElement> & { padding?: 'default' | 'list' | 'none' }) {
  return (
    <section
      className={cn(
        'flex min-w-0 flex-col rounded-[16px] border border-line bg-card text-ink',
        padding === 'default' && 'gap-4 px-5 pb-5 pt-[18px]',
        padding === 'list' && 'gap-1.5 px-5 pb-2 pt-[18px]',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

/** Section heading: 17/24 Nunito 800, optional subline and a link on the right. */
export function AdminSectionHead({
  title,
  description,
  action,
  icon,
  as: Tag = 'h2',
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  as?: 'h2' | 'h3';
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="flex min-w-0 flex-[1_1_320px] items-start gap-3">
        {icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-chip text-ink-soft" aria-hidden="true">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <Tag className="m-0 font-sans text-[17px] font-extrabold leading-6">{title}</Tag>
          {description && <p className="mb-0 mt-0.5 text-sm font-semibold leading-5 text-ink-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

/** "Alle quizzen >" style link. */
export function ArrowLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-0.5 self-start whitespace-nowrap text-sm font-extrabold no-underline', className)}>
      {children}
      <ChevronRight className="size-4" strokeWidth={2.6} aria-hidden="true" />
    </Link>
  );
}

const PILL_TONE = {
  lapis: 'bg-lapis-tint text-lapis',
  gold: 'bg-gold-tint text-gold-text',
  coral: 'bg-coral-tint text-coral-text',
  green: 'bg-green-tint text-green-text',
  grey: 'bg-chip text-ink-soft',
} as const;

export type AdminPillTone = keyof typeof PILL_TONE;

/** 24px status chip. */
export function AdminPill({ tone, children, className }: { tone: AdminPillTone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full px-[9px] text-xs font-extrabold',
        PILL_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type QuizStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export const QUIZ_STATUS_LABEL: Record<QuizStatus, string> = {
  pending: 'In afwachting',
  approved: 'Goedgekeurd',
  rejected: 'Afgewezen',
  draft: 'Concept',
};

const QUIZ_STATUS_TONE: Record<QuizStatus, AdminPillTone> = {
  pending: 'lapis',
  approved: 'green',
  rejected: 'coral',
  draft: 'grey',
};

export function QuizStatusPill({ status }: { status: string }) {
  const key = (status in QUIZ_STATUS_LABEL ? status : 'draft') as QuizStatus;
  return <AdminPill tone={QUIZ_STATUS_TONE[key]}>{QUIZ_STATUS_LABEL[key]}</AdminPill>;
}

/** Classes for the 44px admin text input. */
export const adminInput =
  'h-11 w-full min-w-0 rounded-[10px] border border-line bg-card px-3 text-[15px] font-semibold text-ink placeholder:text-ink-faint outline-none focus-visible:border-lapis focus-visible:ring-2 focus-visible:ring-lapis/25 aria-[invalid=true]:border-coral-strong';

/** Classes for the admin textarea. */
export const adminTextarea =
  'w-full min-w-0 resize-y rounded-[10px] border border-line bg-card px-3 py-2.5 text-[15px] font-semibold leading-[22px] text-ink placeholder:text-ink-faint outline-none focus-visible:border-lapis focus-visible:ring-2 focus-visible:ring-lapis/25 aria-[invalid=true]:border-coral-strong';

/** 13px bold label + control + hint, 6px apart. */
export function AdminField({
  label,
  htmlFor,
  hint,
  error,
  aside,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={htmlFor} className="text-[13px] font-extrabold leading-[18px] text-ink-soft">
          {label}
        </label>
        {aside && <span className="text-[13px] font-semibold leading-[18px] text-ink-muted">{aside}</span>}
      </span>
      {children}
      {error ? (
        <p role="alert" className="m-0 text-[13px] font-bold leading-[18px] text-coral-text">
          {error}
        </p>
      ) : hint ? (
        <p className="m-0 text-[13px] font-semibold leading-[18px] text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** The 40px square icon button with a hairline (edit, view, delete). */
export const adminIconButton =
  'inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-line bg-card p-0 text-ink-soft no-underline transition-colors hover:bg-chip hover:text-ink disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lapis';

/**
 * dd-mm-yyyy, as the beheer designs print dates, on the Amsterdam calendar:
 * the server runs in UTC, so a sign-up at 00:30 Dutch time must not print as
 * the day before.
 */
export function formatAdminDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const [yyyy, mm, dd] = date.toLocaleDateString('en-CA', { timeZone: 'Europe/Amsterdam' }).split('-');
  return `${dd}-${mm}-${yyyy}`;
}
