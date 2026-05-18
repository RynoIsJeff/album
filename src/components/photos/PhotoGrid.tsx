"use client"

import { useState, useCallback } from "react"
import PhotoCard from "./PhotoCard"
import PhotoLightbox from "./PhotoLightbox"
import InfiniteScroller from "./InfiniteScroller"
import { PhotoSummary } from "@/types"

type Props = {
  initialPhotos: PhotoSummary[]
  nextCursor: string | null
  searchParams?: Record<string, string>
}

export default function PhotoGrid({ initialPhotos, nextCursor: initialCursor, searchParams }: Props) {
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

  const openLightbox = useCallback((photo: PhotoSummary) => {
    const idx = photos.findIndex((p) => p.id === photo.id)
    setLightboxIndex(idx)
  }, [photos])

  return (
    <>
      <InfiniteScroller onLoadMore={loadMore} hasMore={!!cursor} isLoading={loading}>
        <div className="masonry-grid">
          {photos.map((photo) => (
            <PhotoCard key={photo.id} photo={photo} onClick={openLightbox} />
          ))}
        </div>
        {photos.length === 0 && !loading && (
          <div className="text-center py-20" style={{ color: "var(--muted)" }}>
            <p className="text-lg">No photos yet</p>
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
