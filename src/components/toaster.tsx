import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Hash, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ============================================================
   TOAST BUS — industrial feedback strip
   Deck commands that copy to the clipboard have no inline UI
   to confirm the action; this bottom-anchored stack gives
   them (and any future caller) quiet, dismissible feedback.

   Usage:  toast('SHA-256 COPIED', { tone: 'sage', detail: '344283be…' })
   ============================================================ */

export const TOAST_EVENT = 'linea:toast'

export type ToastTone = 'gold' | 'sage' | 'rust' | 'fog'

export interface ToastPayload {
  id: number
  message: string
  detail?: string
  tone: ToastTone
}

/** Fire a toast from anywhere (event-based — no context needed). */
export function toast(message: string, opts?: { tone?: ToastTone; detail?: string }) {
  window.dispatchEvent(
    new CustomEvent<ToastPayload>(TOAST_EVENT, {
      detail: { id: Date.now() + Math.random(), message, tone: opts?.tone ?? 'gold', detail: opts?.detail },
    }),
  )
}

const TONE_META: Record<ToastTone, { rail: string; text: string; icon: typeof Info }> = {
  gold: { rail: 'bg-gold-500', text: 'text-gold-300', icon: Info },
  sage: { rail: 'bg-sage-500', text: 'text-sage-300', icon: Check },
  rust: { rail: 'bg-rust-500', text: 'text-rust-400', icon: Info },
  fog: { rail: 'bg-fog-500', text: 'text-fog-300', icon: Hash },
}

const DISMISS_MS = 3000
const MAX_VISIBLE = 3

export default function Toaster() {
  const [items, setItems] = useState<ToastPayload[]>([])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    const onToast = (e: Event) => {
      const payload = (e as CustomEvent<ToastPayload>).detail
      setItems((prev) => [...prev, payload].slice(-MAX_VISIBLE))
      timers.push(
        setTimeout(() => {
          setItems((prev) => prev.filter((t) => t.id !== payload.id))
        }, DISMISS_MS),
      )
    }
    window.addEventListener(TOAST_EVENT, onToast)
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast)
      timers.forEach(clearTimeout)
    }
  }, [])

  return (
    <div
      aria-live="polite"
      aria-label="Action feedback"
      className="pointer-events-none fixed inset-x-0 bottom-20 z-[75] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-6 sm:items-end sm:px-0"
    >
      <AnimatePresence initial={false}>
        {items.map((t) => {
          const meta = TONE_META[t.tone]
          const Icon = meta.icon
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.21, 0.6, 0.35, 1] }}
              className="glass-panel pointer-events-auto relative flex max-w-full items-center gap-3 overflow-hidden py-2.5 pl-4 pr-3.5 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)]"
            >
              <span aria-hidden="true" className={cn('absolute inset-y-0 left-0 w-0.5', meta.rail)} />
              <Icon className={cn('h-3.5 w-3.5 shrink-0', meta.text)} aria-hidden="true" />
              <span className="min-w-0 font-mono text-[10.5px] font-semibold tracking-[0.14em] text-fog-200">
                {t.message.toUpperCase()}
                {t.detail ? (
                  <span className="ml-2 font-normal tracking-[0.08em] text-fog-500">{t.detail}</span>
                ) : null}
              </span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
