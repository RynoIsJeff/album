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

    let observer: IntersectionObserver

    // Wait one tick so the DOM sections rendered by TimelineGroup are in place
    const tid = setTimeout(() => {
      const sections = years
        .map(({ takenYear }) => document.getElementById(`year-${takenYear}`))
        .filter((el): el is HTMLElement => el !== null)

      if (sections.length === 0) return

      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries.filter((e) => e.isIntersecting)
          if (visible.length === 0) return
          // Pick the topmost visible section
          const topmost = visible.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
          )[0]
          const year = parseInt(topmost.target.id.replace("year-", ""), 10)
          setActiveYear(year)
        },
        // Detect sections that enter the middle band of the viewport
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      )

      sections.forEach((el) => observer.observe(el))
    }, 0)

    return () => {
      clearTimeout(tid)
      observer?.disconnect()
    }
  }, [years])

  return <YearSidebar years={years} currentYear={activeYear} />
}
