import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import type { UserSettings } from "@/lib/user-settings"

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isPremium: boolean;
      xp: number;
      role: 'user' | 'admin';
      /**
       * Carried on the session so client components can read preferences
       * synchronously. The `jwt` callback already re-reads the user document on
       * every session refresh, so this costs no extra query.
       */
      settings: UserSettings;
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    id: string;
    isPremium: boolean;
    xp: number;
    role: 'user' | 'admin';
    settings?: UserSettings;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isPremium: boolean;
    xp: number;
    role: 'user' | 'admin';
    /**
     * Optional: tokens minted before this field existed, and the mobile login
     * routes, carry no settings. The `session` callback normalizes whatever is
     * (or is not) here into a complete object.
     */
    settings?: UserSettings;
  }
}
