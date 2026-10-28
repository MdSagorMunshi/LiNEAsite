/* ============================================================
   LiNEA site — DTMF tone synthesis (WebAudio)
   Emits the real ITU Q.23 dual-tone pairs the keypad already
   displays. Opt-in: the AudioContext is created lazily inside
   a user gesture (the AUDIO toggle), so autoplay policies are
   respected and no sound ever plays uninvited.
   ============================================================ */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  return ctx
}

/** Create/resume the context from inside a user gesture. */
export function primeAudioContext(): boolean {
  const c = getCtx()
  if (!c) return false
  if (c.state === 'suspended') void c.resume()
  return true
}

/** Whether the synth is currently able to emit sound. */
export function audioReady(): boolean {
  return ctx !== null && ctx.state === 'running'
}

/**
 * Play one DTMF digit: two pure sines at the row/column
 * frequencies, shaped by a fast attack / linear-feel release
 * envelope (~140 ms) so rapid typing never clips or drones.
 */
export function playDtmf(freqs: readonly [number, number], durationMs = 140): void {
  const c = getCtx()
  if (!c || c.state !== 'running') return
  const t0 = c.currentTime
  const dur = Math.max(40, durationMs) / 1000

  const gain = c.createGain()
  // exponential envelope: 6 ms attack, decay to silence by dur
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(0.085, t0 + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  gain.connect(c.destination)

  for (const f of freqs) {
    const osc = c.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = f
    osc.connect(gain)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }
}
