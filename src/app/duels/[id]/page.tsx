import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';

import { DuelPlay } from '@/components/web2/duels/DuelPlay';
import { authOptions } from '@/lib/auth';
import { isDuelError } from '@/lib/duels/errors';
import { getDuel, type DuelView } from '@/lib/duels/service';
import { t } from '@/i18n';
import { isNlSite } from '@/config/site';

export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.duels-id.title'),
    robots: { index: false, follow: false },
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Playing one duel. Chromeless (SiteShell): the page draws its own
 * PlayHeader with "Duel verlaten". Only the two players can open it; for
 * anybody else the duel does not exist, exactly as the API answers.
 */
export default async function DuelPlayPage({ params }: PageProps) {
  // Dutch-only: the sister product and the legacy duels have no intl version.
  if (!isNlSite()) notFound();
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? String(session.user.id) : null;
  if (!userId) {
    redirect(`/inloggen?callbackUrl=${encodeURIComponent(`/duels/${id}`)}`);
  }

  let duel: DuelView;
  try {
    duel = await getDuel(userId, id);
  } catch (error) {
    if (isDuelError(error) && error.status === 404) notFound();
    throw error;
  }

  return <DuelPlay key={duel.id} initialDuel={duel} />;
}
