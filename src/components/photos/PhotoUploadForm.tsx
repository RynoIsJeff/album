"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { upload } from "@vercel/blob/client"
import PeopleTagInput from "@/components/people/PeopleTagInput"

type UploadedFile = {
  file: File
  previewUrl: string
  blobUrl?: string
  thumbUrl?: string
  width?: number
  height?: number
  status: "pending" | "uploading" | "done" | "error"
  error?: string
}

type MetaState = {
  caption: string
  dateMode: "full" | "year"
  takenAt: string
  takenYear: string
  albumName: string
  peopleInput: string
  peopleNames: string[]
  saved: boolean
}

function resizeImage(file: File, maxWidth: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.85)
    }
    img.src = url
  })
}

async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.width, height: img.height })
    }
    img.src = url
  })
}

export default function PhotoUploadForm() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [metas, setMetas] = useState<Record<string, MetaState>>({})
  const [albums, setAlbums] = useState<{ id: string; name: string }[]>([])
  const [sessionPeople, setSessionPeople] = useState<string[]>([])

  const fetchAlbums = useCallback(async () => {
    const res = await fetch("/api/albums")
    if (res.ok) setAlbums(await res.json())
  }, [])

  useEffect(() => { fetchAlbums() }, [fetchAlbums])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = acceptedFiles.map((f) => ({
        file: f,
        previewUrl: URL.createObjectURL(f),
        status: "pending",
      }))
      setFiles((prev) => [...prev, ...newFiles])
      const initMeta: Record<string, MetaState> = {}
      newFiles.forEach((f) => {
        initMeta[f.file.name] = {
          caption: "",
          dateMode: "full",
          takenAt: "",
          takenYear: "",
          albumName: "",
          peopleInput: "",
          peopleNames: [],
          saved: false,
        }
      })
      setMetas((prev) => ({ ...prev, ...initMeta }))

      for (const uf of newFiles) {
        setFiles((prev) =>
          prev.map((f) => (f.file.name === uf.file.name ? { ...f, status: "uploading" } : f))
        )
        try {
          const { width, height } = await getImageDimensions(uf.file)
          const resized = await resizeImage(uf.file, 2400)
          const thumb = await resizeImage(uf.file, 400)

          const [fullBlob, thumbBlob] = await Promise.all([
            upload(uf.file.name, resized, { access: "public", handleUploadUrl: "/api/upload" }),
            upload(`thumb_${uf.file.name}`, thumb, { access: "public", handleUploadUrl: "/api/upload" }),
          ])

          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === uf.file.name
                ? { ...f, status: "done", blobUrl: fullBlob.url, thumbUrl: thumbBlob.url, width, height }
                : f
            )
          )
        } catch (err) {
          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === uf.file.name
                ? { ...f, status: "error", error: (err as Error).message }
                : f
            )
          )
        }
      }
    },
    [fetchAlbums]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif"] },
    multiple: true,
  })

  const updateMeta = (fileName: string, patch: Partial<MetaState>) => {
    setMetas((prev) => ({ ...prev, [fileName]: { ...prev[fileName], ...patch } }))
  }

  const addPerson = (fileName: string, name: string) => {
    const meta = metas[fileName]
    if (!name || meta.peopleNames.includes(name)) return
    updateMeta(fileName, { peopleNames: [...meta.peopleNames, name], peopleInput: "" })
    setSessionPeople((prev) =>
      prev.some((n) => n.toLowerCase() === name.toLowerCase()) ? prev : [...prev, name]
    )
  }

  const removePerson = (fileName: string, name: string) => {
    updateMeta(fileName, {
      peopleNames: metas[fileName].peopleNames.filter((n) => n !== name),
    })
  }

  // Copy album + date from one card to all other unsaved cards
  const applyToAll = (sourceFileName: string) => {
    const src = metas[sourceFileName]
    setMetas((prev) => {
      const next = { ...prev }
      for (const [name, meta] of Object.entries(next)) {
        if (name !== sourceFileName && !meta.saved) {
          next[name] = {
            ...meta,
            albumName: src.albumName,
            dateMode: src.dateMode,
            takenAt: src.takenAt,
            takenYear: src.takenYear,
          }
        }
      }
      return next
    })
  }

  const savePhoto = async (uf: UploadedFile) => {
    if (uf.status !== "done") return
    const meta = metas[uf.file.name]

    const pendingInput = meta.peopleInput.trim()
    const allPeopleNames = pendingInput && !meta.peopleNames.includes(pendingInput)
      ? [...meta.peopleNames, pendingInput]
      : meta.peopleNames

    try {
      const peopleIds: string[] = []
      for (const name of allPeopleNames) {
        const res = await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })
        if (!res.ok) throw new Error(`Failed to resolve person: ${name}`)
        const person = await res.json()
        peopleIds.push(person.id)
      }

      let albumId: string | null = null
      const trimmedAlbumName = meta.albumName.trim()
      if (trimmedAlbumName) {
        const existing = albums.find(
          (a) => a.name.toLowerCase() === trimmedAlbumName.toLowerCase()
        )
        if (existing) {
          albumId = existing.id
        } else {
          const res = await fetch("/api/albums", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: trimmedAlbumName }),
          })
          if (!res.ok) throw new Error("Failed to create album")
          const album = await res.json()
          albumId = album.id
          setAlbums((prev) => [...prev, { id: album.id, name: album.name }])
        }
      }

      const takenAt = meta.dateMode === "full" ? (meta.takenAt || null) : null
      const takenYear =
        meta.dateMode === "year"
          ? (meta.takenYear ? parseInt(meta.takenYear) : null)
          : (meta.takenAt ? new Date(meta.takenAt).getFullYear() : null)

      const albumPosition = albumId ? Date.now() : null

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: uf.blobUrl,
          thumbUrl: uf.thumbUrl,
          width: uf.width,
          height: uf.height,
          takenAt,
          takenYear,
          caption: meta.caption || null,
          albumId,
          albumPosition,
          peopleIds,
          originalName: uf.file.name,
        }),
      })
      if (!res.ok) throw new Error("Failed to save photo")

      updateMeta(uf.file.name, { saved: true })
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.file.name === uf.file.name
            ? { ...f, status: "error", error: (err as Error).message }
            : f
        )
      )
    }
  }

  const unsavedCount = files.filter(
    (f) => f.status === "done" && !metas[f.file.name]?.saved
  ).length

  return (
    <div className="space-y-4">
      {/* Drop zone / tap target */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-2xl cursor-pointer transition-colors active:scale-[0.99]"
        style={{
          borderColor: isDragActive ? "#78716c" : "var(--border)",
          background: isDragActive ? "var(--sepia-light)" : "white",
          padding: files.length === 0 ? "2.5rem 1.5rem" : "1rem 1.5rem",
        }}
      >
        <input {...getInputProps()} />
        {files.length === 0 ? (
          <div className="text-center">
            <p className="text-4xl mb-3">📷</p>
            <p className="font-medium text-base">
              <span className="hidden md:inline">Drag photos here, or </span>
              <span className="underline underline-offset-2">tap to select photos</span>
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              JPEG, PNG, WebP, TIFF — multiple files supported
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm font-medium" style={{ color: "var(--muted)" }}>
            <span>📷</span>
            <span>Add more photos</span>
          </div>
        )}
      </div>

      {/* Upload queue */}
      {files.map((uf) => {
        const meta = metas[uf.file.name]
        if (!meta) return null
        const saved = meta.saved
        const otherUnsavedCount = files.filter(
          (f) => f.file.name !== uf.file.name && f.status === "done" && !metas[f.file.name]?.saved
        ).length

        return (
          <div
            key={uf.file.name}
            className="rounded-2xl border overflow-hidden"
            style={{
              borderColor: saved ? "#86efac" : "var(--border)",
              background: saved ? "#f0fdf4" : "white",
            }}
          >
            {/* Photo preview header */}
            <div className="relative">
              <img
                src={uf.previewUrl}
                alt=""
                className="w-full object-cover"
                style={{ maxHeight: "220px", objectPosition: "center top" }}
              />

              {/* Status overlay */}
              {uf.status === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.45)" }}>
                  <div className="text-white text-center">
                    <div className="text-2xl mb-1 animate-spin">⟳</div>
                    <p className="text-sm font-medium">Uploading…</p>
                  </div>
                </div>
              )}
              {uf.status === "error" && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(220,38,38,0.75)" }}>
                  <p className="text-white text-sm font-medium px-4 text-center">{uf.error}</p>
                </div>
              )}
              {saved && (
                <div className="absolute inset-0 flex items-center justify-center"
                  style={{ background: "rgba(21,128,61,0.6)" }}>
                  <p className="text-white text-lg font-semibold">✓ Saved</p>
                </div>
              )}

              {/* File name chip */}
              <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end gap-2 pointer-events-none">
                <span
                  className="text-xs px-2 py-0.5 rounded-full truncate max-w-[70%]"
                  style={{ background: "rgba(0,0,0,0.55)", color: "white" }}
                >
                  {uf.file.name}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: "rgba(0,0,0,0.55)", color: "white" }}
                >
                  {(uf.file.size / 1024 / 1024).toFixed(1)} MB
                </span>
              </div>
            </div>

            {/* Form fields */}
            {uf.status === "done" && !saved && (
              <div className="p-4 space-y-3">
                {/* Date + Album — stack on mobile, side by side on sm+ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Date */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                        Date taken
                      </label>
                      <div className="flex rounded-lg border overflow-hidden text-xs" style={{ borderColor: "var(--border)" }}>
                        <button
                          type="button"
                          onClick={() => updateMeta(uf.file.name, { dateMode: "full" })}
                          className="px-2.5 py-1 transition-colors"
                          style={meta.dateMode === "full"
                            ? { background: "var(--foreground)", color: "var(--background)" }
                            : { color: "var(--muted)" }}
                        >
                          Full date
                        </button>
                        <button
                          type="button"
                          onClick={() => updateMeta(uf.file.name, { dateMode: "year" })}
                          className="px-2.5 py-1 transition-colors"
                          style={meta.dateMode === "year"
                            ? { background: "var(--foreground)", color: "var(--background)" }
                            : { color: "var(--muted)" }}
                        >
                          Year only
                        </button>
                      </div>
                    </div>
                    {meta.dateMode === "full" ? (
                      <input
                        type="date"
                        value={meta.takenAt}
                        onChange={(e) => updateMeta(uf.file.name, { takenAt: e.target.value })}
                        className="w-full px-3 py-3 text-sm rounded-xl border outline-none focus:border-stone-400"
                        style={{ borderColor: "var(--border)" }}
                      />
                    ) : (
                      <input
                        type="number"
                        value={meta.takenYear}
                        onChange={(e) => updateMeta(uf.file.name, { takenYear: e.target.value })}
                        placeholder="e.g. 1975"
                        min={1800}
                        max={new Date().getFullYear()}
                        className="w-full px-3 py-3 text-sm rounded-xl border outline-none focus:border-stone-400"
                        style={{ borderColor: "var(--border)" }}
                      />
                    )}
                  </div>

                  {/* Album */}
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted)" }}>
                      Album
                    </label>
                    <input
                      type="text"
                      value={meta.albumName}
                      onChange={(e) => updateMeta(uf.file.name, { albumName: e.target.value })}
                      placeholder={albums.length > 0 ? "Search or create…" : "e.g. 1970s Holidays"}
                      list={`albums-${uf.file.name}`}
                      className="w-full px-3 py-3 text-sm rounded-xl border outline-none focus:border-stone-400"
                      style={{ borderColor: "var(--border)" }}
                    />
                    <datalist id={`albums-${uf.file.name}`}>
                      {albums.map((a) => <option key={a.id} value={a.name} />)}
                    </datalist>
                    {meta.albumName.trim() && (
                      <p className="text-xs mt-1" style={{
                        color: albums.some(a => a.name.toLowerCase() === meta.albumName.trim().toLowerCase())
                          ? "#15803d"
                          : "var(--muted)"
                      }}>
                        {albums.some(a => a.name.toLowerCase() === meta.albumName.trim().toLowerCase())
                          ? "✓ Adds to existing album"
                          : "+ Creates new album"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Apply to all — only show if there are other unsaved cards with something to copy */}
                {otherUnsavedCount > 0 && (meta.albumName.trim() || meta.takenAt || meta.takenYear) && (
                  <button
                    type="button"
                    onClick={() => applyToAll(uf.file.name)}
                    className="w-full py-2.5 text-sm rounded-xl border transition-colors active:scale-[0.99]"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                  >
                    Apply album &amp; date to all {otherUnsavedCount} remaining photos
                  </button>
                )}

                {/* Caption */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted)" }}>
                    Caption
                  </label>
                  <textarea
                    value={meta.caption}
                    onChange={(e) => updateMeta(uf.file.name, { caption: e.target.value })}
                    placeholder="What's happening in this photo?"
                    rows={2}
                    className="w-full px-3 py-3 text-sm rounded-xl border outline-none resize-y focus:border-stone-400"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>

                {/* People */}
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5" style={{ color: "var(--muted)" }}>
                    People
                  </label>
                  <PeopleTagInput
                    peopleInput={meta.peopleInput}
                    onChange={(val) => updateMeta(uf.file.name, { peopleInput: val })}
                    onAdd={(name) => addPerson(uf.file.name, name)}
                    excludeNames={meta.peopleNames}
                    additionalSuggestions={sessionPeople}
                    variant="light"
                  />
                  {meta.peopleNames.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {meta.peopleNames.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                          style={{ background: "var(--sepia-light)", color: "var(--foreground)" }}
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => removePerson(uf.file.name, name)}
                            className="text-stone-400 hover:text-stone-600 leading-none text-base"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save button */}
                <button
                  type="button"
                  onClick={() => savePhoto(uf)}
                  className="w-full py-4 rounded-xl text-base font-semibold transition-colors active:scale-[0.99]"
                  style={{ background: "var(--foreground)", color: "var(--background)" }}
                >
                  Save to Album
                </button>
                <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
                  Save photos in the order you want them to appear
                </p>
              </div>
            )}
          </div>
        )
      })}

      {/* Summary bar when multiple are ready */}
      {unsavedCount > 1 && (
        <p className="text-sm text-center py-2" style={{ color: "var(--muted)" }}>
          {unsavedCount} photos ready to save — fill in details above and tap Save on each
        </p>
      )}
    </div>
  )
}
