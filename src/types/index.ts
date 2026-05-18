export type PersonSummary = {
  id: string
  name: string
}

export type AlbumSummary = {
  id: string
  name: string
}

export type PhotoSummary = {
  id: string
  blobUrl: string
  thumbUrl: string | null
  width: number | null
  height: number | null
  takenAt: string | null
  takenYear: number | null
  caption: string | null
  originalName: string | null
  source: string
  createdAt: string
  albumId: string | null
  album: AlbumSummary | null
  peopleTags: { person: PersonSummary }[]
}

export type PhotosResponse = {
  photos: PhotoSummary[]
  nextCursor: string | null
}

export type YearCount = {
  takenYear: number
  count: number
}
