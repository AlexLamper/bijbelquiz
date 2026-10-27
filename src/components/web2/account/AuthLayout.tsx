import * as React from 'react';
import { Check, Swords } from 'lucide-react';

import { Container } from '@/components/bq';
import { BoltSolidIcon, FlameIcon } from '@/components/bq/icons';
import { cn } from '@/lib/utils';

/**
 * The sign-in family (Inloggen, Registreren, Wachtwoord vergeten/herstellen):
 * a 480px white form card on the left, an illustration on the right, which
 * drops under the card on phones (P-Inloggen / P-Registreren).
 */
export function AuthPage({ children, visual }: { children: React.ReactNode; visual?: React.ReactNode }) {
  return (
    <div className="flex-1 pt-6 pb-12 m:pt-16 m:pb-[88px]">
      <Container>
        <div
          className={cn(
            'grid grid-cols-1 items-center justify-items-center gap-8',
            visual && 'lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:justify-items-stretch lg:gap-[72px]',
          )}
        >
          {children}
          {visual}
        </div>
      </Container>
    </div>
  );
}

export function AuthCard({
  titleId,
  title,
  subtitle,
  children,
  className,
}: {
  titleId: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        'flex w-full min-w-0 max-w-[480px] flex-col gap-6 rounded-[16px] border border-line bg-card px-5 py-6 m:p-10',
        className,
      )}
    >
      <div className="flex flex-col gap-2">
        <h1 id={titleId} className="m-0 text-[32px] leading-10 m:text-[40px] m:leading-[48px]">
          {title}
        </h1>
        {subtitle && <p className="m-0 text-base leading-6 font-semibold text-ink-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

/** A one-line message inside the card: a result, an error, a hint. */
export function AuthNotice({ tone, children }: { tone: 'success' | 'error' | 'info'; children: React.ReactNode }) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'm-0 rounded-[12px] px-4 py-3 text-[15px] leading-[22px] font-bold',
        tone === 'success' && 'bg-green-tint text-green-text',
        tone === 'error' && 'bg-coral-tint text-coral-text',
        tone === 'info' && 'bg-lapis-tint text-lapis-edge dark:text-lapis-text',
      )}
    >
      {children}
    </p>
  );
}

/* ── Illustrations ───────────────────────────────────────────────────────── */

const floatChip = 'absolute flex items-center bg-card border border-line shadow-float text-ink font-extrabold';

function VisualFrame({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="relative h-[380px] w-[460px] max-w-full shrink-0 max-m:[zoom:0.74]"
    >
      <span aria-hidden="true" className="absolute left-1/2 top-[22px] -ml-[170px] size-[340px] rounded-full bg-lapis-wash" />
      {children}
    </div>
  );
}

/** "Alles staat voor je klaar": a quiz to continue, a duel, XP and a streak. */
export function LoginVisual() {
  return (
    <section aria-labelledby="login-visual-title" className="flex min-w-0 flex-col items-center gap-7">
      <VisualFrame label="Voorbeeld: je quiz over Lucas 15 staat op 4 van 10, Lotte wacht op jou in een duel, 1.240 XP en een reeks van 6 dagen">
        <span aria-hidden="true" className="absolute right-11 top-[70px] size-[38px] rounded-full bg-gold-wash" />
        <div className="absolute left-1/2 top-[92px] -ml-[150px] flex w-[300px] -rotate-3 flex-col gap-3 rounded-[18px] border border-line bg-card p-[18px] shadow-float">
          <span className="flex items-center justify-between">
            <span className="rounded-full bg-lapis-tint px-[9px] py-[3px] text-xs font-extrabold text-lapis">Lucas</span>
            <span
              className="flex size-[34px] items-center justify-center rounded-full"
              style={{ background: 'conic-gradient(var(--lapis) 0 40%, var(--track-soft) 40% 100%)' }}
            >
              <span className="size-[25px] rounded-full bg-card" />
            </span>
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-display text-[21px] font-semibold leading-[26px]">De verloren zoon</span>
            <span className="text-sm font-bold text-lapis-text">Hoofdstuk 15 · 4/10</span>
          </span>
          <span className="flex h-[42px] items-center justify-center rounded-[11px] border-b-[3px] border-lapis-edge bg-lapis text-[15px] font-extrabold text-white">
            Verder spelen
          </span>
        </div>
        <span className={cn(floatChip, 'right-0 top-[14px] h-11 rotate-[4deg] gap-2 rounded-[14px] px-3.5 text-sm')}>
          <Swords className="size-4 text-coral-strong" strokeWidth={2.4} aria-hidden="true" />
          Lotte wacht op jou
        </span>
        <span className="absolute bottom-[58px] left-0 flex h-[38px] -rotate-[5deg] items-center gap-1.5 rounded-full bg-gold px-3.5 text-[15px] font-extrabold text-gold-ink shadow-float">
          <BoltSolidIcon size={15} />
          1.240 XP
        </span>
        <span className={cn(floatChip, 'bottom-[14px] right-5 h-10 rotate-3 gap-1.5 rounded-full px-3.5 text-[15px]')}>
          <FlameIcon size={16} className="text-coral" />
          6 dagen op rij
        </span>
      </VisualFrame>
      <div className="flex max-w-[420px] flex-col gap-2 text-center">
        <h2 id="login-visual-title" className="m-0 text-[26px] leading-8">
          Alles staat voor je klaar
        </h2>
        <p className="m-0 text-base leading-6 font-semibold text-ink-muted">
          Je reeks, XP en duels horen bij je account. Speel verder op de website of in de app.
        </p>
      </div>
    </section>
  );
}

