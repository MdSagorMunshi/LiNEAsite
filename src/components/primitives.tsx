import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/* ============================================================
   LiNEA site — shared UI primitives
   ============================================================ */

export function TechLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('tech-label', className)}>{children}</p>
}

/** Four corner brackets — precision frame decoration */
export function CornerFrame({
  className,
  inset = 'inset-0',
  size = 'h-3.5 w-3.5',
  color = 'border-gold-500/70',
}: {
  className?: string
  inset?: string
  size?: string
  color?: string
}) {
  const base = `pointer-events-none absolute ${size} ${color}`
  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute', inset, className)}>
      <span className={cn(base, 'left-0 top-0 border-l border-t')} />
      <span className={cn(base, 'right-0 top-0 border-r border-t')} />
      <span className={cn(base, 'bottom-0 left-0 border-b border-l')} />
      <span className={cn(base, 'bottom-0 right-0 border-b border-r')} />
    </div>
  )
}

/** Section shell with standardized industrial header */
export function SectionShell({
  id,
  index,
  kicker,
  title,
  description,
  children,
  className,
  contentClassName,
}: {
  id: string
  index: string
  kicker: string
  title: ReactNode
  description?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <section id={id} className={cn('relative scroll-mt-24 py-16 md:py-24', className)}>
      {/* oversized blueprint watermark numeral */}
      <span
        aria-hidden="true"
        className="section-watermark pointer-events-none absolute right-3 top-6 hidden text-[128px] opacity-45 md:block lg:right-8 lg:text-[160px]"
      >
        {index}
      </span>
      <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', contentClassName)}>
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] font-semibold tracking-[0.3em] text-gold-500">{index}</span>
            <span className="h-px flex-1 bg-gradient-to-r from-graphite-500 via-graphite-600 to-transparent" />
            <TechLabel>{kicker}</TechLabel>
          </div>
          <h2 className="mt-5 max-w-3xl font-display text-3xl font-semibold tracking-tight text-fog-100 sm:text-4xl md:text-5xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fog-400 md:text-base">{description}</p>
          ) : null}
        </Reveal>
        <div className="mt-10 md:mt-14">{children}</div>
      </div>
    </section>
  )
}

/** Fade-up reveal on scroll into view */
export function Reveal({
  children,
  delay = 0,
  className,
  y = 18,
}: {
  children: ReactNode
  delay?: number
  className?: string
  y?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.21, 0.6, 0.35, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/** Hazard strip divider between sections */
export function HazardDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn('relative h-px w-full bg-graphite-700/60', className)}>
      <div className="absolute inset-x-0 top-0 h-px hazard-stripe opacity-30" />
      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-gold-500" />
    </div>
  )
}

/** Count-up number animation (rAF driven, tabular figures) */
export function CountUp({ value, duration = 850 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0)
  const fromRef = useRef(0)

  useEffect(() => {
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + (value - from) * eased))
      if (t < 1) raf = requestAnimationFrame(step)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  return <span className="tnum">{display.toLocaleString()}</span>
}

/** Progressive blur-in image: stays blurred + slightly scaled until decode.
 *  Source chain: `src` → `fallbackSrc` → `mirrorSrc` — each stage swaps in
 *  only when the previous one errors (e.g. WebP → local PNG → raw mirror). */
export function BlurImage({
  src,
  fallbackSrc,
  mirrorSrc,
  alt,
  className,
  eager = false,
}: {
  src: string
  fallbackSrc?: string
  mirrorSrc?: string
  alt: string
  className?: string
  eager?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  const [stage, setStage] = useState(0)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const chain = useMemo(
    () => [src, fallbackSrc, mirrorSrc].filter((s): s is string => typeof s === 'string'),
    [src, fallbackSrc, mirrorSrc],
  )
  const current = chain[Math.min(stage, chain.length - 1)]

  // Cached images can finish decoding before React attaches onLoad.
  useEffect(() => {
    setStage(0)
    setLoaded(false)
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true)
  }, [src])

  const onError = () => {
    setStage((s) => (s < chain.length - 1 ? s + 1 : s))
  }

  return (
    <img
      ref={imgRef}
      src={current}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={onError}
      className={cn(
        loaded ? 'scale-100 opacity-100 blur-0' : 'scale-[1.03] opacity-90 blur-md',
        className,
      )}
      // Inline transition: survives tailwind-merge conflicts with caller classes
      // (e.g. group-hover transition-transform) while animating decode-in.
      style={{
        transitionProperty: 'filter, opacity, transform',
        transitionDuration: '700ms',
        transitionTimingFunction: 'cubic-bezier(0.21, 0.6, 0.35, 1)',
      }}
    />
  )
}

/** Corporate Liquid Glass Card with specular highlight */
export function LiquidGlassCard({
  children,
  className,
  glow = false,
}: {
  children: ReactNode
  className?: string
  glow?: boolean
}) {
  return (
    <div
      className={cn(
        "liquid-glass-card group relative overflow-hidden rounded-xl border border-white/10 p-6",
        glow && "hover:border-sapphire-400/40 hover:shadow-[0_0_35px_rgba(56,189,248,0.14)]",
        className,
      )}
    >
      {/* Specular hairline on top border */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />
      {children}
    </div>
  )
}

/** Floating liquid glass pill for status, badges and filters */
export function LiquidPill({
  children,
  className,
  tone = "sapphire",
}: {
  children: ReactNode
  className?: string
  tone?: "sapphire" | "gold" | "sage" | "neutral"
}) {
  const toneStyles = {
    sapphire: "border-sapphire-400/30 bg-sapphire-950/40 text-sapphire-300 shadow-[0_0_15px_rgba(56,189,248,0.1)]",
    gold: "border-gold-500/30 bg-gold-950/40 text-gold-300 shadow-[0_0_15px_rgba(212,163,89,0.1)]",
    sage: "border-sage-500/30 bg-sage-950/40 text-sage-300 shadow-[0_0_15px_rgba(90,143,107,0.1)]",
    neutral: "border-white/15 bg-graphite-850/50 text-fog-200",
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-medium tracking-wide backdrop-blur-md",
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
