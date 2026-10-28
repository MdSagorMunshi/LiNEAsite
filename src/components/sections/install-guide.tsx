import { ArrowRight, ArrowUpRight, ChevronRight, Download, PackageOpen, PhoneCall, SlidersHorizontal, Terminal } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useReleases } from '@/hooks/use-releases'
import { Reveal, SectionShell, TechLabel } from '@/components/primitives'
import { DEV_GUIDE_URL, RELEASES_URL } from '@/lib/constants'
import { assetSize, cn } from '@/lib/utils'

/* ============================================================
   SYS.08 — Deployment procedure (install guide)
   End-user flow only: download → allow & install → default
   dialer → configure. Developer workflows (toolchain, Gradle,
   device deployment) live in BUILD.md in the GitHub repo.
   ============================================================ */

interface Step {
  icon: LucideIcon
  number: string
  title: string
  description: string
  /** Action / settings breadcrumb rendered as mono pills */
  path?: string[]
  /** Small detail chips pinned to the card footer */
  chips?: string[]
  /** Step 01 renders the live release panel instead of static chips */
  live?: boolean
}

const STEPS: Step[] = [
  {
    icon: Download,
    number: '01',
    title: 'Download the APK',
    description:
      'Get the latest stable build from the Downloads bay — one tap on the direct link, or scan the QR code with a second device. Optional but recommended: check the published SHA-256 checksum before installing.',
    live: true,
  },
  {
    icon: PackageOpen,
    number: '02',
    title: 'Allow & install',
    description:
      'Tap the downloaded file from the notification shade or your Files app. Android will ask you to allow installs from that source once — a standard safety step for any app outside the Play Store — then tap Install.',
    path: ['OPEN FILE', 'ALLOW FROM THIS SOURCE', 'INSTALL'],
    chips: ['ONE-TIME TOGGLE', '≈ 30 SECONDS'],
  },
  {
    icon: PhoneCall,
    number: '03',
    title: 'Make LiNEA your dialer',
    description:
      'Launch LiNEA once and confirm the prompt to take over the Phone role. Calls, contacts and T9 search move over instantly — and you can switch back to your old dialer at any time from Android\u2019s Default apps settings.',
    path: ['SETTINGS', 'APPS', 'DEFAULT APPS', 'PHONE APP', 'LiNEA'],
    chips: ['REVERSIBLE ANY TIME', 'ZERO MIGRATION'],
  },
  {
    icon: SlidersHorizontal,
    number: '04',
    title: 'Set up & harden',
    description:
      'Grant Phone and Contacts access when asked, pick your default SIM slot, then dial as usual. Optionally arm the call-screening engine and Quiet Hours for full sovereignty over who reaches you.',
    chips: ['PHONE + CONTACTS', 'DUAL SIM', 'QUIET HOURS'],
  },
]

/* ---------- Step 01: live release panel (tag · size · direct CTA) ---------- */

function DownloadPanel() {
  const { latestApk, latestStable } = useReleases()
  const ready = latestApk !== null
  const href = latestApk?.downloadUrl ?? RELEASES_URL

  return (
    <div className="mt-4 border-t border-graphite-700/60 pt-4">
      <ul className="flex flex-wrap gap-1.5" aria-label="Latest release details">
        {latestStable ? (
          <li className="flex items-center gap-1.5 rounded-[2px] border border-sage-600/50 bg-sage-500/10 px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-sage-300">
            <span className="h-1 w-1 rounded-full bg-sage-400" aria-hidden="true" />
            {latestStable.tagName} · STABLE
          </li>
        ) : null}
        {latestApk ? (
          <>
            <li className="rounded-[2px] border border-graphite-600 bg-graphite-950/60 px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-fog-400">
              {assetSize(latestApk)}
            </li>
            {latestApk.abi ? (
              <li className="rounded-[2px] border border-graphite-600 bg-graphite-950/60 px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-fog-400">
                {latestApk.abi.toUpperCase()}
              </li>
            ) : null}
          </>
        ) : (
          <li className="rounded-[2px] border border-graphite-600 bg-graphite-950/60 px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-fog-500">
            FETCHING RELEASE DATA…
          </li>
        )}
      </ul>
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="group/cta mt-3 flex items-center justify-between gap-3 rounded-[3px] border border-gold-500/50 bg-gold-500/10 px-4 py-3 font-mono text-[11px] font-semibold tracking-[0.14em] text-gold-300 transition-colors duration-200 hover:border-gold-500 hover:bg-gold-500/20 hover:text-gold-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-500"
      >
        <span className="flex items-center gap-2">
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {ready && latestStable ? `GET ${latestStable.tagName} NOW` : 'GET LATEST RELEASE'}
        </span>
        <ArrowRight
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover/cta:translate-x-1"
          aria-hidden="true"
        />
      </a>
    </div>
  )
}

/* ---------- Settings-path breadcrumb pills ---------- */

