"use client"

import { YearCount } from "@/types"

type Props = {
  years: YearCount[]
  currentYear?: number
}

export default function YearSidebar({ years, currentYear }: Props) {
  return (
    <nav className="hidden lg:flex flex-col gap-1 sticky top-24 h-fit">
      <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--muted)" }}>
        Jump to year
      </p>
      {years.map(({ takenYear, count }) => (
        <a
          key={takenYear}
          href={`#year-${takenYear}`}
          className="text-sm py-0.5 transition-colors hover:opacity-100"
          style={{
            color: currentYear === takenYear ? "var(--foreground)" : "var(--muted)",
            fontWeight: currentYear === takenYear ? 600 : 400,
          }}
        >
          {takenYear === 0 ? "Unknown" : takenYear}
          <span className="ml-1 text-xs opacity-60">({count})</span>
        </a>
      ))}
    </nav>
  )
}
