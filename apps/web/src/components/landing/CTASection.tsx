import { Button } from "@/components/ui/button"
import Link from "next/link"

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

            <div className="flex flex-col sm:flex-row gap-3">
              <button className="flex items-center justify-center gap-3 bg-[#1d1d1f] hover:bg-black text-white h-14 px-6 rounded-2xl transition-colors min-w-[160px]">
                  <svg viewBox="0 0 384 512" className="w-8 h-8 fill-current">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  <div className="text-left flex flex-col leading-tight">
                    <span className="text-[10px] text-gray-300">Download in de</span>
                    <span className="text-[17px] font-semibold tracking-wide">App Store</span>
                  </div>
              </button>
              
              <button className="flex items-center justify-center gap-3 bg-[#1d1d1f] hover:bg-black text-white h-14 px-6 rounded-2xl transition-colors min-w-[160px]">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/d/d0/Google_Play_Arrow_logo.svg" alt="Google Play" className="w-8 h-8" />
                  <div className="text-left flex flex-col leading-tight">
                    <span className="text-[10px] text-gray-300">Ontdek het op</span>
                    <span className="text-[17px] font-semibold tracking-wide">Google Play</span>
                  </div>
              </button>
            </div>
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
