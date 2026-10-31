import Link from 'next/link';

import type { AdminTrials, TrialStatus } from '@/lib/admin/trials';
import { EmptyRow, TableCard, Tag, Td, Th } from './parts';

const STATUS: Record<TrialStatus, { label: string; tone: 'accent' | 'warning' | 'positive' | 'neutral' }> = {
  running: { label: 'Loopt', tone: 'accent' },
  cancelled: { label: 'Opgezegd', tone: 'warning' },
  converted: { label: 'Betaalt nu', tone: 'positive' },
  ended: { label: 'Gestopt', tone: 'neutral' },
};

const VIA = { stripe: 'Website', revenuecat: 'App Store / Google Play' } as const;
const PLAN: Record<string, string> = { yearly: 'Jaarlijks', monthly: 'Maandelijks', lifetime: 'Levenslang' };

function day(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', timeZone: 'Europe/Amsterdam' });
}

function ends(trial: AdminTrials['trials'][number]): string {
  if (trial.status === 'converted') return `Proef tot ${day(trial.endsAt)}`;
  if (trial.daysLeft === null) return `Afgelopen ${day(trial.endsAt)}`;
  const left = trial.daysLeft === 0 ? 'laatste dag' : trial.daysLeft === 1 ? 'nog 1 dag' : `nog ${trial.daysLeft} dagen`;
  return `${day(trial.endsAt)} (${left})`;
}

/**
 * "Proefperiodes" on /beheer: who is in a free trial now, and how earlier
 * trials ended. Data: `listAdminTrials` (the same block the app's admin gets).
 */
export function TrialsCard({ trials }: { trials: AdminTrials }) {
  const open = trials.running + trials.cancelled;
  const summary = [
    `${open} ${open === 1 ? 'loopt' : 'lopen'} nu${trials.cancelled ? ` (${trials.cancelled} opgezegd)` : ''}`,
    `${trials.converted} betaalt nu`,
    `${trials.ended} gestopt`,
    trials.conversionRate !== null ? `${trials.conversionRate}% omgezet` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <TableCard
      id="proefperiodes"
      title="Proefperiodes"
      description={`Gratis proefweken van de laatste ${trials.windowDays} dagen, via de website en de app. ${summary}. "Loopt" gaat na afloop automatisch over in het abonnement; "Opgezegd" stopt aan het eind van de proefweek.`}
      caption="Proefperiodes"
      minWidth={760}
      stack
      head={
        <>
          <Th>Wie</Th>
          <Th>Status</Th>
          <Th>Proefweek eindigt</Th>
          <Th>Plan</Th>
          <Th>Via</Th>
          <Th>Gestart</Th>
        </>
      }
    >
      {trials.trials.length === 0 ? (
        <EmptyRow columns={6}>Nog geen proefperiodes in de laatste {trials.windowDays} dagen.</EmptyRow>
      ) : (
        trials.trials.map((trial) => (
          <tr key={trial.userId}>
            <Td tone="strong" label="Wie">
              <Link href={`/beheer/gebruikers/${trial.userId}`} className="no-underline">
                {trial.name || trial.email || 'Onbekend'}
              </Link>
              {trial.name && trial.email && <span className="block text-[13px] font-semibold text-ink-muted">{trial.email}</span>}
            </Td>
            <Td label="Status">
              <Tag tone={STATUS[trial.status].tone}>{STATUS[trial.status].label}</Tag>
            </Td>
            <Td label="Proefweek eindigt">{ends(trial)}</Td>
            <Td label="Plan">{trial.plan ? (PLAN[trial.plan] ?? trial.plan) : '-'}</Td>
            <Td label="Via">{VIA[trial.provider]}</Td>
            <Td tone="muted" label="Gestart">
              {day(trial.startedAt)}
            </Td>
          </tr>
        ))
      )}
    </TableCard>
  );
}
