import { NextRequest } from 'next/server';
import { handleSubmitAnswer } from '@/lib/duels/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleSubmitAnswer(req, id);
}
