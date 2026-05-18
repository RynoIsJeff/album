"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type Props = {
  albumId: string
  albumName: string
}

export default function MergeAlbumButton({ albumId, albumName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [albums, setAlbums] = useState<{ id: string; name: string }[]>([])
  const [targetId, setTargetId] = useState("")
  const [merging, setMerging] = useState(false)

  useEffect(() => {
    if (!open) return
    fetch("/api/albums")
      .then((r) => r.json())
      .then((data) => setAlbums(data.filter((a: { id: string }) => a.id !== albumId)))
      .catch(() => {})
  }, [open, albumId])

  const handleMerge = async () => {
    if (!targetId) return
    const target = albums.find((a) => a.id === targetId)
    if (
      !confirm(
        `Move all photos from "${albumName}" into "${target?.name}"?\n\n"${albumName}" will be deleted afterwards. This cannot be undone.`
      )
    )
      return
    setMerging(true)
    const res = await fetch(`/api/albums/${albumId}/merge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetAlbumId: targetId }),
    })
    if (res.ok) {
      router.push(`/albums/${targetId}`)
      router.refresh()
    } else {
      alert("Merge failed. Please try again.")
      setMerging(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:border-stone-400"
        style={{ borderColor: "var(--border)", color: "var(--muted)" }}
      >
        ⇄ Merge into…
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={targetId}
        onChange={(e) => setTargetId(e.target.value)}
        className="px-3 py-2 text-sm rounded-lg border outline-none"
        style={{ borderColor: "var(--border)" }}
      >
        <option value="">Select album to merge into…</option>
        {albums.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <button
        onClick={handleMerge}
        disabled={!targetId || merging}
        className="px-4 py-2 text-sm rounded-lg border transition-colors hover:border-stone-400 disabled:opacity-50"
        style={{ borderColor: "var(--border)" }}
      >
        {merging ? "Merging…" : "Merge"}
      </button>
      <button
        onClick={() => setOpen(false)}
        className="px-3 py-2 text-sm rounded-lg border transition-colors hover:border-stone-400"
        style={{ borderColor: "var(--border)" }}
      >
        Cancel
      </button>
    </div>
  )
}
