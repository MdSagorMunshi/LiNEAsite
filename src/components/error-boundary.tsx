import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCw, TriangleAlert } from 'lucide-react'

/* ============================================================
   LiNEA site — top-level render fault containment
   A crashed tree shows an industrial SYSTEM FAULT panel
   with a recovery action instead of a blank white page.
   ============================================================ */

interface FaultState {
  error: Error | null
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, FaultState> {
  state: FaultState = { error: null }

  static getDerivedStateFromError(error: Error): FaultState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Surface for diagnostics — never breaks the page itself.
    console.error('[LiNEA] render fault:', error, info.componentStack)
  }

  private readonly reset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-screen items-center justify-center bg-graphite-950 px-4">
        <div className="relative w-full max-w-lg border border-rust-500/50 bg-graphite-900/80 p-6 sm:p-8">
          <div aria-hidden="true" className="absolute inset-x-0 top-0 h-0.5 hazard-stripe opacity-40" />
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-rust-500/60 bg-rust-500/10">
              <TriangleAlert className="h-5 w-5 text-rust-400" aria-hidden="true" />
            </span>
            <div>
              <p className="font-mono text-[11px] font-bold tracking-[0.22em] text-rust-300">
                SYSTEM FAULT // RENDER PIPELINE
              </p>
              <p className="mt-0.5 font-mono text-[10px] tracking-[0.16em] text-fog-500">
                FAULT CONTAINED — INTERFACE RESET AVAILABLE
              </p>
            </div>
          </div>
          <pre className="mt-5 max-h-32 overflow-auto border border-graphite-700 bg-graphite-950 p-3 font-mono text-[10.5px] leading-relaxed text-fog-400">
            {error.message || 'Unknown rendering fault'}
          </pre>
          <p className="mt-4 text-[13px] leading-relaxed text-fog-400">
            The interface hit an unexpected fault. Release data syncs live from GitHub — a reload
            re-establishes the pipeline. If the fault persists, file it on the issue tracker.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex h-11 items-center gap-2.5 bg-gold-500 px-5 font-mono text-[11px] font-bold tracking-[0.1em] text-graphite-950 transition-colors hover:bg-gold-400"
            >
              <RotateCw className="h-4 w-4" aria-hidden="true" />
              RELOAD INTERFACE
            </button>
            <button
              type="button"
              onClick={this.reset}
              className="flex h-11 items-center gap-2 border border-graphite-600 px-5 font-mono text-[11px] font-semibold tracking-[0.1em] text-fog-300 transition-colors hover:border-steel-500/70 hover:text-steel-300"
            >
              TRY RECOVER
            </button>
          </div>
        </div>
      </div>
    )
  }
}
