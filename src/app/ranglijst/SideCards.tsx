import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/bq';
import { cn } from '@/lib/utils';
import { formatXp } from './types';
import { t } from '@/i18n';
import { localizePath } from '@/config/routes';

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
      <section aria-label={t('leaderboardSide.joinLabel')} className="flex flex-col gap-4 rounded-[16px] border border-line bg-card p-5">
        <div className="flex flex-col gap-1">
          <h2 className="m-0 text-[20px] leading-[26px]">{t('leaderboardSide.joinTitle')}</h2>
          <p className="m-0 text-base font-semibold leading-6 text-ink-soft">
            {t('leaderboardSide.joinBody')}
          </p>
        </div>
        <Button href={localizePath(`/registreren?callbackUrl=${localizePath('/ranglijst')}`)} size="xl" block>
          {t('leaderboardSide.joinCta')}
        </Button>
        <p className="m-0 text-center text-[15px] font-semibold text-ink-muted">
          {t('leaderboardSide.haveAccount')}{' '}
          <Link href={localizePath(`/inloggen?callbackUrl=${localizePath('/ranglijst')}`)} className="font-extrabold no-underline">
            {t('leaderboardSide.signIn')}
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
        {t('leaderboardSide.earnBody')}
      </p>
      <Button href={localizePath('/quizzen')} size="xl" block>
        {t('leaderboardSide.playQuiz')}
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
          {t('leaderboardSide.groupsTitle')}
        </h2>
        <p className="m-0 text-sm font-semibold leading-5 text-ink-muted">
          {t('leaderboardSide.groupsBody')}
        </p>
      </div>

      {activeGroupId && (
        <Link href={everyoneHref} className={rowClass}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-chip text-ink-soft">
            <GroupIcon />
          </span>
          <span className="flex min-w-0 grow flex-col">
            <span className="text-[15px] font-bold">{t('leaderboardSide.everyone')}</span>
            <span className="text-[13px] font-semibold text-ink-muted">{t('leaderboardSide.wholeBoard')}</span>
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
                {group.memberCount === 1 ? t('leaderboardSide.onePlayer') : t('leaderboardSide.players', { count: group.memberCount })}
              </span>
            </span>
            <ChevronRight className="size-[18px] shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
          </Link>
        );
      })}

      {groups.length === 0 && (
        <Link href={localizePath('/samen-spelen')} className={rowClass}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-green-tint text-green">
            <GroupIcon />
          </span>
          <span className="flex min-w-0 grow flex-col">
            <span className="text-[15px] font-bold">{t('leaderboardSide.playTogether')}</span>
            <span className="text-[13px] font-semibold text-ink-muted">{t('leaderboardSide.playTogetherBody')}</span>
          </span>
          <ChevronRight className="size-[18px] shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
        </Link>
      )}
    </section>
  );
}
