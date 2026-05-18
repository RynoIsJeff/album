import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const q = req.nextUrl.searchParams.get("q")

  const people = await prisma.person.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : undefined,
    orderBy: { name: "asc" },
    include: { _count: { select: { tags: true } } },
  })
  return NextResponse.json(people)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!session.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { name } = await req.json()
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 })

  const person = await prisma.person.upsert({
    where: { name },
    update: {},
    create: { name },
  })
  return NextResponse.json(person, { status: 201 })
}
