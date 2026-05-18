import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const secret = process.env.CLI_IMPORT_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const {
    blobUrl,
    thumbUrl,
    width,
    height,
    takenAt,
    takenYear,
    albumName,
    originalName,
    source = "cli",
  } = body

  if (!blobUrl) return NextResponse.json({ error: "blobUrl required" }, { status: 400 })

  // Find or create album
  let albumId: string | null = null
  if (albumName) {
    let album = await prisma.album.findFirst({ where: { name: albumName }, select: { id: true } })
    if (!album) {
      album = await prisma.album.create({ data: { name: albumName }, select: { id: true } })
    }
    albumId = album.id
  }

  // Skip duplicates: same originalName within same album
  if (originalName && albumId) {
    const existing = await prisma.photo.findFirst({
      where: { originalName, albumId },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ skipped: true, id: existing.id })
    }
  }

  const photo = await prisma.photo.create({
    data: {
      blobUrl,
      thumbUrl: thumbUrl || null,
      width: width || null,
      height: height || null,
      takenAt: takenAt ? new Date(takenAt) : null,
      takenYear: takenYear || (takenAt ? new Date(takenAt).getFullYear() : null),
      albumId,
      originalName: originalName || null,
      source,
    },
    select: { id: true },
  })

  return NextResponse.json({ ok: true, id: photo.id }, { status: 201 })
}
