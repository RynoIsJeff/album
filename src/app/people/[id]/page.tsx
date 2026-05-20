import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
import RenamePersonForm from "@/components/people/RenamePersonForm"
import DeletePersonButton from "@/components/people/DeletePersonButton"
import PersonPageClient from "@/components/people/PersonPageClient"

export default async function PersonPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = session.user?.isAdmin

  const person = await prisma.person.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { tags: true } },
      coverPhoto: { select: { thumbUrl: true, blobUrl: true } },
    },
  })
  if (!person) notFound()

  const coverUrl = person.coverPhoto?.thumbUrl || person.coverPhoto?.blobUrl || null

  const rawPhotos = await prisma.photo.findMany({
    where: { peopleTags: { some: { personId: params.id } } },
    orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
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
    albumPosition: null,
    album: p.album ?? null,
    peopleTags: p.peopleTags,
  }))

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: "var(--background)" }}>
      <Header />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Avatar is rendered inside PersonPageClient so it can update live */}
            <PersonPageClient
              personId={person.id}
              personName={person.name}
              initialCoverPhotoId={person.coverPhotoId ?? null}
              initialCoverUrl={coverUrl}
              photos={photos}
              nextCursor={hasMore ? photos[photos.length - 1].id : null}
              isAdmin={isAdmin}
            />
            <div>
              <RenamePersonForm
                personId={person.id}
                initialName={person.name}
                isAdmin={isAdmin}
              />
              <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
                {person._count.tags} {person._count.tags === 1 ? "photo" : "photos"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <DeletePersonButton
              personId={person.id}
              personName={person.name}
              photoCount={person._count.tags}
              variant="full"
            />
          )}
        </div>

        {photos.length === 0 && (
          <div className="text-center py-20" style={{ color: "var(--muted)" }}>
            <p className="text-4xl mb-3">👤</p>
            <p className="text-lg font-medium">No photos yet</p>
            <p className="text-sm mt-1">Tag {person.name} when uploading or editing photos</p>
          </div>
        )}
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
