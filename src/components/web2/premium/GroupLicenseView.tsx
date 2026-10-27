'use client';

import * as React from 'react';
import Link from 'next/link';
import { Copy, LogIn, Trash2 } from 'lucide-react';

import { Button, Card, ProgressBar, toast } from '@/components/bq';
import { track } from '@/lib/analytics/client';
import { cn } from '@/lib/utils';
import { CheckDisc, FaqList } from './parts';

/**
 * W4 P-Groepslicentie: buying, redeeming and running a group licence.
 *
 * Three audiences share this page: somebody who wants to buy, somebody handed
 * a code by their youth leader, and the leader who now has thirty people to
 * keep track of. The designed sections sell and redeem; a leader's own groups
 * (and the group a member joined) appear right under the intro.
 *
 * APIs: GET/POST/PATCH `/api/group-license`, POST `/api/stripe/checkout` with
 * `plan=group`.
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

export interface GroupLicenseViewProps {
  priceLabel: string;
  seats: number;
  /** Yearly Premium price, for the "Kies wat bij je past" comparison. */
  premiumYearlyPrice: string;
  /** Free trial days of yearly Premium; 0 drops the trial line. */
  trialDays: number;
  isLoggedIn: boolean;
  /** False until a Stripe group price exists; buying falls back to email then. */
  purchasable: boolean;
}

