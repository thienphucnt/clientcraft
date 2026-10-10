import React from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  Code2,
  Lock,
} from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { DirectoryCatalog } from "@/components/directory/DirectoryCatalog";
import { EthicalAdCard } from "@/components/monetization/EthicalAdCard";
import {
  getAllListings,
  getAllCategories,
  getAllTags,
} from "@/lib/listings/loader";

export const dynamic = "force-static";

export default function HomePage() {
  const listings = getAllListings();
  const categories = getAllCategories();
  const allTags = getAllTags();

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Global Header */}
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Hero Section */}
        <section className="relative rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-blue-900/10 via-indigo-900/10 to-purple-900/10 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-500/20 dark:border-blue-500/15 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Database-Free &amp; SSG-Compiled for Vercel</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Curated Developer Resource &amp; Tech Stack Catalog
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                Discover 20+ battle-tested tools, local AI engines, edge databases, and developer infrastructure. Powered by flat-file Markdown/JSON and static generation with instant client-side filtering.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <a
                  href="#catalog"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                >
                  <span>Explore Directory</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="#utilities"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <span>Client Utilities</span>
                </a>
              </div>
            </div>

            {/* Quick Architecture Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 shrink-0 sm:w-84">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Total Entries</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {listings.length} Verified Tools
                  </p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Categories</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {categories.length} Taxonomies
                  </p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Architecture</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">100% Flat-File</p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 p-3.5 rounded-2xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Database</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">0 Queries (SSG)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Client-Side Interactive Directory Catalog */}
        <DirectoryCatalog
          initialListings={listings}
          categories={categories}
          allTags={allTags}
        />

        {/* Client Utility Suite Feature Section */}
        <section className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800" id="utilities">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                In-Browser Developer Utilities Suite
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                100% client-side in-memory tools. Zero server telemetry, works fully offline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/tools/image-compressor"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50 hover:shadow-md transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Image &amp; SVG Compressor
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                Compress PNG/JPEG/WebP and optimize SVG vectors locally with dimensional constraints.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                <span>Launch Tool</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/tools/json-to-typescript"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500/50 hover:shadow-md transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Code2 className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                JSON → TypeScript &amp; Zod
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                Infer nested TypeScript interfaces and Zod validation schemas from JSON strings.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Launch Tool</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            <Link
              href="/tools/text-privacy-scrubber"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 hover:shadow-md transition-all group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Lock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Text &amp; Prompt Privacy Scrubber
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                Sanitize API keys, secrets, emails, and IPv4 addresses before feeding prompts to LLMs.
              </p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Launch Tool</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </section>

        {/* Ethical Ad & Sponsor Placement */}
        <EthicalAdCard />
      </main>

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
