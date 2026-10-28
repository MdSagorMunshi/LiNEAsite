import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Ban,
  Cpu,
  Download,
  ExternalLink,
  Github,
  Lock,
  Pause,
  Phone,
  PhoneCall,
  Play,
  Radio,
  ShieldCheck,
  Signal,
  Sparkles,
  Delete,
  Check,
  Copy,
} from 'lucide-react'
import { useReleases } from '@/hooks/use-releases'
import { BlurImage, CornerFrame, CountUp, TechLabel, LiquidPill } from '@/components/primitives'
import { APP_META, RELEASES_URL, REPO_URL, SCREENSHOTS } from '@/lib/constants'
import { assetSize, cn, formatDate } from '@/lib/utils'
import { DTMF_FREQS, KEY_SUBS } from '@/lib/t9'
import { playDtmf, primeAudioContext } from '@/lib/dtmf-audio'
import { toast } from '@/components/toaster'

const easeOut = [0.21, 0.6, 0.35, 1] as const

/** Enterprise capability chips — liquid pill styling */
const CAP_CHIPS: Array<{ label: string; icon: typeof Signal }> = [
  { label: 'NATIVE TELECOM (API 37)', icon: Radio },
  { label: '100% ON-DEVICE CORE', icon: Cpu },
  { label: 'DUAL SIM 5G TELEMETRY', icon: Signal },
  { label: 'HARDWARE KEYSTORE AES-256', icon: Lock },
  { label: 'AGSL LIQUID GLASS SHADER', icon: Sparkles },
  { label: 'ZERO CLOUD · ZERO TRACKING', icon: Ban },
]

function StatCell({
  label,
  value,
  suffix,
}: {
  label: string
  value: string | number | null | undefined
  suffix?: string
}) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 first:pl-0">
      <TechLabel className="text-[9px] text-fog-500">{label}</TechLabel>
      <span className="font-mono text-sm font-semibold text-fog-100 tnum md:text-base">
        {value === null || value === undefined ? '—' : typeof value === 'number' ? <CountUp value={value} /> : value}
        {suffix ? <span className="ml-1 text-fog-500">{suffix}</span> : null}
      </span>
    </div>
  )
}

const HERO_ROTATE_MS = 5200

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/* -------------------------------------------------------------
   Interactive Liquid Glass Device Showcase
   Switch between:
   1) Crystal Glass (v2.7.0 live interactive dialer)
   2) Classic Neumorphic
   3) Production Screenshots Carousel
   ------------------------------------------------------------- */

type ShowcaseMode = 'crystal' | 'classic' | 'gallery'

