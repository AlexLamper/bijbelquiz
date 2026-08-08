'use client';

import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

import { trackEvent } from '@/components/GoogleAnalytics';
import { QuizTile, type DashboardQuiz } from '@/components/editorial/QuizTile';
import {
  ArrowLink,
  Eyebrow,
  Figure,
  InkButton,
  Panel,
  PIGMENT_TEXT,
  QuietButton,
  SectionHead,
  type Pigment,
} from '@/components/editorial';

interface ProgressDoc {
  quizId?: { _id: string; title: string; slug?: string; categoryId?: { title: string } };
  score: number;
  totalQuestions: number;
  completedAt: string;
}

interface DashboardHomeClientProps {
  quizzes: DashboardQuiz[];
  recentProgress: ProgressDoc[];
  streak: number;
  xp: number;
  level: number;
  levelProgress: number;
  totalQuizzesDone: number;
  userName: string;
  isPremium: boolean;
  greeting: string;
  dateLabel: string;
}

const categories: {
  title: string;
  description: string;
  href: string;
  pigment: Pigment;
}[] = [
  {
    title: 'Oude Testament',
    description: 'Van de schepping tot de profeten',
    href: '/quizzen?category=oude-testament',
    pigment: 'neutral',
  },
  {
    title: 'Nieuwe Testament',
    description: 'Evangelien, brieven en Openbaring',
    href: '/quizzen?category=nieuwe-testament',
    pigment: 'lapis',
  },
  {
    title: 'Bijbelse figuren',
    description: 'Koningen, profeten en apostelen',
    href: '/quizzen?category=bijbelse-figuren',
    pigment: 'vermilion',
  },
  {
    title: 'Themas en verhalen',
    description: 'Wonderen, gelijkenissen en gebeurtenissen',
    href: '/quizzen?category=verhalen',
    pigment: 'verdigris',
  },
];

/** A result speaks for itself: strong scores read verdigris, weak ones stay quiet. */
function scorePigment(score: number, total: number): string {
  if (!total) return 'text-ink';
  const ratio = score / total;
  if (ratio >= 0.8) return PIGMENT_TEXT.verdigris;
  if (ratio >= 0.5) return PIGMENT_TEXT.neutral;
  return PIGMENT_TEXT.vermilion;
}

const shortDate = new Intl.DateTimeFormat('nl-NL', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/Amsterdam',
});

