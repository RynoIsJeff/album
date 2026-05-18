"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Props = {
  albumId: string
  initialName: string
  isAdmin: boolean
}

export default function RenameAlbumForm({ albumId, initialName, isAdmin }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === initialName) { setEditing(false); return }
    setSaving(true)
    const res = await fetch(`/api/albums/${albumId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
    if (res.ok) {
      router.refresh()
      setEditing(false)
    }
    setSaving(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave()
            if (e.key === "Escape") { setEditing(false); setName(initialName) }
          }}
          autoFocus
          className="font-serif text-3xl font-bold bg-transparent border-b-2 outline-none"
          style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm px-3 py-1 rounded-lg border transition-colors hover:border-stone-400 disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
        >
          {saving ? "…" : "Save"}
        </button>
        <button
          onClick={() => { setEditing(false); setName(initialName) }}
          className="text-sm px-3 py-1 rounded-lg border transition-colors hover:border-stone-400"
          style={{ borderColor: "var(--border)" }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="font-serif text-3xl font-bold">{name}</h1>
      {isAdmin && (
        <button
          onClick={() => setEditing(true)}
          className="text-xl hover:opacity-60 transition-opacity"
          aria-label="Rename album"
          title="Rename album"
        >
          ✏️
        </button>
      )}
    </div>
  )
}
