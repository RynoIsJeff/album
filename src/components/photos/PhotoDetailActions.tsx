"use client"

import { useState } from "react"

type Props = {
  blobUrl: string
  originalName: string | null
  photoId: string
}

export default function PhotoDetailActions({ blobUrl, originalName, photoId }: Props) {
  const [copied, setCopied] = useState(false)

  const downloadUrl = `/api/download?url=${encodeURIComponent(blobUrl)}&name=${encodeURIComponent(originalName || "photo.jpg")}`

  const handleShare = async () => {
    const url = window.location.href
    if (typeof navigator.share !== "undefined") {
      try {
        await navigator.share({ title: "Family photo", url })
        return
      } catch {
        // fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <a
        href={downloadUrl}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors hover:border-stone-400"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
      >
        ⬇ Download
      </a>
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors hover:border-stone-400"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
      >
        {copied ? "✓ Copied!" : "🔗 Copy link"}
      </button>
    </div>
  )
}
