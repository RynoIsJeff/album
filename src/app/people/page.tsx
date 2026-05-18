import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
import PersonBadge from "@/components/people/PersonBadge"

export default async function PeoplePage() {
  const session = await auth()
  if (!session) redirect("/login")
  const isAdmin = (session.user as any)?.isAdmin

  const people = await prisma.person.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { tags: true } } },
  })

  return (
    <div className="min-h-screen pb-16 md:pb-0" style={{ background: "var(--background)" }}>
      <Header />
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
        <h1 className="font-serif text-3xl font-bold mb-6">People</h1>
        {people.length === 0 ? (
          <p className="text-center py-20" style={{ color: "var(--muted)" }}>
            No people tagged yet. Tag people when uploading photos.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {people.map((person) => (
              <PersonBadge
                key={person.id}
                id={person.id}
                name={person.name}
                count={person._count.tags}
              />
            ))}
          </div>
        )}
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
