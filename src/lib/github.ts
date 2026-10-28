import type {
  AssetKind,
  Bundle,
  Channel,
  DataSource,
  Release,
  ReleaseAsset,
  RepoStats,
} from '@/types'
import { API_RELEASES_URL, API_REPO_URL, PROXY_URL } from '@/lib/constants'
import seedJson from '@/data/seed.json'

/* ============================================================
   LiNEA site — GitHub data layer (pure logic)
   Network fetching is implemented in fetchBundle() (Task 2-a).
   ============================================================ */

/* ---------- Raw API shapes (api.github.com) ---------- */

export interface ApiAsset {
  name: string
  label?: string | null
  size: number
  download_count: number
  browser_download_url: string
  updated_at: string | null
  content_type?: string
  state?: string
  digest?: string | null
}

export interface ApiRelease {
  tag_name: string
  name: string | null
  prerelease: boolean
  draft?: boolean
  published_at: string | null
  created_at?: string
  html_url: string
  body?: string | null
  author?: { login: string } | null
  assets: ApiAsset[]
}

export interface ApiRepo {
  stargazers_count: number
  forks_count: number
  subscribers_count?: number
  open_issues_count: number
  description: string | null
  license?: { spdx_id: string } | null
  language: string | null
  html_url: string
}

/* ---------- Normalized "scrape-like" shape (proxy + seed) ---------- */

export interface ScrapeAsset {
  name: string
  label: string | null
  size: number
  sizeLabel: string | null
  downloadCount: number
  downloadUrl: string
  sha256: string | null
  updatedAt: string | null
}

export interface ScrapeRelease {
  tagName: string
  name: string
  publishedAt: string | null
  prerelease: boolean
  htmlUrl: string
  body: string
  author: string | null
  assets: ScrapeAsset[]
}

export interface ScrapeRepo {
  stars: number
  forks: number
  watchers: number
  openIssues: number
  description: string
  license: string | null
  language: string | null
  htmlUrl: string
}

export interface ProxyBundleResponse {
  source: 'api' | 'scrape'
  fetchedAt: number
  repo: ScrapeRepo
  releases: ScrapeRelease[]
}

/* ---------- Classification helpers ---------- */

const PRERELEASE_RE = /[-_.](beta|alpha|rc|pre|dev|preview|canary|nightly)/i

export function classifyChannel(tagName: string, prerelease: boolean): Channel {
  if (prerelease) return 'beta'
  return PRERELEASE_RE.test(tagName) ? 'beta' : 'stable'
}

export function detectKind(name: string): AssetKind {
  const lower = name.toLowerCase()
  if (lower.endsWith('.apk') || lower.endsWith('.apks') || lower.endsWith('.aab')) return 'apk'
  if (
    lower.includes('sha256') ||
    lower.includes('sha-256') ||
    lower.includes('checksum') ||
    lower.includes('sums') ||
    lower.endsWith('.asc') ||
    lower.endsWith('.sig')
  ) {
    return 'checksum'
  }
  return 'other'
}

export function detectAbi(name: string): string | null {
  const lower = name.toLowerCase()
  if (/x86[_-]?64|x64/.test(lower)) return 'x86_64'
  if (/arm64|v8a/.test(lower)) return 'arm64-v8a'
  if (/armeabi|v7a/.test(lower)) return 'armeabi-v7a'
  if (/(^|[^8])x86/.test(lower)) return 'x86'
  if (/universal|all[-_]?abi|fat/.test(lower)) return 'universal'
  return null
}

/* ---------- Semver-ish ordering ---------- */

export function parseVersion(tag: string): { major: number; minor: number; patch: number; pre: string | null } {
  const clean = tag.trim().replace(/^[vV]/, '')
  const m = clean.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:[-.](.+))?$/)
  if (!m) return { major: 0, minor: 0, patch: 0, pre: clean || null }
  return {
    major: Number(m[1]) || 0,
    minor: Number(m[2]) || 0,
    patch: Number(m[3]) || 0,
    pre: m[4] ?? null,
  }
}

