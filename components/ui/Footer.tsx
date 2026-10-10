import React from "react";
import { Shield, Zap, Lock, Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/50 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Card 1: Privacy Architecture */}
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Zero-Telemetry In-Memory Execution
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Images, JSON payloads, and sensitive tokens are strictly evaluated inside your browser&apos;s local V8 thread. No remote API requests or cookies.
              </p>
            </div>
          </div>

          {/* Card 2: Performance */}
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Static Vercel Edge &amp; PWA
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Pre-rendered statically with Next.js 15 App Router export. Aggressive immutable asset caching (<code className="text-[11px] font-mono bg-slate-200 dark:bg-slate-800 px-1 py-0.5 rounded">max-age=31536000</code>).
              </p>
            </div>
          </div>

          {/* Card 3: Modern Web Stack */}
          <div className="flex gap-3.5 items-start">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                Hardware Accelerated Canvas
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Client-side Canvas and OffscreenCanvas with bicubic smoothing. Instant WebP/JPEG/PNG rendering and non-destructive SVG cleanup.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>ClientCraft • 100% Client-Side Privacy Utility Hub</span>
          </div>
          <div>
            Built with Next.js 15 • TypeScript • Tailwind CSS • Lucide React
          </div>
        </div>
      </div>
    </footer>
  );
}
