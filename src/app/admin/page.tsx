import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import Link from "next/link"

export default async function AdminDashboard() {
  const [photoCount, albumCount, personCount] = await Promise.all([
    prisma.photo.count(),
    prisma.album.count(),
    prisma.person.count(),
  ])

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Header />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <h1 className="font-serif text-3xl font-bold mb-2">Admin</h1>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>Manage your family album</p>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Photos", value: photoCount },
            { label: "Albums", value: albumCount },
            { label: "People", value: personCount },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl border p-5 text-center"
              style={{ borderColor: "var(--border)", background: "white" }}
            >
              <p className="font-serif text-3xl font-bold">{value}</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Link
            href="/admin/upload"
            className="flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-stone-400"
            style={{ borderColor: "var(--border)", background: "white" }}
          >
            <span className="text-2xl">📤</span>
            <div>
              <p className="font-medium">Upload photos</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Add scanned photos individually via browser</p>
            </div>
          </Link>
          <Link
            href="/timeline"
            className="flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-stone-400"
            style={{ borderColor: "var(--border)", background: "white" }}
          >
            <span className="text-2xl">🖼️</span>
            <div>
              <p className="font-medium">View timeline</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>Browse all photos in chronological order</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