/** Returns >0 if a > b, <0 if a < b. Prerelease sorts below its release. */
export function compareVersions(a: string, b: string): number {
  const va = parseVersion(a)
  const vb = parseVersion(b)
  const parts: Array<keyof typeof va> = ['major', 'minor', 'patch']
  for (const p of parts) {
    if (va[p] !== vb[p]) return (va[p] as number) - (vb[p] as number)
  }
  if (va.pre === null && vb.pre !== null) return 1
  if (va.pre !== null && vb.pre === null) return -1
  if (va.pre !== null && vb.pre !== null) return va.pre.localeCompare(vb.pre)
  return 0
}

/* ---------- Normalization ---------- */

function extractSha256(digest: string | null | undefined): string | null {
  if (!digest) return null
  const m = digest.match(/sha256[:\s]*([0-9a-f]{16,64})/i)
  return m ? m[1] : null
}

export function normalizeApiAsset(raw: ApiAsset): ReleaseAsset {
  const kind = detectKind(raw.name)
  return {
    name: raw.name,
    label: raw.label ?? null,
    kind,
    abi: kind === 'apk' ? detectAbi(raw.name) : null,
    size: raw.size ?? 0,
    sizeLabel: null,
    downloadCount: raw.download_count ?? 0,
    downloadUrl: raw.browser_download_url,
    sha256: extractSha256(raw.digest),
    updatedAt: raw.updated_at ?? null,
  }
}

export function normalizeApiRelease(raw: ApiRelease): Release {
  return {
    tagName: raw.tag_name,
    name: raw.name?.trim() || raw.tag_name,
    channel: classifyChannel(raw.tag_name, raw.prerelease),
    publishedAt: raw.published_at ?? null,
    htmlUrl: raw.html_url,
    body: (raw.body ?? '').trim(),
    author: raw.author?.login ?? null,
    assets: (raw.assets ?? []).map(normalizeApiAsset),
    apkAssets: [],
    isLatestStable: false,
    isLatestBeta: false,
  }
}

export function normalizeApiRepo(raw: ApiRepo): RepoStats {
  return {
    stars: raw.stargazers_count ?? 0,
    forks: raw.forks_count ?? 0,
    watchers: raw.subscribers_count ?? 0,
    openIssues: raw.open_issues_count ?? 0,
    description: raw.description ?? '',
    license: raw.license?.spdx_id && raw.license.spdx_id !== 'NOASSERTION' ? raw.license.spdx_id : null,
    language: raw.language ?? null,
    htmlUrl: raw.html_url,
  }
}

export function normalizeScrapeAsset(raw: ScrapeAsset): ReleaseAsset {
  const kind = detectKind(raw.name)
  return {
    name: raw.name,
    label: raw.label ?? null,
    kind,
    abi: kind === 'apk' ? detectAbi(raw.name) : null,
    size: raw.size ?? 0,
    sizeLabel: raw.sizeLabel ?? null,
    downloadCount: raw.downloadCount ?? 0,
    downloadUrl: raw.downloadUrl,
    sha256: raw.sha256 ?? null,
    updatedAt: raw.updatedAt ?? null,
  }
}

export function normalizeScrapeRelease(raw: ScrapeRelease): Release {
  const assets = (raw.assets ?? []).map(normalizeScrapeAsset)
  return {
    tagName: raw.tagName,
    name: raw.name?.trim() || raw.tagName,
    channel: classifyChannel(raw.tagName, raw.prerelease),
    publishedAt: raw.publishedAt ?? null,
    htmlUrl: raw.htmlUrl,
    body: (raw.body ?? '').trim(),
    author: raw.author ?? null,
    assets,
    apkAssets: assets.filter((a) => a.kind === 'apk'),
    isLatestStable: false,
    isLatestBeta: false,
  }
}

export function normalizeScrapeRepo(raw: ScrapeRepo): RepoStats {
  return {
    stars: raw.stars ?? 0,
    forks: raw.forks ?? 0,
    watchers: raw.watchers ?? 0,
    openIssues: raw.openIssues ?? 0,
    description: raw.description ?? '',
    license: raw.license ?? null,
    language: raw.language ?? null,
    htmlUrl: raw.htmlUrl,
  }
}

