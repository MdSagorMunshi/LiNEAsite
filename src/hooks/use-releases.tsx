/* ============================================================
   LiNEA site — releases data provider (Task 2-a)
   GitHub REST API → same-origin proxy → build-time seed chain,
   ETag revalidation, localStorage cache hydration, auto-refresh
   and visibility-aware refetch. StrictMode-safe: concurrent
   mounts share a single in-flight network fetch.
   Exports: ReleasesProvider, useReleases
   ============================================================ */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { deriveReleases, compareVersions, fetchBundle, loadCachedBundle, type FetchedBundle } from '@/lib/github'
import type { Bundle, DataSource, ReleasesState } from '@/types'

/* ---------- tuning ---------- */

/** Background auto-refresh interval. Non-forced, so GitHub answers with free 304s. */
const AUTO_REFRESH_INTERVAL_MS = 120_000
/** Refetch when the tab becomes visible again and the last live data is older than this. */
const VISIBLE_STALE_THRESHOLD_MS = 90_000

const SYNC_UNAVAILABLE_MESSAGE = 'Live sync unavailable — showing last known release data.'
const FETCH_FAILED_MESSAGE = 'Could not load release data. Check your connection and retry.'

/* ---------- Module-level in-flight guard ----------
   React StrictMode mounts effects twice, and a provider may remount while a
   previous fetch is still running. One shared promise guarantees concurrent
   mounts never duplicate network fetches. */
let inFlight: Promise<void> | null = null

function startSharedFetch(task: () => Promise<void>): Promise<void> {
  const existing = inFlight
  if (existing) return existing
  const promise = task().catch(() => undefined)
  inFlight = promise
  void promise.then(() => {
    if (inFlight === promise) inFlight = null
  })
  return promise
}

/* ---------- Internal provider state ---------- */

interface DataSnapshot {
  bundle: Bundle
  source: DataSource
  /** When the underlying data was fetched (0 for the build-time seed). */
  fetchedAt: number
}

interface CoreState {
  status: 'loading' | 'ready' | 'error'
  isRefreshing: boolean
  snapshot: DataSnapshot | null
  /** When we last completed a refresh cycle (live or failed). */
  lastCheckedAt: number | null
  error: string | null
  /** Latest stable tag observed this session (drives new-version detection). */
  lastSeenStableTag: string | null
  /** Non-null once a refresh delivers a stable tag newer than lastSeenStableTag. */
  newVersionTag: string | null
  /** Dismissed new-version notices stay dismissed (same tag never re-notifies). */
  dismissedTag: string | null
}

/** Mount-time state: hydrate synchronously from localStorage when available. */
function initialCoreState(): CoreState {
  const cached = loadCachedBundle()
  if (cached) {
    return {
      status: 'ready',
      isRefreshing: true, // background refresh fires immediately on mount
      snapshot: { bundle: cached.bundle, source: cached.source, fetchedAt: cached.fetchedAt },
      lastCheckedAt: cached.fetchedAt,
      error: null,
      lastSeenStableTag: deriveReleases(cached.bundle).latestStable?.tagName ?? null,
      newVersionTag: null,
      dismissedTag: null,
    }
  }
  return {
    status: 'loading',
    isRefreshing: true, // primary fetch fires immediately on mount
    snapshot: null,
    lastCheckedAt: null,
    error: null,
    lastSeenStableTag: null,
    newVersionTag: null,
    dismissedTag: null,
  }
}

/** Pure transition: fold a fetchBundle() result into the current state. */
function applyResult(state: CoreState, result: FetchedBundle, checkedAt: number): CoreState {
  const settled: CoreState = { ...state, isRefreshing: false, lastCheckedAt: checkedAt }

  if (result.source !== 'seed') {
    // New-version detection: a live refresh delivering a stable tag that is
    // NEWER than anything seen this session promotes a notification.
    const nextTag = deriveReleases(result.bundle).latestStable?.tagName ?? null
    const prevTag = state.lastSeenStableTag
    const promoted =
      prevTag !== null &&
      nextTag !== null &&
      nextTag !== prevTag &&
      compareVersions(nextTag, prevTag) > 0
    return {
      ...settled,
      status: 'ready',
      snapshot: { bundle: result.bundle, source: result.source, fetchedAt: result.fetchedAt },
      error: null,
      lastSeenStableTag: nextTag ?? prevTag,
      newVersionTag:
        promoted && nextTag !== state.dismissedTag ? nextTag : state.newVersionTag,
    }
  }

  // Seed fallback ⇒ both live tiers failed. Never clobber live/cached data
  // with the static snapshot — keep showing it and surface a notice instead.
  const previous = state.snapshot
  if (previous && previous.source !== 'seed') {
    return { ...settled, error: SYNC_UNAVAILABLE_MESSAGE }
  }
  return {
    ...settled,
    status: 'ready',
    snapshot: { bundle: result.bundle, source: 'seed', fetchedAt: result.fetchedAt },
    error: SYNC_UNAVAILABLE_MESSAGE,
  }
}
/* ---------- Context ---------- */

