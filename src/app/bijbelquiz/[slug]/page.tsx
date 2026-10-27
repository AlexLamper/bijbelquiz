import { cache } from 'react';
import mongoose from 'mongoose';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { ChevronRight, CircleHelp, Clock, Trophy } from 'lucide-react';

import { BoltIcon, Breadcrumbs, Button, QuizCover, estimateMinutes, type Crumb } from '@/components/bq';
import { BookIcon, SwordsIcon } from '@/components/web2/browsing/illustrations';
import { FreeQuizzesLine, PassageReaderButton } from '@/components/web2/browsing/QuizDetailClient';
import StudieLink from '@/components/StudieLink';
import { connectDB, Quiz } from '@/database';
import { authOptions } from '@/lib/auth';
import { bookByCode } from '@/lib/bible-books';
import { passageFromBookName } from '@/lib/ecosystem-links';
import { getFreeQuizAllowanceForUser } from '@/lib/free-quiz-limit-server';
import { loadBrowseCatalogue } from '@/lib/quiz-browse';
import { playHref, quizHref, sortByChapter, themeGroups, type BrowseQuiz } from '@/lib/quiz-browse-shape';
import { resolveQuizPassage } from '@/lib/quiz-passage';
import { getSiteBaseUrl } from '@/lib/sitemap';
import { quizzenHref } from '@/components/web2/browsing/quizzen-view';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface QuestionRefs {
  bibleReference?: string;
  refBook?: string | null;
  refChapter?: number | null;
  refVerse?: number | null;
  refVerseEnd?: number | null;
}

interface QuizDoc {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  difficulty?: string;
  rewardXp?: number;
  isPremium?: boolean;
  categoryId?: { _id?: string; title?: string; slug?: string };
  questions?: QuestionRefs[];
}

/** One read per request: metadata and page share it. Only the reference fields of the questions. */
const getQuizBySlug = cache(async (slug: string): Promise<QuizDoc | null> => {
  await connectDB();
  const quiz = await Quiz.findOne({ slug, $or: [{ status: 'approved' }, { status: { $exists: false } }] })
    .select(
      'title slug description difficulty rewardXp isPremium categoryId questions.bibleReference questions.refBook questions.refChapter questions.refVerse questions.refVerseEnd',
    )
    .populate('categoryId', 'title slug')
    .lean();
  if (!quiz) return null;
  return JSON.parse(JSON.stringify(quiz)) as QuizDoc;
});

/** The book most questions cite, by canonical code. */
function dominantBookCode(questions: QuestionRefs[]): string | null {
  const counts = new Map<string, number>();
  for (const question of questions) {
    if (question.refBook) counts.set(question.refBook, (counts.get(question.refBook) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  counts.forEach((count, code) => {
    if (count > bestCount) {
      best = code;
      bestCount = count;
    }
  });
  return best;
}

/** "6:1-15": the verses the questions about this chapter cite, or null without verse numbers. */
function verseSpan(questions: QuestionRefs[], code: string, chapter: number): string | null {
  let from: number | null = null;
  let to: number | null = null;
  for (const question of questions) {
    if (question.refBook !== code || question.refChapter !== chapter || !question.refVerse) continue;
    const end = question.refVerseEnd ?? question.refVerse;
    from = from === null ? question.refVerse : Math.min(from, question.refVerse);
    to = to === null ? end : Math.max(to, end);
  }
  if (from === null || to === null) return null;
  return from === to ? `${chapter}:${from}` : `${chapter}:${from}-${to}`;
}

const playedOn = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'Europe/Amsterdam' });

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);

  if (!quiz) {
    return {
      title: 'Bijbelquiz niet gevonden | BijbelQuiz',
      description: 'Deze bijbelquiz bestaat niet of is nog niet beschikbaar.',
    };
  }

  const category = quiz.categoryId?.title || 'Bijbel';
  const title = `${quiz.title} bijbelquiz | ${category} quiz spelen`;
  const description =
    quiz.description ||
    `Speel de ${quiz.title} bijbelquiz online. Test je kennis met vragen over ${category} en krijg direct feedback op je antwoorden.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/bijbelquiz/${quiz.slug || slug}`,
    },
    openGraph: {
      title: `${quiz.title} bijbelquiz`,
      description,
      url: `https://www.bijbelquiz.com/bijbelquiz/${quiz.slug || slug}`,
    },
    keywords: [
      `${quiz.title} bijbelquiz`,
      `${quiz.title} quiz`,
      `${category} bijbelquiz`,
      'bijbelquiz online',
      'bijbelvragen en antwoorden',
    ],
  };
}

