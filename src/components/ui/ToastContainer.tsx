"use client"

import { useContext } from "react"
import { ToastContext } from "@/context/ToastContext"

export default function ToastContainer() {
  const ctx = useContext(ToastContext)
  if (!ctx || ctx.toasts.length === 0) return null

  return (
    <div
      className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      {ctx.toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className="pointer-events-auto toast-enter flex items-center gap-2 pl-4 pr-2 py-3 rounded-lg shadow-lg text-sm font-medium text-white"
          style={{
            background: toast.type === "success" ? "#15803d" : "#dc2626",
            maxWidth: "320px",
          }}
        >
          <span aria-hidden="true">{toast.type === "success" ? "✓" : "✕"}</span>
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => ctx.removeToast(toast.id)}
            className="ml-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
