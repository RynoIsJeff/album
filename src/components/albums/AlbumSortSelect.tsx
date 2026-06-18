"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"

const OPTIONS = [
  { value: "date", label: "Date taken" },
  { value: "upload", label: "Upload order" },
] as const

type SortValue = (typeof OPTIONS)[number]["value"]

export default function AlbumSortSelect({ current }: { current: SortValue }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = (value: SortValue) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "upload") {
      params.delete("sort") // upload is the default — keep URL clean
    } else {
      params.set("sort", value)
    }
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span style={{ color: "var(--muted)" }}>Sort:</span>
      <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleChange(opt.value)}
            className="px-3 py-1.5 text-sm transition-colors"
            style={
              current === opt.value
                ? { background: "var(--foreground)", color: "var(--background)" }
                : { background: "transparent", color: "var(--muted)" }
            }
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
