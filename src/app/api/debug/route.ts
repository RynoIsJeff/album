import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET() {
  const checks: Record<string, string> = {}

  // Check env vars (values hidden)
  checks.DATABASE_URL = process.env.DATABASE_URL ? "set" : "MISSING"
  checks.DIRECT_URL = process.env.DIRECT_URL ? "set" : "MISSING"
  checks.AUTH_SECRET = process.env.AUTH_SECRET ? "set" : "MISSING"
  checks.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET ? "set" : "MISSING"
  checks.FAMILY_PASSWORD = process.env.FAMILY_PASSWORD ? "set" : "MISSING"

  // Try a simple DB query
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.db_connection = "OK"
  } catch (err) {
    checks.db_connection = "FAILED: " + (err as Error).message
  }

  return NextResponse.json(checks)
}
