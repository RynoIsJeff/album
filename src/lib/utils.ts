import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatYear(date: string | null): string {
  if (!date) return "Unknown"
  return new Date(date).getFullYear().toString()
}

export function formatDate(date: string | null): string {
  if (!date) return "Unknown date"
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function groupByYear<T extends { takenYear: number | null; takenAt: string | null }>(
  items: T[]
): Map<number, T[]> {
  const groups = new Map<number, T[]>()
  for (const item of items) {
    const year = item.takenYear ?? (item.takenAt ? new Date(item.takenAt).getFullYear() : 0)
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year)!.push(item)
  }
  return groups
}
