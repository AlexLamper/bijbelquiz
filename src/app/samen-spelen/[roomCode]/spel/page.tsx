import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import RoomClient from '@/components/web2/samen/RoomClient';
import { authOptions } from '@/lib/auth';
import { t } from '@/i18n';

export function generateMetadata(): Metadata {
  return {
    title: t('pages.samen-spelen-roomCode-spel.title'),
    robots: { index: false, follow: false },
  };
}

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

/** Chromeless (see SiteShell): the game draws its own PlayHeader. */
export default async function SamenSpelPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const { roomCode } = await params;

  if (!session) {
    redirect(`/inloggen?callbackUrl=${encodeURIComponent(`/samen-spelen/${roomCode}/lobby`)}`);
  }

  return <RoomClient roomCode={roomCode} view="game" />;
}
