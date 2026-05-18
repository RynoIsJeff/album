"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/context/ToastContext"

type Props = {
  albumId: string
  albumName: string
  photoCount: number
  /** If true renders as a full-width button (album detail page).
   *  If false renders as a small icon overlay (album grid card). */
  variant?: "full" | "icon"
}

export default function DeleteAlbumButton({ albumId, albumName, photoCount, variant = "icon" }: Props) {
  const router = useRouter()
  const addToast = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const warning =
      photoCount > 0
        ? `Delete "${albumName}"?\n\nThis will remove the album but keep all ${photoCount} photo${photoCount === 1 ? "" : "s"} — they'll just be unassigned. This cannot be undone.`
        : `Delete the album "${albumName}"? This cannot be undone.`

    if (!confirm(warning)) return

    setDeleting(true)
    const res = await fetch(`/api/albums/${albumId}`, { method: "DELETE" })
    if (res.ok) {
      addToast(`Album "${albumName}" deleted`, "success")
      router.push("/albums")
    } else {
      addToast("Failed to delete album. Please try again.", "error")
      setDeleting(false)
    }
  }

  if (variant === "full") {
    return (
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:bg-red-50 hover:border-red-300 hover:text-red-700 disabled:opacity-50"
        style={{ borderColor: "var(--border)", color: "var(--muted)" }}
      >
        🗑 {deleting ? "Deleting…" : "Delete Album"}
      </button>
    )
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-red-600 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
      aria-label={`Delete ${albumName}`}
      title={`Delete ${albumName}`}
    >
      {deleting ? "…" : "🗑"}
    </button>
  )
}
