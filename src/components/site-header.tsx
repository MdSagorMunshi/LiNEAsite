import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Command, Github, Menu, X, Sparkles, Star } from 'lucide-react'
import { useReleases } from '@/hooks/use-releases'
import { useScrollSpy } from '@/hooks/use-scrollspy'
import { OPEN_DECK_EVENT } from '@/components/control-deck'
import { OPEN_SHORTCUTS_EVENT } from '@/components/shortcuts-overlay'
import { NAV_LINKS, RELEASES_URL, REPO_URL } from '@/lib/constants'
import { cn, formatCount } from '@/lib/utils'

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="header-logo-rim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
          <stop offset="40%" stopColor="#818cf8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#d4a359" stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id="header-logo-glow" cx="30%" cy="20%" r="65%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="header-logo-phone" x1="20%" y1="10%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="#080c14" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="url(#header-logo-glow)" />
      <path d="M 2 8.5 C 2 4.5 4.5 2 8.5 2 L 23.5 2 C 27.5 2 30 4.5 30 8.5 C 30 9.5 25 12 16 12 C 7 12 2 9.5 2 8.5 Z" fill="#ffffff" fillOpacity="0.06" />
      <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="none" stroke="url(#header-logo-rim)" strokeWidth="1.2" />
      <rect x="2.4" y="2.4" width="27.2" height="27.2" rx="6.1" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="0.6" />
      <path d="M10.8 8.8 C10.2 8.2 9.2 8.2 8.5 8.8 L7.4 9.8 C6.8 10.3 6.6 11.1 6.7 11.9 C7.2 14.4 8.9 18.0 12.1 21.2 C15.3 24.4 18.9 26.1 21.4 26.6 C22.2 26.7 23.0 26.5 23.5 25.9 L24.5 24.8 C25.1 24.1 25.1 23.1 24.5 22.5 L22.1 20.1 C21.5 19.5 20.5 19.5 19.8 20.1 L19.1 20.7 C18.7 21.0 18.1 21.1 17.6 20.7 C16.2 19.7 14.3 17.8 13.3 16.4 C12.9 15.9 13.0 15.3 13.3 14.9 L13.9 14.2 C14.5 13.5 14.5 12.5 13.9 11.9 Z" fill="url(#header-logo-phone)" />
      <circle cx="9.8" cy="10.2" r="1.1" fill="#d4a359" />
      <path d="M 18.7 9.6 A 7.5 7.5 0 0 1 16.3 17.2" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M 22.8 7.4 A 12.0 12.0 0 0 1 18.4 21.3" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.78" />
    </svg>
  )
}

function LiveVersionPill() {
  const { latestStable, status } = useReleases()
  const label = status === 'loading' ? 'v2.7.0' : latestStable ? latestStable.tagName : 'v2.7.0'
  return (
    <a
      href={RELEASES_URL}
      target="_blank"
      rel="noreferrer noopener"
      className="group hidden items-center gap-2 rounded-full border border-sapphire-400/30 bg-sapphire-950/40 px-3 py-1 font-mono text-[11px] tracking-wider text-fog-200 backdrop-blur-xl transition-all hover:border-sapphire-400/70 hover:shadow-[0_0_15px_rgba(56,189,248,0.25)] sm:flex"
      title="Latest release on GitHub"
    >
      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-sapphire-400" aria-hidden="true" />
      <span className="text-sapphire-300 font-semibold">{label}</span>
      <span className="rounded bg-white/10 px-1 py-0.2 text-[9px] text-white">CRYSTAL</span>
    </a>
  )
}