const ReleasesContext = createContext<ReleasesState | null>(null)

export function ReleasesProvider({ children }: { children: ReactNode }) {
  const [core, setCore] = useState<CoreState>(initialCoreState)

  /** Re-entrancy guard for refresh() (per provider instance). */
  const refreshingRef = useRef(false)
  /** Timestamp of the last successful *live* fetch (drives visible-refetch). */
  const lastSuccessRef = useRef<number>(0)

  const dismissNewVersion = useCallback(() => {
    setCore((prev) => ({
      ...prev,
      newVersionTag: null,
      dismissedTag: prev.newVersionTag,
    }))
  }, [])

  const refresh = useCallback(async (force?: boolean): Promise<void> => {
    if (refreshingRef.current) return
    refreshingRef.current = true
    setCore((prev) => ({ ...prev, isRefreshing: true }))
    try {
      const result = await fetchBundle({ force: force === true })
      const checkedAt = Date.now()
      if (result.source !== 'seed') lastSuccessRef.current = checkedAt
      setCore((prev) => applyResult(prev, result, checkedAt))
    } catch {
      // fetchBundle() is designed never to reject (the seed tier always
      // resolves), but guard anyway: keep whatever data we have; error out
      // only when there is no data at all.
      const checkedAt = Date.now()
      setCore((prev) =>
        prev.snapshot
          ? {
              ...prev,
              isRefreshing: false,
              lastCheckedAt: checkedAt,
              error: SYNC_UNAVAILABLE_MESSAGE,
            }
          : {
              ...prev,
              status: 'error',
              isRefreshing: false,
              snapshot: null,
              lastCheckedAt: checkedAt,
              error: FETCH_FAILED_MESSAGE,
            },
      )
    } finally {
      refreshingRef.current = false
    }
  }, [])

  useEffect(() => {
    // Seed the "last live fetch" clock from the cached bundle, if any.
    const cached = loadCachedBundle()
    if (cached) lastSuccessRef.current = cached.fetchedAt

    // Mount always fetches (primary when there is no cache, background
    // revalidation when there is) — deduped across concurrent mounts.
    void startSharedFetch(() => refresh(false))

    // Periodic auto-refresh — non-forced, so GitHub answers with free 304s.
    const intervalId = window.setInterval(() => {
      void refresh(false)
    }, AUTO_REFRESH_INTERVAL_MS)

    // Refetch when the tab becomes visible with data older than 90 s.
    const onVisibilityChange = (): void => {
      if (document.visibilityState !== 'visible') return
      if (Date.now() - lastSuccessRef.current > VISIBLE_STALE_THRESHOLD_MS) {
        void refresh(false)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [refresh])

  const value = useMemo<ReleasesState>(() => {
    const snapshot = core.snapshot
    if (snapshot) {
      return {
        status: core.status,
        isRefreshing: core.isRefreshing,
        repo: snapshot.bundle.repo,
        ...deriveReleases(snapshot.bundle),
        lastCheckedAt: core.lastCheckedAt,
        source: snapshot.source,
        error: core.error,
        newVersionTag: core.newVersionTag,
        dismissNewVersion,
        refresh,
      }
    }
    return {
      status: core.status,
      isRefreshing: core.isRefreshing,
      releases: [],
      repo: null,
      latestStable: null,
      latestBeta: null,
      stableReleases: [],
      betaReleases: [],
      olderReleases: [],
      totalDownloads: 0,
      latestApk: null,
      lastCheckedAt: core.lastCheckedAt,
      source: null,
      error: core.error,
      newVersionTag: null,
      dismissNewVersion,
      refresh,
    }
  }, [core, dismissNewVersion, refresh])

  return <ReleasesContext.Provider value={value}>{children}</ReleasesContext.Provider>
}

export function useReleases(): ReleasesState {
  const ctx = useContext(ReleasesContext)
  if (!ctx) throw new Error('useReleases must be used within ReleasesProvider')
  return ctx
}
