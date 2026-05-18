"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { upload } from "@vercel/blob/client"

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
  takenAt: string
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

  const fetchAlbums = useCallback(async () => {
    const res = await fetch("/api/albums")
    if (res.ok) setAlbums(await res.json())
  }, [])

  // Load albums immediately so the dropdown is ready before any file is dropped
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
          takenAt: "",
          albumName: "",
          peopleInput: "",
          peopleNames: [],
          saved: false,
        }
      })
      setMetas((prev) => ({ ...prev, ...initMeta }))

      // Upload each file
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

  const addPerson = (fileName: string) => {
    const meta = metas[fileName]
    const name = meta.peopleInput.trim()
    if (!name || meta.peopleNames.includes(name)) return
    updateMeta(fileName, { peopleNames: [...meta.peopleNames, name], peopleInput: "" })
  }

  const removePerson = (fileName: string, name: string) => {
    updateMeta(fileName, {
      peopleNames: metas[fileName].peopleNames.filter((n) => n !== name),
    })
  }

  const savePhoto = async (uf: UploadedFile) => {
    if (uf.status !== "done") return
    const meta = metas[uf.file.name]

    try {
      // Find or create people
      const peopleIds: string[] = []
      for (const name of meta.peopleNames) {
        const res = await fetch("/api/people", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        })
        if (!res.ok) throw new Error(`Failed to resolve person: ${name}`)
        const person = await res.json()
        peopleIds.push(person.id)
      }

      // Find existing album (case-insensitive) or create a new one
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
          // Add to local list so the next photo in this session can find it
          setAlbums((prev) => [...prev, { id: album.id, name: album.name }])
        }
      }

      const res = await fetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blobUrl: uf.blobUrl,
          thumbUrl: uf.thumbUrl,
          width: uf.width,
          height: uf.height,
          takenAt: meta.takenAt || null,
          takenYear: meta.takenAt ? new Date(meta.takenAt).getFullYear() : null,
          caption: meta.caption || null,
          albumId,
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

  const doneFiles = files.filter((f) => f.status === "done")
  const pendingFiles = files.filter((f) => f.status !== "done" || !metas[f.file.name]?.saved)

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors"
        style={{
          borderColor: isDragActive ? "#78716c" : "var(--border)",
          background: isDragActive ? "var(--sepia-light)" : "white",
        }}
      >
        <input {...getInputProps()} />
        <p className="text-3xl mb-3">📷</p>
        <p className="font-medium">Drag photos here, or click to browse</p>
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          JPEG, PNG, WebP, TIFF — multiple files supported
        </p>
      </div>

      {/* Upload queue */}
      {files.map((uf) => {
        const meta = metas[uf.file.name]
        if (!meta) return null
        const saved = meta.saved

        return (
          <div
            key={uf.file.name}
            className="rounded-xl border p-4 space-y-4"
            style={{ borderColor: saved ? "#d1fae5" : "var(--border)", background: saved ? "#f0fdf4" : "white" }}
          >
            <div className="flex items-start gap-4">
              {/* Thumbnail preview */}
              <img
                src={uf.previewUrl}
                alt=""
                className="w-20 h-20 object-cover rounded-lg shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{uf.file.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {(uf.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
                {uf.status === "uploading" && (
                  <p className="text-xs mt-1 text-amber-600">Uploading…</p>
                )}
                {uf.status === "error" && (
                  <p className="text-xs mt-1 text-red-600">{uf.error}</p>
                )}
                {saved && (
                  <p className="text-xs mt-1 text-green-700 font-medium">✓ Saved to album</p>
                )}
              </div>
            </div>

            {uf.status === "done" && !saved && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium block mb-1">Date taken</label>
                    <input
                      type="date"
                      value={meta.takenAt}
                      onChange={(e) => updateMeta(uf.file.name, { takenAt: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                      style={{ borderColor: "var(--border)" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1">
                      Album
                      {albums.length > 0 && (
                        <span className="font-normal ml-1" style={{ color: "var(--muted)" }}>
                          — pick existing or type new
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={meta.albumName}
                      onChange={(e) => updateMeta(uf.file.name, { albumName: e.target.value })}
                      placeholder={albums.length > 0 ? "Search albums…" : "e.g. 1970s Holidays"}
                      list={`albums-${uf.file.name}`}
                      className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                      style={{ borderColor: "var(--border)" }}
                    />
                    <datalist id={`albums-${uf.file.name}`}>
                      {albums.map((a) => <option key={a.id} value={a.name} />)}
                    </datalist>
                    {/* Show matched existing album as a hint */}
                    {meta.albumName.trim() && albums.some(
                      (a) => a.name.toLowerCase() === meta.albumName.trim().toLowerCase()
                    ) && (
                      <p className="text-xs mt-1 text-green-700">✓ Will add to existing album</p>
                    )}
                    {meta.albumName.trim() && !albums.some(
                      (a) => a.name.toLowerCase() === meta.albumName.trim().toLowerCase()
                    ) && (
                      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>+ Will create new album</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Caption</label>
                  <input
                    type="text"
                    value={meta.caption}
                    onChange={(e) => updateMeta(uf.file.name, { caption: e.target.value })}
                    placeholder="What's happening in this photo?"
                    className="w-full px-3 py-2 text-sm rounded-lg border outline-none"
                    style={{ borderColor: "var(--border)" }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">People</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={meta.peopleInput}
                      onChange={(e) => updateMeta(uf.file.name, { peopleInput: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPerson(uf.file.name))}
                      placeholder="Type a name and press Enter"
                      className="flex-1 px-3 py-2 text-sm rounded-lg border outline-none"
                      style={{ borderColor: "var(--border)" }}
                    />
                    <button
                      type="button"
                      onClick={() => addPerson(uf.file.name)}
                      className="px-3 py-2 text-sm rounded-lg border transition-colors hover:border-stone-400"
                      style={{ borderColor: "var(--border)" }}
                    >
                      Add
                    </button>
                  </div>
                  {meta.peopleNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {meta.peopleNames.map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                          style={{ background: "var(--sepia-light)", color: "var(--foreground)" }}
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => removePerson(uf.file.name, name)}
                            className="text-stone-400 hover:text-stone-600 leading-none"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => savePhoto(uf)}
                  className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors"
                  style={{ background: "var(--foreground)", color: "var(--background)" }}
                >
                  Save to Album
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
