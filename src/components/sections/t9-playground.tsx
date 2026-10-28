import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  Delete,
  Mic,
  MicOff,
  Pause,
  Phone,
  PhoneCall,
  PhoneOff,
  Radio,
  Search,
  Share2,
  Signal,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { Reveal, SectionShell, TechLabel } from '@/components/primitives'
import { toast } from '@/components/toaster'
import { playDtmf, primeAudioContext } from '@/lib/dtmf-audio'
import { cn } from '@/lib/utils'
import {
  DEMO_CONTACTS,
  DTMF_FREQS,
  KEY_SUBS,
  T9_PRESETS,
  runLookup,
  type ContactMatch,
  type WordMatch,
} from '@/lib/t9'

/* ============================================================
   SYS.04 — T9 playground: live predictive dialer demo
   A working slice of the product: type digits on the keypad
   (or your physical keyboard) and watch the reverse-prefix
   index resolve contacts, words and numbers — measured,
   on-device, in your browser.
   ============================================================ */

const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'] as const
const MAX_DIGITS = 12

/** Deck + deep-link entry point: scrolls here, focuses, auto-types 792 */
export const T9_DEMO_EVENT = 'linea:t9-demo'

/** Where an auto-typed demo sequence is allowed to come from */
const DEMO_SEQ = '792'

type CallState = 'idle' | 'dialing' | 'active'

interface Lookup {
  words: WordMatch[]
  contacts: ContactMatch[]
  elapsedMs: number
}

const EMPTY_LOOKUP: Lookup = { words: [], contacts: [], elapsedMs: 0 }

/* ---------- persisted prefs: DTMF audio + simulated call log ---------- */

const AUDIO_KEY = 'linea.site:t9:audio'
const LOG_KEY = 'linea.site:t9:log'
const LOG_MAX = 4

interface LogEntry {
  label: string
  sub: string
  seconds: number
  at: number
}

function loadAudioPref(): boolean {
  try {
    return window.localStorage.getItem(AUDIO_KEY) === '1'
  } catch {
    return false
  }
}

function saveAudioPref(on: boolean): void {
  try {
    window.localStorage.setItem(AUDIO_KEY, on ? '1' : '0')
  } catch {
    /* storage unavailable — session-only */
  }
}

function loadLog(): LogEntry[] {
  try {
    const raw = window.localStorage.getItem(LOG_KEY)
    const list = raw ? (JSON.parse(raw) as unknown) : []
    return Array.isArray(list)
      ? list
          .filter(
            (x): x is LogEntry =>
              !!x &&
              typeof (x as LogEntry).label === 'string' &&
              typeof (x as LogEntry).sub === 'string' &&
              typeof (x as LogEntry).seconds === 'number' &&
              typeof (x as LogEntry).at === 'number',
          )
          .slice(0, LOG_MAX)
      : []
  } catch {
    return []
  }
}

function pushLog(entry: LogEntry): LogEntry[] {
  const next = [entry, ...loadLog().filter((x) => x.label !== entry.label || x.at !== entry.at)].slice(0, LOG_MAX)
  try {
    window.localStorage.setItem(LOG_KEY, JSON.stringify(next))
  } catch {
    /* storage unavailable — session only */
  }
  return next
}

