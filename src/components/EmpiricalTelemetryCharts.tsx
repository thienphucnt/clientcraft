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
  GameType,
  generateGaussianBellCurveData,
  getFullBallTelemetry,
  MACRO_PARITY_DISTRIBUTION,
  MEGA_645_SEED_DRAWS,
  MEGA_645_TELEMETRY_LEADERS,
  POWER_655_FREQUENCY_LEADERS,
  POWER_655_SEED_DRAWS,
} from "@/lib/vietlottData";

type WindowKey =
  | "hitsW10"
  | "hitsW20"
  | "hitsW50"
  | "hitsW100"
  | "hitsW150"
  | "hitsAllTime";

export function EmpiricalTelemetryCharts() {
  const [mounted, setMounted] = useState(false);
  const [telemetryGame, setTelemetryGame] = useState<GameType>("6/55");
  const [selectedWindow, setSelectedWindow] =
    useState<WindowKey>("hitsAllTime");
  const [historyGame, setHistoryGame] = useState<GameType>("6/55");

  useEffect(() => {
    setMounted(true);
  }, []);

  const bellCurveData = useMemo(() => generateGaussianBellCurveData(), []);

  // Power 6/55 15-Draw Rollover Trajectory (chronological #01398 -> #01412)
  const rolloverSurgeData = useMemo(() => {
    return [...POWER_655_SEED_DRAWS].reverse().map((d) => ({
      drawId: `#${d.id}`,
      date: d.date.slice(5), // MM-DD
      jp1Billion: Number((d.jackpot1Vnd / 1_000_000_000).toFixed(2)),
      jp2Billion: Number(((d.jackpot2Vnd ?? 3_000_000_000) / 1_000_000_000).toFixed(2)),
      sum: d.sum,
      jp2Winners: d.jp2Winners ?? 0,
    }));
  }, []);

  // Multi-Window Hot & Cold Bar Chart Data
  const windowChartData = useMemo(() => {
    const allStats = getFullBallTelemetry(telemetryGame);
    const sortedByWindow = [...allStats].sort(
      (a, b) => b[selectedWindow] - a[selectedWindow]
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
  }, [telemetryGame, selectedWindow]);

  // Overdue Skip-Gap ("Lo Gan") Leaders Data
  const skipGapChartData = useMemo(() => {
    const allStats = getFullBallTelemetry(telemetryGame);
    return [...allStats]
      .sort((a, b) => b.skipGap - a.skipGap)
      .slice(0, 10)
      .map((item) => ({
        ballLabel: `Ball ${String(item.ball).padStart(2, "0")}`,
        skipGap: item.skipGap,
        hazardScore: item.hazardScore,
        hitsAllTime: item.hitsAllTime,
        note: item.note || "",
      }));
  }, [telemetryGame]);

  const windowOptions: Array<{ key: WindowKey; label: string }> = [
    { key: "hitsW10", label: "10 Draws" },
    { key: "hitsW20", label: "20 Draws" },
    { key: "hitsW50", label: "50 Draws" },
    { key: "hitsW100", label: "100 Draws" },
    { key: "hitsW150", label: "150 Draws" },
    { key: "hitsAllTime", label: "All-Time" },
  ];

  const activeHistoricalDraws =
    historyGame === "6/55" ? POWER_655_SEED_DRAWS : MEGA_645_SEED_DRAWS;

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
            Combinatorial proof across all 8,145,060 Mega 6/45 and 28,989,675 Power
            6/55 outcomes alongside October 2026 empirical telemetry.
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
              Power 6/55
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
              Mega 6/45
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

      {/* ROW 3: Power 6/55 15-Draw Rollover Surge Trajectory (#01398 -> #01412) & Verified Historical Draw Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 5 Cols: Power 6/55 15-Draw Jackpot 1 Escalation Chart */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3">
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-red-500" />
              Power 6/55 Jackpot 1 Surge (#01398 → #01412)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              +141.3% expansion from 67.98B VND (Sep 15) to 164.05B VND (Oct 17,
              2026) with 8 JP2 winning tickets across 6 draws.
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

        {/* Right 7 Cols: Tier 2 Verified October 2026 Historical Draw Ledger */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-indigo-500" />
                Verified Historical Draw Ledger (Oct 2026 Seed DB)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Complete draw results, sums, parity splits, and jackpot pools.
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
                Power 6/55 ({POWER_655_SEED_DRAWS.length})
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
                Mega 6/45 ({MEGA_645_SEED_DRAWS.length})
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
                {activeHistoricalDraws.map((d) => (
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
            Strategic Synthesis &amp; Quantitative Execution Conclusions
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1.5">
            <div className="font-mono font-bold text-amber-400 text-xs uppercase">
              1. Asymmetric Capital Allocation
            </div>
            <p>
              Playing all 5 orthogonal strategy ballots on an active draw day
              requires <strong>50,000 VND</strong> (5 × 10,000 VND), or{" "}
              <strong>300,000 VND</strong> across the full 6-day Tuesday–Sunday
              cycle. With Power 6/55 JP1 at <strong>164.05B VND</strong> (5.47× its
              30B seed) vs. Mega 6/45 at <strong>26.44B VND</strong> (2.20× its 12B
              seed), risk-adjusted EV strongly favors Tuesday, Thursday, and
              Saturday Power 6/55 drawings.
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
