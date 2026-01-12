'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { BookOpen, LogOut, User as UserIcon, Star } from 'lucide-react';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-110">
            <BookOpen className="h-4 w-4" />
          </div>
          <span className="text-xl font-bold font-serif tracking-tight text-foreground">
            Bijbel<span className="text-primary italic">Quiz</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
           <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
              <Link href="/" className="hover:text-primary transition-colors">Home</Link>
              {(!session || !session.user.isPremium) && (
                <Link href="/premium" className="hover:text-primary transition-colors">Premium</Link>
              )}
           </nav>

          <div className="flex items-center gap-3">
            {status === 'authenticated' && session ? (
              <>
                {session.user.isPremium ? (
                  <div className="hidden sm:flex items-center gap-1.5 rounded-full bg-amber-100/50 px-3 py-1 text-xs font-semibold text-amber-600 border border-amber-200">
                    <Star className="h-3 w-3 fill-current" />
                    <span>PRO</span>
                  </div>
                ) : (
                  <Link href="/premium" className="hidden sm:block">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary">
                      Word Premium
                    </Button>
                  </Link>
                )}
                
                <div className="flex items-center gap-3 pl-3 border-l border-border/40">
                  <Link href="/profile" className="flex flex-col items-end hidden sm:flex hover:opacity-80 transition-opacity">
                    <span className="text-sm font-medium leading-none text-foreground">{session.user.name || 'Gebruiker'}</span>
                    <span className="text-xs text-muted-foreground">{session.user.email}</span>
                  </Link>
                  <Button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    variant="ghost" 
                    size="icon"
                    className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : status === 'loading' ? (
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-medium">Inloggen</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="font-semibold shadow-sm">Registreren</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
