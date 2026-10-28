import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity,
  AlertCircle,
  Check,
  Download,
  ExternalLink,
  Eye,
  FileDiff,
  GitCompare,
  GitFork,
  Link2,
  Rss,
  Star,
} from 'lucide-react'
import { useReleases } from '@/hooks/use-releases'
import { CountUp, CornerFrame, Reveal, SectionShell, TechLabel } from '@/components/primitives'
import CompareReleases, { type CompareState } from '@/components/compare-releases'
import type { Channel, Release } from '@/types'
import { RELEASES_ATOM_URL } from '@/lib/constants'
import { assetSize, cn, formatDate, formatCount, timeAgo } from '@/lib/utils'

/* ============================================================
   SYS.07 — Release chronology: machine-logged version timeline
   Stable, beta and archived builds on one industrial rail,
   plus live repo telemetry and the release-feed subscription.
   ============================================================ */

/* ---------- Repo telemetry strip ---------- */

function TelemetryCell({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 first:pl-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-graphite-600/80 bg-graphite-900/70">
        <Icon className="h-4 w-4 text-gold-500" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <TechLabel className="text-[8.5px]">{label}</TechLabel>
        <p className="font-mono text-base font-semibold text-fog-100 tnum">
          <CountUp value={value} />
        </p>
      </div>
    </div>
  )
}

function RepoTelemetry() {
  const { repo } = useReleases()
  return (
    <Reveal delay={0.06}>
      <div className="grid grid-cols-2 divide-x divide-graphite-700/60 border-y border-graphite-700/60 sm:grid-cols-4">
        <TelemetryCell icon={Star} label="STARS" value={repo?.stars ?? 0} />
        <TelemetryCell icon={GitFork} label="FORKS" value={repo?.forks ?? 0} />
        <TelemetryCell icon={Eye} label="WATCHERS" value={repo?.watchers ?? 0} />
        <TelemetryCell icon={AlertCircle} label="OPEN ISSUES" value={repo?.openIssues ?? 0} />
      </div>
      <p className="mt-2 flex items-center gap-2 font-mono text-[9.5px] tracking-[0.14em] text-fog-500">
        <Activity className="h-3 w-3" aria-hidden="true" />
        TELEMETRY SYNCED FROM GITHUB REPO METADATA — COUNTS UPDATES WITH EVERY RELEASE SYNC
      </p>
    </Reveal>
  )
}

/* ---------- Timeline node ---------- */

function channelMeta(rel: Release) {
  if (rel.isLatestStable)
    return { badge: 'CURRENT', badgeCls: 'border-gold-600/70 bg-gold-500/15 text-gold-300', nodeCls: 'bg-gold-500 shadow-[0_0_14px_rgba(212,163,89,0.45)]' }
  if (rel.channel === 'beta')
    return { badge: 'BETA', badgeCls: 'border-rust-500/60 bg-rust-500/10 text-rust-400', nodeCls: 'bg-rust-500' }
  return { badge: 'STABLE', badgeCls: 'border-sage-600/60 bg-sage-500/10 text-sage-300', nodeCls: 'bg-sage-500' }
}

/* Deep-link anchor id for a release tag — #release-v2.0.0 survives dots in the tag */
export function releaseAnchorId(tagName: string) {
  return `release-${tagName}`
}

/** Window event fired by focusRelease so the timeline can highlight without hashchange */
export const FOCUS_RELEASE_EVENT = 'linea:focus-release'

/** Scroll a release entry into view + focus it (used by deep links & the control deck) */
export function focusRelease(tagName: string) {
  window.dispatchEvent(new CustomEvent<string>(FOCUS_RELEASE_EVENT, { detail: tagName }))
  window.history.pushState(null, '', `#${releaseAnchorId(tagName)}`)
}

/* ---------- Copy deep-link action ---------- */

