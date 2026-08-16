'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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
 */
export default function AdminGroupLicenseForm({ defaultSeats }: { defaultSeats: number }) {
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

  const inputClass =
    'h-10 w-full rounded-md border border-rule bg-paper-raised px-3 text-sm text-ink outline-none focus:border-ink';

  return (
    <Card className="border-rule py-0">
      <CardHeader className="pb-3 pt-5">
        <CardTitle className="flex items-center gap-2 leading-tight text-ink">
          <KeyRound className="h-5 w-5 text-ink-soft" />
          Groepslicentie toekennen
        </CardTitle>
        <CardDescription>
          Voor een licentie die op factuur is verkocht. De koper moet al een account hebben.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-6">
        <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              E-mail van de koper
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jeugdwerk@kerk.nl"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Groepsnaam (optioneel)
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jeugdgroep De Ark"
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Plekken
            </span>
            <input
              type="number"
              min={1}
              max={500}
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Looptijd in maanden
            </span>
            <input
              type="number"
              min={1}
              max={60}
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className={inputClass}
            />
          </label>

          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={busy}
              className="h-10 rounded-md bg-ink px-5 text-ink-inverted hover:bg-ink-soft"
            >
              {busy ? 'Bezig...' : 'Licentie toekennen'}
            </Button>
          </div>
        </form>

        {error && (
          <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-4 rounded-md border border-lapis/35 bg-lapis-tint p-4">
            <p className="text-sm text-ink">
              Licentie voor <strong>{result.ownerName}</strong> staat klaar: {result.seats} plekken,
              geldig tot {new Date(result.expiresAt).toLocaleDateString('nl-NL')}.
            </p>
            <p className="mt-3 font-display text-[28px] tracking-[0.3em] text-ink">
              {result.joinCode}
            </p>
            <p className="mt-2 text-xs text-ink-muted">
              Stuur deze code naar de koper. Iedereen die hem invult op /groepslicentie krijgt
              Premium zolang de licentie loopt.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
