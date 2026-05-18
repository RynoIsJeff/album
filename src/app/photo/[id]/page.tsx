import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/db"
import { Metadata } from "next"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
import PhotoDetailActions from "@/components/photos/PhotoDetailActions"
import Image from "next/image"
import Link from "next/link"

export const metadata: Metadata = {
  // Prevent search engines indexing individual photo pages
  robots: { index: false, follow: false },
}

export default async function PhotoDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = (session.user as any)?.isAdmin

  const photo = await prisma.photo.findUnique({
    where: { id: params.id },
    include: {
      album: { select: { id: true, name: true } },
      peopleTags: { include: { person: { select: { id: true, name: true } } } },
    },
  })
  if (!photo) notFound()

  const takenAtStr = photo.takenAt
    ? photo.takenAt.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: "var(--background)" }}>
      <Header />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-5" style={{ color: "var(--muted)" }}>
          <Link href="/timeline" className="hover:opacity-70 transition-opacity">Timeline</Link>
          {photo.album && (
            <>
              <span>/</span>
              <Link href={`/albums/${photo.album.id}`} className="hover:opacity-70 transition-opacity">
                {photo.album.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span style={{ color: "var(--foreground)" }}>Photo</span>
        </nav>

        {/* Photo */}
        <div
          className="rounded-xl overflow-hidden mb-6 flex items-center justify-center"
          style={{ background: "#1a1a1a", minHeight: "40vh" }}
        >
          <Image
            src={photo.blobUrl}
            alt={photo.caption || "Family photo"}
            width={photo.width || 1200}
            height={photo.height || 900}
            className="w-full h-auto max-h-[70vh] object-contain"
            priority
          />
        </div>

        {/* Metadata + actions row */}
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            {photo.caption && (
              <h1 className="font-serif text-2xl font-bold mb-2">{photo.caption}</h1>
            )}

            <div
              className="flex flex-wrap gap-x-5 gap-y-1 text-sm mb-4"
              style={{ color: "var(--muted)" }}
            >
              {takenAtStr && <span>📅 {takenAtStr}</span>}
              {photo.album && (
                <Link href={`/albums/${photo.album.id}`} className="hover:opacity-70 transition-opacity">
                  📚 {photo.album.name}
                </Link>
              )}
              {!photo.caption && !takenAtStr && !photo.album && (
                <span className="italic">No details added yet</span>
              )}
            </div>

            {/* People */}
            {photo.peopleTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {photo.peopleTags.map((t) => (
                  <Link
                    key={t.person.id}
                    href={`/people/${t.person.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border transition-colors hover:border-stone-400"
                    style={{ borderColor: "var(--border)", background: "white" }}
                  >
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: "var(--sepia-light)", color: "var(--muted)" }}
                    >
                      {t.person.name[0].toUpperCase()}
                    </span>
                    {t.person.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right: download + share */}
          <PhotoDetailActions
            blobUrl={photo.blobUrl}
            originalName={photo.originalName}
            photoId={photo.id}
          />
        </div>

        {/* Admin edit shortcut */}
        {isAdmin && (
          <div
            className="mt-6 pt-6 border-t text-sm"
            style={{ borderColor: "var(--border)", color: "var(--muted)" }}
          >
            Open this photo in the{" "}
            <Link href="/timeline" className="underline hover:opacity-70">
              timeline
            </Link>{" "}
            to edit its details or delete it.
          </div>
        )}
      </div>

      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
