import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Keyboard } from 'lucide-react'
import { OPEN_DECK_EVENT, CLOSE_DECK_EVENT } from '@/components/control-deck'
import { CornerFrame, TechLabel } from '@/components/primitives'
import { focusRelease } from '@/components/sections/timeline'

/* ============================================================
   SHORTCUTS OVERLAY — press “?” anywhere
   Documents every keyboard interaction on the site, and owns
   two global single-key hotkeys:  t → back to top.
   ============================================================ */

export const OPEN_SHORTCUTS_EVENT = 'linea:open-shortcuts'

interface ShortcutRow {
  keys: string[]
  action: string
  scope: string
}

const SHORTCUTS: ShortcutRow[] = [
  { keys: ['⌘', 'K'], action: 'Open the control deck command palette', scope: 'GLOBAL' },
  { keys: ['CTRL', 'K'], action: 'Control deck on Windows / Linux', scope: 'GLOBAL' },
  { keys: ['?'], action: 'Show this shortcut sheet', scope: 'GLOBAL' },
  { keys: ['T'], action: 'Return to top of page', scope: 'GLOBAL' },
  { keys: ['ESC'], action: 'Close any open overlay, modal or viewer', scope: 'GLOBAL' },
  { keys: ['↑', '↓'], action: 'Move through deck results', scope: 'CONTROL DECK' },
  { keys: ['↵'], action: 'Execute the highlighted command', scope: 'CONTROL DECK' },
  { keys: ['HOME', 'END'], action: 'Jump to first / last deck result', scope: 'CONTROL DECK' },
  { keys: ['←', '→'], action: 'Previous / next screenshot', scope: 'SCREENSHOT VIEWER' },
  { keys: ['ESC'], action: 'Close the screenshot viewer', scope: 'SCREENSHOT VIEWER' },
  { keys: ['ESC'], action: 'Clear archive filter, then close modal', scope: 'ARCHIVE' },
  { keys: ['0', '…', '9'], action: 'Type digits in the T9 playground (focus it first)', scope: 'T9 PLAYGROUND' },
  { keys: ['⌫'], action: 'Delete the last T9 digit', scope: 'T9 PLAYGROUND' },
  { keys: ['↵'], action: 'Place — or end — the simulated call', scope: 'T9 PLAYGROUND' },
  { keys: ['ESC'], action: 'End an active simulated call', scope: 'T9 PLAYGROUND' },
  { keys: ['#'], action: 'Open a #release-vX.Y.Z link to focus a version', scope: 'DEEP LINKS' },
  { keys: ['?t9='], action: 'Auto-type a sequence on load, e.g. ?t9=792 (SHARE copies the link)', scope: 'DEEP LINKS' },
]

/** Typing targets that must swallow single-key hotkeys. */
function typingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return (
    tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable
  )
}

export default function ShortcutsOverlay() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    /** any modal dialog currently mounted (deck, compare, lightbox, this sheet) */
    const someDialogOpen = () =>
      Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'))
    const onKey = (e: KeyboardEvent) => {
      // “?” is Shift+/ on most layouts — also match key name for exotic layouts
      if (e.key === '?' && !typingTarget(e.target)) {
        e.preventDefault()
        setOpen((o) => {
          if (o) return false // our sheet is the open dialog — close it
          return someDialogOpen() ? false : true // yield to any other dialog
        })
        return
      }
      // t → top (single key, no modifiers, never while typing or in a dialog)
      if (
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        (e.key === 't' || e.key === 'T') &&
        !typingTarget(e.target) &&
        !someDialogOpen()
      ) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    const onOpen = () => {
      // never stack over the deck — close it first
      window.dispatchEvent(new Event(CLOSE_DECK_EVENT))
      setOpen(true)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_SHORTCUTS_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_SHORTCUTS_EVENT, onOpen)
    }
  }, [])

  // the deck takes the keyboard whenever it opens — yield
  useEffect(() => {
    const close = () => setOpen(false)
    window.addEventListener(OPEN_DECK_EVENT, close)
    return () => window.removeEventListener(OPEN_DECK_EVENT, close)
  }, [])

  // scroll lock while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // demonstrate the deep-link capability from the sheet itself
  const demoDeepLink = () => {
    setOpen(false)
    window.setTimeout(() => focusRelease('v2.0.0'), 120)
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[78]" role="presentation">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 bg-graphite-950/85 backdrop-blur-[6px]"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 top-[9vh] mx-auto flex justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.21, 0.6, 0.35, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Keyboard shortcuts"
              className="relative w-full max-w-[520px] border border-graphite-500 bg-graphite-900/95 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            >
              <CornerFrame className="opacity-60" />
              <div aria-hidden="true" className="scanlines pointer-events-none absolute inset-0 opacity-[0.3]" />

              <div className="relative flex items-center justify-between border-b border-graphite-700/70 px-4 py-2.5">
                <TechLabel className="text-gold-500">
                  <span className="flex items-center gap-2">
                    <Keyboard className="h-3.5 w-3.5" aria-hidden="true" />
                    KEYBOARD MATRIX // LI-2
                  </span>
                </TechLabel>
                <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] text-fog-500">
                  <kbd className="keycap">ESC</kbd> CLOSE
                </span>
              </div>

              <div className="relative max-h-[56vh] overflow-y-auto py-2">
                {SHORTCUTS.map((s, i) => {
                  const showScope = i === 0 || SHORTCUTS[i - 1].scope !== s.scope
                  return (
                    <div key={`${s.scope}-${s.action}-${i}`}>
                      {showScope ? (
                        <p className="sticky top-0 z-10 border-y border-graphite-800/80 bg-graphite-900/95 px-4 py-1.5 font-mono text-[9px] font-bold tracking-[0.22em] text-gold-600">
                          {s.scope}
                        </p>
                      ) : null}
                      <div className="flex items-center gap-3 px-4 py-2">
                        <span className="flex shrink-0 items-center gap-1" aria-hidden="true">
                          {s.keys.map((k) => (
                            <kbd key={k} className="keycap">
                              {k}
                            </kbd>
                          ))}
                        </span>
                        <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-fog-300">{s.action}</span>
                      </div>
                    </div>
                  )
                })}
                <div className="border-t border-graphite-800/80 px-4 pb-1 pt-3">
                  <button
                    type="button"
                    onClick={demoDeepLink}
                    className="flex h-9 items-center gap-2 border border-graphite-600 px-3 font-mono text-[9.5px] font-semibold tracking-[0.14em] text-fog-300 transition-colors hover:border-gold-600/70 hover:text-gold-300"
                  >
                    <span aria-hidden="true" className="h-1 w-1 rotate-45 bg-gold-500" />
                    DEMO: FOCUS v2.0.0 ENTRY VIA DEEP LINK
                  </button>
                </div>
              </div>

              <p className="relative border-t border-graphite-700/70 px-4 py-2.5 font-mono text-[9px] tracking-[0.12em] text-fog-600">
                SINGLE-KEY HOTKEYS PAUSE WHILE TYPING IN ANY INPUT
              </p>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
