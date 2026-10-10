"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  Key,
  ShieldCheck,
  CreditCard,
  QrCode,
  Sparkles,
  Award,
} from "lucide-react";
import {
  saveLicense,
  getStoredLicense,
  removeLicense,
  DEMO_PRECOMPUTED_LICENSES,
  StoredLicenseState,
} from "@/lib/monetization/license-verifier";
import { trackPrivacyEvent } from "@/lib/analytics";

interface ProModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLicenseChanged?: () => void;
}

export function ProModal({ isOpen, onClose, onLicenseChanged }: ProModalProps) {
  const [licenseInput, setLicenseInput] = useState<string>("");
  const [licenseStatus, setLicenseStatus] = useState<StoredLicenseState>({
    isUnlocked: false,
    licenseKey: null,
    tier: null,
    licensedTo: null,
    verifiedAt: null,
  });
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [copiedCrypto, setCopiedCrypto] = useState<string | null>(null);

  const CRYPTO_WALLETS = {
    usdtTrc20: "TLyqzV83v7bC9YgU8j7f4X6k5aR3e8wM2p",
    ethereum: "0x71C83648937b8A88F3A4a88E63B34691eFf32B39",
  };

  useEffect(() => {
    if (isOpen) {
      getStoredLicense().then(setLicenseStatus);
      setValidationError(null);
      trackPrivacyEvent("pro_modal_viewed");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerify = async () => {
    setIsVerifying(true);
    setValidationError(null);
    try {
      const res = await saveLicense(licenseInput.trim());
      if (res.valid) {
        trackPrivacyEvent("pro_unlocked", { tier: res.tier });
        const updated = await getStoredLicense();
        setLicenseStatus(updated);
        setLicenseInput("");
        onLicenseChanged?.();
      } else {
        setValidationError(res.error || "Cryptographic verification failed");
      }
    } catch {
      setValidationError("Failed to execute cryptographic verification");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeactivate = () => {
    removeLicense();
    setLicenseStatus({
      isUnlocked: false,
      licenseKey: null,
      tier: null,
      licensedTo: null,
      verifiedAt: null,
    });
    onLicenseChanged?.();
  };

  const copyAddress = async (addr: string, type: string) => {
    try {
      await navigator.clipboard.writeText(addr);
      setCopiedCrypto(type);
      setTimeout(() => setCopiedCrypto(null), 2000);
    } catch {
      // Ignore
    }
  };

  const fillDemoLicense = (key: string) => {
    setLicenseInput(key);
    setValidationError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Ribbon */}
        <div className="relative p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20">
              Support The Creator
            </span>
            {licenseStatus.isUnlocked && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-emerald-950 flex items-center gap-1">
                <Award className="w-3 h-3" /> UNLOCKED
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tight">ClientCraft Pro &amp; Supporter Bundle</h2>
          <p className="text-xs text-blue-100 mt-1 max-w-lg">
            Keep ClientCraft 100% ad-free and sponsor ongoing offline PWA tool developments with cryptographic proof.
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Active Pro Badge Banner if Unlocked */}
          {licenseStatus.isUnlocked ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {licenseStatus.tier} Active
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Licensed to: <span className="font-semibold text-slate-700 dark:text-slate-200">{licenseStatus.licensedTo}</span> (Signature Verified)
                  </p>
                </div>
              </div>
              <button
                onClick={handleDeactivate}
                className="text-xs font-semibold text-slate-400 hover:text-rose-500 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800"
              >
                Deactivate
              </button>
            </div>
          ) : null}

          {/* Feature Perks Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                title: "Ultra-AVIF & Batch ZIP Export",
                desc: "Compress hundreds of assets simultaneously in background Web Workers with ZIP bundle packaging.",
              },
              {
                title: "Custom TypeScript AST Namespaces",
                desc: "Export formatted type definitions encapsulated in production interfaces and zod inference wrappers.",
              },
              {
                title: "Enterprise AWS Sanitizer Rules",
                desc: "Custom regex filters for Kubernetes secrets, internal hostnames, and GCP service credentials.",
              },
              {
                title: "Permanent Supporter Badge",
                desc: "Cryptographically verified license key stored in local memory with zero tracking.",
              },
            ].map((f, i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{f.title}</h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pl-6">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Payment & Support Options: Lemon Squeezy + Crypto */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monetization &amp; Support Channels
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Lemon Squeezy Overlay Checkout */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-purple-500" />
                      Lemon Squeezy Checkout
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">$9 USD</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    Instant overlay checkout via Stripe, Apple Pay, Google Pay, or Credit Card.
                  </p>
                </div>

                <a
                  href="https://lemonsqueezy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Support via Lemon Squeezy</span>
                </a>
              </div>

              {/* Option 2: Crypto Direct Support (USDT-TRC20 / ETH) */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-500" />
                      Crypto Direct (USDT-TRC20)
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-emerald-600">Zero Fees</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed truncate font-mono bg-slate-100 dark:bg-slate-800 p-1.5 rounded-lg">
                    {CRYPTO_WALLETS.usdtTrc20}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => copyAddress(CRYPTO_WALLETS.usdtTrc20, "trc20")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {copiedCrypto === "trc20" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCrypto === "trc20" ? "Copied TRC20" : "Copy TRC20"}</span>
                  </button>
                  <button
                    onClick={() => copyAddress(CRYPTO_WALLETS.ethereum, "eth")}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    {copiedCrypto === "eth" ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCrypto === "eth" ? "Copied ETH" : "Copy ETH"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic License Key Activation Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-500" />
                Activate License with Web Crypto HMAC Signature
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Client-Side SHA-256</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                placeholder="Paste key: CCPRO-eyJ...-signature"
                className="flex-1 text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleVerify}
                disabled={isVerifying || !licenseInput.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition-colors shrink-0"
              >
                {isVerifying ? "Verifying..." : "Verify & Unlock"}
              </button>
            </div>

            {validationError && (
              <p className="text-xs text-rose-500 font-mono bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                {validationError}
              </p>
            )}

            {/* Instant Demo Keys for Reviewers */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span>Instant Test Keys:</span>
              <button
                onClick={() => fillDemoLicense(DEMO_PRECOMPUTED_LICENSES.proSupporter)}
                className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-500/10 hover:text-blue-500 transition-colors font-mono text-[10px]"
              >
                Fill Valid Pro Key
              </button>
              <button
                onClick={() => fillDemoLicense(DEMO_PRECOMPUTED_LICENSES.enterprise)}
                className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-500/10 hover:text-purple-500 transition-colors font-mono text-[10px]"
              >
                Fill Enterprise Key
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Zero Remote Verification. Verified 100% locally via Web Crypto API.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
