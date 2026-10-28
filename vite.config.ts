import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'

/* ============================================================
   sw-build-stamp — rewrites the service worker's CACHE_NAME
   token with a per-build stamp so every deploy starts a fresh
   cache and stale entries self-purge on activation.
   ============================================================ */
function swBuildStamp(): Plugin {
  const SW_TOKEN = '__SW_BUILD_STAMP__'
  return {
    name: 'linea:sw-build-stamp',
    apply: 'build',
    async closeBundle() {
      const swPath = fileURLToPath(new URL('./dist/sw.js', import.meta.url))
      try {
        const source = await readFile(swPath, 'utf8')
        if (!source.includes(SW_TOKEN)) {
          this.warn(`sw.js is missing the ${SW_TOKEN} token — CACHE_NAME not stamped`)
          return
        }
        const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 12)
        await writeFile(swPath, source.replaceAll(SW_TOKEN, stamp), 'utf8')
        this.info(`sw.js CACHE_NAME stamped: linea-site-shell-${stamp}`)
      } catch {
        this.warn('dist/sw.js not found — skipping service worker stamp')
      }
    },
  }
}

/* ============================================================
   github-bundle-mock — local dev server middleware providing
   fast response for /api/github/bundle from src/data/seed.json
   ============================================================ */
function githubBundleMock(): Plugin {
  return {
    name: 'linea:github-bundle-mock',
    configureServer(server) {
      server.middlewares.use('/api/github/bundle', (req, res) => {
        try {
          const seedPath = fileURLToPath(new URL('./src/data/seed.json', import.meta.url))
          const seedContent = fs.readFileSync(seedPath, 'utf8')
          const seedData = JSON.parse(seedContent)
          res.setHeader('Content-Type', 'application/json')
          res.setHeader('X-Data-Source', 'local-seed')
          res.end(JSON.stringify({
            source: 'seed',
            fetchedAt: Date.now(),
            repo: seedData.repo,
            releases: seedData.releases,
          }))
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },
  }
}

export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss(), swBuildStamp(), githubBundleMock()],
  server: {
    port: 3000,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    target: 'es2020',
    chunkSizeWarningLimit: 900,
  },
})
