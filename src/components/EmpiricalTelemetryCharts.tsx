"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Flame,
  Clock,
  History,
  BookOpen,
} from "lucide-react";
import {
  CONSECUTIVE_PAIR_INCIDENCE,
  formatVND,
  GAME_CONFIGS,
  GameConfig,
  GameType,
  generateGaussianBellCurveData,
  getFullBallTelemetry,
  HistoricalDraw,
  MACRO_PARITY_DISTRIBUTION,
  MEGA_645_SEED_DRAWS,
  POWER_655_SEED_DRAWS,
} from "@/lib/vietlottData";

type WindowKey =
  | "hitsW10"
  | "hitsW20"
  | "hitsW50"
  | "hitsW100"
  | "hitsW150"
  | "hitsAllTime";

interface EmpiricalTelemetryChartsProps {
  powerDraws?: HistoricalDraw[];
  megaDraws?: HistoricalDraw[];
  powerConfig?: GameConfig;
  megaConfig?: GameConfig;
}

export function EmpiricalTelemetryCharts({
  powerDraws,
  megaDraws,
  powerConfig,
  megaConfig,
}: EmpiricalTelemetryChartsProps) {
  const [mounted, setMounted] = useState(false);
  const [telemetryGame, setTelemetryGame] = useState<GameType>("6/55");
  const [selectedWindow, setSelectedWindow] =
    useState<WindowKey>("hitsAllTime");
  const [historyGame, setHistoryGame] = useState<GameType>("6/55");

  useEffect(() => {
    setMounted(true);
  }, []);

  const pDraws =
    powerDraws && powerDraws.length > 0 ? powerDraws : POWER_655_SEED_DRAWS;
  const mDraws =
    megaDraws && megaDraws.length > 0 ? megaDraws : MEGA_645_SEED_DRAWS;
  const powerCfg = powerConfig ?? GAME_CONFIGS["6/55"];
  const megaCfg = megaConfig ?? GAME_CONFIGS["6/45"];

  const bellCurveData = useMemo(() => generateGaussianBellCurveData(), []);

  // Power 6/55 Recent 19-Draw Rollover & Reset Trajectory (chronological #01398 -> latest)
  const rolloverSurgeData = useMemo(() => {
    const recent19 = pDraws.slice(0, 19);
    return [...recent19].reverse().map((d) => ({
      drawId: `#${d.id}`,
      date: d.date.slice(5), // MM-DD
      jp1Billion: Number((d.jackpot1Vnd / 1_000_000_000).toFixed(2)),
      jp2Billion: Number(
        ((d.jackpot2Vnd ?? 3_000_000_000) / 1_000_000_000).toFixed(2)
      ),
      sum: d.sum,
      jp1Winners: d.jp1Winners ?? 0,
      jp2Winners: d.jp2Winners ?? 0,
    }));
  }, [pDraws]);

  const activeTelemetryDraws = telemetryGame === "6/55" ? pDraws : mDraws;

  // Multi-Window Hot & Cold Bar Chart Data (dynamically computed from live draw history)
  const windowChartData = useMemo(() => {
    const allStats = getFullBallTelemetry(telemetryGame, activeTelemetryDraws);
    const sortedByWindow = [...allStats].sort(
      (a, b) => b[selectedWindow] - a[selectedWindow] || a.ball - b.ball
    );
    const top8Hot = sortedByWindow.slice(0, 8);
    const bottom6Cold = sortedByWindow.slice(-6).reverse();
    const combined = [...top8Hot, ...bottom6Cold];

    return combined.map((item) => ({
      ballLabel: `#${String(item.ball).padStart(2, "0")}`,
      ball: item.ball,
      hits: item[selectedWindow],
      skipGap: item.skipGap,
      hazardScore: item.hazardScore,
      momentumZ: item.momentumZ,
      regime: item.regime,
      isTopHot: top8Hot.some((h) => h.ball === item.ball),
    }));
  }, [telemetryGame, selectedWindow, activeTelemetryDraws]);

  // Overdue Skip-Gap ("Lô Gan") Leaders Data (dynamically computed from live draw history)
  const skipGapChartData = useMemo(() => {
    const allStats = getFullBallTelemetry(telemetryGame, activeTelemetryDraws);
    return [...allStats]
      .sort((a, b) => b.skipGap - a.skipGap || a.ball - b.ball)
      .slice(0, 10)
      .map((item) => ({
        ballLabel: `Ball ${String(item.ball).padStart(2, "0")}`,
        skipGap: item.skipGap,
        hazardScore: item.hazardScore,
        hitsAllTime: item.hitsAllTime,
        note: item.note || "",
      }));
  }, [telemetryGame, activeTelemetryDraws]);

  const windowOptions: Array<{ key: WindowKey; label: string }> = [
    { key: "hitsW10", label: "10 Draws" },
    { key: "hitsW20", label: "20 Draws" },
    { key: "hitsW50", label: "50 Draws" },
    { key: "hitsW100", label: "100 Draws" },
    { key: "hitsW150", label: "150 Draws" },
    { key: "hitsAllTime", label: "All-Time" },
  ];

  const activeHistoricalDraws = historyGame === "6/55" ? pDraws : mDraws;

  return (
    <section
      aria-label="Empirical Telemetry Charts and Historical Draw Ledger"
      className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6"
    >
      {/* Section Header */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
              Empirical Telemetry, Gaussian Distribution &amp; Multi-Window Regimes
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Live multi-window telemetry across{" "}
            <strong>{pDraws.length.toLocaleString("en-US")}</strong> Power 6/55
            draws (through #{powerCfg.latestDrawId}) and{" "}
            <strong>{mDraws.length.toLocaleString("en-US")}</strong> Mega 6/45
            draws (through #{megaCfg.latestDrawId}).
          </p>
        </div>

        {/* Game Switcher for Multi-Window Telemetry */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Telemetry Pool:
          </span>
          <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setTelemetryGame("6/55");
                setSelectedWindow("hitsAllTime");
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                telemetryGame === "6/55"
                  ? "bg-red-600 text-white"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Power 6/55 (#{powerCfg.latestDrawId})
            </button>
            <button
              type="button"
              onClick={() => {
                setTelemetryGame("6/45");
                setSelectedWindow("hitsW150");
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                telemetryGame === "6/45"
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Mega 6/45 (#{megaCfg.latestDrawId})
            </button>
          </div>
        </div>
      </div>

      {/* ROW 1: Chart 1 (Gaussian Sum Bell Curves) & Chart 2 (Odd/Even Parity + Consecutive Incidence) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Gaussian Sum Bell Curves */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              1. Gaussian Sum Distribution &amp; 70% Core Corridors
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mega 6/45: μ = 138.0 (σ = 29.95), 70% band [106, 170] • Power 6/55: μ
              = 168.0 (σ = 37.04), 70% band [129, 207]
            </p>
          </div>

          <div className="h-72 w-full min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={bellCurveData}
                  margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis
                    dataKey="sum"
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "Sum of 6 Ballot Numbers (Σ)",
                      position: "insideBottom",
                      offset: -3,
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(val) => [`${val}%`, "Probability Density"]}
                    labelFormatter={(l) => `Ballot Sum Σ = ${l}`}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine
                    x={138}
                    stroke="#2563eb"
                    strokeDasharray="3 3"
                  />
                  <ReferenceLine
                    x={168}
                    stroke="#dc2626"
                    strokeDasharray="3 3"
                  />
                  <Area
                    type="monotone"
                    dataKey="megaDensityPct"
                    name="Mega 6/45 (μ=138)"
                    stroke="#2563eb"
                    fill="#3b82f6"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="powerDensityPct"
                    name="Power 6/55 (μ=168)"
                    stroke="#dc2626"
                    fill="#ef4444"
                    fillOpacity={0.25}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xs font-mono text-slate-400">
                Loading Gaussian Bell Curve...
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Odd/Even Parity & Low/High Splits + Consecutive Pair Paradox */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
              2. Hypergeometric Parity (Odd/Even) &amp; Consecutive Incidence
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Central triad &#123;2:4, 3:3, 4:2&#125; captures{" "}
              <strong>81.31%</strong> (6/45) and <strong>80.72%</strong> (6/55) of
              all valid draws while pruning extreme tails.
            </p>
          </div>

          <div className="h-48 w-full min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={MACRO_PARITY_DISTRIBUTION}
                  margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="shortLabel" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    formatter={(val) => [`${val}%`, "Combinatorial Share"]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="megaPct"
                    name="Mega 6/45 Share (%)"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="powerPct"
                    name="Power 6/55 Share (%)"
                    fill="#ea580c"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>

          {/* Consecutive Pair Paradox Horizontal Bars */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Consecutive Adjacency Paradox (≥1 Consecutive Pair vs Zero):
            </div>
            {CONSECUTIVE_PAIR_INCIDENCE.map((row) => (
              <div key={row.game} className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {row.game}
                  </span>
                  <span className="text-slate-500">
                    ≥1 Consecutive Pair:{" "}
                    <strong className="text-amber-600 dark:text-amber-400">
                      {row.atLeastOnePairPct}%
                    </strong>{" "}
                    • Zero Pairs: <strong>{row.zeroConsecutivePct}%</strong>
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden flex">
                  <div
                    className="h-full bg-amber-500"
                    style={{ width: `${row.atLeastOnePairPct}%` }}
                    title={`≥1 Consecutive Pair: ${row.atLeastOnePairPct}%`}
                  />
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${row.zeroConsecutivePct}%` }}
                    title={`Zero Consecutive Pairs: ${row.zeroConsecutivePct}%`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ROW 2: Chart 3 (Multi-Window Hot/Cold 10/20/50/100/150/All-Time) & Chart 4 (Overdue Skip-Gap "Lô Gan") */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 3: Multi-Window Hot/Cold Frequency Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                3. Multi-Window Hot vs. Cold Momentum ({telemetryGame})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top 8 hot momentum leaders vs. bottom 6 cold/suppressed numbers across
                rolling windows.
              </p>
            </div>

            {/* Window Selector Pills: 10 / 20 / 50 / 100 / 150 / All-Time */}
            <div className="flex items-center flex-wrap gap-1">
              {windowOptions.map((w) => (
                <button
                  key={w.key}
                  type="button"
                  data-testid={`window-btn-${w.key}`}
                  onClick={() => setSelectedWindow(w.key)}
                  className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    selectedWindow === w.key
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={windowChartData}
                  margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="ballLabel" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val, _name, props) => [
                      `${val} hits (Z = ${props.payload.momentumZ}, Skip = ${props.payload.skipGap})`,
                      props.payload.isTopHot ? "Hot Leader" : "Cold / Rebound",
                    ]}
                  />
                  <Bar dataKey="hits" name="Hit Count" radius={[4, 4, 0, 0]}>
                    {windowChartData.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.isTopHot ? "#ea580c" : "#06b6d4"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Chart 4: Overdue Skip-Gap ("Lô Gan") & Survival Hazard Score R_i */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-cyan-500" />
              4. Overdue Skip-Gap (&ldquo;Lô Gan&rdquo;) &amp; Survival Hazard (
              {telemetryGame})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Consecutive draws absent (gᵢ) evaluated via damped log-normal Survival
              Hazard Score Rᵢ.
            </p>
          </div>

          <div className="h-72 w-full min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={skipGapChartData}
                  margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="ballLabel"
                    tick={{ fontSize: 11 }}
                    width={65}
                  />
                  <Tooltip
                    formatter={(val, _name, props) => [
                      `${val} consecutive draws absent (Hazard Rᵢ = ${props.payload.hazardScore})`,
                      "Skip-Gap Streak",
                    ]}
                  />
                  <Bar
                    dataKey="skipGap"
                    name="Draws Absent (Lô Gan)"
                    fill="#0891b2"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
      </div>

      {/* ROW 3: Power 6/55 Rollover & Reset Trajectory & Verified Historical Draw Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Power 6/55 Jackpot 1 Escalation & Reset Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-red-500" />
              Power 6/55 Jackpot 1 Trajectory (Through #{powerCfg.latestDrawId})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Surged from 67.98B VND (#01398) to <strong>199.98B VND</strong>{" "}
              (won in #01415 on Oct 24!), resetting to{" "}
              <strong>{formatVND(powerCfg.currentJackpot1Vnd, true)}</strong>{" "}
              (#{powerCfg.latestDrawId}).
            </p>
          </div>

          <div className="h-64 w-full min-w-0">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={rolloverSurgeData}
                  margin={{ top: 10, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(v) => `${v}B`}
                  />
                  <Tooltip
                    formatter={(val) => [`${val} Billion VND`, "Jackpot 1 Pool"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="jp1Billion"
                    name="Power 6/55 JP1 (Billion VND)"
                    stroke="#dc2626"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#dc2626" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>

        {/* Right 7 Cols: Live Synced & Verified Historical Draw Ledger */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-500" />
                Live Synced Historical Draw Ledger
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete draw results, sums, parity splits, and jackpot winners.
              </p>
            </div>

            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 self-start">
              <button
                type="button"
                onClick={() => setHistoryGame("6/55")}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                  historyGame === "6/55"
                    ? "bg-red-600 text-white"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Power 6/55 ({pDraws.length.toLocaleString("en-US")})
              </button>
              <button
                type="button"
                onClick={() => setHistoryGame("6/45")}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer ${
                  historyGame === "6/45"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Mega 6/45 ({mDraws.length.toLocaleString("en-US")})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-64 border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0">
                <tr>
                  <th className="py-2 px-2.5">Draw ID</th>
                  <th className="py-2 px-2">Date</th>
                  <th className="py-2 px-2.5">Winning Numbers</th>
                  <th className="py-2 px-2 text-center">Sum</th>
                  <th className="py-2 px-2 text-center">Parity / Split</th>
                  <th className="py-2 px-2.5 text-right">Jackpot 1</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeHistoricalDraws.slice(0, 50).map((d) => (
                  <tr
                    key={`${d.gameType}-${d.id}`}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="py-2 px-2.5 font-bold text-slate-900 dark:text-white">
                      #{d.id}
                    </td>
                    <td className="py-2 px-2 text-slate-500">
                      {d.date} ({d.weekday.slice(0, 3)})
                    </td>
                    <td className="py-2 px-2.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        {d.numbers.map((n) => (
                          <span
                            key={n}
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold text-white ${
                              d.gameType === "6/55"
                                ? "bg-red-600"
                                : "bg-blue-600"
                            }`}
                          >
                            {String(n).padStart(2, "0")}
                          </span>
                        ))}
                        {d.bonus !== undefined && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-extrabold bg-amber-400 text-slate-950 ml-1">
                            {String(d.bonus).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-2 text-center font-bold">
                      {d.sum}
                    </td>
                    <td className="py-2 px-2 text-center text-[11px] text-slate-600 dark:text-slate-400">
                      {d.oddEven} • {d.lowHigh}
                    </td>
                    <td className="py-2 px-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatVND(d.jackpot1Vnd, true)}
                      {(d.jp1Winners && d.jp1Winners > 0) || d.isJackpotWon ? (
                        <span className="block text-[10px] text-red-500 font-extrabold">
                          [★ JP1 WON!]
                        </span>
                      ) : null}
                      {d.jp2Winners && d.jp2Winners > 0 ? (
                        <span className="block text-[10px] text-amber-500">
                          [{d.jp2Winners} JP2 Won]
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Strategic Synthesis & Quantitative Execution Conclusions Card */}
      <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-amber-400 shrink-0" />
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight">
            Strategic Synthesis &amp; Live Quantitative Execution Conclusions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="font-mono font-bold text-amber-400 text-xs uppercase">
              1. Live Capital Allocation (Post-Reset Cycle)
            </div>
            <p>
              Playing all 5 orthogonal strategy ballots on an active draw day
              requires <strong>50,000 VND</strong> (5 × 10,000 VND), or{" "}
              <strong>300,000 VND</strong> across the full 6-day Tuesday–Sunday
              cycle. Following the <strong>199.98B VND</strong> Power 6/55 JP1 win
              in Draw #01415 (Oct 24) and <strong>31.28B VND</strong> Mega 6/45 win
              in Draw #01578 (Oct 21), Power 6/55 stands at{" "}
              <strong>{formatVND(powerCfg.currentJackpot1Vnd, true)}</strong> (
              {powerCfg.seedMultiplier}× its 30B seed, plus{" "}
              <strong>
                {formatVND(powerCfg.currentJackpot2Vnd ?? 4_432_627_250, true)}
              </strong>{" "}
              in JP2) while Mega 6/45 sits at{" "}
              <strong>{formatVND(megaCfg.currentJackpot1Vnd, true)}</strong> (
              {megaCfg.seedMultiplier}× its 12B seed).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="font-mono font-bold text-emerald-400 text-xs uppercase">
              2. 300B Spillover &amp; Bao-7 Expansion
            </div>
            <p>
              Whenever Power 6/55 Jackpot 1 approaches or crosses{" "}
              <strong>300 Billion VND</strong>, the <strong>6× higher odds</strong>{" "}
              of matching Jackpot 2 (1 : 4,831,612.5 vs. 1 : 28,989,675) combined
              with the surplus spillover transfer makes upgrading Strategy 1
              (HOT_MOMENTUM) or Strategy 4 (GOLDEN_EQUILIBRIUM) to a{" "}
              <strong>Bao 7 ticket (70,000 VND)</strong> using the recommended 7th
              Bonus Anchor mathematically advantageous.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="font-mono font-bold text-cyan-400 text-xs uppercase">
              3. Parimutuel Anti-Split Discipline
            </div>
            <p>
              While the 6-Gate Combinatorial Sieve and 5-Strategy Engine guarantee
              that every generated ballot occupies the highest-density Gaussian and
              hypergeometric core while protecting solo-jackpot equity against
              human calendar birthday bias (01–31), physical lottery drawings
              remain independent uniform random events. Operate strictly within
              fixed entertainment bankroll constraints.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
