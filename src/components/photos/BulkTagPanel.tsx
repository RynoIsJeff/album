"use client"

import { useState } from "react"

type Props = {
  selectedCount: number
  onApply: (peopleNames: string[]) => Promise<void>
  onClear: () => void
  onExit: () => void
}

export default function BulkTagPanel({ selectedCount, onApply, onClear, onExit }: Props) {
  const [input, setInput] = useState("")
  const [names, setNames] = useState<string[]>([])
  const [applying, setApplying] = useState(false)
  const [lastResult, setLastResult] = useState("")

  const addName = () => {
    const name = input.trim()
    if (!name || names.includes(name)) return
    setNames((prev) => [...prev, name])
    setInput("")
    setLastResult("")
  }

  const removeName = (n: string) => setNames((prev) => prev.filter((x) => x !== n))

  const handleApply = async () => {
    if (!selectedCount || !names.length) return
    setApplying(true)
    setLastResult("")
    await onApply(names)
    setLastResult(
      `✓ Tagged ${selectedCount} photo${selectedCount !== 1 ? "s" : ""} with: ${names.join(", ")}`
    )
    setNames([])
    setApplying(false)
  }

  const canApply = selectedCount > 0 && names.length > 0 && !applying

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 border-t shadow-2xl"
      style={{ background: "var(--background)", borderColor: "var(--border)" }}
    >
      <div className="max-w-4xl mx-auto px-4 py-4 space-y-3">
        {/* Top row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="font-semibold">
              {selectedCount > 0
                ? `${selectedCount} photo${selectedCount !== 1 ? "s" : ""} selected`
                : "Click photos to select them"}
            </span>
            {selectedCount > 0 && (
              <button
                onClick={onClear}
                className="underline text-xs"
                style={{ color: "var(--muted)" }}
              >
                Clear
              </button>
            )}
          </div>
          <button
            onClick={onExit}
            className="text-sm px-3 py-1.5 rounded-lg border transition-colors hover:border-stone-400"
            style={{ borderColor: "var(--border)" }}
          >
            Exit tag mode
          </button>
        </div>

        {/* Success feedback */}
        {lastResult && (
          <p className="text-sm text-green-700 font-medium">{lastResult}</p>
        )}

        {/* People input row */}
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addName())}
            placeholder="Type a person's name and press Enter — you can add several"
            className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg border outline-none focus:border-stone-400"
            style={{ borderColor: "var(--border)" }}
          />
          <button
            onClick={addName}
            className="px-3 py-2 text-sm rounded-lg border transition-colors hover:border-stone-400"
            style={{ borderColor: "var(--border)" }}
          >
            Add
          </button>
          <button
            onClick={handleApply}
            disabled={!canApply}
            className="px-5 py-2 text-sm rounded-lg font-medium transition-opacity disabled:opacity-40"
            style={{ background: "var(--foreground)", color: "var(--background)" }}
          >
            {applying
              ? "Tagging…"
              : `Apply to ${selectedCount || "…"} photo${selectedCount !== 1 ? "s" : ""}`}
          </button>
        </div>

        {/* Name chips */}
        {names.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-xs self-center" style={{ color: "var(--muted)" }}>
              Will tag with:
            </span>
            {names.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm border"
                style={{ borderColor: "var(--border)", background: "white" }}
              >
                {name}
                <button
                  onClick={() => removeName(name)}
                  className="text-stone-400 hover:text-stone-700 leading-none"
                  aria-label={`Remove ${name}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
