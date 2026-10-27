import { NextRequest, NextResponse } from 'next/server';

/**
 * `/settings` is the old English path of `/instellingen`. A route handler
 * rather than a page with `redirect()`: the root `loading.tsx` streams a page
 * before it can redirect, which turns the redirect into a client-side one
 * (HTTP 200). This answers with a real permanent redirect, query kept.
 */
export function GET(req: NextRequest) {
  const target = new URL('/instellingen', req.nextUrl.origin);
  target.search = req.nextUrl.search;
  return NextResponse.redirect(target, 308);
}
