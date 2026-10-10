"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Compass,
  Sparkles,
  Cpu,
  ShieldCheck,
  Zap,
  Award,
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { PwaRegister } from "../PwaRegister";
import { getStoredLicense } from "@/lib/monetization/license-verifier";

interface HeaderProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onOpenProModal?: () => void;
}

export function Header({ activeTab, setActiveTab, onOpenProModal }: HeaderProps) {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    getStoredLicense().then((s) => setIsPro(s.isUnlocked));
  }, []);

  const navItems = [
    { id: "directory", href: "/#catalog", label: "Directory", icon: Compass },
    { id: "image", href: "/tools/image-compressor", label: "Image Compressor", icon: Sparkles },
    { id: "json", href: "/tools/json-to-typescript", label: "JSON → TS / Zod", icon: Cpu },
    { id: "scrubber", href: "/tools/text-privacy-scrubber", label: "Privacy Scrubber", icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-950/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-white dark:via-blue-200 dark:to-indigo-200 bg-clip-text text-transparent">
                  DevStack
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  SSG Catalog
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Flat-File Tech Directory &amp; Client Suite
              </p>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (setActiveTab && item.id !== "directory") {
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`} />
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-blue-500" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2.5">
            {/* Pro Button */}
            {onOpenProModal && (
              <button
                onClick={onOpenProModal}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isPro
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs shadow-blue-500/20 active:scale-95"
                }`}
              >
                {isPro ? (
                  <>
                    <Award className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Pro Active</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span className="hidden sm:inline">Upgrade Pro</span>
                    <span className="sm:hidden">Pro</span>
                  </>
                )}
              </button>
            )}

            <PwaRegister />
            <ThemeToggle />
          </div>
        </div>

        {/* Mobile Navigation Links */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-200/50 dark:border-slate-800/50 overflow-x-auto gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-blue-600 text-white font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
