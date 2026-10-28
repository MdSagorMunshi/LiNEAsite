import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Layers,
  Cpu,
  Mic,
  MicOff,
  Pause,
  PhoneCall,
  Radio,
  Sliders,
  Shield,
  Zap,
} from 'lucide-react'
import { SectionShell, Reveal, TechLabel, LiquidPill } from '@/components/primitives'
import { cn } from '@/lib/utils'

/* ============================================================
   CRYSTAL ENGINE SHOWCASE (LiNEA v2.7.0 Liquid Glass)
   Interactive AGSL shader optics simulator + live 32-bar waveform
   ============================================================ */

type CallAudioState = 'active' | 'muted' | 'recording' | 'hold'
type OpticsMode = 'performance' | 'balanced' | 'full'

export default function CrystalShowcase() {
  const [audioState, setAudioState] = useState<CallAudioState>('active')
  const [opticsMode, setOpticsMode] = useState<OpticsMode>('full')
  const [easterEggActive, setEasterEggActive] = useState(false)
  const [callTimer, setCallTimer] = useState(142)

  // Timer simulation
  useEffect(() => {
    const id = setInterval(() => {
      setCallTimer((t) => t + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Generate 32 waveform bars with state-dependent amplitude
  const bars = Array.from({ length: 32 }, (_, i) => {
    // Generate pseudo-harmonic amplitudes
    const base = Math.sin((i / 32) * Math.PI) * 0.8 + 0.2
    return base
  })

  return (
    <SectionShell
      id="crystal-engine"
      index="03"
      kicker="CRYSTAL LIQUID-GLASS ARCHITECTURE"
      title={
        <span>
          Next-Gen Liquid Glass. <span className="text-gradient-crystal">Zero Overhead.</span>
        </span>
      }
      description="LiNEA v2.7.0 introduces the Crystal design system: hardware-accelerated AGSL RuntimeShaders on Android 13+, live GraphicsLayer backdrop isolation, and fluid spring physics — with 0% idle CPU drain and no third-party rendering bloat."
    >
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Interactive Liquid Glass Call Scene & Waveform (7 cols) */}
        <Reveal className="lg:col-span-7">
          <div className="crystal-surface relative overflow-hidden rounded-2xl border border-white/15 p-6 sm:p-8">
            {/* Ambient liquid refraction glow inside card */}
            <div
              aria-hidden="true"
              className={cn(
                'pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl transition-all duration-700',
                audioState === 'active' && 'bg-sapphire-500/20',
                audioState === 'muted' && 'bg-gold-500/20',
                audioState === 'recording' && 'bg-rust-500/25',
                audioState === 'hold' && 'bg-sage-500/20',
              )}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-sapphire-400" />
                <span className="font-mono text-xs font-semibold tracking-wider text-fog-200">
                  LIVE CALL ENGINE SIMULATOR
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-sage-500" />
                <span className="font-mono text-[11px] text-fog-400 tnum">
                  {audioState.toUpperCase()} // {formatTimer(callTimer)}
                </span>
              </div>
            </div>

            {/* Caller identity banner */}
            <div className="mt-6 flex items-center justify-between">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-fog-400">CALLER // ENCRYPTED VOICE</p>
                <h4 className="mt-1 font-display text-2xl font-bold tracking-tight text-white">
                  Executive Telecom Gateway
                </h4>
                <p className="font-mono text-xs text-sapphire-300">+1 (800) 555-0199 · SIM 1 (PRIMARY 5G)</p>
              </div>
              <LiquidPill tone={audioState === 'recording' ? 'gold' : 'sapphire'}>
                {audioState === 'recording' ? 'REC ACTIVE' : 'HD VOICE 48kHz'}
              </LiquidPill>
            </div>

            {/* 32-Bar Liquid Glass Waveform Visualizer */}
            <div className="mt-8 rounded-xl border border-white/10 bg-graphite-950/60 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="font-mono text-[10px] tracking-widest text-fog-400">
                  32-BAND HARMONIC AMPLITUDE METER
                </span>
                <span className="font-mono text-[10px] text-fog-500">
                  {audioState === 'muted'
                    ? 'MUTED · 0.0 dB'
                    : audioState === 'hold'
                      ? 'HOLD · IDLE'
                      : '-18.4 dBFS · AAC-LC'}
                </span>
              </div>

              <div className="flex h-24 items-end justify-between gap-1 pt-4">
                {bars.map((bar, i) => {
                  let heightPct = 15
                  let barColor = 'bg-sapphire-400'

                  if (audioState === 'active') {
                    // Lively dynamic height
                    heightPct = Math.max(18, Math.round(bar * 95))
                    barColor =
                      i % 4 === 0
                        ? 'bg-sapphire-300'
                        : i % 2 === 0
                          ? 'bg-sapphire-400'
                          : 'bg-ice-300'
                  } else if (audioState === 'muted') {
                    heightPct = 8
                    barColor = 'bg-gold-500/60'
                  } else if (audioState === 'recording') {
                    heightPct = Math.max(22, Math.round(bar * 90))
                    barColor = i % 3 === 0 ? 'bg-rust-400' : 'bg-gold-400'
                  } else if (audioState === 'hold') {
                    heightPct = Math.max(12, Math.round(bar * 40))
                    barColor = 'bg-sage-400/70'
                  }

                  return (
                    <motion.div
                      key={i}
                      animate={{ height: `${heightPct}%` }}
                      transition={{
                        duration: audioState === 'muted' ? 0.4 : 0.25,
                        delay: (i * 0.015) % 0.2,
                        repeat: audioState === 'active' || audioState === 'recording' ? Infinity : 0,
                        repeatType: 'reverse',
                      }}
                      className={cn(
                        'w-full min-w-[3px] rounded-full transition-colors duration-300 shadow-[0_0_8px_rgba(56,189,248,0.25)]',
                        barColor,
                      )}
                    />
                  )
                })}
              </div>
            </div>

            {/* Interactive Call State Toggles */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <span className="font-mono text-[10px] tracking-wider text-fog-400">SIMULATE AUDIO ROUTE:</span>
              <div className="flex flex-wrap gap-2">
                {(['active', 'muted', 'recording', 'hold'] as CallAudioState[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setAudioState(st)}
                    className={cn(
                      'rounded-lg border px-3 py-1.5 font-mono text-[11px] font-semibold tracking-wider transition-all cursor-pointer',
                      audioState === st
                        ? 'border-sapphire-400/80 bg-sapphire-500/20 text-white shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                        : 'border-white/10 bg-graphite-900/60 text-fog-400 hover:border-white/20 hover:text-fog-200',
                    )}
                  >
                    {st.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Right Column: Optics Mode & Easter Egg Interactive Showcase (5 cols) */}
        <Reveal className="flex flex-col gap-6 lg:col-span-5" delay={0.15}>
          {/* Optics Mode Selector Card */}
          <div className="liquid-glass-card rounded-2xl border border-white/15 p-6">
            <div className="flex items-center gap-2.5">
              <Sliders className="h-4 w-4 text-sapphire-400" />
              <h4 className="font-display text-lg font-bold text-white">AGSL Optics Tuning</h4>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-fog-300">
              LiNEA adjusts its GPU displacement math based on device capability, with zero frame drops.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {(['performance', 'balanced', 'full'] as OpticsMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setOpticsMode(mode)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all cursor-pointer',
                    opticsMode === mode
                      ? 'border-sapphire-400 bg-sapphire-500/20 text-white shadow-[0_0_20px_rgba(56,189,248,0.25)]'
                      : 'border-white/10 bg-graphite-900/40 text-fog-400 hover:border-white/20 hover:text-fog-200',
                  )}
                >
                  <span className="font-mono text-[11px] font-bold uppercase">{mode}</span>
                  <span className="mt-0.5 text-[9px] text-fog-500">
                    {mode === 'performance' ? '48 Hz Blur' : mode === 'balanced' ? 'Refraction' : 'Full AGSL'}
                  </span>
                </button>
              ))}
            </div>

            {/* Optics live status details */}
            <div className="mt-4 rounded-lg border border-white/10 bg-graphite-950/70 p-3 font-mono text-[10px] text-fog-300 space-y-1">
              <div className="flex justify-between">
                <span>RUNTIME SHADER:</span>
                <span className="text-sapphire-300">{opticsMode === 'full' ? 'AGSL Active' : 'Fallback Chain'}</span>
              </div>
              <div className="flex justify-between">
                <span>GRAPHICS LAYER:</span>
                <span className="text-sage-300">Isolated 0% Feedback</span>
              </div>
              <div className="flex justify-between">
                <span>MEMORY FOOTPRINT:</span>
                <span className="text-fog-200 tnum">0.0 MB Added</span>
              </div>
            </div>
          </div>

          {/* Call Button Easter Egg Demo Card */}
          <div className="liquid-glass-card rounded-2xl border border-white/15 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Zap className="h-4 w-4 text-gold-400" />
                <h4 className="font-display text-lg font-bold text-white">Call Button Easter Egg</h4>
              </div>
              <LiquidPill tone="gold">PRESS & HOLD</LiquidPill>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-fog-300">
              In v2.7.0, a long-press on the dialpad call action transforms into the alternate skin with tactile spring physics — without placing an accidental call.
            </p>

            {/* Interactive button trigger */}
            <div className="mt-5 flex items-center justify-center p-4">
              <button
                type="button"
                onMouseDown={() => setEasterEggActive(true)}
                onMouseUp={() => setEasterEggActive(false)}
                onMouseLeave={() => setEasterEggActive(false)}
                onTouchStart={() => setEasterEggActive(true)}
                onTouchEnd={() => setEasterEggActive(false)}
                className={cn(
                  'group relative flex h-16 w-36 items-center justify-center gap-2.5 rounded-full border text-sm font-bold tracking-wider transition-all duration-300 select-none cursor-pointer',
                  easterEggActive
                    ? 'border-gold-400 bg-gradient-to-r from-rust-500 via-gold-500 to-amber-500 text-graphite-950 scale-105 shadow-[0_0_35px_rgba(212,163,89,0.7)]'
                    : 'border-white/20 bg-gradient-to-r from-sage-600 via-emerald-500 to-sage-600 text-white shadow-[0_4px_25px_rgba(90,143,107,0.45)] hover:scale-102',
                )}
              >
                <PhoneCall className={cn('h-5 w-5 transition-transform', easterEggActive && 'rotate-12 scale-110')} />
                <span>{easterEggActive ? 'FIERY SKIN' : 'HOLD ME'}</span>
              </button>
            </div>
            <p className="text-center font-mono text-[9px] text-fog-500">
              {easterEggActive ? '⚡ ALTERNATE SKIN UNLOCKED' : 'Click & hold to test gesture response'}
            </p>
          </div>
        </Reveal>
      </div>
    </SectionShell>
  )
}
