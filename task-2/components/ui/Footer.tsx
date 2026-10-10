import React from "react";
import Link from "next/link";
import { Compass, Zap, Lock, FileCode2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Card 1: Flat-file Architecture */}
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <FileCode2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Database-Free Flat-File Architecture
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Powered by Git-versioned JSON in <code className="text-[11px] font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">/content/listings/*.json</code> validated with Zod. Zero database connection pools, zero SQL injections, zero downtime.
              </p>
            </div>
          </div>

          {/* Card 2: Performance */}
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                100% Static Vercel SSG
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Pre-rendered at build time with Next.js 15 App Router static export. Served from Vercel Edge with immutable caching headers and 0ms compute latency.
              </p>
            </div>
          </div>

          {/* Card 3: Privacy & Utilities */}
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                In-Memory Client Privacy Suite
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Integrated client-side image compression, JSON schema generation, and AI prompt sanitization running 100% offline via Service Worker PWA.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-blue-500" />
            <span>DevStack Directory • Modern Flat-File Tech Catalog &amp; Utilities</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/#catalog" className="hover:text-blue-500 transition-colors">
              Directory
            </Link>
            <Link href="/tools/image-compressor" className="hover:text-blue-500 transition-colors">
              Image Tool
            </Link>
            <Link href="/tools/json-to-typescript" className="hover:text-blue-500 transition-colors">
              JSON Tool
            </Link>
            <Link href="/tools/text-privacy-scrubber" className="hover:text-blue-500 transition-colors">
              Privacy Tool
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
