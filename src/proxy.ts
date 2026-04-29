import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/profile/:path*",
    "/premium/:path*",
    "/quizzes/:path*",
    "/quiz/:path*",
    "/account-verwijderen/:path*"
  ]
}