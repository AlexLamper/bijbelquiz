import { Button } from "@/components/ui/button"
import { Check, Crown } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

const benefits = [
  "Alle quizcategorieën en premium quizzen ontgrendeld",
  "Onbeperkt rooms maken voor samen spelen",
  "Uitgebreide voortgang en gedetailleerde statistieken",
  "Toegang tot nieuwe quizzen en inhoud",
]

export function PremiumSection() {
  const monthlyPriceLabel = process.env.NEXT_PUBLIC_PREMIUM_MONTHLY_PRICE_LABEL || '€5,99';
  const lifetimePriceLabel = process.env.NEXT_PUBLIC_PREMIUM_LIFETIME_PRICE_LABEL || '€74,99';

  return (
    <section id="premium" className="bg-[#1a2942] py-16 md:py-24 dark:border-t dark:border-zinc-800 dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <div className="container mx-auto px-6 md:px-10 lg:px-16">
        <div className="mx-auto max-w-7xl py-2 md:py-4">
          <div className="grid items-start gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 text-white/85">
                <Crown className="h-5 w-5 text-white" />
                <span className="text-sm font-medium uppercase tracking-[0.14em]">Premium</span>
              </div>

              <h2 className="font-serif text-3xl font-medium leading-tight tracking-tight text-white md:text-4xl">
                Ontgrendel de volledige BijbelQuiz ervaring.
              </h2>

              <p className="mt-5 max-w-lg leading-relaxed text-white/75">
                Premium geeft je volledige toegang tot alle quizzen, onbeperkte mogelijkheid om samen te spelen met vrienden en familie, en gedetailleerde voortgang om je groei in Bijbelkennis te volgen.
              </p>

              <ul className="mt-7 space-y-3">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3 text-sm text-white/90">
                    <Check className="h-4 w-4 text-[#9db4eb] dark:text-zinc-300" />
                    {benefit}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
                <Button asChild className="h-12 rounded-md bg-[#5b7dd9] px-7 text-base font-medium text-white hover:bg-[#4a6bc7] dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200">
                  <Link href="/premium">Bekijk Premium</Link>
                </Button>

                <div className="text-white">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-semibold">{monthlyPriceLabel}</span>
                    <span className="text-sm text-white/60">per maand</span>
                  </div>
                  <p className="mt-1 text-xs text-white/60">
                    Of levenslang voor {lifetimePriceLabel} eenmalig.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
                Samen spelen
              </p>

              <div className="rounded-2xl border border-white/15 bg-white/5 p-3 shadow-[0_18px_50px_-34px_rgba(0,0,0,0.65)] dark:border-zinc-700 dark:bg-zinc-900/60">
                <div className="relative aspect-16/10 overflow-hidden rounded-xl bg-black/25">
                  <Image
                    src="/images/multiplayer.png"
                    alt="Samen spelen in BijbelQuiz"
                    fill
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="object-cover object-center"
                  />

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/75 via-black/35 to-transparent p-4">
                    <p className="text-sm font-semibold text-white">Speel live samen met vrienden</p>
                    <p className="mt-1 text-xs text-white/80">Zien wie het beste Bijbelkennis heeft in realtime quizzessies.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