/** The neighbours to list: the five closest by chapter, shown in canonical order. */
function nearestSiblings(current: BrowseQuiz, siblings: BrowseQuiz[], count = 5): BrowseQuiz[] {
  const anchor = current.chapterFrom ?? 0;
  const nearest = [...siblings]
    .sort((a, b) => Math.abs((a.chapterFrom ?? 0) - anchor) - Math.abs((b.chapterFrom ?? 0) - anchor))
    .slice(0, count);
  return sortByChapter(nearest);
}

export default async function QuizLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);
  if (!quiz) notFound();

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const questions = quiz.questions ?? [];
  const questionCount = questions.length;
  const category = quiz.categoryId?.title || 'Bijbel';

  // The quiz and its neighbours: the quizzes citing the same book, or the
  // quizzes of the same category for a quiz that is not about one book.
  const bookCode = dominantBookCode(questions);
  const scope = bookCode
    ? { 'questions.refBook': bookCode }
    : quiz.categoryId?._id
      ? { categoryId: new mongoose.Types.ObjectId(quiz.categoryId._id) }
      : { _id: new mongoose.Types.ObjectId(quiz._id) };
  const [{ quizzes: nearby }, allowance] = await Promise.all([
    loadBrowseCatalogue(userId, { match: scope }),
    userId ? getFreeQuizAllowanceForUser({ id: userId, isPremium: session?.user?.isPremium, role: session?.user?.role }) : null,
  ]);
  const card = nearby.find((entry) => entry.id === quiz._id);

  const book = card?.book ?? null;
  const theme = !book && card ? themeGroups([card])[0] ?? null : null;
  const siblings = card
    ? nearby.filter((entry) => entry.id !== card.id && (book ? entry.book?.code === book.code : !entry.book && theme && themeGroups([entry])[0]?.key === theme.key))
    : [];
  const listed = card ? nearestSiblings(card, siblings) : [];
  const groupCount = siblings.length + 1;
  const groupTitle = book?.title ?? theme?.title ?? null;
  const groupHref = book ? quizzenHref({ kind: 'book', slug: book.slug }) : theme ? quizzenHref({ kind: 'theme', key: theme.key }) : '/quizzen';

  // The chapter to read: the printed references must agree on one (see quiz-passage.ts).
  const passage = resolveQuizPassage(questions.map((question) => ({ bibleReference: question.bibleReference })));
  const passageBook = passage ? bookByCode(bookCode) : null;
  const passageLabel = passage ? `${passageBook?.title ?? passage.book} ${passage.chapter}` : null;
  const span = passage && bookCode ? verseSpan(questions, bookCode, passage.chapter) : null;
  const passageTitle = passage ? (span ? `${passageBook?.title ?? passage.book} ${span}` : passageLabel) : null;
  const studiePassage = passage ? passageFromBookName(passage.book, passage.chapter) : null;

  const reference = card?.reference ?? passageLabel;
  const kicker = book && reference ? `Bijbelquiz over ${reference}` : `Bijbelquiz - ${category}`;
  const progress = card?.progress && card.progress.attempts > 0 ? card.progress : null;
  const xp = quiz.rewardXp ?? 50;
  const play = playHref({ slug: quiz.slug || quiz._id, id: quiz._id });

  const crumbs: Crumb[] = [{ label: 'Quizzen', href: '/quizzen' }];
  if (groupTitle) crumbs.push({ label: groupTitle, href: groupHref });
  crumbs.push({ label: quiz.title });

  const baseUrl = getSiteBaseUrl();
  const pageUrl = `https://www.bijbelquiz.com/bijbelquiz/${quiz.slug || slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `${quiz.title} bijbelquiz`,
    description: quiz.description || `Speel de ${quiz.title} bijbelquiz en test je kennis met vragen over ${category}.`,
    url: pageUrl,
    educationalLevel: quiz.difficulty || 'medium',
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: crumb.href ? `${baseUrl}${crumb.href}` : pageUrl,
    })),
  };

  // "Nog N gratis quizzen": signed-in players from their attempts, guests from this browser.
  const remaining: number | null | 'guest' = !userId ? 'guest' : allowance && !allowance.isPremium ? allowance.remaining : null;

  return (
    <div className="mx-auto box-border flex w-full max-w-[1200px] flex-col gap-5 px-4 pb-[72px] pt-5 m:px-8 m:pt-7">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <Breadcrumbs items={crumbs} />

      <div className="grid grid-cols-1 items-start gap-8 m:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex flex-col overflow-hidden rounded-[16px] border border-line bg-card">
            <div className="relative mx-2 mt-2 h-[240px] overflow-hidden rounded-[10px]">
              {reference && (
                <span className="absolute left-4 top-4 z-[1] rounded-full bg-card px-3 py-[5px] text-[13px] font-extrabold text-lapis">{reference}</span>
              )}
              <QuizCover title={quiz.title} imageUrl={card?.cover ?? null} seed={quiz.slug || quiz._id} inset={false} className="!aspect-auto size-full rounded-none" />
            </div>
            <div className="flex flex-col gap-5 px-7 pb-7 pt-6 max-m:p-5">
              <div className="flex flex-col gap-1.5">
                <span className="text-[15px] font-bold text-lapis-text">{kicker}</span>
                <h1 className="m-0 text-[30px] leading-9 m:text-[40px] m:leading-[48px]">{quiz.title}</h1>
                <p className="m-0 mt-1 max-w-[62ch] text-[17px] font-semibold leading-[26px] text-ink-soft">
                  {quiz.description || `Speel deze ${category.toLowerCase()} bijbelquiz online en ontdek hoeveel jij al weet.`}
                </p>
              </div>
              {questionCount > 0 && (
                <ul aria-label="Over deze quiz" className="m-0 grid max-w-[480px] list-none grid-cols-3 gap-2.5 p-0">
                  <li className="flex flex-col items-center gap-0.5 rounded-[12px] bg-lapis-tint px-1.5 py-2.5">
                    <CircleHelp className="size-5 text-lapis" strokeWidth={2.4} aria-hidden="true" />
                    <span className="text-[17px] font-extrabold">{questionCount}</span>
                    <span className="text-xs font-bold text-lapis-text">{questionCount === 1 ? 'vraag' : 'vragen'}</span>
                  </li>
                  <li className="flex flex-col items-center gap-0.5 rounded-[12px] bg-green-tint px-1.5 py-2.5">
                    <Clock className="size-5 text-green" strokeWidth={2.4} aria-hidden="true" />
                    <span className="text-[17px] font-extrabold">{estimateMinutes(questionCount)} min</span>
                    <span className="text-xs font-bold text-green-text">ongeveer</span>
                  </li>
                  {xp > 0 && (
                    <li className="flex flex-col items-center gap-0.5 rounded-[12px] bg-gold-tint px-1.5 py-2.5">
                      <BoltIcon size={20} />
                      <span className="text-[17px] font-extrabold">+{xp}</span>
                      <span className="text-xs font-bold text-gold-text">XP</span>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </section>

          {progress && (
            <section aria-label="Jouw beste score" className="flex items-center gap-3 rounded-[16px] border border-line bg-card px-4 py-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gold-tint text-gold-text">
                <Trophy className="size-5" strokeWidth={2.2} aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-grow flex-col gap-px">
                <span className="text-[15px] font-bold">Jouw beste score</span>
                <span className="text-[13px] font-semibold text-ink-muted">
                  {progress.attempts} keer gespeeld · {playedOn.format(new Date(progress.lastPlayedAt))}
                </span>
              </span>
              <span className="shrink-0 text-[17px] font-extrabold tabular-nums">
                {progress.bestCorrect}/{progress.total}
              </span>
            </section>
          )}

          <div className="mt-1 flex flex-col gap-3">
            <div className="flex flex-col items-stretch gap-3 m:flex-row m:items-center">
              <Button href={play} size="xl" className="px-10" data-analytics-id="quiz.landing.start">
                Start quiz
              </Button>
              <Button href="/duels" variant="secondary" size="xl" className="px-[22px]">
                <SwordsIcon size={18} strokeWidth={2.2} className="text-coral-text" />
                Daag een vriend uit
              </Button>
              {passage && passageLabel && (
                <PassageReaderButton book={passage.book} chapter={passage.chapter} label={passageLabel} playHref={play} variant="link" />
              )}
            </div>
            <FreeQuizzesLine remaining={remaining} />
          </div>
        </div>

        <aside aria-label="Bij deze quiz" className="flex min-w-0 flex-col gap-4">
          {passage && passageTitle && passageLabel && (
            <section aria-label="Het bijbelgedeelte" className="flex flex-col gap-3 rounded-[16px] border border-line bg-card px-5 pb-5 pt-[18px]">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-lapis-tint text-lapis">
                  <BookIcon size={20} />
                </span>
                <span className="flex flex-col gap-px">
                  <span className="text-[13px] font-bold text-ink-muted">Deze quiz gaat over</span>
                  <span className="text-[17px] font-extrabold">{passageTitle}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <PassageReaderButton book={passage.book} chapter={passage.chapter} label={passageLabel} playHref={play} variant="pill" />
                {studiePassage && (
                  <StudieLink
                    passage={studiePassage}
                    surface="quiz_detail"
                    quizSlug={quiz.slug}
                    label="Met uitleg op BijbelStudie"
                    className="inline-flex items-center gap-[5px] text-sm font-bold text-lapis no-underline hover:text-lapis-edge"
                  />
                )}
              </div>
            </section>
          )}

          {groupTitle && listed.length > 0 && (
            <section aria-label={`Meer uit ${groupTitle}`} className="overflow-hidden rounded-[16px] border border-line bg-card">
              <h2 className="m-0 px-5 pb-2.5 pt-4 font-sans text-[17px] font-extrabold">Meer uit {groupTitle}</h2>
              <ul className="m-0 list-none p-0">
                {listed.map((entry, index) => {
                  const played = entry.progress && entry.progress.attempts > 0 ? entry.progress : null;
                  return (
                    <li key={entry.id}>
                      <Link
                        href={quizHref(entry)}
                        className="flex h-16 items-center gap-3 border-t border-line-soft px-5 text-ink no-underline hover:bg-chip hover:text-ink"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-lapis-tint text-[15px] font-extrabold text-lapis">
                          {entry.chapterFrom ?? index + 1}
                        </span>
                        <span className="flex min-w-0 flex-grow flex-col">
                          <span className="truncate text-[15px] font-bold">{entry.title}</span>
                          <span className="truncate text-[13px] font-semibold text-ink-muted">
                            {[entry.reference, `${entry.questionCount} ${entry.questionCount === 1 ? 'vraag' : 'vragen'}`].filter(Boolean).join(' · ')}
                          </span>
                        </span>
                        {played ? (
                          <span className="shrink-0 text-[15px] font-extrabold tabular-nums text-green" aria-label={`Beste score ${played.bestCorrect} van ${played.total}`}>
                            {played.bestCorrect}/{played.total}
                          </span>
                        ) : (
                          <ChevronRight className="size-[18px] shrink-0 text-ink-faint" strokeWidth={2.4} aria-hidden="true" />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <Link href={groupHref} className="flex h-[52px] items-center justify-center border-t border-line-soft text-[15px] font-bold no-underline">
                Alle {groupCount} quizzen uit {groupTitle}
              </Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
