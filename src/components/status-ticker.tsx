import { useReleases } from '@/hooks/use-releases'
import { RELEASES_URL } from '@/lib/constants'
import { assetSize, formatDate } from '@/lib/utils'

/* Corporate status ticker — live liquid telemetry marquee */

function buildItems(latestTag: string | null, published: string | null, size: string | null): string[] {
  const items = [
    'TELECOM RUNTIME // ACTIVE',
    latestTag ? `STABLE RELEASE // ${latestTag}` : 'STABLE RELEASE // v2.7.0',
    'CRYSTAL OPTICS // AGSL SHADER',
  ]
  if (published) items.push(`DEPLOYED // ${formatDate(published)}`)
  items.push(
    `BINARY PAYLOAD // ${size || '30.0 MB'}`,
    'SHA-256 DIGEST // VERIFIED',
    'SECURITY LEVEL // ZERO CLOUD · ZERO TELEMETRY',
    'VAULT ARCHITECTURE // HARDWARE KEYSTORE AES-256',
    'PLATFORM BASELINE // ANDROID 13+ (TARGET API 37)',
    'LICENSING // APACHE-2.0 FOSS',
  )
  return items
}

export default function StatusTicker() {
  const { latestStable, latestApk } = useReleases()
  const items = buildItems(
    latestStable?.tagName ?? 'v2.7.0',
    latestStable?.publishedAt ?? null,
    latestApk ? assetSize(latestApk) : '30.0 MB',
  )

  const row = (ariaHidden: boolean) => (
    <div className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="flex items-center">
          <span className="px-3 font-mono text-[10px] tracking-[0.2em] text-fog-300">{item}</span>
          <span className="mx-4 text-[7px] text-sapphire-400" aria-hidden="true">
            ◆
          </span>
        </span>
      ))}
    </div>
  )

  return (
    <a
      href={RELEASES_URL}
      target="_blank"
      rel="noreferrer noopener"
      className="group relative block overflow-hidden border-y border-white/10 bg-graphite-900/50 py-3 backdrop-blur-xl"
      aria-label="Release telemetry — opens GitHub releases"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-graphite-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-graphite-950 to-transparent" />
      <div className="flex w-max animate-ticker group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </a>
  )
}
