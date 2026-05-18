import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import LoginForm from "@/components/auth/LoginForm"

export default async function LoginPage() {
  const session = await auth()
  if (session) redirect("/timeline")

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--background)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Family Album
          </h1>
          <p style={{ color: "var(--muted)" }} className="text-sm">
            Our memories, together
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
