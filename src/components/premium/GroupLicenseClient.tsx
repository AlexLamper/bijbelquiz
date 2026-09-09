'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, Loader2, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { track } from '@/lib/analytics/client';

/**
 * Buying, redeeming and running a group licence.
 *
 * Three audiences share this screen: somebody who has heard of it and wants to
 * buy, somebody handed a code by their youth leader, and the leader who now
 * has thirty people to keep track of. It opens on whichever of those the user
 * already is.
 */

interface GroupMember {
  id: string;
  name: string;
  isOwner: boolean;
}

interface GroupLicenseSummary {
  id: string;
  name: string;
  joinCode: string;
  seats: number;
  seatsUsed: number;
  seatsFree: number;
  expiresAt: string | null;
  status: 'active' | 'cancelled' | 'expired';
  isOwner: boolean;
  members: GroupMember[];
}

interface GroupLicenseClientProps {
  priceLabel: string;
  defaultSeats: number;
  isLoggedIn: boolean;
  /** False until a Stripe group price exists; the buy button is hidden then. */
  purchasable: boolean;
}

export default function GroupLicenseClient({
  priceLabel,
  defaultSeats,
  isLoggedIn,
  purchasable,
}: GroupLicenseClientProps) {
  const [licenses, setLicenses] = useState<GroupLicenseSummary[]>([]);
  const [isLoading, setIsLoading] = useState(isLoggedIn);
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [renameDraft, setRenameDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch('/api/group-license');
        const payload = await response.json().catch(() => ({}));
        if (!cancelled && response.ok) setLicenses(payload.licenses ?? []);
      } catch {
        // The page still works; the user just sees the buy and join paths.
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn]);

  // The only surface in the product that still shows a price, so this is the
  // only `paywall_shown` left. Everything else that used to raise one now
  // gives the thing away.
  useEffect(() => {
    track('paywall_shown', { trigger: 'direct', surface: 'group_license' });
  }, []);

  const join = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      toast.error('Vul de volledige groepscode in.');
      return;
    }

    setIsJoining(true);
    try {
      const response = await fetch('/api/group-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: code }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(payload?.error || 'Deelnemen is niet gelukt.');
        return;
      }

      setLicenses((current) => {
        const without = current.filter((entry) => entry.id !== payload.license.id);
        return [payload.license, ...without];
      });
      setJoinCode('');
      toast.success(`Je hoort nu bij ${payload.license.name}.`);
    } catch {
      toast.error('Deelnemen is niet gelukt. Probeer het opnieuw.');
    } finally {
      setIsJoining(false);
    }
  };

  const patch = async (body: Record<string, unknown>, successMessage: string) => {
    try {
      const response = await fetch('/api/group-license', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(payload?.error || 'Bijwerken is niet gelukt.');
        return;
      }

      setLicenses(payload.licenses ?? []);
      toast.success(successMessage);
    } catch {
      toast.error('Bijwerken is niet gelukt.');
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success('Groepscode gekopieerd.');
    } catch {
      toast.error('Kopieren is niet gelukt. Selecteer de code handmatig.');
    }
  };

  const owned = licenses.filter((entry) => entry.isOwner);
  const joined = licenses.filter((entry) => !entry.isOwner);

  return (
    <div className="mx-auto max-w-3xl">
      <header className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-lapis/10 px-4 py-1.5 text-sm font-semibold text-ink">
          <Users className="h-4 w-4" />
          Groepslicentie
        </div>
        <h1 className="font-display text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-ink sm:text-[40px]">
          Voor wie een groep begeleidt
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Spelen, uitleg lezen en samen spelen is voor iedereen gratis - daar heb je niets
          voor nodig. Een groepslicentie is er voor de leiding: een code voor je hele groep,
          {' '}{defaultSeats} plekken die je zelf beheert, en je houdt BijbelQuiz mee overeind.
        </p>
      </header>

      {/* Buy */}
      {owned.length === 0 && (
        <div className="mt-10 rounded-lg border-2 border-lapis bg-paper-raised p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Groepslicentie
              </p>
              <p className="mt-2 flex items-end gap-1.5">
                <span className="text-4xl font-semibold tracking-tight text-foreground">{priceLabel}</span>
                <span className="pb-1 text-muted-foreground">/jaar</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {defaultSeats} plekken die je zelf toevoegt en verwijdert. Liever een factuur?
                {' '}
                <a
                  className="underline underline-offset-2"
                  href="mailto:info@bijbelquiz.com?subject=Groepslicentie%20-%20factuur"
                >
                  Mail ons
                </a>{' '}
                en we sturen er een.
              </p>
            </div>

            {isLoggedIn && purchasable ? (
              <form
                action="/api/stripe/checkout"
                method="POST"
                onSubmit={() => track('paywall_shown', { trigger: 'direct', surface: 'group_checkout' })}
              >
                <input type="hidden" name="plan" value="group" />
                <Button type="submit" size="lg" className="h-12 bg-ink px-6 text-base font-semibold text-ink-inverted hover:bg-ink-soft">
                  Licentie kopen
                </Button>
              </form>
            ) : isLoggedIn ? (
              <p className="text-sm text-ink-muted">
                Mail{' '}
                <a className="underline" href="mailto:info@bijbelquiz.com?subject=Groepslicentie">
                  info@bijbelquiz.com
                </a>{' '}
                en we zetten de licentie voor je klaar.
              </p>
            ) : (
              <Button asChild size="lg" className="h-12 bg-ink px-6 text-base font-semibold text-ink-inverted hover:bg-ink-soft">
                <a href="/api/auth/signin?callbackUrl=/groepslicentie">Inloggen om te kopen</a>
              </Button>
            )}
          </div>

          <ul className="mt-5 grid gap-2.5 border-t border-rule pt-5 sm:grid-cols-2">
            {[
              `${defaultSeats} plekken onder een code die je voorleest in de zaal`,
              'Je ziet wie er meedoet en haalt mensen er zelf weer af',
              'Een keer per jaar geregeld, met factuur als je die nodig hebt',
              'Je houdt een gratis platform in de lucht voor iedereen',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5 text-sm text-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink-soft" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Redeem */}
      {isLoggedIn && (
        <div className="mt-6 rounded-lg border border-rule bg-paper-raised p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            Een code gekregen?
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Bijv. K7PQ2M"
              maxLength={12}
              className="h-11 max-w-[220px] border-rule bg-paper font-mono text-lg tracking-[0.2em]"
            />
            <Button
              type="button"
              onClick={join}
              disabled={isJoining}
              className="h-11 bg-ink px-5 text-ink-inverted hover:bg-ink-soft"
            >
              {isJoining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Meedoen
            </Button>
          </div>
        </div>
      )}

      {isLoading && (
        <p className="mt-6 text-center text-sm text-ink-muted">Groepen laden...</p>
      )}

      {/* Manage */}
      {owned.map((license) => (
        <div key={license.id} className="mt-6 rounded-lg border border-rule bg-paper-raised p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                Jouw groep
              </p>
              <p className="mt-1 font-display text-xl text-ink">{license.name}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {license.seatsUsed} van {license.seats} plekken bezet
                {license.expiresAt
                  ? ` - loopt tot ${new Date(license.expiresAt).toLocaleDateString('nl-NL', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}`
                  : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={() => copyCode(license.joinCode)}
              className="inline-flex items-center gap-2 rounded-md border border-lapis/45 bg-lapis-tint px-3 py-2 font-mono text-lg tracking-[0.2em] text-ink"
            >
              {license.joinCode}
              <Copy className="h-4 w-4 text-lapis" />
            </button>
          </div>

          <div className="mt-5 border-t border-rule pt-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Groepsnaam
            </p>
            <div className="flex flex-wrap gap-3">
              <Input
                value={renameDraft[license.id] ?? license.name}
                onChange={(event) =>
                  setRenameDraft((current) => ({ ...current, [license.id]: event.target.value }))
                }
                maxLength={60}
                className="h-10 max-w-sm border-rule bg-paper"
              />
              <Button
                type="button"
                variant="outline"
                className="h-10 border-rule bg-paper-raised"
                onClick={() =>
                  patch(
                    { licenseId: license.id, name: renameDraft[license.id] ?? license.name },
                    'Groepsnaam bijgewerkt.',
                  )
                }
              >
                Opslaan
              </Button>
            </div>
          </div>

          <div className="mt-5 border-t border-rule pt-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              Leden
            </p>
            <ul className="divide-y divide-rule">
              {license.members.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm text-ink">
                    {member.name}
                    {member.isOwner ? ' (beheerder)' : ''}
                  </span>
                  {!member.isOwner && (
                    <button
                      type="button"
                      onClick={() =>
                        patch(
                          { licenseId: license.id, removeMemberId: member.id },
                          `${member.name} is uit de groep gehaald.`,
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-vermilion"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Verwijderen
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}

      {/* Membership */}
      {joined.map((license) => (
        <div key={license.id} className="mt-6 rounded-lg border border-positive/35 bg-positive-tint p-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-positive">
            Je doet mee
          </p>
          <p className="mt-1 font-display text-xl text-ink">{license.name}</p>
          <p className="mt-1 text-sm text-ink-soft">
            Je hebt Premium via deze groep
            {license.expiresAt
              ? ` tot ${new Date(license.expiresAt).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}`
              : ''}
            .
          </p>
        </div>
      ))}
    </div>
  );
}
