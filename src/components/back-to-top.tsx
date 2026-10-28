import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'

/* ============================================================
   LiNEA site — floating back-to-top control
   Industrial gauge style, appears after 700px of scroll.
   ============================================================ */

export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 14 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
          className="glass-panel fixed bottom-6 right-6 z-40 flex h-11 items-center gap-2 border-graphite-500/80 px-3.5 font-mono text-[10px] font-semibold tracking-[0.2em] text-fog-200 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] transition-colors hover:border-gold-600/70 hover:text-gold-300"
        >
          <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          TOP
          <span aria-hidden="true" className="h-1 w-1 rotate-45 bg-gold-500" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}
