import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import MultiplayerRoomClient from '@/components/multiplayer/MultiplayerRoomClient';
import { authOptions } from '@/lib/auth';

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function MultiplayerGamePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login?callbackUrl=/multiplayer');
  }

  const { roomCode } = await params;
  return <MultiplayerRoomClient roomCode={roomCode} view="game" />;
}
