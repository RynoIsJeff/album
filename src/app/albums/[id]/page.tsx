import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
import PhotoGrid from "@/components/photos/PhotoGrid"

export default async function AlbumPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = (session.user as any)?.isAdmin

  const album = await prisma.album.findUnique({
    where: { id: params.id },
    include: { _count: { select: { photos: true } } },
  })
  if (!album) notFound()

  const rawPhotos = await prisma.photo.findMany({
    where: { albumId: params.id },
    orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
    take: 31,
    include: {
      album: { select: { id: true, name: true } },
      peopleTags: { include: { person: { select: { id: true, name: true } } } },
    },
  })

  const hasMore = rawPhotos.length > 30
  if (hasMore) rawPhotos.pop()

  const photos = rawPhotos.map((p) => ({
    ...p,
    takenAt: p.takenAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: undefined,
  }))

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: "var(--background)" }}>
      <Header />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-bold">{album.name}</h1>
          {album.description && (
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>{album.description}</p>
          )}
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {album._count.photos} {album._count.photos === 1 ? "photo" : "photos"}
          </p>
        </div>
        <PhotoGrid
          initialPhotos={photos as any}
          nextCursor={hasMore ? photos[photos.length - 1].id : null}
          searchParams={{ albumId: params.id }}
        />
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
