"use client"

import { useState, useCallback } from "react"
import PhotoLightbox from "@/components/photos/PhotoLightbox"
import TimelineGroup from "./TimelineGroup"
import InfiniteScroller from "@/components/photos/InfiniteScroller"
import { PhotoSummary } from "@/types"
import { groupByYear } from "@/lib/utils"

type Props = {
  initialPhotos: PhotoSummary[]
  nextCursor: string | null
  searchParams?: Record<string, string>
}

export default function TimelineClient({ initialPhotos, nextCursor: initialCursor, searchParams }: Props) {
  const [photos, setPhotos] = useState<PhotoSummary[]>(initialPhotos)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return
    setLoading(true)
    const params = new URLSearchParams({
      cursor,
      ...(searchParams || {}),
    })
    const res = await fetch(`/api/photos?${params}`)
    const data = await res.json()
    setPhotos((prev) => [...prev, ...data.photos])
    setCursor(data.nextCursor)
    setLoading(false)
  }, [cursor, loading, searchParams])

  const grouped = groupByYear(photos)
  const sortedYears = Array.from(grouped.keys()).sort((a, b) => b - a)

  return (
    <>
      <InfiniteScroller onLoadMore={loadMore} hasMore={!!cursor} isLoading={loading}>
        {photos.length === 0 ? (
          <div className="text-center py-24" style={{ color: "var(--muted)" }}>
            <p className="text-5xl mb-4">📷</p>
            <p className="text-lg font-medium">No photos yet</p>
            <p className="text-sm mt-1">Start by uploading some scanned photos</p>
          </div>
        ) : (
          <div className="space-y-12">
            {sortedYears.map((year) => (
              <TimelineGroup
                key={year}
                year={year}
                photos={grouped.get(year)!}
                onPhotoClick={(photo) => {
                  const idx = photos.findIndex((p) => p.id === photo.id)
                  setLightboxIndex(idx)
                }}
              />
            ))}
          </div>
        )}
      </InfiniteScroller>

      {lightboxIndex !== null && (
        <PhotoLightbox
          photo={photos[lightboxIndex]}
          onClose={() => setLightboxIndex(null)}
          onPrev={lightboxIndex > 0 ? () => setLightboxIndex(lightboxIndex - 1) : undefined}
          onNext={lightboxIndex < photos.length - 1 ? () => setLightboxIndex(lightboxIndex + 1) : undefined}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < photos.length - 1}
        />
      )}
    </>
  )
}
