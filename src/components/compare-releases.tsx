import { useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeftRight, ExternalLink, FileDiff, X } from 'lucide-react'
import type { Release } from '@/types'
import { CornerFrame, TechLabel } from '@/components/primitives'
import { assetSize, cn, formatBytes, formatCount, formatDate } from '@/lib/utils'

/* ============================================================
   DIFF MODE — side-by-side release comparison
   Pick any two tags from the chronology and diff their
   metadata + release notes line-by-line (LCS).
   ============================================================ */

type DiffLine = { type: 'same' | 'add' | 'del'; text: string }

/** Classic LCS line diff — release notes are short, O(n·m) is fine */
function diffLines(a: string[], b: string[]): DiffLine[] {
  const n = a.length
  const m = b.length
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: 'del', text: a[i] })
      i++
    } else {
      out.push({ type: 'add', text: b[j] })
      j++
    }
  }
  while (i < n) {
    out.push({ type: 'del', text: a[i] })
    i++
  }
  while (j < m) {
    out.push({ type: 'add', text: b[j] })
    j++
  }
  return out
}

/** Collapse long runs of unchanged lines into context markers */
function collapseSame(lines: DiffLine[], keep = 2): Array<DiffLine | { type: 'collapse'; count: number }> {
  const out: Array<DiffLine | { type: 'collapse'; count: number }> = []
  let run: DiffLine[] = []
  const flush = () => {
    if (run.length > keep * 2 + 1) {
      out.push(...run.slice(0, keep), { type: 'collapse', count: run.length - keep * 2 }, ...run.slice(-keep))
    } else {
      out.push(...run)
    }
    run = []
  }
  for (const l of lines) {
    if (l.type === 'same') run.push(l)
    else {
      flush()
      out.push(l)
    }
  }
  flush()
  return out
}

const noteLines = (body: string): string[] =>
  body
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/\s+$/, ''))
    .join('\n')
    .trim()
    .split('\n')

const payloadOf = (rel: Release): number => rel.apkAssets.reduce((s, a) => s + a.size, 0)
const dlOf = (rel: Release): number => rel.assets.reduce((s, a) => s + a.downloadCount, 0)

function DeltaChip({
  value,
  invert = false,
  unit = 'count',
}: {
  value: number
  invert?: boolean
  unit?: 'count' | 'bytes' | 'days'
}) {
  if (!Number.isFinite(value) || value === 0) return <span className="font-mono text-[10px] text-fog-500">—</span>
  const up = value > 0
  const positive = invert ? !up : up
  const magnitude =
    unit === 'bytes' ? formatBytes(Math.abs(value)) : `${formatCount(Math.abs(value))}${unit === 'days' ? ' D' : ''}`
  return (
    <span
      className={cn(
        'font-mono text-[10px] font-semibold tnum',
        positive ? 'text-sage-300' : 'text-rust-400',
      )}
    >
      {up ? '+' : '−'}
      {magnitude}
    </span>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Release[]
}) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2">
      <span className="shrink-0 font-mono text-[9px] font-bold tracking-[0.18em] text-fog-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-0 flex-1 border border-graphite-600 bg-graphite-850 px-2 font-mono text-[11px] text-fog-200 focus:border-gold-600 focus:outline-none"
      >
        {options.map((r) => (
          <option key={r.tagName} value={r.tagName} className="bg-graphite-900 text-fog-200">
            {r.tagName} · {r.channel}
          </option>
        ))}
      </select>
    </label>
  )
}

function MetaRow({ label, a, b, extra }: { label: string; a: React.ReactNode; b: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[86px_1fr_1fr] items-center gap-x-3 border-b border-graphite-800/60 px-3 py-2 last:border-b-0 sm:grid-cols-[110px_1fr_1fr_auto]">
      <span className="font-mono text-[9px] font-bold tracking-[0.16em] text-fog-500">{label}</span>
      <span className="min-w-0 truncate font-mono text-[11px] text-fog-400 tnum">{a}</span>
      <span className="min-w-0 truncate font-mono text-[11px] text-fog-100 tnum">{b}</span>
      {extra ? <span className="hidden justify-self-end sm:block">{extra}</span> : null}
    </div>
  )
}

export interface CompareState {
  open: boolean
  baseTag: string
  targetTag: string
}

