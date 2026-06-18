"use client"

import { useEffect, useCallback, useState, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSwipeable } from "react-swipeable"
import { PhotoSummary } from "@/types"
import { formatDate } from "@/lib/utils"
import PhotoEditForm from "./PhotoEditForm"
import { useToast } from "@/context/ToastContext"

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
  photoIndex?: number
  totalPhotos?: number
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
  photoIndex,
  totalPhotos,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [captionExpanded, setCaptionExpanded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null)
  const addToast = useToast()

  // Keep latest callbacks in refs so navigate() never goes stale
  const onNextRef = useRef(onNext)
  const onPrevRef = useRef(onPrev)
  useEffect(() => { onNextRef.current = onNext }, [onNext])
  useEffect(() => { onPrevRef.current = onPrev }, [onPrev])

  // Slide animation state
  const [displayedPhoto, setDisplayedPhoto] = useState(photo)
  const [outgoingPhoto, setOutgoingPhoto] = useState<PhotoSummary | null>(null)
  const [animDir, setAnimDir] = useState<'next' | 'prev'>('next')
  const [animating, setAnimating] = useState(false)
  const animPendingRef = useRef(false)

  // Navigate: capture the outgoing photo, fire onNext/onPrev immediately so both
  // photos are in the DOM at the same time and slide past each other.
  const navigate = useCallback((dir: 'next' | 'prev') => {
    if (animPendingRef.current) return  // already mid-slide
    if (dir === 'next' && !hasNext) return
    if (dir === 'prev' && !hasPrev) return

    animPendingRef.current = true
    setAnimDir(dir)
    setOutgoingPhoto(displayedPhoto)
    setAnimating(true)

    if (dir === 'next') onNextRef.current?.()
    else onPrevRef.current?.()
  }, [hasNext, hasPrev, displayedPhoto])

  const navigateRef = useRef(navigate)
  useEffect(() => { navigateRef.current = navigate }, [navigate])

  // When photo prop changes (parent processed the nav), swap the incoming photo in
  useEffect(() => {
    setEditing(false)
    setCaptionExpanded(false)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setDragging(false)
    dragStart.current = null

    if (animPendingRef.current) {
      animPendingRef.current = false
      setDisplayedPhoto(photo)
      const t = setTimeout(() => {
        setAnimating(false)
        setOutgoingPhoto(null)
      }, 320)
      return () => clearTimeout(t)
    } else {
      // Direct prop change (edit saved, initial open) — no animation
      setDisplayedPhoto(photo)
      setAnimating(false)
      setOutgoingPhoto(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.id])

  // Stop slideshow on last photo
  useEffect(() => {
    if (playing && !hasNext) setPlaying(false)
  }, [playing, hasNext])

  // Slideshow auto-advance — routed through navigate() so the slide fires
  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => {
      if (hasNext) navigateRef.current('next')
      else setPlaying(false)
    }, 3000)
    return () => clearInterval(t)
  }, [playing, hasNext])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (editing) return
      if (e.key === "Escape") {
        if (zoom > 1) { setZoom(1); setPan({ x: 0, y: 0 }) }
        else onClose()
      }
      if (e.key === "ArrowLeft"  && hasPrev && zoom === 1) navigateRef.current('prev')
      if (e.key === "ArrowRight" && hasNext  && zoom === 1) navigateRef.current('next')
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p) }
    },
    [onClose, hasPrev, hasNext, editing, zoom]
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
    if (res.ok) {
      addToast("Photo deleted", "success")
      onDelete?.(photo.id)
      onClose()
    } else {
      addToast("Failed to delete photo", "error")
    }
  }

  const handleSave = (updated: PhotoSummary) => {
    addToast("Changes saved", "success")
    onUpdate?.(updated)
    setEditing(false)
  }

  const swipeHandlers = useSwipeable({
    onSwipedLeft:  () => { if (!editing && zoom === 1) navigateRef.current('next') },
    onSwipedRight: () => { if (!editing && zoom === 1) navigateRef.current('prev') },
    onSwipedDown:  () => { if (!editing && zoom === 1) onClose() },
    preventScrollOnSwipe: zoom === 1,
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
          onClick={(e) => { e.stopPropagation(); navigate('prev') }}
          aria-label="Previous photo"
        >←</button>
      )}

      {/* Main image area — overflow-hidden clips the sliding photos */}
      <div
        className="flex-1 relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: zoom > 1 ? "pinch-zoom" : "none" }}
      >
        {/* Outgoing photo slides out */}
        {animating && outgoingPhoto && (
          <div
            className={`absolute inset-0 flex items-center justify-center p-4 md:p-12 pointer-events-none ${
              animDir === 'next' ? 'lb-slide-out-left' : 'lb-slide-out-right'
            }`}
          >
            <Image
              src={outgoingPhoto.blobUrl}
              alt={outgoingPhoto.caption || "Family photo"}
              width={outgoingPhoto.width || 1200}
              height={outgoingPhoto.height || 900}
              className="object-contain max-h-[80vh] rounded-sm"
              style={{ maxHeight: "80vh", width: "auto", height: "auto" }}
              draggable={false}
            />
          </div>
        )}

        {/* Current photo — slides in during animation, static otherwise */}
        <div
          className={`absolute inset-0 flex items-center justify-center p-4 md:p-12 ${
            animating ? (animDir === 'next' ? 'lb-slide-in-right' : 'lb-slide-in-left') : ''
          }`}
        >
          <div
            className="relative max-h-full max-w-full select-none"
            style={{
              maxHeight: "80vh",
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: "center",
              transition: dragging ? "none" : "transform 0.15s ease",
              cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default",
            }}
            onWheel={(e) => {
              e.stopPropagation()
              const next = e.deltaY < 0
                ? Math.min(zoom + 0.5, 3)
                : Math.max(zoom - 0.5, 1)
              setZoom(next)
              if (next === 1) setPan({ x: 0, y: 0 })
            }}
            onDoubleClick={(e) => {
              e.stopPropagation()
              const next = zoom === 1 ? 2 : 1
              setZoom(next)
              if (next === 1) setPan({ x: 0, y: 0 })
            }}
            onMouseDown={(e) => {
              if (zoom <= 1) return
              e.stopPropagation()
              setDragging(true)
              dragStart.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
            }}
            onMouseMove={(e) => {
              if (!dragging || !dragStart.current) return
              setPan({
                x: dragStart.current.px + (e.clientX - dragStart.current.x),
                y: dragStart.current.py + (e.clientY - dragStart.current.y),
              })
            }}
            onMouseUp={() => { setDragging(false); dragStart.current = null }}
            onMouseLeave={() => { setDragging(false); dragStart.current = null }}
          >
            <Image
              src={displayedPhoto.blobUrl}
              alt={displayedPhoto.caption || "Family photo"}
              width={displayedPhoto.width || 1200}
              height={displayedPhoto.height || 900}
              className="object-contain max-h-[80vh] rounded-sm pointer-events-none"
              style={{ maxHeight: "80vh", width: "auto", height: "auto" }}
              priority
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Zoom indicator */}
      {zoom > 1 && (
        <div
          className="absolute bottom-20 right-4 z-10 px-2 py-1 rounded bg-white/10 text-white text-xs select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {zoom}×
        </div>
      )}

      {/* Next */}
      {hasNext && !editing && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={(e) => { e.stopPropagation(); navigate('next') }}
          aria-label="Next photo"
        >→</button>
      )}

      {/* Top-left counter */}
      {photoIndex != null && totalPhotos != null && (
        <div
          className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-white/10 text-white text-sm tabular-nums select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {photoIndex} / {totalPhotos}
        </div>
      )}

      {/* Top-right toolbar */}
      <div
        className="absolute top-4 right-4 z-10 flex items-center gap-2"
        onClick={(e) => e.stopPropagation()}
      >
        {!editing && (
          <>
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

            <a
              href={downloadUrl}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              aria-label="Download photo"
              title="Download photo"
              onClick={(e) => e.stopPropagation()}
            >
              ⬇
            </a>

            <Link
              href={`/photo/${photo.id}`}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              aria-label="Open shareable page"
              title="Shareable link"
              onClick={(e) => e.stopPropagation()}
            >
              🔗
            </Link>

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

        <button
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Caption expanded overlay */}
      {captionExpanded && photo.caption && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center p-8"
          style={{ background: "rgba(0,0,0,0.88)" }}
          onClick={() => setCaptionExpanded(false)}
        >
          <div
            className="relative max-w-2xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setCaptionExpanded(false)}
              className="absolute -top-4 -right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors text-sm"
              aria-label="Close caption"
            >
              ✕
            </button>
            <p className="text-xl text-white text-center whitespace-pre-wrap leading-relaxed font-medium">
              {photo.caption}
            </p>
          </div>
        </div>
      )}

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
            {displayedPhoto.caption && (
              <div className="flex items-start justify-center gap-2 mb-2">
                <p className="text-base font-medium text-center whitespace-pre-wrap leading-snug flex-1">
                  {displayedPhoto.caption}
                </p>
                <button
                  onClick={() => setCaptionExpanded(true)}
                  className="shrink-0 text-white/60 hover:text-white transition-colors text-sm mt-0.5"
                  title="Expand caption"
                  aria-label="Expand caption"
                >
                  ⤢
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-white/70">
              {displayedPhoto.takenAt && <span>{formatDate(displayedPhoto.takenAt)}</span>}
              {displayedPhoto.album && (
                <Link
                  href={`/albums/${displayedPhoto.album.id}`}
                  className="hover:text-white transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {displayedPhoto.album.name}
                </Link>
              )}
            </div>
            {displayedPhoto.peopleTags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                {displayedPhoto.peopleTags.map((t) => (
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
