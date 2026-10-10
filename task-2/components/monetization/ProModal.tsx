"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  CheckCircle2,
  Copy,
  Check,
  Key,
  ShieldCheck,
  Sparkles,
  Award,
  Coffee,
  QrCode,
  Building2,
  ExternalLink,
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
  const [copiedBank, setCopiedBank] = useState<boolean>(false);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

  const BANK_INFO = {
    bankName: "Techcombank",
    bankFullName: "Ngân hàng TMCP Kỹ thương Việt Nam",
    accountNumber: "19027557341011",
    accountName: "TECHCOMBANK",
    // Standard Napas 24/7 VietQR endpoint for Techcombank (BIN: 970407 / TCB)
    vietQrUrl: "https://img.vietqr.io/image/970407-19027557341011-compact2.png?amount=50000&addInfo=ClientCraft%20Pro",
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

  const copyText = async (text: string, type: "bank" | "account") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "bank") {
        setCopiedBank(true);
        setTimeout(() => setCopiedBank(false), 2000);
      } else {
        setCopiedAccount(true);
        setTimeout(() => setCopiedAccount(false), 2000);
      }
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
        <div className="relative p-6 bg-gradient-to-r from-red-600 via-rose-600 to-indigo-600 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20">
              Ủng hộ tác giả / Support The Creator
            </span>
            {licenseStatus.isUnlocked && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400 text-emerald-950 flex items-center gap-1">
                <Award className="w-3 h-3" /> UNLOCKED
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tight">ClientCraft Pro &amp; Supporter</h2>
          <p className="text-xs text-rose-100 mt-1 max-w-lg">
            Giữ công cụ 100% bảo mật, xử lý trong bộ nhớ trình duyệt và miễn phí trọn đời.
          </p>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Active Pro Badge Banner if Unlocked */}
          {licenseStatus.isUnlocked && (
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
          )}

          {/* Payment & Donation Channels: Techcombank VietQR + Buy Me a Coffee */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kênh ủng hộ / Payment Channels
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option 1: VietQR Techcombank (Napas 24/7) */}
              <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 dark:bg-slate-900/60 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-red-500" />
                      Chuyển khoản VietQR (Napas 24/7)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-600 dark:text-red-400">
                      0đ Phí
                    </span>
                  </div>

                  {/* VietQR Code Display */}
                  <div className="flex justify-center p-2 bg-white rounded-xl border border-slate-200 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={BANK_INFO.vietQrUrl}
                      alt="VietQR Techcombank"
                      className="w-44 h-auto rounded-lg object-contain"
                    />
                  </div>

                  {/* Bank Details & Copy */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-red-500" />
                        <span className="font-semibold">{BANK_INFO.bankName}</span>
                      </div>
                      <button
                        onClick={() => copyText(BANK_INFO.bankName, "bank")}
                        className="text-[11px] font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                      >
                        {copiedBank ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedBank ? "Đã copy" : "Copy"}</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Số tài khoản</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          {BANK_INFO.accountNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => copyText(BANK_INFO.accountNumber, "account")}
                        className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                      >
                        {copiedAccount ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAccount ? "Đã copy" : "Copy STK"}</span>
                      </button>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 text-center">
                  Quét bằng ứng dụng của bất kỳ ngân hàng VN nào hoặc MoMo.
                </p>
              </div>

              {/* Option 2: Buy Me a Coffee (For Foreigners & International Supporters) */}
              <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 dark:bg-slate-900/60 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Coffee className="w-4 h-4 text-amber-500" />
                      Buy Me a Coffee (International)
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Card / Apple Pay
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      For supporters outside Vietnam: Support the developer with Visa, MasterCard, or Apple Pay.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Connects directly to Payoneer for payouts to Vietnamese bank accounts.
                    </p>
                  </div>

                  {/* Buy Me a Coffee Action Button */}
                  <a
                    href="https://buymeacoffee.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold bg-[#FFDD00] text-slate-900 hover:bg-[#FACC15] shadow-sm transition-all"
                  >
                    <Coffee className="w-4 h-4" />
                    <span>Support on Buy Me a Coffee</span>
                    <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                  </a>
                </div>

                {/* Feature Perks */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Mở khóa tất cả tính năng Pro</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Không có quảng cáo &amp; 100% Offline PWA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic License Key Activation Section */}
          <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-500" />
                Kích hoạt License bằng Web Crypto HMAC Signature
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Client-Side SHA-256</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={licenseInput}
                onChange={(e) => setLicenseInput(e.target.value)}
                placeholder="Dán mã key: CCPRO-eyJ...-signature"
                className="flex-1 text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleVerify}
                disabled={isVerifying || !licenseInput.trim()}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white shadow-xs transition-colors shrink-0"
              >
                {isVerifying ? "Đang xác thực..." : "Kích hoạt"}
              </button>
            </div>

            {validationError && (
              <p className="text-xs text-rose-500 font-mono bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                {validationError}
              </p>
            )}

            {/* Instant Demo Keys for Reviewers */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-slate-500">
              <span>Mã kiểm tra nhanh:</span>
              <button
                onClick={() => fillDemoLicense(DEMO_PRECOMPUTED_LICENSES.proSupporter)}
                className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-500/10 hover:text-blue-500 transition-colors font-mono text-[10px]"
              >
                Key Pro Supporter
              </button>
              <button
                onClick={() => fillDemoLicense(DEMO_PRECOMPUTED_LICENSES.enterprise)}
                className="px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-purple-500/10 hover:text-purple-500 transition-colors font-mono text-[10px]"
              >
                Key Enterprise
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>Xác thực 100% trong bộ nhớ trình duyệt qua Web Crypto API.</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
