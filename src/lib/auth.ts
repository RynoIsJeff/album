import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  // NextAuth v5 uses AUTH_SECRET; fall back to NEXTAUTH_SECRET for compatibility
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  // Required on Vercel — requests come through a proxy with x-forwarded-host
  trustHost: true,
  providers: [
    Credentials({
      name: "Family Password",
      credentials: {
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const pw = credentials?.password as string | undefined
        if (!pw) return null
        if (pw === process.env.ADMIN_PASSWORD) {
          return { id: "admin", name: "Admin", isAdmin: true }
        }
        if (pw === process.env.FAMILY_PASSWORD) {
          return { id: "family", name: "Family Member", isAdmin: false }
        }
        return null
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.isAdmin = user.isAdmin
      return token
    },
    session({ session, token }) {
      if (session.user) session.user.isAdmin = token.isAdmin
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
