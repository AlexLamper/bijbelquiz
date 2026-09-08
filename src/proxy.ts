import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/inloggen",
  },
})

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/premium/succes/:path*",
    "/quizzes/:path*",
    "/quiz/:path*",
    "/account-verwijderen/:path*"
  ]
}