import QuizCard, { QuizItem } from '@/components/QuizCard';
import { ArrowLink, SectionHead } from '@/components/editorial';

interface PopularQuizzesSectionProps {
  quizzes: QuizItem[];
  isPremiumUser: boolean;
}

export function PopularQuizzesSection({ quizzes, isPremiumUser }: PopularQuizzesSectionProps) {
  if (quizzes.length === 0) return null;

  return (
    <section id="quizzen" className="bg-paper">
      <div className="mx-auto w-full max-w-[1180px] px-5 pt-12 sm:px-8 lg:px-10 lg:pt-20">
        <SectionHead
          eyebrow="Quizzen"
          title="Populaire Quizzen"
          lead="Ontdek de meest gespeelde quizzen en daag jezelf uit met verschillende categorieën uit de Bijbel."
          action={<ArrowLink href="/quizzen">Bekijk alle quizzen</ArrowLink>}
        />

        <div className="mt-7 grid gap-x-6 gap-y-9 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-10 xl:grid-cols-4">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={isPremiumUser} />
          ))}
        </div>
      </div>
    </section>
  );
}
