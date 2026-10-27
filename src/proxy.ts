import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/inloggen",
  },
})

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
    "/premium/succes/:path*"
  ]
}
