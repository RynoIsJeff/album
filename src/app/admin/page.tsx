import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import Link from "next/link"

export default async function AdminDashboard() {
  const [
    photoCount,
    albumCount,
    personCount,
    noDateCount,
    noAlbumCount,
    yearRange,
  ] = await Promise.all([
    prisma.photo.count(),
    prisma.album.count(),
    prisma.person.count(),
    prisma.photo.count({ where: { takenAt: null } }),
    prisma.photo.count({ where: { albumId: null } }),
    prisma.photo.aggregate({
      _min: { takenYear: true },
      _max: { takenYear: true },
      where: { takenYear: { not: null, gt: 0 } },
    }),
  ])

  const minYear = yearRange._min.takenYear
  const maxYear = yearRange._max.takenYear
  const yearsSpan =
    minYear && maxYear
      ? minYear === maxYear
        ? String(minYear)
        : `${minYear} – ${maxYear}`
      : null

  const pctDated = photoCount > 0 ? Math.round(((photoCount - noDateCount) / photoCount) * 100) : 0
  const pctAlbumed = photoCount > 0 ? Math.round(((photoCount - noAlbumCount) / photoCount) * 100) : 0

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Header />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <h1 className="font-serif text-3xl font-bold mb-1">Admin</h1>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          Manage your family album
        </p>

        {/* Main stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Photos", value: photoCount, href: "/timeline" },
            { label: "Albums", value: albumCount, href: "/albums" },
            { label: "People", value: personCount, href: "/people" },
          ].map(({ label, value, href }) => (
            <Link
              key={label}
              href={href}
              className="rounded-xl border p-5 text-center transition-shadow hover:shadow-md"
              style={{ borderColor: "var(--border)", background: "white" }}
            >
              <p className="font-serif text-3xl font-bold">{value}</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                {label}
              </p>
            </Link>
          ))}
        </div>

        {/* Progress / coverage */}
        {photoCount > 0 && (
          <div
            className="rounded-xl border p-5 mb-6 space-y-4"
            style={{ borderColor: "var(--border)", background: "white" }}
          >
            <h2 className="font-medium text-sm">Digitisation progress</h2>

            {yearsSpan && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                📅 Spanning <strong style={{ color: "var(--foreground)" }}>{yearsSpan}</strong>
              </p>
            )}

            {/* Dated */}
            <div>
              <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
                <span>Photos with a date</span>
                <span>
                  {photoCount - noDateCount} / {photoCount} ({pctDated}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-stone-600 transition-all"
                  style={{ width: `${pctDated}%` }}
                />
              </div>
            </div>

            {/* In an album */}
            <div>
              <div className="flex justify-between text-xs mb-1" style={{ color: "var(--muted)" }}>
                <span>Photos in an album</span>
                <span>
                  {photoCount - noAlbumCount} / {photoCount} ({pctAlbumed}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-stone-600 transition-all"
                  style={{ width: `${pctAlbumed}%` }}
                />
              </div>
            </div>

            {/* Warnings */}
            {noDateCount > 0 && (
              <Link
                href="/timeline?year=0"
                className="flex items-center gap-2 text-xs text-amber-700 hover:underline"
              >
                ⚠️ {noDateCount} photo{noDateCount !== 1 ? "s" : ""} have no date — click to review
              </Link>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className="space-y-3">
          <Link
            href="/admin/upload"
            className="flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-stone-400"
            style={{ borderColor: "var(--border)", background: "white" }}
          >
            <span className="text-2xl">📤</span>
            <div>
              <p className="font-medium">Upload photos</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Add scanned photos individually via browser
              </p>
            </div>
          </Link>
          <Link
            href="/albums"
            className="flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-stone-400"
            style={{ borderColor: "var(--border)", background: "white" }}
          >
            <span className="text-2xl">📚</span>
            <div>
              <p className="font-medium">Manage albums</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Rename, merge, or delete albums
              </p>
            </div>
          </Link>
          <Link
            href="/people"
            className="flex items-center gap-3 p-4 rounded-xl border transition-colors hover:border-stone-400"
            style={{ borderColor: "var(--border)", background: "white" }}
          >
            <span className="text-2xl">👥</span>
            <div>
              <p className="font-medium">Manage people</p>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Rename or remove people tags
              </p>
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
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                Browse all photos in chronological order
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
