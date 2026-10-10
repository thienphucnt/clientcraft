"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Heart, Sparkles, ExternalLink, Award } from "lucide-react";
import { getStoredLicense } from "@/lib/monetization/license-verifier";

interface EthicalAdCardProps {
  onOpenProModal?: () => void;
  className?: string;
  isPro?: boolean;
}

export function EthicalAdCard({ onOpenProModal, className = "", isPro: propIsPro }: EthicalAdCardProps) {
  const [isAdBlockerActive, setIsAdBlockerActive] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [internalIsPro, setInternalIsPro] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    if (propIsPro !== undefined) {
      setInternalIsPro(propIsPro);
    } else {
      getStoredLicense().then((s) => setInternalIsPro(s.isUnlocked));
    }

    // Ad blocker probe
    const testAd = document.createElement("div");
    testAd.innerHTML = "&nbsp;";
    testAd.className = "adsbox ad-placement carbon-ads ethical-ad";
    testAd.style.position = "absolute";
    testAd.style.left = "-9999px";
    testAd.style.top = "-9999px";
    document.body.appendChild(testAd);

    const checkTimeout = setTimeout(() => {
      const isBlocked =
        testAd.offsetHeight === 0 ||
        testAd.clientHeight === 0 ||
        window.getComputedStyle(testAd).display === "none";
      setIsAdBlockerActive(isBlocked);
      if (document.body.contains(testAd)) {
        document.body.removeChild(testAd);
      }
    }, 100);

    return () => {
      clearTimeout(checkTimeout);
      if (document.body.contains(testAd)) {
        document.body.removeChild(testAd);
      }
    };
  }, [propIsPro]);

  const isPro = propIsPro !== undefined ? propIsPro : internalIsPro;

  if (!mounted) {
    return (
      <div className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 animate-pulse h-28 ${className}`} />
    );
  }

  // When Pro is active, show clean supporter acknowledgment card instead of ads
  if (isPro) {
    return (
      <div
        className={`p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Pro Supporter Active
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                Ads Silenced
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              All advertisements and sponsorship prompts are permanently disabled for your device. Thank you for supporting privacy-first open web tools!
            </p>
          </div>
        </div>

        {onOpenProModal && (
          <button
            onClick={onOpenProModal}
            className="shrink-0 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
          >
            Manage License
          </button>
        )}
      </div>
    );
  }

  // Fallback card when ad-blocker is detected
  if (isAdBlockerActive) {
    return (
      <div
        className={`p-4 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 dark:bg-slate-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Ad-Blocker Active — We Respect Your Privacy!
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                No Trackers
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              ClientCraft never tracks users or stores cookies. If our free tools save you hours of work, consider supporting development directly.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenProModal}
          className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-transform active:scale-95"
        >
          <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300" />
          <span>Support &amp; Unlock Pro</span>
        </button>
      </div>
    );
  }

  // Privacy-friendly native EthicalAds / Carbon placeholder
  return (
    <div
      className={`p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${className}`}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Sponsored by Ethical Developer Network
            </span>
            <span className="text-[10px] text-slate-400 font-mono">100% Cookieless</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Deploy high-performance static sites at edge speed with automated CI/CD and zero runtime servers.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <a
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2.5 py-1"
        >
          <span>Learn More</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <button
          onClick={onOpenProModal}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
        >
          Hide Ads
        </button>
      </div>
    </div>
  );
}
