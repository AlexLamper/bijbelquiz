'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on quiz pages (e.g. /quiz/123)
  if (pathname?.startsWith('/quiz/') && pathname.split('/').length > 2) {
    return null;
  }

  return (
    <footer className="w-full bg-[#152c31] py-12 text-slate-300 mt-auto border-t border-[#0d1d20]">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div className="flex flex-col items-center md:items-start gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold font-serif tracking-tight text-white">
              Bijbel<span className="text-white/90 italic">Quiz</span>
            </span>
          </div>
          <p className="text-sm opacity-80 max-w-xs leading-relaxed">
            Test je kennis van de Bijbel in een klassieke leeromgeving.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-6 md:gap-8 text-sm font-medium opacity-80">
          <Link href="/privacy-policy" className="hover:text-white hover:opacity-100 transition-colors">Privacybeleid</Link>
          <Link href="/terms-of-service" className="hover:text-white hover:opacity-100 transition-colors">Algemene Voorwaarden</Link>
          <Link href="/contact" className="hover:text-white hover:opacity-100 transition-colors">Contact</Link>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-10 pt-8 border-t border-white/10 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} BijbelQuiz. Alle rechten voorbehouden.
      </div>
    </footer>
  );
}
