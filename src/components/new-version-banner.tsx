import { AnimatePresence, motion } from 'framer-motion'
import { ArrowDown, Sparkles, X } from 'lucide-react'
import { useReleases } from '@/hooks/use-releases'

/* ============================================================
   LiNEA site — new-version detection banner
   Auto-refresh noticed a stable tag newer than anything seen
   this session → surface it without losing the user's place.
   ============================================================ */

export default function NewVersionBanner() {
  const { newVersionTag, dismissNewVersion } = useReleases()

  const view = () => {
    document.getElementById('downloads')?.scrollIntoView({ behavior: 'smooth' })
    window.history.pushState(null, '', '#downloads')
    dismissNewVersion()
  }

  return (
    <AnimatePresence>
      {newVersionTag ? (
        <motion.aside
          key={newVersionTag}
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ duration: 0.3, ease: [0.21, 0.6, 0.35, 1] }}
          className="fixed bottom-24 left-4 z-40 w-[calc(100vw-2rem)] max-w-sm border border-gold-600/70 bg-graphite-900/95 p-4 shadow-[0_18px_60px_-18px_rgba(0,0,0,0.9)] backdrop-blur-md sm:bottom-6 sm:left-6"
        >
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 hazard-stripe opacity-40" />
          <div className="flex items-start gap-3">
            <span className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-gold-600/60 bg-gold-500/10">
              <Sparkles className="h-4 w-4 text-gold-400" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse-dot rounded-full bg-gold-400" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[10px] font-bold tracking-[0.22em] text-gold-300">
                NEW RELEASE DETECTED
              </p>
              <p className="mt-1.5 text-[13px] leading-snug text-fog-300">
                Live sync picked up{' '}
                <span className="font-mono font-semibold text-fog-100 tnum">{newVersionTag}</span> —
                direct APK and notes are ready in the distribution bay.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={view}
                  className="flex h-10 items-center gap-2 bg-gold-500 px-3.5 font-mono text-[10px] font-bold tracking-[0.14em] text-graphite-950 transition-colors hover:bg-gold-400"
                >
                  <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  VIEW RELEASE
                </button>
                <button
                  type="button"
                  onClick={dismissNewVersion}
                  className="font-mono text-[10px] tracking-[0.14em] text-fog-500 underline-offset-4 transition-colors hover:text-fog-300 hover:underline"
                >
                  DISMISS
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={dismissNewVersion}
              aria-label="Dismiss new release notice"
              className="flex h-8 w-8 shrink-0 items-center justify-center border border-graphite-600 text-fog-500 transition-colors hover:border-fog-500 hover:text-fog-200"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  )
}
