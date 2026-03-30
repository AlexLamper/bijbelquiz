import { Button } from "@/components/ui/button"
import { Check, Crown, Sparkles, BookOpen, Trophy, Zap } from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Onbeperkte Quizzen",
    description: "Krijg toegang tot alle 100+ quizzen zonder limieten.",
  },
  {
    icon: Sparkles,
    title: "Geen Advertenties",
    description: "Speel zonder onderbrekingen en focus op je leerproces.",
  },
  {
    icon: Trophy,
    title: "Exclusieve Badges",
    description: "Verdien speciale badges en onderscheidingen.",
  },
  {
    icon: Zap,
    title: "Vroege Toegang",
    description: "Krijg als eerste toegang tot nieuwe quizzen en functies.",
  },
]

const benefits = [
  "Alle categorieën ontgrendeld",
  "Gedetailleerde statistieken",
  "Offline modus beschikbaar",
  "Prioriteit ondersteuning",
  "Maandelijkse nieuwe content",
]

export function PremiumSection() {
  return (
    <section className="bg-[#1a2942] py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-[#5b7dd9]/20 px-4 py-2">
              <Crown className="h-5 w-5 text-[#5b7dd9]" />
              <span className="text-sm font-medium text-[#5b7dd9]">Premium</span>
            </div>
            
            <h2 className="font-serif text-3xl font-medium leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
              <span className="text-balance">Ontgrendel de volledige</span>
              <br />
              <span className="text-balance text-[#5b7dd9]">BijbelQuiz ervaring.</span>
            </h2>
            
            <p className="mt-6 max-w-lg leading-relaxed text-white/70">
              Upgrade naar Premium en krijg onbeperkte toegang tot alle quizzen, 
              exclusieve functies en een advertentievrije ervaring.
            </p>

            <ul className="mt-8 space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3 text-white/90">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5b7dd9]">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Button className="rounded-full bg-[#5b7dd9] px-8 py-6 text-base font-medium text-white hover:bg-[#4a6bc7]">
                Word nu Premium
              </Button>
              <div className="flex items-baseline gap-1 text-white">
                <span className="text-2xl font-semibold">€4,99</span>
                <span className="text-white/60">/maand</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/10"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#5b7dd9]/20">
                  <feature.icon className="h-6 w-6 text-[#5b7dd9]" />
                </div>
                <h3 className="mb-2 font-serif text-lg font-medium text-white">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
