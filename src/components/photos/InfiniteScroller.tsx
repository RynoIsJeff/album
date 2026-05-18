"use client"

import { useEffect, useRef } from "react"

type Props = {
  onLoadMore: () => void
  hasMore: boolean
  isLoading: boolean
  children: React.ReactNode
}

export default function InfiniteScroller({ onLoadMore, hasMore, isLoading, children }: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          onLoadMore()
        }
      },
      { rootMargin: "400px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore])

  return (
    <>
      {children}
      <div ref={sentinelRef} className="h-4" />
      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-stone-300 border-t-stone-600 rounded-full animate-spin" />
        </div>
      )}
    </>
  )
}
