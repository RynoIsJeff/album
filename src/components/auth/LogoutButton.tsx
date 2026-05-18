"use client"

import { signOut } from "next-auth/react"

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="text-sm transition-opacity hover:opacity-70"
      style={{ color: "var(--muted)" }}
    >
      Log out
    </button>
  )
}
