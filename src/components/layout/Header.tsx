import Link from "next/link"
import { auth } from "@/lib/auth"
import SearchBar from "@/components/search/SearchBar"
import { Suspense } from "react"

export default async function Header() {
  const session = await auth()
  const isAdmin = (session?.user as any)?.isAdmin

  return (
    <header
      className="sticky top-0 z-30 border-b px-4 md:px-6 h-14 flex items-center gap-4"
      style={{ background: "var(--background)", borderColor: "var(--border)" }}
    >
      <Link href="/timeline" className="font-serif text-xl font-bold shrink-0" style={{ color: "var(--foreground)" }}>
        Family Album
      </Link>

      <div className="flex-1 max-w-xs hidden sm:block">
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <nav className="hidden md:flex items-center gap-5 ml-auto text-sm" style={{ color: "var(--muted)" }}>
        <Link href="/timeline" className="hover:opacity-100 transition-opacity">Timeline</Link>
        <Link href="/albums" className="hover:opacity-100 transition-opacity">Albums</Link>
        <Link href="/people" className="hover:opacity-100 transition-opacity">People</Link>
        {isAdmin && (
          <Link
            href="/admin/upload"
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            Upload
          </Link>
        )}
      </nav>
    </header>
  )
}
