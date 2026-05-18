"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"

type ToastType = "success" | "error"

export type Toast = {
  id: string
  message: string
  type: ToastType
}

type ToastContextValue = {
  toasts: Toast[]
  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timerIds = useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  // Clean up all pending timers when the provider unmounts
  useEffect(() => {
    return () => {
      timerIds.current.forEach(clearTimeout)
      timerIds.current.clear()
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = crypto.randomUUID()
      setToasts((prev) => [...prev, { id, message, type }])
      const tid = setTimeout(() => {
        removeToast(id)
        timerIds.current.delete(tid)
      }, 3000)
      timerIds.current.add(tid)
    },
    [removeToast]
  )

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  // Return a no-op instead of throwing so components outside the provider don't crash
  if (!ctx) return () => {}
  return ctx.addToast
}
