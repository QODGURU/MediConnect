import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's id */
      id: string
      /** The user's role */
      role: "admin" | "doctor"
    } & DefaultSession["user"]
  }

  interface User {
    /** The user's role */
    role: "admin" | "doctor"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    /** The user's id */
    id: string
    /** The user's role */
    role: "admin" | "doctor"
  }
}
