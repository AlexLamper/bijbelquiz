import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/bq';
import { cn } from '@/lib/utils';
import { formatXp } from './types';

/** "Jouw plek deze maand": your place and XP, and the way to earn more. */
export function StandingCard({
  signedIn,
  rank,
  xp,
  label,
}: {
  signedIn: boolean;
  rank: number | null;
  xp: number;
  label: string;
}) {
  if (!signedIn) {
    return (
      <section aria-label="Meedoen" className="flex flex-col gap-4 rounded-[16px] border border-line bg-card p-5">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-[20px] leading-[26px]">Sta jij ook op de ranglijst?</h2>
          <p className="m-0 text-base font-semibold leading-6 text-ink-soft">
            Maak een gratis account, verdien XP met quizzen en stijg in de ranglijst.
          </p>
        </div>
        <Button href="/registreren?callbackUrl=/ranglijst" size="xl" block>
          Gratis account maken
        </Button>
        <p className="m-0 text-center text-[15px] font-semibold text-ink-muted">
          Al een account?{' '}
          <Link href="/inloggen?callbackUrl=/ranglijst" className="font-extrabold no-underline">
            Inloggen
          </Link>
        </p>
      </section>
    );
  }

  return (
    <section aria-label={label} className="flex flex-col gap-4 rounded-[16px] border border-line bg-card p-5">
      <div className="flex items-center gap-3.5">
        <span className="flex size-[52px] shrink-0 items-center justify-center rounded-[14px] bg-lapis-tint font-display text-2xl font-semibold text-lapis">
          {rank ?? '-'}
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-bold text-ink-muted">{label}</span>
          <span className="font-display text-[22px] font-semibold leading-7 text-ink">{formatXp(xp)}</span>
        </span>
      </div>
      <p className="m-0 text-base font-semibold leading-6 text-ink-soft">
        Verdien XP door quizzen te spelen en stijg in de ranglijst.
      </p>
      <Button href="/quizzen" size="xl" block>
        Speel een quiz
      </Button>
    </section>
  );
}

const GROUP_TINTS = [
  'bg-green-tint text-green',
  'bg-gold-tint text-gold-text',
  'bg-lapis-tint text-lapis',
  'bg-coral-tint text-coral-text',
];

function GroupIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" />
      <path d="M18 14.2a6.5 6.5 0 0 1 3.5 5.8" />
    </svg>
  );
}

const rowClass =
  'flex items-center gap-3 border-t border-line-soft px-5 py-3 text-ink no-underline hover:bg-chip hover:text-ink';

/** "Jouw groepen": the groups saved after Samen spelen, each its own board. */
export function GroupsCard({
  groups,
  activeGroupId,
  everyoneHref,
}: {
  groups: { id: string; name: string; memberCount: number; href: string }[];
  activeGroupId: string | null;
  everyoneHref: string;
}) {
  return (
    <section aria-labelledby="groepen-titel" className="overflow-hidden rounded-[16px] border border-line bg-card">
      <div className="flex flex-col gap-1 px-5 pb-4 pt-5">
        <h2 id="groepen-titel" className="m-0 text-[20px] leading-[26px]">
          Jouw groepen
        </h2>
        <p className="m-0 text-sm font-semibold leading-5 text-ink-muted">
          Bewaar je groep na een spel bij Samen spelen en volg hier jullie eigen stand.
        </p>
      </div>

      {activeGroupId && (
        <Link href={everyoneHref} className={rowClass}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-chip text-ink-soft">
            <GroupIcon />
          </span>
          <span className="flex min-w-0 grow flex-col">
            <span className="text-[15px] font-bold">Iedereen</span>
            <span className="text-[13px] font-semibold text-ink-muted">De hele ranglijst</span>
          </span>
          <ChevronRight className="size-[18px] shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
        </Link>
      )}

      {groups.map((group, index) => {
        const active = group.id === activeGroupId;
        return (
          <Link
            key={group.id}
            href={group.href}
            aria-current={active ? 'page' : undefined}
            className={cn(rowClass, active && 'bg-lapis-tint hover:bg-lapis-tint')}
          >
            <span
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-[10px]',
                GROUP_TINTS[index % GROUP_TINTS.length],
              )}
            >
              <GroupIcon />
            </span>
            <span className="flex min-w-0 grow flex-col">
              <span className="truncate text-[15px] font-bold">{group.name}</span>
              <span className="text-[13px] font-semibold text-ink-muted">
                {group.memberCount === 1 ? '1 speler' : `${group.memberCount} spelers`}
              </span>
            </span>
            <ChevronRight className="size-[18px] shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        );
      })}

      {groups.length === 0 && (
        <Link href="/samen-spelen" className={rowClass}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-green-tint text-green">
            <GroupIcon />
          </span>
          <span className="flex min-w-0 grow flex-col">
            <span className="text-[15px] font-bold">Speel samen</span>
            <span className="text-[13px] font-semibold text-ink-muted">Start een spel en bewaar je groep</span>
          </span>
          <ChevronRight className="size-[18px] shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
