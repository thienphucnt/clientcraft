# ClientCraft — Privacy-First Web Utility Suite

> **Ultra-lightweight, high-performance web utility hub engineered for 100% client-side in-memory execution, static Vercel Edge hosting, and offline PWA capability.**

---

## 🔒 Architectural Philosophy: Zero Network Transmission

Every utility in ClientCraft operates strictly in the client's browser V8 engine thread:
- **0 Server Relays**: No API backends, no database logging, no external server calls.
- **In-Memory Volatility**: Data loaded into Canvas or AST parsers is stored strictly in memory and cleared on reload.
- **Offline PWA**: Full Service Worker caching enables 100% offline functionality.
- **Static Edge Export**: Pre-rendered static assets deployable globally to Vercel Edge with zero server runtimes.

---

## 🛠️ Core Client-Side Tools

### 1. SVG & Raster Image Compressor
- **Engine**: Browser-native Canvas API and `OffscreenCanvas` with bicubic interpolation.
- **Formats**: PNG, JPEG, WebP, SVG vectors, GIF, BMP.
- **Features**:
  - Live Quality slider (5% – 100%) with presets (Max Compression, Balanced, High Quality).
  - Max dimension limits (Original, 1080p, 720p, 800px) maintaining strict aspect ratio constraints.
  - Non-destructive SVG minification (removes XML comments, editor namespaces, doctypes, collapses whitespace).
  - Real-time before/after comparison with byte size reduction metrics and latency counter.
  - Instant client-side download and Base64 Data URI clipboard copying.

### 2. Live JSON to TypeScript & Zod Schema Converter
- **Engine**: Client-side recursive AST type generator.
- **Features**:
  - Dual-pane live reactive code editor with real-time JSON syntax validation and error feedback.
  - Generates strongly-typed TypeScript interfaces and complete `zod` validation schemas (`z.object({...})`).
  - Supports ISO 8601 date detection (`z.string().datetime()`), optional properties (`?`), and type aliases.
  - Customizable root interface naming.
  - One-click copy for TypeScript, Zod, and instant `.ts` file export.
  - Built-in sample payloads (User Profile, E-Commerce Order, Paginated API).

### 3. AI Prompt & PII Privacy Scrubber
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

## 📁 Repository Structure

```
├── app/
│   ├── layout.tsx         # Root layout, theme initialization script, PWA metadata
│   ├── page.tsx           # Dashboard hub with interactive tool selector
│   └── globals.css        # Tailwind CSS v4 design tokens and custom scrollbars
├── components/
│   ├── ui/
│   │   ├── Header.tsx     # Brand banner, tool navigation, theme toggle
│   │   ├── Footer.tsx     # Privacy guarantees & system specs
│   │   └── ThemeToggle.tsx# Light / Dark / System theme switcher
│   ├── tools/
│   │   ├── ImageCompressor.tsx # Client-side image & SVG compressor
│   │   ├── JsonConverter.tsx   # Dual-pane JSON to TS/Zod converter
│   │   └── PrivacyScrubber.tsx # AI prompt sanitizer & PII scrubber
│   └── PwaRegister.tsx    # Service Worker registration & offline status indicator
├── lib/
│   ├── tools/
│   │   ├── image-compressor.ts # Canvas & SVG processing engine
│   │   ├── json-to-ts-zod.ts   # AST type generator engine
│   │   └── privacy-scrubber.ts # Regex detection & tokenizing engine
│   └── theme-provider.tsx      # Theme context and localStorage persistence
├── public/
│   ├── icons/             # 192x192 and 512x512 PWA vector icons
│   ├── manifest.json      # PWA Web App Manifest
│   └── sw.js              # Service Worker for offline asset caching
├── next.config.ts         # Next.js 15 static export configuration (`output: 'export'`)
├── vercel.json            # Vercel deployment with aggressive immutable caching
└── tsconfig.json          # Strict TypeScript configuration
```

---

## ⚡ Deployment & Build

### Development
```bash
npm run dev
```

### Static Production Build
```bash
npm run build
```
Builds the static application to the `out/` directory with 100% pre-rendered HTML and client-side JavaScript bundles.

### Vercel Deployment
Configured via `vercel.json` with aggressive immutable caching:
```json
{
  "source": "/_next/static/(.*)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    }
  ]
}
```
Ready to deploy directly with the Vercel CLI:
```bash
npx vercel deploy --prod
```
