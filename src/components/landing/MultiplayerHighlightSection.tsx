import Link from 'next/link';
import { Check, Home, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MULTIPLAYER_PREMIUM_MAX_PLAYERS } from '@/lib/premium-benefits';

export function MultiplayerHighlightSection() {
  return (
    <section className="bg-[#f5f8ff] py-16 md:py-24 dark:bg-zinc-900/50 dark:border-y dark:border-zinc-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#6f8ed4]/10 px-4 py-1.5 text-sm font-semibold text-[#355384] dark:bg-[#1a2b47] dark:text-[#9db5dc]">
              <Users className="h-4 w-4" />
              Samen spelen
            </div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1a2942] dark:text-white md:text-4xl">
              Speciaal ontworpen voor groepen
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground dark:text-white/70">
              Van gezin tot jeugdvereniging - iedereen speelt mee. Geen installatie, gewoon een code delen en direct beginnen.
            </p>
          </div>

          {/* Scenario cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Scenario 1: Familie */}
            <div className="rounded-2xl border border-[#dce8f8] bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#6f8ed4]/10 dark:bg-[#1a2b47]">
                <Home className="h-6 w-6 text-[#5f81cc] dark:text-[#9db5dc]" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#1a2942] dark:text-white">
                Zondagavond met het gezin
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                Het gezin zit samen op de bank. Wie kent de Bijbel het best? Met BijbelQuiz test je het samen - spannend voor jong en oud. Eén persoon start een spel, deelt de code, en iedereen kan meedoen op z'n eigen telefoon of laptop.
              </p>
              <ul className="space-y-2">
                {[
                  'Geschikt voor alle leeftijden',
                  'Geen installatie nodig',
                  'Speel op elk apparaat',
                  '2 tot 8 spelers gratis',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#30466e] dark:text-zinc-300">
                    <Check className="h-4 w-4 shrink-0 text-[#6f8ed4] dark:text-[#9db5dc]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Scenario 2: Jeugdvereniging */}
            <div className="rounded-2xl border border-[#dce8f8] bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#6f8ed4]/10 dark:bg-[#1a2b47]">
                <Users className="h-6 w-6 text-[#5f81cc] dark:text-[#9db5dc]" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-[#1a2942] dark:text-white">
                Jeugdvereniging of groepsactiviteit
              </h3>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                Op zoek naar een leuke activiteit voor een grotere groep? BijbelQuiz is perfect voor jeugdavonden en gemeentelijke bijeenkomsten. Iedereen speelt tegelijk mee - spannend, interactief en leerzaam.
              </p>
              <ul className="space-y-2">
                {[
                  `Tot ${MULTIPLAYER_PREMIUM_MAX_PLAYERS} spelers in één spel`,
                  'Ideaal voor jeugdavonden',
                  'Geschikt voor gemeenteactiviteiten',
                  'Resultaten live zichtbaar',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-[#30466e] dark:text-zinc-300">
                    <Check className="h-4 w-4 shrink-0 text-[#6f8ed4] dark:text-[#9db5dc]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* How it works - compact strip */}
          <div className="mt-10 rounded-xl border border-[#dce8f8] bg-white/60 px-6 py-4 dark:border-zinc-700 dark:bg-zinc-900/60">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Zo snel opgezet
            </p>
            <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-0">
              {[
                '1 persoon start een spel',
                'Deelt de code met de groep',
                'Iedereen speelt direct mee',
              ].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  {i > 0 && (
                    <ArrowRight className="mx-2 hidden h-4 w-4 shrink-0 text-[#6f8ed4] dark:text-[#9db5dc] sm:block" />
                  )}
                  <span className="rounded-lg bg-[#eef3fb] px-3 py-1.5 text-sm font-medium text-[#30466e] dark:bg-[#1a2b47] dark:text-[#9db5dc]">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Button asChild size="lg" className="h-12 rounded-md bg-[#6f8ed4] px-8 text-base font-medium text-white hover:bg-[#5f81cc] dark:bg-[#5b7dd9] dark:hover:bg-[#4a6bc7]">
              <Link href="/registreren">
                Probeer gratis samen spelen
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="mt-3 text-sm text-muted-foreground dark:text-white/60">
              Gratis account aanmaken in 30 seconden - geen creditcard nodig.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
