import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    isAdmin?: boolean
  }
  interface Session {
    user: {
      isAdmin?: boolean
    } & import("next-auth").DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isAdmin?: boolean
  }
}
