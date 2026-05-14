import Link from "next/link"

export function Footer() {
  return (
    <footer className="bg-[#1a2942] py-12 text-white dark:border-t dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 dark:bg-white/5">
                <img src="/icon/Logo%20-%20dark.svg" alt="BijbelQuiz Logo" className="h-7 w-7 object-contain dark:hidden" />
                <img src="/icon/Logo%20-%20light.svg" alt="BijbelQuiz Logo" className="hidden h-7 w-7 object-contain dark:block" />
              </div>
              <span className="font-serif text-xl font-bold tracking-tight text-white dark:text-zinc-100">
                Bijbel<span className="text-[#9db5dc] dark:text-[#9db5dc]">Quiz</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-white/70 dark:text-zinc-400">
              Test je Bijbelkennis en leer meer over de schrift met onze interactieve quizzen.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white dark:text-zinc-100">Quizzen</h3>
            <ul className="space-y-2 text-sm text-white/70 dark:text-zinc-400">
              <li><Link href="/quizzes" className="hover:text-white transition-colors">Alle Quizzen</Link></li>
              <li><Link href="/leaderboard" className="hover:text-white transition-colors">Ranglijst</Link></li>
              <li><Link href="/multiplayer" className="hover:text-white transition-colors">Samen spelen</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white dark:text-zinc-100">Account</h3>
            <ul className="space-y-2 text-sm text-white/70 dark:text-zinc-400">
              <li><Link href="/login" className="hover:text-white transition-colors">Inloggen</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Registreren</Link></li>
              <li><Link href="/premium" className="hover:text-white transition-colors">Premium</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white dark:text-zinc-100">Informatie</h3>
            <ul className="space-y-2 text-sm text-white/70 dark:text-zinc-400">
              <li><Link href="/help" className="hover:text-white transition-colors">Helpcentrum</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/bug-report" className="hover:text-white transition-colors">Bug report</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacybeleid</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Algemene Voorwaarden</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white dark:text-zinc-100">Meer van ons</h3>
            <ul className="space-y-2 text-sm text-white/70 dark:text-zinc-400">
              <li>
                <Link href="https://www.bijbel-studie.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Bijbel Studie
                </Link>
              </li>
              <li>
                <Link href="https://www.bijbelapi.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  BijbelAPI
                </Link>
              </li>
            </ul>
            <p className="mt-3 text-xs text-white/60 dark:text-zinc-500">
              BijbelQuiz wordt technisch ondersteund door de Nederlandse BijbelAPI.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row dark:border-zinc-800">
          <p className="text-sm text-white/70 dark:text-zinc-400">
            © {new Date().getFullYear()} BijbelQuiz. Alle rechten voorbehouden.
          </p>
          <div className="flex items-center gap-4 text-sm text-white/70 dark:text-zinc-400">
            <span>
              Gemaakt door <span className="text-white dark:text-[#9db5dc]">Alex Lamper</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
