import { Card, CardContent } from "@/components/ui/card"
import { Scroll, BookText, Users, Bookmark, Award } from "lucide-react"

const categories = [
  {
    icon: Scroll,
    title: "Oude Testament",
    questions: "500+ vragen",
    color: "bg-[#5b7dd9]/10",
  },
  {
    icon: BookText,
    title: "Nieuwe Testament",
    questions: "450+ vragen",
    color: "bg-[#d9a55b]/10",
  },
  {
    icon: Users,
    title: "Bijbelse Figuren",
    questions: "300+ vragen",
    color: "bg-[#5bd99a]/10",
  },
  {
    icon: Bookmark,
    title: "Thema's & Verhalen",
    questions: "250+ vragen",
    color: "bg-[#d95b7d]/10",
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
            Met meer dan 1500 vragen verdeeld over 50+ categorieën is er altijd iets nieuws te ontdekken in de Statenvertaling.
          </p>
        </div>

        <div className="mb-12 flex flex-wrap items-center justify-center gap-8 md:gap-16">
          <div className="text-center">
            <div className="font-serif text-4xl font-medium text-[#5b7dd9] md:text-5xl">1500+</div>
            <div className="mt-1 text-sm text-muted-foreground dark:text-white/60">Vragen</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-4xl font-medium text-[#5b7dd9] md:text-5xl">50+</div>
            <div className="mt-1 text-sm text-muted-foreground dark:text-white/60">Categorieën</div>
          </div>
          <div className="text-center">
            <div className="font-serif text-4xl font-medium text-[#5b7dd9] md:text-5xl">3</div>
            <div className="mt-1 text-sm text-muted-foreground dark:text-white/60">Moeilijkheidsgraden</div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category, index) => (
            <Card 
              key={index}
              className="group cursor-pointer border border-[#1a2942]/5 dark:border-white/10 bg-card/80 dark:bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-[#5b7dd9]/20 hover:bg-card dark:hover:bg-white/10 hover:shadow-md min-w-[200px]"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${category.color}`}>
                  <category.icon className="h-5 w-5 text-[#1a2942] dark:text-white" />
                </div>
                
                <div className="min-w-0">
                  <h3 className="font-serif text-base font-medium text-[#1a2942] dark:text-white group-hover:text-[#5b7dd9]">
                    {category.title}
                  </h3>
                  <p className="text-sm text-muted-foreground dark:text-white/60">
                    {category.questions}
                  </p>
                </div>
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
