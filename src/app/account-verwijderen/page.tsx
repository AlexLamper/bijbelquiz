import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { Mail, SlidersHorizontal, Swords, User } from 'lucide-react';

import { Button, Card, Container, PageBody, PageTitle } from '@/components/bq';
import { BoltIcon } from '@/components/bq/icons';
import { CrownSolidIcon } from '@/components/web2/account/icons';
import DeleteAccountConfirm from '@/components/web2/account/DeleteAccountConfirm';
import { authOptions } from '@/lib/auth';
import { connectDB, User as UserModel } from '@/database';
import { getLevelInfo } from '@/lib/gamification';
import { supportEmail } from '@/lib/support-email';

export const metadata: Metadata = {
  title: 'Account Verwijderen | BijbelQuiz',
  description: 'Verwijder je BijbelQuiz account en bijbehorende gegevens, of dien een verzoek in per e-mail.',
  alternates: { canonical: '/account-verwijderen' },
};

export const dynamic = 'force-dynamic';

const nl = new Intl.NumberFormat('nl-NL');

function plural(count: number, one: string, many: string) {
  return `${nl.format(count)} ${count === 1 ? one : many}`;
}

export default async function DeleteAccountPage({ searchParams }: { searchParams: Promise<{ verwijderd?: string }> }) {
  const { verwijderd } = await searchParams;
  const session = await getServerSession(authOptions);

  let account: { profile: string; progress: string } | null = null;
  if (session?.user?.id) {
    await connectDB();
    const user = await UserModel.findById(session.user.id)
      .select('xp streak badges password appleId')
      .lean();
    if (user) {
      const level = getLevelInfo(user.xp || 0).level;
      const link = user.password ? 'je wachtwoord' : user.appleId ? 'de koppeling met Apple' : 'de koppeling met Google';
      account = {
        profile: `Naam, e-mailadres, profielfoto en ${link}`,
        progress: `${nl.format(user.xp || 0)} XP, level ${level}, je reeks van ${plural(user.streak || 0, 'dag', 'dagen')}, scores en ${plural((user.badges || []).length, 'badge', 'badges')}`,
      };
    }
  }

  const email = supportEmail();
  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent('Verzoek tot accountverwijdering')}&body=${encodeURIComponent(
    [
      'Hallo BijbelQuiz team,',
      '',
      'Ik wil graag mijn account laten verwijderen.',
      'Mijn account e-mailadres is: [vul hier je e-mailadres in]',
      '',
      'Alvast bedankt.',
    ].join('\n'),
  )}`;

  const items = [
    {
      title: 'Je profiel',
      text: account?.profile ?? 'Naam, e-mailadres, profielfoto en de koppeling met Google of Apple',
      icon: <User className="size-5" strokeWidth={2.2} />,
      tone: 'bg-chip text-ink-soft',
    },
    {
      title: 'Je voortgang',
      text: account?.progress ?? 'Je XP, level, reeks, scores en badges',
      icon: <BoltIcon size={20} />,
      tone: 'bg-gold-tint',
    },
    {
      title: 'Je duels en ranglijst',
      text: 'Je duels met vrienden en je plek op de ranglijst',
      icon: <Swords className="size-5" strokeWidth={2.2} />,
      tone: 'bg-coral-tint text-coral-text',
    },
    {
      title: 'Je voorkeuren',
      text: 'Instellingen, interesses en andere appgegevens',
      icon: <SlidersHorizontal className="size-5" strokeWidth={2.2} />,
      tone: 'bg-chip text-ink-soft',
    },
  ];

  const signedIn = Boolean(account);
  const deleted = Boolean(verwijderd) && !signedIn;

  return (
    <Container>
      <PageBody className="m:pb-[88px]">
        <PageTitle
          title="Account verwijderen"
          subtitle={deleted ? 'Je account en je gegevens zijn verwijderd.' : 'Lees eerst wat er verdwijnt. Daarna bevestig je in stap 2.'}
          backHref={signedIn ? '/instellingen' : '/'}
          backLabel={signedIn ? 'Terug naar instellingen' : 'Terug naar de startpagina'}
        />

        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="flex min-w-0 flex-col gap-5">
            {deleted && (
              <Card as="section" padding="none" aria-labelledby="done-title" className="flex flex-col gap-3 px-4 py-5 m:p-7">
                <h2 id="done-title" className="m-0 text-[22px] leading-7">
                  Je account is verwijderd
                </h2>
                <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-soft">
                  Bedankt dat je met BijbelQuiz hebt gespeeld. Je kunt altijd opnieuw beginnen met een nieuw account.
                </p>
                <div>
                  <Button href="/" variant="secondary">
                    Naar de startpagina
                  </Button>
                </div>
              </Card>
            )}

            <Card as="section" padding="none" aria-labelledby="step1-title" className="flex flex-col gap-5 px-4 py-5 m:p-7">
              <StepTitle id="step1-title" step={1} title="Dit wordt verwijderd" />
              <ul className="m-0 flex list-none flex-col p-0">
                {items.map((item) => (
                  <li key={item.title} className="flex items-center gap-3.5 border-b border-line-soft py-3 last:border-b-0">
                    <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-[10px] ${item.tone}`}>
                      {item.icon}
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="text-base font-bold">{item.title}</span>
                      <span className="text-sm font-semibold text-ink-muted">{item.text}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-1 border-t border-line-soft pt-4">
                <h3 className="m-0 font-sans text-[15px] font-extrabold">Wat we wel bewaren</h3>
                <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-soft">
                  Voor de belasting en de wet bewaren we anonieme gegevens van aankopen. Die zijn na het verwijderen niet
                  meer aan jou gekoppeld.
                </p>
              </div>
            </Card>

            {!deleted && (
              <Card as="section" padding="none" aria-labelledby="step2-title" className="flex flex-col gap-5 px-4 py-5 m:p-7">
                <StepTitle id="step2-title" step={2} title="Bevestigen" />
                <div className="flex items-start gap-3.5">
                  <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gold-tint">
                    <CrownSolidIcon size={20} />
                  </span>
                  <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-soft">
                    <span className="font-extrabold text-ink">Heb je Premium?</span> Zeg je abonnement eerst op via{' '}
                    <Link href={signedIn ? '/instellingen#abonnement' : '/premium'} className="font-bold underline">
                      Premium beheren
                    </Link>
                    , of in de App Store of Google Play als je het daar hebt gekocht. Verwijderen stopt een abonnement niet
                    vanzelf.
                  </p>
                </div>
                {signedIn ? (
                  <DeleteAccountConfirm />
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-soft">
                      Log in met het account dat je wilt verwijderen. Daarna bevestig je het hier.
                    </p>
                    <div>
                      <Button href="/inloggen?callbackUrl=%2Faccount-verwijderen" size="xl">
                        Inloggen om te verwijderen
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>

          <aside className="flex min-w-0 flex-col gap-5">
            <Card as="section" padding="none" aria-labelledby="mail-title" className="flex flex-col gap-4 px-4 py-5 m:p-6">
              <div className="flex flex-col gap-1.5">
                <h2 id="mail-title" className="m-0 text-xl leading-[26px]">
                  Kun je niet meer inloggen?
                </h2>
                <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-soft">
                  Mail ons vanaf het e-mailadres van je account. We verwerken je verzoek binnen 14 dagen.
                </p>
              </div>
              <a
                href={mailtoHref}
                className="flex h-12 items-center justify-center gap-2 rounded-[12px] border border-line border-b-[3px] bg-card px-4 text-[15px] font-extrabold text-ink no-underline hover:bg-chip hover:text-ink"
              >
                <Mail className="size-[18px] text-lapis" strokeWidth={2.2} aria-hidden="true" />
                <span className="min-w-0 truncate">{email}</span>
              </a>
            </Card>

            <Card as="section" padding="none" aria-labelledby="app-title" className="flex flex-col gap-3.5 px-4 py-5 m:p-6">
              <h2 id="app-title" className="m-0 text-xl leading-[26px]">
                Liever in de app?
              </h2>
              <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
                {['Open Profiel', 'Tik op het tandwiel', 'Kies Account verwijderen'].map((step, index) => (
                  <li key={step} className="flex items-center gap-2.5 text-[15px] font-bold">
                    <span
                      aria-hidden="true"
                      className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-chip text-[13px] font-extrabold text-ink-soft"
                    >
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </Card>

            <p className="m-0 mx-1 text-[15px] leading-[23px] font-semibold text-ink-muted">
              Meer over je gegevens lees je in het{' '}
              <Link href="/privacybeleid" className="font-bold underline">
                privacybeleid
              </Link>
              .
            </p>
          </aside>
        </div>
      </PageBody>
    </Container>
  );
}

function StepTitle({ id, step, title }: { id: string; step: number; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-lapis-tint text-[15px] font-extrabold text-lapis dark:text-lapis-text"
      >
        {step}
      </span>
      <h2 id={id} className="m-0 text-[22px] leading-7">
        {title}
      </h2>
    </div>
  );
}
