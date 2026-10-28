import { Command, Github, Mail, Rss, Scale, ShieldCheck, FileText, Sparkles } from 'lucide-react'
import { APP_META, ISSUES_URL, RELEASES_ATOM_URL, RELEASES_URL, REPO_URL } from '@/lib/constants'
import { OPEN_DECK_EVENT } from '@/components/control-deck'
import { OPEN_SHORTCUTS_EVENT } from '@/components/shortcuts-overlay'

const RESOURCE_LINKS = [
  { label: 'GitHub Repository', href: REPO_URL, external: true },
  { label: 'Releases & APKs', href: RELEASES_URL, external: true },
  { label: 'Release Feed (Atom)', href: RELEASES_ATOM_URL, external: true },
  { label: 'Issue Tracker', href: ISSUES_URL, external: true },
  { label: 'Changelog', href: `${REPO_URL}/blob/master/CHANGELOG.md`, external: true },
  { label: 'Build & Deploy Guide', href: `${REPO_URL}/blob/master/BUILD.md`, external: true },
  { label: 'Security Policy', href: `${REPO_URL}/blob/master/SECURITY.md`, external: true },
] as const

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-graphite-950/80 backdrop-blur-2xl">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand & Mission */}
          <div>
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
                <defs>
                  <linearGradient id="footer-logo-rim" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
                    <stop offset="40%" stopColor="#818cf8" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#d4a359" stopOpacity="0.85" />
                  </linearGradient>
                  <radialGradient id="footer-logo-glow" cx="30%" cy="20%" r="65%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="footer-logo-phone" x1="20%" y1="10%" x2="90%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="60%" stopColor="#e0f2fe" />
                    <stop offset="100%" stopColor="#94a3b8" />
                  </linearGradient>
                </defs>
                <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="#080c14" />
                <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="url(#footer-logo-glow)" />
                <path d="M 2 8.5 C 2 4.5 4.5 2 8.5 2 L 23.5 2 C 27.5 2 30 4.5 30 8.5 C 30 9.5 25 12 16 12 C 7 12 2 9.5 2 8.5 Z" fill="#ffffff" fillOpacity="0.06" />
                <rect x="1.5" y="1.5" width="29" height="29" rx="7" fill="none" stroke="url(#footer-logo-rim)" strokeWidth="1.2" />
                <rect x="2.4" y="2.4" width="27.2" height="27.2" rx="6.1" fill="none" stroke="#ffffff" strokeOpacity="0.08" strokeWidth="0.6" />
                <path d="M10.8 8.8 C10.2 8.2 9.2 8.2 8.5 8.8 L7.4 9.8 C6.8 10.3 6.6 11.1 6.7 11.9 C7.2 14.4 8.9 18.0 12.1 21.2 C15.3 24.4 18.9 26.1 21.4 26.6 C22.2 26.7 23.0 26.5 23.5 25.9 L24.5 24.8 C25.1 24.1 25.1 23.1 24.5 22.5 L22.1 20.1 C21.5 19.5 20.5 19.5 19.8 20.1 L19.1 20.7 C18.7 21.0 18.1 21.1 17.6 20.7 C16.2 19.7 14.3 17.8 13.3 16.4 C12.9 15.9 13.0 15.3 13.3 14.9 L13.9 14.2 C14.5 13.5 14.5 12.5 13.9 11.9 Z" fill="url(#footer-logo-phone)" />
                <circle cx="9.8" cy="10.2" r="1.1" fill="#d4a359" />
                <path d="M 18.7 9.6 A 7.5 7.5 0 0 1 16.3 17.2" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M 22.8 7.4 A 12.0 12.0 0 0 1 18.4 21.3" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.78" />
              </svg>
              <span className="font-display text-lg font-bold tracking-tight text-white">LiNEA</span>
              <span className="rounded border border-sapphire-400/30 bg-sapphire-950/40 px-2 py-0.5 font-mono text-[9px] text-sapphire-300">
                v2.7.0 CRYSTAL
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-fog-300">
              The sovereign, privacy-preserving cellular dialer for Android 17. 100% on-device
              intelligence, hardware-backed encryption, and real-time AGSL liquid-glass optics — free and open source.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="GitHub repository"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-graphite-900/60 text-fog-300 transition-colors hover:border-sapphire-400 hover:text-white"
              >
                <Github className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={RELEASES_ATOM_URL}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Release feed (Atom)"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-graphite-900/60 text-fog-300 transition-colors hover:border-sapphire-400 hover:text-white"
              >
                <Rss className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={`mailto:${APP_META.support}`}
                aria-label={`Email ${APP_META.support}`}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-graphite-900/60 text-fog-300 transition-colors hover:border-sapphire-400 hover:text-white"
              >
                <Mail className="h-4 w-4" aria-hidden="true" />
              </a>
              <span className="ml-2 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] text-fog-400">
                <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-sage-500" aria-hidden="true" />
                TELECOM // SECURE
              </span>
            </div>
          </div>

          {/* Resources */}
          <nav aria-label="Resources">
            <p className="tech-label text-sapphire-400">Resources & Governance</p>
            <ul className="mt-4 space-y-1">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? '_blank' : undefined}
                    rel={link.external ? 'noreferrer noopener' : undefined}
                    className="flex items-center gap-2 py-1.5 text-sm text-fog-300 transition-colors hover:text-white"
                  >
                    <FileText className="h-3.5 w-3.5 text-fog-500" aria-hidden="true" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal / System Specifications */}
          <div>
            <p className="tech-label text-sapphire-400">Platform Specifications</p>
            <dl className="mt-4 space-y-2 font-mono text-[11px] tracking-wide">
              {[
                ['PACKAGE', APP_META.packageName],
                ['TARGET', APP_META.target],
                ['MIN SDK', APP_META.minSdk],
                ['TOOLCHAIN', APP_META.language],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-4">
                  <dt className="text-fog-500">{k}</dt>
                  <dd className="text-right text-fog-200">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 flex items-start gap-2 text-xs leading-relaxed text-fog-400">
              <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fog-500" aria-hidden="true" />
              Apache License 2.0 — © {new Date().getFullYear()} {APP_META.developer}. All cryptographic signatures verified.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] tracking-[0.16em] text-fog-300">
            <ShieldCheck className="h-3.5 w-3.5 text-sage-400" aria-hidden="true" />
            ENTERPRISE FOSS · CRYPTOGRAPHICALLY SIGNED BINARIES · ZERO TELEMETRY
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="font-mono text-[10px] tracking-[0.16em] text-fog-400">
              {APP_META.packageName.toUpperCase()} · ANDROID 17
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
