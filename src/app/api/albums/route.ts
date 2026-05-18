import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const albums = await prisma.album.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { photos: true } } },
  })
  return NextResponse.json(albums)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!(session.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { name, description } = await req.json()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })

  const album = await prisma.album.create({ data: { name, description } })
  return NextResponse.json(album, { status: 201 })
}
