'use client';

import { useId, useState } from 'react';
import { Check } from 'lucide-react';

import { Button } from '@/components/bq';
import { AdminField, adminInput, formatAdminDate } from '@/components/web2/beheer/ui';
import { cn } from '@/lib/utils';

interface GrantResult {
  joinCode: string;
  ownerName: string;
  seats: number;
  expiresAt: string;
}

/**
 * Hand a group licence to somebody who paid by invoice.
 *
 * The join code is the deliverable: it goes back in the reply to the order
 * email, so it is shown large and stays on screen until the page is left.
 * The card around it (title, description) is drawn by the overview page.
 */
export default function AdminGroupLicenseForm({ defaultSeats }: { defaultSeats: number }) {
  const id = useId();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [seats, setSeats] = useState(String(defaultSeats));
  const [months, setMonths] = useState('12');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GrantResult | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/beheer/group-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, seats: Number(seats), months: Number(months) }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload?.error || 'Toekennen is niet gelukt.');
        return;
      }

      setResult(payload as GrantResult);
      setEmail('');
      setName('');
    } catch {
      setError('Toekennen is niet gelukt.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3.5 m:grid-cols-[minmax(0,1.4fr)_minmax(0,1.2fr)_minmax(0,0.6fr)_minmax(0,0.8fr)]">
          <AdminField label="E-mail van de koper" htmlFor={`${id}-email`}>
            <input
              id={`${id}-email`}
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jeugdwerk@kerk.nl"
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Groepsnaam (optioneel)" htmlFor={`${id}-name`}>
            <input
              id={`${id}-name`}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jeugdgroep De Ark"
              className={adminInput}
            />
          </AdminField>
          <AdminField label="Plekken" htmlFor={`${id}-seats`}>
            <input
              id={`${id}-seats`}
              type="number"
              min={1}
              max={500}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className={cn(adminInput, 'tabular')}
            />
          </AdminField>
          <AdminField label="Looptijd in maanden" htmlFor={`${id}-months`}>
            <input
              id={`${id}-months`}
              type="number"
              min={1}
              max={60}
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className={cn(adminInput, 'tabular')}
            />
          </AdminField>
        </div>
        <div>
          <Button type="submit" size="md" loading={busy}>
            {busy ? 'Bezig...' : 'Licentie toekennen'}
          </Button>
        </div>
      </form>

      {error && (
        <p role="alert" className="m-0 rounded-[12px] border border-coral-line bg-coral-tint px-4 py-3 text-sm font-bold text-coral-text">
          {error}
        </p>
      )}

      {result && (
        <div role="status" className="flex flex-wrap items-center gap-x-7 gap-y-4 rounded-[12px] border border-line border-t-4 border-t-green px-[18px] py-4">
          <div className="flex min-w-0 flex-[1_1_340px] items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-green text-white" aria-hidden="true">
              <Check className="size-4" strokeWidth={3.2} />
            </span>
            <span className="flex flex-col gap-1">
              <span className="text-[15px] font-bold leading-[22px]">
                Licentie voor <strong className="font-extrabold">{result.ownerName}</strong> staat klaar: {result.seats} plekken, geldig tot{' '}
                {formatAdminDate(result.expiresAt)}.
              </span>
              <span className="text-[13px] font-semibold leading-[18px] text-ink-muted">
                Stuur deze code naar de koper. Iedereen die hem invult op /groepslicentie krijgt Premium zolang de licentie loopt.
              </span>
            </span>
          </div>
          <span
            aria-label={`Code ${result.joinCode}`}
            className="select-all font-display text-[30px] font-semibold leading-9 tracking-[0.28em] text-ink m:pl-10"
          >
            {result.joinCode}
          </span>
        </div>
      )}
    </>
  );
}
