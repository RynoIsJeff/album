import Link from "next/link"
import Image from "next/image"
import DeletePersonButton from "./DeletePersonButton"

type Props = {
  id: string
  name: string
  count: number
  coverUrl?: string | null
  isAdmin?: boolean
}

export default function PersonCard({ id, name, count, coverUrl, isAdmin }: Props) {
  return (
    <div className="group relative">
      <Link
        href={`/people/${id}`}
        className="block rounded-xl overflow-hidden border transition-shadow hover:shadow-md"
        style={{ borderColor: "var(--border)", background: "white" }}
      >
        <div className="aspect-square relative bg-stone-100">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span
                className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
                style={{ background: "var(--sepia-light)", color: "var(--muted)" }}
              >
                {name[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="font-medium text-sm truncate">{name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            {count} {count === 1 ? "photo" : "photos"}
          </p>
        </div>
      </Link>
      {isAdmin && (
        <DeletePersonButton
          personId={id}
          personName={name}
          photoCount={count}
          variant="icon"
        />
      )}
    </div>
  )
}
