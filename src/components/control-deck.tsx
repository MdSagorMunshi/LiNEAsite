import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  ClipboardCopy,
  Command,
  CornerDownLeft,
  Crosshair,
  Download,
  Github,
  Hash,
  History,
  Keyboard,
  PhoneCall,
  RefreshCw,
  Rss,
  Search,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useReleases } from '@/hooks/use-releases'
import { CornerFrame, TechLabel } from '@/components/primitives'
import { focusRelease } from '@/components/sections/timeline'
import { T9_DEMO_EVENT } from '@/components/sections/t9-playground'
import { OPEN_SHORTCUTS_EVENT } from '@/components/shortcuts-overlay'
import { toast } from '@/components/toaster'
import { ISSUES_URL, NAV_LINKS, RELEASES_ATOM_URL, REPO_URL } from '@/lib/constants'
import { cn, formatDate } from '@/lib/utils'

/* ============================================================
   CONTROL DECK — ⌘K / Ctrl+K command palette
   Type-to-filter quick access to every section, download
   action and system operation. Industrial overlay, fully
   keyboard-driven, listbox semantics for screen readers.
   ============================================================ */

export const OPEN_DECK_EVENT = 'linea:open-deck'
export const CLOSE_DECK_EVENT = 'linea:close-deck'

const isMac =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
const KEY_HINT = isMac ? '⌘ K' : 'CTRL K'

type DeckGroup = 'RECENT' | 'NAVIGATE' | 'ACQUIRE' | 'SYSTEM' | 'RELEASES'

interface DeckCommand {
  id: string
  label: string
  group: DeckGroup
  hint?: string
  keywords?: string
  icon: LucideIcon
  run: () => void
}

const GROUP_ORDER: DeckGroup[] = ['RECENT', 'NAVIGATE', 'ACQUIRE', 'SYSTEM', 'RELEASES']

/* ---------- recent-command memory (localStorage) ---------- */

const RECENT_KEY = 'linea.site:deck:recent'
const RECENT_MAX = 5

function loadRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string').slice(0, RECENT_MAX) : []
  } catch {
    return []
  }
}

function pushRecent(id: string): string[] {
  const next = [id, ...loadRecent().filter((x) => x !== id)].slice(0, RECENT_MAX)
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable — memory only for this session */
  }
  return next
}

function clearRecentStorage(): void {
  try {
    window.localStorage.removeItem(RECENT_KEY)
  } catch {
    /* storage unavailable — ignore */
  }
}

/** Scroll to an in-page anchor without fighting the closing overlay */
function goTo(hash: string) {
  // getElementById survives ids containing dots (e.g. #release-v2.0.0)
  document.getElementById(hash.startsWith('#') ? hash.slice(1) : hash)?.scrollIntoView({ behavior: 'smooth' })
  window.history.pushState(null, '', hash)
}

function triggerDownload(url: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = ''
  a.rel = 'noreferrer'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false // clipboard unavailable
  }
}

/* ---------- matched-token highlight (label span) ---------- */

/** Highlights the earliest query-token occurrence inside a label.
 *  Purely presentational — the parent keeps its truncate/overflow. */
function HighlightLabel({ label, tokens }: { label: string; tokens: string[] }) {
  if (tokens.length === 0) return <>{label}</>
  const lower = label.toLowerCase()
  let start = -1
  let len = 0
  for (const tok of tokens) {
    if (!tok) continue
    const i = lower.indexOf(tok)
    if (i !== -1 && (start === -1 || i < start)) {
      start = i
      len = tok.length
    }
  }
  if (start === -1) return <>{label}</>
  return (
    <>
      {label.slice(0, start)}
      <span className="rounded-[1px] bg-gold-500/10 text-gold-300">{label.slice(start, start + len)}</span>
      {label.slice(start + len)}
    </>
  )
}

