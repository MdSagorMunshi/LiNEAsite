import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  FileArchive,
  GitBranch,
  RotateCw,
  Search,
  User,
  X,
} from 'lucide-react'
import { useReleases } from '@/hooks/use-releases'
import { CountUp, CornerFrame, Reveal, TechLabel } from '@/components/primitives'
import ReleaseNotes from '@/components/release-notes'
import { AssetList, ShaLine } from '@/components/asset-list'
import VerifyTerminal from '@/components/verify-terminal'
import QrDownload from '@/components/qr-download'
import type { Release } from '@/types'
import { RELEASES_URL } from '@/lib/constants'
import { assetSize, cn, formatDate, formatCount, timeAgo } from '@/lib/utils'

/* ============================================================
   SYS.06 — Downloads: live-synced distribution bay
   Latest stable · beta channel · older-version archive
   Every asset of every tag is listed (multi-APK per tag).
   ============================================================ */

/* ---------- Live sync status bar ---------- */

function SyncStatusBar() {
  const { source, lastCheckedAt, isRefreshing, refresh, error, releases } = useReleases()

  /* aggregate distribution telemetry — every asset of every tracked release */
  const totalDownloads = useMemo(
    () => releases.reduce((sum, rel) => sum + rel.assets.reduce((s, a) => s + a.downloadCount, 0), 0),
    [releases],
  )

  const sourceMeta =
    source === 'github-api'
      ? { label: 'GITHUB API · LIVE', dot: 'bg-sage-500', text: 'text-sage-300' }
      : source === 'proxy'
        ? { label: 'GATEWAY RELAY', dot: 'bg-steel-400', text: 'text-steel-300' }
        : source === 'seed'
          ? { label: 'BUILD SNAPSHOT', dot: 'bg-fog-500', text: 'text-fog-400' }
          : { label: 'SYNCING', dot: 'bg-gold-500', text: 'text-gold-400' }

  return (
    <Reveal>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border border-graphite-600/80 bg-graphite-850/70 px-4 py-3 backdrop-blur-md">
        <span className="flex items-center gap-2">
          <span className={cn('h-1.5 w-1.5 animate-pulse-dot rounded-full', sourceMeta.dot)} aria-hidden="true" />
          <span className={cn('font-mono text-[10px] font-semibold tracking-[0.18em]', sourceMeta.text)}>
            {sourceMeta.label}
          </span>
        </span>
        <span className="font-mono text-[10px] tracking-[0.14em] text-fog-500">
          TRACKING {releases.length} RELEASE{releases.length === 1 ? '' : 'S'} · AUTO-SYNC 2 MIN
        </span>
        {totalDownloads > 0 ? (
          <span className="tnum font-mono text-[10px] tracking-[0.14em] text-fog-500">
            Σ DL <span className="font-semibold text-fog-200"><CountUp value={totalDownloads} /></span>
          </span>
        ) : null}
        <span className="font-mono text-[10px] tracking-[0.14em] text-fog-500">
          LAST SYNC {lastCheckedAt ? timeAgo(lastCheckedAt).toUpperCase() : '—'}
        </span>
        {error ? (
          <span
            className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.1em] text-rust-400"
            title={error}
          >
            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
            {error.toUpperCase()}
          </span>
        ) : null}
        <button
          type="button"
          onClick={() => void refresh(true)}
          disabled={isRefreshing}
          aria-label="Force sync latest releases from GitHub"
          className="ml-auto flex h-9 items-center gap-2 border border-graphite-600 px-3 font-mono text-[10px] font-semibold tracking-[0.16em] text-fog-300 transition-colors hover:border-gold-600/70 hover:text-gold-300 disabled:opacity-50"
        >
          <RotateCw className={cn('h-3.5 w-3.5', isRefreshing && 'animate-spin')} aria-hidden="true" />
          {isRefreshing ? 'SYNCING' : 'SYNC'}
        </button>
      </div>
    </Reveal>
  )
}

/* ---------- Copy-all-checksums action ---------- */

