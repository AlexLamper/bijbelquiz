import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ roomCode: string }>;
}

export default async function SamenSpelenRoomIndexPage({ params }: PageProps) {
  const { roomCode } = await params;
  redirect(`/samen-spelen/${roomCode}/lobby`);
}