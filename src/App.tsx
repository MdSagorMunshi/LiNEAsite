import { ReleasesProvider } from '@/hooks/use-releases'
import SiteHeader from '@/components/site-header'
import Hero from '@/components/hero'
import StatusTicker from '@/components/status-ticker'
import About from '@/components/sections/about'
import CrystalShowcase from '@/components/sections/crystal-showcase'
import Features from '@/components/sections/features'
import Screenshots from '@/components/sections/screenshots'
import T9Playground from '@/components/sections/t9-playground'
import Downloads from '@/components/sections/downloads'
import Timeline from '@/components/sections/timeline'
import InstallGuide from '@/components/sections/install-guide'
import SiteFooter from '@/components/site-footer'
import BackToTop from '@/components/back-to-top'
import WayRail from '@/components/wayrail'
import NewVersionBanner from '@/components/new-version-banner'
import ControlDeck from '@/components/control-deck'
import Toaster from '@/components/toaster'
import ShortcutsOverlay from '@/components/shortcuts-overlay'
import LinkMonitor from '@/components/link-monitor'
import { SeoSync } from '@/lib/seo'
import { HazardDivider } from '@/components/primitives'

export default function App() {
  return (
    <ReleasesProvider>
      <div className="relative flex min-h-screen flex-col bg-graphite-950 overflow-x-hidden">
        {/* Atmospheric Liquid Glass Chromatic Orbs — ambient back-lighting for dynamic refraction */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          {/* Top Sapphire Glass Orb */}
          <div className="absolute -top-[12%] left-[15%] h-[600px] w-[600px] rounded-full bg-gradient-to-br from-sapphire-500/18 via-sky-600/8 to-transparent blur-[130px] animate-liquid-drift" />
          {/* Upper Sage / Telecom Orb */}
          <div className="absolute top-[28%] -right-[8%] h-[650px] w-[650px] rounded-full bg-gradient-to-bl from-sage-500/12 via-steel-500/8 to-transparent blur-[140px] animate-liquid-drift [animation-delay:4s]" />
          {/* Mid Titanium Gold Orb */}
          <div className="absolute top-[52%] -left-[10%] h-[700px] w-[700px] rounded-full bg-gradient-to-tr from-gold-500/10 via-sapphire-500/5 to-transparent blur-[150px] animate-liquid-drift [animation-delay:8s]" />
          {/* Lower Deep Crystal Orb */}
          <div className="absolute top-[78%] right-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-sapphire-600/14 via-indigo-600/5 to-transparent blur-[140px] animate-liquid-drift [animation-delay:12s]" />
        </div>

        {/* Machined film grain texture */}
        <div aria-hidden="true" className="noise-overlay pointer-events-none fixed inset-0 z-[5] opacity-[0.025]" />

        <SiteHeader />

        <main id="main" className="relative z-10 flex-1">
          <Hero />
          <StatusTicker />
          <About />
          <CrystalShowcase />

          {/* Subsystems band with subtle lattice grid */}
          <div className="relative overflow-hidden border-y border-white/10 bg-graphite-900/30 backdrop-blur-md">
            <div
              aria-hidden="true"
              className="blueprint-grid absolute inset-0 opacity-25 [mask-image:linear-gradient(to_bottom,transparent,black_16%,black_84%,transparent)]"
            />
            <div className="relative">
              <Features />
            </div>
          </div>

          <T9Playground />
          <Screenshots />
          <Downloads />
          <Timeline />
          <HazardDivider className="my-2" />
          <InstallGuide />
        </main>

        <SiteFooter />
        <BackToTop />
        <WayRail />
        <NewVersionBanner />
        <ControlDeck />
        <ShortcutsOverlay />
        <Toaster />
        <LinkMonitor />
        <SeoSync />
      </div>
    </ReleasesProvider>
  )
}
