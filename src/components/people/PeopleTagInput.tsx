"use client"

import { useState, useEffect, useRef } from "react"

type Person = { id: string; name: string }

type Props = {
  peopleInput: string
  onChange: (val: string) => void
  onAdd: (name: string) => void
  excludeNames: string[]
  /** Names added this upload session but not yet saved — shown as suggestions immediately */
  additionalSuggestions?: string[]
  /** Light styling (upload form) vs dark overlay styling (lightbox edit form) */
  variant?: "light" | "dark"
}

export default function PeopleTagInput({
  peopleInput,
  onChange,
  onAdd,
  excludeNames,
  additionalSuggestions = [],
  variant = "light",
}: Props) {
  const [allPeople, setAllPeople] = useState<Person[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Load the full people list once
  useEffect(() => {
    fetch("/api/people")
      .then((r) => r.ok ? r.json() : [])
      .then((data: Person[]) => setAllPeople(data))
      .catch(() => {})
  }, [])

  const trimmed = peopleInput.trim().toLowerCase()
  const excludeLower = excludeNames.map((n) => n.toLowerCase())

  // Merge session-level pending names with saved people, deduplicating
  const savedNames = new Set(allPeople.map((p) => p.name.toLowerCase()))
  const sessionOnly = additionalSuggestions
    .filter((n) => !savedNames.has(n.toLowerCase()) && !excludeLower.includes(n.toLowerCase()))
    .map((n) => ({ id: `session:${n}`, name: n }))

  const allSuggestions = [
    ...sessionOnly,
    ...allPeople.filter((p) => !excludeLower.includes(p.name.toLowerCase())),
  ]

  const suggestions = allSuggestions.filter(
    (p) => trimmed === "" || p.name.toLowerCase().includes(trimmed)
  )

  const handleAdd = (name: string) => {
    onAdd(name)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      // If there's an exact match in suggestions, prefer it; otherwise add as typed
      const exact = suggestions.find(
        (p) => p.name.toLowerCase() === trimmed
      )
      if (exact) {
        handleAdd(exact.name)
      } else if (trimmed) {
        handleAdd(peopleInput.trim())
      }
    }
    if (e.key === "Escape") setOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const inputClass =
    variant === "dark"
      ? "flex-1 px-3 py-2 text-sm rounded-lg bg-white/10 text-white placeholder-white/30 border border-white/20 outline-none focus:border-white/50"
      : "flex-1 px-3 py-2 text-sm rounded-lg border outline-none"

  const addBtnClass =
    variant === "dark"
      ? "px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors"
      : "px-3 py-2 text-sm rounded-lg border transition-colors hover:border-stone-400"

  return (
    <div ref={containerRef} className="relative">
      <div className="flex gap-2">
        <input
          type="text"
          value={peopleInput}
          onChange={(e) => { onChange(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type a name and press Enter"
          className={inputClass}
          style={variant === "light" ? { borderColor: "var(--border)" } : undefined}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => {
            if (peopleInput.trim()) handleAdd(peopleInput.trim())
          }}
          className={addBtnClass}
          style={variant === "light" ? { borderColor: "var(--border)" } : undefined}
        >
          Add
        </button>
      </div>

      {open && suggestions.length > 0 && (
        <ul
          className="absolute z-20 left-0 right-0 mt-1 rounded-lg border shadow-lg overflow-hidden"
          style={{
            background: variant === "dark" ? "rgba(28,25,23,0.97)" : "white",
            borderColor: variant === "dark" ? "rgba(255,255,255,0.15)" : "var(--border)",
            maxHeight: "180px",
            overflowY: "auto",
          }}
        >
          {suggestions.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  // Use mousedown so it fires before the input's blur closes the dropdown
                  e.preventDefault()
                  handleAdd(person.name)
                }}
                className="w-full text-left px-3 py-2 text-sm transition-colors"
                style={{
                  color: variant === "dark" ? "rgba(255,255,255,0.9)" : "var(--foreground)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background =
                    variant === "dark" ? "rgba(255,255,255,0.1)" : "var(--sepia-light)")
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {person.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
