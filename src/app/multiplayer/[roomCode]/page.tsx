import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function MultiplayerRoomIndexPage({ params }: PageProps) {
  const { roomCode } = await params;
  redirect(`/multiplayer/${roomCode}/lobby`);
}
