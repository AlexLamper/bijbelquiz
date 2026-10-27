import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { Container } from '@/components/bq';
import { ContactForm } from '@/components/web2/marketing/ContactForm';
import { AlertIcon, ChevronRightIcon, IconTile, MailIcon } from '@/components/web2/marketing/icons';
import { authOptions } from '@/lib/auth';
import { supportEmail } from '@/lib/support-email';

export const metadata: Metadata = {
  title: 'Contact & Veelgestelde Vragen | BijbelQuiz Support',
  description: 'Heb je een vraag over BijbelQuiz? Bekijk onze FAQ of neem contact op. Wij helpen je graag verder.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact - BijbelQuiz',
    description: 'Stel je vraag of bekijk antwoorden op de supportpagina.',
    url: 'https://www.bijbelquiz.com/contact',
  },
};

const QUICK_ANSWERS = [
  { label: 'Hoe zeg ik Premium op?', href: '/hulp#premium-opzeggen' },
  { label: 'Hoe werkt een duel?', href: '/hulp#duel' },
  { label: 'Hoe verwijder ik mijn account?', href: '/hulp#account-verwijderen' },
];

export default async function ContactPage() {
  const email = supportEmail();
  // Signed-in players do not have to type their name and address again.
  const session = await getServerSession(authOptions).catch(() => null);

  return (
    <Container as="section" className="pb-20 pt-14">
      <h1 className="m-0 text-[32px] leading-[38px] m:text-[40px] m:leading-[48px]">Contact</h1>
      <p className="mt-2.5 max-w-[720px] text-lg font-semibold leading-7 text-ink-soft">
        Een vraag over je account, Premium of de app? Stuur ons een bericht, we helpen je graag.
      </p>

      <div className="mt-8 grid grid-cols-1 items-start gap-6 m:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ContactForm defaultName={session?.user?.name ?? ''} defaultEmail={session?.user?.email ?? ''} />

        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3.5 rounded-[16px] border border-line bg-card p-[22px]">
            <IconTile tone="lapis">
              <MailIcon />
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="m-0 font-sans text-[17px] font-extrabold">Liever zelf mailen?</h2>
              <a href={`mailto:${email}`} className="break-all text-base font-extrabold no-underline">
                {email}
              </a>
              <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-muted">
                We reageren meestal binnen 1 tot 2 werkdagen.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 rounded-[16px] border border-line bg-card p-[22px]">
            <IconTile tone="coral">
              <AlertIcon />
            </IconTile>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <h2 className="m-0 font-sans text-[17px] font-extrabold">Iets werkt niet goed?</h2>
              <p className="m-0 text-[15px] font-semibold leading-[22px] text-ink-muted">
                Meld een fout, dan zoeken we het uit.
              </p>
              <Link
                href="/foutmelding#melden"
                className="flex min-h-8 items-center gap-1 self-start text-[15px] font-extrabold no-underline"
              >
                Fout melden
                <ChevronRightIcon size={16} strokeWidth={2.6} />
              </Link>
            </div>
          </div>

          <nav
            aria-labelledby="contact-faq-title"
            className="flex flex-col gap-1.5 rounded-[16px] border border-line bg-card px-[22px] pb-3.5 pt-[22px]"
          >
            <h2 id="contact-faq-title" className="m-0 font-sans text-[17px] font-extrabold">
              Misschien staat je antwoord er al
            </h2>
            <ul className="m-0 list-none p-0">
              {QUICK_ANSWERS.map((item) => (
                <li key={item.href} className="border-b border-line-soft last:border-b-0">
                  <Link
                    href={item.href}
                    className="flex min-h-12 items-center gap-2.5 text-[15px] font-bold text-ink no-underline hover:text-lapis"
                  >
                    <span className="flex-1">{item.label}</span>
                    <ChevronRightIcon size={18} className="text-ink-faint" />
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/hulp" className="mt-1 flex min-h-8 items-center gap-1 self-start text-[15px] font-extrabold no-underline">
              Alle vragen in de hulp
              <ChevronRightIcon size={16} strokeWidth={2.6} />
            </Link>
          </nav>
        </div>
      </div>
    </Container>
  );
}
