"use client"

import { useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { PhotoSummary } from "@/types"
import { formatDate } from "@/lib/utils"

type Props = {
  photo: PhotoSummary
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  isAdmin?: boolean
  onDelete?: (id: string) => void
}

export default function PhotoLightbox({ photo, onClose, onPrev, onNext, hasPrev, hasNext, isAdmin, onDelete }: Props) {
  const handleDelete = async () => {
    if (!confirm("Delete this photo? This cannot be undone.")) return
    const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" })
    if (res.ok) {
      onDelete?.(photo.id)
      onClose()
    }
  }
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && hasPrev) onPrev?.()
      if (e.key === "ArrowRight" && hasNext) onNext?.()
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [handleKeyDown])

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: "rgba(0,0,0,0.94)" }}
      onClick={onClose}
    >
      {/* Nav: prev */}
      {hasPrev && (
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); onPrev?.() }}
          aria-label="Previous photo"
        >
          ←
        </button>
      )}

      {/* Main image area */}
      <div
        className="flex-1 flex items-center justify-center p-4 md:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative max-h-full max-w-full" style={{ maxHeight: "80vh" }}>
          <Image
            src={photo.blobUrl}
            alt={photo.caption || "Family photo"}
            width={photo.width || 1200}
            height={photo.height || 900}
            className="object-contain max-h-[80vh] rounded-sm"
            style={{ maxHeight: "80vh", width: "auto", height: "auto" }}
            priority
          />
        </div>
      </div>

      {/* Nav: next */}
      {hasNext && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); onNext?.() }}
          aria-label="Next photo"
        >
          →
        </button>
      )}

      {/* Top-right toolbar: delete (admin) + close */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        {isAdmin && (
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-red-600 text-white transition-colors"
            onClick={handleDelete}
            aria-label="Delete photo"
            title="Delete photo"
          >
            🗑
          </button>
        )}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Bottom info panel */}
      <div
        className="absolute bottom-0 left-0 right-0 p-5 text-white"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {photo.caption && (
          <p className="text-sm font-medium mb-1">{photo.caption}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/70">
          {photo.takenAt && <span>{formatDate(photo.takenAt)}</span>}
          {photo.album && (
            <Link
              href={`/albums/${photo.album.id}`}
              className="hover:text-white transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {photo.album.name}
            </Link>
          )}
        </div>
        {photo.peopleTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {photo.peopleTags.map((t) => (
              <Link
                key={t.person.id}
                href={`/people/${t.person.id}`}
                className="text-xs bg-white/15 hover:bg-white/25 text-white px-2 py-0.5 rounded-full transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {t.person.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
