import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { connectDB, Quiz } from '@/database';

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface QuizDoc {
  _id: string;
  title: string;
  slug?: string;
  description?: string;
  difficulty?: string;
  questions?: Array<unknown>;
  categoryId?: { title?: string };
  isPremium?: boolean;
  status?: string;
}

async function getQuizBySlug(slug: string): Promise<QuizDoc | null> {
  await connectDB();
  const filter = {
    slug,
    $or: [{ status: 'approved' }, { status: { $exists: false } }],
  };
  const quiz = await Quiz.findOne(filter).populate('categoryId', 'title').lean();
  if (!quiz) return null;
  return JSON.parse(JSON.stringify(quiz)) as QuizDoc;
}

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

export default async function QuizLandingPage({ params }: PageProps) {
  const { slug } = await params;
  const quiz = await getQuizBySlug(slug);
  if (!quiz) notFound();

  const playPath = `/quiz/${quiz.slug || quiz._id}`;
  const questionCount = Array.isArray(quiz.questions) ? quiz.questions.length : 0;
  const category = quiz.categoryId?.title || 'Bijbel';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Quiz',
    name: `${quiz.title} bijbelquiz`,
    description:
      quiz.description ||
      `Speel de ${quiz.title} bijbelquiz en test je kennis met vragen over ${category}.`,
    url: `https://www.bijbelquiz.com/bijbelquiz/${quiz.slug || slug}`,
    educationalLevel: quiz.difficulty || 'medium',
  };

  return (
    <main className="-mt-24 min-h-screen bg-transparent pt-24 dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-6xl px-4 pb-12 pt-10 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-[#607597] dark:text-[#9db5dc]">
          Bijbelquiz pagina
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#1f2f4b] dark:text-zinc-100 md:text-4xl">
          {quiz.title} bijbelquiz
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {quiz.description ||
            `Speel deze ${category.toLowerCase()} bijbelquiz online en ontdek hoeveel jij al weet.`}
        </p>

        <div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border px-3 py-1">{category}</span>
          <span className="rounded-full border px-3 py-1">{questionCount} vragen</span>
          <span className="rounded-full border px-3 py-1">
            {quiz.isPremium ? 'Premium quiz' : 'Gratis quiz'}
          </span>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={playPath}
            className="inline-flex items-center rounded-md bg-[#6f8ed4] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#5f81cc]"
          >
            Start {quiz.title} quiz
          </Link>
          <Link
            href="/quizzes"
            className="inline-flex items-center rounded-md border border-[#d7e1ee] bg-white px-5 py-2.5 text-sm font-semibold text-[#30466e] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Bekijk alle quizzen
          </Link>
        </div>
      </section>
    </main>
  );
}
