import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

/**
 * GET /api/download?url=<blobUrl>&name=<filename>
 *
 * Proxies a Vercel Blob file and returns it with Content-Disposition: attachment
 * so the browser triggers a real download instead of opening in a new tab.
 *
 * Only allows URLs from *.public.blob.vercel-storage.com to prevent open-proxy abuse.
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = req.nextUrl.searchParams.get("url")
  const name = req.nextUrl.searchParams.get("name") || "photo.jpg"

  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 })

  // Validate: only allow Vercel Blob CDN URLs
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith(".public.blob.vercel-storage.com")) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 })
  }

  const upstream = await fetch(url)
  if (!upstream.ok) {
    return new NextResponse("Failed to fetch file", { status: 502 })
  }

  const contentType = upstream.headers.get("Content-Type") || "image/jpeg"
  const safeFilename = name.replace(/[^a-zA-Z0-9._-]/g, "_")

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  })
}
