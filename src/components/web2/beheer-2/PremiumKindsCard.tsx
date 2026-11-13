import Link from 'next/link';

import { AdminSection, AdminSectionHead } from '@/components/web2/beheer/ui';
import type { PremiumBreakdown } from '@/lib/admin/premium-status';
import { cn } from '@/lib/utils';

const nl = new Intl.NumberFormat('nl-NL');

/**
 * "Hoe hebben ze Premium?" on /beheer: every account with Premium now, by how
 * it has it - free trial, paid subscription, lifetime, group licence or given
 * by beheer. Each tile opens the user list filtered on that kind.
 */
export function PremiumKindsCard({ breakdown }: { breakdown: PremiumBreakdown }) {
  const tiles: Array<{ kind: string; label: string; value: number; note: string; tone: string }> = [
    {
      kind: 'trial',
      label: 'In proefperiode',
      value: breakdown.trial.total,
      note:
        breakdown.trial.total === 0
          ? 'nog niets betaald'
          : `nog niets betaald · ${breakdown.trial.renews} gaat betalen${breakdown.trial.cancelled ? `, ${breakdown.trial.cancelled} opgezegd` : ''}`,
      tone: 'text-lapis',
    },
    {
      kind: 'paid',
      label: 'Betaald abonnement',
      value: breakdown.paid.total,
      note: [
        `${breakdown.paid.yearly} jaarlijks`,
        `${breakdown.paid.monthly} maandelijks`,
        breakdown.paid.other ? `${breakdown.paid.other} onbekend` : null,
        breakdown.paid.cancelled ? `${breakdown.paid.cancelled} opgezegd` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      tone: 'text-green-text',
    },
    { kind: 'lifetime', label: 'Levenslang', value: breakdown.lifetime, note: 'eenmalig betaald', tone: 'text-ink' },
    { kind: 'manual', label: 'Gegeven door beheer', value: breakdown.manual, note: 'niet voor betaald', tone: 'text-ink-soft' },
    { kind: 'group', label: 'Groepslicentie', value: breakdown.group, note: 'via een groep', tone: 'text-ink-soft' },
  ];
  const paying = breakdown.paid.total + breakdown.lifetime;

  return (
    <AdminSection id="premium-soorten">
      <AdminSectionHead
        title="Hoe hebben ze Premium?"
        description={`${nl.format(breakdown.total)} accounts met Premium, testaccounts niet meegeteld. ${nl.format(paying)} ${paying === 1 ? 'heeft' : 'hebben'} echt betaald (abonnement of levenslang); proefperiodes hebben nog niets betaald. Klik voor de lijst.`}
      />
      <div className="grid grid-cols-2 gap-3 m:grid-cols-3 min-[1101px]:grid-cols-5">
        {tiles.map((tile) => (
          <Link
            key={tile.kind}
            href={`/beheer/gebruikers?kind=${tile.kind}&test=exclude`}
            className="flex min-w-0 flex-col gap-1 rounded-[12px] border border-line px-4 py-3 no-underline hover:border-input-line hover:bg-chip/50"
          >
            <span className="text-[13px] font-bold text-ink-muted">{tile.label}</span>
            <span className={cn('tabular text-[28px] font-extrabold leading-8', tile.tone)}>{nl.format(tile.value)}</span>
            <span className="text-xs font-semibold leading-4 text-ink-muted">{tile.note}</span>
          </Link>
        ))}
      </div>
    </AdminSection>
  );
}
