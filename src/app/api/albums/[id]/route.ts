import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const album = await prisma.album.findUnique({
    where: { id: params.id },
    include: { _count: { select: { photos: true } } },
  })
  if (!album) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(album)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!session.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { name, description } = await req.json()
  const album = await prisma.album.update({
    where: { id: params.id },
    data: { ...(name ? { name } : {}), ...(description !== undefined ? { description } : {}) },
  })
  return NextResponse.json(album)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const isAdmin = session.user?.isAdmin
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.album.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