const answerTile =
  'flex h-[42px] items-center justify-center rounded-[10px] border border-line border-b-[3px] border-b-edge bg-card text-base font-extrabold text-ink-faint';

/** "Hoe goed ken jij de Bijbel?": a question, a duel score, XP and a streak. */
export function RegisterVisual() {
  return (
    <section aria-labelledby="reg-visual-title" className="flex min-w-0 flex-col items-center gap-7">
      <VisualFrame label="Voorbeeld: een quizvraag over Genesis 7 met het goede antwoord, een duel tegen Lotte, XP en een reeks">
        <span aria-hidden="true" className="absolute right-11 top-[62px] size-[38px] rounded-full bg-gold-wash" />
        <div className="absolute left-1/2 top-[72px] -ml-[150px] flex w-[300px] -rotate-3 flex-col gap-3 rounded-[18px] border border-line bg-card p-[18px] shadow-float">
          <span className="self-start rounded-full bg-lapis-tint px-[9px] py-[3px] text-xs font-extrabold tracking-[0.04em] text-lapis-edge dark:text-lapis-text">
            GENESIS 7
          </span>
          <span className="font-display text-[21px] font-semibold leading-[26px]">Hoeveel dagen regende het bij de zondvloed?</span>
          <span className="grid grid-cols-2 gap-2">
            <span className={answerTile}>7</span>
            <span className="flex h-[42px] items-center justify-center gap-[5px] rounded-[10px] border border-green-edge border-b-[3px] bg-green text-base font-extrabold text-white">
              <Check className="size-3.5" strokeWidth={3.4} aria-hidden="true" />
              40
            </span>
            <span className={answerTile}>100</span>
            <span className={answerTile}>150</span>
          </span>
        </div>
        <span className={cn(floatChip, 'right-0 top-2.5 h-11 rotate-[4deg] gap-2 rounded-[14px] px-3.5 text-sm text-ink-soft')}>
          <Swords className="size-4 text-coral-strong" strokeWidth={2.4} aria-hidden="true" />
          Jij <span className="font-display text-lg font-semibold text-ink">3 - 2</span> Lotte
        </span>
        <span className="absolute bottom-[54px] left-1 flex h-[38px] -rotate-[5deg] items-center gap-1.5 rounded-full bg-gold px-3.5 text-[15px] font-extrabold text-gold-ink shadow-float">
          <BoltSolidIcon size={15} />
          +15 XP
        </span>
        <span className={cn(floatChip, 'bottom-[14px] right-5 h-10 rotate-3 gap-1.5 rounded-full px-3.5 text-[15px]')}>
          <FlameIcon size={16} className="text-coral" />
          6 dagen op rij
        </span>
      </VisualFrame>
      <div className="flex flex-col items-center gap-4">
        <h2 id="reg-visual-title" className="m-0 text-center text-[26px] leading-8">
          Hoe goed ken jij de Bijbel?
        </h2>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {['Begin gratis met 3 quizzen', 'Bewaar je XP, reeks en badges', 'Daag vrienden uit voor een duel'].map((item) => (
            <li key={item} className="flex items-center gap-2.5 text-base font-bold">
              <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-green">
                <Check className="size-[13px] text-white" strokeWidth={3.4} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
