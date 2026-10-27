import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import RoomClient from '@/components/web2/samen/RoomClient';
import { loadRoomQuizMeta } from '@/components/web2/samen/room-meta';
import { authOptions } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'Wachtkamer',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function SamenLobbyPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  const { roomCode } = await params;

  if (!session) {
    // Back into this room after signing in, so an invite link still lands here.
    redirect(`/inloggen?callbackUrl=${encodeURIComponent(`/samen-spelen/${roomCode}/lobby`)}`);
  }

  const meta = await loadRoomQuizMeta(roomCode);
  return <RoomClient roomCode={roomCode} view="lobby" categoryTitle={meta.categoryTitle} />;
}
