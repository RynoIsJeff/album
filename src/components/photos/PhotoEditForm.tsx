"use client"

import { useState, useEffect } from "react"
import { PhotoSummary } from "@/types"

type Props = {
  photo: PhotoSummary
  onSave: (updated: PhotoSummary) => void
  onCancel: () => void
}

export default function PhotoEditForm({ photo, onSave, onCancel }: Props) {
  const [caption, setCaption] = useState(photo.caption ?? "")
  const [takenAt, setTakenAt] = useState(photo.takenAt ? photo.takenAt.slice(0, 10) : "")
  const [albumName, setAlbumName] = useState(photo.album?.name ?? "")
  const [peopleInput, setPeopleInput] = useState("")
  const [peopleNames, setPeopleNames] = useState<string[]>(
    photo.peopleTags.map((t) => t.person.name)
  )
  const [albums, setAlbums] = useState<{ id: string; name: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/albums")
      .then((r) => r.json())
      .then(setAlbums)
      .catch(() => {})
  }, [])

  const addPerson = () => {
    const name = peopleInput.trim()
    if (!name || peopleNames.includes(name)) return
    setPeopleNames((prev) => [...prev, name])
    setPeopleInput("")
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      // Resolve album
      let albumId: string | null = null
      const trimmed = albumName.trim()
      if (trimmed) {
        const existing = albums.find(
          (a) => a.name.toLowerCase() === trimmed.toLowerCase()
        )
        if (existing) {
          albumId = existing.id
        } else {
          const r = await fetch("/api/albums", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: trimmed }),
          })
          if (!r.ok) throw new Error("Failed to create album")
          albumId = (await r.json()).id
        }
      }

      // Resolve people
      const peopleIds: string[] = []
      for (const name of peopleNames) {
        const r = await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })
        if (!r.ok) throw new Error(`Failed to resolve person: ${name}`)
        peopleIds.push((await r.json()).id)
      }

      // Save
      const r = await fetch(`/api/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: caption.trim() || null,
          takenAt: takenAt || null,
          takenYear: takenAt ? new Date(takenAt).getFullYear() : null,
          albumId,
          peopleIds,
        }),
      })
      if (!r.ok) throw new Error("Save failed")
      onSave(await r.json())
    } catch {
      setError("Failed to save. Please try again.")
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
      <div>
        <label className="text-xs font-medium text-white/70 block mb-1">Caption</label>
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's happening in this photo?"
          className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 outline-none focus:border-white/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-white/70 block mb-1">Date taken</label>
          <input
            type="date"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 text-white border border-white/20 outline-none focus:border-white/50"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-white/70 block mb-1">Album</label>
          <input
            type="text"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
            placeholder="Album name"
            list="edit-photo-albums"
            className="w-full px-3 py-2 text-sm rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 outline-none focus:border-white/50"
          />
          <datalist id="edit-photo-albums">
            {albums.map((a) => (
              <option key={a.id} value={a.name} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-white/70 block mb-1">People</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={peopleInput}
            onChange={(e) => setPeopleInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addPerson())
            }
            placeholder="Add a name, press Enter"
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 outline-none focus:border-white/50"
          />
          <button
            type="button"
            onClick={addPerson}
            className="px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
          >
            Add
          </button>
        </div>
        {peopleNames.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {peopleNames.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/15 text-white"
              >
                {name}
                <button
                  type="button"
                  onClick={() =>
                    setPeopleNames((p) => p.filter((n) => n !== name))
                  }
                  className="text-white/60 hover:text-white leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex-1 py-2 rounded-lg text-sm font-medium bg-white text-stone-900 hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
