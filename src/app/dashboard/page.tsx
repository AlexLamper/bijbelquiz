import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { QuizCard, type QuizCardProps } from '@/components/bq';
import {
  ContinueBookCard,
  DuelTurnCard,
  LevelCard,
  QuizOfTheDayCard,
  TopicTiles,
  type DuelTurn,
  type TopicTile,
} from '@/components/web2/browsing/DashboardParts';
import { SeasonCard } from '@/components/web2/browsing/SeasonCard';
import { connectDB, User } from '@/database';
import { authOptions } from '@/lib/auth';
import { listDuels } from '@/lib/duels/service';
import { getLevelInfo } from '@/lib/gamification';
import { loadBrowseCatalogue } from '@/lib/quiz-browse';
import {
  bookGroups,
  continueInBook,
  pickPopular,
  playedOf,
  quizHref,
  referenceFor,
  themeGroups,
  type BrowseQuiz,
} from '@/lib/quiz-browse-shape';
import { pickQuizOfTheDay } from '@/lib/quiz-of-the-day-pick';
import { resolveQuizPassage } from '@/lib/quiz-passage';
import { calculateNextStreak } from '@/lib/streak';

export const metadata: Metadata = {
  title: 'Dashboard - BijbelQuiz',
  description: 'Jouw persoonlijke Bijbelquiz dashboard.',
  robots: { index: false, follow: true },
};

export const dynamic = 'force-dynamic';

/** The reference colours of the popular tiles, as in the approved dashboard. */
const KICKER_TONES: NonNullable<QuizCardProps['kickerTone']>[] = ['lapis', 'gold', 'green'];

interface QuizOfTheDayDoc {
  _id: unknown;
  title: string;
  slug?: string;
  rewardXp?: number;
  questions?: Array<{ bibleReference?: string }>;
}

/** Today's quiz as a card; taken from the catalogue so it carries the same reference and cover. */
async function quizOfTheDay(catalogue: BrowseQuiz[]): Promise<BrowseQuiz | null> {
  const doc = (await pickQuizOfTheDay().catch(() => null)) as QuizOfTheDayDoc | null;
  if (!doc) return null;
  const id = String(doc._id);
  const known = catalogue.find((quiz) => quiz.id === id);
  if (known) return known;
  const passage = resolveQuizPassage(doc.questions ?? []);
  return {
    id,
    slug: doc.slug || id,
    title: doc.title,
    description: null,
    reference: passage ? referenceFor(passage.book, passage.chapter, passage.chapter) : null,
    questionCount: doc.questions?.length ?? 0,
    rewardXp: doc.rewardXp ?? 50,
    cover: null,
    book: null,
    chapterFrom: null,
    chapterTo: null,
    category: null,
    isPremium: false,
    players: 0,
    progress: null,
  };
}

async function duelWaitingForMe(userId: string): Promise<DuelTurn | null> {
  try {
    const { myTurn } = await listDuels(userId);
    const duel = myTurn.find((entry) => entry.opponent);
    if (!duel || !duel.opponent) return null;
    return {
      id: duel.id,
      opponentName: duel.opponent.name,
      myScore: duel.myScore,
      opponentScore: duel.opponentScore,
      round: duel.currentRound,
    };
  } catch (error) {
    console.error('[DASHBOARD_DUELS]', error);
    return null;
  }
}

