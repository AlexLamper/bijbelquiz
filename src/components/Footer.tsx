import Link from 'next/link';
import { BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-primary py-12 text-primary-foreground mt-auto border-t border-primary/20">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background text-primary">
              <BookOpen className="h-4 w-4" />
            </div>
            <span className="text-xl font-bold font-serif tracking-tight text-white">
              BijbelQuiz
            </span>
          </div>
          <p className="text-sm opacity-80 max-w-xs">
            Test je kennis van de Bijbel in een klassieke leeromgeving.
          </p>
        </div>
        
        <div className="flex gap-8 text-sm opacity-80">
          <Link href="/" className="hover:opacity-100 transition-colors">Home</Link>
          <Link href="/premium" className="hover:opacity-100 transition-colors">Premium</Link>
          <Link href="#" className="hover:opacity-100 transition-colors">Privacy</Link>
          <Link href="#" className="hover:opacity-100 transition-colors">Contact</Link>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-8 pt-8 border-t border-white/10 text-center text-xs opacity-60">
        &copy; {new Date().getFullYear()} BijbelQuiz. Alle rechten voorbehouden.
      </div>
    </footer>
  );
}
