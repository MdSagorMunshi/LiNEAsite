import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react'
import { CornerFrame, BlurImage, Reveal, SectionShell } from '@/components/primitives'
import { SCREENSHOTS } from '@/lib/constants'

/* ============================================================
   SYS.06 — Interface Showcase (8 Real App Screenshots + Lightbox)
   Liquid-glass frames with specular light reflections
   ============================================================ */

const TOTAL = SCREENSHOTS.length
const pad2 = (n: number) => String(n).padStart(2, '0')

function ScreenshotCard({
  index,
  onOpen,
}: {
  index: number
  onOpen: (index: number) => void
}) {
  const shot = SCREENSHOTS[index]
  return (
    <figure className="group relative">
      <button
        type="button"
        onClick={() => onOpen(index)}
        aria-label={`Enlarge screenshot: ${shot.title}`}
        className="relative block w-full cursor-zoom-in overflow-hidden rounded-xl border border-white/10 bg-graphite-900/80 transition-all duration-300 focus-visible:border-sapphire-400/60 hover:-translate-y-1 hover:border-sapphire-400/50 hover:shadow-[0_12px_35px_rgba(56,189,248,0.15)]"
      >
        <BlurImage
          src={shot.src}
          fallbackSrc={shot.fallbackSrc}
          mirrorSrc={shot.mirrorSrc}
          alt={`LiNEA screenshot — ${shot.title}: ${shot.caption}`}
          eager={index === 0}
          className="aspect-[9/19] w-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.04]"
        />
        {/* Specular hairline at top */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
        />

        {/* corner brackets on hover */}
        <CornerFrame
          inset="inset-2"
          size="h-3 w-3"
          color="border-sapphire-400/70"
          className="opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
        />
        {/* always-on mono index chip */}
        <span className="absolute left-2.5 top-2.5 rounded border border-white/10 bg-graphite-950/85 px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-[0.22em] text-fog-200 backdrop-blur-md">
          FIG.{pad2(index + 1)}
        </span>
        {/* expand hint on hover */}
        <span className="absolute right-2.5 top-2.5 hidden h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-graphite-950/85 text-fog-200 opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:flex backdrop-blur-md">
          <Expand className="h-3.5 w-3.5 text-sapphire-300" aria-hidden="true" />
        </span>
      </button>
      {/* caption */}
      <figcaption className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-graphite-950/95 via-graphite-950/75 to-transparent px-3 pb-3 pt-10 opacity-100 transition-opacity duration-300 group-focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100 backdrop-blur-[2px]">
        <span className="block font-display text-[13px] font-bold leading-tight text-white">
          {shot.title}
        </span>
        <span className="mt-1 block text-[11px] leading-snug text-fog-300">{shot.caption}</span>
      </figcaption>
    </figure>
  )
}

function Lightbox({
  active,
  onClose,
  onNavigate,
}: {
  active: number
  onClose: () => void
  onNavigate: (index: number) => void
}) {
  const shot = SCREENSHOTS[active]
  const prev = () => onNavigate((active - 1 + TOTAL) % TOTAL)
  const next = () => onNavigate((active + 1) % TOTAL)

  /* keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onNavigate((active - 1 + TOTAL) % TOTAL)
      else if (e.key === 'ArrowRight') onNavigate((active + 1) % TOTAL)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, onClose, onNavigate])

  /* body scroll lock */
  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      role="dialog"
      aria-modal="true"
      aria-label={`Screenshot viewer — ${shot.title}`}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-graphite-950/90 backdrop-blur-2xl"
    >
      {/* backdrop click target */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close screenshot viewer (Escape)"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-graphite-900/80 text-fog-200 transition-colors hover:border-sapphire-400 hover:text-white cursor-pointer backdrop-blur-md"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Nav buttons */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous screenshot (ArrowLeft)"
        className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl border border-white/15 bg-graphite-900/80 text-fog-200 transition-colors hover:border-sapphire-400 hover:text-white md:flex cursor-pointer backdrop-blur-md"
      >
        <ChevronLeft className="h-6 w-6" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next screenshot (ArrowRight)"
        className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl border border-white/15 bg-graphite-900/80 text-fog-200 transition-colors hover:border-sapphire-400 hover:text-white md:flex cursor-pointer backdrop-blur-md"
      >
        <ChevronRight className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* centered image + caption */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.figure
          key={active}
          initial={{ opacity: 0, scale: 0.965 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.985 }}
          transition={{ duration: 0.22, ease: [0.21, 0.6, 0.35, 1] }}
          className="relative flex max-h-full flex-col items-center gap-3 px-4 z-10"
        >
          <BlurImage
            src={shot.src}
            fallbackSrc={shot.fallbackSrc}
            mirrorSrc={shot.mirrorSrc}
            alt={`LiNEA screenshot — ${shot.title}: ${shot.caption}`}
            eager
            className="max-h-[65vh] w-auto max-w-full rounded-2xl border border-white/20 bg-graphite-900 object-contain shadow-2xl md:max-h-[80vh]"
          />
          <figcaption className="flex flex-col items-center gap-1 text-center">
            <span className="tnum font-mono text-[10px] font-semibold tracking-[0.3em] text-sapphire-400">
              {pad2(active + 1)} / {pad2(TOTAL)}
            </span>
            <span className="font-display text-lg font-bold text-white">{shot.title}</span>
            <span className="max-w-md text-xs leading-relaxed text-fog-300">{shot.caption}</span>
          </figcaption>

          {/* mobile prev/next */}
          <div className="flex items-center gap-3 md:hidden mt-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous screenshot"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-graphite-900/80 text-fog-200 transition-colors hover:border-sapphire-400"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next screenshot"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-graphite-900/80 text-fog-200 transition-colors hover:border-sapphire-400"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </motion.figure>
      </AnimatePresence>
    </motion.div>
  )
}

export default function Screenshots() {
  const [active, setActive] = useState<number | null>(null)

  const open = useCallback((index: number) => setActive(index), [])
  const close = useCallback(() => setActive(null), [])
  const navigate = useCallback(
    (index: number) => setActive(((index % TOTAL) + TOTAL) % TOTAL),
    [],
  )

  return (
    <SectionShell
      id="screenshots"
      index="06"
      kicker="INTERFACE SHOWCASE"
      title={
        <span>
          Liquid Glass & Neumorphic, <span className="text-gradient-crystal">up close.</span>
        </span>
      }
      description="Deep obsidian gradients, frosted crystal panels and monospaced tabular figures — captured directly from real production builds of LiNEA. Click any frame to inspect full-size."
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {SCREENSHOTS.map((shot, i) => (
          <Reveal key={shot.src} delay={(i % 4) * 0.06}>
            <ScreenshotCard index={i} onOpen={open} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.12}>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-graphite-900/40 p-3.5 backdrop-blur-xl">
          <p className="flex items-center gap-2.5 font-mono text-[10.5px] tracking-wider text-fog-300">
            <span className="h-2 w-2 rounded-full bg-sapphire-400 animate-pulse-dot" />
            8 PRODUCTION ARTIFACT FRAMES // NO SYNTHETIC MOCKUPS
          </p>
          <span className="font-mono text-[10px] text-sapphire-300">
            ANDROID 17 (API 37)
          </span>
        </div>
      </Reveal>

      <AnimatePresence>
        {active !== null && (
          <Lightbox active={active} onClose={close} onNavigate={navigate} />
        )}
      </AnimatePresence>
    </SectionShell>
  )
}
