'use client'

import { useEffect, useId, useRef, type ReactNode } from 'react'
import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion'
import { DURATION, EXIT, SPRING } from '@/components/ui/motion'

interface SheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** Heading rendered at the top; also names the dialog for screen readers. */
  title?: string
}

const DISMISS_OFFSET_PX = 120
const DISMISS_VELOCITY = 500

/** Modal bottom sheet: drag-down, backdrop tap or Escape closes it; focus returns to the trigger. */
export default function Sheet({ open, onClose, children, title }: SheetProps) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const dragControls = useDragControls()
  // Callers usually pass an inline onClose; a ref keeps the focus/scroll-lock effect from re-running every render
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panelRef.current?.focus()

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus()
    }
  }, [open])

  function handleDragEnd(_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    if (info.offset.y > DISMISS_OFFSET_PX || info.velocity.y > DISMISS_VELOCITY) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <motion.div
            className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: EXIT }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? titleId : undefined}
            tabIndex={-1}
            initial={{ y: '100%' }}
            animate={{ y: 0, transition: SPRING.sheet }}
            exit={{ y: '100%', transition: { ...EXIT, duration: DURATION.small } }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
            className="relative mx-auto max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-b-0 border-[var(--border)] bg-[var(--bg-elevated)] p-5 pb-[max(2rem,env(safe-area-inset-bottom))] focus-visible:outline-none"
          >
            {/* Drag starts only from the handle so scrollable content keeps working */}
            <div
              aria-hidden
              onPointerDown={event => dragControls.start(event)}
              className="-mx-5 -mt-5 mb-2 flex h-9 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
            >
              <div className="h-1 w-10 rounded-full bg-[var(--border)]" />
            </div>
            {title && (
              <h2 id={titleId} className="mb-4 text-sm font-semibold text-[var(--text-primary)]">
                {title}
              </h2>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
