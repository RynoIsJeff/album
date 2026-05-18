import { PhotoSummary } from "@/types"
import PhotoCard from "@/components/photos/PhotoCard"

type Props = {
  year: number
  photos: PhotoSummary[]
  onPhotoClick: (photo: PhotoSummary) => void
  isAdmin?: boolean
  onDelete?: (id: string) => void
  tagMode?: boolean
  selectedIds?: Set<string>
  onSelect?: (id: string) => void
}

export default function TimelineGroup({ year, photos, onPhotoClick, isAdmin, onDelete, tagMode, selectedIds, onSelect }: Props) {
  return (
    <section id={`year-${year}`} className="scroll-mt-20">
      <div className="flex items-center gap-4 mb-4">
        <h2 className="year-marker">{year === 0 ? "Unknown Date" : year}</h2>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
        <span className="text-sm" style={{ color: "var(--muted)" }}>
          {photos.length} {photos.length === 1 ? "photo" : "photos"}
        </span>
      </div>
      <div className="masonry-grid">
        {photos.map((photo) => (
          <PhotoCard
            key={photo.id}
            photo={photo}
            onClick={onPhotoClick}
            isAdmin={isAdmin}
            onDelete={onDelete}
            tagMode={tagMode}
            selected={selectedIds?.has(photo.id)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  )
}