/** compact relative time for the log rows */
function timeAgo(at: number): string {
  const s = Math.max(1, Math.round((Date.now() - at) / 1000))
  if (s < 60) return `${s}s AGO`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m AGO`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h AGO`
  return `${Math.round(h / 24)}d AGO`
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/* ---------- in-call waveform (mirrors the 32-bar app visualizer) ---------- */

const WAVE_BARS = 28

function CallWaveform({ muted, onHold }: { muted: boolean; onHold: boolean }) {
  const bars = useMemo(
    () =>
      Array.from({ length: WAVE_BARS }, (_, i) => ({
        // deterministic pseudo-random heights so SSR/CSR stay identical
        height: 22 + ((i * 37) % 13) * 5.5,
        delay: (i % 7) * 0.11,
        duration: 0.9 + ((i * 11) % 5) * 0.14,
      })),
    [],
  )
  return (
    <div className="flex h-10 items-center gap-[3px]" aria-hidden="true">
      {bars.map((bar, i) => (
        <span
          key={i}
          className={cn(
            'w-[3px] origin-center animate-wave-bar',
            muted ? 'bg-graphite-600' : onHold ? 'bg-steel-400/70' : 'bg-sage-400/80',
          )}
          style={{
            height: `${bar.height}px`,
            animationDelay: `${bar.delay}s`,
            animationDuration: `${bar.duration}s`,
            animationPlayState: muted || onHold ? 'paused' : 'running',
          }}
        />
      ))}
    </div>
  )
}

/* ---------- keypad key ---------- */

function KeypadKey({
  digit,
  onPress,
  disabled,
}: {
  digit: string
  onPress: (digit: string) => void
  disabled?: boolean
}) {
  const sub = KEY_SUBS[digit] ?? ''
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onPress(digit)}
      aria-label={`${digit}${sub ? ` — ${sub}` : ''}`}
      className={cn(
        'group relative flex h-14 select-none flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] transition-all duration-150 backdrop-blur-md cursor-pointer',
        'shadow-[inset_0_1px_1px_rgba(255,255,255,0.18),0_4px_12px_rgba(0,0,0,0.3)]',
        'active:scale-95 active:border-sapphire-400/80 active:bg-white/[0.14]',
        'hover:border-sapphire-400/40 hover:bg-white/[0.1] hover:shadow-[0_0_15px_rgba(56,189,248,0.2)]',
        disabled && 'pointer-events-none opacity-40',
      )}
    >
      <span className="tnum font-display text-xl font-semibold leading-none text-fog-100 transition-colors group-active:text-gold-300">
        {digit}
      </span>
      {sub ? (
        <span className="mt-1 font-mono text-[8.5px] font-semibold tracking-[0.18em] text-fog-500 transition-colors group-active:text-gold-500">
          {sub}
        </span>
      ) : null}
      {/* gold press flash — machined DTMF feedback */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gold-500/0 transition-colors duration-150 group-active:bg-gold-500/[0.07]"
      />
    </button>
  )
}

/* ---------- contact result row ---------- */

function ContactRow({
  match,
  selected,
  onSelect,
}: {
  match: ContactMatch
  selected: boolean
  onSelect: () => void
}) {
  const { contact, reason } = match
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          'flex w-full items-center gap-3 border-l-2 px-3 py-2 text-left transition-colors',
          selected
            ? 'border-gold-500 bg-gold-500/[0.08]'
            : 'border-transparent hover:border-graphite-500 hover:bg-graphite-850/60',
        )}
      >
        <span
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center border font-mono text-[11px] font-bold',
            selected
              ? 'border-gold-600/70 bg-gold-500/15 text-gold-300'
              : 'border-graphite-600 bg-graphite-900 text-fog-400',
          )}
          aria-hidden="true"
        >
          {initials(contact.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-fog-200">{contact.name}</span>
          <span className="block truncate font-mono text-[10px] tracking-wider text-fog-500">
            {contact.org}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="tnum font-mono text-[11px] text-fog-300">{contact.number}</span>
          <span
            className={cn(
              'border px-1.5 py-px font-mono text-[8px] font-semibold tracking-[0.14em]',
              reason === 't9-name'
                ? 'border-sage-600/60 bg-sage-500/10 text-sage-300'
                : 'border-steel-600/60 bg-steel-500/10 text-steel-300',
            )}
          >
            {reason === 't9-name' ? 'T9 NAME' : 'NUMBER'}
          </span>
        </span>
      </button>
    </li>
  )
}

/* ---------- persisted simulated call log (idle display) ---------- */

