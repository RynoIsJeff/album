import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
import ScrollspyYearSidebar from "@/components/timeline/ScrollspyYearSidebar"
import TimelineClient from "@/components/timeline/TimelineClient"
import SearchBar from "@/components/search/SearchBar"
import { YearCount } from "@/types"

type SearchParams = { q?: string; year?: string; personId?: string; albumId?: string }

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  let errorMessage: string | null = null
  let photos: any[] = []
  let yearCounts: YearCount[] = []
  let nextCursor: string | null = null
  let isAdmin = false
  let activeSearchParams: Record<string, string> = {}

  try {
    const session = await auth()
    if (!session) redirect("/login")

    isAdmin = session.user?.isAdmin ?? false
    const { q, year, personId, albumId } = searchParams
    const yearNum = year ? parseInt(year) : undefined

    const where = {
      ...(yearNum ? { takenYear: yearNum } : {}),
      ...(albumId ? { albumId } : {}),
      ...(personId ? { peopleTags: { some: { personId } } } : {}),
      ...(q
        ? {
            OR: [
              { caption: { contains: q, mode: "insensitive" as const } },
              { originalName: { contains: q, mode: "insensitive" as const } },
              {
                peopleTags: {
                  some: {
                    person: { name: { contains: q, mode: "insensitive" as const } },
                  },
                },
              },
            ],
          }
        : {}),
    }

    const [rawPhotos, rawYearCounts] = await Promise.all([
      prisma.photo.findMany({
        where,
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
      }),
      prisma.photo.groupBy({
        by: ["takenYear"],
        _count: { id: true },
        orderBy: { takenYear: "desc" },
      }),
    ])

    const hasMore = rawPhotos.length > 30
    if (hasMore) rawPhotos.pop()

    // Explicitly serialize — no Date objects or undefined values cross the boundary
    photos = rawPhotos.map((p) => ({
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

    yearCounts = rawYearCounts.map((y) => ({
      takenYear: y.takenYear ?? 0,
      count: y._count.id,
    }))

    nextCursor = hasMore ? photos[photos.length - 1].id : null

    activeSearchParams = Object.fromEntries(
      Object.entries({ q, year, personId, albumId }).filter(([, v]) => v != null) as [string, string][]
    )

    // Resolve display names for filter chips (after activeSearchParams is set)
    if (personId) {
      const person = await prisma.person.findUnique({ where: { id: personId }, select: { name: true } })
      if (person) activeSearchParams.personName = person.name
    }
    if (albumId) {
      const album = await prisma.album.findUnique({ where: { id: albumId }, select: { name: true } })
      if (album) activeSearchParams.albumName = album.name
    }
  } catch (err: any) {
    // Let Next.js handle redirects normally
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw err
    errorMessage = String(err?.message ?? err)
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen p-8" style={{ background: "var(--background)" }}>
        <h1 className="font-serif text-2xl font-bold mb-4 text-red-700">Something went wrong</h1>
        <pre className="text-sm bg-red-50 border border-red-200 rounded p-4 overflow-auto">{errorMessage}</pre>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: "var(--background)" }}>
      <Header />

      {/* Mobile search */}
      <div className="sm:hidden px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex gap-8">
        {/* Year sidebar — desktop only */}
        <aside className="hidden md:block w-28 shrink-0">
          <ScrollspyYearSidebar years={yearCounts} />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 w-full">
          <Suspense fallback={<div className="text-sm" style={{ color: "var(--muted)" }}>Loading…</div>}>
            <TimelineClient
              initialPhotos={photos}
              nextCursor={nextCursor}
              searchParams={activeSearchParams}
              isAdmin={isAdmin}
              yearCounts={yearCounts}
              personName={activeSearchParams.personName}
              albumName={activeSearchParams.albumName}
            />
          </Suspense>
        </main>
      </div>

      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
