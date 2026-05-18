"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/context/ToastContext"

type Props = {
  personId: string
  personName: string
  photoCount: number
  variant?: "full" | "icon"
}

export default function DeletePersonButton({
  personId,
  personName,
  photoCount,
  variant = "icon",
}: Props) {
  const router = useRouter()
  const addToast = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const warning =
      photoCount > 0
        ? `Remove "${personName}"?\n\nTheir ${photoCount} photo tag${photoCount === 1 ? "" : "s"} will be removed, but the photos stay. This cannot be undone.`
        : `Remove "${personName}"? This cannot be undone.`
    if (!confirm(warning)) return
    setDeleting(true)
    const res = await fetch(`/api/people/${personId}`, { method: "DELETE" })
    if (res.ok) {
      addToast(`"${personName}" removed`, "success")
      router.push("/people")
    } else {
      addToast("Failed to remove. Please try again.", "error")
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
        🗑 {deleting ? "Removing…" : "Remove Person"}
      </button>
    )
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/50 hover:bg-red-600 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
      aria-label={`Remove ${personName}`}
      title={`Remove ${personName}`}
    >
      {deleting ? "…" : "🗑"}
    </button>
  )
}
