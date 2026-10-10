# ClientCraft — Privacy-First Web Utility Suite & DevOps Growth Engine

> **Ultra-lightweight, high-performance web utility hub engineered for 100% client-side in-memory execution, static Vercel Edge hosting, offline PWA resilience, programmatic SEO metadata, error boundaries, and passive monetization.**

---

## 🔒 Architectural Philosophy: Zero Network Transmission

Every utility in ClientCraft operates strictly in the client's browser V8 engine thread:
- **0 Server Relays**: No API backends, no database logging, no external server calls.
- **In-Memory Volatility**: Data loaded into Canvas, AST parsers, or regex scrubbers is stored strictly in memory and cleared on reload.
- **Offline PWA**: Full Service Worker caching enables 100% offline functionality.
- **Static Edge Export**: Pre-rendered static assets deployable globally to Vercel Edge with zero server runtimes.

---

## 🛠️ Core Client-Side Tools

### 1. SVG & Raster Image Compressor
- **Route**: [`/tools/image-compressor`](https://clientcraft.dev/tools/image-compressor)
- **Engine**: Browser-native Canvas API and `OffscreenCanvas` with bicubic interpolation.
- **Formats**: PNG, JPEG, WebP, SVG vectors, GIF, BMP.
- **Features**:
  - Live Quality slider (5% – 100%) with presets (Max Compression, Balanced, High Quality).
  - Max dimension limits (Original, 1080p, 720p, 800px) maintaining strict aspect ratio constraints.
  - Non-destructive SVG minification (removes XML comments, editor namespaces, doctypes, collapses whitespace).
  - Real-time before/after comparison with byte size reduction metrics and latency counter.
  - Instant client-side download and Base64 Data URI clipboard copying.

### 2. Live JSON to TypeScript & Zod Schema Converter
- **Route**: [`/tools/json-to-typescript`](https://clientcraft.dev/tools/json-to-typescript)
- **Engine**: Client-side recursive AST type generator.
- **Features**:
  - Dual-pane live reactive code editor with real-time JSON syntax validation and error feedback.
  - Generates strongly-typed TypeScript interfaces and complete `zod` validation schemas (`z.object({...})`).
  - Supports ISO 8601 date detection (`z.string().datetime()`), optional properties (`?`), and type aliases.
  - Customizable root interface naming.
  - One-click copy for TypeScript, Zod, and instant `.ts` file export.
  - Built-in sample payloads (User Profile, E-Commerce Order, Paginated API).

### 3. AI Prompt & PII Privacy Scrubber
- **Route**: [`/tools/text-privacy-scrubber`](https://clientcraft.dev/tools/text-privacy-scrubber)
- **Engine**: Client-side high-throughput regex redaction pipeline.
- **Detected Entities**:
  - API Keys & Secrets: OpenAI (`sk-...`), AWS (`AKIA...`), GitHub (`ghp_...`), Google (`AIza...`), Slack (`xox...`), JWT Bearer tokens, and generic secrets.
  - Email addresses (RFC 5322 compliant).
  - IPv4 and IPv6 addresses.
  - International & US telephone numbers.
  - Credit Card numbers & US Social Security Numbers.
- **Redaction Styles**:
  - **Tokenized Placeholder** (`[API_KEY_1]`, `[EMAIL_1]`): Retains entity continuity across prompts for external LLMs.
  - **Generic Placeholder** (`[REDACTED_API_KEY]`, `[REDACTED_EMAIL]`).
  - **Masked** (`sk-***1234`, `j***@corp.com`).
  - **Erase Completely**.
- Real-time Entity Inspector breakdown drawer and detection statistics.

---

## 🛡️ Error Hardening & Resilience

- **Custom React Error Boundaries (`components/ui/ErrorBoundary.tsx`)**:
  - Isolated component boundaries wrapping each tool so runtime crashes never break the entire application.
  - **Out-of-Memory (OOM) Detection**: Catches browser memory allocation limits on oversized image canvas buffers and guides users to reduce target dimensions or quality without a page reload.
  - **Graceful Recovery**: One-click "Recover & Reset Tool" button that flushes local state and re-renders cleanly.
- **Chunk Loading Retry Handler (`components/ChunkRetryHandler.tsx`)**:
  - Global listener catching `ChunkLoadError` or dynamic import failures during transient network drops.
  - Performs automated exponential-backoff retries and refreshes stale chunk caches on reconnect.

---

## 📱 Progressive Web App (PWA) & Offline Resilience

- **Service Worker (`public/sw.js`)**:
  - Caches all JS bundles, CSS stylesheets, web fonts (`.woff2`), icons, and static routes on initial load.
  - Cache-first strategy for immutable assets; network-first with offline fallback for navigation.
- **Web App Manifest (`public/manifest.json`)**: Configured with maskable vector icons (192px & 512px) and standalone display for native installation on desktop and mobile.
- **Reactive Offline Indicator (`components/PwaRegister.tsx`)**: Real-time connection badge in header and floating toast notification informing users when operating in offline mode.

---

## 🌐 Programmatic SEO Architecture

- **Dedicated Static Landing Pages**:
  - `/tools/image-compressor`
  - `/tools/json-to-typescript`
  - `/tools/text-privacy-scrubber`
- **JSON-LD Structured Data**: Each tool page embeds `schema.org/SoftwareApplication` and `schema.org/FAQPage` structured data for enhanced Google Search rich snippets.
- **Dynamic Sitemap (`app/sitemap.ts`)**: Pre-rendered to `/sitemap.xml` with priority weighting and change frequencies.
- **Robots.txt (`app/robots.ts`)**: Pre-rendered to `/robots.txt` guiding search engine crawlers.

---

## 💎 Passive Monetization Architecture

1. **EthicalAds / Carbon Ads Integration (`components/monetization/EthicalAdCard.tsx`)**:
   - Modular developer ad placement with cookieless tracking.
   - **Ad-Blocker Detection**: Automatically detects active ad blockers (e.g. uBlock, Brave Shields) and flips to a high-converting, privacy-first sponsor card: *"Ad-Blocker Active — We respect your privacy! Support ClientCraft directly"*.
2. **Support & Pro Bundle Modal (`components/monetization/ProModal.tsx`)**:
   - **Lemon Squeezy Overlay Checkout**: Frictionless card and wallet payments.
   - **Crypto Direct**: One-click clipboard copy for USDT-TRC20 (`TLyqzV83v7bC9YgU8j7f4X6k5aR3e8wM2p`) and Ethereum addresses.
3. **Cryptographic License Verification (`lib/monetization/license-verifier.ts`)**:
   - Pure client-side Web Crypto API (`crypto.subtle`) HMAC-SHA256 signature verification.
   - Stores verified state in `localStorage` with zero server communication.
   - **Instant Demo Keys for Evaluation**:
     - Pro Supporter: `CCPRO-eyJ0aWVyIjoicHJvX3N1cHBvcnRlciIsImxpY2Vuc2VkVG8iOiJkZXZlbG9wZXJAY2xpZW50Y3JhZnQuZGV2IiwiaXNzdWVkQXQiOjE3NjAxMDQwMDAwMDB9-d130e9d6d4ae7339c636f90d4e92a8bc333cba73e6a6a2a537fce0a775d71c4c`
     - Enterprise Lifetime: `CCPRO-eyJ0aWVyIjoiZW50ZXJwcmlzZV9saWZldGltZSIsImxpY2Vuc2VkVG8iOiJhcmNoaXRlY3RAY2xpZW50Y3JhZnQuZGV2IiwiaXNzdWVkQXQiOjE3NjAxMDQwMDAwMDB9-21696a84cf9dc2ab5eef1d6688177543a6aa01e916ce0cf94e4ae0f1e0026e63`

---

## 📊 Privacy-Preserving Cookieless Analytics

- **Cloudflare Web Analytics (`components/analytics/PrivacyAnalytics.tsx`)**: Optional cookieless beacon activated via `NEXT_PUBLIC_CF_ANALYTICS_TOKEN`.
- **In-Memory Event Bus (`lib/analytics.ts`)**: Dispatches non-identifying telemetry (`image_compressed`, `json_converted`, `privacy_scrubbed`, `pro_unlocked`) with zero cookies, zero device fingerprinting, and zero personal data.

---

## ⚙️ CI/CD & Automated Verification

- **GitHub Actions Workflow (`.github/workflows/ci.yml`)**:
  - Automated ESLint analysis on every push/PR.
  - Strict TypeScript compiler type validation (`tsc --noEmit`).
  - Next.js static production build execution (`npm run build`).
  - Comprehensive static artifact assertion verifying generated HTML, sitemap, and robots.
- **Lighthouse CI (`.lighthouserc.json`)**:
  - Automated audit asserting **95+ scores** across:
    - **Performance**: ≥ 0.95
    - **Accessibility**: ≥ 0.95
    - **Best Practices**: ≥ 0.95
    - **SEO**: ≥ 0.95

---

## ⚡ Deployment & Build

```bash
# Development
npm run dev

# Static Production Build
npm run build
```
Pre-renders all static pages, tool landing pages, sitemap, and robots into `out/` with 100% static HTML.
