import "dotenv/config"
import { readdir, readFile } from "fs/promises"
import { join, extname, basename } from "path"
import { put } from "@vercel/blob"
import sharp from "sharp"
import pLimit from "p-limit"

// @ts-ignore — exifr has no types in some configs
import ExifReader from "exifr"

const SUPPORTED = new Set([".jpg", ".jpeg", ".png", ".webp", ".tiff", ".tif"])
const CONCURRENCY = 3

interface ImportOptions {
  folder: string
  album?: string
  year?: number
  server: string
  dryRun?: boolean
}

function parseArgs(): ImportOptions {
  const args = process.argv.slice(2)
  const get = (flag: string) => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : undefined
  }
  const folder = get("--folder")
  const server = get("--server")
  if (!folder || !server) {
    console.error("Usage: npx tsx scripts/bulk-import.ts --folder /path --server https://your-site.vercel.app [--album \"Album Name\"] [--year 1985] [--dry-run]")
    process.exit(1)
  }
  return {
    folder,
    server,
    album: get("--album"),
    year: get("--year") ? parseInt(get("--year")!) : undefined,
    dryRun: args.includes("--dry-run"),
  }
}

function parseExifDate(raw: string): Date | undefined {
  // EXIF format: "2024:01:15 14:30:00"
  const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})/)
  if (!m) return undefined
  return new Date(`${m[1]}-${m[2]}-${m[3]}`)
}

async function importOne(
  filePath: string,
  opts: ImportOptions,
  index: number,
  total: number
): Promise<{ ok: boolean; skipped?: boolean }> {
  const name = basename(filePath)
  console.log(`[${index}/${total}] ${opts.dryRun ? "[DRY RUN] " : ""}Processing ${name}`)

  if (opts.dryRun) return { ok: true }

  const buffer = await readFile(filePath)

  // Extract EXIF date
  let takenAt: Date | undefined
  try {
    const tags = await ExifReader.parse(buffer, { pick: ["DateTimeOriginal"] })
    if (tags?.DateTimeOriginal) {
      takenAt = parseExifDate(String(tags.DateTimeOriginal))
    }
  } catch {
    // No EXIF — expected for old scans
  }

  const takenYear = takenAt?.getFullYear() ?? opts.year

  // Get original dimensions
  const meta = await sharp(buffer).metadata()
  const { width, height } = meta

  // Resize original to max 2400px wide
  const resizedBuffer = await sharp(buffer)
    .resize({ width: 2400, withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()

  // Generate 400px thumbnail
  const thumbBuffer = await sharp(buffer)
    .resize({ width: 400, withoutEnlargement: true })
    .jpeg({ quality: 75 })
    .toBuffer()

  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN not set in .env.local")

  const ext = extname(filePath).slice(1).toLowerCase()
  const uniqueName = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
  const thumbName = `thumbs/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`

  const [blobResult, thumbResult] = await Promise.all([
    put(uniqueName, resizedBuffer, { access: "public", token }),
    put(thumbName, thumbBuffer, { access: "public", token }),
  ])

  const res = await fetch(`${opts.server}/api/cli-import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CLI_IMPORT_SECRET}`,
    },
    body: JSON.stringify({
      blobUrl: blobResult.url,
      thumbUrl: thumbResult.url,
      width,
      height,
      takenAt: takenAt?.toISOString(),
      takenYear,
      albumName: opts.album,
      originalName: name,
      source: "cli",
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  if (data.skipped) {
    console.log(`  → skipped (already imported)`)
    return { ok: true, skipped: true }
  }

  return { ok: true }
}

async function run() {
  const opts = parseArgs()

  const entries = await readdir(opts.folder)
  const files = entries
    .filter((f) => SUPPORTED.has(extname(f).toLowerCase()))
    .map((f) => join(opts.folder, f))

  if (files.length === 0) {
    console.log("No supported image files found in the folder.")
    return
  }

  console.log(`Found ${files.length} images in ${opts.folder}`)
  if (opts.album) console.log(`Album: ${opts.album}`)
  if (opts.year) console.log(`Year fallback: ${opts.year}`)
  if (opts.dryRun) console.log("DRY RUN — no files will be uploaded")
  console.log("")

  const limit = pLimit(CONCURRENCY)
  let succeeded = 0
  let skipped = 0
  let failed = 0

  await Promise.all(
    files.map((filePath, i) =>
      limit(async () => {
        try {
          const result = await importOne(filePath, opts, i + 1, files.length)
          if (result.skipped) skipped++
          else succeeded++
        } catch (err) {
          failed++
          console.error(`  ✗ Failed: ${(err as Error).message}`)
        }
      })
    )
  )

  console.log("")
  console.log(`Done!`)
  console.log(`  ✓ Imported: ${succeeded}`)
  if (skipped > 0) console.log(`  → Skipped (duplicates): ${skipped}`)
  if (failed > 0) console.log(`  ✗ Failed: ${failed}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