export function normalizeProxyBundle(res: ProxyBundleResponse): Bundle {
  return {
    repo: normalizeScrapeRepo(res.repo),
    releases: (res.releases ?? []).map(normalizeScrapeRelease),
  }
}

/* ---------- Derived state ---------- */

export interface DerivedReleases {
  releases: Release[]
  stableReleases: Release[]
  betaReleases: Release[]
  olderReleases: Release[]
  latestStable: Release | null
  latestBeta: Release | null
  totalDownloads: number
  latestApk: ReleaseAsset | null
}

export function deriveReleases(bundle: Bundle): DerivedReleases {
  const sorted = [...bundle.releases].sort((a, b) => {
    const c = compareVersions(b.tagName, a.tagName)
    if (c !== 0) return c
    return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '')
  })

  let stableFlagged = false
  let betaFlagged = false
  for (const r of sorted) {
    if (r.channel === 'stable' && !stableFlagged) {
      r.isLatestStable = true
      stableFlagged = true
    }
    if (r.channel === 'beta' && !betaFlagged) {
      r.isLatestBeta = true
      betaFlagged = true
    }
  }

  const stableReleases = sorted.filter((r) => r.channel === 'stable')
  const betaReleases = sorted.filter((r) => r.channel === 'beta')
  const totalDownloads = sorted.reduce(
    (sum, r) => sum + r.assets.reduce((s, a) => s + (a.downloadCount ?? 0), 0),
    0,
  )
  const latestApk =
    stableReleases[0]?.apkAssets[0] ?? betaReleases[0]?.apkAssets[0] ?? sorted[0]?.apkAssets[0] ?? null

  return {
    releases: sorted,
    stableReleases,
    betaReleases,
    olderReleases: stableReleases.slice(1),
    latestStable: stableReleases[0] ?? null,
    latestBeta: betaReleases[0] ?? null,
    totalDownloads,
    latestApk,
  }
}

/* ---------- Seed snapshot (build-time fallback) ---------- */

export function loadSeed(): Bundle {
  const seed = seedJson as unknown as { repo: ScrapeRepo; releases: ScrapeRelease[] }
  return normalizeProxyBundle({ source: 'scrape', fetchedAt: 0, repo: seed.repo, releases: seed.releases })
}

/* ---------- LocalStorage cache ---------- */

const BUNDLE_CACHE_KEY = 'linea.site:bundle:v1'
const ETAG_PREFIX = 'linea.site:etag:v1:'

interface CachedBundle {
  bundle: Bundle
  fetchedAt: number
  source: DataSource
}

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

