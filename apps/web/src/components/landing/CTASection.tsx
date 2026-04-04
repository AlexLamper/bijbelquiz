import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DownloadButtons } from "@/components/landing/DownloadButtons"

export function CTASection() {
  return (
    <section className="bg-linear-to-b from-white to-[#e8eef9] dark:from-[#1a2942] dark:to-[#1a2942] py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1a2942] dark:text-white md:text-4xl lg:text-5xl">
            <span className="text-balance">Klaar om je Bijbelkennis te testen?</span>
          </h2>
          
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground dark:text-white/70">
            Download de app of speel direct online. Begin vandaag nog met het ontdekken van de Bijbel op een leuke en interactieve manier.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button className="rounded-full bg-[#5b7dd9] px-8 py-6 text-base font-medium text-white hover:bg-[#4a6bc7]" asChild>
              <Link href="/quizzes">Speel direct online</Link>
            </Button>

            <DownloadButtons />
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground dark:text-white/60">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-[#1a2942] dark:text-white">10K+</span>
              <span>Actieve spelers</span>
            </div>
            <div className="h-6 w-px bg-border dark:bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-[#1a2942] dark:text-white">100+</span>
              <span>Quizzen</span>
            </div>
            <div className="h-6 w-px bg-border dark:bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-[#1a2942] dark:text-white">4.8</span>
              <span>App rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
