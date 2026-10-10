"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, Download, CheckCircle2 } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PwaRegister() {
  const [isOnline, setIsOnline] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setToastMessage("Network reconnected. All local utilities remain cached.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setToastMessage("You are now offline. ClientCraft is operating in 100% offline PWA mode.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 5000);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.debug("PWA service worker registration skipped:", err));
    }

    // PWA Install prompt listener
    const beforeInstallHandler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", beforeInstallHandler);

    window.addEventListener("appinstalled", () => {
      setInstalled(true);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", beforeInstallHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setInstalled(true);
    }
    setInstallPrompt(null);
  };

  return (
    <>
      <div className="flex items-center gap-2 text-xs">
        {/* Header Online / Offline indicator badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all ${
            isOnline
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          }`}
          title={isOnline ? "Network Connected & PWA Cached" : "Operating in Offline Mode via Service Worker"}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-medium">Offline Ready</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 animate-pulse" />
              <span className="font-semibold">Offline PWA</span>
            </>
          )}
        </div>

        {/* PWA Install Button if available */}
        {installPrompt && !installed && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all font-medium"
          >
            <Download className="w-3 h-3" />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {installed && (
          <span className="hidden md:flex items-center gap-1 text-slate-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Installed</span>
          </span>
        )}
      </div>

      {/* Floating Offline Toast Notification */}
      {showToast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white border border-slate-700 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 max-w-sm text-xs">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span className="font-medium leading-relaxed">{toastMessage}</span>
        </div>
      )}
    </>
  );
}