function CopyChecksumsButton({ release }: { release: Release }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const copy = async () => {
    const lines = release.assets
      .filter((a) => a.sha256)
      .map((a) => `${a.sha256}  ${a.name}`)
    if (lines.length === 0) return
    try {
      await navigator.clipboard.writeText(lines.join('\n'))
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  const withSha = release.assets.filter((a) => a.sha256).length
  if (withSha === 0) return null

  return (
    <button
      type="button"
      onClick={copy}
      aria-live="polite"
      className={cn(
        'ml-auto flex h-9 items-center gap-2 border px-3 font-mono text-[9.5px] font-semibold tracking-[0.14em] transition-colors',
        copied
          ? 'border-sage-600/70 text-sage-400'
          : 'border-graphite-600 text-fog-400 hover:border-gold-600/70 hover:text-gold-300',
      )}
    >
      {copied ? <Check className="h-3 w-3" aria-hidden="true" /> : <Copy className="h-3 w-3" aria-hidden="true" />}
      {copied ? `COPIED ${withSha} DIGEST${withSha === 1 ? '' : 'S'}` : `COPY ALL CHECKSUMS (${withSha})`}
    </button>
  )
}

/* ---------- Latest stable panel ---------- */

function LatestPanel({ release }: { release: Release }) {
  const mainApk = release.apkAssets[0] ?? null
  const totalSize = release.assets.reduce((s, a) => s + a.size, 0)

  return (
    <Reveal delay={0.08}>
      <div className="relative overflow-hidden border border-graphite-600/90 bg-graphite-850/60 backdrop-blur-md">
        <CornerFrame />
        <div aria-hidden="true" className="h-1 hazard-stripe opacity-25" />

        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          {/* Left — identity + CTA */}
          <div className="relative border-b border-graphite-700/60 p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <div aria-hidden="true" className="blueprint-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 bg-sage-500/15 border border-sage-600/60 px-2 py-0.5 font-mono text-[9.5px] font-bold tracking-[0.18em] text-sage-300">
                  <span className="h-1 w-1 animate-pulse-dot rounded-full bg-sage-400" aria-hidden="true" />
                  LATEST STABLE
                </span>
                <span className="border border-graphite-600 px-2 py-0.5 font-mono text-[9.5px] tracking-[0.18em] text-fog-400">
                  CURRENT
                </span>
              </div>

              <p className="mt-4 font-display text-5xl font-bold tracking-tighter text-fog-100 tnum sm:text-6xl">
                {release.tagName}
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-fog-300">{release.name}</p>

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[10px] tracking-wider text-fog-500">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDate(release.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5" aria-hidden="true" />
                  {release.tagName}
                </span>
                {release.author ? (
                  <span className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" aria-hidden="true" />
                    {release.author}
                  </span>
                ) : null}
              </div>

              {/* Primary CTA */}
              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
                {mainApk ? (
                  <a
                    href={mainApk.downloadUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    download
                    className="group relative flex h-12 items-center justify-center gap-3 overflow-hidden bg-gold-500 px-6 font-mono text-[12.5px] font-bold tracking-[0.05em] text-graphite-950 transition-all hover:bg-gold-400 hover:shadow-[0_12px_44px_-14px_rgba(212,163,89,0.6)]"
                  >
                    {/* machined sheen — slow sweep across the gold plate */}
                    <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-1/4 -skew-x-12 animate-sweep bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                    <Download className="relative h-4 w-4 transition-transform group-hover:translate-y-0.5" aria-hidden="true" />
                    <span className="relative">
                      DIRECT APK · {assetSize(mainApk).toUpperCase()}
                    </span>
                  </a>
                ) : (
                  <a
                    href={release.htmlUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex h-12 items-center justify-center gap-3 bg-gold-500 px-6 font-mono text-[12.5px] font-bold tracking-[0.05em] text-graphite-950 transition-all hover:bg-gold-400"
                  >
                    <Download className="h-4 w-4" aria-hidden="true" />
                    GET LiNEA
                  </a>
                )}
                <a
                  href={release.htmlUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex h-12 items-center justify-center gap-2.5 border border-graphite-500 px-5 font-mono text-[11.5px] tracking-[0.06em] text-fog-200 transition-colors hover:border-steel-500/70 hover:text-steel-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  GITHUB RELEASE
                </a>
              </div>

              <div className="mt-4">
                <ShaLine asset={mainApk} />
              </div>

              {/* integrity verification terminal */}
              <div className="mt-5">
                <VerifyTerminal asset={mainApk} />
              </div>

              {/* quick stats */}
              <dl className="mt-6 grid grid-cols-3 divide-x divide-graphite-700/70 border-t border-graphite-700/70 pt-4">
                {[
                  { k: 'APK FILES', v: `${release.apkAssets.length}` },
                  { k: 'ASSETS', v: `${release.assets.length}` },
                  {
                    k: 'PAYLOAD',
                    v: totalSize > 0 ? assetSize({ size: totalSize, sizeLabel: null }) : '—',
                  },
                ].map((s) => (
                  <div key={s.k} className="px-3 first:pl-0">
                    <dt className="tech-label text-[8.5px]">{s.k}</dt>
                    <dd className="mt-1 font-mono text-sm font-semibold text-fog-100 tnum">{s.v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          {/* Right — release notes */}
          <div className="flex min-w-0 flex-col p-5 sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <TechLabel>RELEASE NOTES // MD</TechLabel>
              <a
                href={release.htmlUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-[10px] tracking-[0.14em] text-fog-500 transition-colors hover:text-gold-400"
              >
                VIEW ON GITHUB ↗
              </a>
            </div>
            <ReleaseNotes
              body={release.body}
              className="mt-3 max-h-96 flex-1 overflow-y-auto pr-2 md:max-h-[420px]"
            />
          </div>
        </div>

        {/* Assets — all files in this tag */}
        <div className="border-t border-graphite-700/70">
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
            <FileArchive className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
            <TechLabel className="text-fog-400">BUILD ARTIFACTS // {release.tagName}</TechLabel>
            <CopyChecksumsButton release={release} />
          </div>
          <AssetList release={release} />
          {mainApk ? (
            <QrDownload url={mainApk.downloadUrl} tagName={release.tagName} fileName={mainApk.name} />
          ) : null}
        </div>
      </div>
    </Reveal>
  )
}

/* ---------- Beta channel ---------- */

function BetaCard({ release }: { release: Release }) {
  const mainApk = release.apkAssets[0] ?? null
  return (
    <div className="relative flex flex-col border border-rust-600/40 bg-graphite-850/50 backdrop-blur-md">
      <div aria-hidden="true" className="h-0.5 hazard-stripe opacity-20" />
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-2xl font-bold tracking-tight text-fog-100 tnum">{release.tagName}</p>
          <div className="flex items-center gap-2">
            <span className="border border-rust-500/60 bg-rust-500/10 px-2 py-0.5 font-mono text-[9px] font-bold tracking-[0.18em] text-rust-400">
              PRE-RELEASE
            </span>
            <span className="font-mono text-[10px] tracking-wider text-fog-500">{formatDate(release.publishedAt)}</span>
          </div>
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-fog-300">{release.name}</p>
        {mainApk ? (
          <a
            href={mainApk.downloadUrl}
            target="_blank"
            rel="noreferrer noopener"
            download
            className="mt-4 flex h-11 w-full items-center justify-center gap-2.5 border border-rust-500/50 bg-rust-500/10 px-4 font-mono text-[11px] font-bold tracking-[0.1em] text-rust-300 transition-colors hover:border-rust-400 hover:bg-rust-500/20 hover:text-rust-400"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            BETA APK · {assetSize(mainApk).toUpperCase()}
          </a>
        ) : null}
        <div className="mt-3">
          <ReleaseNotes body={release.body} className="max-h-52 overflow-y-auto pr-1.5" />
        </div>
        <a
          href={release.htmlUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-3 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] text-fog-500 transition-colors hover:text-gold-400"
        >
          RELEASE PAGE <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      </div>
      <div className="mt-auto border-t border-graphite-700/60">
        <AssetList release={release} />
      </div>
    </div>
  )
}

function BetaChannel() {
  const { betaReleases } = useReleases()

  if (betaReleases.length === 0) {
    return (
      <Reveal delay={0.12}>
        <div className="flex flex-col items-start gap-2 border border-dashed border-graphite-600/80 bg-graphite-900/40 px-5 py-6 sm:flex-row sm:items-center sm:gap-5">
          <span className="flex h-10 w-10 items-center justify-center border border-graphite-600 font-mono text-[10px] text-fog-500">
            β
          </span>
          <div>
            <p className="font-mono text-[11px] font-semibold tracking-[0.18em] text-fog-300">
              BETA CHANNEL // STANDBY
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-fog-500">
              No pre-release builds are currently published. New betas (alpha, beta, RC tags) appear
              here automatically within minutes of being pushed to GitHub.
            </p>
          </div>
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 flex h-9 items-center gap-2 border border-graphite-600 px-3 font-mono text-[10px] tracking-[0.14em] text-fog-400 transition-colors hover:border-gold-600/70 hover:text-gold-300 sm:ml-auto sm:mt-0"
          >
            WATCH RELEASES <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </Reveal>
    )
  }

  return (
    <Reveal delay={0.12}>
      <div className="grid gap-4 md:grid-cols-2">
        {betaReleases.map((rel) => (
          <BetaCard key={rel.tagName} release={rel} />
        ))}
      </div>
      <p className="mt-3 flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-rust-400/80">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        PRE-RELEASE BUILDS — INSTALL ON TEST DEVICES ONLY
      </p>
    </Reveal>
  )
}

/* ---------- Older versions archive ---------- */

function ArchiveRow({ release }: { release: Release }) {
  const [open, setOpen] = useState(false)
  const apk = release.apkAssets[0] ?? null
  const totalDownloads = release.assets.reduce((s, a) => s + a.downloadCount, 0)

  return (
    <div className="group relative border border-graphite-700/70 bg-graphite-900/40 transition-colors hover:border-graphite-600/80">
      {/* cold-storage hatch — archived builds are shelved, not live */}
      <div
        aria-hidden="true"
        className="diag-stripes-cool pointer-events-none absolute inset-0 opacity-70"
      />
      <CornerFrame className="opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left transition-colors hover:bg-graphite-800/40 sm:flex-nowrap"
      >
        <span className="font-mono text-[13px] font-semibold text-fog-200 tnum">{release.tagName}</span>
        <span className="font-mono text-[10px] tracking-wider text-fog-500">{formatDate(release.publishedAt)}</span>
        <span className="font-mono text-[10px] tracking-wider text-fog-500 tnum">
          {release.assets.length} FILE{release.assets.length === 1 ? '' : 'S'}
        </span>
        {apk ? (
          <span className="font-mono text-[10px] tracking-wider text-fog-400 tnum">{assetSize(apk)}</span>
        ) : null}
        {totalDownloads > 0 ? (
          <span className="font-mono text-[10px] tracking-wider text-fog-500 tnum">
            {formatCount(totalDownloads)} DL
          </span>
        ) : null}
        <span className="ml-auto flex items-center gap-2">
          <span className="hidden font-mono text-[9px] tracking-[0.2em] text-fog-600 sm:inline">
            COLD STORAGE
          </span>
          <span className="hidden font-mono text-[9px] tracking-[0.2em] text-fog-600 sm:inline">
            {open ? 'COLLAPSE' : 'EXPAND'}
          </span>
          <ChevronDown
            className={cn('h-4 w-4 text-fog-400 transition-transform', open && 'rotate-180 text-gold-500')}
            aria-hidden="true"
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 border-t border-graphite-700/60 p-4 lg:grid-cols-[1.1fr_0.9fr]">
              <ReleaseNotes body={release.body} className="max-h-64 overflow-y-auto pr-2" />
              <div className="flex flex-col gap-2.5">
                <a
                  href={release.htmlUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex h-10 items-center justify-center gap-2 border border-graphite-600 px-4 font-mono text-[10.5px] font-semibold tracking-[0.12em] text-fog-200 transition-colors hover:border-steel-500/70 hover:text-steel-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  GITHUB RELEASE PAGE
                </a>
                {apk ? (
                  <a
                    href={apk.downloadUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    download
                    className="flex h-10 items-center justify-center gap-2 border border-gold-700/60 bg-gold-500/10 px-4 font-mono text-[10.5px] font-bold tracking-[0.12em] text-gold-400 transition-colors hover:border-gold-600 hover:bg-gold-500/20"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    DIRECT APK · {assetSize(apk).toUpperCase()}
                  </a>
                ) : null}
              </div>
            </div>
            <AssetList release={release} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Archive() {
  const { olderReleases } = useReleases()
  const [showAll, setShowAll] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement | null>(null)

  /* tokenized AND matching across tag, title and notes body */
  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) return olderReleases
    return olderReleases.filter((rel) => {
      const hay = `${rel.tagName} ${rel.name} ${rel.body ?? ''}`.toLowerCase()
      return tokens.every((tok) => hay.includes(tok))
    })
  }, [olderReleases, query])

  const searching = query.trim().length > 0
  /* search results ignore the 6-row cap — a match is a match */
  const visible = searching ? filtered : showAll ? olderReleases : olderReleases.slice(0, 6)

  if (olderReleases.length === 0) {
    return (
      <Reveal delay={0.16}>
        <p className="border border-dashed border-graphite-700/60 px-4 py-4 font-mono text-[10.5px] tracking-[0.14em] text-fog-600">
          ARCHIVE // NO PRIOR VERSIONS — THE CURRENT RELEASE IS THE FIRST PUBLISHED BUILD.
        </p>
      </Reveal>
    )
  }

  return (
    <Reveal delay={0.16}>
      {/* archive filter — only worth rendering once there is history to search */}
      {olderReleases.length > 3 ? (
        <div className="mb-3 flex items-center gap-3 border border-graphite-600/80 bg-graphite-850/60 px-3">
          <Search className="h-3.5 w-3.5 shrink-0 text-fog-500" aria-hidden="true" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape' && query) {
                e.preventDefault()
                setQuery('')
                searchRef.current?.focus()
              }
            }}
            placeholder="FILTER ARCHIVE — TAG, TITLE OR NOTES…"
            aria-label="Filter version archive by tag, title or release notes"
            aria-controls="archive-rows"
            autoComplete="off"
            spellCheck={false}
            className="h-10 w-full bg-transparent font-mono text-[11px] tracking-[0.06em] text-fog-100 placeholder:text-fog-600 focus:outline-none"
          />
          {searching ? (
            <span className="shrink-0 font-mono text-[9px] tracking-[0.14em] text-gold-500 tnum" aria-live="polite">
              {filtered.length}/{olderReleases.length}
            </span>
          ) : null}
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                searchRef.current?.focus()
              }}
              aria-label="Clear archive filter"
              className="flex h-7 w-7 shrink-0 items-center justify-center border border-graphite-600 text-fog-500 transition-colors hover:border-rust-500/60 hover:text-rust-400"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      ) : null}

      <div id="archive-rows" className="space-y-2.5">
        {visible.map((rel) => (
          <ArchiveRow key={rel.tagName} release={rel} />
        ))}
      </div>

      {searching && filtered.length === 0 ? (
        <p className="mt-3 border border-dashed border-graphite-700/60 px-4 py-4 font-mono text-[10.5px] tracking-[0.14em] text-fog-600">
          NO ARCHIVED VERSIONS MATCH “{query.trim().toUpperCase()}” — ALL WORDS MUST APPEAR IN TAG, TITLE OR NOTES.
        </p>
      ) : null}

      {!searching && olderReleases.length > 6 ? (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 border border-graphite-600 font-mono text-[10.5px] font-semibold tracking-[0.16em] text-fog-300 transition-colors hover:border-gold-600/70 hover:text-gold-300 sm:w-auto sm:px-8"
        >
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAll && 'rotate-180')} aria-hidden="true" />
          {showAll ? 'COLLAPSE ARCHIVE' : `SHOW ALL ${olderReleases.length} VERSIONS`}
        </button>
      ) : null}
    </Reveal>
  )
}

/* ---------- Loading skeleton ---------- */

function DownloadSkeleton() {
  return (
    <div className="border border-graphite-700/70 bg-graphite-850/40 p-5" aria-hidden="true">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-32 bg-graphite-700" />
        <div className="h-12 w-48 bg-graphite-700" />
        <div className="h-3 w-64 bg-graphite-800" />
        <div className="h-11 w-56 bg-graphite-700" />
        <div className="mt-6 space-y-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 bg-graphite-800" />
          ))}
        </div>
      </div>
      <p className="mt-4 font-mono text-[10px] tracking-[0.2em] text-fog-500">
        ESTABLISHING LINK TO GITHUB RELEASE PIPELINE…
      </p>
    </div>
  )
}

/* ---------- Section ---------- */

export default function Downloads() {
  const { latestStable, status } = useReleases()

  return (
    <section id="downloads" className="relative scroll-mt-24 overflow-hidden border-t border-graphite-700/60 bg-graphite-900/25 py-16 md:py-24">
      {/* oversized blueprint watermark numeral */}
      <span
        aria-hidden="true"
        className="section-watermark pointer-events-none absolute right-3 top-6 hidden text-[128px] opacity-45 md:block lg:right-8 lg:text-[160px]"
      >
        06
      </span>
      {/* backdrop */}
      <div aria-hidden="true" className="absolute inset-0">
        <div className="blueprint-grid absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
        <div className="absolute left-1/2 top-0 h-[280px] w-[620px] -translate-x-1/2 rounded-full bg-gold-500/[0.035] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] font-semibold tracking-[0.3em] text-gold-500">06</span>
            <span className="h-px flex-1 bg-gradient-to-r from-graphite-500 via-graphite-600 to-transparent" />
            <TechLabel>DISTRIBUTION</TechLabel>
          </div>
          <h2 className="mt-5 max-w-3xl font-display text-3xl font-semibold tracking-tight text-fog-100 sm:text-4xl md:text-5xl">
            Acquire the latest build
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-fog-400 md:text-base">
            Direct APK downloads with published SHA-256 checksums, every asset of every tag, and full
            GitHub release notes. This section syncs live — new stable, beta and older versions
            appear automatically the moment they are published.
          </p>
        </Reveal>

        <div className="mt-10 md:mt-14">
          <SyncStatusBar />

          <div className="mt-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rotate-45 bg-sage-500" aria-hidden="true" />
              <h3 className="font-mono text-[11px] font-bold tracking-[0.22em] text-fog-200">
                STABLE CHANNEL // RECOMMENDED
              </h3>
            </div>
            {latestStable ? <LatestPanel release={latestStable} /> : <DownloadSkeleton />}
          </div>

          <div className="mt-12">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rotate-45 bg-rust-500" aria-hidden="true" />
              <h3 className="font-mono text-[11px] font-bold tracking-[0.22em] text-fog-200">BETA CHANNEL</h3>
            </div>
            <BetaChannel />
          </div>

          <div className="mt-12">
            <div className="mb-3 flex items-center gap-3">
              <span className="h-2 w-2 rotate-45 bg-fog-500" aria-hidden="true" />
              <h3 className="font-mono text-[11px] font-bold tracking-[0.22em] text-fog-200">
                VERSION ARCHIVE // PRIOR BUILDS
              </h3>
            </div>
            {/* cold-storage hatch zone — visual cue that these builds are shelved */}
            <div className="relative">
              <Archive />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
