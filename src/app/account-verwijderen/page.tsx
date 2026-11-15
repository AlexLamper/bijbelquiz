import type { Metadata } from 'next';
import { pageAlternates } from '@/config/routes';
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
import { t, tList } from '@/i18n';
import { rich } from '@/i18n/rich';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.account-verwijderen.title'),
    description: t('pages.account-verwijderen.description'),
    alternates: pageAlternates('/account-verwijderen'),
  };
}

export const dynamic = 'force-dynamic';

const nl = new Intl.NumberFormat(t('bq.header.numberLocale'));

function plural(count: number, oneKey: string, manyKey: string) {
  return t(count === 1 ? oneKey : manyKey, { count: nl.format(count) });
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
      const link = user.password ? t('pagesBody.delete.linkPassword') : user.appleId ? t('pagesBody.delete.linkApple') : t('pagesBody.delete.linkGoogle');
      account = {
        profile: t('pagesBody.delete.profile', { link }),
        progress: t('pagesBody.delete.progress', { xp: nl.format(user.xp || 0), level, streak: plural(user.streak || 0, 'pagesBody.delete.dayOne', 'pagesBody.delete.dayMany'), badges: plural((user.badges || []).length, 'pagesBody.delete.badgeOne', 'pagesBody.delete.badgeMany') }),
      };
    }
  }

  const email = supportEmail();
  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(t('pagesBody.delete.mailSubject'))}&body=${encodeURIComponent(
    [
      ...tList('pagesBody.delete.mailBody'),
    ].join('\n'),
  )}`;

  const items = [
    {
      title: t('pagesBody.delete.t1'),
      text: account?.profile ?? t('pagesBody.delete.profileDefault'),
      icon: <User className="size-5" strokeWidth={2.2} />,
      tone: 'bg-chip text-ink-soft',
    },
    {
      title: t('pagesBody.delete.t2'),
      text: account?.progress ?? t('pagesBody.delete.progressDefault'),
      icon: <BoltIcon size={20} />,
      tone: 'bg-gold-tint',
    },
    {
      title: t('pagesBody.delete.t3'),
      text: t('pagesBody.delete.duelsText'),
      icon: <Swords className="size-5" strokeWidth={2.2} />,
      tone: 'bg-coral-tint text-coral-text',
    },
    {
      title: t('pagesBody.delete.t4'),
      text: t('pagesBody.delete.prefsText'),
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
          title={t('account.settings.delete')}
          subtitle={deleted ? t('pagesBody.delete.doneSub') : t('pagesBody.delete.sub')}
          backHref={signedIn ? '/instellingen' : '/'}
          backLabel={signedIn ? t('pagesBody.delete.backSettings') : t('pagesBody.delete.backHome')}
        />

        <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
          <div className="flex min-w-0 flex-col gap-5">
            {deleted && (
              <Card as="section" padding="none" aria-labelledby="done-title" className="flex flex-col gap-3 px-4 py-5 m:p-7">
                <h2 id="done-title" className="m-0 text-[22px] leading-7">
                  {t('pagesBody.delete.doneTitle')}
                </h2>
                <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-soft">
                  {t('pagesBody.delete.doneText')}
                </p>
                <div>
                  <Button href="/" variant="secondary">
                    {t('pagesBody.delete.toHome')}
                  </Button>
                </div>
              </Card>
            )}

            <Card as="section" padding="none" aria-labelledby="step1-title" className="flex flex-col gap-5 px-4 py-5 m:p-7">
              <StepTitle id="step1-title" step={1} title={t('pagesBody.delete.step1')} />
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
                <h3 className="m-0 font-sans text-[15px] font-extrabold">{t('pagesBody.delete.keepTitle')}</h3>
                <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-soft">
                  {t('pagesBody.delete.keepText')}
                </p>
              </div>
            </Card>

            {!deleted && (
              <Card as="section" padding="none" aria-labelledby="step2-title" className="flex flex-col gap-5 px-4 py-5 m:p-7">
                <StepTitle id="step2-title" step={2} title={t('pagesBody.delete.step2')} />
                <div className="flex items-start gap-3.5">
                  <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-gold-tint">
                    <CrownSolidIcon size={20} />
                  </span>
                  <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-soft">
                    {rich(t('pagesBody.delete.premiumNote'), {
                      head: <span className="font-extrabold text-ink">{t('pagesBody.delete.premiumHead')}</span>,
                      link: (
                        <Link href={signedIn ? '/instellingen#abonnement' : '/premium'} className="font-bold underline">
                          {t('account.settings.managePremium')}
                        </Link>
                      ),
                    })}
                  </p>
                </div>
                {signedIn ? (
                  <DeleteAccountConfirm />
                ) : (
                  <div className="flex flex-col gap-4">
                    <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-soft">
                      {t('pagesBody.delete.loginText')}
                    </p>
                    <div>
                      <Button href="/inloggen?callbackUrl=%2Faccount-verwijderen" size="xl">
                        {t('pagesBody.delete.loginButton')}
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
                  {t('pagesBody.delete.cantLogin')}
                </h2>
                <p className="m-0 text-[15px] leading-[23px] font-semibold text-ink-soft">
                  {t('pagesBody.delete.mailText')}
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
                {t('pagesBody.delete.inApp')}
              </h2>
              <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
                {tList('pagesBody.delete.appSteps').map((step, index) => (
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
              {rich(t('pagesBody.delete.moreData'), {
                link: (
                  <Link href="/privacybeleid" className="font-bold underline">
                    {t('pagesBody.delete.privacyWord')}
                  </Link>
                ),
              })}
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
