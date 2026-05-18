import { NextRequest, NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (!session.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = (await req.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/tiff"],
        maximumSizeInBytes: 20 * 1024 * 1024, // 20MB
      }),
      onUploadCompleted: async ({ blob }) => {
        console.log("Blob uploaded:", blob.url)
      },
    })
    return NextResponse.json(jsonResponse)
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 })
  }
}
