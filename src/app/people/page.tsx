import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
import PersonCard from "@/components/people/PersonCard"

export default async function PeoplePage() {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = (session.user as any)?.isAdmin

  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { tags: true } },
      tags: {
        take: 1,
        orderBy: { photo: { createdAt: "desc" } },
        select: { photo: { select: { thumbUrl: true, blobUrl: true } } },
      },
    },
  })

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: "var(--background)" }}>
      <Header />
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <h1 className="font-serif text-3xl font-bold mb-6">People</h1>
        {people.length === 0 ? (
          <p className="text-center py-20" style={{ color: "var(--muted)" }}>
            No people tagged yet. Tag people when uploading photos.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {people.map((person) => {
              const cover = person.tags[0]?.photo
              return (
                <PersonCard
                  key={person.id}
                  id={person.id}
                  name={person.name}
                  count={person._count.tags}
                  coverUrl={cover?.thumbUrl || cover?.blobUrl || null}
                  isAdmin={isAdmin}
                />
              )
            })}
          </div>
        )}
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
