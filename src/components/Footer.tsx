import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#152c31] py-12 text-slate-300 mt-auto border-t border-[#0d1d20]">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold font-serif tracking-tight text-white">
              Bijbel<span className="text-amber-400 italic">Quiz</span>
            </span>
          </div>
          <p className="text-sm opacity-80 max-w-xs">
            Test je kennis van de Bijbel in een klassieke leeromgeving.
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-8 text-sm opacity-80">
          <Link href="/privacy-policy" className="hover:opacity-100 transition-colors">Privacybeleid</Link>
          <Link href="/terms-of-service" className="hover:opacity-100 transition-colors">Algemene Voorwaarden</Link>
          <Link href="/contact" className="hover:opacity-100 transition-colors">Contact</Link>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t border-white/10 text-center text-xs opacity-60">
        &copy; {new Date().getFullYear()} BijbelQuiz. Alle rechten voorbehouden.
      </div>
    </footer>
  );
}