const MAIL = 'info@bijbelquiz.com';
const INVOICE_MAIL = `mailto:${MAIL}?subject=${encodeURIComponent('Groepslicentie - factuur')}`;

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function GroupLicenseView({ priceLabel, seats, premiumYearlyPrice, trialDays, isLoggedIn, purchasable }: GroupLicenseViewProps) {
  const [licenses, setLicenses] = React.useState<GroupLicenseSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(isLoggedIn);
  const [joinCode, setJoinCode] = React.useState('');
  const [isJoining, setIsJoining] = React.useState(false);
  const [renameDraft, setRenameDraft] = React.useState<Record<string, string>>({});

  // A guest who typed a code signs in and comes back with it filled in.
  React.useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) setJoinCode(code.toUpperCase().slice(0, 12));
  }, []);

  React.useEffect(() => {
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

  React.useEffect(() => {
    track('paywall_shown', { trigger: 'direct', surface: 'group_license' });
  }, []);

  const join = async (event: React.FormEvent) => {
    event.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      toast.error('Vul de volledige groepscode in.');
      return;
    }

    if (!isLoggedIn) {
      const back = `/groepslicentie?code=${encodeURIComponent(code)}#code`;
      window.location.href = `/inloggen?callbackUrl=${encodeURIComponent(back)}`;
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

      setLicenses((current) => [payload.license, ...current.filter((entry) => entry.id !== payload.license.id)]);
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
      toast.error('Kopiëren is niet gelukt. Selecteer de code zelf.');
    }
  };

  const owned = licenses.filter((entry) => entry.isOwner);
  const joined = licenses.filter((entry) => !entry.isOwner);

  const buyButton = (className?: string) =>
    isLoggedIn && purchasable ? (
      <form
        action="/api/stripe/checkout"
        method="POST"
        className={className}
        onSubmit={() => track('paywall_shown', { trigger: 'direct', surface: 'group_checkout' })}
      >
        <input type="hidden" name="plan" value="group" />
        <Button type="submit" size="hero" block className="rounded-[12px]">
          Licentie kopen
        </Button>
      </form>
    ) : isLoggedIn ? (
      // No Stripe price yet: the licence is set up by hand after an email.
      <Button href={`mailto:${MAIL}?subject=Groepslicentie`} size="hero" block className={cn('rounded-[12px]', className)}>
        Licentie aanvragen
      </Button>
    ) : (
      <Button href={`/inloggen?callbackUrl=${encodeURIComponent('/groepslicentie#kopen')}`} size="hero" block className={cn('rounded-[12px]', className)}>
        Inloggen om te kopen
      </Button>
    );

  return (
    <div className="flex flex-col">
      {/* Intro */}
      <section className="mx-auto box-border w-full max-w-[1200px] px-8 pt-16 max-m:px-4 max-m:pt-10">
        <div className="grid grid-cols-2 items-center gap-x-14 gap-y-10 max-m:grid-cols-1">
          <div className="flex flex-col items-start">
            <h1 className="m-0 text-[44px] leading-[52px] max-m:text-[32px] max-m:leading-[38px]">
              Premium voor
              <br />
              je hele groep
            </h1>
            <p className="m-0 mt-4 max-w-[500px] text-lg font-semibold leading-7 text-ink-soft">
              Eén licentie, één code. Tot {seats} mensen spelen met Premium, ieder op zijn eigen telefoon.
            </p>
            <div className="mt-7 flex flex-wrap gap-3 max-m:w-full max-m:flex-col">
              <Button href="#kopen" size="hero" className="rounded-[12px] px-[30px]">
                Licentie kopen
              </Button>
              <Button href="#code" variant="secondary" size="hero" className="rounded-[12px] px-6">
                Ik heb een code
              </Button>
            </div>
            <p className="m-0 mt-3.5 text-sm font-semibold text-ink-muted">
              {priceLabel} per jaar voor {seats} plekken. Betalen per factuur kan ook.
            </p>
          </div>
          <GroupIllustration seats={seats} />
        </div>
      </section>

      {/* The groups this account runs or belongs to */}
      {isLoggedIn && (isLoading || licenses.length > 0) && (
        <section className="mx-auto box-border w-full max-w-[1200px] px-8 pt-[88px] max-m:px-4 max-m:pt-12" aria-labelledby="jouw-groepen">
          <h2 id="jouw-groepen" className="m-0 text-[26px] leading-8">
            {owned.length > 0 ? 'Jouw groep' : 'Je groep'}
          </h2>
          {isLoading && <p className="m-0 mt-4 text-[15px] font-semibold text-ink-muted">Groepen laden...</p>}
          <div className="mt-6 flex flex-col gap-5">
            {owned.map((license) => {
              const until = formatDate(license.expiresAt);
              return (
                <Card key={license.id} as="article" padding="lg" className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-[13px] font-extrabold text-ink-muted">Code van {license.name}</span>
                      <button
                        type="button"
                        onClick={() => copyCode(license.joinCode)}
                        aria-label={`Groepscode ${license.joinCode} kopiëren`}
                        className="flex items-center gap-3 bg-transparent p-0 text-left font-display text-[40px] font-semibold leading-[48px] tracking-[0.12em] text-lapis-edge hover:text-lapis"
                      >
                        {license.joinCode}
                        <Copy className="size-5 text-lapis" strokeWidth={2.2} aria-hidden="true" />
                      </button>
                    </div>
                    <span className={cn('text-sm font-extrabold', license.status === 'active' ? 'text-green-text' : 'text-coral-text')}>
                      {license.status === 'active' ? 'Premium actief' : license.status === 'cancelled' ? 'Opgezegd' : 'Verlopen'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between gap-3 text-sm font-extrabold">
                      <span>
                        {license.seatsUsed} van {license.seats} plekken
                      </span>
                      {until && <span className="font-semibold text-ink-muted">Loopt tot {until}</span>}
                    </div>
                    <ProgressBar
                      tone="lapis"
                      label="Bezette plekken"
                      value={license.seats > 0 ? license.seatsUsed / license.seats : 0}
                    />
                  </div>

                  <div className="flex flex-col gap-2 border-t border-line-soft pt-5">
                    <label htmlFor={`naam-${license.id}`} className="text-sm font-extrabold text-ink">
                      Groepsnaam
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <input
                        id={`naam-${license.id}`}
                        value={renameDraft[license.id] ?? license.name}
                        onChange={(event) => setRenameDraft((current) => ({ ...current, [license.id]: event.target.value }))}
                        maxLength={60}
                        className="h-11 min-w-0 max-w-sm flex-1 rounded-[12px] border border-input-line bg-card px-3.5 text-[15px] font-bold text-ink outline-none focus-visible:border-lapis focus-visible:ring-2 focus-visible:ring-lapis/25"
                      />
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => patch({ licenseId: license.id, name: renameDraft[license.id] ?? license.name }, 'Groepsnaam bijgewerkt.')}
                      >
                        Opslaan
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col border-t border-line-soft pt-5">
                    <span className="text-sm font-extrabold text-ink">Leden</span>
                    <ul className="m-0 mt-1 list-none p-0">
                      {license.members.map((member) => (
                        <li key={member.id} className="flex min-h-12 items-center justify-between gap-3 border-b border-line-soft py-1.5 last:border-b-0">
                          <span className="text-[15px] font-bold text-ink">
                            {member.name}
                            {member.isOwner ? ' (beheerder)' : ''}
                          </span>
                          {!member.isOwner && (
                            <button
                              type="button"
                              onClick={() =>
                                patch({ licenseId: license.id, removeMemberId: member.id }, `${member.name} is uit de groep gehaald.`)
                              }
                              className="inline-flex min-h-11 items-center gap-1.5 bg-transparent px-1 text-sm font-bold text-ink-muted hover:text-coral-text"
                            >
                              <Trash2 className="size-4" strokeWidth={2.2} aria-hidden="true" />
                              Verwijderen
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card>
              );
            })}

            {joined.map((license) => {
              const until = formatDate(license.expiresAt);
              return (
                <Card key={license.id} as="article" padding="lg" className="flex items-center gap-4">
                  <CheckDisc />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-[17px] font-extrabold text-ink">Je doet mee met {license.name}</span>
                    <span className="text-[15px] font-semibold text-ink-muted">
                      Je hebt Premium via deze groep{until ? ` tot ${until}` : ''}.
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="mx-auto box-border w-full max-w-[1200px] px-8 pt-[88px] max-m:px-4 max-m:pt-12">
        <h2 className="m-0 text-[26px] leading-8">Zo werkt het</h2>
        <p className="m-0 mt-2 max-w-[640px] text-[17px] font-semibold leading-[26px] text-ink-muted">
          In drie stappen speelt je hele groep met Premium.
        </p>
        <ol className="m-0 mt-6 grid list-none grid-cols-3 rounded-[16px] border border-line bg-card p-0 max-m:grid-cols-1">
          {[
            { title: 'Koop de licentie', text: 'Betaal online, of vraag een factuur aan.' },
            { title: 'Deel de code', text: 'Lees de code voor of stuur hem in de groepsapp.' },
            { title: 'Iedereen speelt met Premium', text: 'Leden vullen de code in en hebben meteen alles open.' },
          ].map((step, index) => (
            <li
              key={step.title}
              className={cn(
                'flex flex-col gap-2.5 px-7 py-6',
                index > 0 && 'border-l border-line-soft max-m:border-l-0 max-m:border-t max-m:pt-5',
              )}
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-lapis-tint font-display text-lg font-semibold text-lapis-edge">
                {index + 1}
              </span>
              <span className="font-display text-xl font-semibold leading-[26px] text-ink">{step.title}</span>
              <span className="text-base font-semibold leading-6 text-ink-muted">{step.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Choose */}
      <section id="kopen" className="mx-auto box-border w-full max-w-[1200px] scroll-mt-20 px-8 pt-[88px] max-m:px-4 max-m:pt-12">
        <h2 className="m-0 text-[26px] leading-8">Kies wat bij je past</h2>
        <p className="m-0 mt-2 max-w-[640px] text-[17px] font-semibold leading-[26px] text-ink-muted">
          Speel je alleen, neem dan Premium. Speel je met een groep, dan is de licentie voordeliger.
        </p>
        <div className="mt-6 grid grid-cols-2 items-stretch gap-5 max-m:grid-cols-1">
          <OfferCard
            name="Premium"
            audience="Voor jezelf"
            price={premiumYearlyPrice}
            bullets={['1 account', 'Alle quizzen en de uitleg bij elk antwoord', ...(trialDays > 0 ? [`${trialDays} dagen gratis proberen`] : [])]}
            action={
              <Button href="/premium" variant="secondary" size="hero" block className="rounded-[12px]">
                Bekijk Premium
              </Button>
            }
          />
          <OfferCard
            highlighted
            name="Groepslicentie"
            audience="Voor je jeugdgroep, gemeente of klas"
            price={priceLabel}
            bullets={[`${seats} plekken onder één code`, 'Iedereen heeft Premium, ook thuis', 'Jij ziet wie er meedoet', 'Betalen per factuur kan ook']}
            action={buyButton()}
          />
        </div>
      </section>

      {/* Redeem */}
      <section id="code" className="mx-auto box-border w-full max-w-[1200px] scroll-mt-20 px-8 pt-5 max-m:px-4">
        <div className="flex flex-col items-center rounded-[16px] border border-line bg-card px-8 py-10 text-center max-m:p-5">
          <span className="flex size-[52px] items-center justify-center rounded-[14px] bg-lapis-tint text-lapis">
            <LogIn className="size-6" strokeWidth={2.2} aria-hidden="true" />
          </span>
          <h2 className="m-0 mt-4 text-[30px] leading-9">Een code gekregen?</h2>
          <p className="m-0 mt-2 text-[17px] font-semibold leading-[26px] text-ink-muted">
            Vul de code van je leiding in. Daarna heb je meteen Premium.
          </p>
          <form onSubmit={join} className="mt-6 flex w-full items-center justify-center gap-3 max-m:flex-col max-m:items-stretch">
            <label htmlFor="groepscode" className="sr-only">
              Groepscode
            </label>
            <input
              id="groepscode"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
              placeholder="Groepscode"
              maxLength={12}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className="box-border h-16 w-[360px] min-w-0 max-w-full rounded-[14px] border-2 border-lapis-pale bg-card px-[22px] text-center font-sans text-2xl font-extrabold tracking-[0.1em] text-ink outline-none placeholder:text-ink-faint focus-visible:border-lapis max-m:w-full"
            />
            <Button type="submit" size="hero" loading={isJoining} className="h-16 px-[34px] text-[19px]">
              Meedoen
            </Button>
          </form>
        </div>
      </section>

      {/* Questions */}
      <section className="mx-auto box-border w-full max-w-[1200px] px-8 pb-20 pt-[88px] max-m:px-4 max-m:pt-12">
        <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] items-start gap-x-14 gap-y-6 max-m:grid-cols-1">
          <div>
            <h2 className="m-0 text-[26px] leading-8">Vragen over de licentie</h2>
            <p className="m-0 mt-2 max-w-[640px] text-[17px] font-semibold leading-[26px] text-ink-muted">
              Staat je vraag er niet bij? Mail{' '}
              <a href={`mailto:${MAIL}`} className="font-extrabold no-underline">
                {MAIL}
              </a>
              .
            </p>
          </div>
          <FaqList
            items={[
              {
                question: 'Kan ik op factuur betalen?',
                open: true,
                answer: (
                  <>
                    Ja. <a href={INVOICE_MAIL}>Mail ons</a> de naam van je groep en het factuuradres, dan sturen we een factuur. Na
                    betaling krijg je de code.
                  </>
                ),
              },
              {
                question: 'Hebben leden een account nodig?',
                answer: 'Ja, een gratis account. Daarmee bewaren ze ook hun XP, reeks en voortgang.',
              },
              {
                question: 'Wat als iemand de groep verlaat?',
                answer: 'Je haalt hem zelf uit de groep. Zijn plek komt dan weer vrij voor iemand anders.',
              },
              {
                question: 'Hoe lang loopt de licentie?',
                answer: (
                  <>
                    Een jaar. In je <Link href="/groepslicentie#jouw-groepen">groepsoverzicht</Link> zie je tot wanneer, en wie er meedoet.
                  </>
                ),
              },
            ]}
          />
        </div>
      </section>
    </div>
  );
}

function OfferCard({
  name,
  audience,
  price,
  bullets,
  action,
  highlighted,
}: {
  name: string;
  audience: string;
  price: string;
  bullets: string[];
  action: React.ReactNode;
  highlighted?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-[16px] bg-card',
        highlighted ? 'border-2 border-lapis p-[27px] max-m:p-[19px]' : 'border border-line p-7 max-m:p-5',
      )}
    >
      <span className={cn('text-[15px] font-extrabold', highlighted ? 'text-lapis' : 'text-ink-muted')}>{name}</span>
      <span className="mt-0.5 text-[15px] font-semibold text-ink-muted">{audience}</span>
      <span className="mt-3.5 flex items-baseline gap-2">
        <span className="text-[32px] font-extrabold text-ink">{price}</span>
        <span className="text-[15px] font-bold text-ink-soft">per jaar</span>
      </span>
      <ul className="m-0 mt-5 flex flex-grow list-none flex-col gap-3 border-t border-line-soft p-0 pt-5">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-center gap-2.5 text-base font-bold text-ink">
            <CheckDisc size={22} />
            {bullet}
          </li>
        ))}
      </ul>
      <div className="mt-6">{action}</div>
    </div>
  );
}

/** The tilted code card from the design; an illustration, not real data. */
function GroupIllustration({ seats }: { seats: number }) {
  return (
    <div
      role="img"
      aria-label={`Een groepslicentie: één code voor de hele groep, 12 van de ${seats} plekken zijn bezet.`}
      className="relative h-[340px] max-m:mx-auto max-m:w-full max-m:max-w-[360px]"
    >
      <span aria-hidden="true" className="absolute left-1/2 top-1/2 -ml-[150px] -mt-[150px] size-[300px] rounded-full bg-lapis-wash" />
      <span className="absolute left-1/2 top-1/2 -ml-[170px] -mt-[84px] box-border flex w-[340px] max-w-[calc(100vw-48px)] -rotate-2 flex-col gap-3.5 rounded-[16px] border border-line bg-card px-6 py-[22px] shadow-float max-m:left-0 max-m:ml-0">
        <span className="flex flex-col gap-0.5">
          <span className="text-[13px] font-extrabold text-ink-muted">Code van Jeugdgroep 16+</span>
          <span className="font-display text-[40px] font-semibold leading-[48px] tracking-[0.12em] text-lapis-edge">K7PQ2M</span>
        </span>
        <span className="flex flex-col gap-2">
          <span className="flex justify-between text-sm font-extrabold text-ink">
            <span>12 van {seats} plekken</span>
            <span className="text-green-text">Premium actief</span>
          </span>
          <span className="block h-2 overflow-hidden rounded-full bg-line-soft">
            <span className="block h-full w-[40%] rounded-full bg-lapis" />
          </span>
        </span>
      </span>
      <span className="absolute bottom-[52px] right-[6%] flex h-10 rotate-3 items-center gap-2 rounded-full border border-line bg-card px-4 text-[15px] font-extrabold text-ink shadow-float">
        <CheckDisc size={22} />
        Noor doet mee
      </span>
    </div>
  );
}