export function loadCachedBundle(): CachedBundle | null {
  const storage = safeStorage()
  if (!storage) return null
  try {
    const raw = storage.getItem(BUNDLE_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedBundle
    if (!parsed?.bundle?.releases) return null
    return parsed
  } catch {
    return null
  }
}

export function saveCachedBundle(bundle: Bundle, fetchedAt: number, source: DataSource): void {
  const storage = safeStorage()
  if (!storage) return
  try {
    storage.setItem(BUNDLE_CACHE_KEY, JSON.stringify({ bundle, fetchedAt, source }))
  } catch {
    /* quota exceeded — ignore */
  }
}

export function loadEtag(key: 'releases' | 'repo'): string | null {
  const storage = safeStorage()
  if (!storage) return null
  try {
    return storage.getItem(ETAG_PREFIX + key)
  } catch {
    return null
  }
}

export function saveEtag(key: 'releases' | 'repo', etag: string | null): void {
  const storage = safeStorage()
  if (!storage || !etag) return
  try {
    storage.setItem(ETAG_PREFIX + key, etag)
  } catch {
    /* ignore */
  }
}

/* ---------- Network fetch (implemented by Task 2-a) ---------- */

export interface FetchedBundle {
  source: DataSource
  bundle: Bundle
  fetchedAt: number
}

/**
 * Fetches the freshest release bundle.
 * Chain: GitHub REST API (direct, ETag-cached) → same-origin proxy → seed snapshot.
 * force=true bypasses the ETag cache.
 */
export async function fetchBundle(options?: { force?: boolean }): Promise<FetchedBundle> {
  const force = options?.force === true
  const cached = loadCachedBundle()

  /* ---------- Tier 1 — GitHub REST API (direct from the browser) ---------- */

  const defaultRepo: RepoStats = {
    stars: 0,
    forks: 0,
    watchers: 0,
    openIssues: 0,
    description: 'The Sovereign, Privacy-Preserving Cellular Dialer for Android 17 (API 37)',
    license: 'Apache-2.0',
    language: 'Kotlin',
    htmlUrl: 'https://github.com/MdSagorMunshi/Linea',
  }

  const releasesHeaders: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (!force) {
    const etag = loadEtag('releases')
    if (etag) releasesHeaders['If-None-Match'] = etag
  }

  const repoHeaders: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (!force) {
    const etag = loadEtag('repo')
    if (etag) repoHeaders['If-None-Match'] = etag
  }

  // Critical request — the release list. 200 → normalize; 304 → cached copy;
  // anything else (403 rate-limit, 404, network error, timeout) → tier failed.
  const releasesTask = (async (): Promise<Release[] | null> => {
    try {
      const res = await fetch(API_RELEASES_URL, {
        headers: releasesHeaders,
        signal: AbortSignal.timeout(8000),
      })
      if (res.status === 200) {
        const raw: unknown = await res.json()
        const list = Array.isArray(raw) ? (raw as ApiRelease[]) : []
        saveEtag('releases', res.headers.get('etag'))
        return list
          .filter((item) => item.draft !== true)
          .map((item) => {
            const release = normalizeApiRelease(item)
            // normalizeApiRelease() intentionally leaves apkAssets empty — fill
            // it in here so the API tier behaves like the proxy/seed tiers
            // (latestApk, download CTAs, ABI badges, …).
            return { ...release, apkAssets: release.assets.filter((a) => a.kind === 'apk') }
          })
      }
      if (res.status === 304 && cached) {
        return cached.bundle.releases
      }
      return null
    } catch {
      // CORS error, network error, timeout or malformed payload
      return null
    }
  })()

  // Non-critical request — repo stats. Never fails the tier on its own:
  // failures fall back to the cached copy or sane defaults.
  const repoTask = (async (): Promise<RepoStats> => {
    try {
      const res = await fetch(API_REPO_URL, {
        headers: repoHeaders,
        signal: AbortSignal.timeout(8000),
      })
      if (res.status === 200) {
        const raw: unknown = await res.json()
        saveEtag('repo', res.headers.get('etag'))
        return normalizeApiRepo(raw as ApiRepo)
      }
      if (res.status === 304 && cached) {
        return cached.bundle.repo
      }
      return cached?.bundle.repo ?? defaultRepo
    } catch {
      return cached?.bundle.repo ?? defaultRepo
    }
  })()

  const [releases, repo] = await Promise.all([releasesTask, repoTask])

  if (releases !== null) {
    const fetchedAt = Date.now()
    const bundle: Bundle = { repo, releases }
    saveCachedBundle(bundle, fetchedAt, 'github-api')
    return { source: 'github-api', bundle, fetchedAt }
  }

  /* ---------- Tier 2 — same-origin proxy (rate-limited / restricted networks) ---------- */

  try {
    const res = await fetch(PROXY_URL + (force ? '?fresh=1' : ''), {
      signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`proxy responded with HTTP ${res.status}`)
    const raw: unknown = await res.json()
    if (!raw || typeof raw !== 'object') throw new Error('proxy payload is not an object')
    const payload = raw as ProxyBundleResponse
    if (!Array.isArray(payload.releases) || !payload.repo) {
      throw new Error('proxy payload malformed')
    }
    const bundle = normalizeProxyBundle(payload)
    const fetchedAt = Date.now()
    saveCachedBundle(bundle, fetchedAt, 'proxy')
    return { source: 'proxy', bundle, fetchedAt }
  } catch {
    // non-OK status, parse error, network error or timeout → seed snapshot
  }

  /* ---------- Tier 3 — build-time seed snapshot (never persisted) ---------- */

  return { source: 'seed', bundle: loadSeed(), fetchedAt: 0 }
}
