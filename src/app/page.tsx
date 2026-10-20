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
  getICTTelemetryClock,
  HistoricalDraw,
  MEGA_645_SEED_DRAWS,
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
  const [anchorDate, setAnchorDate] = useState<string>("2026-10-20");
  const [seedSalt, setSeedSalt] = useState<number>(0);
  const [simulateDraw1413, setSimulateDraw1413] = useState<boolean>(false);
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
      if (res.ok) {
        const data: SyncStatusResponse = await res.json();
        setSyncStatus(data);
        return;
      }
      throw new Error("API route unavailable on static host");
    } catch {
      try {
        const [pRes, mRes] = await Promise.all([
          fetch(
            "https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/power655.jsonl"
          ),
          fetch(
            "https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/power645.jsonl"
          ),
        ]);
        if (pRes.ok && mRes.ok) {
          const [pText, mText] = await Promise.all([pRes.text(), mRes.text()]);
          const pLines = pText.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
          const mLines = mText.split(/\r?\n/).filter((l) => l.trim().length > 0).length;
          const parsedPower = parseNDJsonDraws(pText, "6/55", 150);
          const parsedMega = parseNDJsonDraws(mText, "6/45", 150);

          const powerMap = new Map(POWER_655_SEED_DRAWS.map((d) => [d.id, d]));
          for (const d of parsedPower) {
            if (!powerMap.has(d.id)) powerMap.set(d.id, d);
          }
          const mergedPower = Array.from(powerMap.values()).sort((a, b) =>
            b.date.localeCompare(a.date)
          );

          const megaMap = new Map(MEGA_645_SEED_DRAWS.map((d) => [d.id, d]));
          for (const d of parsedMega) {
            if (!megaMap.has(d.id)) megaMap.set(d.id, d);
          }
          const mergedMega = Array.from(megaMap.values()).sort((a, b) =>
            b.date.localeCompare(a.date)
          );

          const { GITHUB_NDJSON_URLS } = await import("@/lib/vietlottData");
          setSyncStatus({
            tier: "TIER_1_LIVE_CLOUD_HYBRID",
            syncedAt: new Date().toISOString(),
            power655TotalDraws: Math.max(1412, pLines),
            mega645TotalDraws: Math.max(1577, mLines),
            latestPowerDraw: mergedPower[0] || POWER_655_SEED_DRAWS[0],
            latestMegaDraw: mergedMega[0] || MEGA_645_SEED_DRAWS[0],
            powerDraws: mergedPower,
            megaDraws: mergedMega,
            sourceUrlPower: GITHUB_NDJSON_URLS.power655,
            sourceUrlMega: GITHUB_NDJSON_URLS.mega645,
            message: `Tier 1 Cloud NDJSON Sync Active (${pLines} Power 6/55 & ${mLines} Mega 6/45 records ingested + Oct 2026 calibration).`,
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

  // Generate deterministic 7-to-8 day rolling schedule, dynamically re-synthesizing as new draws settle
  const rollingSchedule = useMemo(() => {
    const basePower = syncStatus?.powerDraws ?? POWER_655_SEED_DRAWS;
    const baseMega = syncStatus?.megaDraws ?? MEGA_645_SEED_DRAWS;

    const effectivePowerDraws: HistoricalDraw[] = simulateDraw1413
      ? [
          {
            id: "01413",
            date: "2026-10-20",
            weekday: "Tuesday",
            gameType: "6/55",
            numbers: [6, 13, 21, 36, 41, 52],
            bonus: 22,
            sum: 169,
            oddEven: "3O-3E",
            lowHigh: "3L-3H",
            consecPairs: 0,
            jackpot1Vnd: 171_500_000_000,
            jackpot2Vnd: 4_150_000_000,
            jp1Winners: 0,
            jp2Winners: 0,
          },
          ...basePower,
        ]
      : basePower;

    return generateRollingSchedule(anchorDate, 8, seedSalt, {
      powerDraws: effectivePowerDraws,
      megaDraws: baseMega,
    });
  }, [anchorDate, seedSalt, syncStatus, simulateDraw1413]);

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
      />

      {/* Active Jackpot & 300B Spillover Telemetry Cards */}
      <JackpotTelemetryBanner />

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
            simulateDraw1413={simulateDraw1413}
            onToggleSimulateDraw1413={() => setSimulateDraw1413((prev) => !prev)}
          />
        </div>

        {/* 3. Custom Ballot Sieve Inspector & System Play ("Chơi Bao") Calculator */}
        <SieveInspectorAndBaoCalculator inspectedBallot={inspectedBallot} />

        {/* 4. Empirical Telemetry Charts (Recharts) & Historical Draw Ledger */}
        <div id="telemetry-charts-section">
          <EmpiricalTelemetryCharts />
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
              Calibrated through Power 6/55 #01412 &amp; Mega 6/45 #01577 (Oct 2026)
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
