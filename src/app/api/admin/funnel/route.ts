import { NextResponse } from 'next/server';

import { requireAdmin, serverError } from '@/lib/admin/api-auth';
import { getDayThirtyRetention, getFunnelReport } from '@/lib/analytics/funnel';
import { readWindowDays } from '@/lib/analytics/insights';

export const dynamic = 'force-dynamic';

/** The money funnel. Contract: docs/setup/admin-api.md (8). */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  try {
    const windowDays = readWindowDays(new URL(req.url).searchParams.get('days'));
    const [report, retention] = await Promise.all([getFunnelReport(windowDays), getDayThirtyRetention()]);
    return NextResponse.json({ windowDays, report, retention });
  } catch (error) {
    return serverError('ADMIN_FUNNEL', error);
  }
}
