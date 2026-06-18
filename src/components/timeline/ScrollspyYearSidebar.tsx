"use client"

import { useState, useEffect } from "react"
import YearSidebar from "./YearSidebar"
import { YearCount } from "@/types"

type Props = {
  years: YearCount[]
}

export default function ScrollspyYearSidebar({ years }: Props) {
  const [activeYear, setActiveYear] = useState<number | undefined>(years[0]?.takenYear)

  useEffect(() => {
    if (years.length === 0) return

    const observedIds = new Set<string>()
    let io: IntersectionObserver | null = null

    function attachNewSections() {
      for (const { takenYear } of years) {
        const id = `year-${takenYear}`
        if (observedIds.has(id)) continue
        const el = document.getElementById(id)
        if (el) {
          observedIds.add(id)
          io?.observe(el)
        }
      }
    }

    io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length === 0) return
        const topmost = visible.sort(
          (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
        )[0]
        setActiveYear(parseInt(topmost.target.id.replace("year-", ""), 10))
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    )

    // Initial attach after first render
    const tid = setTimeout(attachNewSections, 0)

    // Re-attach whenever infinite scroll adds new year sections to the DOM
    const mo = new MutationObserver(attachNewSections)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(tid)
      io?.disconnect()
      mo.disconnect()
    }
  }, [years])

  return <YearSidebar years={years} currentYear={activeYear} />
}
