import NextAuth, { DefaultSession, DefaultUser } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPremium: boolean;
      role: 'user' | 'admin';
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string;
    isPremium: boolean;
    role: 'user' | 'admin';
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isPremium: boolean;
    role: 'user' | 'admin';
  }
}
