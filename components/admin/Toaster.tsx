'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Tone = 'success' | 'error'
interface Toast {
  id: number
  message: string
  tone: Tone
}

const ToastContext = createContext<((message: string, tone?: Tone) => void) | null>(null)

/** Avisos breves abajo a la derecha ("Cambios guardados", errores). */
export function Toaster({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((message: string, tone: Tone = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((current) => [...current, { id, message, tone }])
    // Los errores se quedan más tiempo: suelen pedir hacer algo
    setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), tone === 'error' ? 7000 : 3500)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto rounded-md px-4 py-3 text-sm shadow-lg ${
              toast.tone === 'error' ? 'bg-red-600 text-white' : 'bg-neutral-900 text-white'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const show = useContext(ToastContext)
  if (!show) throw new Error('useToast debe usarse dentro de <Toaster>')
  return show
}

/** Muestra un aviso que llega por la URL (?nuevo=1, ?borrado=1) después de un redirect. */
export function UrlToast({ message }: { message: string | null }) {
  const show = useToast()
  useEffect(() => {
    if (!message) return
    show(message)
    // Se limpia el parámetro para que no reaparezca al recargar
    const url = new URL(window.location.href)
    url.search = ''
    window.history.replaceState(null, '', url)
  }, [message, show])
  return null
}
