import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  try {
    const session = await auth()
    if (session) redirect("/timeline")
  } catch (err: any) {
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    // If auth check fails just redirect to login
  }
  redirect("/login")
}
