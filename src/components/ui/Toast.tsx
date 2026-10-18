'use client'

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from '@/components/ui/Icon'
import { ENTER, EXIT } from '@/components/ui/motion'

export type ToastTone = 'success' | 'error' | 'info'

interface ToastMessage {
  id: number
  tone: ToastTone
  message: string
}

type ShowToast = (message: string, tone?: ToastTone) => void

const TOAST_LIFETIME_MS = 4000
const MAX_VISIBLE_TOASTS = 3

const ToastContext = createContext<ShowToast | null>(null)

const TONE_ICON: Record<ToastTone, ReactNode> = {
  success: <CheckIcon size={18} className="text-[var(--accent-emerald)]" />,
  error: <AlertIcon size={18} className="text-[var(--destructive)]" />,
  info: <InfoIcon size={18} className="text-[var(--accent-blue)]" />,
}

/** Hosts the toast stack; mount once near the root. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts(current => current.filter(toast => toast.id !== id))
  }, [])

  const show = useCallback<ShowToast>((message, tone = 'info') => {
    const id = nextId.current++
    setToasts(current => [...current, { id, tone, message }].slice(-MAX_VISIBLE_TOASTS))
    setTimeout(() => dismiss(id), TOAST_LIFETIME_MS)
  }, [dismiss])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] flex flex-col items-center gap-2 px-4 pt-[max(12px,env(safe-area-inset-top))]"
      >
        <AnimatePresence initial={false}>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              layout
              role={toast.tone === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: ENTER }}
              exit={{ opacity: 0, scale: 0.97, transition: EXIT }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pl-4 pr-1 text-sm text-[var(--text-primary)] shadow-[0_12px_32px_rgba(0,0,0,0.45)]"
            >
              {TONE_ICON[toast.tone]}
              <p className="flex-1">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                <CloseIcon size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

/**
 * Returns `showToast(message, tone?)`.
 * @throws if used outside `<ToastProvider>`.
 */
export function useToast(): ShowToast {
  const showToast = useContext(ToastContext)
  if (!showToast) throw new Error('useToast must be used inside <ToastProvider>')
  return showToast
}
