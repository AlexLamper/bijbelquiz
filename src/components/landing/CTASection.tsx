import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DownloadButtons } from "@/components/landing/DownloadButtons"

export function CTASection() {
  return (
    <section className="bg-linear-to-b from-white to-[#e8eef9] dark:from-zinc-950 dark:to-black py-16 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-[#1a2942] dark:text-white md:text-4xl lg:text-5xl">
            <span className="text-balance">Klaar om je Bijbelkennis te testen?</span>
          </h2>
          
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground dark:text-white/70">
            Download de app of speel direct online. Begin vandaag nog met het ontdekken van de Bijbel op een leuke en interactieve manier.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
            <Button className="h-14 rounded-2xl bg-primary px-8 text-base font-medium text-white hover:bg-primary/90 dark:bg-[#5b7dd9] dark:hover:bg-[#4a6bc7]" asChild>
              <Link href="/quizzes">Speel direct online</Link>
            </Button>

            <DownloadButtons compactOnMobile />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground dark:text-white/70">
            <Link href="https://www.bijbel-studie.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground dark:hover:text-white">
              Verdiep je verder via Bijbel Studie
            </Link>
            <span className="hidden sm:inline">•</span>
            <Link href="https://www.bijbelapi.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground dark:hover:text-white">
              Ontwikkeld met de Nederlandse BijbelAPI
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground dark:text-white/60">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-semibold text-[#1a2942] dark:text-white">200+</span>
              <span>Vragen</span>
            </div>
            <div className="hidden sm:block h-6 w-px bg-border dark:bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl font-semibold text-[#1a2942] dark:text-white">4.8</span>
              <span>App rating</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
