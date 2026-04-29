import type { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Instellingen | BijbelQuiz',
  description: 'Beheer je persoonlijke voorkeuren en accountinstellingen.',
  robots: { index: false, follow: true },
};

export default function InstellingenPage() {
  return (
    <div className="-mt-24 min-h-screen bg-transparent pb-10 pt-24 dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-6 lg:px-8">
        <h1 className="text-4xl text-[#1f2f4b] md:text-5xl dark:text-zinc-100">Instellingen</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#5f7297] dark:text-zinc-300">
          Hier kun je je account- en appvoorkeuren beheren.
        </p>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-6 lg:px-8">
        <Card className="border-[#d8e1ee] shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl text-[#1f2f4b] dark:text-zinc-100">Voorkeuren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Meer instellingen worden binnenkort toegevoegd.</p>
            <p>Tot die tijd kun je profielinformatie aanpassen via je profielpagina.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
