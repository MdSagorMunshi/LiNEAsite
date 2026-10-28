import { useEffect, useState } from 'react'
import { toast } from '@/components/toaster'

/* ============================================================
   LINK MONITOR — offline / online transitions
   Radio-style feedback over the toast bus; also exposes the
   connection state for UI badges. The offline shell itself is
   served by the service worker (public/sw.js).
   ============================================================ */

export default function LinkMonitor() {
  const [offline, setOffline] = useState<boolean>(
    typeof navigator !== 'undefined' && navigator.onLine === false,
  )

  useEffect(() => {
    const goOffline = () => {
      setOffline(true)
      toast('LINK DOWN — OFFLINE MODE', {
        tone: 'rust',
        detail: 'CACHED SHELL ACTIVE · RELEASE DATA MAY BE STALE',
      })
    }
    const goOnline = () => {
      setOffline(false)
      toast('LINK RESTORED', {
        tone: 'sage',
        detail: 'LIVE RELEASE SYNC RE-ARMED',
      })
    }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  // visual seam: while offline, pin a thin rust hairline under the header
  useEffect(() => {
    document.documentElement.dataset.link = offline ? 'down' : 'up'
    return () => {
      delete document.documentElement.dataset.link
    }
  }, [offline])

  return null
}
