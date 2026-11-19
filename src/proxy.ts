import { getToken } from "next-auth/jwt"
import { NextResponse, type NextRequest } from "next/server"

import { siteUrl } from "@/config/routes"

/**
 * Signed-out visitors to the pages below are sent to the sign-in page. This was
 * `withAuth` from next-auth/middleware, which builds that redirect from the
 * request host - correct on bijbelquiz.com and on biblequizzes.app, but wrong on
 * the prefixed languages, which are proxied: the browser was sent to the
 * deployment's own vercel.app host instead of biblequizzes.app/<lang>. `siteUrl`
 * uses the site's public base URL and the localized path, so the address bar
 * keeps showing the site the person is on.
 */
export default async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  if (token) return NextResponse.next()

  const target = siteUrl("/inloggen", request.url)
  target.searchParams.set("callbackUrl", request.nextUrl.pathname + request.nextUrl.search)
  return NextResponse.redirect(target)
}

// Only the pages that are meaningless without an account. Playing, browsing
// and the leaderboard are open to everybody; an account is asked for where
// there is something to keep. The pages that need one but are not listed here
// (profiel, instellingen, beoordeling) redirect themselves.
//
// The Dutch paths, not the English ones: `next.config.ts` redirects the old
// routes before the middleware ever runs, so an English entry here matched
// nothing.
//
// Not `/account-verwijderen`: it is linked from the footer and the app store
// listings, and has to explain deletion to visitors who are not signed in.
export const config = {
  matcher: [
    "/beheer/:path*",
    "/dashboard/:path*",
    "/premium/succes/:path*",
    // intl serves this page at its English URL; NL redirects it before this runs.
    "/premium/success/:path*"
  ]
}