function CopyLinkButton({ tagName }: { tagName: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${releaseAnchorId(tagName)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy a direct link to ${tagName}`}
      title="Copy a deep link straight to this release entry"
      className={cn(
        'flex h-9 items-center gap-2 border px-3 font-mono text-[9.5px] font-semibold tracking-[0.12em] transition-colors',
        copied
          ? 'border-sage-600/70 text-sage-400'
          : 'border-graphite-600 text-fog-400 hover:border-gold-600/70 hover:text-gold-300',
      )}
      aria-live="polite"
    >
      {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Link2 className="h-3 w-3" aria-hidden="true" />}
      {copied ? 'COPIED' : 'LINK'}
    </button>
  )
}

/* ---------- Channel legend ---------- */

function ChannelLegend() {
  const items = [
    { nodeCls: 'bg-gold-500 shadow-[0_0_10px_rgba(212,163,89,0.4)]', label: 'CURRENT — newest stable build' },
    { nodeCls: 'bg-sage-500', label: 'STABLE — published release' },
    { nodeCls: 'bg-rust-500', label: 'BETA — pre-release channel' },
  ]
  return (
    <ul
      aria-label="Timeline node legend"
      className="flex flex-wrap items-center gap-x-6 gap-y-2 border border-graphite-700/60 bg-graphite-900/30 px-4 py-2.5"
    >
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 font-mono text-[9.5px] tracking-[0.14em] text-fog-500">
          <span
            aria-hidden="true"
            className="flex h-3.5 w-3.5 items-center justify-center border border-graphite-700 bg-graphite-900"
          >
            <span className={cn('h-1 w-1 rotate-45', item.nodeCls)} />
          </span>
          {item.label}
        </li>
      ))}
    </ul>
  )
}

function TimelineEntry({
  release,
  onDiff,
  focused,
  justArrived,
}: {
  release: Release
  onDiff: (rel: Release) => void
  focused: boolean
  justArrived: boolean
}) {
  const meta = channelMeta(release)
  const apk = release.apkAssets[0] ?? null
  const apkCount = release.apkAssets.length
  const dlCount = release.assets.reduce((s, a) => s + a.downloadCount, 0)

  return (
    <li id={releaseAnchorId(release.tagName)} className="relative scroll-mt-28 pl-10 sm:pl-12">
      {/* node marker — 16px box, diamond core marks the channel */}
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0 top-4 flex h-4 w-4 items-center justify-center border border-graphite-700 bg-graphite-900',
          focused && 'border-gold-600/80',
        )}
      >
        <span className={cn('h-1.5 w-1.5 rotate-45', meta.nodeCls)} />
      </span>

      {/* card — gold corner brackets ignite on hover; deep-linked entry stays targeted */}
      <div
        className={cn(
          'group relative border bg-graphite-900/40 transition-colors',
          focused
            ? 'border-gold-600/70 bg-gold-500/[0.04]'
            : 'border-graphite-700/70 hover:border-graphite-600/80 hover:bg-graphite-850/50',
          justArrived && 'animate-deep-pulse border-gold-600/70',
        )}
      >
        <CornerFrame
          className={cn(
            'transition-opacity duration-300',
            focused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
          )}
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
          <a
            href={release.htmlUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="font-mono text-[13px] font-semibold text-fog-100 tnum transition-colors hover:text-gold-300"
            title={`Open ${release.tagName} on GitHub`}
          >
            {release.tagName}
          </a>
          <span className={cn('border px-1.5 py-px font-mono text-[9px] font-bold tracking-[0.16em]', meta.badgeCls)}>
            {meta.badge}
          </span>
          <span className="font-mono text-[10px] tracking-wider text-fog-500">
            {formatDate(release.publishedAt)}
            {release.publishedAt ? (
              <span className="text-fog-600"> · {timeAgo(release.publishedAt).toUpperCase()}</span>
            ) : null}
          </span>

          <span className="ml-auto flex items-center gap-3 font-mono text-[10px] tracking-wider text-fog-500 tnum">
            {apkCount > 0 ? (
              <span title={`${apkCount} APK file${apkCount === 1 ? '' : 's'} in this tag`}>
                {apkCount} APK{apkCount === 1 ? '' : 'S'}
              </span>
            ) : null}
            {apk ? <span>{assetSize(apk)}</span> : null}
            {dlCount > 0 ? <span>{formatCount(dlCount)} DL</span> : null}
          </span>
        </div>

        {/* entry actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-graphite-800/70 px-4 py-2.5">
          <span className="min-w-0 flex-1 truncate text-[12px] leading-snug text-fog-400" title={release.name}>
            {release.name}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <CopyLinkButton tagName={release.tagName} />
            {apk ? (
              <a
                href={apk.downloadUrl}
                target="_blank"
                rel="noreferrer noopener"
                download
                aria-label={`Download ${apk.name}`}
                className="flex h-9 items-center gap-2 border border-gold-700/60 bg-gold-500/10 px-3 font-mono text-[9.5px] font-bold tracking-[0.12em] text-gold-400 transition-colors hover:border-gold-600 hover:bg-gold-500/20"
              >
                <Download className="h-3 w-3" aria-hidden="true" />
                APK
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => onDiff(release)}
              aria-label={`Compare ${release.tagName} with the previous release`}
              title="Diff this tag against the previous release"
              className="flex h-9 items-center gap-2 border border-graphite-600 px-3 font-mono text-[9.5px] font-semibold tracking-[0.12em] text-fog-400 transition-colors hover:border-steel-500/70 hover:text-steel-300"
            >
              <FileDiff className="h-3 w-3" aria-hidden="true" />
              DIFF
            </button>
            <a
              href={release.htmlUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="flex h-9 items-center gap-2 border border-graphite-600 px-3 font-mono text-[9.5px] font-semibold tracking-[0.12em] text-fog-300 transition-colors hover:border-steel-500/70 hover:text-steel-300"
              aria-label={`Open ${release.tagName} release page on GitHub`}
            >
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
              RELEASE
            </a>
          </div>
        </div>
      </div>
    </li>
  )
}

/* ---------- Feed subscription card ---------- */

function FeedSubscribe() {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(RELEASES_ATOM_URL)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <Reveal delay={0.14}>
      <div className="flex flex-col gap-4 border border-graphite-700/70 bg-graphite-900/40 p-5 sm:flex-row sm:items-center">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-gold-700/50 bg-gold-500/10">
          <Rss className="h-5 w-5 text-gold-500" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-bold tracking-[0.18em] text-fog-200">
            SUBSCRIBE // RELEASE FEED
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-fog-400">
            New versions land on this site within minutes of publishing. Follow the Atom feed in any
            reader to get every stable and beta build the moment it ships.
          </p>
          <p className="mt-2 truncate font-mono text-[10.5px] tracking-wide text-fog-500" title={RELEASES_ATOM_URL}>
            {RELEASES_ATOM_URL}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={copy}
            className="flex h-11 items-center gap-2 border border-graphite-600 px-4 font-mono text-[10px] font-semibold tracking-[0.14em] text-fog-300 transition-colors hover:border-gold-600/70 hover:text-gold-300"
            aria-live="polite"
          >
            {copied ? 'COPIED' : 'COPY URL'}
          </button>
          <a
            href={RELEASES_ATOM_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="flex h-11 items-center gap-2 bg-gold-500 px-4 font-mono text-[10px] font-bold tracking-[0.14em] text-graphite-950 transition-colors hover:bg-gold-400"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            OPEN FEED
          </a>
        </div>
      </div>
    </Reveal>
  )
}

/* ---------- Channel filter ---------- */

type ChannelFilter = 'all' | Channel

const FILTERS: Array<{ id: ChannelFilter; label: string }> = [
  { id: 'all', label: 'ALL' },
  { id: 'stable', label: 'STABLE' },
  { id: 'beta', label: 'BETA' },
]

function ChannelFilterBar({
  releases,
  active,
  onChange,
}: {
  releases: Release[]
  active: ChannelFilter
  onChange: (f: ChannelFilter) => void
}) {
  const counts = useMemo(
    () => ({
      all: releases.length,
      stable: releases.filter((r) => r.channel === 'stable').length,
      beta: releases.filter((r) => r.channel === 'beta').length,
    }),
    [releases],
  )

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter releases by channel">
      {FILTERS.map((f) => {
        const on = active === f.id
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => onChange(f.id)}
            aria-pressed={on}
            className={cn(
              'flex h-9 items-center gap-2 border px-3 font-mono text-[10px] font-bold tracking-[0.16em] transition-colors',
              on
                ? f.id === 'beta'
                  ? 'border-rust-500/70 bg-rust-500/15 text-rust-300'
                  : 'border-gold-600/70 bg-gold-500/15 text-gold-300'
                : 'border-graphite-600 text-fog-500 hover:border-graphite-500 hover:text-fog-300',
            )}
          >
            {f.label}
            <span className={cn('tnum text-[9px]', on ? 'opacity-80' : 'opacity-50')}>{counts[f.id]}</span>
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Section ---------- */

export default function Timeline() {
  const { releases, status } = useReleases()
  // initial filter can arrive via ?channel=stable|beta deep link
  const [filter, setFilter] = useState<ChannelFilter>(() => {
    const q = typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('channel')
    return q === 'stable' || q === 'beta' ? q : 'all'
  })
  const [compare, setCompare] = useState<CompareState>({ open: false, baseTag: '', targetTag: '' })
  const [focusedTag, setFocusedTag] = useState<string | null>(null)
  const [arrival, setArrival] = useState<{ tag: string; n: number } | null>(null)
  const arrivalNonce = useRef(0)
  const lastHashRef = useRef<string | null>(null)
  const visible = useMemo(
    () => (filter === 'all' ? releases : releases.filter((r) => r.channel === filter)),
    [releases, filter],
  )

  /* ---------- channel filter ↔ ?channel= query param (shareable rail state) ---------- */
  const changeFilter = (f: ChannelFilter) => {
    setFilter(f)
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (f === 'all') url.searchParams.delete('channel')
    else url.searchParams.set('channel', f)
    window.history.replaceState(null, '', url)
  }

  /* ---------- deep links: #release-<tag> — scroll, focus and pulse the entry ---------- */
  const targetRelease = (tag: string) => {
    if (!releases.some((r) => r.tagName === tag)) return
    changeFilter('all') // ensure the entry is on the rail even if a channel filter hid it
    setFocusedTag(tag)
    arrivalNonce.current += 1
    setArrival({ tag, n: arrivalNonce.current })
    // let the filter reset commit before scrolling (entry may just have been remounted)
    window.setTimeout(() => {
      document.getElementById(releaseAnchorId(tag))?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 90)
  }

  useEffect(() => {
    const fromHash = () => {
      const h = window.location.hash
      if (!h.startsWith('#release-')) {
        setFocusedTag(null)
        return
      }
      // skip re-pulsing when the hash is unchanged (e.g. an auto-sync re-ran this effect)
      if (h === lastHashRef.current) return
      const tag = decodeURIComponent(h.slice('#release-'.length))
      // only mark handled once the tag exists — a deep link that lands before live data
      // must retry when the release sync arrives
      if (releases.some((r) => r.tagName === tag)) {
        lastHashRef.current = h
        targetRelease(tag)
      }
    }
    const fromEvent = (e: Event) => {
      const tag = (e as CustomEvent<string>).detail
      if (!tag) return
      lastHashRef.current = `#${releaseAnchorId(tag)}`
      targetRelease(tag)
    }
    fromHash() // covers direct loads and late-arriving live data
    window.addEventListener('hashchange', fromHash)
    window.addEventListener(FOCUS_RELEASE_EVENT, fromEvent)
    return () => {
      window.removeEventListener('hashchange', fromHash)
      window.removeEventListener(FOCUS_RELEASE_EVENT, fromEvent)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [releases])

  // clear the arrival pulse once it has played (3 × 0.95s)
  useEffect(() => {
    if (!arrival) return
    const n = arrival.n
    const t = window.setTimeout(() => setArrival((a) => (a?.n === n ? null : a)), 3200)
    return () => window.clearTimeout(t)
  }, [arrival])

  /** Open the diff view — target vs the release directly beneath it on the rail */
  const openCompare = (target?: Release) => {
    if (releases.length < 2) return
    const t = target ?? releases[0]
    const idx = releases.findIndex((r) => r.tagName === t.tagName)
    const base = releases[idx + 1] ?? releases[idx - 1] ?? t
    setCompare({ open: true, baseTag: base.tagName, targetTag: t.tagName })
  }

  const swapCompare = () =>
    setCompare((c) => ({ ...c, baseTag: c.targetTag, targetTag: c.baseTag }))

  return (
    <SectionShell
      id="changelog"
      index="07"
      kicker="CHRONOLOGY"
      title={
        <>
          Release history, <span className="text-gradient-gold">machine-logged</span>
        </>
      }
      description={
        <>
          Every stable, beta and archived build on one rail — current version, pre-release channel
          and the full back-catalogue, synced live from GitHub. Nodes mark the channel of each tag;
          download or open any version straight from the log. Every entry carries a shareable deep
          link — copy it with <span className="font-mono text-[11px] text-gold-400">LINK</span>,
          jump to a version from the control deck, or share the rail pre-filtered with{' '}
          <span className="font-mono text-[11px] text-gold-400">?channel=stable</span>.
        </>
      }
    >
      <RepoTelemetry />

      <div className="mt-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <TechLabel>CHANNEL SELECT // {visible.length} SHOWN</TechLabel>
          <div className="flex flex-wrap items-center gap-2">
            <ChannelFilterBar releases={releases} active={filter} onChange={changeFilter} />
            <button
              type="button"
              onClick={() => openCompare()}
              disabled={releases.length < 2}
              aria-label="Compare two release versions"
              title="Side-by-side tag comparison with notes diff"
              className="flex h-9 items-center gap-2 border border-steel-600/70 px-3 font-mono text-[10px] font-bold tracking-[0.16em] text-steel-300 transition-colors hover:border-steel-500 hover:text-steel-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <GitCompare className="h-3 w-3" aria-hidden="true" />
              COMPARE
            </button>
          </div>
        </div>

        <Reveal delay={0.08}>
          <div className="mb-4">
            <ChannelLegend />
          </div>
        </Reveal>

        {status === 'loading' && releases.length === 0 ? (
          <div className="space-y-3 border-l border-graphite-700 pl-10" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse border border-graphite-700/70 bg-graphite-900/40 p-4">
                <div className="h-4 w-24 bg-graphite-700" />
                <div className="mt-2.5 h-3 w-64 bg-graphite-800" />
              </div>
            ))}
            <p className="font-mono text-[10px] tracking-[0.2em] text-fog-500">
              RETRIEVING RELEASE LOG…
            </p>
          </div>
        ) : releases.length === 0 ? (
          <p className="border border-dashed border-graphite-700/70 px-4 py-5 font-mono text-[10.5px] tracking-[0.14em] text-fog-500">
            NO RELEASES LOGGED YET — THE FIRST PUBLISHED TAG WILL APPEAR HERE AUTOMATICALLY.
          </p>
        ) : (
          <Reveal delay={0.1}>
            {/* rail head — live sync marker */}
            <div className="relative pl-10 sm:pl-12">
              <span
                aria-hidden="true"
                className="absolute left-0 top-0 flex h-4 w-4 items-center justify-center"
              >
                <span className="absolute h-4 w-4 animate-pulse-dot rounded-full bg-sage-500/25" />
                <span className="h-2 w-2 rounded-full bg-sage-400" />
              </span>
              <p className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.2em] text-sage-300">
                NOW · LOG SYNCED LIVE
                <span className="font-normal text-fog-600">— newest first</span>
              </p>
            </div>

            {/* rail + entries */}
            <ol className="relative mt-3 space-y-3 before:absolute before:left-[7px] before:top-1 before:h-[calc(100%-0.5rem)] before:w-px before:bg-gradient-to-b before:from-sage-500/50 before:via-graphite-600 before:to-transparent">
              {visible.map((rel) => (
                <TimelineEntry
                  key={rel.tagName}
                  release={rel}
                  onDiff={openCompare}
                  focused={focusedTag === rel.tagName}
                  justArrived={arrival?.tag === rel.tagName}
                />
              ))}
            </ol>
            {visible.length === 0 ? (
              <p className="mt-4 border border-dashed border-graphite-700/70 px-4 py-4 font-mono text-[10.5px] tracking-[0.14em] text-fog-500">
                {filter === 'beta'
                  ? 'NO PRE-RELEASE BUILDS LOGGED — NEW BETAS APPEAR HERE AUTOMATICALLY.'
                  : 'NO RELEASES IN THIS CHANNEL.'}
              </p>
            ) : null}
          </Reveal>
        )}
      </div>

      <div className="mt-10">
        <FeedSubscribe />
      </div>

      <CompareReleases
        state={compare}
        releases={releases}
        onClose={() => setCompare((c) => ({ ...c, open: false }))}
        onBaseChange={(tag) => setCompare((c) => ({ ...c, baseTag: tag }))}
        onTargetChange={(tag) => setCompare((c) => ({ ...c, targetTag: tag }))}
        onSwap={swapCompare}
      />
    </SectionShell>
  )
}
