import { CloudOff, EyeOff, LockKeyhole, Scale, ShieldCheck, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CornerFrame, Reveal, SectionShell, TechLabel, LiquidGlassCard } from '@/components/primitives'
import { APP_META } from '@/lib/constants'

/* ============================================================
   SYS.02 — Enterprise Overview & Zero-Cloud Governance
   Corporate architecture, specifications & compliance
   ============================================================ */

interface ManifestoItem {
  icon: LucideIcon
  index: string
  title: string
  description: string
  badge: string
}

const MANIFESTO: ManifestoItem[] = [
  {
    icon: CloudOff,
    index: 'SEC-01',
    title: 'Zero Cloud Architecture',
    description:
      'Smart T9 prefix indexing, caller identification, MMI routing, and call screening execute 100% locally on-device. No telemetry servers, ever.',
    badge: '100% LOCAL',
  },
  {
    icon: EyeOff,
    index: 'SEC-02',
    title: 'Zero Telemetry & Egress',
    description:
      'Zero analytics SDKs, zero crash-reporting trackers, zero background network pings, and zero ad identifiers bundled into the distribution binary.',
    badge: '0 TRACE',
  },
  {
    icon: LockKeyhole,
    index: 'SEC-03',
    title: 'Hardware Keystore AES-256',
    description:
      'Encrypted private contacts, call notes, and vault records are cryptographically sealed with hardware-backed AES-256-GCM anchored in the Android Keystore.',
    badge: 'AES-256-GCM',
  },
  {
    icon: Scale,
    index: 'SEC-04',
    title: 'Auditable FOSS (Apache 2.0)',
    description:
      'Total cryptographic transparency. Independent security researchers can audit every permission, every line of Kotlin, and verify deterministic builds.',
    badge: 'APACHE 2.0',
  },
]

const SPEC_ROWS: { label: string; value: string }[] = [
  { label: 'PACKAGE ID', value: APP_META.packageName },
  { label: 'TARGET OS', value: APP_META.target },
  { label: 'MINIMUM BASELINE', value: APP_META.minSdk },
  { label: 'TOOLCHAIN', value: APP_META.language },
  { label: 'DISPLAY ENGINE', value: 'AGSL Liquid Glass · Jetpack Compose' },
  { label: 'ARCHITECTURE', value: 'MVI · Hilt DI · Room SQLite · Telecom' },
  { label: 'LICENSE', value: 'Apache 2.0 (Open Source)' },
  { label: 'MAINTAINER', value: APP_META.developer },
]

export default function About() {
  return (
    <SectionShell
      id="about"
      index="02"
      kicker="ENTERPRISE SOVEREIGNTY"
      title={
        <span>
          A sovereign cellular dialer, <span className="text-gradient-corporate">built for zero-trust.</span>
        </span>
      }
      description="Stock Android dialers routinely upload communications metadata, contact lists, and telemetry to cloud servers. LiNEA returns complete sovereignty to your device."
    >
      {/* Two-column layout: Executive Narrative + Spec Sheet */}
      <div className="grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
        {/* LEFT — Narrative */}
        <Reveal>
          <div className="space-y-4 text-sm leading-relaxed text-fog-300 md:text-[15px]">
            <div className="flex items-center gap-2 font-mono text-[11px] text-sapphire-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>NATIVE ANDROID 17 TELECOM STACK</span>
            </div>
            <p>
              <strong className="text-white">LiNEA</strong> (
              <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs text-sapphire-300">
                com.ryanshelby.linea
              </code>
              ) is an enterprise-grade cellular dialer engineered from the ground up for modern Android.
              It anchors directly into the operating system&rsquo;s native telephony framework —{' '}
              <code className="font-mono text-xs text-fog-200">InCallService</code>,{' '}
              <code className="font-mono text-xs text-fog-200">ConnectionService</code>, and{' '}
              <code className="font-mono text-xs text-fog-200">CallScreeningService</code> — serving as a
              sovereign drop-in replacement for proprietary stock dialers.
            </p>
            <p>
              Whether handling genuine dual-SIM 5G carrier handoffs, real DTMF acoustic synthesis, multi-call conferencing,
              or MMI carrier network codes (*21*, *33*), LiNEA enforces a strict <strong>Zero-Cloud Guarantee</strong>.
              All contact matching, regex call screening, and haptic feedback profiles run purely on local hardware.
            </p>
            <p className="text-fog-400">
              With the <strong>v2.7.0 Crystal update</strong>, the platform elevates to Android 13+ as its minimum baseline,
              delivering hardware-accelerated AGSL runtime shaders for fluid liquid-glass refraction without impacting battery life.
            </p>
          </div>
        </Reveal>

        {/* RIGHT — Corporate Spec Sheet */}
        <Reveal delay={0.1}>
          <div className="liquid-glass-card relative rounded-2xl border border-white/15 p-6 backdrop-blur-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sage-400" />
                <span className="font-mono text-xs font-semibold tracking-wider text-fog-200">
                  SPEC.SHEET // LI-2.7.0
                </span>
              </div>
              <span className="flex items-center gap-1.5 rounded-full border border-sage-500/30 bg-sage-950/40 px-2.5 py-0.5 font-mono text-[10px] text-sage-300">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-sage-500" />
                VERIFIED RELEASE
              </span>
            </div>

            <dl className="mt-3 divide-y divide-white/5">
              {SPEC_ROWS.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between py-2.5">
                  <dt className="font-mono text-[10px] uppercase tracking-wider text-fog-500">
                    {row.label}
                  </dt>
                  <dd className="tnum font-mono text-xs font-medium text-fog-200 text-right">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>

      {/* Zero-Cloud Privacy Manifesto Matrix */}
      <div className="mt-16 md:mt-20">
        <Reveal>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/10 pb-4">
            <span className="font-mono text-[11px] font-bold tracking-[0.25em] text-sapphire-400">
              SECURITY PROTOCOLS
            </span>
            <h3 className="font-display text-xl font-bold tracking-tight text-white md:text-2xl">
              Zero-Cloud Privacy Manifesto
            </h3>
            <span className="ml-auto hidden font-mono text-[10px] text-fog-500 sm:block">
              4 VERIFIED PILLARS // NON-NEGOTIABLE
            </span>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MANIFESTO.map((item, i) => {
            const Icon = item.icon
            return (
              <Reveal key={item.index} delay={(i % 4) * 0.08} className="h-full">
                <div className="liquid-glass-card group relative flex h-full flex-col justify-between rounded-xl border border-white/10 p-5 transition-all hover:border-sapphire-400/40 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(56,189,248,0.12)]">
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-sapphire-400 transition-colors group-hover:border-sapphire-400/50 group-hover:bg-sapphire-500/10">
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-fog-400">
                        {item.badge}
                      </span>
                    </div>
                    <h4 className="mt-4 font-display text-base font-bold text-white">
                      {item.title}
                    </h4>
                    <p className="mt-2 text-xs leading-relaxed text-fog-300">
                      {item.description}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 font-mono text-[9px] text-fog-500">
                    {item.index}
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </SectionShell>
  )
}