function CallLog({
  entries,
  expanded,
  onToggle,
  onWipe,
}: {
  entries: LogEntry[]
  expanded: boolean
  onToggle: () => void
  onWipe: () => void
}) {
  const shown = expanded ? entries : entries.slice(0, 1)
  return (
    <div className="mt-3 border-t border-graphite-800/80 pt-2" aria-label="Recent simulated calls">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[8.5px] tracking-[0.18em] text-fog-600">CALL LOG · {entries.length}</p>
        <div className="flex items-center gap-1.5">
          {entries.length > 1 ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              className="border border-graphite-600 px-1.5 py-px font-mono text-[8px] font-semibold tracking-[0.16em] text-fog-500 transition-colors hover:border-gold-500/60 hover:text-gold-300"
            >
              {expanded ? 'LESS' : `+${entries.length - 1} MORE`}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onWipe}
            className="border border-graphite-600 px-1.5 py-px font-mono text-[8px] font-semibold tracking-[0.16em] text-fog-500 transition-colors hover:border-rust-500/60 hover:text-rust-400"
            aria-label="Wipe simulated call log"
          >
            WIPE
          </button>
        </div>
      </div>
      <ul className="mt-1">
        {shown.map((e) => (
          <li
            key={e.at}
            className="flex items-baseline gap-2 border-l-2 border-graphite-700 pl-2 py-1"
          >
            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-fog-300">{e.label}</span>
            <span className="tnum shrink-0 font-mono text-[9px] tracking-wider text-fog-500">{e.sub}</span>
            <span className="tnum shrink-0 font-mono text-[10px] font-semibold text-sage-400">
              {formatDuration(e.seconds)}
            </span>
            <span className="shrink-0 font-mono text-[8px] tracking-[0.12em] text-fog-600">
              {timeAgo(e.at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------- the playground itself ---------- */

export default function T9Playground() {
  const [digits, setDigits] = useState('')
  const [selectedContact, setSelectedContact] = useState<ContactMatch | null>(null)
  const [lookup, setLookup] = useState<Lookup>(EMPTY_LOOKUP)
  const [lastKey, setLastKey] = useState<string | null>(null)
  const [callState, setCallState] = useState<CallState>('idle')
  const [callSeconds, setCallSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [onHold, setOnHold] = useState(false)
  // pending “dialing → active” transition — must be cancellable (END during dial)
  const dialTimeoutRef = useRef<number | null>(null)
  // auto-type sequencer (deep link / presets / deck demo command)
  const autoTimerRef = useRef<number | null>(null)
  // opt-in DTMF audio + persisted simulated call log
  const [audioOn, setAudioOn] = useState(loadAudioPref)
  const [log, setLog] = useState<LogEntry[]>(() => loadLog().slice(0, 1))
  // full log reveal: first entry peeks, the rest expand on demand
  const [logOpen, setLogOpen] = useState(false)

  const stopAutoType = useCallback(() => {
    if (autoTimerRef.current !== null) {
      window.clearInterval(autoTimerRef.current)
      autoTimerRef.current = null
    }
  }, [])

  // auto-type must yield to a live call (deck event can arrive mid-call)
  const callStateRef = useRef<CallState>('idle')
  useEffect(() => {
    callStateRef.current = callState
  }, [callState])

  /* staggered key-by-key typing — the way a human enters a sequence.
     prefers-reduced-motion collapses the stagger to near-instant. */
  const autoType = useCallback(
    (seq: string) => {
      if (callStateRef.current !== 'idle') return
      stopAutoType()
      setDigits('')
      setSelectedContact(null)
      setLastKey(null)
      const clean = seq.replace(/[^0-9*#]/g, '').slice(0, MAX_DIGITS)
      if (!clean) return
      const reduced =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const step = reduced ? 45 : 175
      let i = 0
      autoTimerRef.current = window.setInterval(() => {
        const ch = clean[i]
        i += 1
        if (ch === undefined || i > clean.length) {
          stopAutoType()
          return
        }
        setLastKey(ch)
        setDigits((d) => (d.length >= MAX_DIGITS ? d : d + ch))
        if (audioOn) {
          const pair = DTMF_FREQS[ch]
          if (pair) playDtmf(pair, 110)
        }
      }, step)
    },
    [audioOn, stopAutoType],
  )

  /* deep link: ?t9=<sequence> auto-types on first load */
  useEffect(() => {
    const seq = new URLSearchParams(window.location.search).get('t9')
    if (!seq) return
    const target = document.getElementById('t9')
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    const t = window.setTimeout(() => autoType(seq), 650)
    return () => {
      window.clearTimeout(t)
      stopAutoType()
    }
  }, [autoType, stopAutoType])

  /* deck entry point: “Try the T9 demo” */
  useEffect(() => {
    const onDemo = () => {
      document.getElementById('t9')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      // focus lands after the deck's AnimatePresence exit (~200ms) has
      // restored focus to body — otherwise the restore steals it back
      window.setTimeout(() => {
        document.getElementById('t9-console')?.focus({ preventScroll: true })
        autoType(DEMO_SEQ)
      }, 500)
    }
    window.addEventListener(T9_DEMO_EVENT, onDemo)
    return () => window.removeEventListener(T9_DEMO_EVENT, onDemo)
  }, [autoType])

  /* unmount safety — never leak the dial or auto-type timers */
  useEffect(
    () => () => {
      if (dialTimeoutRef.current) clearTimeout(dialTimeoutRef.current)
      stopAutoType()
    },
    [stopAutoType],
  )

  /* re-run the measured lookup on every keystroke */
  useEffect(() => {
    if (!digits) {
      setLookup(EMPTY_LOOKUP)
      return
    }
    setLookup(runLookup(digits))
  }, [digits])

  /* in-call timer */
  useEffect(() => {
    if (callState !== 'active') return
    const id = window.setInterval(() => setCallSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [callState])

  const pressDigit = useCallback(
    (digit: string) => {
      if (callState === 'active') return
      setLastKey(digit)
      setSelectedContact(null)
      setDigits((d) => (d.length >= MAX_DIGITS ? d : d + digit))
      if (audioOn) {
        // a keypress is a user gesture — safe point to (re)wake the context
        primeAudioContext()
        const pair = DTMF_FREQS[digit]
        if (pair) playDtmf(pair)
      }
    },
    [callState, audioOn],
  )

  const backspace = useCallback(() => {
    if (callState === 'active') return
    setSelectedContact(null)
    setDigits((d) => d.slice(0, -1))
  }, [callState])

  const clearAll = useCallback(() => {
    if (callState === 'active') return
    setSelectedContact(null)
    setDigits('')
    setLastKey(null)
  }, [callState])

  const callTarget = useMemo(() => {
    if (selectedContact) {
      return { label: selectedContact.contact.name, sub: selectedContact.contact.number }
    }
    if (digits) return { label: 'Unknown number', sub: digits }
    return null
  }, [selectedContact, digits])

  const startCall = useCallback(() => {
    if (!callTarget) return
    setCallSeconds(0)
    setMuted(false)
    setOnHold(false)
    if (dialTimeoutRef.current) clearTimeout(dialTimeoutRef.current)
    setCallState('dialing')
    dialTimeoutRef.current = window.setTimeout(() => {
      dialTimeoutRef.current = null
      setCallState('active')
    }, 900)
  }, [callTarget])

  const endCall = useCallback(() => {
    // cancel an in-flight dialing transition, or the call resurrects itself
    if (dialTimeoutRef.current) {
      clearTimeout(dialTimeoutRef.current)
      dialTimeoutRef.current = null
    }
    // only connected calls reach the log — aborted dials leave no trace
    if (callState === 'active' && callTarget) {
      setLog(
        pushLog({
          label: callTarget.label,
          sub: callTarget.sub,
          seconds: callSeconds,
          at: Date.now(),
        }),
      )
    }
    setCallState('idle')
  }, [callState, callTarget, callSeconds])

  /* opt-in DTMF audio — persisted, gesture-unlocked */
  const toggleAudio = useCallback(() => {
    const next = !audioOn
    setAudioOn(next)
    saveAudioPref(next)
    if (next) {
      // the toggle IS the user gesture that unlocks audio
      primeAudioContext()
      const pair = DTMF_FREQS['5']
      if (pair) window.setTimeout(() => playDtmf(pair, 120), 60)
    }
  }, [audioOn])

  /* preset chips: shareable ?t9= deep link + auto-type */
  const runPreset = useCallback(
    (seq: string) => {
      if (callState !== 'idle') return
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('t9', seq)
        window.history.replaceState(null, '', url)
      } catch {
        /* URL API unavailable — skip the shareable state */
      }
      autoType(seq)
    },
    [callState, autoType],
  )

  /* share — copy a ?t9= deep link for the typed sequence */
  const shareSeq = useCallback(async () => {
    if (!digits) return
    const url = `${window.location.origin}${window.location.pathname}?t9=${encodeURIComponent(digits)}`
    try {
      await navigator.clipboard.writeText(url)
      toast('T9 LINK COPIED', { tone: 'sage', detail: `?t9=${digits} — auto-types on open` })
    } catch {
      toast('CLIPBOARD BLOCKED', { tone: 'rust', detail: 'Copy the URL from the address bar' })
    }
  }, [digits])

  /* physical keyboard support — scoped to focus inside the playground */
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      pressDigit(e.key)
    } else if (e.key === '*' || e.key === '#') {
      e.preventDefault()
      pressDigit(e.key)
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      backspace()
    } else if (e.key === 'Enter') {
      if (callState === 'idle' && callTarget) {
        e.preventDefault()
        startCall()
      } else if (callState !== 'idle') {
        e.preventDefault()
        endCall()
      }
    } else if (e.key === 'Escape' && callState === 'active') {
      e.preventDefault()
      endCall()
    }
  }

  const dtmf = lastKey ? DTMF_FREQS[lastKey] : null
  const inCall = callState !== 'idle'

  return (
    <SectionShell
      id="t9"
      index="05"
      kicker="LIVE SUBSYSTEM"
      title={
        <>
          Feel the <span className="text-gradient-gold">T9 index</span>
        </>
      }
      description="A working slice of LiNEA running right here in your browser. Type on the keypad — or use your physical number keys — and watch the reverse-prefix index resolve contacts, words and numbers in microseconds. Exactly how the real dialer feels, minus the cellular radio."
    >
      <div
        id="t9-console"
        tabIndex={0}
        onKeyDown={onKeyDown}
        role="group"
        aria-label="T9 dialer playground — number keys type digits, Backspace deletes, Enter places a simulated call"
        className="relative mx-auto grid max-w-4xl gap-6 outline-offset-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8"
      >
        {/* ---------- handset: display ---------- */}
        <Reveal className="h-full">
          <div className="relative flex h-full flex-col rounded-2xl border border-white/12 bg-graphite-900/60 backdrop-blur-2xl overflow-hidden shadow-2xl">
            {/* speaker grille — machined earpiece detail */}
            <div
              aria-hidden="true"
              className="flex items-center justify-center gap-[5px] border-b border-graphite-700/70 bg-graphite-850/80 px-4 py-1.5"
            >
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className="h-[3px] w-[10px] rounded-full bg-graphite-700" />
              ))}
            </div>
            {/* status strip */}
            <div className="flex items-center gap-3 border-b border-graphite-700/70 bg-graphite-850/80 px-4 py-2">
              <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.18em] text-fog-400">
                <Signal className="h-3 w-3 text-sage-400" aria-hidden="true" />
                LI-2
              </span>
              <span className="font-mono text-[9px] tracking-[0.18em] text-fog-500">
                {inCall ? (callState === 'dialing' ? 'DIALING…' : 'IN-CALL') : 'T9 SEARCH'}
              </span>
              <span className="ml-auto font-mono text-[9px] tracking-[0.18em] text-fog-600">
                SIM1 · <span className="text-sage-400">-51 dBm</span>
              </span>
            </div>

            {/* display — CRT */}
            <div className="relative min-h-[210px] flex-1 bg-graphite-950 p-4 sm:p-5">
              <div aria-hidden="true" className="scanlines pointer-events-none absolute inset-0 z-10 opacity-[0.13]" />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,163,89,0.05),transparent_60%)]"
              />

              <AnimatePresence mode="wait" initial={false}>
                {inCall ? (
                  <motion.div
                    key="call"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-[5] flex h-full flex-col"
                  >
                    <p className="flex items-center gap-2 font-mono text-[9px] tracking-[0.22em] text-sage-300">
                      <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-sage-400" aria-hidden="true" />
                      {callState === 'dialing' ? 'ROUTING VIA NATIVE TELECOM…' : 'CALL ACTIVE · 5G NR'}
                    </p>
                    <p className="mt-3 font-display text-lg font-semibold text-fog-100">
                      {callTarget?.label}
                    </p>
                    <p className="tnum font-mono text-[12px] text-fog-400">{callTarget?.sub}</p>
                    <p
                      role="timer"
                      aria-label={`Call duration ${formatDuration(callSeconds)}`}
                      className="tnum mt-3 font-mono text-3xl font-bold text-sage-300 text-glow-sage"
                    >
                      {formatDuration(callSeconds)}
                    </p>
                    <div className="mt-3">
                      <CallWaveform muted={muted} onHold={onHold} />
                    </div>
                    <p className="mt-2 font-mono text-[9px] tracking-[0.16em] text-fog-600">
                      {muted ? 'MIC MUTED — LOCAL ONLY' : onHold ? 'CALL ON HOLD' : 'REC 0 FILES · WAVEFORM LIVE'} ·{' '}
                      <span className="text-fog-500">AUDIO ROUTE: EARPIECE</span>
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="dial"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative z-[5] flex h-full flex-col"
                  >
                    {/* dialed digits */}
                    <div className="flex min-h-[44px] items-center">
                      <p className="tnum font-display text-[28px] font-semibold tracking-wide text-fog-100 sm:text-[32px]">
                        {digits || <span className="text-fog-600">···</span>}
                      </p>
                      {digits ? (
                        <span
                          aria-hidden="true"
                          className="ml-1 inline-block h-7 w-[9px] animate-blink bg-gold-500/80"
                        />
                      ) : null}
                    </div>

                    {/* predictive words */}
                    <div className="mt-2 min-h-[24px]">
                      {lookup.words.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5" aria-label="Predictive words">
                          <span className="font-mono text-[9px] tracking-[0.16em] text-fog-600">T9</span>
                          {lookup.words.map((w) => (
                            <span
                              key={w.word}
                              className={cn(
                                'border px-1.5 py-px font-mono text-[10px] tracking-wider',
                                w.exact
                                  ? 'border-gold-600/50 bg-gold-500/10 text-gold-300'
                                  : 'border-graphite-600 bg-graphite-850/60 text-fog-400',
                              )}
                            >
                              {w.word.toUpperCase()}
                              {!w.exact && <span className="text-fog-600">+</span>}
                            </span>
                          ))}
                        </div>
                      ) : digits ? (
                        <p className="font-mono text-[9px] tracking-[0.16em] text-fog-500">NO DICTIONARY MATCH</p>
                      ) : (
                        <p className="font-mono text-[9px] tracking-[0.16em] text-fog-500">
                          TYPE TO SEARCH — NAMES, WORDS, NUMBERS
                        </p>
                      )}
                    </div>

                    {/* contact results */}
                    <div className="mt-3 flex-1">
                      {lookup.contacts.length > 0 ? (
                        <ul className="border-t border-graphite-800/80 pt-2" aria-label="Matched contacts">
                          {lookup.contacts.map((m) => (
                            <ContactRow
                              key={m.contact.name}
                              match={m}
                              selected={selectedContact?.contact.name === m.contact.name}
                              onSelect={() =>
                                setSelectedContact((cur) =>
                                  cur?.contact.name === m.contact.name ? null : m,
                                )
                              }
                            />
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    {/* persisted call log — only on a clean display */}
                    {digits === '' && log.length > 0 ? (
                      <CallLog
                        entries={log}
                        expanded={logOpen}
                        onToggle={() => setLogOpen((o) => !o)}
                        onWipe={() => {
                          try {
                            window.localStorage.removeItem(LOG_KEY)
                          } catch {
                            /* storage unavailable */
                          }
                          setLog([])
                          setLogOpen(false)
                        }}
                      />
                    ) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* measured telemetry footer */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-graphite-700/70 bg-graphite-850/60 px-4 py-2 font-mono text-[9px] tracking-[0.14em] text-fog-500">
              <span className="flex items-center gap-1.5">
                <Search className="h-3 w-3 text-gold-600" aria-hidden="true" />
                INDEX <span className="tnum text-gold-400">{lookup.elapsedMs.toFixed(3)} ms</span>
              </span>
              <span className="tnum">
                CORPUS {DEMO_CONTACTS.length} · KEYS {digits.length}/{MAX_DIGITS}
              </span>
              {dtmf ? (
                <span className="tnum text-fog-400">
                  DTMF {dtmf[0]}+{dtmf[1]} Hz
                </span>
              ) : null}
              {/* share — copy a ?t9= deep link for the typed sequence */}
              <button
                type="button"
                onClick={() => void shareSeq()}
                disabled={!digits || inCall}
                aria-label="Copy a shareable deep link for the typed sequence"
                title="Copy ?t9= deep link"
                className="ml-auto flex items-center gap-1.5 border border-graphite-600 px-2 py-0.5 font-mono text-[8.5px] font-semibold tracking-[0.16em] text-fog-500 transition-colors hover:border-sage-500/70 hover:text-sage-300 disabled:pointer-events-none disabled:opacity-35"
              >
                <Share2 className="h-3 w-3" aria-hidden="true" />
                SHARE
              </button>
              {/* opt-in DTMF synth — real ITU Q.23 pairs, gesture-unlocked */}
              <button
                type="button"
                onClick={toggleAudio}
                aria-pressed={audioOn}
                aria-label={audioOn ? 'DTMF key tones on' : 'DTMF key tones off'}
                className={cn(
                  'flex items-center gap-1.5 border px-2 py-0.5 font-mono text-[8.5px] font-semibold tracking-[0.16em] transition-colors',
                  audioOn
                    ? 'border-gold-600/70 bg-gold-500/15 text-gold-300 hover:border-gold-500'
                    : 'border-graphite-600 text-fog-500 hover:border-graphite-500 hover:text-fog-300',
                )}
              >
                {audioOn ? (
                  <Volume2 className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <VolumeX className="h-3 w-3" aria-hidden="true" />
                )}
                AUDIO {audioOn ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </Reveal>

        {/* ---------- controls + keypad ---------- */}
        <Reveal delay={0.08} className="h-full">
          <div className="flex h-full flex-col gap-4">
            {/* preset sequences — one click, each a different resolution path */}
            <div className="flex flex-wrap items-center gap-1.5" aria-label="Preset digit sequences">
              <span className="font-mono text-[8.5px] tracking-[0.18em] text-fog-600">PRESETS</span>
              {T9_PRESETS.map((p) => (
                <button
                  key={p.digits}
                  type="button"
                  onClick={() => runPreset(p.digits)}
                  disabled={inCall}
                  aria-label={`Type ${p.digits} — ${p.tag}`}
                  title={p.tag}
                  className="group flex items-center gap-1.5 border border-graphite-600 bg-graphite-850/70 px-2 py-1 font-mono text-[9px] tracking-[0.1em] text-fog-400 transition-colors hover:border-gold-500/60 hover:bg-gold-500/10 hover:text-gold-300 disabled:pointer-events-none disabled:opacity-40"
                >
                  <span className="tnum font-semibold text-fog-200 group-hover:text-gold-200">{p.digits}</span>
                  <span aria-hidden="true" className="text-fog-600 group-hover:text-gold-500/80">→</span>
                  <span className="text-fog-500 group-hover:text-gold-300">{p.label}</span>
                </button>
              ))}
            </div>

            {/* action row */}
            <div className="flex items-stretch gap-2">
              <button
                type="button"
                onClick={backspace}
                disabled={!digits || inCall}
                aria-label="Delete last digit"
                className="flex h-12 flex-1 items-center justify-center gap-2 border border-graphite-600 bg-graphite-850/80 font-mono text-[10px] font-semibold tracking-[0.18em] text-fog-400 transition-colors hover:border-graphite-500 hover:text-fog-200 disabled:pointer-events-none disabled:opacity-35"
              >
                <Delete className="h-3.5 w-3.5" aria-hidden="true" />
                DELETE
              </button>
              <button
                type="button"
                onClick={clearAll}
                disabled={!digits || inCall}
                aria-label="Clear all digits"
                className="flex h-12 flex-1 items-center justify-center gap-2 border border-graphite-600 bg-graphite-850/80 font-mono text-[10px] font-semibold tracking-[0.18em] text-fog-400 transition-colors hover:border-rust-500/60 hover:text-rust-400 disabled:pointer-events-none disabled:opacity-35"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                CLEAR
              </button>
            </div>

            {/* keypad */}
            <div className="grid grid-cols-3 gap-2">
              {KEYPAD_KEYS.map((digit) => (
                <KeypadKey key={digit} digit={digit} onPress={pressDigit} disabled={inCall} />
              ))}
            </div>

            {/* call control */}
            <button
              type="button"
              onClick={inCall ? endCall : startCall}
              disabled={!inCall && !callTarget}
              aria-label={inCall ? 'End simulated call' : 'Place simulated call'}
              className={cn(
                'relative flex h-14 items-center justify-center gap-3 overflow-hidden font-mono text-[12px] font-bold tracking-[0.22em] transition-all',
                inCall
                  ? 'bg-rust-500 text-fog-100 hover:bg-rust-400'
                  : 'bg-sage-500 text-graphite-950 hover:bg-sage-400 disabled:pointer-events-none disabled:opacity-35',
              )}
            >
              {!inCall ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 w-1/4 -skew-x-12 animate-sweep bg-gradient-to-r from-transparent via-white/25 to-transparent"
                />
              ) : null}
              {inCall ? (
                <PhoneOff className="relative h-4 w-4" aria-hidden="true" />
              ) : (
                <PhoneCall className="relative h-4 w-4" aria-hidden="true" />
              )}
              <span className="relative">{inCall ? 'END CALL' : 'CALL'}</span>
            </button>

            {/* in-call toggles */}
            {inCall ? (
              <div className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-pressed={muted}
                  className={cn(
                    'flex h-10 flex-1 items-center justify-center gap-1.5 border font-mono text-[9px] font-semibold tracking-[0.16em] transition-colors',
                    muted
                      ? 'border-gold-600/70 bg-gold-500/15 text-gold-300'
                      : 'border-graphite-600 text-fog-400 hover:border-graphite-500 hover:text-fog-200',
                  )}
                >
                  {muted ? <MicOff className="h-3 w-3" aria-hidden="true" /> : <Mic className="h-3 w-3" aria-hidden="true" />}
                  MUTE
                </button>
                <button
                  type="button"
                  onClick={() => setOnHold((h) => !h)}
                  aria-pressed={onHold}
                  className={cn(
                    'flex h-10 flex-1 items-center justify-center gap-1.5 border font-mono text-[9px] font-semibold tracking-[0.16em] transition-colors',
                    onHold
                      ? 'border-steel-600/70 bg-steel-500/15 text-steel-300'
                      : 'border-graphite-600 text-fog-400 hover:border-graphite-500 hover:text-fog-200',
                  )}
                >
                  <Pause className="h-3 w-3" aria-hidden="true" />
                  HOLD
                </button>
              </div>
            ) : (
              <p className="flex items-center justify-center gap-2 font-mono text-[9px] tracking-[0.16em] text-fog-600">
                <Radio className="h-3 w-3" aria-hidden="true" />
                PHYSICAL KEYS WORK — 0-9 · BACKSPACE · ENTER
              </p>
            )}
          </div>
        </Reveal>
      </div>

      {/* context strip */}
      <Reveal delay={0.15}>
        <div className="mx-auto mt-8 flex max-w-4xl flex-wrap items-center gap-x-5 gap-y-2 border-t border-graphite-800/80 pt-4 font-mono text-[9.5px] tracking-[0.16em] text-fog-600">
          <span className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 text-sage-500" aria-hidden="true" />
            SIMULATED RADIO — NO CALLS ARE PLACED
          </span>
          <span>·</span>
          <span className="text-fog-500">ENGINE: REVERSE-PREFIX INDEX, MAIN THREAD</span>
          <span>·</span>
          <span className="text-fog-500">THE APP DOES THIS ACROSS 10K+ CONTACTS</span>
          <span>·</span>
          <span className="text-fog-500">SHARE A SEQUENCE — APPEND ?t9=792 TO THIS URL</span>
        </div>
      </Reveal>
    </SectionShell>
  )
}
