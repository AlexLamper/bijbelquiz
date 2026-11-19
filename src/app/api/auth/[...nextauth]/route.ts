import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// Intl languages other than English live under a prefix (biblequizzes.app/de).
// On Vercel NextAuth builds its URLs from the request host alone and drops the
// prefix, so Google would be sent back to the English site. Without these two
// variables it uses NEXTAUTH_URL (https://biblequizzes.app/de/api/auth) instead.
// NL and English are untouched.
if (
  process.env.SITE === 'intl' &&
  process.env.SITE_LOCALE &&
  process.env.SITE_LOCALE !== 'en' &&
  process.env.NEXTAUTH_URL?.includes(`/${process.env.SITE_LOCALE}/api/auth`)
) {
  delete process.env.VERCEL;
  delete process.env.AUTH_TRUST_HOST;
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
