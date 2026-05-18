import Link from "next/link"

type Props = {
  id: string
  name: string
  count?: number
}

export default function PersonBadge({ id, name, count }: Props) {
  return (
    <Link
      href={`/people/${id}`}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors hover:border-stone-400"
      style={{
        borderColor: "var(--border)",
        color: "var(--foreground)",
        background: "white",
      }}
    >
      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
        style={{ background: "var(--sepia-light)", color: "var(--muted)" }}>
        {name[0].toUpperCase()}
      </span>
      {name}
      {count !== undefined && (
        <span className="text-xs" style={{ color: "var(--muted)" }}>({count})</span>
      )}
    </Link>
  )
}
