import { useEffect, useState } from 'react'

/* ============================================================
   useScrollSpy — which section owns the viewport band
   Shared by the header nav rail and the side wayfinding rail.
   Observes a band from just under the sticky header to
   mid-viewport; the entry crossing closest to the top wins.
   ============================================================ */

export function useScrollSpy(ids: readonly string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null)
  // Callers may pass an inline array; key on its contents so the
  // observer is created once, not on every parent re-render.
  const idsKey = ids.join('|')

  useEffect(() => {
    const sections = idsKey
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        let best: { id: string; top: number } | null = null
        for (const entry of entries) {
          if (!entry.isIntersecting || !entry.rootBounds) continue
          const top = entry.boundingClientRect.top
          if (top >= -entry.rootBounds.height * 0.5 && (!best || top < best.top)) {
            best = { id: entry.target.id, top }
          }
        }
        if (best) setActiveId(best.id)
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: 0 },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [idsKey])

  return activeId
}
