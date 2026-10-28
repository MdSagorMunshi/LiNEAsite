import { useEffect, useState } from 'react'
import { QrCode, ScanLine, ExternalLink } from 'lucide-react'

/* ============================================================
   LiNEA site — wireless transfer module (QR)
   Renders a QR of the primary APK download URL so the page
   open on a desktop can beam the file straight to a phone.
   The qrcode lib is dynamically imported — it never lands in
   the critical bundle. Light plate keeps scanner contrast.
   ============================================================ */

const QR_COLORS = { dark: '#08090b', light: '#eceef1' } as const

export default function QrDownload({
  url,
  tagName,
  fileName,
}: {
  url: string
  tagName: string
  fileName: string
}) {
  const [svg, setSvg] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let alive = true
    void (async () => {
      try {
        const QRCode = await import('qrcode')
        const markup = await QRCode.toString(url, {
          type: 'svg',
          margin: 1,
          errorCorrectionLevel: 'M',
          color: QR_COLORS,
        })
        if (alive) setSvg(markup)
      } catch {
        if (alive) setFailed(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [url])

  return (
    <div className="flex flex-col gap-4 border-t border-graphite-700/70 bg-graphite-900/50 px-4 py-4 sm:flex-row sm:items-center">
      {/* QR plate */}
      <div className="relative shrink-0 border border-graphite-600 bg-fog-100 p-2">
        <span aria-hidden="true" className="absolute -left-px -top-px h-3 w-3 border-l-2 border-t-2 border-gold-600" />
        <span aria-hidden="true" className="absolute -right-px -top-px h-3 w-3 border-r-2 border-t-2 border-gold-600" />
        <span aria-hidden="true" className="absolute -bottom-px -left-px h-3 w-3 border-b-2 border-l-2 border-gold-600" />
        <span aria-hidden="true" className="absolute -bottom-px -right-px h-3 w-3 border-b-2 border-r-2 border-gold-600" />
        <div className="flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28" aria-hidden="true">
          {svg ? (
            <div
              className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
              // SVG is generated locally from the release asset URL — no third-party markup.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : failed ? (
            <QrCode className="h-8 w-8 text-graphite-500" />
          ) : (
            <div className="h-full w-full animate-pulse bg-graphite-300" />
          )}
        </div>
      </div>

      {/* Copy */}
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-mono text-[10.5px] font-bold tracking-[0.2em] text-fog-200">
          <ScanLine className="h-3.5 w-3.5 text-gold-500" aria-hidden="true" />
          WIRELESS TRANSFER // SCAN TO ACQUIRE
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-fog-400">
          Point your phone&apos;s camera at the plate to pull the{' '}
          <span className="font-mono font-semibold text-fog-200">{tagName}</span> APK directly — no
          cable, no account, no middleman.
        </p>
        <p className="mt-1 truncate font-mono text-[10px] tracking-wide text-fog-600" title={fileName}>
          PAYLOAD // {fileName}
        </p>
      </div>

      {/* Alt action */}
      <a
        href={url}
        target="_blank"
        rel="noreferrer noopener"
        download
        className="flex h-10 shrink-0 items-center gap-2 border border-graphite-600 px-3.5 font-mono text-[9.5px] font-semibold tracking-[0.12em] text-fog-300 transition-colors hover:border-gold-600/70 hover:text-gold-300"
        aria-label={`Open ${fileName} download`}
      >
        OPEN URL
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
      </a>
    </div>
  )
}
