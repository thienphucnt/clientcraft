"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { Footer } from "@/components/ui/Footer";
import { ImageCompressor } from "@/components/tools/ImageCompressor";
import { JsonConverter } from "@/components/tools/JsonConverter";
import { PrivacyScrubber } from "@/components/tools/PrivacyScrubber";
import { EthicalAdCard } from "@/components/monetization/EthicalAdCard";
import { ProModal } from "@/components/monetization/ProModal";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
  Sparkles,
  Code2,
  ShieldCheck,
  Zap,
  Lock,
  Cpu,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("image");
  const [isProModalOpen, setIsProModalOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Global Header with Pro Modal Trigger */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProModal={() => setIsProModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Privacy & Architecture Banner */}
        <section className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-blue-900/10 via-indigo-900/10 to-purple-900/10 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40 border border-blue-500/20 dark:border-blue-500/15 overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Lock className="w-3.5 h-3.5" />
                <span>Zero Network Transmission Guarantee</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Ultra-Lightweight Client-Side Utility Hub
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Transform images, generate TypeScript/Zod schemas, and sanitize AI prompts directly in your browser&apos;s memory thread. No servers, no tracking, and fully operable offline via PWA.
              </p>
            </div>

            {/* Quick Metrics Badge Grid */}
            <div className="grid grid-cols-2 gap-3 shrink-0 sm:w-80">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Hosting</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Static Vercel Edge</p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Privacy</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">100% In-Memory</p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Execution</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Native Canvas/V8</p>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs border border-slate-200/80 dark:border-slate-800 p-3 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">PWA</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Offline Ready</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Tool Selector Tabs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => setActiveTab("image")}
            className={`cursor-pointer p-4 rounded-2xl border text-left transition-all ${
              activeTab === "image"
                ? "bg-white dark:bg-slate-900 border-blue-500 shadow-md shadow-blue-500/10 ring-1 ring-blue-500"
                : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <Link
                href="/tools/image-compressor"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 flex items-center gap-1 transition-colors"
              >
                <span>Standalone Page</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Image &amp; SVG Compressor</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Compress PNG/JPEG/WebP and optimize SVG vectors with dimensional limits.
            </p>
          </div>

          <div
            onClick={() => setActiveTab("json")}
            className={`cursor-pointer p-4 rounded-2xl border text-left transition-all ${
              activeTab === "json"
                ? "bg-white dark:bg-slate-900 border-indigo-500 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500"
                : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Code2 className="w-4 h-4" />
              </div>
              <Link
                href="/tools/json-to-typescript"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 flex items-center gap-1 transition-colors"
              >
                <span>Standalone Page</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">JSON → TypeScript &amp; Zod</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Converts raw JSON into nested TypeScript interfaces and Zod validation schemas.
            </p>
          </div>

          <div
            onClick={() => setActiveTab("scrubber")}
            className={`cursor-pointer p-4 rounded-2xl border text-left transition-all ${
              activeTab === "scrubber"
                ? "bg-white dark:bg-slate-900 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500"
                : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <Link
                href="/tools/text-privacy-scrubber"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1 transition-colors"
              >
                <span>Standalone Page</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Text Privacy Scrubber</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              Strip API keys, secrets, emails, and IPs before sending prompts to external LLMs.
            </p>
          </div>
        </section>

        {/* Active Tool Viewport Wrapped with Error Boundaries */}
        <section className="bg-white/90 dark:bg-slate-900/70 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xs backdrop-blur-xs">
          {activeTab === "image" && (
            <ErrorBoundary toolName="Image & SVG Compressor">
              <ImageCompressor />
            </ErrorBoundary>
          )}

          {activeTab === "json" && (
            <ErrorBoundary toolName="JSON to TypeScript & Zod">
              <JsonConverter />
            </ErrorBoundary>
          )}

          {activeTab === "scrubber" && (
            <ErrorBoundary toolName="AI Prompt Privacy Scrubber">
              <PrivacyScrubber />
            </ErrorBoundary>
          )}
        </section>

        {/* Ethical Ad Placement */}
        <EthicalAdCard onOpenProModal={() => setIsProModalOpen(true)} />
      </main>

      {/* Pro Modal */}
      <ProModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
      />

      {/* Global Footer */}
      <Footer />
    </div>
  );
}
