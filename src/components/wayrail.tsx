import { useScrollSpy } from '@/hooks/use-scrollspy'
import { NAV_LINKS } from '@/lib/constants'
import { cn } from '@/lib/utils'

/* ============================================================
   SYS Wayfinding Rail — fixed left-edge station indicator
   Machined ticks + SYS numbers; the live section glows gold.
   Desktop only (≥1408px, where the 7xl column leaves ≥64px
   of margin); hidden in print; jump on click with hash sync.
   ============================================================ */

const STOPS = [
  { id: 'top', sys: '00', label: 'ORIGIN' },
  ...NAV_LINKS.map((l, i) => ({
    id: l.href.slice(1),
    sys: String(i + 1).padStart(2, '0'),
    label: l.label,
  })),
] as const

export default function WayRail() {
  const activeId = useScrollSpy(STOPS.map((s) => s.id))

  const jump = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth' })
    window.history.pushState(null, '', `#${id}`)
  }

  return (
    <nav
      data-print-hide
      aria-label="Section wayfinding"
      className="fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-start gap-0 min-[1408px]:flex"
    >
      {/* vertical hairline — the rail itself */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-transparent via-graphite-600/80 to-transparent"
      />
      {STOPS.map((stop) => {
        const active = activeId === stop.id
        return (
          <button
            key={stop.id}
            type="button"
            onClick={() => jump(stop.id)}
            aria-current={active ? 'true' : undefined}
            className="group relative flex h-8 items-center gap-2 pl-0 pr-2 outline-offset-4"
          >
            {/* machined tick */}
            <span
              aria-hidden="true"
              className={cn(
                'relative h-px w-4 origin-left transition-all duration-300',
                active
                  ? 'w-5 bg-gold-400 shadow-[0_0_8px_rgba(212,163,89,0.7)]'
                  : 'bg-graphite-500 group-hover:w-5 group-hover:bg-fog-300',
              )}
            />
            {/* SYS number */}
            <span
              className={cn(
                'tnum font-mono text-[9px] font-semibold tracking-[0.14em] transition-colors duration-300',
                active ? 'text-gold-300' : 'text-fog-600 group-hover:text-fog-400',
              )}
            >
              {stop.sys}
            </span>
            {/* station label — slides out on hover/focus */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-full ml-1 whitespace-nowrap border border-graphite-600/90 bg-graphite-900/95 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-fog-300 opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.45)] transition-all duration-200 -translate-x-1 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
            >
              {stop.label}
              {active ? <span className="ml-1.5 text-gold-400">◀</span> : null}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