function PhoneShowcase() {
  const [mode, setMode] = useState<ShowcaseMode>('crystal')
  const [dialedNumber, setDialedNumber] = useState('792')
  const [easterEgg, setEasterEgg] = useState(false)
  const [frame, setFrame] = useState(0)
  const [userPaused, setUserPaused] = useState(false)
  const [hoverPaused, setHoverPaused] = useState(false)
  const total = SCREENSHOTS.length
  const paused = userPaused || hoverPaused

  // Screenshot rotation when in gallery mode
  useEffect(() => {
    if (mode !== 'gallery' || paused || prefersReducedMotion()) return
    const id = window.setInterval(() => setFrame((f) => (f + 1) % total), HERO_ROTATE_MS)
    return () => window.clearInterval(id)
  }, [mode, paused, total])

  const handleKeyPress = (digit: string) => {
    primeAudioContext()
    const freqs = DTMF_FREQS[digit]
    if (freqs) playDtmf(freqs, 110)
    if (dialedNumber.length < 14) {
      setDialedNumber((prev) => prev + digit)
    }
  }

  const handleDelete = () => {
    setDialedNumber((prev) => prev.slice(0, -1))
  }

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#']

  return (
    <div className="relative mx-auto w-[290px] sm:w-[325px]">
      <CornerFrame inset="-inset-4" size="h-5 w-5" color="border-sapphire-400/60" />

      {/* Mode Selector Pill above phone */}
      <div className="mb-3 flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-graphite-900/80 p-1 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setMode('crystal')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer',
            mode === 'crystal'
              ? 'bg-sapphire-500/25 text-white border border-sapphire-400/50 shadow-[0_0_12px_rgba(56,189,248,0.3)]'
              : 'text-fog-400 hover:text-fog-200',
          )}
        >
          <Sparkles className="h-3 w-3 text-sapphire-400" />
          CRYSTAL
        </button>
        <button
          type="button"
          onClick={() => setMode('classic')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer',
            mode === 'classic'
              ? 'bg-gold-500/25 text-gold-300 border border-gold-400/50 shadow-[0_0_12px_rgba(212,163,89,0.3)]'
              : 'text-fog-400 hover:text-fog-200',
          )}
        >
          CLASSIC
        </button>
        <button
          type="button"
          onClick={() => setMode('gallery')}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-wider transition-all cursor-pointer',
            mode === 'gallery'
              ? 'bg-white/15 text-white border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.2)]'
              : 'text-fog-400 hover:text-fog-200',
          )}
        >
          GALLERY
        </button>
      </div>

      {/* Ambient optical backlight behind device */}
      <div
        aria-hidden="true"
        className={cn(
          'absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/3 rounded-full blur-3xl transition-all duration-700 pointer-events-none',
          mode === 'crystal' && 'bg-sapphire-500/15',
          mode === 'classic' && 'bg-gold-500/12',
          mode === 'gallery' && 'bg-steel-500/15',
        )}
      />

      <motion.div
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: easeOut }}
        className="liquid-glass-card relative rounded-[2.8rem] border border-white/20 p-3 shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)]"
        onMouseEnter={() => setHoverPaused(true)}
        onMouseLeave={() => setHoverPaused(false)}
      >
        {/* Device screen bezel */}
        <div className="relative aspect-[9/19.4] overflow-hidden rounded-[2.2rem] border border-white/10 bg-graphite-950">
          {/* Dynamic Island / Speaker notch */}
          <div className="absolute left-1/2 top-2.5 z-30 flex h-4.5 w-24 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-graphite-900/90 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-graphite-950 border border-white/5" />
          </div>

          {/* Mode 1 & 2: Interactive In-Browser Keypad (Crystal / Classic) */}
          {mode !== 'gallery' ? (
            <div
              className={cn(
                'relative flex h-full flex-col justify-between p-4 pt-10 select-none',
                mode === 'crystal'
                  ? 'bg-gradient-to-b from-graphite-900/90 via-slate-900/70 to-graphite-950'
                  : 'bg-graphite-950',
              )}
            >
              {/* Refraction background mesh in crystal mode */}
              {mode === 'crystal' ? (
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-sapphire-500/20 blur-2xl" />
                  <div className="absolute top-1/2 -right-10 h-44 w-44 rounded-full bg-sage-500/15 blur-2xl" />
                  <div className="absolute -bottom-10 left-1/4 h-36 w-36 rounded-full bg-gold-500/10 blur-2xl" />
                </div>
              ) : null}

              {/* Top Telemetry Header */}
              <div className="relative z-10 flex items-center justify-between border-b border-white/5 pb-2 text-[10px] font-mono text-fog-400">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage-500" />
                  SIM 1 · 5G
                </span>
                <span className="text-sapphire-300">
                  {mode === 'crystal' ? 'CRYSTAL OPTICS' : 'NEUMORPHIC'}
                </span>
              </div>

              {/* Number Readout Area */}
              <div className="relative z-10 my-auto flex flex-col items-center justify-center py-2">
                <div className="flex h-12 items-center justify-center">
                  <span className="font-mono text-3xl font-bold tracking-widest text-white tnum">
                    {dialedNumber || <span className="text-fog-600 tracking-normal text-sm font-sans">Enter number...</span>}
                  </span>
                  {dialedNumber ? (
                    <button
                      type="button"
                      onClick={handleDelete}
                      aria-label="Delete digit"
                      className="ml-3 p-1 text-fog-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <Delete className="h-5 w-5" />
                    </button>
                  ) : null}
                </div>
                {dialedNumber === '792' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-1 rounded-full border border-sapphire-400/40 bg-sapphire-500/15 px-2.5 py-0.5 font-mono text-[10px] text-sapphire-300"
                  >
                    MATCH: RYAN SHELBY (792)
                  </motion.div>
                ) : null}
              </div>

              {/* Keypad Grid */}
              <div className="relative z-10 grid grid-cols-3 gap-2 px-1">
                {keys.map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleKeyPress(k)}
                    className={cn(
                      'flex h-12 flex-col items-center justify-center rounded-xl transition-all active:scale-95 cursor-pointer',
                      mode === 'crystal'
                        ? 'border border-white/15 bg-white/[0.08] backdrop-blur-lg hover:border-white/30 hover:bg-white/[0.14] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
                        : 'border border-graphite-700 bg-graphite-900/90 text-fog-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_2px_4px_rgba(0,0,0,0.5)] active:bg-graphite-800',
                    )}
                  >
                    <span className="font-mono text-base font-bold leading-tight">{k}</span>
                    <span className="font-mono text-[8px] text-fog-400 leading-none">
                      {KEY_SUBS[k] ?? ''}
                    </span>
                  </button>
                ))}
              </div>

              {/* Call Action Button */}
              <div className="relative z-10 mt-3 flex items-center justify-center">
                <button
                  type="button"
                  onMouseDown={() => setEasterEgg(true)}
                  onMouseUp={() => setEasterEgg(false)}
                  onMouseLeave={() => setEasterEgg(false)}
                  onTouchStart={() => setEasterEgg(true)}
                  onTouchEnd={() => setEasterEgg(false)}
                  onClick={() => {
                    toast(`Calling ${dialedNumber || 'Emergency Service'} via SIM 1...`)
                  }}
                  className={cn(
                    'group relative flex h-13 w-40 items-center justify-center gap-2 rounded-full font-mono text-xs font-bold tracking-wider transition-all duration-300 cursor-pointer',
                    easterEgg
                      ? 'border border-gold-400 bg-gradient-to-r from-rust-500 via-gold-500 to-amber-500 text-graphite-950 scale-105 shadow-[0_0_25px_rgba(212,163,89,0.7)]'
                      : mode === 'crystal'
                        ? 'border border-white/25 bg-gradient-to-r from-emerald-600 via-sage-500 to-emerald-600 text-white shadow-[0_4px_25px_rgba(16,185,129,0.4)]'
                        : 'border border-sage-500/50 bg-sage-600 text-white shadow-[0_4px_15px_rgba(90,143,107,0.4)]',
                  )}
                >
                  <Phone className={cn('h-4 w-4', easterEgg && 'rotate-12')} />
                  <span>{easterEgg ? 'FIERY SKIN' : 'CALL'}</span>
                </button>
              </div>

              {/* Bottom hint */}
              <div className="relative z-10 pt-2 text-center font-mono text-[8.5px] text-fog-500">
                {mode === 'crystal'
                  ? 'Interactive Keypad · Tap keys to test DTMF audio'
                  : 'Classic Neumorphic Tactile Profile'}
              </div>
            </div>
          ) : (
            /* Mode 3: Screenshot Gallery */
            <div className="relative h-full w-full">
              {SCREENSHOTS.map((shot, i) => (
                <BlurImage
                  key={shot.src}
                  src={shot.src}
                  fallbackSrc={shot.fallbackSrc}
                  mirrorSrc={shot.mirrorSrc}
                  alt={`LiNEA ${shot.title} — ${shot.caption}`}
                  eager={i === 0}
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500',
                    i === frame ? 'opacity-100' : 'opacity-0',
                  )}
                />
              ))}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-graphite-950/40 via-transparent to-transparent" />
            </div>
          )}
        </div>

        {/* Gallery Mode Controls */}
        {mode === 'gallery' ? (
          <div className="mt-2.5 flex items-center justify-between px-1.5">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {SCREENSHOTS.map((s, i) => (
                <span
                  key={s.src}
                  className={cn(
                    'h-1 transition-all duration-500',
                    i === frame ? 'w-4 bg-sapphire-400' : 'w-1.5 bg-graphite-600',
                  )}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? 'Resume screenshot rotation' : 'Pause rotation'}
              className="flex h-7 w-7 items-center justify-center border border-white/10 text-fog-400 hover:text-white transition-colors cursor-pointer"
            >
              {userPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
            </button>
          </div>
        ) : null}
      </motion.div>

      {/* Grounding Base Reflection */}
      <div aria-hidden="true" className="relative mt-4 select-none">
        <div className="mx-auto h-12 w-[76%] rounded-[100%] bg-sapphire-500/[0.08] blur-md" />
        <div className="mt-2 flex items-center justify-between font-mono text-[8px] tracking-[0.25em] text-fog-500">
          <span>LINEA v2.7.0</span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-1 animate-pulse-dot rounded-full bg-sage-500" />
            TELECOM CTS OK
          </span>
          <span>ANDROID 17</span>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  const { latestStable, latestApk, totalDownloads, repo, status } = useReleases()
  const [copiedSha, setCopiedSha] = useState(false)
  const versionLabel = latestStable?.tagName ?? (status === 'loading' ? 'v2.7.0' : 'v2.7.0')
  const apkSize = latestApk ? assetSize(latestApk) : '30.0 MB'
  const downloadHref = latestApk?.downloadUrl ?? 'https://github.com/MdSagorMunshi/Linea/releases/download/v2.7.0/LiNEA-v2.7.0-release.apk'
  const releaseSha = latestApk?.sha256 || '480b2970339c0dcd698c3816792ff925ce2098f57dcee2654dab92447394bd7b'

  const copySha = () => {
    navigator.clipboard.writeText(releaseSha)
    setCopiedSha(true)
    toast('SHA-256 Copied', { tone: 'sage', detail: 'Checksum copied to clipboard' })
    setTimeout(() => setCopiedSha(false), 2000)
  }

  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-14 md:pt-36 md:pb-24">
      {/* Background Grids & Ambient Radiance */}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <div className="blueprint-grid absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_35%,black,transparent)]" />
        <div className="absolute -top-32 left-1/4 h-[500px] w-[650px] rounded-full bg-sapphire-500/[0.08] blur-3xl animate-liquid-drift" />
        <div className="absolute top-1/3 right-10 h-[400px] w-[500px] rounded-full bg-sage-500/[0.05] blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[350px] w-[450px] rounded-full bg-gold-500/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.12fr_0.88fr] lg:gap-8 lg:px-8">
        {/* Left Column: Corporate Value Proposition */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeOut }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="flex items-center gap-2 rounded-full border border-sapphire-400/30 bg-sapphire-950/40 px-3 py-1 backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-sapphire-400" aria-hidden="true" />
              <span className="font-mono text-[10.5px] font-semibold tracking-[0.2em] text-sapphire-300">
                v2.7.0 RELEASED · CRYSTAL LIQUID GLASS
              </span>
            </span>
            <span className="rounded-full border border-white/10 bg-graphite-900/60 px-3 py-1 font-mono text-[10.5px] tracking-[0.2em] text-fog-300 backdrop-blur-md">
              ANDROID 17 (API 37)
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: easeOut }}
            className="mt-6 font-display text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Sovereign Dialer. <br />
            <span className="text-gradient-crystal text-glow-crystal">Engineered in Liquid Glass.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.16, ease: easeOut }}
            className="mt-5 max-w-xl text-base leading-relaxed text-fog-300 md:text-lg"
          >
            LiNEA is the enterprise-grade, privacy-preserving cellular dialer for Android. Engineered natively on Android&apos;s Telecom framework with sub-millisecond T9 indexing, hardware-backed AES-256-GCM encryption, and real-time AGSL liquid glass optics. <span className="font-semibold text-white">100% on-device. Zero cloud telemetry.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: easeOut }}
            className="mt-6 flex flex-wrap gap-2"
          >
            {CAP_CHIPS.map((chip) => (
              <span
                key={chip.label}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-graphite-900/50 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-fog-300 backdrop-blur-md transition-colors hover:border-sapphire-400/40 hover:text-white"
              >
                <chip.icon className="h-3 w-3 text-sapphire-400" aria-hidden="true" />
                {chip.label}
              </span>
            ))}
          </motion.div>

          {/* Corporate CTA Actions */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.32, ease: easeOut }}
            className="mt-8 flex flex-wrap items-center gap-3.5"
          >
            <a
              href={downloadHref}
              className="group relative flex h-13 items-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-sapphire-500 via-sky-400 to-sapphire-600 px-6 font-mono text-[13px] font-bold tracking-[0.06em] text-graphite-950 shadow-[0_10px_35px_-8px_rgba(56,189,248,0.5)] transition-all hover:scale-102 hover:shadow-[0_12px_45px_-6px_rgba(56,189,248,0.65)]"
            >
              {/* Specular sheen sweep */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 animate-sweep bg-gradient-to-r from-transparent via-white/40 to-transparent"
              />
              <Download className="relative h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
              <span className="relative">
                DOWNLOAD {versionLabel}
                <span className="ml-1.5 font-semibold opacity-75">· {apkSize}</span>
              </span>
            </a>

            <a
              href="#crystal-engine"
              className="flex h-13 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.05] px-5 font-mono text-[12px] font-semibold tracking-[0.06em] text-fog-100 backdrop-blur-xl transition-all hover:border-sapphire-400/50 hover:bg-white/[0.08]"
            >
              <Sparkles className="h-3.5 w-3.5 text-sapphire-400" />
              EXPLORE OPTICS
            </a>

            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer noopener"
              className="flex h-13 items-center gap-2 rounded-xl border border-white/10 bg-graphite-900/60 px-4 font-mono text-[12px] tracking-[0.06em] text-fog-300 backdrop-blur-md transition-colors hover:border-white/20 hover:text-white"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
              GITHUB
              <ExternalLink className="h-3 w-3 opacity-50" aria-hidden="true" />
            </a>
          </motion.div>

          {/* Verified Checksum Chip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="mt-4 flex flex-wrap items-center gap-2.5 font-mono text-[10.5px] text-fog-400"
          >
            <span className="flex items-center gap-1.5 text-sage-400">
              <ShieldCheck className="h-4 w-4" />
              VERIFIED DIGEST:
            </span>
            <button
              type="button"
              onClick={copySha}
              title="Click to copy SHA-256"
              className="group flex items-center gap-1.5 rounded border border-white/10 bg-graphite-900/80 px-2 py-0.5 text-fog-300 hover:border-sapphire-400/50 hover:text-white transition-colors cursor-pointer"
            >
              <span className="tnum font-mono">{releaseSha.slice(0, 16)}...</span>
              {copiedSha ? <Check className="h-3 w-3 text-sage-400" /> : <Copy className="h-3 w-3 opacity-60" />}
            </button>
          </motion.div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.45, ease: easeOut }}
            className="mt-10 grid grid-cols-2 divide-x divide-white/10 rounded-xl border border-white/10 bg-graphite-900/40 backdrop-blur-xl sm:grid-cols-4"
          >
            <StatCell label="ACTIVE RELEASE" value={versionLabel} />
            <StatCell label="MIN PLATFORM" value="Android 13+" />
            <StatCell label="TOTAL RELEASES" value="11 STABLE" />
            <StatCell label="GITHUB STARS" value={repo?.stars ?? 0} />
          </motion.div>
        </div>

        {/* Right Column: Device Showcase */}
        <div className="relative lg:pl-6">
          <PhoneShowcase />
        </div>
      </div>
    </section>
  )
}
