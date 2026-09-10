import { Check } from 'lucide-react';

import { InkButton, SectionHead } from '@/components/editorial';

const scenarios = [
  {
    title: 'Zondagavond met het gezin',
    body: "Het gezin zit samen op de bank. Wie kent de Bijbel het best? Met BijbelQuiz test je het samen - spannend voor jong en oud. Eén persoon start een spel, deelt de code, en iedereen kan meedoen op z'n eigen telefoon of laptop.",
    points: [
      'Geschikt voor alle leeftijden',
      'Geen installatie nodig',
      'Speel op elk apparaat',
      '2 tot 8 spelers gratis',
    ],
  },
  {
    title: 'Jeugdvereniging of groepsactiviteit',
    body: 'Op zoek naar een leuke activiteit voor een grotere groep? BijbelQuiz is perfect voor jeugdavonden en gemeentelijke bijeenkomsten. Iedereen speelt tegelijk mee - spannend, interactief en leerzaam.',
    points: [
      'Tot 20 spelers in één spel',
      'Ideaal voor jeugdavonden',
      'Geschikt voor gemeenteactiviteiten',
      'Resultaten live zichtbaar',
    ],
  },
];

const steps = ['1 persoon start een spel', 'Deelt de code met de groep', 'Iedereen speelt direct mee'];

export function MultiplayerHighlightSection() {
  return (
    <section className="bg-paper">
      <div className="mx-auto w-full max-w-[1180px] px-5 pt-12 sm:px-8 lg:px-10 lg:pt-20">
        <SectionHead
          eyebrow="Samen spelen"
          title="Speciaal ontworpen voor groepen"
          lead="Van gezin tot jeugdvereniging - iedereen speelt mee. Geen installatie, gewoon een code delen en direct beginnen."
        />

        <div className="mt-7 grid gap-px overflow-hidden rounded-lg border border-rule bg-rule md:grid-cols-2">
          {scenarios.map((scenario) => (
            <article key={scenario.title} className="bg-paper-raised p-5 sm:p-7">
              <h3 className="font-display text-lg font-normal leading-snug text-ink sm:text-xl">
                {scenario.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{scenario.body}</p>

              <ul className="mt-6 space-y-2.5 border-t border-rule pt-5">
                {scenario.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-ink-soft">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-positive" />
                    {point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Three numbered beats on one rule. */}
        <div className="mt-7 border-y border-rule py-6">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-ink-muted">
            Zo snel opgezet
          </p>

          <ol className="mt-4 grid gap-4 sm:grid-cols-3 sm:gap-8">
            {steps.map((step, index) => (
              <li key={step} className="flex items-baseline gap-3">
                <span className="font-display text-sm tabular-nums text-lapis">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm leading-relaxed text-ink-soft">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-7 flex flex-col items-start gap-x-6 gap-y-3 sm:flex-row sm:items-center">
          <InkButton href="/samen-spelen" className="w-full sm:w-auto">
            Probeer gratis samen spelen
          </InkButton>
          <p className="text-xs leading-relaxed text-ink-muted">
            Een spel starten kan met een gratis account - geen creditcard nodig.
          </p>
        </div>
      </div>
    </section>
  );
}
