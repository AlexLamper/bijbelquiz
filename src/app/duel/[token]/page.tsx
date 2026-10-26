import type { Metadata } from 'next';
import Link from 'next/link';

import { DownloadButtons } from '@/components/landing/DownloadButtons';
import { getInvitePreview, type InvitePreview } from '@/lib/duels/service';

/**
 * Where a shared duel link lands for somebody without the app.
 *
 * Duels are played in the app only. With the app installed the OS opens the
 * link there directly (once `/duel/*` is in the app-link files); everybody else
 * gets this page: who challenged them, what a duel is, and the download.
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
  const invite = await loadInvite(token);

  const name = invite?.challenger.name ?? null;
  const joinable = invite?.joinable ?? false;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="mb-4 font-serif text-4xl font-normal tracking-tight text-ink sm:text-5xl">
        {invite && joinable
          ? `${name} daagt je uit voor een duel`
          : 'Deze uitnodiging is niet meer geldig'}
      </h1>
      <p className="mb-8 max-w-md text-lg leading-relaxed text-ink-soft">
        {invite && joinable
          ? '1 tegen 1, 3 rondes van 3 vragen, om de beurt. Je speelt dit duel gratis in de BijbelQuiz-app. Heb je de app al? Open deze link dan op je telefoon.'
          : 'Iemand anders speelt dit duel al, of het is verlopen. Daag zelf iemand uit in de BijbelQuiz-app.'}
      </p>
      <DownloadButtons />
      <Link href="/quizzen" className="mt-6 text-sm font-medium text-ink-soft underline underline-offset-4">
        Of speel nu een quiz op de website
      </Link>
    </div>
  );
}
