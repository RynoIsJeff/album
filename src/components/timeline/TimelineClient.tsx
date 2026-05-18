"use client"

import { useState, useCallback, useMemo, Suspense } from "react"
import PhotoLightbox from "@/components/photos/PhotoLightbox"
import TimelineGroup from "./TimelineGroup"
import InfiniteScroller from "@/components/photos/InfiniteScroller"
import BulkTagPanel from "@/components/photos/BulkTagPanel"
import FilterChips from "./FilterChips"
import { PhotoSummary, YearCount } from "@/types"
import { groupByYear } from "@/lib/utils"

type Props = {
  initialPhotos: PhotoSummary[]
  nextCursor: string | null
  searchParams?: Record<string, string>
  isAdmin?: boolean
  yearCounts?: YearCount[]
  personName?: string
  albumName?: string
}

export default function TimelineClient({
  initialPhotos,
  nextCursor: initialCursor,
  searchParams,
  isAdmin,
  yearCounts = [],
  personName,
  albumName,
}: Props) {
  const [photos, setPhotos] = useState<PhotoSummary[]>(initialPhotos)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Bulk-tag mode
  const [tagMode, setTagMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return
    setLoading(true)
    try {
      // Strip display-only keys that the API doesn't accept
      const apiParams = Object.fromEntries(
        Object.entries(searchParams || {}).filter(([k]) => !["personName", "albumName"].includes(k))
      )
      const params = new URLSearchParams({ cursor, ...apiParams })
      const res = await fetch(`/api/photos?${params}`)
      if (!res.ok) throw new Error("Failed to load photos")
      const data = await res.json()
      setPhotos((prev) => [...prev, ...data.photos])
      setCursor(data.nextCursor)
    } catch {
      // Network/server error — stop trying to load more so the spinner clears
      setCursor(null)
    } finally {
      setLoading(false)
    }
  }, [cursor, loading, searchParams])

  const handleDelete = useCallback((id: string) => {
    setPhotos((prev) => {
      const next = prev.filter((p) => p.id !== id)
      setLightboxIndex((li) => {
        if (li === null) return null
        const deletedIdx = prev.findIndex((p) => p.id === id)
        if (deletedIdx < 0) return li
        if (next.length === 0) return null
        return Math.min(li, next.length - 1)
      })
      return next
    })
  }, [])

  const handleUpdate = useCallback((updated: PhotoSummary) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
    )
  }, [])

  const handleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleBulkTag = useCallback(async (peopleNames: string[]) => {
    const photoIds = Array.from(selectedIds)
    if (!photoIds.length || !peopleNames.length) return
    const res = await fetch("/api/photos/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoIds, peopleNames }),
    })
    if (!res.ok) throw new Error("Failed to apply tags")
    // Clear selection after successful tag
    setSelectedIds(new Set())
  }, [selectedIds])

  const exitTagMode = useCallback(() => {
    setTagMode(false)
    setSelectedIds(new Set())
  }, [])

  const grouped = useMemo(() => groupByYear(photos), [photos])
  const sortedYears = useMemo(
    () => Array.from(grouped.keys()).sort((a, b) => b - a),
    [grouped]
  )

  return (
    <>
      {/* Admin toolbar */}
      {isAdmin && (
        <div className="flex items-center justify-between mb-4">
          <div /> {/* spacer */}
          {!tagMode ? (
            <button
              onClick={() => setTagMode(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors hover:border-stone-400"
              style={{ borderColor: "var(--border)", color: "var(--muted)" }}
            >
              👥 Tag people
            </button>
          ) : (
            <span className="text-sm font-medium" style={{ color: "var(--muted)" }}>
              Tag mode — click photos to select
            </span>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {searchParams && Object.keys(searchParams).filter(k => !['personName','albumName'].includes(k)).length > 0 && (
        <Suspense fallback={null}>
          <FilterChips
            q={searchParams.q}
            year={searchParams.year}
            personId={searchParams.personId}
            personName={personName}
            albumId={searchParams.albumId}
            albumName={albumName}
          />
        </Suspense>
      )}

      {/* Mobile year pills — hidden on md+ where the sidebar shows */}
      {yearCounts.length > 0 && (
        <div className="md:hidden flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
          {yearCounts.map(({ takenYear, count }) => (
            <a
              key={takenYear}
              href={`#year-${takenYear}`}
              className="shrink-0 px-3 py-1 rounded-full text-sm border transition-colors hover:border-stone-400 whitespace-nowrap"
              style={{ borderColor: "var(--border)", background: "white", color: "var(--foreground)" }}
            >
              {takenYear === 0 ? "Unknown" : takenYear}
              <span className="ml-1 text-xs opacity-50">({count})</span>
            </a>
          ))}
        </div>
      )}

      <InfiniteScroller onLoadMore={loadMore} hasMore={!!cursor} isLoading={loading}>
        {photos.length === 0 ? (
          <div className="text-center py-24" style={{ color: "var(--muted)" }}>
            <p className="text-5xl mb-4">📷</p>
            <p className="text-lg font-medium">No photos yet</p>
            <p className="text-sm mt-1">Start by uploading some scanned photos</p>
          </div>
        ) : (
          <div className={`space-y-12 ${tagMode ? "pb-48" : ""}`}>
            {sortedYears.map((year) => (
              <TimelineGroup
                key={year}
                year={year}
                photos={grouped.get(year)!}
                onPhotoClick={(photo) => {
                  if (tagMode) return
                  const idx = photos.findIndex((p) => p.id === photo.id)
                  setLightboxIndex(idx)
                }}
                isAdmin={isAdmin}
                onDelete={handleDelete}
                tagMode={tagMode}
                selectedIds={selectedIds}
                onSelect={handleSelect}
              />
            ))}
          </div>
        )}
      </InfiniteScroller>

      {/* Lightbox — disabled during tag mode */}
      {lightboxIndex !== null && !tagMode && (
        <PhotoLightbox
          photo={photos[lightboxIndex]}
          onClose={() => setLightboxIndex(null)}
          onPrev={lightboxIndex > 0 ? () => setLightboxIndex(lightboxIndex - 1) : undefined}
          onNext={
            lightboxIndex < photos.length - 1
              ? () => setLightboxIndex(lightboxIndex + 1)
              : undefined
          }
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < photos.length - 1}
          isAdmin={isAdmin}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          photoIndex={lightboxIndex + 1}
          totalPhotos={photos.length}
        />
      )}

      {/* Bulk tag panel — floats at the bottom in tag mode */}
      {tagMode && (
        <BulkTagPanel
          selectedCount={selectedIds.size}
          onApply={handleBulkTag}
          onClear={() => setSelectedIds(new Set())}
          onExit={exitTagMode}
        />
      )}
    </>
  )
}
