"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSwipeable } from "react-swipeable"
import { PhotoSummary } from "@/types"
import { formatDate } from "@/lib/utils"
import PhotoEditForm from "./PhotoEditForm"

type Props = {
  photo: PhotoSummary
  onClose: () => void
  onPrev?: () => void
  onNext?: () => void
  hasPrev?: boolean
  hasNext?: boolean
  isAdmin?: boolean
  onDelete?: (id: string) => void
  onUpdate?: (updated: PhotoSummary) => void
}

export default function PhotoLightbox({
  photo,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  isAdmin,
  onDelete,
  onUpdate,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const onNextRef = useRef(onNext)
  useEffect(() => { onNextRef.current = onNext }, [onNext])

  // Reset edit mode when photo changes
  useEffect(() => { setEditing(false) }, [photo.id])

  // Stop slideshow on last photo
  useEffect(() => {
    if (playing && !hasNext) setPlaying(false)
  }, [playing, hasNext])

  // Slideshow auto-advance
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      if (hasNext) onNextRef.current?.()
      else setPlaying(false)
    }, 3000)
    return () => clearInterval(t)
  }, [playing, hasNext])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (editing) return
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && hasPrev) onPrev?.()
      if (e.key === "ArrowRight" && hasNext) onNext?.()
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p) }
    },
    [onClose, onPrev, onNext, hasPrev, hasNext, editing]
  )

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [handleKeyDown])

  const handleDelete = async () => {
    if (!confirm("Delete this photo? This cannot be undone.")) return
    const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" })
    if (res.ok) { onDelete?.(photo.id); onClose() }
  }

  const handleSave = (updated: PhotoSummary) => {
    onUpdate?.(updated)
    setEditing(false)
  }

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => { if (hasNext && !editing) onNext?.() },
    onSwipedRight: () => { if (hasPrev && !editing) onPrev?.() },
    onSwipedDown: () => { if (!editing) onClose() },
    preventScrollOnSwipe: true,
    trackMouse: false,
  })

  const downloadUrl = `/api/download?url=${encodeURIComponent(photo.blobUrl)}&name=${encodeURIComponent(photo.originalName || "photo.jpg")}`

  return (
    <div
      {...swipeHandlers}
      className="fixed inset-0 z-50 flex"
      style={{ background: "rgba(0,0,0,0.94)" }}
      onClick={editing ? undefined : onClose}
    >
      {/* Prev */}
      {hasPrev && !editing && (
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); onPrev?.() }}
          aria-label="Previous photo"
        >←</button>
      )}

      {/* Main image */}
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

      {/* Next */}
      {hasNext && !editing && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); onNext?.() }}
          aria-label="Next photo"
        >→</button>
      )}

      {/* Top-right toolbar */}
      <div
        className="absolute top-4 right-4 z-10 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {!editing && (
          <>
            {/* Slideshow toggle — space bar also works */}
            <button
              className={`w-9 h-9 flex items-center justify-center rounded-full text-white text-sm transition-colors ${
                playing ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
              }`}
              onClick={() => setPlaying((p) => !p)}
              aria-label={playing ? "Pause slideshow" : "Play slideshow"}
              title={playing ? "Pause (Space)" : "Slideshow (Space)"}
            >
              {playing ? "⏸" : "▶"}
            </button>

            {/* Download — proxied so it triggers a real file download */}
            <a
              href={downloadUrl}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              aria-label="Download photo"
              title="Download photo"
              onClick={(e) => e.stopPropagation()}
            >
              ⬇
            </a>

            {/* Open detail / share page */}
            <Link
              href={`/photo/${photo.id}`}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              aria-label="Open shareable page"
              title="Shareable link"
              onClick={(e) => e.stopPropagation()}
            >
              🔗
            </Link>

            {/* Edit — admin only */}
            {isAdmin && (
              <button
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                onClick={() => { setPlaying(false); setEditing(true) }}
                aria-label="Edit photo details"
                title="Edit photo details"
              >
                ✏️
              </button>
            )}

            {/* Delete — admin only */}
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
          </>
        )}

        {/* Close */}
        <button
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Bottom panel — info view or edit form */}
      <div
        className="absolute bottom-0 left-0 right-0 p-5 text-white overflow-y-auto"
        style={{
          background: editing
            ? "rgba(0,0,0,0.88)"
            : "linear-gradient(to top, rgba(0,0,0,0.7), transparent)",
          maxHeight: editing ? "60vh" : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {editing ? (
          <PhotoEditForm photo={photo} onSave={handleSave} onCancel={() => setEditing(false)} />
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}
