import { auth } from "@/lib/auth"
import Header from "@/components/layout/Header"
import MobileNav from "@/components/layout/MobileNav"
import PhotoUploadForm from "@/components/photos/PhotoUploadForm"

export default async function UploadPage() {
  const session = await auth()
  const isAdmin = session?.user?.isAdmin ?? false

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: "var(--background)" }}>
      <Header />
      <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <h1 className="font-serif text-2xl md:text-3xl font-bold mb-1">Upload Photos</h1>
        <p className="text-sm mb-6 md:mb-8" style={{ color: "var(--muted)" }}>
          Select photos from your library. You can upload multiple at once.
        </p>
        <PhotoUploadForm />
      </div>
      <MobileNav isAdmin={isAdmin} />
    </div>
  )
}
