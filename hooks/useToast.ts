import { useState, useCallback } from 'react'

export type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 2500) => {
      const id = Math.random().toString(36).substr(2, 9)
      setToasts((prev) => [...prev, { id, message, type }])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, duration)

      return id
    },
    []
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, addToast, removeToast }
}

interface ToastContainerProps {
  toasts: Toast[]
  removeToast: (id: string) => void
}

export function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            border rounded-sm p-4 flex items-start gap-3 animate-in slide-in-from-bottom duration-300
            ${
              toast.type === 'success'
                ? 'bg-surface border-gold/30 text-soft'
                : toast.type === 'error'
                  ? 'bg-surface border-red-500/30 text-red-400'
                  : 'bg-surface border-gold/20 text-muted'
            }
          `}
        >
          <span className={toast.type === 'success' ? 'text-gold' : toast.type === 'error' ? 'text-red-400' : 'text-gold'}>
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span className="text-sm flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-muted hover:text-text transition-colors text-sm"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
