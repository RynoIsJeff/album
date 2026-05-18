"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/context/ToastContext"

export default function CreateAlbumButton() {
  const router = useRouter()
  const addToast = useToast()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)

  const handleClose = useCallback(() => {
    setOpen(false)
    setName("")
    setDescription("")
  }, [])

  // Dismiss on Escape key
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) handleClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, saving, handleClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      const res = await fetch("/api/albums", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, description: description.trim() || undefined }),
      })
      if (!res.ok) throw new Error("Failed to create album")
      addToast(`Album "${trimmed}" created`, "success")
      handleClose()
      router.refresh()
    } catch {
      addToast("Failed to create album. Please try again.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors hover:border-stone-400"
        style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
      >
        + New Album
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={handleClose}
        >
          <div
            className="w-full max-w-md rounded-2xl p-6 shadow-xl"
            style={{ background: "var(--background)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-xl font-bold mb-4">New Album</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Album name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. 1970s Holidays"
                  required
                  autoFocus
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:border-stone-400"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-1">
                  Description{" "}
                  <span className="font-normal" style={{ color: "var(--muted)" }}>(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of this album"
                  rows={3}
                  className="w-full px-3 py-2 text-sm rounded-lg border outline-none focus:border-stone-400 resize-none"
                  style={{ borderColor: "var(--border)" }}
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex-1 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
                  style={{ background: "var(--foreground)", color: "var(--background)" }}
                >
                  {saving ? "Creating…" : "Create Album"}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm border transition-colors hover:border-stone-400 disabled:opacity-50"
                  style={{ borderColor: "var(--border)" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
