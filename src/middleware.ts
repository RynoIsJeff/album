import { NextRequest, NextResponse } from "next/server"

// Lightweight cookie check — avoids importing NextAuth in Edge Runtime.
// Full auth validation still happens server-side in each route/page.
const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"

export function middleware(req: NextRequest) {
  const session = req.cookies.get(SESSION_COOKIE)
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
}

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
}
