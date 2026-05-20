"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import PhotoGrid from "@/components/photos/PhotoGrid"
import RenamePersonForm from "@/components/people/RenamePersonForm"
import DeletePersonButton from "@/components/people/DeletePersonButton"
import { useToast } from "@/context/ToastContext"
import { PhotoSummary } from "@/types"

type Props = {
  personId: string
  personName: string
  initialCoverPhotoId: string | null
  initialCoverUrl: string | null
  photos: PhotoSummary[]
  nextCursor: string | null
  photoCount: number
  isAdmin?: boolean
}

export default function PersonPageClient({
  personId,
  personName,
  initialCoverPhotoId,
  initialCoverUrl,
  photos,
  nextCursor,
  photoCount,
  isAdmin,
}: Props) {
  const addToast = useToast()
  const [coverPhotoId, setCoverPhotoId] = useState<string | null>(initialCoverPhotoId)
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl)
  const [selectingCover, setSelectingCover] = useState(false)

  const handleSetCover = useCallback(
    async (photoId: string) => {
      const photo = photos.find((p) => p.id === photoId)
      const res = await fetch(`/api/people/${personId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverPhotoId: photoId }),
      })
      if (res.ok) {
        setCoverPhotoId(photoId)
        setCoverUrl(photo?.thumbUrl || photo?.blobUrl || null)
        setSelectingCover(false)
        addToast("Profile photo updated", "success")
      } else {
        addToast("Failed to update profile photo", "error")
      }
    },
    [personId, photos, addToast]
  )

  return (
    <>
      {/* Header row: avatar + name/count + delete */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative shrink-0 mt-1">
            <div
              className="w-14 h-14 rounded-full overflow-hidden"
              style={{ background: "var(--sepia-light)" }}
            >
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={personName}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xl font-bold"
                  style={{ color: "var(--muted)" }}
                >
                  {personName[0].toUpperCase()}
                </div>
              )}
            </div>
            {isAdmin && photos.length > 0 && (
              <button
                onClick={() => setSelectingCover((v) => !v)}
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-white text-xs transition-colors"
                style={{
                  background: selectingCover ? "#b45309" : "#292524",
                  borderColor: "var(--background)",
                }}
                title={selectingCover ? "Cancel" : "Change profile photo"}
              >
                {selectingCover ? "✕" : "✎"}
              </button>
            )}
          </div>

          {/* Name + photo count */}
          <div>
            <RenamePersonForm
              personId={personId}
              initialName={personName}
              isAdmin={isAdmin}
            />
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {photoCount} {photoCount === 1 ? "photo" : "photos"}
            </p>
          </div>
        </div>

        {isAdmin && (
          <DeletePersonButton
            personId={personId}
            personName={personName}
            photoCount={photoCount}
            variant="full"
          />
        )}
      </div>

      {/* Cover-select banner */}
      {selectingCover && (
        <div
          className="mb-4 px-4 py-2.5 rounded-lg text-sm flex items-center justify-between"
          style={{ background: "var(--sepia-light)", color: "var(--foreground)" }}
        >
          <span>Click any photo to use it as {personName}&apos;s profile picture</span>
          <button
            onClick={() => setSelectingCover(false)}
            className="text-xs underline ml-4 shrink-0"
            style={{ color: "var(--muted)" }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="text-center py-20" style={{ color: "var(--muted)" }}>
          <p className="text-4xl mb-3">👤</p>
          <p className="text-lg font-medium">No photos yet</p>
          <p className="text-sm mt-1">Tag {personName} when uploading or editing photos</p>
        </div>
      ) : (
        <PhotoGrid
          initialPhotos={photos}
          nextCursor={nextCursor}
          searchParams={{ personId }}
          isAdmin={isAdmin && !selectingCover}
          coverPhotoId={coverPhotoId}
          onSetCover={selectingCover ? handleSetCover : undefined}
        />
      )}
    </>
  )
}