export default function SiteHeader() {
  const { repo } = useReleases()
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const rafRef = useRef(0)

  /* ---------- scrollspy ---------- */
  const activeId = useScrollSpy(NAV_LINKS.map((l) => l.href.slice(1)))
  const activeHref = activeId ? `#${activeId}` : null

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current) return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0
        const max = document.documentElement.scrollHeight - window.innerHeight
        setProgress(max > 0 ? Math.min(window.scrollY / max, 1) : 0)
        setScrolled(window.scrollY > 12)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <header
      data-print-hide
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-white/10 bg-graphite-950/80 backdrop-blur-2xl shadow-[0_10px_35px_rgba(0,0,0,0.6)]'
          : 'border-b border-white/5 bg-graphite-950/50 backdrop-blur-md',
      )}
    >
      {/* Top Specular Hairline */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-10 focus:bg-sapphire-500 focus:px-3 focus:py-1.5 focus:font-mono focus:text-xs focus:text-graphite-950"
      >
        Skip to content
      </a>

      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <a href="#top" className="flex items-center gap-2.5 text-fog-100 transition-opacity hover:opacity-90" aria-label="LiNEA home">
          <LogoMark className="h-7 w-7 text-white" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-bold tracking-tight text-white">LiNEA</span>
            <span className="font-mono text-[8.5px] tracking-[0.25em] text-sapphire-400">TELECOM·SOVEREIGN</span>
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const active = activeHref === link.href
            return (
              <a
                key={link.href}
                href={link.href}
                aria-current={active ? 'true' : undefined}
                className={cn(
                  'relative rounded-lg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.16em] transition-all',
                  active
                    ? 'text-white bg-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]'
                    : 'text-fog-400 hover:text-fog-200 hover:bg-white/[0.04]',
                )}
              >
                {link.label}
                {/* Active indicator dot */}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-sapphire-400 shadow-[0_0_8px_#38bdf8]"
                  />
                ) : null}
              </a>
            )
          })}
        </nav>

        {/* Header Right Actions */}
        <div className="ml-auto flex items-center gap-2.5">
          <LiveVersionPill />

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(OPEN_DECK_EVENT))}
            aria-label="Open control deck (Command or Control K)"
            title="Control deck (⌘K / Ctrl+K)"
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-white/10 bg-graphite-900/60 px-2.5 font-mono text-[10px] tracking-[0.08em] text-fog-300 backdrop-blur-md transition-colors hover:border-sapphire-400/40 hover:text-white sm:flex cursor-pointer"
          >
            <Command className="h-3 w-3 text-sapphire-400" aria-hidden="true" />
            <span className="keycap">K</span>
          </button>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent(OPEN_SHORTCUTS_EVENT))}
            aria-label="Show keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            className="hidden h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-graphite-900/60 font-mono text-xs font-semibold text-fog-300 backdrop-blur-md transition-colors hover:border-sapphire-400/40 hover:text-white sm:flex cursor-pointer"
          >
            ?
          </button>

          {/* GitHub Repo & Live Star Count */}
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`LiNEA repository on GitHub (${repo?.stars ?? 0} stars)`}
            title="Star LiNEA on GitHub"
            className="group flex h-9 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-3 font-mono text-xs font-semibold text-fog-100 backdrop-blur-xl transition-all hover:border-sapphire-400/50 hover:bg-white/[0.09] hover:text-white hover:shadow-[0_0_20px_rgba(56,189,248,0.2)] cursor-pointer"
          >
            <Github className="h-4 w-4 text-fog-300 transition-colors group-hover:text-white" aria-hidden="true" />
            <span className="hidden font-sans font-medium text-[13px] tracking-tight text-fog-200 group-hover:text-white sm:inline">
              GitHub
            </span>
            <div className="flex items-center gap-1 rounded-md border border-white/10 bg-black/40 px-1.5 py-0.5 text-[11px] font-mono text-fog-300 transition-colors group-hover:border-sapphire-400/40 group-hover:text-sapphire-300">
              <Star className="h-3 w-3 fill-gold-500/30 text-gold-500" aria-hidden="true" />
              <span className="tnum font-semibold">{formatCount(repo?.stars ?? 0)}</span>
            </div>
          </a>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-graphite-900/80 text-fog-200 lg:hidden cursor-pointer"
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Scroll Progress Bar */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-graphite-800/40">
        <div
          className="h-full bg-gradient-to-r from-sapphire-500 via-sky-400 to-gold-400 transition-transform duration-150 ease-out"
          style={{ transform: `scaleX(${progress})`, transformOrigin: '0%' }}
        />
      </div>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-white/10 bg-graphite-950/95 backdrop-blur-2xl lg:hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault()
                    setMenuOpen(false)
                    window.setTimeout(() => {
                      document.querySelector(link.href)?.scrollIntoView({ behavior: 'smooth' })
                      window.history.pushState(null, '', link.href)
                    }, 300)
                  }}
                  className="block rounded-lg px-3 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-fog-300 hover:bg-white/[0.06] hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
