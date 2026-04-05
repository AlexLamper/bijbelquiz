import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#1a2942] py-12 text-white dark:border-t dark:border-white/10">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-[#1a2942]">
                <BookOpen className="h-5 w-5" />
              </div>
              <span className="font-serif text-xl font-medium text-white">
                Bijbel<span className="italic">Quiz</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-white/70">
              Test je Bijbelkennis en groei in je geloof met onze interactieve quizzen.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white">Quizzen</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/quizzes" className="hover:text-white transition-colors">Alle Quizzen</Link></li>
              <li><Link href="/leaderboard" className="hover:text-white transition-colors">Ranglijst</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white">Account</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/login" className="hover:text-white transition-colors">Inloggen</Link></li>
              <li><Link href="/register" className="hover:text-white transition-colors">Registreren</Link></li>
              <li><Link href="/premium" className="hover:text-white transition-colors">Premium</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-medium text-white">Informatie</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-white transition-colors">Privacybeleid</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-white transition-colors">Algemene Voorwaarden</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 md:flex-row">
          <p className="text-sm text-white/70">
            Â© {new Date().getFullYear()} BijbelQuiz. Alle rechten voorbehouden.
          </p>
          <div className="flex items-center gap-4 text-sm text-white/70">
            <span>Gemaakt door Alex Lamper</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
