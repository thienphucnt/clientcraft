"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ExecutiveHeader,
  JackpotTelemetryBanner,
} from "@/components/ExecutiveHeader";
import { RollingForecastMatrix } from "@/components/RollingForecastMatrix";
import { SieveInspectorAndBaoCalculator } from "@/components/SieveInspectorAndBaoCalculator";
import { EmpiricalTelemetryCharts } from "@/components/EmpiricalTelemetryCharts";
import {
  GeneratedBallot,
  generateRollingSchedule,
} from "@/lib/quantEngine";
import {
  buildDynamicGameConfigForDate,
  GITHUB_NDJSON_URLS,
  getICTTelemetryClock,
  HistoricalDraw,
  MEGA_645_SEED_DRAWS,
  parseMinhNgocJackpots,
  parseNDJsonDraws,
  POWER_655_SEED_DRAWS,
  SyncStatusResponse,
} from "@/lib/vietlottData";
import {
  CalendarDays,
  SearchCheck,
  BarChart3,
  Smartphone,
} from "lucide-react";

export default function VietlottQuantMatrixDashboard() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [anchorDate, setAnchorDate] = useState<string>("2026-10-30");
  const [seedSalt, setSeedSalt] = useState<number>(0);
  const [simulateNextDraw, setSimulateNextDraw] = useState<boolean>(false);
  const [inspectedBallot, setInspectedBallot] =
    useState<GeneratedBallot | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Sync live ICT calendar date on mount so the rolling window advances automatically day-by-day
  useEffect(() => {
    const liveClock = getICTTelemetryClock(new Date());
    if (liveClock.isoDate) {
      setAnchorDate(liveClock.isoDate);
    }
  }, []);

  // Sync theme with document.documentElement class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const triggerCloudSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync-vietlott", { cache: "no-store" });
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        const data: SyncStatusResponse = await res.json();
        setSyncStatus(data);
        return;
      }
      throw new Error("API route unavailable on static host");
    } catch {
      try {
        const [pRes, mRes, mnPowerRes, mnMegaRes] = await Promise.all([
          fetch(GITHUB_NDJSON_URLS.power655, { cache: "no-store" }),
          fetch(GITHUB_NDJSON_URLS.mega645, { cache: "no-store" }),
          fetch(
            `https://api.allorigins.win/raw?url=${encodeURIComponent(
              GITHUB_NDJSON_URLS.minhNgocPower655
            )}`
          ).catch(() => null),
          fetch(
            `https://api.allorigins.win/raw?url=${encodeURIComponent(
              GITHUB_NDJSON_URLS.minhNgocMega645
            )}`
          ).catch(() => null),
        ]);

        if (pRes.ok && mRes.ok) {
          const [pText, mText, mnPowerHtml, mnMegaHtml] = await Promise.all([
            pRes.text(),
            mRes.text(),
            mnPowerRes && mnPowerRes.ok
              ? mnPowerRes.text().catch(() => "")
              : "",
            mnMegaRes && mnMegaRes.ok ? mnMegaRes.text().catch(() => "") : "",
          ]);

          const livePowerJp = mnPowerHtml
            ? parseMinhNgocJackpots(mnPowerHtml, "6/55")
            : undefined;
          const liveMegaJp = mnMegaHtml
            ? parseMinhNgocJackpots(mnMegaHtml, "6/45")
            : undefined;

          const pLines = pText
            .split(/\r?\n/)
            .filter((l) => l.trim().length > 0).length;
          const mLines = mText
            .split(/\r?\n/)
            .filter((l) => l.trim().length > 0).length;

          const parsedPower = parseNDJsonDraws(
            pText,
            "6/55",
            2500,
            livePowerJp
          );
          const parsedMega = parseNDJsonDraws(
            mText,
            "6/45",
            2500,
            liveMegaJp
          );

          const powerMap = new Map(parsedPower.map((d) => [d.id, d]));
          for (const seedDraw of POWER_655_SEED_DRAWS) {
            const existing = powerMap.get(seedDraw.id);
            if (!existing) {
              powerMap.set(seedDraw.id, seedDraw);
            } else {
              powerMap.set(seedDraw.id, {
                ...existing,
                jackpot1Vnd:
                  livePowerJp?.drawId === seedDraw.id &&
                  livePowerJp?.jackpot1Vnd
                    ? livePowerJp.jackpot1Vnd
                    : seedDraw.jackpot1Vnd,
                jackpot2Vnd:
                  livePowerJp?.drawId === seedDraw.id &&
                  livePowerJp?.jackpot2Vnd
                    ? livePowerJp.jackpot2Vnd
                    : seedDraw.jackpot2Vnd,
                jp1Winners:
                  livePowerJp?.drawId === seedDraw.id &&
                  livePowerJp?.jp1Winners !== undefined
                    ? livePowerJp.jp1Winners
                    : seedDraw.jp1Winners,
                jp2Winners:
                  livePowerJp?.drawId === seedDraw.id &&
                  livePowerJp?.jp2Winners !== undefined
                    ? livePowerJp.jp2Winners
                    : seedDraw.jp2Winners,
                isJackpotWon: seedDraw.isJackpotWon,
              });
            }
          }
          const mergedPower = Array.from(powerMap.values()).sort((a, b) =>
            b.date.localeCompare(a.date)
          );

          const megaMap = new Map(parsedMega.map((d) => [d.id, d]));
          for (const seedDraw of MEGA_645_SEED_DRAWS) {
            const existing = megaMap.get(seedDraw.id);
            if (!existing) {
              megaMap.set(seedDraw.id, seedDraw);
            } else {
              megaMap.set(seedDraw.id, {
                ...existing,
                jackpot1Vnd:
                  liveMegaJp?.drawId === seedDraw.id && liveMegaJp?.jackpot1Vnd
                    ? liveMegaJp.jackpot1Vnd
                    : seedDraw.jackpot1Vnd,
                jp1Winners:
                  liveMegaJp?.drawId === seedDraw.id &&
                  liveMegaJp?.jp1Winners !== undefined
                    ? liveMegaJp.jp1Winners
                    : seedDraw.jp1Winners,
                isJackpotWon: seedDraw.isJackpotWon,
              });
            }
          }
          const mergedMega = Array.from(megaMap.values()).sort((a, b) =>
            b.date.localeCompare(a.date)
          );

          setSyncStatus({
            tier: "TIER_1_LIVE_CLOUD_HYBRID",
            syncedAt: new Date().toISOString(),
            power655TotalDraws: Math.max(1416, pLines, mergedPower.length),
            mega645TotalDraws: Math.max(1580, mLines, mergedMega.length),
            latestPowerDraw: mergedPower[0] || POWER_655_SEED_DRAWS[0],
            latestMegaDraw: mergedMega[0] || MEGA_645_SEED_DRAWS[0],
            powerDraws: mergedPower,
            megaDraws: mergedMega,
            sourceUrlPower: GITHUB_NDJSON_URLS.power655,
            sourceUrlMega: GITHUB_NDJSON_URLS.mega645,
            message: `Tier 1 Cloud NDJSON Sync Active (${mergedPower.length} Power 6/55 through #${mergedPower[0]?.id} & ${mergedMega.length} Mega 6/45 through #${mergedMega[0]?.id}).`,
          });
        }
      } catch {
        // Offline Tier 2 seed active by default
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Automatically sync Two-Tier Data Layer on initial mount
  useEffect(() => {
    triggerCloudSync();
  }, [triggerCloudSync]);

  // Compute live effective draw arrays (including optional "Sim Next Draw Settlement")
  const { effectivePowerDraws, effectiveMegaDraws } = useMemo(() => {
    const basePower = syncStatus?.powerDraws ?? POWER_655_SEED_DRAWS;
    const baseMega = syncStatus?.megaDraws ?? MEGA_645_SEED_DRAWS;

    if (!simulateNextDraw) {
      return {
        effectivePowerDraws: basePower,
        effectiveMegaDraws: baseMega,
      };
    }

    const latestP = basePower[0] ?? POWER_655_SEED_DRAWS[0];
    const latestM = baseMega[0] ?? MEGA_645_SEED_DRAWS[0];

    const simPowerDraw: HistoricalDraw = {
      id: String(Number(latestP.id) + 1).padStart(5, "0"),
      date: anchorDate,
      weekday: "Thursday",
      gameType: "6/55",
      numbers: [6, 13, 21, 36, 41, 52],
      bonus: 22,
      sum: 169,
      oddEven: "3O-3E",
      lowHigh: "3L-3H",
      consecPairs: 0,
      jackpot1Vnd: (latestP.jackpot1Vnd || 31_758_267_450) + 9_850_000_000,
      jackpot2Vnd: (latestP.jackpot2Vnd || 4_432_627_250) + 650_000_000,
      jp1Winners: 0,
      jp2Winners: 0,
    };

    const simMegaDraw: HistoricalDraw = {
      id: String(Number(latestM.id) + 1).padStart(5, "0"),
      date: anchorDate,
      weekday: "Wednesday",
      gameType: "6/45",
      numbers: [7, 12, 21, 28, 31, 39],
      sum: 138,
      oddEven: "3O-3E",
      lowHigh: "3L-3H",
      consecPairs: 0,
      jackpot1Vnd: (latestM.jackpot1Vnd || 16_103_186_000) + 2_450_000_000,
      jp1Winners: 0,
    };

    return {
      effectivePowerDraws: [simPowerDraw, ...basePower],
      effectiveMegaDraws: [simMegaDraw, ...baseMega],
    };
  }, [syncStatus, simulateNextDraw, anchorDate]);

  // Dynamically compute live GameConfigs for Header, Jackpot Cards, Sieve Inspector, and Telemetry
  const livePowerConfig = useMemo(
    () =>
      buildDynamicGameConfigForDate("6/55", "9999-12-31", effectivePowerDraws),
    [effectivePowerDraws]
  );

  const liveMegaConfig = useMemo(
    () =>
      buildDynamicGameConfigForDate("6/45", "9999-12-31", effectiveMegaDraws),
    [effectiveMegaDraws]
  );

  // Generate deterministic 7-to-8 day rolling schedule, dynamically re-synthesizing as new draws settle
  const rollingSchedule = useMemo(() => {
    return generateRollingSchedule(anchorDate, 8, seedSalt, {
      powerDraws: effectivePowerDraws,
      megaDraws: effectiveMegaDraws,
    });
  }, [anchorDate, seedSalt, effectivePowerDraws, effectiveMegaDraws]);

  const handleInspectBallot = useCallback((ballot: GeneratedBallot) => {
    setInspectedBallot(ballot);
    const el = document.getElementById("sieve-inspector-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. Executive Telemetry Header */}
      <ExecutiveHeader
        theme={theme}
        onToggleTheme={handleToggleTheme}
        syncStatus={syncStatus}
        isSyncing={isSyncing}
        onTriggerSync={triggerCloudSync}
        powerConfig={livePowerConfig}
        megaConfig={liveMegaConfig}
      />

      {/* Active Jackpot & 300B Spillover Telemetry Cards */}
      <JackpotTelemetryBanner
        powerConfig={livePowerConfig}
        megaConfig={liveMegaConfig}
        powerDraws={effectivePowerDraws}
        megaDraws={effectiveMegaDraws}
      />

      {/* Mobile Quick-Jump Section Bar */}
      <nav
        aria-label="Dashboard Section Navigation"
        className="max-w-7xl mx-auto w-full px-3 sm:px-6 pt-2"
      >
        <div className="flex items-center gap-2 overflow-x-auto py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
          <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 shrink-0 mr-1">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Quick Jump:</span>
          </span>
          <a
            href="#rolling-matrix-section"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>7-Day Ballot Matrix (30 Sets)</span>
          </a>
          <a
            href="#sieve-inspector-section"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 transition-colors"
          >
            <SearchCheck className="w-3.5 h-3.5" />
            <span>6-Gate Sieve &amp; Chơi Bao Calculator</span>
          </a>
          <a
            href="#telemetry-charts-section"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-500/15 hover:text-indigo-600 dark:hover:text-indigo-400 shrink-0 transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Gaussian &amp; Hot/Cold Telemetry</span>
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 pb-16">
        {/* 2. Primary 7-Day Rolling Forecast Matrix */}
        <div id="rolling-matrix-section">
          <RollingForecastMatrix
            schedule={rollingSchedule}
            anchorDate={anchorDate}
            onChangeAnchorDate={setAnchorDate}
            seedSalt={seedSalt}
            onReRollSeed={() => setSeedSalt((s) => s + 1)}
            onResetSeed={() => setSeedSalt(0)}
            onInspectBallot={handleInspectBallot}
            simulateDraw1413={simulateNextDraw}
            onToggleSimulateDraw1413={() => setSimulateNextDraw((prev) => !prev)}
          />
        </div>

        {/* 3. Custom Ballot Sieve Inspector & System Play ("Chơi Bao") Calculator */}
        <SieveInspectorAndBaoCalculator
          inspectedBallot={inspectedBallot}
          powerConfig={livePowerConfig}
          megaConfig={liveMegaConfig}
          powerDraws={effectivePowerDraws}
          megaDraws={effectiveMegaDraws}
        />

        {/* 4. Empirical Telemetry Charts (Recharts) & Historical Draw Ledger */}
        <div id="telemetry-charts-section">
          <EmpiricalTelemetryCharts
            powerDraws={effectivePowerDraws}
            megaDraws={effectiveMegaDraws}
            powerConfig={livePowerConfig}
            megaConfig={liveMegaConfig}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-3 sm:px-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-200">
              Vietlott QuantMatrix Pro — Quantitative Combinatorial Decision-Support System
            </p>
            <p className="mt-0.5">
              Power 6/55: Tuesday, Thursday &amp; Saturday (18:00 ICT) • Mega 6/45:
              Wednesday, Friday &amp; Sunday (18:00 ICT) • Monday: Matrix Rest Day.
            </p>
          </div>
          <div className="font-mono text-[11px] text-left sm:text-right">
            <div>
              Data Layer:{" "}
              <strong className="text-emerald-600 dark:text-emerald-400">
                {syncStatus?.tier || "TIER_2_OFFLINE_SEED_2026"}
              </strong>
            </div>
            <div>
              Live Calibrated through Power 6/55 #{livePowerConfig.latestDrawId}{" "}
              ({livePowerConfig.latestDrawDate}) &amp; Mega 6/45 #
              {liveMegaConfig.latestDrawId} ({liveMegaConfig.latestDrawDate})
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
