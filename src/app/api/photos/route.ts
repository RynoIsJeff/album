import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = req.nextUrl
  const cursor = searchParams.get("cursor") || undefined
  const limit = 30
  const q = searchParams.get("q") || undefined
  const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined
  const personId = searchParams.get("personId") || undefined
  const albumId = searchParams.get("albumId") || undefined

  const where = {
    ...(year ? { takenYear: year } : {}),
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

  const photos = await prisma.photo.findMany({
    where,
    orderBy: [{ takenAt: "desc" }, { createdAt: "desc" }],
    take: limit + 1,
    skip: cursor ? 1 : 0,
    cursor: cursor ? { id: cursor } : undefined,
    include: {
      album: { select: { id: true, name: true } },
      peopleTags: { include: { person: { select: { id: true, name: true } } } },
    },
  })

  const hasMore = photos.length > limit
  if (hasMore) photos.pop()

  return NextResponse.json({
    photos: photos.map(serializePhoto),
    nextCursor: hasMore ? photos[photos.length - 1].id : null,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const {
    blobUrl,
    thumbUrl,
    width,
    height,
    takenAt,
    takenYear,
    caption,
    originalName,
    albumId,
    peopleIds,
  } = body

  if (!blobUrl) return NextResponse.json({ error: "blobUrl required" }, { status: 400 })

  const photo = await prisma.photo.create({
    data: {
      blobUrl,
      thumbUrl: thumbUrl || null,
      width: width || null,
      height: height || null,
      takenAt: takenAt ? new Date(takenAt) : null,
      takenYear: takenYear || (takenAt ? new Date(takenAt).getFullYear() : null),
      caption: caption || null,
      originalName: originalName || null,
      albumId: albumId || null,
      source: "browser",
      peopleTags: peopleIds?.length
        ? {
            create: peopleIds.map((personId: string) => ({ personId })),
          }
        : undefined,
    },
    include: {
      album: { select: { id: true, name: true } },
      peopleTags: { include: { person: { select: { id: true, name: true } } } },
    },
  })

  return NextResponse.json(serializePhoto(photo), { status: 201 })
}

function serializePhoto(photo: any) {
  return {
    ...photo,
    takenAt: photo.takenAt?.toISOString() ?? null,
    createdAt: photo.createdAt.toISOString(),
    updatedAt: photo.updatedAt?.toISOString() ?? undefined,
  }
}
