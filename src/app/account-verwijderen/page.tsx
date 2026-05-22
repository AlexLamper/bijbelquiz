import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Mail, ShieldCheck, Trash2 } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supportEmail } from '@/lib/support-email';

export const metadata: Metadata = {
  title: 'Account Verwijderen | BijbelQuiz',
  description: 'Dien een verzoek in om je BijbelQuiz account en bijbehorende gegevens te verwijderen.',
  alternates: { canonical: '/account-verwijderen' },
};

export default function DeleteAccountPage() {
  const email = supportEmail();
  const emailSubject = encodeURIComponent('Verzoek tot accountverwijdering');
  const emailBody = encodeURIComponent(
    [
      'Hallo BijbelQuiz team,',
      '',
      'Ik wil graag mijn account laten verwijderen.',
      'Mijn account e-mailadres is: [vul hier je e-mailadres in]',
      '',
      'Alvast bedankt.',
    ].join('\n')
  );
  const mailtoHref = `mailto:${email}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="-mt-24 min-h-screen bg-transparent pb-12 pt-24 dark:bg-linear-to-b dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <section className="mx-auto max-w-340 px-4 pt-10 sm:px-5 lg:px-4">
        <h1 className="text-4xl text-[#1f2f4b] dark:text-zinc-100">Account verwijderen</h1>
        <p className="mt-3 max-w-3xl text-sm text-[#5f7297] dark:text-zinc-300">
          Wil je je BijbelQuiz account en persoonsgegevens verwijderen? Op deze pagina vind je de snelste manier
          om dit aan te vragen en wat er daarna met je gegevens gebeurt.
        </p>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-7 sm:px-5 lg:px-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Card className="border-[#d8e1ee] bg-white/80 py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-6">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#f8ecec] dark:bg-[#3a1f1f]">
                <Trash2 className="h-5 w-5 text-[#8b2f2f] dark:text-[#f3b7b7]" />
              </div>
              <h2 className="text-2xl text-[#1f2f4b] dark:text-zinc-100">Verwijderen via e-mail</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Heb je de app niet meer op je telefoon? Stuur dan een verzoek per e-mail. We verwerken je aanvraag
                binnen maximaal 14 dagen.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild className="bg-[#6f8ed4] text-white hover:bg-[#5f81cc]">
                  <a href={mailtoHref}>
                    <Mail className="mr-2 h-4 w-4" />
                    Open e-mail app
                  </a>
                </Button>
                <Button asChild variant="outline" className="border-[#d2ddee] text-[#2f466f] hover:bg-[#f5f8fd] dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-800">
                  <a href={`mailto:${email}`}>{email}</a>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Stuur je verzoek bij voorkeur vanaf het e-mailadres waarmee je bent geregistreerd. Dan kunnen we je
                account sneller verifiëren.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#d8e1ee] bg-white/80 py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
            <CardContent className="p-6">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#eef4ff] dark:bg-[#1f3356]">
                <ShieldCheck className="h-5 w-5 text-[#355384] dark:text-[#9db5dc]" />
              </div>
              <h2 className="text-2xl text-[#1f2f4b] dark:text-zinc-100">Sneller via de app</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Als je nog toegang hebt tot je account, kun je verwijderen direct in de app starten via profiel of
                instellingen.
              </p>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-[#30466e] dark:text-zinc-300">
                <li>Open BijbelQuiz en log in.</li>
                <li>Ga naar je profiel of instellingen.</li>
                <li>Kies <strong>Account verwijderen</strong> en bevestig.</li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-340 px-4 pt-8 sm:px-5 lg:px-4">
        <Card className="border-[#d8e1ee] bg-white/80 py-0 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/70">
          <CardContent className="space-y-6 p-6">
            <div>
              <h3 className="text-xl text-[#1f2f4b] dark:text-zinc-100">Wat verwijderen we?</h3>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[#30466e] dark:text-zinc-300">
                <li>Je profielgegevens zoals naam, e-mailadres en profielfoto.</li>
                <li>Accountkoppelingen en inloggegevens.</li>
                <li>Quizvoortgang, scores, voorkeuren en gerelateerde appdata.</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl text-[#1f2f4b] dark:text-zinc-100">Wat bewaren we wettelijk?</h3>
              <p className="mt-3 text-sm text-muted-foreground">
                Voor fiscale en wettelijke verplichtingen kunnen anonieme transactiegegevens van aankopen tijdelijk
                bewaard blijven. Deze zijn na verwijdering niet meer gekoppeld aan je persoonlijke account.
              </p>
            </div>

            <div className="rounded-md border border-[#efd6d6] bg-[#fff6f6] p-3 text-sm text-[#7a2f2f] dark:border-[#6b3030] dark:bg-[#321c1c] dark:text-[#efc1c1]">
              <p className="inline-flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4" />
                Accountverwijdering is permanent.
              </p>
              <p className="mt-1">Na verwerking kun je verwijderde gegevens niet herstellen.</p>
            </div>

            <p className="text-sm text-muted-foreground">
              Meer weten over privacy? Bekijk ons{' '}
              <Link href="/privacybeleid" className="font-medium text-[#355384] hover:underline dark:text-[#9db5dc]">
                privacybeleid
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
