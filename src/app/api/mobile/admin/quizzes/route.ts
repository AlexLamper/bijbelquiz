import { NextResponse } from 'next/server';

import { listAdminQuizzes } from '@/lib/admin/quizzes';
import { requireAdmin, serverError } from '@/lib/admin/api-auth';

export const dynamic = 'force-dynamic';

/** Quiz moderation list for the app. Contract: docs/setup/admin-api.md (6). */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const params = new URL(req.url).searchParams;
    return NextResponse.json(await listAdminQuizzes({ status: params.get('status'), q: params.get('q') }));
  } catch (error) {
    return serverError('ADMIN_QUIZZES_APP', error);
  }
}
