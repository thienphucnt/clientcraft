"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  RefreshCw,
  Sun,
  Moon,
  ShieldCheck,
  CalendarClock,
  Trophy,
} from "lucide-react";
import {
  calculateNetPayout,
  formatVND,
  GAME_CONFIGS,
  GameConfig,
  getICTTelemetryClock,
  HistoricalDraw,
  MEGA_645_SEED_DRAWS,
  POWER_655_SEED_DRAWS,
  SyncStatusResponse,
} from "@/lib/vietlottData";

interface ExecutiveHeaderProps {
  theme: "dark" | "light";
  onToggleTheme: () => void;
  syncStatus: SyncStatusResponse | null;
  isSyncing: boolean;
  onTriggerSync: () => void;
  powerConfig?: GameConfig;
  megaConfig?: GameConfig;
}

export function ExecutiveHeader({
  theme,
  onToggleTheme,
  syncStatus,
  isSyncing,
  onTriggerSync,
  powerConfig,
  megaConfig,
}: ExecutiveHeaderProps) {
  const [clock, setClock] = useState(() =>
    getICTTelemetryClock(new Date("2026-10-28T08:00:00+07:00"))
  );

  useEffect(() => {
    setClock(getICTTelemetryClock(new Date()));
    const timer = setInterval(() => {
      setClock(getICTTelemetryClock(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const powerCfg = powerConfig ?? GAME_CONFIGS["6/55"];
  const megaCfg = megaConfig ?? GAME_CONFIGS["6/45"];

  return (
    <header className="w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md sticky top-0 z-30">
      {/* Top Bar: Brand Title, Live ICT Clock & Cutoff Countdown, Sync & Theme Controls */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Brand & Schedule Quick Reminder */}
        <div className="flex items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-amber-500 to-indigo-600 flex items-center justify-center text-white font-mono font-black text-lg shadow-md shrink-0">
              QM
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Vietlott QuantMatrix Pro
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  Live Calibrated: 6/55 #{powerCfg.latestDrawId} • 6/45 #{megaCfg.latestDrawId}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                7-Day Rolling Combinatorial Sieve &amp; 5-Strategy Algorithmic Ballot Dashboard
              </p>
            </div>
          </div>

          {/* Mobile Theme Toggle */}
          <button
            type="button"
            data-testid="theme-toggle-mobile"
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>

        {/* Live ICT Telemetry Clock, Cutoff Countdown, Data Sync & Desktop Theme Toggle */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* ICT Clock Pill */}
          <div
            data-testid="ict-live-clock"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0 animate-pulse" />
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 dark:text-slate-400">ICT (UTC+7):</span>
              <strong className="text-slate-900 dark:text-white">
                {clock.weekday.slice(0, 3)} {clock.isoDate} {clock.timeString}
              </strong>
            </div>
          </div>

          {/* 17:30 Cutoff / 18:00 Broadcast Countdown Pill */}
          <div
            data-testid="draw-cutoff-countdown"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono"
          >
            <CalendarClock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              {clock.isMonday ? (
                <span className="text-amber-700 dark:text-amber-300 font-semibold">
                  Mon Rest Day • Tue 6/55 Cutoff in {clock.cutoffCountdownFormatted}
                </span>
              ) : clock.phase === "TICKET_SALES_OPEN" ? (
                <span className="text-amber-700 dark:text-amber-300">
                  17:30 Cutoff: <strong>{clock.cutoffCountdownFormatted}</strong> (18:00{" "}
                  {clock.activeGameToday} Draw)
                </span>
              ) : clock.phase === "LIVE_DRAW_BROADCAST" ? (
                <span className="text-red-600 dark:text-red-400 font-bold">
                  ● LIVE DRAW BROADCAST (18:00–18:30 ICT)
                </span>
              ) : (
                <span className="text-amber-700 dark:text-amber-300">
                  Next 17:30 Cutoff: <strong>{clock.cutoffCountdownFormatted}</strong>
                </span>
              )}
            </div>
          </div>

          {/* Two-Tier Data Sync Status & Trigger */}
          <button
            type="button"
            onClick={onTriggerSync}
            disabled={isSyncing}
            title={
              syncStatus?.message ||
              "Click to sync Tier 1 GitHub NDJSON dataset & live Jackpot pools with Tier 2 Empirical Seed fallback"
            }
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-indigo-500 ${
                isSyncing ? "animate-spin" : ""
              }`}
            />
            <span className="font-mono text-[11px]">
              {syncStatus?.tier === "TIER_1_LIVE_CLOUD_HYBRID"
                ? `Tier 1 Live (#${powerCfg.latestDrawId} / #${megaCfg.latestDrawId})`
                : `Tier 2 Seed (#${powerCfg.latestDrawId} / #${megaCfg.latestDrawId})`}
            </span>
          </button>

          {/* Desktop Theme Toggle */}
          <button
            type="button"
            data-testid="theme-toggle"
            onClick={onToggleTheme}
            aria-label="Toggle Dark or Light Mode"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-medium transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Official Weekly Matrix Schedule Quick-Reference Strip */}
      <div className="bg-slate-50/90 dark:bg-slate-900/70 border-t border-slate-200/70 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-between flex-wrap gap-2 text-[11px]">
          <div className="flex items-center flex-wrap gap-2 sm:gap-4">
            <span className="inline-flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              Power 6/55: Tue • Thu • Sat (18:00 ICT)
            </span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Mega 6/45: Wed • Fri • Sun (18:00 ICT)
            </span>
            <span className="inline-flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Monday: Matrix Rest Day (No 6/45 or 6/55 Draw)
            </span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 font-mono hidden md:block">
            Ticket Cutoff: <strong>17:30 ICT</strong> • Standard Ballot:{" "}
            <strong>10,000 VND</strong> • Daily 5-Strategy Set:{" "}
            <strong>50,000 VND</strong>
          </div>
        </div>
      </div>
    </header>
  );
}

interface JackpotTelemetryBannerProps {
  powerConfig?: GameConfig;
  megaConfig?: GameConfig;
  powerDraws?: HistoricalDraw[];
  megaDraws?: HistoricalDraw[];
  onSelectGameFilter?: (game: "ALL" | "6/55" | "6/45") => void;
}

export function JackpotTelemetryBanner({
  powerConfig,
  megaConfig,
  powerDraws,
  megaDraws,
}: JackpotTelemetryBannerProps) {
  const [simulateSpillover, setSimulateSpillover] = useState(false);

  const powerCfg = powerConfig ?? GAME_CONFIGS["6/55"];
  const megaCfg = megaConfig ?? GAME_CONFIGS["6/45"];
  const pDraws = powerDraws ?? POWER_655_SEED_DRAWS;
  const mDraws = megaDraws ?? MEGA_645_SEED_DRAWS;

  // Find most recent Jackpot win event in the last 5 draws to surface in the telemetry card
  const recentPowerJpWin = pDraws
    .slice(0, 5)
    .find((d) => (d.jp1Winners && d.jp1Winners > 0) || d.isJackpotWon);
  const recentMegaJpWin = mDraws
    .slice(0, 5)
    .find((d) => (d.jp1Winners && d.jp1Winners > 0) || d.isJackpotWon);

  const activeJp1Vnd = simulateSpillover
    ? 312_500_000_000
    : powerCfg.currentJackpot1Vnd;
  const surplusSpilloverVnd = simulateSpillover ? 12_500_000_000 : 0;
  const activeJp2Vnd =
    (powerCfg.currentJackpot2Vnd ?? 4_432_627_250) + surplusSpilloverVnd;

  const powerJp1Net = calculateNetPayout(activeJp1Vnd);
  const powerJp2Net = calculateNetPayout(activeJp2Vnd);
  const megaJpNet = calculateNetPayout(megaCfg.currentJackpot1Vnd);

  const spilloverPct = Math.min(
    100,
    Number(((activeJp1Vnd / 300_000_000_000) * 100).toFixed(2))
  );

  return (
    <section
      aria-label="Executive Jackpot & Tax Telemetry"
      className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-2"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Power 6/55 Jackpot 1 */}
        <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-br from-white via-red-50/30 to-orange-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-red-950/30 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-red-600 text-white">
                POWER 6/55 • JP1
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Draw #{powerCfg.latestDrawId} → #{powerCfg.nextDrawId}
              </span>
            </div>
            <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              {simulateSpillover ? "10.42x Seed" : `${powerCfg.seedMultiplier}x Seed`}
            </span>
          </div>

          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-red-600 dark:text-red-400">
              {formatVND(activeJp1Vnd, true)}
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Exact Pool: {formatVND(activeJp1Vnd, false)}
            </div>
          </div>

          {recentPowerJpWin && !simulateSpillover && (
            <div className="mt-2 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[11px] font-mono text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                #{recentPowerJpWin.id} ({recentPowerJpWin.date.slice(5)}):{" "}
                <strong>{formatVND(recentPowerJpWin.jackpot1Vnd, true)} WON!</strong>{" "}
                (Reset → 30B Seed)
              </span>
            </div>
          )}

          {/* Net After-Tax Payout (10% PIT above 10M VND) */}
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Net After 10% PIT:
            </span>
            <strong className="font-mono text-emerald-700 dark:text-emerald-400">
              {formatVND(powerJp1Net.netVnd, true)} ({formatVND(powerJp1Net.netVnd)})
            </strong>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Latest: {powerCfg.latestDrawDate}</span>
            <span>Odds: 1 : 28,989,675</span>
          </div>
        </div>

        {/* Card 2: Power 6/55 Jackpot 2 & 300B VND Spillover Tracker */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-white via-amber-50/30 to-yellow-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/25 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-amber-500 text-slate-950">
                POWER 6/55 • JP2
              </span>
              <span className="text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300">
                5 Main + 1 Bonus
              </span>
            </div>
            <button
              type="button"
              onClick={() => setSimulateSpillover((prev) => !prev)}
              className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded border border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors cursor-pointer"
            >
              {simulateSpillover
                ? `Reset to Live (${formatVND(powerCfg.currentJackpot1Vnd, true)})`
                : "Sim >300B Spillover"}
            </button>
          </div>

          <div className="my-1 flex items-baseline justify-between gap-2">
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-600 dark:text-amber-400">
                {formatVND(activeJp2Vnd, true)}
              </div>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Net After-Tax: <strong>{formatVND(powerJp2Net.netVnd, false)}</strong>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 font-mono text-[11px] font-bold">
                6x Easier Odds
              </span>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                1 : 4,831,612.5
              </div>
            </div>
          </div>

          {/* 300B Spillover Progress Bar */}
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                300B VND Spillover Threshold:
              </span>
              <span
                className={
                  simulateSpillover
                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                    : "text-amber-600 dark:text-amber-400 font-bold"
                }
              >
                {spilloverPct}% ({formatVND(activeJp1Vnd, true)} / 300.00B)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  simulateSpillover
                    ? "bg-gradient-to-r from-emerald-500 to-amber-400"
                    : "bg-gradient-to-r from-amber-500 to-red-500"
                }`}
                style={{ width: `${spilloverPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1">
              {simulateSpillover
                ? "⚡ SPILLOVER ACTIVE: +12.50B VND surplus above 300B transfers to JP2! Upgrade S1/S4 to Bao-7 (70K VND)."
                : "When JP1 > 300B VND with 0 JP1 winners, 100% of surplus above 300B transfers into JP2."}
            </p>
          </div>
        </div>

        {/* Card 3: Mega 6/45 Jackpot */}
        <div className="relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-blue-600 text-white">
                MEGA 6/45 • JACKPOT
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Draw #{megaCfg.latestDrawId} → #{megaCfg.nextDrawId}
              </span>
            </div>
            <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              {megaCfg.seedMultiplier}x Seed (12B Min)
            </span>
          </div>

          <div className="my-1">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-blue-600 dark:text-blue-400">
              {formatVND(megaCfg.currentJackpot1Vnd, true)}
            </div>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              Exact Pool: {formatVND(megaCfg.currentJackpot1Vnd, false)}
            </div>
          </div>

          {recentMegaJpWin && (
            <div className="mt-2 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-[11px] font-mono text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>
                #{recentMegaJpWin.id} ({recentMegaJpWin.date.slice(5)}):{" "}
                <strong>{formatVND(recentMegaJpWin.jackpot1Vnd, true)} WON!</strong>{" "}
                (Reset → 12B Seed)
              </span>
            </div>
          )}

          {/* Net After-Tax Payout */}
          <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Net After 10% PIT:
            </span>
            <strong className="font-mono text-emerald-700 dark:text-emerald-400">
              {formatVND(megaJpNet.netVnd, true)} ({formatVND(megaJpNet.netVnd)})
            </strong>
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            <span>Latest: {megaCfg.latestDrawDate}</span>
            <span>Odds: 1 : 8,145,060</span>
          </div>
        </div>
      </div>
    </section>
  );
}
