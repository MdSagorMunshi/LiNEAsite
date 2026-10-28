import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Download, FileArchive, FileText, Package } from 'lucide-react'
import type { ReleaseAsset } from '@/types'
import { toast } from '@/components/toaster'
import { cn, formatCount, shortSha, truncateMiddle } from '@/lib/utils'

/* ============================================================
   LiNEA site — release asset rows (multi-APK per tag support)
   ============================================================ */

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`${label}: ${value}. Click to copy`}
      title={`Copy ${label}`}
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center border transition-colors',
        copied
          ? 'border-sage-600/70 text-sage-400'
          : 'border-graphite-600 text-fog-500 hover:border-gold-600/70 hover:text-gold-400',
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
    </button>
  )
}

function KindIcon({ kind }: { kind: ReleaseAsset['kind'] }) {
  if (kind === 'apk') return <FileArchive className="h-4 w-4 text-gold-500" aria-hidden="true" />
  if (kind === 'checksum') return <FileText className="h-4 w-4 text-fog-500" aria-hidden="true" />
  return <Package className="h-4 w-4 text-fog-500" aria-hidden="true" />
}

export function AssetRow({ asset, variant = 'compact' }: { asset: ReleaseAsset; variant?: 'compact' | 'full' }) {
  const isApk = asset.kind === 'apk'
  return (
    <div
      className={cn(
        'group flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-graphite-700/60 px-4 py-3 transition-colors sm:flex-nowrap',
        isApk && 'bg-graphite-800/25 hover:bg-graphite-800/50',
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-graphite-600/80 bg-graphite-900/70">
        <KindIcon kind={asset.kind} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-[12px] font-medium text-fog-200" title={asset.name}>
          {asset.name}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] tracking-wide text-fog-500">
          {asset.abi ? (
        <span className="border border-steel-600/60 bg-steel-600/10 px-1.5 py-px text-[9px] text-steel-300">
          {asset.abi.toUpperCase()}
        </span>
          ) : null}
          {asset.label ? <span className="text-fog-600">{asset.label.toUpperCase()}</span> : null}
          <span className="tnum text-fog-400">
            {asset.sizeLabel ?? (asset.size > 0 ? `${(asset.size / 1024 / 1024).toFixed(1)} MB` : '—')}
          </span>
          {asset.downloadCount > 0 ? (
            <span className="tnum">{formatCount(asset.downloadCount)} DL</span>
          ) : null}
        </p>
      </div>

      {asset.sha256 ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <code className="hidden font-mono text-[10px] tracking-wider text-fog-500 md:block" title={asset.sha256}>
            SHA256 {shortSha(asset.sha256)}
          </code>
          <CopyButton value={asset.sha256} label="SHA-256 checksum" />
        </div>
      ) : null}

      <a
        href={asset.downloadUrl}
        target="_blank"
        rel="noreferrer noopener"
        download
        aria-label={`Download ${asset.name}`}
        className={cn(
          'flex h-11 shrink-0 items-center gap-2 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors',
          isApk
            ? 'bg-gold-500 text-graphite-950 hover:bg-gold-400'
            : 'border border-graphite-600 text-fog-300 hover:border-fog-500 hover:text-fog-100',
          variant === 'compact' && 'h-9 px-3 text-[10px]',
        )}
      >
        <Download className={cn(isApk ? 'h-3.5 w-3.5' : 'h-3 w-3')} aria-hidden="true" />
        {isApk ? 'APK' : 'FILE'}
      </a>
    </div>
  )
}

export function MultiApkNotice({ count, tag }: { count: number; tag: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-t border-gold-700/40 bg-gold-500/[0.06] px-4 py-2.5">
      <span className="h-1.5 w-1.5 rotate-45 bg-gold-500" aria-hidden="true" />
      <p className="font-mono text-[10.5px] tracking-[0.1em] text-gold-300">
        {count} APK VARIANTS PUBLISHED IN {tag} — SELECT THE BUILD MATCHING YOUR DEVICE ABI
      </p>
    </div>
  )
}

export function AssetList({ release }: { release: { tagName: string; apkAssets: ReleaseAsset[]; assets: ReleaseAsset[] } }) {
  const apkCount = release.apkAssets.length
  const digested = release.assets.filter((a) => a.sha256)

  const copyManifest = async () => {
    // exactly the SHA256SUMS.txt format: digest + two spaces + filename
    const manifest = digested.map((a) => `${a.sha256}  ${a.name}`).join('\n')
    if (!manifest) return
    try {
      await navigator.clipboard.writeText(manifest)
      toast(`MANIFEST COPIED — ${digested.length} DIGEST${digested.length === 1 ? '' : 'S'} · ${release.tagName}`, {
        tone: 'sage',
        detail: 'sha256sum-compatible lines on your clipboard',
      })
    } catch {
      toast('CLIPBOARD UNAVAILABLE — COPY BLOCKED BY BROWSER', { tone: 'rust' })
    }
  }

  return (
    <div className="border-t border-graphite-700/70">
      {apkCount > 1 ? <MultiApkNotice count={apkCount} tag={release.tagName} /> : null}
      {release.assets.map((asset) => (
        <AssetRow key={asset.name} asset={asset} />
      ))}
      {digested.length > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-graphite-700/60 bg-graphite-850/40 px-4 py-2">
          <p className="min-w-0 font-mono text-[9.5px] tracking-[0.08em] text-fog-500">
            {digested.length} PUBLISHED DIGESTS — ONE CLIPBOARD ACTION
          </p>
          <button
            type="button"
            onClick={copyManifest}
            className="flex h-8 shrink-0 items-center gap-1.5 border border-graphite-600 px-2.5 font-mono text-[9px] font-semibold tracking-[0.16em] text-fog-400 transition-colors hover:border-gold-600/70 hover:text-gold-300"
          >
            <FileText className="h-3 w-3" aria-hidden="true" />
            COPY SHA256SUMS
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function ShaLine({ asset }: { asset: ReleaseAsset | null }) {
  if (!asset?.sha256) return null
  return (
    <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-fog-500">
      <span className="text-fog-600">SHA-256</span>
      <code className="tnum truncate" title={asset.sha256}>
        {truncateMiddle(asset.sha256, 26)}
      </code>
      <CopyButton value={asset.sha256} label="SHA-256 checksum" />
    </div>
  )
}
