export default function TimelineLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 flex gap-8">
      <aside className="w-28 shrink-0 hidden lg:block">
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-4 rounded animate-pulse" style={{ background: "var(--border)", width: `${40 + Math.random() * 30}%` }} />
          ))}
        </div>
      </aside>
      <main className="flex-1">
        <div className="h-8 w-24 rounded animate-pulse mb-6" style={{ background: "var(--border)" }} />
        <div className="masonry-grid">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="masonry-item rounded-lg animate-pulse"
              style={{
                background: "var(--border)",
                height: `${150 + (i % 4) * 60}px`,
              }}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
