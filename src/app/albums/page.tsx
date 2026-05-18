import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
import DeleteAlbumButton from "@/components/albums/DeleteAlbumButton"
import CreateAlbumButton from "@/components/albums/CreateAlbumButton"
import Link from "next/link"
import Image from "next/image"

export default async function AlbumsPage() {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = session.user?.isAdmin

  const albums = await prisma.album.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { photos: true } },
      photos: {
        take: 1,
        orderBy: { createdAt: "desc" },
        select: { thumbUrl: true, blobUrl: true, width: true, height: true },
      },
    },
  })

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: "var(--background)" }}>
      <Header />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-3xl font-bold">Albums</h1>
          {isAdmin && <CreateAlbumButton />}
        </div>
        {albums.length === 0 ? (
          <p className="text-center py-20" style={{ color: "var(--muted)" }}>
            No albums yet. Photos will be grouped into albums as you upload them.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {albums.map((album) => {
              const cover = album.photos[0]
              return (
                <div key={album.id} className="group relative">
                  <Link
                    href={`/albums/${album.id}`}
                    className="block rounded-xl overflow-hidden border transition-shadow hover:shadow-md"
                    style={{ borderColor: "var(--border)", background: "white" }}
                  >
                    <div className="aspect-square relative bg-stone-100">
                      {cover ? (
                        <Image
                          src={cover.thumbUrl || cover.blobUrl}
                          alt={album.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">📷</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-sm truncate">{album.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {album._count.photos} {album._count.photos === 1 ? "photo" : "photos"}
                      </p>
                    </div>
                  </Link>
                  {isAdmin && (
                    <DeleteAlbumButton
                      albumId={album.id}
                      albumName={album.name}
                      photoCount={album._count.photos}
                      variant="icon"
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
