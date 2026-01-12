'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const { data: session, status } = useSession();

  return (
    <nav className="border-b bg-white dark:bg-slate-950">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-2xl font-bold text-primary">
          BijbelQuiz
        </Link>

        <div className="flex items-center gap-4">
          {status === 'authenticated' && session ? (
            <>
              {session.user.isPremium ? (
                <span className="text-sm font-semibold text-amber-500">Premium</span>
              ) : (
                <Link href="/premium">
                  <Button variant="outline" size="sm">
                    Word Premium
                  </Button>
                </Link>
              )}
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {session.user.name || session.user.email}
              </div>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-slate-500 hover:underline cursor-pointer"
              >
                Uitloggen
              </button>
            </>
          ) : status === 'loading' ? (
            <div className="text-sm text-slate-400">Laden...</div>
          ) : (
            <Link href="/login">
              <Button size="sm">Inloggen</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
