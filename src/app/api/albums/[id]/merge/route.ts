import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const isAdmin = (session.user as any)?.isAdmin
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { targetAlbumId } = await req.json()
  if (!targetAlbumId)
    return NextResponse.json({ error: "targetAlbumId required" }, { status: 400 })
  if (targetAlbumId === params.id)
    return NextResponse.json({ error: "Cannot merge into itself" }, { status: 400 })

  // Verify both albums exist
  const [source, target] = await Promise.all([
    prisma.album.findUnique({ where: { id: params.id } }),
    prisma.album.findUnique({ where: { id: targetAlbumId } }),
  ])
  if (!source || !target)
    return NextResponse.json({ error: "Album not found" }, { status: 404 })

  // Move all photos then delete source
  await prisma.$transaction([
    prisma.photo.updateMany({
      where: { albumId: params.id },
      data: { albumId: targetAlbumId },
    }),
    prisma.album.delete({ where: { id: params.id } }),
  ])

  return NextResponse.json({ ok: true, targetAlbumId })
}
