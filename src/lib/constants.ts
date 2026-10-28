import type { ReleaseAsset } from '@/types'

/* ============================================================
   LiNEA site — repository constants & static content
   ============================================================ */

export const REPO_OWNER = 'MdSagorMunshi'
export const REPO_NAME = 'Linea'
export const REPO_URL = 'https://github.com/MdSagorMunshi/Linea'
export const RELEASES_URL = `${REPO_URL}/releases`
export const ISSUES_URL = `${REPO_URL}/issues`
/** Developer build guide (toolchain, Gradle, device deployment) — lives in the repo */
export const DEV_GUIDE_URL = `${REPO_URL}/blob/master/BUILD.md`
/** Atom feed — new releases appear here the second they are published */
export const RELEASES_ATOM_URL = `${RELEASES_URL}.atom`
export const RAW_SCREENSHOT_BASE =
  'https://raw.githubusercontent.com/MdSagorMunshi/Linea/master/docs/assets/screenshots'

/** GitHub REST endpoints (hit directly from the browser, ETag-cached) */
export const API_REPO_URL = 'https://api.github.com/repos/MdSagorMunshi/Linea'
export const API_RELEASES_URL =
  'https://api.github.com/repos/MdSagorMunshi/Linea/releases?per_page=100'

/** Same-origin Next.js proxy fallback (sandbox / restricted networks) */
export const PROXY_URL = '/api/github/bundle'

export const APP_META = {
  name: 'LiNEA',
  packageName: 'com.ryanshelby.linea',
  tagline: 'The Sovereign, Liquid-Glass Cellular Dialer for Android 17',
  target: 'Android 17 (API 37)',
  minSdk: 'Android 13 (API 33)',
  language: 'Kotlin 2.2.10 · Jetpack Compose',
  license: 'Apache 2.0',
  developer: 'Ryan Shelby',
  support: 'ryn@disr.it',
  category: 'Communication · Dialer · FOSS',
} as const

export interface Screenshot {
  /** Self-hosted asset — served from this site, no external dependency (WebP, ~70% lighter) */
  src: string
  /** Local PNG fallback — used only if the WebP variant fails to load */
  fallbackSrc: string
  /** Raw GitHub mirror — last resort if local assets are missing entirely */
  mirrorSrc: string
  title: string
  caption: string
}

const shot = (file: string, title: string, caption: string): Screenshot => ({
  src: `/screenshots/${file.replace(/\.png$/, '.webp')}`,
  fallbackSrc: `/screenshots/${file}`,
  mirrorSrc: `${RAW_SCREENSHOT_BASE}/${file}`,
  title,
  caption,
})

export const SCREENSHOTS: Screenshot[] = [
  shot('dialpad_t9.png', 'T9 Smart Dialpad', 'Instant T9 matching with inline contact resolution'),
  shot('incall_dialing.png', 'Active In-Call Screen', 'Hardware audio routes, DTMF pad, and call recording'),
  shot('contacts_directory.png', 'Contacts Directory', 'A-Z haptic scrubber rail with dual-sync persistence'),
  shot('contact_dashboard.png', 'Contact Profile & Controls', 'SIM affinity, per-contact rules, and complete deletion'),
  shot('dual_sim.png', 'Dual SIM Manager', 'Per-slot carrier display, dBm telemetry & default routing'),
  shot('call_screening.png', 'Call Screening Engine', 'Deterministic regex, prefix rules & emergency bypass'),
  shot('settings_hub.png', 'Settings & Preferences Hub', 'Full control over proximity, audio, and call retention'),
  shot('about_foss.png', 'About & System Diagnostics', 'Auditable FOSS specs, developer info & OS environment'),
]

export const NAV_LINKS = [
  { href: '#about', label: 'About' },
  { href: '#crystal-engine', label: 'Crystal' },
  { href: '#features', label: 'Features' },
  { href: '#t9', label: 'T9 Demo' },
  { href: '#screenshots', label: 'Screenshots' },
  { href: '#downloads', label: 'Downloads' },
  { href: '#changelog', label: 'Changelog' },
  { href: '#install', label: 'Install' },
] as const
