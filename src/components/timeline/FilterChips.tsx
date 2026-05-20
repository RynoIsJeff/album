"use client"

import { useRouter, useSearchParams } from "next/navigation"

type Props = {
  q?: string
  year?: string
  personId?: string
  personName?: string
  albumId?: string
  albumName?: string
  noAlbum?: string
}

export default function FilterChips({ q, year, personId, personName, albumId, albumName, noAlbum }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const removeParam = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    const qs = params.toString()
    router.push(qs ? `/timeline?${qs}` : "/timeline")
  }

  const chips: { key: string; label: string }[] = []
  if (q) chips.push({ key: "q", label: `"${q}"` })
  if (year) chips.push({ key: "year", label: `Year: ${year}` })
  if (personId) chips.push({ key: "personId", label: `Person: ${personName ?? personId}` })
  if (albumId) chips.push({ key: "albumId", label: `Album: ${albumName ?? albumId}` })
  if (noAlbum === "true") chips.push({ key: "noAlbum", label: "No album" })

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>
        Filtered by:
      </span>
      {chips.map(({ key, label }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border"
          style={{ borderColor: "var(--border)", background: "white", color: "var(--foreground)" }}
        >
          {label}
          <button
            onClick={() => removeParam(key)}
            className="text-stone-400 hover:text-stone-700 leading-none transition-colors"
            aria-label={`Remove ${label} filter`}
          >
            ×
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          onClick={() => router.push("/timeline")}
          className="text-xs underline transition-opacity hover:opacity-70"
          style={{ color: "var(--muted)" }}
        >
          Clear all
        </button>
      )}
    </div>
  )
}
