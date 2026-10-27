import { NextResponse } from 'next/server';

import { applyQuizAction } from '@/lib/admin/quizzes';
import { readJsonBody, requireAdmin, serverError } from '@/lib/admin/api-auth';

export const dynamic = 'force-dynamic';

/** approve / reject / publish / unpublish / premium. Contract: docs/setup/admin-api.md (6). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const result = await applyQuizAction(id, await readJsonBody(req));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json(result);
  } catch (error) {
    return serverError('ADMIN_QUIZ_ACTION_APP', error);
  }
}