function topicTiles(quizzes: BrowseQuiz[]): TopicTile[] {
  const otBooks = bookGroups(quizzes, 'OT').length;
  const ntBooks = bookGroups(quizzes, 'NT').length;
  const themes = themeGroups(quizzes);
  const general = themes.find((group) => /algemeen/i.test(`${group.key} ${group.title}`));
  const tiles: TopicTile[] = [];
  if (otBooks > 0) tiles.push({ key: 'ot', title: 'Oude Testament', detail: `${otBooks} ${otBooks === 1 ? 'boek' : 'boeken'}`, href: '/quizzen?filter=oude-testament' });
  if (ntBooks > 0) tiles.push({ key: 'nt', title: 'Nieuwe Testament', detail: `${ntBooks} ${ntBooks === 1 ? 'boek' : 'boeken'}`, href: '/quizzen?filter=nieuwe-testament' });
  if (themes.length > 0) {
    tiles.push({
      key: 'algemeen',
      title: 'Algemeen',
      detail: 'Hele Bijbel',
      href: general ? `/quizzen?thema=${encodeURIComponent(general.key)}` : '/quizzen?filter=themas',
    });
    tiles.push({ key: 'themas', title: "Thema's", detail: 'Per thema', href: '/quizzen?filter=themas' });
  }
  return tiles;
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  // The middleware already sends guests to /inloggen; this keeps the page safe without it.
  if (!userId) redirect('/inloggen?callbackUrl=/dashboard');

  await connectDB();
  const user = await User.findById(userId).select('xp streak bestStreak quizzesPlayed lastPlayedAt').lean();

  let streak = user?.streak || 0;
  // A signed-in dashboard visit counts as activity for the streak.
  if (user) {
    const now = new Date();
    const previous = user.lastPlayedAt ? new Date(user.lastPlayedAt) : null;
    const { nextStreak } = calculateNextStreak(previous, user.streak || 0, now);
    if (nextStreak !== (user.streak || 0) || !user.lastPlayedAt) {
      await User.findByIdAndUpdate(userId, {
        $set: { streak: nextStreak, bestStreak: Math.max(user.bestStreak || 0, nextStreak), lastPlayedAt: now },
      });
    }
    streak = nextStreak;
  }

  const [{ quizzes }, duel] = await Promise.all([loadBrowseCatalogue(userId), duelWaitingForMe(userId)]);
  const daily = await quizOfTheDay(quizzes);
  const popular = pickPopular(quizzes, 6);
  const tiles = topicTiles(quizzes);
  const resume = continueInBook(quizzes);

  const xp = user?.xp || 0;
  const level = getLevelInfo(xp);

  // Resolved on the server in the reader's timezone, so the greeting does not
  // change between server render and hydration (the server runs in UTC).
  const hour = Number(
    new Intl.DateTimeFormat('nl-NL', { hour: 'numeric', hour12: false, timeZone: 'Europe/Amsterdam' }).format(new Date()),
  );
  const greeting = hour < 12 ? 'Goedemorgen' : hour < 18 ? 'Goedemiddag' : 'Goedenavond';
  const firstName = session.user.name?.trim().split(/\s+/)[0];

  return (
    <div className="mx-auto box-border flex w-full max-w-[1200px] flex-col gap-7 px-4 pb-20 pt-6 m:px-8 m:pt-10">
      <div className="flex flex-col gap-1">
        <h1 className="m-0 text-[30px] leading-9 m:text-[40px] m:leading-[48px]">
          {greeting}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="m-0 text-[17px] font-semibold leading-[23px] text-ink-muted">Ga verder waar je gebleven was, of begin aan iets nieuws.</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-x-10 gap-y-8 m:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-9">
          {daily && <QuizOfTheDayCard quiz={daily} />}
          <SeasonCard />
          <TopicTiles tiles={tiles} />
          {popular.length > 0 && (
            <section className="flex flex-col gap-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="m-0 text-[26px] leading-8">Populaire quizzen</h2>
                <Link href="/quizzen?filter=populair" className="whitespace-nowrap text-[15px] font-extrabold no-underline">
                  Alle quizzen
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 m:grid-cols-3 m:gap-4">
                {popular.map((quiz, index) => (
                  <QuizCard
                    key={quiz.id}
                    href={quizHref(quiz)}
                    title={quiz.title}
                    reference={quiz.reference}
                    questionCount={quiz.questionCount}
                    kickerTone={KICKER_TONES[index % KICKER_TONES.length]}
                    imageUrl={quiz.cover}
                    seed={quiz.slug}
                    played={playedOf(quiz)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside aria-label="Jouw overzicht" className="flex min-w-0 flex-col gap-6 max-m:-order-1">
          <LevelCard
            summary={{
              level: level.level,
              xp,
              progress: level.progressPercentage,
              toNext: level.isMaxLevel ? null : Math.max(0, level.nextLevelXp - xp),
              streak,
              quizzesPlayed: user?.quizzesPlayed || 0,
            }}
          />
          {resume && (
            <ContinueBookCard
              next={resume.next}
              book={resume.book}
              played={resume.played}
              total={resume.total}
              allHref={`/quizzen?boek=${resume.book.slug}`}
            />
          )}
          {duel && <DuelTurnCard duel={duel} />}
        </aside>
      </div>
    </div>
  );
}
