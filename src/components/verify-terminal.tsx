import { useEffect, useRef, useState } from 'react'
import { Check, Copy, FileCheck2, TerminalSquare } from 'lucide-react'
import type { ReleaseAsset } from '@/types'
import { cn } from '@/lib/utils'

/* ============================================================
   LiNEA site — integrity verification terminal
   CRT-styled block: sha256sum command + expected digest.
   ============================================================ */

function TermCopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
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
      onClick={onCopy}
      aria-label={`${label}: ${value}. Click to copy`}
      title={`Copy ${label}`}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center border transition-colors',
        copied
          ? 'border-sage-600/70 text-sage-400'
          : 'border-graphite-600/80 text-fog-500 hover:border-gold-600/70 hover:text-gold-400',
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <Copy className="h-3.5 w-3.5" aria-hidden="true" />}
    </button>
  )
}

export default function VerifyTerminal({ asset }: { asset: ReleaseAsset | null }) {
  if (!asset) return null
  const command = `sha256sum ${asset.name}`

  return (
    <div className="relative overflow-hidden border border-graphite-600/90 bg-graphite-950">
      {/* CRT scanline film */}
      <div aria-hidden="true" className="scanlines pointer-events-none absolute inset-0 z-10 opacity-[0.14]" />

      {/* terminal chrome */}
      <div className="flex items-center gap-2 border-b border-graphite-700/70 bg-graphite-850/90 px-3 py-2">
        <span className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rotate-45 border border-sage-500/70 bg-sage-500/30" />
          <span className="h-2 w-2 rotate-45 border border-gold-500/70 bg-gold-500/30" />
          <span className="h-2 w-2 rotate-45 border border-rust-500/70 bg-rust-500/30" />
        </span>
        <span className="ml-1 flex items-center gap-1.5 font-mono text-[9px] tracking-[0.2em] text-fog-400">
          <TerminalSquare className="h-3 w-3 text-gold-500" aria-hidden="true" />
          INTEGRITY CHECK // SHA-256
        </span>
        <span className="ml-auto font-mono text-[9px] tracking-[0.16em] text-fog-600">POSIX SHELL</span>
      </div>

      {/* terminal body */}
      <div className="relative p-4 font-mono text-[11px] leading-relaxed">
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-gold-500" aria-hidden="true">
            $
          </span>
          <code className="min-w-0 flex-1 break-all text-fog-200">{command}</code>
          <TermCopyButton value={command} label="verify command" />
        </div>
        <p className="mt-2 break-all text-fog-400">
          <span className="text-fog-600">expected </span>
          <span className="tnum text-sage-300">{asset.sha256 ?? '—'}</span>
        </p>
        <p className="mt-1.5 text-fog-600">
          <span aria-hidden="true">#</span> digest must match the published checksum exactly — abort
          install on mismatch
        </p>
        <p className="mt-2 flex items-center gap-1.5 text-fog-500">
          <span className="text-gold-500" aria-hidden="true">
            &gt;
          </span>
          VERIFICATION STATUS: AWAITING LOCAL RUN
          <span className="ml-1 inline-block h-3.5 w-2 animate-blink bg-gold-500/80" aria-hidden="true" />
        </p>
      </div>

      {/* footer strip — checksums file hint */}
      <div className="flex items-center gap-2 border-t border-graphite-700/70 bg-graphite-900/50 px-4 py-2">
        <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-fog-500" aria-hidden="true" />
        <p className="min-w-0 font-mono text-[9.5px] leading-snug tracking-[0.06em] text-fog-500">
          A SHA256SUMS.txt manifest ships with every tag — find it in the build artifacts below.
        </p>
      </div>
    </div>
  )
}