export default function CompareReleases({
  state,
  onClose,
  onBaseChange,
  onTargetChange,
  onSwap,
  releases,
}: {
  state: CompareState
  onClose: () => void
  onBaseChange: (tag: string) => void
  onTargetChange: (tag: string) => void
  onSwap: () => void
  releases: Release[]
}) {
  const { open } = state

  /* scroll lock + Escape while open */
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  const base = useMemo(() => releases.find((r) => r.tagName === state.baseTag) ?? null, [releases, state.baseTag])
  const target = useMemo(() => releases.find((r) => r.tagName === state.targetTag) ?? null, [releases, state.targetTag])

  const diff = useMemo(() => {
    if (!base || !target) return null
    const a = noteLines(base.body)
    const b = noteLines(target.body)
    const raw = diffLines(a, b)
    const collapsed = collapseSame(raw)
    const added = raw.filter((l) => l.type === 'add').length
    const removed = raw.filter((l) => l.type === 'del').length
    return { collapsed, added, removed }
  }, [base, target])

  const daysDelta = useMemo(() => {
    if (!base?.publishedAt || !target?.publishedAt) return null
    const t1 = new Date(base.publishedAt).getTime()
    const t2 = new Date(target.publishedAt).getTime()
    if (Number.isNaN(t1) || Number.isNaN(t2)) return null
    return Math.round((t2 - t1) / 86_400_000)
  }, [base, target])

  const sameTag = base && target && base.tagName === target.tagName

  return (
    <AnimatePresence>
      {open && base && target && (
        <div className="fixed inset-0 z-[75]" role="presentation">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="absolute inset-0 bg-graphite-950/85 backdrop-blur-[6px]"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: [0.21, 0.6, 0.35, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={`Compare ${base.tagName} with ${target.tagName}`}
              className="relative flex max-h-[88vh] w-full max-w-3xl flex-col border border-graphite-500 bg-graphite-900/95 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
            >
              <CornerFrame className="opacity-60" />

              {/* header */}
              <div className="flex items-center justify-between border-b border-graphite-700/70 px-4 py-2.5">
                <span className="flex items-center gap-2">
                  <FileDiff className="h-4 w-4 text-gold-500" aria-hidden="true" />
                  <TechLabel className="text-gold-500">DIFF MODE // TAG COMPARISON</TechLabel>
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close comparison"
                  className="flex h-8 w-8 items-center justify-center border border-graphite-600 text-fog-400 transition-colors hover:border-rust-500/70 hover:text-rust-300"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              {/* tag selectors */}
              <div className="flex flex-wrap items-center gap-2 border-b border-graphite-700/70 px-4 py-3">
                <Select label="A // BASE" value={base.tagName} onChange={onBaseChange} options={releases} />
                <button
                  type="button"
                  onClick={onSwap}
                  aria-label="Swap base and target"
                  title="Swap A and B"
                  className="flex h-10 w-10 shrink-0 items-center justify-center border border-graphite-600 text-fog-400 transition-colors hover:border-gold-600/70 hover:text-gold-300"
                >
                  <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <Select label="B // TARGET" value={target.tagName} onChange={onTargetChange} options={releases} />
              </div>

              {sameTag ? (
                <p className="px-4 py-6 text-center font-mono text-[10.5px] tracking-[0.14em] text-fog-500">
                  SELECT TWO DIFFERENT TAGS TO GENERATE A DIFF.
                </p>
              ) : (
                <>
                  {/* metadata grid */}
                  <div className="border-b border-graphite-700/70">
                    <MetaRow
                      label="CHANNEL"
                      a={base.channel.toUpperCase()}
                      b={target.channel.toUpperCase()}
                    />
                    <MetaRow
                      label="PUBLISHED"
                      a={formatDate(base.publishedAt)}
                      b={formatDate(target.publishedAt)}
                      extra={
                        daysDelta === null ? null : (
                          <DeltaChip value={daysDelta} unit="days" invert />
                        )
                      }
                    />
                    <MetaRow
                      label="APK VARIANTS"
                      a={`${base.apkAssets.length} APK${base.apkAssets.length === 1 ? '' : 'S'}`}
                      b={`${target.apkAssets.length} APK${target.apkAssets.length === 1 ? '' : 'S'}`}
                      extra={<DeltaChip value={target.apkAssets.length - base.apkAssets.length} />}
                    />
                    <MetaRow
                      label="PAYLOAD"
                      a={
                        base.apkAssets.length
                          ? assetSize(base.apkAssets.reduce((big, a) => (a.size > big.size ? a : big)))
                          : '—'
                      }
                      b={
                        target.apkAssets.length
                          ? assetSize(target.apkAssets.reduce((big, a) => (a.size > big.size ? a : big)))
                          : '—'
                      }
                      extra={<DeltaChip value={payloadOf(target) - payloadOf(base)} unit="bytes" />}
                    />
                    <MetaRow
                      label="DOWNLOADS"
                      a={formatCount(dlOf(base))}
                      b={formatCount(dlOf(target))}
                      extra={<DeltaChip value={dlOf(target) - dlOf(base)} />}
                    />
                  </div>

                  {/* notes diff */}
                  <div className="flex min-h-0 flex-1 flex-col">
                    <p className="flex items-center justify-between border-b border-graphite-800/80 px-4 py-2 font-mono text-[9px] font-bold tracking-[0.18em] text-fog-500">
                      <span>RELEASE NOTES DELTA</span>
                      <span className="tnum">
                        {diff ? (
                          <>
                            <span className="text-sage-300">+{diff.added}</span>{' '}
                            <span className="text-rust-400">−{diff.removed}</span>
                          </>
                        ) : null}
                      </span>
                    </p>
                    <div className="min-h-[120px] flex-1 overflow-y-auto bg-graphite-950/60">
                      {diff && (diff.added + diff.removed === 0) ? (
                        <p className="px-4 py-5 text-center font-mono text-[10.5px] tracking-[0.14em] text-fog-500">
                          NOTES ARE IDENTICAL BETWEEN THESE TAGS.
                        </p>
                      ) : (
                        <div className="px-0 py-2 font-mono text-[10.5px] leading-[1.7]">
                          {diff?.collapsed.map((l, i) =>
                            l.type === 'collapse' ? (
                              <p
                                key={i}
                                className="my-1 border-y border-graphite-800/60 bg-graphite-900/60 px-4 py-1 text-center text-[9px] tracking-[0.2em] text-fog-600"
                              >
                                ⋯ {l.count} UNCHANGED LINES ⋯
                              </p>
                            ) : (
                              <p
                                key={i}
                                className={cn(
                                  'flex gap-2 px-4 whitespace-pre-wrap break-words',
                                  l.type === 'add' && 'border-l-2 border-sage-500/60 bg-sage-500/[0.07] py-0.5 text-sage-200',
                                  l.type === 'del' && 'border-l-2 border-rust-500/60 bg-rust-500/[0.07] py-0.5 text-rust-300/90 line-through decoration-rust-600/50',
                                  l.type === 'same' && 'text-fog-600',
                                )}
                              >
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'w-2 shrink-0 select-none text-center tabular-nums',
                                    l.type === 'add' ? 'text-sage-500' : l.type === 'del' ? 'text-rust-500' : 'text-fog-600',
                                  )}
                                >
                                  {l.type === 'add' ? '+' : l.type === 'del' ? '−' : ' '}
                                </span>
                                <span className="min-w-0">{l.text || ' '}</span>
                              </p>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* footer actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-graphite-700/70 px-4 py-3">
                    <p className="font-mono text-[9px] tracking-[0.14em] text-fog-600">
                      A = BASELINE (OLD) · B = TARGET (NEW) · <span className="text-sage-300">+ ADDED</span> ·{' '}
                      <span className="text-rust-400">− REMOVED</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <a
                        href={base.htmlUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex h-9 items-center gap-2 border border-graphite-600 px-3 font-mono text-[9.5px] font-semibold tracking-[0.12em] text-fog-300 transition-colors hover:border-steel-500/70 hover:text-steel-300"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        OPEN A
                      </a>
                      <a
                        href={target.htmlUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex h-9 items-center gap-2 border border-gold-700/60 bg-gold-500/10 px-3 font-mono text-[9.5px] font-bold tracking-[0.12em] text-gold-400 transition-colors hover:border-gold-600 hover:bg-gold-500/20"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                        OPEN B
                      </a>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}
