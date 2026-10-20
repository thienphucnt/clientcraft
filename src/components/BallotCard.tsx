"use client";

import React, { useState } from "react";
import {
  Check,
  Copy,
  Flame,
  RotateCcw,
  Activity,
  Scale,
  ShieldAlert,
  Sparkles,
  SearchCheck,
} from "lucide-react";
import { GeneratedBallot } from "@/lib/quantEngine";
import { GAME_CONFIGS } from "@/data/empiricalSeed2026";

interface BallotCardProps {
  ballot: GeneratedBallot;
  compact?: boolean;
  onInspectBallot?: (ballot: GeneratedBallot) => void;
}

export function BallotCard({
  ballot,
  compact = false,
  onInspectBallot,
}: BallotCardProps) {
  const [copied, setCopied] = useState(false);
  const cfg = GAME_CONFIGS[ballot.gameType];

  const handleCopy = () => {
    const formattedNums = ballot.numbers
      .map((n) => String(n).padStart(2, "0"))
      .join(" - ");
    const bonusPart =
      ballot.bonusAnchor !== undefined
        ? ` [Bao-7 Anchor: ${String(ballot.bonusAnchor).padStart(2, "0")}]`
        : "";
    const text = `Vietlott ${cfg.name} (${ballot.targetDate}) | S${ballot.slot} ${ballot.strategyBadge}: ${formattedNums}${bonusPart} | Sum: ${ballot.sum} (${ballot.oddEven}, ${ballot.lowHigh})`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Strategy visual styling
  const strategyStyle = {
    HOT_MOMENTUM: {
      icon: Flame,
      badgeBg:
        "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
      ballGradient:
        ballot.gameType === "6/55"
          ? "from-red-600 to-orange-600 text-white shadow-orange-500/20"
          : "from-blue-600 to-indigo-600 text-white shadow-blue-500/20",
    },
    COLD_REBOUND: {
      icon: RotateCcw,
      badgeBg:
        "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30",
      ballGradient:
        "from-cyan-600 to-teal-600 text-white shadow-cyan-500/20",
    },
    DELTA_SYSTEM: {
      icon: Activity,
      badgeBg:
        "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30",
      ballGradient:
        "from-purple-600 to-fuchsia-600 text-white shadow-purple-500/20",
    },
    GOLDEN_EQUILIBRIUM: {
      icon: Scale,
      badgeBg:
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
      ballGradient:
        "from-emerald-600 to-teal-700 text-white shadow-emerald-500/20",
    },
    ANTI_SPLIT_EV: {
      icon: ShieldAlert,
      badgeBg:
        "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
      ballGradient:
        "from-amber-600 to-red-600 text-white shadow-amber-500/20",
    },
  }[ballot.strategyCode];

  const IconComp = strategyStyle.icon;

  // Calculate Sum Gauge Percentage within 70% corridor
  const [minCorridor, maxCorridor] = cfg.corridor70;
  const sumPercent = Math.max(
    5,
    Math.min(
      95,
      Math.round(
        ((ballot.sum - minCorridor) / (maxCorridor - minCorridor)) * 100
      )
    )
  );

  return (
    <div
      data-testid={`ballot-card-${ballot.targetDate}-slot-${ballot.slot}`}
      className={`group relative rounded-xl border transition-all duration-200 ${
        compact ? "p-3" : "p-4"
      } bg-white/90 dark:bg-slate-900/90 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm hover:shadow-md`}
    >
      {/* Top Row: Strategy Slot + Badge + Action Buttons */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-mono font-bold rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            SET 0{ballot.slot}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold rounded-full border ${strategyStyle.badgeBg}`}
          >
            <IconComp className="w-3 h-3 shrink-0" />
            {ballot.strategyBadge}
          </span>
          {!compact && (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate hidden sm:inline">
              {ballot.strategyName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onInspectBallot && (
            <button
              type="button"
              onClick={() => onInspectBallot(ballot)}
              title="Inspect this ballot in the 6-Gate Sieve Validator"
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <SearchCheck className="w-3 h-3 text-indigo-500" />
              <span className="hidden sm:inline">Inspect</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy ballot numbers to clipboard"
            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all cursor-pointer ${
              copied
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-100/80 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Middle Row: 6 Lottery Balls + Subscript Delta Spacing Connectors (+Δ) + 7th Bao-7 Bonus Anchor */}
      <div className="flex items-center flex-wrap gap-y-2 py-1">
        {ballot.numbers.map((num, idx) => {
          const stepDelta = idx > 0 ? ballot.stepDeltas[idx - 1] : null;
          const isConsecutive = stepDelta === 1;
          return (
            <React.Fragment key={num}>
              {idx > 0 && (
                <div className="flex flex-col items-center justify-center mx-0.5 select-none">
                  <span
                    title={`Step delta Δ${idx + 1} = +${stepDelta}`}
                    className={`text-[9px] sm:text-[10px] font-mono px-0.5 rounded ${
                      isConsecutive
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    +{stepDelta}
                  </span>
                  <div className="w-1.5 sm:w-2.5 h-[1px] bg-slate-200 dark:bg-slate-700" />
                </div>
              )}
              <div className="relative flex flex-col items-center">
                <div
                  className={`flex items-center justify-center rounded-full font-mono font-bold bg-gradient-to-br shadow-sm select-all ${
                    compact
                      ? "w-7 h-7 text-xs sm:w-8 sm:h-8 sm:text-xs"
                      : "w-8 h-8 text-xs sm:w-9 sm:h-9 sm:text-sm"
                  } ${strategyStyle.ballGradient}`}
                >
                  {String(num).padStart(2, "0")}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* 7th Bao-7 Bonus Anchor Ball on Power 6/55 Days */}
        {ballot.gameType === "6/55" && ballot.bonusAnchor !== undefined && (
          <div className="flex items-center ml-1.5 pl-1.5 border-l border-dashed border-amber-500/40">
            <div className="flex items-center gap-1">
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-tight font-bold text-amber-600 dark:text-amber-400">
                BAO-7
              </span>
              <div
                title="Recommended 7th Bao-7 Bonus Anchor ball to target Jackpot 2 (6x higher probability) alongside Jackpot 1"
                className={`flex items-center justify-center rounded-full font-mono font-extrabold bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-slate-950 ring-2 ring-amber-400/50 shadow-sm ${
                  compact
                    ? "w-7 h-7 text-xs sm:w-8 sm:h-8 sm:text-xs"
                    : "w-8 h-8 text-xs sm:w-9 sm:h-9 sm:text-sm"
                }`}
              >
                {String(ballot.bonusAnchor).padStart(2, "0")}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Strip: Sum Gauge Badge, Odd/Even, Low/High, Spread/Decades, 6-Gate Sieve Badge */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px]">
        <div className="flex items-center flex-wrap gap-1.5">
          {/* Sum Gauge Badge */}
          <div
            title={`Gaussian Sum Corridor [${minCorridor}, ${maxCorridor}] (Mean = ${cfg.meanSum})`}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono"
          >
            <span>
              Sum: <strong className="text-slate-900 dark:text-white">{ballot.sum}</strong>
            </span>
            <div className="w-8 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full overflow-hidden hidden sm:block">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${sumPercent}%` }}
              />
            </div>
          </div>

          {/* Odd/Even Badge */}
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            Parity: <strong className="text-slate-900 dark:text-white">{ballot.oddEven}</strong>
          </span>

          {/* Low/High Badge */}
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
            Split: <strong className="text-slate-900 dark:text-white">{ballot.lowHigh}</strong>
          </span>

          {/* Decades & Spread */}
          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono hidden md:inline-block">
            Decades: <strong>{ballot.distinctDecades}</strong> • Spread: <strong>{ballot.totalSpread}</strong>
          </span>
        </div>

        {/* Sieve Validation Status Badge */}
        <div
          data-testid={`sieve-badge-${ballot.targetDate}-${ballot.slot}`}
          className={`inline-flex items-center gap-1 font-mono font-semibold px-2 py-0.5 rounded-md ${
            ballot.sievePassed
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>
            {ballot.sievePassed
              ? "✓ SIEVE COMPLIANT (6/6)"
              : `${ballot.sieveGatesPassed}/6 GATES`}
          </span>
        </div>
      </div>
    </div>
  );
}
