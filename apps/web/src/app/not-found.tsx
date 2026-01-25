
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-4 text-center">
      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
        <FileQuestion className="h-12 w-12" />
      </div>
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl font-serif text-[#152c31] dark:text-foreground">
        404 - Oeps
      </h1>
      <p className="mb-8 max-w-md text-lg text-slate-600 dark:text-muted-foreground leading-relaxed">
        De pagina die u zoekt lijkt niet te bestaan.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" asChild className="bg-[#152c31] hover:bg-[#1f3e44] text-white">
          <Link href="/">
             <Home className="mr-2 h-4 w-4" /> Terug naar Home
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild className="border-slate-200 bg-white">
          <Link href="/quizzes">
            Bekijk alle quizzen
          </Link>
        </Button>
      </div>
    </div>
  );
}