function PathTrail({ path }: { path: string[] }) {
  return (
    <ol
      className="mt-4 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 border-t border-graphite-700/60 pt-4"
      aria-label="On-device path"
    >
      {path.map((segment, i) => (
        <li key={segment} className="flex items-center gap-1.5">
          <span
            className={cn(
              'rounded-[2px] border px-2 py-1 font-mono text-[9px] tracking-[0.12em]',
              i === path.length - 1
                ? 'border-gold-500/50 bg-gold-500/10 text-gold-300'
                : 'border-graphite-600 bg-graphite-950/60 text-fog-400',
            )}
          >
            {segment}
          </span>
          {i < path.length - 1 ? (
            <ChevronRight className="h-3 w-3 shrink-0 text-fog-600" aria-hidden="true" />
          ) : null}
        </li>
      ))}
    </ol>
  )
}

/* ---------- Static detail chips ---------- */

function ChipRow({ chips }: { chips: string[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-graphite-700/60 pt-4" aria-label="Step facts">
      {chips.map((chip) => (
        <li
          key={chip}
          className="rounded-[2px] border border-graphite-600 bg-graphite-950/60 px-2 py-1 font-mono text-[9px] tracking-[0.14em] text-fog-500"
        >
          {chip}
        </li>
      ))}
    </ul>
  )
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon
  return (
    <div className="relative">
      {/* connector: thin rail + arrow badge between cards (xl only) */}
      {index < STEPS.length - 1 && (
        <>
          <span
            aria-hidden="true"
            className="absolute right-[-24px] top-1/2 hidden h-px w-6 -translate-y-1/2 bg-graphite-600 xl:block"
          />
          <span
            aria-hidden="true"
            className="absolute -right-[26px] top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-[2px] border border-graphite-600 bg-graphite-900 text-gold-500 xl:flex"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </>
      )}

      <article className="group relative flex h-full flex-col rounded-[3px] border border-graphite-700 bg-graphite-900/60 p-5 transition-[border-color,background-color,transform] duration-300 hover:-translate-y-1 hover:border-graphite-600 hover:bg-graphite-850/70">
        <span
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-gold-500/70 transition-transform duration-300 group-hover:scale-x-100"
        />
        <div className="flex items-start justify-between">
          <span className="tnum font-mono text-4xl font-semibold leading-none tracking-tight text-gold-500">
            {step.number}
          </span>
          <span className="flex h-10 w-10 items-center justify-center rounded-[2px] border border-graphite-600 bg-graphite-850 text-gold-500 transition-colors group-hover:border-gold-500/60">
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
        </div>
        <h3 className="mt-5 font-display text-base font-semibold tracking-tight text-fog-100">
          {step.title}
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-fog-400">{step.description}</p>
        <div className="mt-auto">
          {step.live ? <DownloadPanel /> : null}
          {step.path ? <PathTrail path={step.path} /> : null}
          {step.chips ? <ChipRow chips={step.chips} /> : null}
        </div>
      </article>
    </div>
  )
}

/* ---------- Developer-track pointer (BUILD.md lives in the repo) ---------- */

function DevTrackCallout() {
  return (
    <a
      href={DEV_GUIDE_URL}
      target="_blank"
      rel="noreferrer noopener"
      className="group/dev flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[3px] border border-graphite-700 bg-graphite-950/60 px-5 py-4 transition-colors duration-200 hover:border-steel-500/60 hover:bg-graphite-900/70"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[2px] border border-graphite-600 bg-graphite-850 text-steel-300 transition-colors group-hover/dev:border-steel-500/60">
        <Terminal className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-mono text-[10px] font-semibold tracking-[0.18em] text-steel-300">
          DEVELOPER TRACK
        </span>
        <span className="mt-1 block text-[13px] leading-relaxed text-fog-400">
          Building from source, running a debug build or deploying to a device from your workstation?
          The full developer workflow — toolchain, Gradle and device deployment — lives in{' '}
          <span className="font-mono text-[12px] text-fog-200">BUILD.md</span> in the GitHub repo.
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.18em] text-fog-400 transition-colors group-hover/dev:text-steel-300">
        OPEN GUIDE
        <ArrowUpRight
          className="h-3.5 w-3.5 transition-transform duration-200 group-hover/dev:-translate-y-0.5 group-hover/dev:translate-x-0.5"
          aria-hidden="true"
        />
      </span>
    </a>
  )
}

export default function InstallGuide() {
  return (
    <SectionShell
      id="install"
      index="08"
      kicker="DEPLOYMENT PROCEDURE"
      title="From APK to default dialer in four steps"
      description="No Play Store listing — LiNEA ships as a signed APK straight from GitHub Releases. Four steps on the device itself; nothing to root, nothing to migrate."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        {STEPS.map((step, i) => (
          <Reveal key={step.number} delay={(i % 4) * 0.08} className="h-full min-w-0">
            <StepCard step={step} index={i} />
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.15}>
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-graphite-700/60 pt-6">
          <TechLabel className="text-fog-600">EST. TIME // UNDER 3 MINUTES</TechLabel>
          <span className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-fog-500">
            <span
              className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-sage-500"
              aria-hidden="true"
            />
            NO ROOT · NO CLOUD ACCOUNT · NO DATA MIGRATION REQUIRED
          </span>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="mt-4">
          <DevTrackCallout />
        </div>
      </Reveal>
    </SectionShell>
  )
}