export default function ControlDeck() {
  const { releases, latestStable, latestApk, refresh } = useReleases()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [recent, setRecent] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  /* ---------- global triggers: key combo + custom event ---------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    const onOpen = () => setOpen(true)
    const onClose = () => setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener(OPEN_DECK_EVENT, onOpen)
    window.addEventListener(CLOSE_DECK_EVENT, onClose)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_DECK_EVENT, onOpen)
      window.removeEventListener(CLOSE_DECK_EVENT, onClose)
    }
  }, [])

  /* ---------- scroll lock + focus management ---------- */
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    inputRef.current?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      restoreFocusRef.current?.focus()
    }
  }, [open])

  // reset on every open — reload the recent-command memory with it
  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      setRecent(loadRecent())
    }
  }, [open])

  /* ---------- command registry ---------- */
  const commands = useMemo<DeckCommand[]>(() => {
    const nav: DeckCommand[] = [
      { id: 'nav-top', label: 'Go to top', group: 'NAVIGATE', keywords: 'home hero start', icon: ArrowUp, run: () => goTo('#top') },
      ...NAV_LINKS.map((link) => ({
        id: `nav-${link.href.slice(1)}`,
        label: `Go to ${link.label}`,
        group: 'NAVIGATE' as DeckGroup,
        keywords: `${link.href} section jump scroll`,
        icon: ArrowUpRight,
        run: () => goTo(link.href),
      })),
    ]

    const acquire: DeckCommand[] = []
    if (latestApk && latestStable) {
      acquire.push({
        id: 'acquire-apk',
        label: `Download ${latestStable.tagName} APK`,
        group: 'ACQUIRE',
        hint: latestApk.name,
        keywords: `apk download ${latestStable.tagName} latest stable direct install`,
        icon: Download,
        run: () => triggerDownload(latestApk.downloadUrl),
      })
      acquire.push({
        id: 'acquire-release',
        label: `Open ${latestStable.tagName} release page`,
        group: 'ACQUIRE',
        hint: 'GitHub',
        keywords: `release notes page ${latestStable.tagName}`,
        icon: Github,
        run: () => window.open(latestStable.htmlUrl, '_blank', 'noreferrer'),
      })
    }
    acquire.push(
      { id: 'acquire-repo', label: 'Open GitHub repository', group: 'ACQUIRE', keywords: 'source code repo github', icon: Github, run: () => window.open(REPO_URL, '_blank', 'noreferrer') },
      { id: 'acquire-issues', label: 'Open issue tracker', group: 'ACQUIRE', keywords: 'issues bugs report feedback', icon: Github, run: () => window.open(ISSUES_URL, '_blank', 'noreferrer') },
      { id: 'acquire-feed', label: 'Open release feed (Atom)', group: 'ACQUIRE', keywords: 'rss atom feed subscribe new versions', icon: Rss, run: () => window.open(RELEASES_ATOM_URL, '_blank', 'noreferrer') },
    )

    const system: DeckCommand[] = [
      {
        id: 'sys-sha',
        label: 'Copy latest SHA-256 checksum',
        group: 'SYSTEM',
        hint: latestApk?.sha256 ? `${latestApk.sha256.slice(0, 10)}…` : undefined,
        keywords: 'sha256 checksum verify integrity hash copy',
        icon: Hash,
        run: () => {
          const sha = latestApk?.sha256
          if (sha)
            void copyText(sha).then((ok) =>
              toast(ok ? 'SHA-256 COPIED' : 'CLIPBOARD BLOCKED', {
                tone: ok ? 'sage' : 'rust',
                detail: ok ? sha.slice(0, 16) + '…' : 'CHECK BROWSER PERMISSIONS',
              }),
            )
        },
      },
      {
        id: 'sys-feed',
        label: 'Copy release feed URL',
        group: 'SYSTEM',
        keywords: 'rss atom url copy subscribe',
        icon: ClipboardCopy,
        run: () =>
          void copyText(RELEASES_ATOM_URL).then((ok) =>
            toast(ok ? 'FEED URL COPIED' : 'CLIPBOARD BLOCKED', {
              tone: ok ? 'sage' : 'rust',
              detail: ok ? 'ATOM · RELEASES FEED' : 'CHECK BROWSER PERMISSIONS',
            }),
          ),
      },
      { id: 'sys-verify', label: 'Verify APK integrity', group: 'SYSTEM', keywords: 'sha256 terminal verify integrity trust', icon: ShieldCheck, run: () => goTo('#downloads') },
      {
        id: 'sys-t9',
        label: 'Try the T9 demo',
        group: 'SYSTEM',
        hint: 'auto-dials 792',
        keywords: 't9 demo dial keypad playground interactive predictive try feel',
        icon: PhoneCall,
        run: () => {
          goTo('#t9')
          window.dispatchEvent(new CustomEvent(T9_DEMO_EVENT))
        },
      },
      {
        id: 'sys-keys',
        label: 'Show keyboard shortcuts',
        group: 'SYSTEM',
        hint: 'press ? anytime',
        keywords: 'keyboard shortcuts hotkeys help keys question',
        icon: Keyboard,
        run: () => window.dispatchEvent(new CustomEvent(OPEN_SHORTCUTS_EVENT)),
      },
      { id: 'sys-sync', label: 'Force release sync', group: 'SYSTEM', hint: 'bypasses ETag cache', keywords: 'refresh sync reload force update new version check', icon: RefreshCw, run: () => void refresh(true) },
    ]

    const releaseCmds: DeckCommand[] = releases.flatMap((rel) => [
      {
        id: `rel-${rel.tagName}`,
        label: `Open ${rel.tagName} on GitHub`,
        group: 'RELEASES' as DeckGroup,
        hint: `${rel.channel.toUpperCase()} · ${formatDate(rel.publishedAt)}`,
        keywords: `${rel.tagName} version ${rel.channel} release changelog old archive github page`,
        icon: Github,
        run: () => window.open(rel.htmlUrl, '_blank', 'noreferrer'),
      },
      {
        id: `rel-focus-${rel.tagName}`,
        label: `Jump to ${rel.tagName} entry`,
        group: 'RELEASES' as DeckGroup,
        hint: 'changelog rail',
        keywords: `${rel.tagName} version ${rel.channel} entry timeline changelog focus deep link highlight`,
        icon: Crosshair,
        run: () => focusRelease(rel.tagName),
      },
    ])

    return [...nav, ...acquire, ...system, ...releaseCmds]
  }, [releases, latestStable, latestApk, refresh])

  /* ---------- filtering ----------
     Command pool: executed commands resurface in a RECENT group
     at the top (VS Code palette style) whenever the query is empty;
     tokenized word-wise AND matching applies on top of that. */
  const tokens = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  )
  const pool = useMemo<DeckCommand[]>(() => {
    if (recent.length === 0) return commands
    const recentCmds = recent
      .map((id) => commands.find((c) => c.id === id))
      .filter((c): c is DeckCommand => c !== undefined)
      .map((c) => ({ ...c, group: 'RECENT' as DeckGroup }))
    if (recentCmds.length === 0) return commands
    return [...recentCmds, ...commands]
  }, [commands, recent])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return pool
    const tokens = q.split(/\s+/).filter(Boolean)
    const atBoundary = (s: string, i: number) => i === 0 || /\s/.test(s[i - 1] ?? ' ')
    const scored = pool
      .map((cmd) => {
        const label = cmd.label.toLowerCase()
        const hay = `${label} ${cmd.keywords ?? ''}`.toLowerCase()
        let score = 0
        for (const tok of tokens) {
          const labelIdx = label.indexOf(tok)
          const hayIdx = hay.indexOf(tok)
          if (labelIdx === -1 && hayIdx === -1) return null // AND semantics
          if (labelIdx === 0) score += 0
          else if (labelIdx > 0) score += atBoundary(label, labelIdx) ? 1 : 2
          else score += 3 + (atBoundary(hay, hayIdx) ? hayIdx : 30 + hayIdx)
        }
        return { cmd, score }
      })
      .filter((x): x is { cmd: DeckCommand; score: number } => x !== null)
    scored.sort((a, b) => a.score - b.score) // stable — registry order breaks ties
    return scored.map((s) => s.cmd)
  }, [pool, query])

  // keep active index in range as the list shrinks
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(filtered.length - 1, 0)))
  }, [filtered.length])

  const grouped = useMemo(() => {
    // carry the flat index so duplicate entries (RECENT + original group)
    // keep unique DOM ids and correct active-option targeting
    const map = new Map<DeckGroup, { cmd: DeckCommand; index: number }[]>()
    filtered.forEach((cmd, index) => {
      const arr = map.get(cmd.group) ?? []
      arr.push({ cmd, index })
      map.set(cmd.group, arr)
    })
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }))
  }, [filtered])

  const activeId = filtered[active] ? `deck-opt-${active}` : undefined

  // keep the active option in view while arrowing through the list
  useEffect(() => {
    if (!open || activeId === undefined || !listRef.current) return
    listRef.current.querySelector(`#${activeId}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeId, open])

  const close = () => setOpen(false)

  const select = (cmd: DeckCommand) => {
    setRecent(pushRecent(cmd.id))
    setOpen(false)
    // Release the scroll lock + start the exit fade before acting
    window.setTimeout(() => cmd.run(), 80)
  }

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => (filtered.length ? (a + 1) % filtered.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => (filtered.length ? (a - 1 + filtered.length) % filtered.length : 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = filtered[active]
      if (cmd) select(cmd)
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActive(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActive(Math.max(filtered.length - 1, 0))
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80]" role="presentation">
          {/* backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 bg-graphite-950/85 backdrop-blur-[6px]"
            onClick={close}
            aria-hidden="true"
          />

          {/* panel */}
          <div className="absolute inset-x-0 top-[10vh] mx-auto flex justify-center px-4">
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.21, 0.6, 0.35, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label="Control deck — command palette"
              className="relative w-full max-w-[580px] border border-graphite-500 bg-graphite-900/95 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            >
              <CornerFrame className="opacity-60" />
              <div aria-hidden="true" className="scanlines pointer-events-none absolute inset-0 opacity-[0.35]" />

              {/* header */}
              <div className="relative flex items-center justify-between border-b border-graphite-700/70 px-4 py-2.5">
                <TechLabel className="text-gold-500">CONTROL DECK // LI-2</TechLabel>
                <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.14em] text-fog-500">
                  <kbd className="keycap">ESC</kbd> CLOSE
                </span>
              </div>

              {/* query input */}
              <div className="relative flex items-center gap-3 border-b border-graphite-700/70 px-4">
                <Search className="h-4 w-4 shrink-0 text-gold-600" aria-hidden="true" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setActive(0)
                  }}
                  onKeyDown={onInputKeyDown}
                  role="combobox"
                  aria-expanded="true"
                  aria-controls="deck-list"
                  aria-autocomplete="list"
                  aria-activedescendant={activeId ? `deck-opt-${activeId}` : undefined}
                  placeholder="TYPE A COMMAND — TRY “APK”, “JUMP V1” OR “SYNC”…"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-12 w-full bg-transparent font-mono text-[13px] text-fog-100 placeholder:text-fog-600 focus:outline-none"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('')
                      setActive(0)
                      inputRef.current?.focus()
                    }}
                    aria-label="Clear search query"
                    className="flex h-7 w-7 shrink-0 items-center justify-center border border-graphite-600 text-fog-500 transition-colors hover:border-rust-500/60 hover:text-rust-400"
                  >
                    <X className="h-3 w-3" aria-hidden="true" />
                  </button>
                ) : null}
                <span className="hidden shrink-0 font-mono text-[9px] tracking-[0.1em] text-fog-600 tnum sm:inline">
                  {filtered.length}/{pool.length}
                </span>
              </div>

              {/* results */}
              <div ref={listRef} className="relative max-h-[46vh] overflow-y-auto">
                {filtered.length === 0 ? (
                  <p className="px-4 py-6 text-center font-mono text-[10.5px] tracking-[0.14em] text-fog-500">
                    NO MATCHING COMMANDS — ALL WORDS MUST MATCH; TRY “APK” OR “JUMP V1”
                  </p>
                ) : (
                  <div id="deck-list" role="listbox" aria-label="Commands">
                    {grouped.map(({ group, items }) => (
                      <div key={group}>
                        <p className="sticky top-0 z-10 flex items-center gap-3 border-y border-graphite-800/80 bg-graphite-900/95 px-4 py-1.5 font-mono text-[9px] font-bold tracking-[0.22em] text-gold-600">
                          {group === 'RECENT' ? (
                            <History className="h-3 w-3" aria-hidden="true" />
                          ) : null}
                          {group}
                          <span className="h-px flex-1 bg-graphite-700/60" aria-hidden="true" />
                          {group === 'RECENT' ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                clearRecentStorage()
                                setRecent([])
                                setActive(0)
                              }}
                              onMouseDown={(e) => e.preventDefault()}
                              className="border border-graphite-600 px-1.5 py-px font-mono text-[8px] font-semibold tracking-[0.18em] text-fog-500 transition-colors hover:border-rust-500/60 hover:text-rust-400"
                              aria-label="Clear recent command history"
                            >
                              CLEAR
                            </button>
                          ) : null}
                        </p>
                        {items.map(({ cmd, index }) => {
                          const isActive = index === active
                          return (
                            <div
                              key={`${group}-${cmd.id}`}
                              id={`deck-opt-${index}`}
                              role="option"
                              aria-selected={isActive}
                              tabIndex={-1}
                              onMouseMove={() => setActive(index)}
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => select(cmd)}
                              className={cn(
                                'flex cursor-pointer items-center gap-3 border-l-2 px-4 py-2.5 transition-colors',
                                isActive
                                  ? 'border-gold-500 bg-gold-500/10'
                                  : 'border-transparent hover:bg-graphite-850/70',
                              )}
                            >
                              <cmd.icon
                                className={cn('h-4 w-4 shrink-0', isActive ? 'text-gold-400' : 'text-fog-500')}
                                aria-hidden="true"
                              />
                              <span className={cn('min-w-0 flex-1 truncate text-[13px]', isActive ? 'text-fog-100' : 'text-fog-300')}>
                                <HighlightLabel label={cmd.label} tokens={tokens} />
                              </span>
                              {cmd.hint ? (
                                <span className="hidden shrink-0 font-mono text-[9px] tracking-[0.1em] text-fog-600 sm:inline">
                                  {cmd.hint}
                                </span>
                              ) : null}
                              {isActive ? (
                                <CornerDownLeft className="h-3 w-3 shrink-0 text-gold-500" aria-hidden="true" />
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* footer hints */}
              <div className="relative flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-graphite-700/70 px-4 py-2.5">
                <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.12em] text-fog-600">
                  <kbd className="keycap">↑</kbd>
                  <kbd className="keycap">↓</kbd> NAVIGATE
                  <kbd className="keycap ml-1.5">↵</kbd> EXECUTE
                </span>
                <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.12em] text-fog-600">
                  <kbd className="keycap">?</kbd> SHORTCUTS
                  <Command className="ml-1.5 h-3 w-3" aria-hidden="true" />
                  {KEY_HINT} DECK
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
