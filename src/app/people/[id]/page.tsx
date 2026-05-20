import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
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
        <PersonPageClient
          personId={person.id}
          personName={person.name}
          initialCoverPhotoId={person.coverPhotoId ?? null}
          initialCoverUrl={coverUrl}
          photos={photos}
          nextCursor={hasMore ? photos[photos.length - 1].id : null}
          photoCount={person._count.tags}
          isAdmin={isAdmin}
        />
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
