"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Calculator,
  SearchCheck,
  Sparkles,
  AlertTriangle,
  Layers,
  Coins,
  Grid,
} from "lucide-react";
import {
  calculateNetPayout,
  formatVND,
  GAME_CONFIGS,
  GameConfig,
  GameType,
  HistoricalDraw,
} from "@/lib/vietlottData";
import {
  GeneratedBallot,
  getSystemPlayMatrix,
  inspectCombinatorialSieve,
} from "@/lib/quantEngine";

interface SieveInspectorProps {
  inspectedBallot: GeneratedBallot | null;
  powerConfig?: GameConfig;
  megaConfig?: GameConfig;
  powerDraws?: HistoricalDraw[];
  megaDraws?: HistoricalDraw[];
}

export function SieveInspectorAndBaoCalculator({
  inspectedBallot,
  powerConfig,
  megaConfig,
  powerDraws,
  megaDraws,
}: SieveInspectorProps) {
  const [gameType, setGameType] = useState<GameType>("6/55");
  const [numbers, setNumbers] = useState<number[]>([6, 13, 21, 36, 41, 52]);
  const [bonusAnchor, setBonusAnchor] = useState<number>(22);
  const [allowWideSum, setAllowWideSum] = useState<boolean>(false);
  const [showBallGrid, setShowBallGrid] = useState<boolean>(false);
  const [selectedBaoCode, setSelectedBaoCode] = useState<string>("BAO_7");
  const [customGrossPrizeVnd, setCustomGrossPrizeVnd] = useState<number>(
    (powerConfig ?? GAME_CONFIGS["6/55"]).currentJackpot1Vnd
  );

  // Sync when user clicks "Inspect" on any ballot card in the matrix
  useEffect(() => {
    if (inspectedBallot) {
      setGameType(inspectedBallot.gameType);
      setNumbers([...inspectedBallot.numbers]);
      if (inspectedBallot.bonusAnchor !== undefined) {
        setBonusAnchor(inspectedBallot.bonusAnchor);
      }
      setAllowWideSum(inspectedBallot.slot === 5);
    }
  }, [inspectedBallot]);

  const powerCfg = powerConfig ?? GAME_CONFIGS["6/55"];
  const megaCfg = megaConfig ?? GAME_CONFIGS["6/45"];
  const cfg = gameType === "6/55" ? powerCfg : megaCfg;
  const activeDraws = gameType === "6/55" ? powerDraws : megaDraws;

  const report = useMemo(() => {
    return inspectCombinatorialSieve(numbers, gameType, {
      allowWideSum,
      customConfig: cfg,
      customDraws: activeDraws,
    });
  }, [numbers, gameType, allowWideSum, cfg, activeDraws]);

  const systemTiers = useMemo(() => {
    return getSystemPlayMatrix(gameType);
  }, [gameType]);

  const selectedTier = useMemo(() => {
    return (
      systemTiers.find((t) => t.code === selectedBaoCode) || systemTiers[2]
    );
  }, [systemTiers, selectedBaoCode]);

  const taxBreakdown = useMemo(() => {
    return calculateNetPayout(customGrossPrizeVnd);
  }, [customGrossPrizeVnd]);

  const handleNumberInput = (idx: number, valStr: string) => {
    const parsed = parseInt(valStr, 10);
    const next = [...numbers];
    next[idx] = Number.isNaN(parsed) ? 1 : Math.max(1, Math.min(cfg.maxNum, parsed));
    setNumbers(next);
  };

  const toggleBallInGrid = (ball: number) => {
    if (numbers.includes(ball)) {
      if (numbers.length > 1) {
        setNumbers(numbers.filter((n) => n !== ball));
      }
    } else if (numbers.length < 6) {
      setNumbers([...numbers, ball].sort((a, b) => a - b));
    } else {
      // Replace the 6th ball if already 6 selected
      const next = [...numbers.slice(0, 5), ball].sort((a, b) => a - b);
      setNumbers(next);
    }
  };

  return (
    <section
      id="sieve-inspector-section"
      aria-label="Custom Ballot Sieve Inspector and System Play Calculator"
      className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =================================================================
            LEFT 7 COLUMNS: 6-GATE COMBINATORIAL SIEVE INSPECTOR
           ================================================================= */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <SearchCheck className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  6-Gate Combinatorial Sieve Inspector
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enter any 6 numbers to audit Gaussian Sum, Parity, Low/High Partition,
                Consecutive Adjacency, Decade Spread, and Collision Guard.
              </p>
            </div>

            {/* Game Switcher */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 self-start">
              <button
                type="button"
                data-testid="inspector-game-655"
                onClick={() => {
                  setGameType("6/55");
                  setNumbers([6, 13, 21, 36, 41, 52]);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  gameType === "6/55"
                    ? "bg-red-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Power 6/55
              </button>
              <button
                type="button"
                data-testid="inspector-game-645"
                onClick={() => {
                  setGameType("6/45");
                  setNumbers([7, 12, 21, 28, 31, 39]);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  gameType === "6/45"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Mega 6/45
              </button>
            </div>
          </div>

          {/* Quick Preset Test Buttons */}
          <div className="flex items-center flex-wrap gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium mr-1">
              Test Presets:
            </span>
            <button
              type="button"
              data-testid="preset-sieve-pass"
              onClick={() => {
                if (gameType === "6/55") {
                  setNumbers([6, 13, 21, 36, 41, 52]);
                } else {
                  setNumbers([7, 12, 21, 28, 31, 39]);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-mono hover:bg-emerald-500/20 cursor-pointer"
            >
              ✓ Golden Equilibrium (6/6 Pass)
            </button>
            <button
              type="button"
              data-testid="preset-sieve-draw1412"
              onClick={() => {
                setGameType("6/55");
                setNumbers([1, 10, 11, 12, 16, 37]);
              }}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-mono hover:bg-amber-500/20 cursor-pointer"
            >
              Draw #01412 Outlier (Triplet 10-11-12)
            </button>
            <button
              type="button"
              data-testid="preset-sieve-tailfail"
              onClick={() => {
                setNumbers([1, 2, 3, 4, 5, 6]);
              }}
              className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30 font-mono hover:bg-red-500/20 cursor-pointer"
            >
              ✗ Extreme Tail (01-02-03-04-05-06)
            </button>
            <button
              type="button"
              onClick={() => setShowBallGrid((prev) => !prev)}
              className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
            >
              <Grid className="w-3.5 h-3.5 text-indigo-500" />
              <span>{showBallGrid ? "Hide Ball Grid" : "Touch Ball Picker"}</span>
            </button>
          </div>

          {/* 6 Number Inputs + Optional Bao-7 Anchor Input */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <div key={idx} className="flex flex-col items-center">
                <label className="text-[10px] font-mono text-slate-400 mb-1">
                  Ball #{idx + 1}
                </label>
                <input
                  type="number"
                  data-testid={`sieve-input-${idx}`}
                  min={1}
                  max={cfg.maxNum}
                  value={numbers[idx] ?? ""}
                  onChange={(e) => handleNumberInput(idx, e.target.value)}
                  className="w-12 h-12 sm:w-14 sm:h-14 text-center rounded-2xl border-2 border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-base sm:text-lg font-extrabold text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            ))}

            {gameType === "6/55" && (
              <div className="flex flex-col items-center pl-2 border-l border-dashed border-amber-500/40">
                <label className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 mb-1">
                  Bao-7 Anchor
                </label>
                <input
                  type="number"
                  min={1}
                  max={55}
                  value={bonusAnchor}
                  onChange={(e) =>
                    setBonusAnchor(
                      Math.max(1, Math.min(55, parseInt(e.target.value, 10) || 1))
                    )
                  }
                  className="w-12 h-12 sm:w-14 sm:h-14 text-center rounded-2xl border-2 border-amber-500/60 bg-amber-500/10 font-mono text-base sm:text-lg font-extrabold text-amber-700 dark:text-amber-300 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Optional Mobile-Friendly Touch Ball Matrix Picker */}
          {showBallGrid && (
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60">
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-2">
                Tap numbers (01–{cfg.maxNum}) to toggle in ballot ({numbers.length}/6
                selected):
              </div>
              <div className="grid grid-cols-9 sm:grid-cols-11 gap-1.5">
                {Array.from({ length: cfg.maxNum }, (_, i) => i + 1).map(
                  (b) => {
                    const isSelected = numbers.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBallInGrid(b)}
                        className={`h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-sm scale-105"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {String(b).padStart(2, "0")}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* Overall Sieve Status Banner & Delta Vector Strip */}
          <div
            data-testid="sieve-overall-verdict"
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              report.passedAllGates
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {report.passedAllGates ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0" />
              )}
              <div>
                <div className="font-extrabold text-sm">
                  {report.passedAllGates
                    ? `SIEVE VERDICT: PASSED ALL 6/6 COMBINATORIAL GATES`
                    : `SIEVE VERDICT: ${report.passedCount}/6 GATES PASSED (${
                        6 - report.passedCount
                      } FAILED)`}
                </div>
                <div className="text-xs opacity-90 font-mono mt-0.5">
                  {report.inputError ? (
                    <span className="text-red-500 font-bold">
                      {report.inputError}
                    </span>
                  ) : (
                    <>
                      Delta Vector (δ₁..δ₆): [{report.deltas.join(", ")}] • Total
                      Spread: {report.totalSpread} • Pair Lift:{" "}
                      {report.affinityLiftScore}x
                    </>
                  )}
                </div>
              </div>
            </div>

            <label className="inline-flex items-center gap-1.5 text-xs font-mono cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={allowWideSum}
                onChange={(e) => setAllowWideSum(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Use 80% Sum Corridor</span>
            </label>
          </div>

          {/* 6-Gate Diagnostic Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.gates.map((gate) => (
              <div
                key={gate.gateId}
                data-testid={`sieve-gate-card-${gate.gateNumber}`}
                className={`p-3 rounded-xl border transition-colors ${
                  gate.passed
                    ? "bg-slate-50/70 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800"
                    : "bg-red-500/5 border-red-500/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {gate.name}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      gate.passed
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-500/15 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {gate.passed ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> PASS
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> FAIL
                      </>
                    )}
                  </span>
                </div>
                <div className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                  Actual: {gate.actualValue}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Target: {gate.expectedRule}
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                  {gate.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* =================================================================
            RIGHT 5 COLUMNS: SYSTEM PLAY ("CHƠI BAO") & NET PIT TAX CALCULATOR
           ================================================================= */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                System Play (&ldquo;Chơi Bao&rdquo;) &amp; Tax Matrix
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Combinatorial cost, improved jackpot odds, compound fixed prizes, and
              10% PIT withholding tax calculator for{" "}
              <strong>{cfg.name}</strong>.
            </p>
          </div>

          {/* Interactive Bao Tier Selector */}
          <div className="space-y-2">
            <label
              htmlFor="bao-tier-select"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              Select System Play Tier (Bao 5 / Bao 7 – Bao 18):
            </label>
            <select
              id="bao-tier-select"
              data-testid="bao-tier-select"
              value={selectedBaoCode}
              onChange={(e) => setSelectedBaoCode(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {systemTiers.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name} — {t.combinations.toLocaleString("en-US")} combos (
                  {formatVND(t.costVnd)})
                </option>
              ))}
            </select>
          </div>

          {/* Highlight Card for Selected Bao Tier */}
          <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                {selectedTier.name}
              </span>
              <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-amber-500 text-slate-950">
                {formatVND(selectedTier.costVnd)}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              {selectedTier.description}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-500/20 text-xs font-mono">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  Combinations Generated:
                </span>
                <strong className="text-slate-900 dark:text-white">
                  {selectedTier.combinations.toLocaleString("en-US")} lines
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                  Jackpot 1 Odds:
                </span>
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {selectedTier.jp1OddsRatio}
                </strong>
              </div>
              {gameType === "6/55" && (
                <div className="col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px]">
                    Jackpot 2 Odds (5 Main + Bonus):
                  </span>
                  <strong className="text-amber-600 dark:text-amber-400">
                    {selectedTier.jp2OddsRatio} (6x higher than JP1)
                  </strong>
                </div>
              )}
            </div>

            {/* Compound Fixed Prize Payouts for Selected Tier */}
            <div className="pt-2 border-t border-amber-500/20 space-y-1 text-xs font-mono">
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Compound Fixed Prizes (Gross → Net After 10% PIT):
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Match 5 Main Balls:</span>
                <strong>
                  {formatVND(selectedTier.fixedPrizeWhenMatching5MainVnd)} (Net:{" "}
                  {formatVND(
                    calculateNetPayout(
                      selectedTier.fixedPrizeWhenMatching5MainVnd
                    ).netVnd
                  )}
                  )
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Match 4 Main Balls:</span>
                <strong>
                  {formatVND(selectedTier.fixedPrizeWhenMatching4MainVnd)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Match 3 Main Balls:</span>
                <strong>
                  {formatVND(selectedTier.fixedPrizeWhenMatching3MainVnd)}
                </strong>
              </div>
            </div>
          </div>

          {/* Compact Scrollable Table of All Bao Tiers (Bao 5, Bao 7..Bao 15, Bao 18) */}
          <div className="overflow-x-auto max-h-56 border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-[11px] font-mono">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0">
                <tr>
                  <th className="py-2 px-2.5">System Tier</th>
                  <th className="py-2 px-2 text-right">Combos</th>
                  <th className="py-2 px-2.5 text-right">Ticket Cost</th>
                  <th className="py-2 px-2.5 text-right">5-Main Prize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {systemTiers.map((tier) => (
                  <tr
                    key={tier.code}
                    onClick={() => setSelectedBaoCode(tier.code)}
                    className={`cursor-pointer transition-colors ${
                      selectedBaoCode === tier.code
                        ? "bg-amber-500/15 font-bold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <td className="py-1.5 px-2.5 text-slate-900 dark:text-white">
                      {tier.name}
                    </td>
                    <td className="py-1.5 px-2 text-right text-slate-600 dark:text-slate-400">
                      {tier.combinations.toLocaleString("en-US")}
                    </td>
                    <td className="py-1.5 px-2.5 text-right text-slate-900 dark:text-white">
                      {formatVND(tier.costVnd, true)}
                    </td>
                    <td className="py-1.5 px-2.5 text-right text-emerald-600 dark:text-emerald-400">
                      {formatVND(tier.fixedPrizeWhenMatching5MainVnd, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interactive 10% PIT Tax Withholding Calculator */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-emerald-500" />
                Net Payout Calculator (10% PIT &gt; 10M VND)
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setCustomGrossPrizeVnd(powerCfg.currentJackpot1Vnd)
                  }
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-200 dark:bg-slate-800 cursor-pointer"
                >
                  6/55 JP1
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCustomGrossPrizeVnd(megaCfg.currentJackpot1Vnd)
                  }
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-200 dark:bg-slate-800 cursor-pointer"
                >
                  6/45 JP
                </button>
                <button
                  type="button"
                  onClick={() => setCustomGrossPrizeVnd(10_000_000)}
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-200 dark:bg-slate-800 cursor-pointer"
                >
                  10M (Tax-Free)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
              <div>
                <span className="text-[10px] text-slate-500 block">
                  Gross Prize (VND):
                </span>
                <input
                  type="number"
                  value={customGrossPrizeVnd}
                  onChange={(e) =>
                    setCustomGrossPrizeVnd(Math.max(0, Number(e.target.value)))
                  }
                  className="w-full mt-0.5 px-2 py-1 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold"
                />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">
                  10% PIT Tax Deducted:
                </span>
                <div className="mt-1.5 font-bold text-red-600 dark:text-red-400">
                  -{formatVND(taxBreakdown.pitTaxVnd, true)}
                </div>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-600 dark:text-slate-400">
                Net Take-Home Payout:
              </span>
              <strong className="text-sm text-emerald-600 dark:text-emerald-400">
                {formatVND(taxBreakdown.netVnd)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
