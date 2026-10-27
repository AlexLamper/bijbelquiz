import type { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';

import { Avatar, Button, PlayHeader, StoreBadges } from '@/components/bq';
import { JoinInviteButton } from '@/components/web2/duels/JoinInviteButton';
import { DUEL_RULES_LINE } from '@/components/web2/duels/format';
import { authOptions } from '@/lib/auth';
import { getInvitePreview, type InvitePreview } from '@/lib/duels/service';

/**
 * Where a shared duel link lands.
 *
 * With the app installed the OS opens the link there directly (once `/duel/*`
 * is in the app-link files). Everybody else gets this page: who challenged
 * them and what a duel is, and - now that duels are played on the website
 * too - "Speel mee" (signed in) or sign in / create an account to play. The
 * app download stays underneath. Joining is free; there is no premium check
 * anywhere in the duel flow.
 */

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Je bent uitgedaagd voor een duel - BijbelQuiz',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ token: string }>;
}

async function loadInvite(token: string): Promise<InvitePreview | null> {
  try {
    return await getInvitePreview(token);
  } catch {
    return null;
  }
}

export default async function DuelInvitePage({ params }: PageProps) {
  const { token } = await params;
  const [invite, session] = await Promise.all([loadInvite(token), getServerSession(authOptions)]);
  const userId = session?.user?.id ? String(session.user.id) : null;

  const name = invite?.challenger.name ?? null;
  const joinable = invite?.joinable ?? false;
  const ownInvite = !!invite && !!userId && invite.challenger.id === userId;
  const callback = encodeURIComponent(`/duel/${token}`);

  let title: string;
  let body: string;
  if (invite && joinable && ownInvite) {
    title = 'Dit is je eigen uitnodiging';
    body = 'Stuur de link naar iemand anders. Zodra die meedoet, zie je het duel bij Duels.';
  } else if (invite && joinable) {
    title = `${name} daagt je uit voor een duel`;
    body = `${DUEL_RULES_LINE}. Je speelt dit duel gratis, op de website of in de app.`;
  } else {
    title = 'Deze uitnodiging is niet meer geldig';
    body = userId
      ? 'Iemand anders speelt dit duel al, of het is verlopen. Speel je het zelf al? Dan staat het bij je duels.'
      : 'Iemand anders speelt dit duel al, of het is verlopen. Daag zelf iemand uit voor een duel.';
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <PlayHeader leaveLabel="Naar BijbelQuiz" leaveHref={userId ? '/dashboard' : '/'} />
      <main className="mx-auto flex w-full max-w-[560px] grow flex-col justify-center gap-5 px-5 pb-16 pt-10 m:px-8">
        <section className="flex flex-col items-center gap-5 rounded-[16px] border border-line bg-card px-6 py-8 text-center m:px-8">
          {invite && (
            <Avatar
              name={invite.challenger.name}
              size={72}
              ring={joinable && !ownInvite ? 'gold' : undefined}
              title=""
            />
          )}
          <div className="flex flex-col gap-2">
            <h1 className="m-0 text-balance text-[26px] leading-8 m:text-[32px] m:leading-10">{title}</h1>
            <p className="m-0 text-base font-semibold leading-6 text-ink-muted">{body}</p>
          </div>

          {invite && joinable && !ownInvite && userId && <JoinInviteButton token={token} />}

          {invite && joinable && !ownInvite && !userId && (
            <div className="flex w-full flex-col gap-2.5">
              <Button href={`/inloggen?callbackUrl=${callback}`} variant="danger" size="xl" block>
                Inloggen en meespelen
              </Button>
              <Button href={`/registreren?callbackUrl=${callback}`} variant="secondary" size="xl" block>
                Gratis account maken
              </Button>
            </div>
          )}

          {(ownInvite || !joinable) && (
            <Button href="/duels" size="xl" block>
              {userId ? 'Naar je duels' : 'Naar Duels'}
            </Button>
          )}
        </section>

        <section className="flex flex-col items-center gap-3 text-center">
          <p className="m-0 text-[15px] font-semibold text-ink-muted">
            Liever in de app? Heb je de app al, open deze link dan op je telefoon.
          </p>
          <StoreBadges className="justify-center" />
          <Link href="/quizzen" className="mt-1 text-[15px] font-extrabold no-underline">
            Of speel nu een quiz op de website
          </Link>
        </section>
      </main>
    </div>
  );
}
