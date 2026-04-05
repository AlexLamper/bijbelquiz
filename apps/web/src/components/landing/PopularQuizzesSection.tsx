import QuizCard, { QuizItem } from "@/components/QuizCard"

interface PopularQuizzesSectionProps {
  quizzes: QuizItem[]
  isPremiumUser: boolean
}

export function PopularQuizzesSection({ quizzes, isPremiumUser }: PopularQuizzesSectionProps) {
  return (
    <section className="bg-white dark:bg-[#1a2942] py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1a2942] dark:text-white md:text-4xl lg:text-5xl">
            Populaire Quizzen
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground dark:text-white/70">
            Ontdek de meest gespeelde quizzen en daag jezelf uit met verschillende categorieën uit de Bijbel.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {quizzes.map((quiz) => (
            <QuizCard key={quiz._id} quiz={quiz} isPremiumUser={isPremiumUser} />
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href="/quizzes"
            className="inline-flex items-center gap-2 font-medium text-primary dark:text-[#5b7dd9] transition-colors hover:text-[#4a6bc7]"
          >
            Bekijk alle quizzen
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}


