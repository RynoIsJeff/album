import Header from "@/components/layout/Header"
import PhotoUploadForm from "@/components/photos/PhotoUploadForm"

export default function UploadPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <Header />
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-8">
        <h1 className="font-serif text-3xl font-bold mb-1">Upload Photos</h1>
        <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>
          Drag and drop scanned photos or click to browse. You can upload multiple at once.
        </p>
        <PhotoUploadForm />
      </div>
    </div>
  )
}
