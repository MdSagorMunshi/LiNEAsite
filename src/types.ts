/* ============================================================
   LiNEA site — data contract (source of truth for all agents)
   ============================================================ */

export type Channel = 'stable' | 'beta'

export type AssetKind = 'apk' | 'checksum' | 'other'

export interface ReleaseAsset {
  /** File name, e.g. "LiNEA-v2.0.0.apk" */
  name: string
  /** Human label from GitHub, e.g. "Release APK" */
  label: string | null
  kind: AssetKind
  /** Detected ABI: arm64-v8a / armeabi-v7a / x86_64 / universal / null */
  abi: string | null
  /** Size in bytes (0 when unknown) */
  size: number
  /** Pre-formatted size, e.g. "48.7 MB" (from HTML scrape) */
  sizeLabel: string | null
  downloadCount: number
  /** Absolute download URL */
  downloadUrl: string
  sha256: string | null
  updatedAt: string | null
}

export interface Release {
  tagName: string
  /** Release title, e.g. "LiNEA v2.0.0 — Next-Gen Glassmorphism Dialer" */
  name: string
  channel: Channel
  /** ISO date or null */
  publishedAt: string | null
  /** GitHub release page URL */
  htmlUrl: string
  /** Release notes (markdown) */
  body: string
  author: string | null
  assets: ReleaseAsset[]
  /** Convenience: assets with kind === 'apk' */
  apkAssets: ReleaseAsset[]
  isLatestStable: boolean
  isLatestBeta: boolean
}

export interface RepoStats {
  stars: number
  forks: number
  watchers: number
  openIssues: number
  description: string
  license: string | null
  language: string | null
  htmlUrl: string
}

export type DataSource = 'github-api' | 'proxy' | 'seed'

export interface Bundle {
  repo: RepoStats
  releases: Release[]
}

export interface ReleasesState {
  status: 'loading' | 'ready' | 'error'
  isRefreshing: boolean
  releases: Release[]
  repo: RepoStats | null
  latestStable: Release | null
  latestBeta: Release | null
  /** All stable releases, newest first */
  stableReleases: Release[]
  /** All pre-releases, newest first */
  betaReleases: Release[]
  /** Stable releases excluding the latest, newest first */
  olderReleases: Release[]
  totalDownloads: number
  latestApk: ReleaseAsset | null
  lastCheckedAt: number | null
  source: DataSource | null
  error: string | null
  /** Tag of a stable release that appeared AFTER the tag first shown this session. */
  newVersionTag: string | null
  /** Dismiss the new-version notice. */
  dismissNewVersion: () => void
  /** Re-fetch. force=true bypasses ETag cache. */
  refresh: (force?: boolean) => Promise<void>
}
