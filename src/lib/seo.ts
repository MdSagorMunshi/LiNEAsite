import { useEffect } from 'react'
import { useReleases } from '@/hooks/use-releases'
import type { Release } from '@/types'

/* ============================================================
   SEO RUNTIME SYNC
   The site is a SPA whose release data streams in live. Search
   engines and social scrapers get static meta in index.html;
   this module upgrades it at runtime:

   1. initSeo() — absolutize og:image / og:url and inject a
      <link rel="canonical"> relative to the real document URI,
      so the same build stays correct on any host (sandbox,
      GitHub Pages, domain root).
   2. syncSeoVersion() — patch the SoftwareApplication JSON-LD
      block with the live stable version + publish date.
   ============================================================ */

const OG_IMAGE_REL = 'og.png'

/** Resolve a sibling file against the real document location. */
function absFromDocument(rel: string): string {
  try {
    return new URL(rel, document.baseURI).href
  } catch {
    return rel
  }
}

/** One-shot: canonical URL + absolute social images. */
export function initSeo(): void {
  if (typeof document === 'undefined') return

  // og:image → absolute
  const img = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')
  if (img) img.setAttribute('content', absFromDocument(OG_IMAGE_REL))

  // og:url → this page, hash-free
  const cleanUrl = location.origin + location.pathname
  const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]')
  if (ogUrl) ogUrl.setAttribute('content', cleanUrl)

  // canonical link (create if absent)
  let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = cleanUrl
}

/** Patch SoftwareApplication JSON-LD with the live stable release. */
export function syncSeoVersion(release: Release): void {
  if (typeof document === 'undefined') return
  const scripts = document.querySelectorAll('script[type="application/ld+json"]')
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent ?? '{}') as Record<string, unknown>
      if (data['@type'] !== 'SoftwareApplication') continue
      data.softwareVersion = release.tagName
      data.datePublished = release.publishedAt
      if (release.author) {
        const author = data.author as Record<string, unknown> | undefined
        if (author && typeof author === 'object') author.name = release.author
      }
      script.textContent = JSON.stringify(data, null, 2)
      return // first SoftwareApplication block is the one we authored
    } catch {
      /* malformed block — skip */
    }
  }
}

/** Headless component: wires SEO sync into the release stream. */
export function SeoSync() {
  const { latestStable, status } = useReleases()

  useEffect(() => {
    initSeo()
  }, [])

  useEffect(() => {
    if (latestStable) syncSeoVersion(latestStable)
  }, [latestStable, status])

  return null
}
