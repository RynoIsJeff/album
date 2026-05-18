"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/context/ToastContext"

type Props = {
  personId: string
  initialName: string
  isAdmin?: boolean
}

export default function RenamePersonForm({ personId, initialName, isAdmin }: Props) {
  const router = useRouter()
  const addToast = useToast()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === initialName) { setEditing(false); return }
    setSaving(true)
    setError("")
    const res = await fetch(`/api/people/${personId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    })
    if (res.ok) {
      addToast("Name updated", "success")
      router.refresh()
      setEditing(false)
    } else {
      addToast("That name is already taken.", "error")
      setError("That name is already taken.")
    }
    setSaving(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-1">
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
        {error && <p className="text-xs text-red-600">{error}</p>}
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
          aria-label="Rename person"
          title="Rename person"
        >
          ✏️
        </button>
      )}
    </div>
  )
}
