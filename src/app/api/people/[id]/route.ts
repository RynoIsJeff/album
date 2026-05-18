import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const person = await prisma.person.findUnique({
    where: { id: params.id },
    include: { _count: { select: { tags: true } } },
  })
  if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(person)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const isAdmin = (session.user as any)?.isAdmin
  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  await prisma.person.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
