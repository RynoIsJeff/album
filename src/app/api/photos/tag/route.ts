import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

/**
 * POST /api/photos/tag
 * Body: { photoIds: string[], peopleNames: string[] }
 *
 * Upserts each person by name, then creates PeopleTags for every
 * photoId × personId combination. Skips duplicates so re-tagging is safe.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const isAdmin = session.user?.isAdmin
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { photoIds, peopleNames } = await req.json()

  if (!Array.isArray(photoIds) || photoIds.length === 0)
    return NextResponse.json({ error: "photoIds must be a non-empty array" }, { status: 400 })
  if (!Array.isArray(peopleNames) || peopleNames.length === 0)
    return NextResponse.json({ error: "peopleNames must be a non-empty array" }, { status: 400 })

  const trimmedNames: string[] = [...new Set(
    (peopleNames as string[]).map((n) => n.trim()).filter(Boolean)
  )]

  // Upsert all people (Person.name is unique)
  const people = await Promise.all(
    trimmedNames.map((name) =>
      prisma.person.upsert({
        where: { name },
        create: { name },
        update: {},
      })
    )
  )

  // Create all photoId × personId tag pairs, skipping existing ones
  const tagData = (photoIds as string[]).flatMap((photoId) =>
    people.map((person) => ({ photoId, personId: person.id }))
  )

  const result = await prisma.peopleTag.createMany({
    data: tagData,
    skipDuplicates: true,
  })

  return NextResponse.json({
    ok: true,
    photosTagged: photoIds.length,
    peopleApplied: people.map((p) => ({ id: p.id, name: p.name })),
    newTagsCreated: result.count,
  })
}
