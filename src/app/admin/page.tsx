import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import Link from "next/link"
import { list } from "@vercel/blob"

const FREE_TIER_BYTES = 1_073_741_824 // 1 GB

function formatBytes(bytes: number): string {
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`
}

export default async function AdminDashboard() {
  // Fetch blob storage usage — paginate to get all blobs
  let totalBlobBytes = 0
  try {
    let cursor: string | undefined
    do {
      const result = await list({ limit: 1000, cursor })
      totalBlobBytes += result.blobs.reduce((sum, b) => sum + b.size, 0)
      cursor = result.hasMore ? result.cursor : undefined
    } while (cursor)
  } catch {
    // If blob list fails (e.g. missing token in dev), show 0
  }
  const pctStorage = Math.min(Math.round((totalBlobBytes / FREE_TIER_BYTES) * 100), 100)

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
            {noAlbumCount > 0 && (
              <Link
                href="/timeline?noAlbum=true"
                className="flex items-center gap-2 text-xs text-amber-700 hover:underline"
              >
                ⚠️ {noAlbumCount} photo{noAlbumCount !== 1 ? "s" : ""} not in any album — click to review
              </Link>
            )}
          </div>
        )}

        {/* Storage tracker */}
        <div
          className="rounded-xl border p-5 mb-6 space-y-3"
          style={{ borderColor: "var(--border)", background: "white" }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm">Blob storage</h2>
            <span className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>
              {formatBytes(totalBlobBytes)} / 1 GB free
            </span>
          </div>
          <div className="h-2 rounded-full bg-stone-200 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pctStorage}%`,
                background: pctStorage > 80 ? "#dc2626" : pctStorage > 60 ? "#d97706" : "#57534e",
              }}
            />
          </div>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {pctStorage}% used · includes original photos and thumbnails
            {pctStorage > 80 && (
              <span className="ml-2 text-red-600 font-medium">Nearing limit — consider upgrading Vercel Blob</span>
            )}
          </p>
        </div>

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
