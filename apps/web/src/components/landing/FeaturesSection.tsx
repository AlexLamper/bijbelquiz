import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Award } from "lucide-react"

const categories = [
  {
    title: "Oude Testament",
    questions: "500+ vragen",
    imageUrl: '/images/quizzes/img1.png',
  },
  {
    title: "Nieuwe Testament",
    questions: "450+ vragen",
    imageUrl: '/images/quizzes/img2.png',
  },
  {
    title: "Bijbelse Figuren",
    questions: "300+ vragen",
    imageUrl: '/images/quizzes/img3.png',
  },
  {
    title: "Thema's & Verhalen",
    questions: "250+ vragen",
    imageUrl: '/images/quizzes/img4.png',
  },
]

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24 dark:bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1a2942] dark:text-white md:text-4xl lg:text-5xl">
            Ontdek de rijkdom van Gods Woord
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground dark:text-white/70">
            Met meer dan 1500 vragen verdeeld over 50+ categorieÃ«n is er altijd iets nieuws te ontdekken in de Statenvertaling.
          </p>
        </div>

        <div className="mb-12 flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <div className="text-center">
            <div className="font-serif text-4xl font-medium text-primary dark:text-[#5b7dd9] md:text-5xl">1500+</div>
            <div className="mt-1 text-sm text-muted-foreground dark:text-white/60">Vragen</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-4xl font-medium text-primary dark:text-[#5b7dd9] md:text-5xl">50+</div>
            <div className="mt-1 text-sm text-muted-foreground dark:text-white/60">CategorieÃ«n</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-4xl font-medium text-primary dark:text-[#5b7dd9] md:text-5xl">3</div>
            <div className="mt-1 text-sm text-muted-foreground dark:text-white/60">Moeilijkheidsgraden</div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Card 
              key={index}
              className="group relative h-32 overflow-hidden rounded-2xl border border-slate-200/70 dark:border-white/10 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="absolute inset-0">
                <Image
                  src={category.imageUrl}
                  alt={category.title}
                  fill
                  quality={80}
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                />
              </div>
              <div className="absolute inset-0 bg-black/45" />
              <CardContent className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center">
                <h3 className="font-serif text-lg font-semibold text-white drop-shadow-md">
                  {category.title}
                </h3>
                <p className="mt-1 text-sm text-white/90">
                  {category.questions}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground dark:text-white/60">
          <Award className="h-4 w-4" />
          <span>Alle vragen gebaseerd op de Statenvertaling</span>
        </div>
      </div>
    </section>
  )
}
