import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
import YearSidebar from "@/components/timeline/YearSidebar"
import TimelineClient from "@/components/timeline/TimelineClient"
import SearchBar from "@/components/search/SearchBar"
import { YearCount } from "@/types"

type SearchParams = { q?: string; year?: string; personId?: string; albumId?: string }

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const session = await auth()
  if (!session) redirect("/login")

  const isAdmin = (session.user as any)?.isAdmin
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
      include: {
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

  const photos = rawPhotos.map((p) => ({
    ...p,
    takenAt: p.takenAt?.toISOString() ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: undefined,
  }))

  const yearCounts: YearCount[] = rawYearCounts.map((y) => ({
    takenYear: y.takenYear ?? 0,
    count: y._count.id,
  }))

  const nextCursor = hasMore ? photos[photos.length - 1].id : null

  const activeSearchParams = Object.fromEntries(
    Object.entries({ q, year, personId, albumId }).filter(([, v]) => v != null) as [string, string][]
  )

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
        {/* Year sidebar */}
        <aside className="w-28 shrink-0">
          <YearSidebar years={yearCounts} />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {(q || yearNum || personId || albumId) && (
            <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
              {q && <>Searching for &ldquo;{q}&rdquo;</>}
              {yearNum && <> · {yearNum}</>}
            </p>
          )}
          <Suspense fallback={<div className="text-sm" style={{ color: "var(--muted)" }}>Loading…</div>}>
            <TimelineClient
              initialPhotos={photos as any}
              nextCursor={nextCursor}
              searchParams={activeSearchParams}
            />
          </Suspense>
        </main>
      </div>

      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
