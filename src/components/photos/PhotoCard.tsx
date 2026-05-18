"use client"

import Image from "next/image"
import { PhotoSummary } from "@/types"
import { formatDate } from "@/lib/utils"

type Props = {
  photo: PhotoSummary
  onClick?: (photo: PhotoSummary) => void
  isAdmin?: boolean
  onDelete?: (id: string) => void
}

export default function PhotoCard({ photo, onClick, isAdmin, onDelete }: Props) {
  const src = photo.thumbUrl || photo.blobUrl
  const aspectRatio =
    photo.width && photo.height ? photo.height / photo.width : 1

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Delete this photo? This cannot be undone.")) return
    const res = await fetch(`/api/photos/${photo.id}`, { method: "DELETE" })
    if (res.ok) onDelete?.(photo.id)
  }

  return (
    <div
      className="masonry-item cursor-pointer group relative overflow-hidden rounded-lg"
      style={{ borderColor: "var(--border)" }}
      onClick={() => onClick?.(photo)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.(photo)}
      aria-label={photo.caption || photo.originalName || "Family photo"}
    >
      <div
        className="relative w-full overflow-hidden rounded-lg bg-stone-100"
        style={{ paddingBottom: `${aspectRatio * 100}%` }}
      >
        <Image
          src={src}
          alt={photo.caption || photo.originalName || "Family photo"}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
          {photo.caption && (
            <p className="text-white text-xs font-medium line-clamp-2">{photo.caption}</p>
          )}
          {photo.takenAt && (
            <p className="text-white/80 text-xs mt-0.5">{formatDate(photo.takenAt)}</p>
          )}
          {photo.peopleTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {photo.peopleTags.slice(0, 3).map((t) => (
                <span
                  key={t.person.id}
                  className="text-xs bg-white/20 text-white px-1.5 py-0.5 rounded-full"
                >
                  {t.person.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Admin delete button — top-right corner, appears on hover */}
        {isAdmin && (
          <button
            onClick={handleDelete}
            className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-red-600 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-all"
            aria-label="Delete photo"
            title="Delete photo"
          >
            🗑
          </button>
        )}
      </div>
    </div>
  )
}
