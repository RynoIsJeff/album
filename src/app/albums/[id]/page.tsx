import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
import PhotoGrid from "@/components/photos/PhotoGrid"
import DeleteAlbumButton from "@/components/albums/DeleteAlbumButton"
import RenameAlbumForm from "@/components/albums/RenameAlbumForm"
import MergeAlbumButton from "@/components/albums/MergeAlbumButton"
import AlbumSortSelect from "@/components/albums/AlbumSortSelect"
import { Suspense } from "react"

export default async function AlbumPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { sort?: string }
}) {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = session.user?.isAdmin
  const sort = searchParams?.sort === "upload" ? "upload" : "date"

  const album = await prisma.album.findUnique({
    where: { id: params.id },
    include: { _count: { select: { photos: true } } },
  })
  if (!album) notFound()

  const orderBy =
    sort === "upload"
      ? [{ createdAt: "asc" as const }]
      : [
          { takenAt: { sort: "desc" as const, nulls: "last" as const } },
          { createdAt: "desc" as const },
        ]

  const rawPhotos = await prisma.photo.findMany({
    where: { albumId: params.id },
    orderBy,
    take: 31,
    select: {
      id: true,
      blobUrl: true,
      thumbUrl: true,
      width: true,
      height: true,
      takenAt: true,
      takenYear: true,
      caption: true,
      originalName: true,
      source: true,
      createdAt: true,
      albumId: true,
      album: { select: { id: true, name: true } },
      peopleTags: { include: { person: { select: { id: true, name: true } } } },
    },
  })

  const hasMore = rawPhotos.length > 30
  if (hasMore) rawPhotos.pop()

  const photos = rawPhotos.map((p) => ({
    id: p.id,
    blobUrl: p.blobUrl,
    thumbUrl: p.thumbUrl ?? null,
    width: p.width ?? null,
    height: p.height ?? null,
    takenAt: p.takenAt ? p.takenAt.toISOString() : null,
    takenYear: p.takenYear ?? null,
    caption: p.caption ?? null,
    originalName: p.originalName ?? null,
    source: p.source,
    createdAt: p.createdAt.toISOString(),
    albumId: p.albumId ?? null,
    album: p.album ?? null,
    peopleTags: p.peopleTags,
  }))

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: "var(--background)" }}>
      <Header />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Header row */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <RenameAlbumForm
              albumId={album.id}
              initialName={album.name}
              isAdmin={isAdmin}
            />
            {album.description && (
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {album.description}
              </p>
            )}
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {album._count.photos} {album._count.photos === 1 ? "photo" : "photos"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {photos.length > 1 && (
              <Suspense fallback={null}>
                <AlbumSortSelect current={sort} />
              </Suspense>
            )}
            {isAdmin && (
              <>
                <MergeAlbumButton albumId={album.id} albumName={album.name} />
                <DeleteAlbumButton
                  albumId={album.id}
                  albumName={album.name}
                  photoCount={album._count.photos}
                  variant="full"
                />
              </>
            )}
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="text-center py-20" style={{ color: "var(--muted)" }}>
            <p className="text-4xl mb-3">📷</p>
            <p className="text-lg font-medium">No photos in this album</p>
            <p className="text-sm mt-1">Upload photos and assign them to this album</p>
          </div>
        ) : (
          <PhotoGrid
            initialPhotos={photos}
            nextCursor={hasMore ? photos[photos.length - 1].id : null}
            searchParams={{ albumId: params.id, ...(sort !== "date" ? { sort } : {}) }}
            isAdmin={isAdmin}
          />
        )}
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
