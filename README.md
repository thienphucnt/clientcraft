# DevStack Directory & ClientCraft Utility Suite

> **A blazing-fast, database-free directory and resource catalog engine powered by flat-file JSON and static site generation (SSG) for Vercel, paired with a 100% client-side privacy-first web utility suite.**

---

## ⚡ Architecture: Flat-File Static Catalog Engine

DevStack Directory is engineered from the ground up for zero-database overhead, sub-millisecond static response times, and zero server maintenance:

- **Database-Free Flat-File Content**: Directory entries are stored as Git-versioned JSON files in `/content/listings/*.json`.
- **Runtime & Build-Time Type Safety**: Validated strictly with Zod schemas (`lib/listings/schema.ts`) and TypeScript.
- **Zero Server Dependencies**: Compiled statically via Next.js 15 App Router static export (`output: "export"` in `next.config.ts`), generating pure static HTML/CSS/JS in `out/`.
- **Global Vercel Edge Delivery**: Instant static edge deployment with immutable caching (`max-age=31536000`) and security headers via `vercel.json`.

---

## 📋 Flat-File Content Schema

Every directory listing entry stored in `/content/listings/*.json` adheres strictly to the following specification:

```typescript
export const ListingSchema = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  category: z.string(),
  tags: z.array(z.string()),
  url: z.string().url(),
  affiliateUrl: z.string().url().nullable().optional(),
  featuredUntil: z.string().nullable().optional(), // ISO 8601 date string
  pricingModel: z.enum(["Free", "Freemium", "Open Source", "Paid", "Free Trial"]),
  dateAdded: z.string(), // YYYY-MM-DD format
  // Extended fields for rich feature breakdowns
  verified: z.boolean().default(true),
  features: z.array(z.string()).default([]),
  pros: z.array(z.string()).default([]),
  cons: z.array(z.string()).default([]),
  targetAudience: z.string().optional(),
  githubUrl: z.string().url().optional(),
  stars: z.string().optional(),
  license: z.string().optional(),
});
```

---

## 🔍 Directory Search & Filtering UI

### 1. Instant Client-Side Search Bar
- Live query matching across `title`, `description`, `category`, `tags`, and `pricingModel`.
- Instant search input with clear button and `/` keyboard shortcut trigger.
- Zero server round-trips for search queries.

### 2. Category Pill Filters
- Interactive category pills with item count badges:
  - *All Categories*
  - *AI & Machine Learning*
  - *Database & Backend*
  - *Developer Tools*
  - *Cloud & Infrastructure*
  - *Security & Auth*
  - *Design & UI*

### 3. Tag Filtering & Multi-Faceted Sorting
- Interactive tag chip cloud (e.g., `#open-source`, `#postgres`, `#sqlite`, `#local-ai`, `#edge`, `#auth`).
- Pricing model filter (All, Free, Freemium, Open Source, Paid, Free Trial).
- Sort options: *Featured First*, *Newest Added*, *Alphabetical (A-Z)*.
- 1-click filter reset with active filter indicators.

### 4. Clean Listing Cards
- Verification badges (`Verified`).
- Featured sponsorship highlight with glowing accents when `featuredUntil` is active.
- Color-coded pricing model badge.
- Clickable tags to filter catalog.
- Direct outbound links with `rel="noopener noreferrer nofollow"`.
- Direct link to programmatic slug details (`/listing/[slug]`).

### 5. Programmatic Slug Pages (`/listing/[slug]`)
- Pre-rendered at build time with `generateStaticParams()` across all 20+ listings.
- Rich hero layout with breadcrumbs and direct outbound CTA (`rel="noopener noreferrer nofollow"`).
- Core architectural feature breakdown checklist.
- Side-by-side advantages and trade-offs (Pros & Cons).
- Technical specification matrix (Catalog ID, Category, Pricing, Verification, Target Audience).
- Related alternatives engine: dynamically finds and scores 3 related tools in the same category or sharing tags.
- Schema.org JSON-LD structured data (`SoftwareApplication`) for rich search engine snippets.

---

## 📦 Sample Tech Data (20 Curated Entries)

The catalog ships with 20 high-quality niche tech entries in `/content/listings/`:

| # | Tool | Category | Pricing Model | Slug |
|---|------|----------|---------------|------|
| 1 | **Ollama** | AI & Machine Learning | Open Source | `ollama` |
| 2 | **Supabase** | Database & Backend | Freemium | `supabase` |
| 3 | **Turso** | Database & Backend | Freemium | `turso` |
| 4 | **Resend** | Developer Tools | Freemium | `resend` |
| 5 | **Coolify** | Cloud & Infrastructure | Open Source | `coolify` |
| 6 | **PocketBase** | Database & Backend | Open Source | `pocketbase` |
| 7 | **Biome** | Developer Tools | Open Source | `biome` |
| 8 | **v0 by Vercel** | AI & Machine Learning | Freemium | `v0-dev` |
| 9 | **shadcn/ui** | Design & UI | Open Source | `shadcn-ui` |
| 10 | **Unkey** | Security & Auth | Freemium | `unkey` |
| 11 | **Val Town** | Developer Tools | Freemium | `val-town` |
| 12 | **Tinybird** | Cloud & Infrastructure | Freemium | `tinybird` |
| 13 | **Plausible Analytics** | Cloud & Infrastructure | Free Trial | `plausible` |
| 14 | **Convex** | Database & Backend | Freemium | `convex` |
| 15 | **Trigger.dev** | Developer Tools | Freemium | `trigger-dev` |
| 16 | **Upstash** | Cloud & Infrastructure | Freemium | `upstash` |
| 17 | **authentik** | Security & Auth | Open Source | `authentik` |
| 18 | **SVGL** | Design & UI | Free | `svgl` |
| 19 | **Better Auth** | Security & Auth | Open Source | `better-auth` |
| 20 | **Hugging Face Transformers** | AI & Machine Learning | Open Source | `transformers` |

---

## 🛠️ In-Browser Utility Suite

ClientCraft's 100% offline-ready utility suite remains integrated:
- **Image & SVG Compressor** (`/tools/image-compressor`)
- **JSON → TypeScript & Zod** (`/tools/json-to-typescript`)
- **Prompt & Text Privacy Scrubber** (`/tools/text-privacy-scrubber`)

---

## 🚀 Build & Deployment Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run ESLint linter
npm run lint

# Export static build (generates /out with 0 server dependencies)
npm run build
```

---

## 🌐 Vercel Deployment Configuration (`vercel.json`)

```json
{
  "version": 2,
  "cleanUrls": true,
  "trailingSlash": true,
  "headers": [
    {
      "source": "/_next/static/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```
