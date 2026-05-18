import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = session.user?.isAdmin
  if (!isAdmin) redirect("/timeline")
  return <>{children}</>
}
