import { useState } from 'react'
import {
  Activity,
  AudioLines,
  BookUser,
  Cpu,
  Globe,
  Hash,
  Image,
  LockKeyhole,
  Phone,
  Search,
  ShieldX,
  Smartphone,
  Vibrate,
  Voicemail,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Reveal, SectionShell, TechLabel, LiquidPill } from '@/components/primitives'
import { cn } from '@/lib/utils'

/* ============================================================
   SYS.04 — Capability Matrix (14 Subsystems)
   Categorized liquid-glass cards with specular highlights
   ============================================================ */

type Category = 'all' | 'telecom' | 'security' | 'glass'

interface Feature {
  icon: LucideIcon
  title: string
  category: 'telecom' | 'security' | 'glass'
  description: string
  tag: string
}

const FEATURES: Feature[] = [
  {
    icon: Phone,
    title: 'Native Cellular Calling',
    category: 'telecom',
    description:
      'Default system dialer with hardware audio switching (earpiece, speaker, Bluetooth SCO, wired), low-latency DTMF synthesis and 3-way conference merging.',
    tag: 'TELECOM API 37',
  },
  {
    icon: Search,
    title: 'Instantaneous T9 Search',
    category: 'telecom',
    description:
      'Sub-millisecond reverse prefix index across names and organizations; matches digits and contacts simultaneously with zero frame drops.',
    tag: '< 0.5ms LATENCY',
  },
  {
    icon: Sparkles,
    title: 'AGSL Liquid Glass Engine',
    category: 'glass',
    description:
      'Real-time signed distance field refraction, specular light reflections, and backdrop blur with 0% idle CPU drain on Android 13+.',
    tag: 'v2.7.0 CRYSTAL',
  },
  {
    icon: BookUser,
    title: 'Deep Contact Management',
    category: 'telecom',
    description:
      'Dual-write sync to ContactsContract and local Room DB; thorough deep-purge deletion and per-contact SIM affinity rules.',
    tag: 'DUAL SYNC',
  },
  {
    icon: ShieldX,
    title: 'Smart Call Screening',
    category: 'security',
    description:
      'Intercept spam, hidden and international calls before the device rings. Repeated-call emergency override — 3 calls in 5 min bypasses filters.',
    tag: 'DETERMINISTIC',
  },
  {
    icon: Cpu,
    title: 'Dual SIM Intelligence',
    category: 'telecom',
    description:
      'Live carrier telemetry with cellular technology (5G/LTE) and dBm signal strength, deterministic slot resolution and cancelable auto-dial countdown.',
    tag: '5G TELEMETRY',
  },
  {
    icon: LockKeyhole,
    title: 'Hardware Keystore Vault',
    category: 'security',
    description:
      'PIN-protected safe for confidential contacts and sensitive call notes, sealed with AES-256-GCM in the hardware keystore.',
    tag: 'AES-256-GCM',
  },
  {
    icon: AudioLines,
    title: 'Call Recording & Waveforms',
    category: 'security',
    description:
      'Local recordings in protected app storage with real-time amplitude metering and playback scrub — zero cloud uploads.',
    tag: 'LOCAL STORAGE',
  },
  {
    icon: Activity,
    title: 'Live Audio Waveform',
    category: 'glass',
    description:
      '32-bar fluid liquid glass visualizer reacting to call state: active cadence, muted flatline, hold pulse, recording marker.',
    tag: '32-BAND METER',
  },
  {
    icon: Image,
    title: 'Frosted Contact Posters',
    category: 'glass',
    description:
      'Full-screen blurred backdrops with breathing scale animation and an in-memory bitmap cache for zero-latency transitions.',
    tag: 'DYNAMIC OPTICS',
  },
  {
    icon: Vibrate,
    title: 'Haptic Dialpad Profiles',
    category: 'glass',
    description:
      'Four selectable tactile profiles — Titanium Glass, Mechanical Relay, Stealth, and Classic — with tuned clicks and DTMF tones.',
    tag: 'HAPTIC ENGINE',
  },
  {
    icon: Smartphone,
    title: 'Flip to Silence & Wave',
    category: 'telecom',
    description:
      'Face-down and proximity-wave gesture silencing with a battery-safe sensor lifecycle that only registers while the ringer plays.',
    tag: 'SENSOR FUSION',
  },
  {
    icon: Globe,
    title: 'Country Call Blocking',
    category: 'security',
    description:
      'Powered by libphonenumber with whitelist/blacklist modes, country dialing disambiguation (+1, +7) and domestic bypass.',
    tag: 'E.164 FILTER',
  },
  {
    icon: Hash,
    title: 'Carrier MMI Codes',
    category: 'telecom',
    description:
      'Built-in management for call forwarding (*21*, *61*) and call barring (*33*, *35*) directly through hardware cellular channels.',
    tag: 'MMI CODES',
  },
]

export default function Features() {
  const [activeTab, setActiveTab] = useState<Category>('all')

  const filtered = FEATURES.filter((f) => activeTab === 'all' || f.category === activeTab)

  return (
    <SectionShell
      id="features"
      index="04"
      kicker="CAPABILITY MATRIX"
      title={
        <span>
          14 Sovereign Subsystems. <span className="text-gradient-corporate">Zero Cloud.</span>
        </span>
      }
      description="Every capability runs 100% locally on your hardware — verified deterministic architecture."
    >
      {/* Category Filter Pills */}
      <div className="mb-8 flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'all', label: 'All Subsystems (14)' },
            { id: 'telecom', label: 'Telephony & Cellular' },
            { id: 'security', label: 'Security & Keystore' },
            { id: 'glass', label: 'Liquid Glass & Optics' },
          ] as { id: Category; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'rounded-full px-4 py-1.5 font-mono text-[11px] font-semibold tracking-wider transition-all cursor-pointer',
              activeTab === tab.id
                ? 'border border-sapphire-400 bg-sapphire-500/20 text-white shadow-[0_0_15px_rgba(56,189,248,0.25)]'
                : 'border border-white/10 bg-graphite-900/60 text-fog-400 hover:border-white/20 hover:text-fog-200',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((feature, i) => {
          const Icon = feature.icon
          const id = `SYS.${String(i + 1).padStart(2, '0')}`
          return (
            <Reveal key={feature.title} delay={(i % 3) * 0.05} className="h-full">
              <article className="liquid-glass-card group relative flex h-full flex-col justify-between rounded-xl border border-white/10 p-5 transition-all hover:border-sapphire-400/40 hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(56,189,248,0.1)]">
                <div>
                  <div className="flex items-start justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-sapphire-400 transition-colors group-hover:border-sapphire-400/50 group-hover:bg-sapphire-500/10">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wider text-fog-400">
                      {feature.tag}
                    </span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-fog-300">
                    {feature.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 font-mono text-[9px] text-fog-500">
                  {id}
                </div>
              </article>
            </Reveal>
          )
        })}
      </div>

      <Reveal delay={0.1}>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-graphite-900/40 p-4 backdrop-blur-xl">
          <p className="flex items-center gap-2 font-mono text-[10.5px] tracking-wider text-fog-300">
            <span className="h-2 w-2 rounded-full bg-sage-500 animate-pulse-dot" />
            ALL 14 SUBSYSTEMS RUN 100% LOCALLY · ZERO NETWORK TELEMETRY
          </p>
          <span className="font-mono text-[10px] text-sapphire-300">
            ANDROID 13+ (API 33 - 37)
          </span>
        </div>
      </Reveal>
    </SectionShell>
  )
}
