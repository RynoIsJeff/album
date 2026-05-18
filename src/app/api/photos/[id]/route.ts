import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const photo = await prisma.photo.findUnique({
    where: { id: params.id },
    include: {
      album: { select: { id: true, name: true } },
      peopleTags: { include: { person: { select: { id: true, name: true } } } },
    },
  })
  if (!photo) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(serialize(photo))
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { caption, takenAt, takenYear, albumId, peopleIds } = body

  const photo = await prisma.$transaction(async (tx) => {
    if (peopleIds !== undefined) {
      await tx.peopleTag.deleteMany({ where: { photoId: params.id } })
      if (peopleIds.length > 0) {
        await tx.peopleTag.createMany({
          data: peopleIds.map((personId: string) => ({ photoId: params.id, personId })),
        })
      }
    }
    return tx.photo.update({
      where: { id: params.id },
      data: {
        ...(caption !== undefined ? { caption } : {}),
        ...(takenAt !== undefined ? { takenAt: takenAt ? new Date(takenAt) : null } : {}),
        ...(takenYear !== undefined ? { takenYear } : {}),
        ...(albumId !== undefined ? { albumId } : {}),
      },
      include: {
        album: { select: { id: true, name: true } },
        peopleTags: { include: { person: { select: { id: true, name: true } } } },
      },
    })
  })

  return NextResponse.json(serialize(photo))
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const isAdmin = (session.user as any)?.isAdmin
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.photo.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}

function serialize(photo: any) {
  return {
    ...photo,
    takenAt: photo.takenAt?.toISOString() ?? null,
    createdAt: photo.createdAt.toISOString(),
    updatedAt: photo.updatedAt?.toISOString() ?? undefined,
  }
}
