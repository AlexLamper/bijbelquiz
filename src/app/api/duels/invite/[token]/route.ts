import { NextRequest } from 'next/server';
import { handleInvitePreview } from '@/lib/duels/handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return handleInvitePreview(req, token);
}
