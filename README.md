# LiNEA Website (`LiNEAsite`)

Official web platform for **[LiNEA](https://github.com/MdSagorMunshi/Linea)** — the sovereign, privacy-preserving cellular dialer for Android.

[![Live Site](https://img.shields.io/badge/Live_Site-lineaapp.pages.dev-38BDF8?style=for-the-badge&logo=cloudflarepages&logoColor=white)](https://lineaapp.pages.dev)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-Apache_2.0-5A8F6B?style=for-the-badge)](LICENSE)

---

## 💎 Features

- **Crystal Liquid Glass & Corporate UI/UX**: Multi-layered frosted backdrop blurs (`backdrop-blur-2xl`), specular refractive rim borders, and obsidian foundations.
- **Interactive Phone Showcase**: Live in-browser DTMF keypad simulation, cellular HUD, and dialer preview with interactive audio synthesis.
- **Crystal Optics Engine Showcase**: Real-time 32-band audio waveform visualizer and AGSL shader profile simulator (`60 FPS`, `90 FPS`, `120 FPS`).
- **Automated Release Ingestion**: Real-time GitHub release polling with ETag caching, SHA-256 verification, and offline seed fallback.
- **Edge Deployment**: Built for high-performance hosting on Cloudflare Pages (`lineaapp.pages.dev`) with immutable asset caching and security headers.

---

## 🛠️ Development

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 20+

### Setup & Run Locally

```bash
# Install dependencies
bun install

# Start development server on http://localhost:3000
bun run dev

# Run TypeScript typecheck
bun run typecheck

# Build for production
bun run build

# Preview production build locally
bun run preview
```

---

## ⛅ Cloudflare Pages Deployment

Deploy directly via Cloudflare CLI (`wrangler`):

```bash
bun run deploy
```

Deployed live at **[https://lineaapp.pages.dev](https://lineaapp.pages.dev)**.

---

## 📄 License

Licensed under the [Apache License 2.0](LICENSE).
