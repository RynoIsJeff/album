"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function LoginForm() {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const result = await signIn("credentials", {
      password,
      redirect: false,
    })
    setLoading(false)
    if (result?.error) {
      setError("Incorrect password. Please try again.")
    } else {
      router.push("/timeline")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium mb-1.5"
          style={{ color: "var(--foreground)" }}
        >
          Family Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          required
          className="w-full px-4 py-3 rounded-lg border text-sm outline-none transition-colors focus:ring-2 focus:ring-stone-400"
          style={{
            background: "white",
            borderColor: "var(--border)",
            color: "var(--foreground)",
          }}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
        style={{
          background: "var(--foreground)",
          color: "var(--background)",
        }}
      >
        {loading ? "Signing in…" : "Enter Album"}
      </button>
    </form>
  )
}