export default function DashboardHomeClient({
  quizzes,
  recentProgress,
  streak,
  xp,
  level,
  levelProgress,
  totalQuizzesDone,
  userName,
  isPremium,
  greeting,
  dateLabel,
}: DashboardHomeClientProps) {
  const featured = quizzes.slice(0, 6);
  const history = recentProgress.filter((entry) => entry.quizId).slice(0, 4);
  const latest = history[0];

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto w-full max-w-[1180px] px-5 pb-16 pt-8 sm:px-8 lg:px-10 lg:pt-10">
        {/* ── Masthead ─────────────────────────────────────────────────────── */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <Eyebrow>Dashboard</Eyebrow>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
              {dateLabel}
            </p>
          </div>

          <div className="mt-6 grid gap-x-12 gap-y-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <h1 className="font-display text-[38px] font-normal leading-[1.06] tracking-[-0.025em] text-ink sm:text-[46px] lg:text-[52px]">
                {greeting},{' '}
                <span className="text-lapis">{userName}</span>.
              </h1>

              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-ink-muted">
                Neem de draad weer op waar je gebleven was, of begin aan iets nieuws.
                Elke quiz brengt je een stap verder in de Schrift.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <InkButton href="/quizzen">
                <Play className="h-4 w-4" />
                Speel een quiz
              </InkButton>

              {latest?.quizId && (
                <QuietButton href={`/quiz/${latest.quizId.slug || latest.quizId._id}`}>
                  Ga verder
                  <ArrowRight className="h-4 w-4" />
                </QuietButton>
              )}
            </div>
          </div>
        </section>

        {/* ── Figures ──────────────────────────────────────────────────────── */}
        <section className="mt-8 border-y border-rule py-5 lg:mt-9">
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4 md:gap-y-0 md:divide-x md:divide-rule">
            <Figure
              label="Ervaring"
              value={xp.toLocaleString('nl-NL')}
              meta="XP verzameld"
              pigment="lapis"
            />
            <Figure
              label="Niveau"
              value={level}
              progress={levelProgress}
              meta={`${levelProgress}% naar niveau ${level + 1}`}
              pigment="lapis"
            />
            <Figure
              label="Afgerond"
              value={totalQuizzesDone.toLocaleString('nl-NL')}
              meta={totalQuizzesDone === 1 ? 'quiz gespeeld' : 'quizzen gespeeld'}
              pigment="verdigris"
            />
            <Figure
              label="Reeks"
              value={streak}
              meta={streak > 0 ? (streak === 1 ? 'dag op rij' : 'dagen op rij') : 'begin vandaag'}
              pigment="vermilion"
            />
          </div>
        </section>

        {/* ── Featured quizzes ─────────────────────────────────────────────── */}
        <section className="pt-11 lg:pt-14">
          <SectionHead
            eyebrow="Voor jou"
            title="Aanbevolen quizzen"
            action={<ArrowLink href="/quizzen">Alle quizzen</ArrowLink>}
          />

          {featured.length === 0 ? (
            <div className="mt-7 rounded-lg border border-dashed border-rule px-6 py-16 text-center">
              <p className="font-display text-lg text-ink">Nog geen quizzen beschikbaar</p>
              <p className="mt-1.5 text-sm text-ink-muted">
                Zodra er quizzen klaarstaan verschijnen ze hier.
              </p>
            </div>
          ) : (
            <div className="mt-7 grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
              {featured.map((quiz) => (
                <QuizTile key={quiz._id} quiz={quiz} isPremiumUser={isPremium} />
              ))}
            </div>
          )}
        </section>

        {/* ── Categories ───────────────────────────────────────────────────── */}
        <section className="pt-11 lg:pt-14">
          <SectionHead
            eyebrow="Bladeren"
            title="Verken per categorie"
            pigment="lapis"
            action={<ArrowLink href="/quizzen">Alle categorieen</ArrowLink>}
          />

          <div className="mt-7 grid gap-px overflow-hidden rounded-lg border border-rule bg-rule sm:grid-cols-2">
            {categories.map((category, index) => (
              <Link
                key={category.title}
                href={category.href}
                className="group flex items-start gap-5 bg-paper-raised p-5 transition-colors hover:bg-paper-sunken"
              >
                <span
                  className={`pt-1 font-display text-sm tabular-nums ${PIGMENT_TEXT[category.pigment]}`}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-display text-lg leading-snug text-ink">
                    {category.title}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-muted">
                    {category.description}
                  </span>
                </span>

                <ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-ink-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-ink" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── History + side panels ────────────────────────────────────────── */}
        <section className="pt-11 lg:pt-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-12">
            <div>
              <SectionHead eyebrow="Historie" title="Onlangs gespeeld" pigment="verdigris" />

              {history.length === 0 ? (
                <p className="mt-6 text-sm leading-relaxed text-ink-muted">
                  Je hebt nog geen quiz afgerond. Zodra je er een speelt, vind je je
                  resultaten hier terug.
                </p>
              ) : (
                <ul className="divide-y divide-rule">
                  {history.map((entry, index) => (
                    <li key={`${entry.quizId?._id}-${index}`}>
                      <Link
                        href={`/quiz/${entry.quizId?.slug || entry.quizId?._id}`}
                        className="group flex items-center justify-between gap-6 py-4"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-display text-[17px] leading-snug text-ink transition-colors group-hover:text-lapis-strong">
                            {entry.quizId?.title}
                          </span>
                          <span className="mt-1.5 block text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">
                            {entry.quizId?.categoryId?.title || 'Algemeen'}
                            <span className="mx-2 text-rule-strong">/</span>
                            {shortDate.format(new Date(entry.completedAt))}
                          </span>
                        </span>

                        <span
                          className={`shrink-0 font-display text-xl tabular-nums ${scorePigment(entry.score, entry.totalQuestions)}`}
                        >
                          {entry.score}
                          <span className="text-base text-ink-muted">/{entry.totalQuestions}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <Panel tone="lapis">
                <Eyebrow pigment="lapis">Samen spelen</Eyebrow>
                <h3 className="mt-4 font-display text-xl font-normal leading-snug text-ink">
                  Speel live met vrienden of familie
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                  Open een kamer, deel de code en beantwoord de vragen tegelijk.
                </p>
                <div className="mt-6">
                  <ArrowLink href="/samen-spelen">Naar samen spelen</ArrowLink>
                </div>
              </Panel>

              {!isPremium && (
                <Panel tone="lapis">
                  <Eyebrow>Premium</Eyebrow>
                  <h3 className="mt-4 font-display text-xl font-normal leading-snug text-ink">
                    Onbeperkt spelen en verdiepen
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
                    Kamers tot 20 spelers, exclusieve quizzen en uitleg bij elke vraag.
                  </p>
                  <div className="mt-6">
                    <ArrowLink
                      href="/premium"
                      onClick={() =>
                        trackEvent('multiplayer_premium_cta_clicked', {
                          placement: 'dashboard_panel',
                        })
                      }
                    >
                      Bekijk Premium
                    </ArrowLink>
                  </div>
                </Panel>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
