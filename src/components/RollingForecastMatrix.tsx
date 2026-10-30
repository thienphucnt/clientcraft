"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Dices,
  RotateCcw,
  LayoutGrid,
  Columns,
  Info,
  Check,
  Copy,
  Sparkles,
  CalendarOff,
  ArrowRight,
  Filter,
} from "lucide-react";
import {
  addDaysISO,
  DayScheduleForecast,
  GeneratedBallot,
  RollingScheduleResult,
} from "@/lib/quantEngine";
import { BallotCard } from "@/components/BallotCard";
import {
  formatVND,
  GAME_CONFIGS,
  getICTTelemetryClock,
} from "@/lib/vietlottData";

interface RollingForecastMatrixProps {
  schedule: RollingScheduleResult;
  anchorDate: string;
  onChangeAnchorDate: (newDate: string) => void;
  seedSalt: number;
  onReRollSeed: () => void;
  onResetSeed: () => void;
  onInspectBallot: (ballot: GeneratedBallot) => void;
  simulateDraw1413?: boolean;
  onToggleSimulateDraw1413?: () => void;
}

export function RollingForecastMatrix({
  schedule,
  anchorDate,
  onChangeAnchorDate,
  seedSalt,
  onReRollSeed,
  onResetSeed,
  onInspectBallot,
  simulateDraw1413 = false,
  onToggleSimulateDraw1413,
}: RollingForecastMatrixProps) {
  const [viewMode, setViewMode] = useState<"WEEKLY_GRID" | "DAILY_DEEP_DIVE">(
    "WEEKLY_GRID"
  );
  const [selectedDayIso, setSelectedDayIso] = useState<string>(anchorDate);
  const [gameFilter, setGameFilter] = useState<"ALL" | "6/55" | "6/45">("ALL");
  const [copiedDayIso, setCopiedDayIso] = useState<string | null>(null);
  const [liveTodayIso, setLiveTodayIso] = useState<string>("2026-10-30");

  useEffect(() => {
    const clk = getICTTelemetryClock(new Date());
    if (clk.isoDate) {
      setLiveTodayIso(clk.isoDate);
    }
  }, []);

  // Compute dynamic date presets relative to liveTodayIso
  const dynamicPresets = useMemo(() => {
    const formatShort = (iso: string) => {
      const dt = new Date(`${iso}T12:00:00+07:00`);
      return dt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      });
    };
    const getWeekday = (iso: string) => {
      const dt = new Date(`${iso}T12:00:00+07:00`);
      return dt.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "Asia/Ho_Chi_Minh",
      });
    };

    const todayWk = getWeekday(liveTodayIso);
    const todayGame =
      todayWk === "Monday"
        ? "Rest Day"
        : todayWk === "Tuesday" ||
          todayWk === "Thursday" ||
          todayWk === "Saturday"
        ? "6/55"
        : "6/45";

    const tomorrowIso = addDaysISO(liveTodayIso, 1);
    const tomorrowWk = getWeekday(tomorrowIso);
    const tomorrowGame =
      tomorrowWk === "Monday"
        ? "Rest Day"
        : tomorrowWk === "Tuesday" ||
          tomorrowWk === "Thursday" ||
          tomorrowWk === "Saturday"
        ? "6/55"
        : "6/45";

    // Find recent Monday and upcoming Monday
    let recentMondayIso = liveTodayIso;
    for (let offset = 0; offset >= -6; offset--) {
      const cand = addDaysISO(liveTodayIso, offset);
      if (getWeekday(cand) === "Monday") {
        recentMondayIso = cand;
        break;
      }
    }
    let nextMondayIso = addDaysISO(liveTodayIso, 1);
    for (let offset = 1; offset <= 7; offset++) {
      const cand = addDaysISO(liveTodayIso, offset);
      if (getWeekday(cand) === "Monday") {
        nextMondayIso = cand;
        break;
      }
    }

    return {
      todayIso: liveTodayIso,
      todayLabel: `Today (${formatShort(liveTodayIso)} • ${todayGame})`,
      tomorrowIso,
      tomorrowLabel: `Tomorrow (${formatShort(tomorrowIso)} • ${tomorrowGame})`,
      recentMondayIso,
      recentMondayLabel: `${formatShort(recentMondayIso)} (Monday Rest Day)`,
      nextMondayIso,
      nextMondayLabel: `${formatShort(nextMondayIso)} (Next Mon Rest Day)`,
      backtestIso: "2026-10-20",
      backtestLabel: "Oct 20 Backtest (Settled Draws)",
    };
  }, [liveTodayIso]);

  // Sync selectedDayIso if anchorDate changes
  const effectiveSelectedDay = useMemo(() => {
    const found = schedule.allHorizonDays.find(
      (d) => d.date === selectedDayIso
    );
    return found || schedule.allHorizonDays[0];
  }, [schedule.allHorizonDays, selectedDayIso]);

  const filteredActiveSixDays = useMemo(() => {
    if (gameFilter === "ALL") return schedule.activeSixDayCycle;
    return schedule.activeSixDayCycle.filter((d) => d.gameType === gameFilter);
  }, [schedule.activeSixDayCycle, gameFilter]);

  const handleCopyDayAllBallots = (day: DayScheduleForecast) => {
    const lines = day.ballots.map((b) => {
      const nums = b.numbers.map((n) => String(n).padStart(2, "0")).join(" - ");
      return `S${b.slot} (${b.strategyBadge}): ${nums} | Sum=${b.sum} (${b.oddEven}, ${b.lowHigh})`;
    });
    const header = `=== VIETLOTT ${day.gameName.toUpperCase()} — ${day.weekday.toUpperCase()} (${day.date}) ${day.estimatedDrawId} ===`;
    const payload = [header, ...lines].join("\n");

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(payload);
      setCopiedDayIso(day.date);
      setTimeout(() => setCopiedDayIso(null), 2000);
    }
  };

  return (
    <section
      aria-label="7-Day Rolling Forecast Matrix"
      className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-5"
    >
      {/* Controls & Toolbar Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Title & Horizon Summary */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold uppercase rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                6-Gate Combinatorial Sieve
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Mulberry32 Deterministic PRNG • Seed Salt #{seedSalt}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              7-Day Rolling Algorithmic Ballot Matrix ({schedule.anchorDate} →{" "}
              {schedule.allHorizonDays[schedule.allHorizonDays.length - 1]?.date})
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              5 orthogonal <strong>6-number tickets</strong> per active draw day
              (Tuesday–Sunday = <strong>30 weekly 6-number sets</strong>, 50,000
              VND/day • 300,000 VND/week) targeting both Jackpot 1 (6/6) &amp;
              Power 6/55 Jackpot 2 (5/6 Main + 6th Ball Matches Special Bonus).
            </p>
          </div>

          {/* Right: View Mode Switcher & Seed Re-Roll */}
          <div className="flex items-center flex-wrap gap-2">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                data-testid="view-mode-weekly"
                onClick={() => setViewMode("WEEKLY_GRID")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "WEEKLY_GRID"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-indigo-500" />
                <span>Full 7-Day Weekly Grid (Tue–Sun)</span>
              </button>
              <button
                type="button"
                data-testid="view-mode-daily"
                onClick={() => setViewMode("DAILY_DEEP_DIVE")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === "DAILY_DEEP_DIVE"
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Columns className="w-3.5 h-3.5 text-indigo-500" />
                <span>Daily Deep-Dive View</span>
              </button>
            </div>

            {/* Re-Roll Seed Button */}
            <button
              type="button"
              data-testid="reroll-seed-btn"
              onClick={onReRollSeed}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <Dices className="w-4 h-4" />
              <span>Re-Roll Seed</span>
            </button>

            {onToggleSimulateDraw1413 && (
              <button
                type="button"
                data-testid="simulate-draw1413-btn"
                onClick={onToggleSimulateDraw1413}
                title="Test how completing the next upcoming draw re-anchors the PRNG seed and re-synthesizes all subsequent ballots in the 7-day rolling window"
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                  simulateDraw1413
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {simulateDraw1413
                    ? "✓ Simulating Next Draw Settled (Re-Synthesized)"
                    : "Sim Next Draw Settlement"}
                </span>
              </button>
            )}

            {seedSalt !== 0 && (
              <button
                type="button"
                data-testid="reset-seed-btn"
                onClick={onResetSeed}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Seed</span>
              </button>
            )}
          </div>
        </div>

        {/* Second Row: Anchor Date Picker + Quick Date Presets + Game Filter */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Anchor Date Input & Presets */}
          <div className="flex items-center flex-wrap gap-2">
            <label
              htmlFor="anchor-date-picker"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span>Anchor Date:</span>
            </label>
            <input
              id="anchor-date-picker"
              data-testid="anchor-date-input"
              type="date"
              value={anchorDate}
              onChange={(e) => {
                if (e.target.value) {
                  onChangeAnchorDate(e.target.value);
                  setSelectedDayIso(e.target.value);
                }
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {/* Quick Preset Buttons */}
            <div className="flex items-center flex-wrap gap-1.5">
              <button
                type="button"
                data-testid="preset-today"
                onClick={() => {
                  onChangeAnchorDate(dynamicPresets.todayIso);
                  setSelectedDayIso(dynamicPresets.todayIso);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                  anchorDate === dynamicPresets.todayIso
                    ? "bg-indigo-600 text-white border-indigo-600 font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {dynamicPresets.todayLabel}
              </button>
              <button
                type="button"
                data-testid="preset-tomorrow"
                onClick={() => {
                  onChangeAnchorDate(dynamicPresets.tomorrowIso);
                  setSelectedDayIso(dynamicPresets.tomorrowIso);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                  anchorDate === dynamicPresets.tomorrowIso
                    ? "bg-blue-600 text-white border-blue-600 font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {dynamicPresets.tomorrowLabel}
              </button>
              <button
                type="button"
                data-testid="preset-monday"
                onClick={() => {
                  onChangeAnchorDate(dynamicPresets.recentMondayIso);
                  setSelectedDayIso(dynamicPresets.recentMondayIso);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                  anchorDate === dynamicPresets.recentMondayIso
                    ? "bg-amber-500 text-slate-950 border-amber-500 font-bold"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                }`}
              >
                {dynamicPresets.recentMondayLabel}
              </button>
              <button
                type="button"
                data-testid="preset-next-monday"
                onClick={() => {
                  onChangeAnchorDate(dynamicPresets.nextMondayIso);
                  setSelectedDayIso(dynamicPresets.nextMondayIso);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                  anchorDate === dynamicPresets.nextMondayIso
                    ? "bg-amber-500 text-slate-950 border-amber-500 font-bold"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {dynamicPresets.nextMondayLabel}
              </button>
              <button
                type="button"
                data-testid="preset-backtest"
                onClick={() => {
                  onChangeAnchorDate(dynamicPresets.backtestIso);
                  setSelectedDayIso(dynamicPresets.backtestIso);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer border ${
                  anchorDate === dynamicPresets.backtestIso
                    ? "bg-emerald-600 text-white border-emerald-600 font-bold"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20"
                }`}
              >
                {dynamicPresets.backtestLabel}
              </button>
            </div>
          </div>

          {/* Game Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-500 dark:text-slate-400 mr-1">
              Matrix Filter:
            </span>
            {(["ALL", "6/55", "6/45"] as const).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGameFilter(g)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  gameFilter === g
                    ? g === "6/55"
                      ? "bg-red-600 text-white"
                      : g === "6/45"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {g === "ALL"
                  ? "All (Tue–Sun)"
                  : g === "6/55"
                  ? "Power 6/55 (Tue/Thu/Sat)"
                  : "Mega 6/45 (Wed/Fri/Sun)"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MONDAY MATRIX REST DAY STATUS CARD (Prominent whenever Anchor Date is Monday or in Weekly View) */}
      {(schedule.isAnchorMonday ||
        (viewMode === "DAILY_DEEP_DIVE" &&
          effectiveSelectedDay?.isMondayRestDay)) && (
        <div
          data-testid="monday-rest-day-card"
          className="rounded-2xl border-2 border-amber-500/60 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-indigo-500/10 p-4 sm:p-5 shadow-md"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 shrink-0 shadow-sm">
                <CalendarOff className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 text-xs font-mono font-extrabold uppercase rounded-full bg-amber-500 text-slate-950">
                    MONDAY SYNCHRONIZATION &amp; PLANNING DAY
                  </span>
                  <span className="text-xs font-mono font-semibold text-amber-700 dark:text-amber-300">
                    Anchor: {schedule.anchorDate} ({schedule.anchorWeekday})
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  Monday Matrix Rest Day (No 6/45 or 6/55 Draw)
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-1 max-w-3xl">
                  Vietlott operates a strict 6-day Tuesday–Sunday matrix cycle—no{" "}
                  <strong>Mega 6/45</strong> or <strong>Power 6/55</strong> drawing takes
                  place on Mondays (only Max 3D at 18:00, Lotto 5/35, and Keno run on
                  Mondays). Below is the complete{" "}
                  <strong>
                    Tuesday through Sunday 30-Ballot Rolling Matrix (6 active draw days ×
                    5 orthogonal strategies)
                  </strong>{" "}
                  plus the following Tuesday lookahead (covering 7–8 calendar days in
                  advance).
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end justify-center shrink-0 bg-white/80 dark:bg-slate-900/80 px-4 py-3 rounded-xl border border-amber-500/30 font-mono text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Upcoming Weekly Matrix:
              </span>
              <strong className="text-base text-slate-900 dark:text-white">
                6 Active Days • 30 Ballots
              </strong>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                +5 Next Tue Lookahead (35 Total)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* HORIZON DAY SELECTOR STRIP (8-to-9 Calendar Days) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {schedule.allHorizonDays.slice(0, 8).map((day) => {
          const isSelected =
            viewMode === "DAILY_DEEP_DIVE" &&
            effectiveSelectedDay?.date === day.date;
          const isMon = day.isMondayRestDay;
          const isPower = day.gameType === "6/55";

          return (
            <button
              key={day.date}
              type="button"
              data-testid={`day-tab-${day.date}`}
              onClick={() => {
                setSelectedDayIso(day.date);
                setViewMode("DAILY_DEEP_DIVE");
              }}
              className={`flex flex-col items-start justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? "ring-2 ring-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/50 border-indigo-500"
                  : isMon
                  ? "bg-amber-500/5 border-amber-500/30 hover:bg-amber-500/10"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <div className="w-full flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {day.shortDateLabel}
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                    isMon
                      ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                      : isPower
                      ? "bg-red-600 text-white"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {isMon ? "REST" : day.gameType}
                </span>
              </div>
              <div className="mt-1.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {isMon
                  ? "No Matrix Draw"
                  : `${day.estimatedDrawId} • 5 Sets`}
              </div>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          MODE A: FULL 7-DAY WEEKLY GRID (TUE–SUN = 6 ACTIVE DRAW DAYS, 30 BALLOTS)
          (Also rendered automatically below Monday Rest Day if Monday is selected in Daily view!)
         ===================================================================== */}
      {(viewMode === "WEEKLY_GRID" ||
        (viewMode === "DAILY_DEEP_DIVE" &&
          effectiveSelectedDay?.isMondayRestDay)) && (
        <div data-testid="weekly-grid-container" className="space-y-6">
          {/* Non-anchor Monday notice pill if Monday is mid-week */}
          {!schedule.isAnchorMonday && (
            <div
              data-testid="monday-rest-day-inline-banner"
              className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 text-xs"
            >
              <div className="flex items-center gap-2">
                <CalendarOff className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  <strong>Monday Matrix Rest Day Rule Active:</strong> Monday (
                  {schedule.allHorizonDays.find((d) => d.isMondayRestDay)?.date ||
                    "Mon"}
                  ) has no Mega 6/45 or Power 6/55 draw. Showing all{" "}
                  <strong>6 active weekly draw days (Tuesday–Sunday = 30 ballots)</strong>{" "}
                  plus the 8th-day lookahead below.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const monDay = schedule.allHorizonDays.find(
                    (d) => d.isMondayRestDay
                  );
                  onChangeAnchorDate(monDay ? monDay.date : "2026-10-19");
                }}
                className="font-mono font-semibold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
              >
                Simulate Monday Anchor →
              </button>
            </div>
          )}

          {/* 6 Active Draw Days Grid (Tuesday through Sunday = 30 Ballots) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredActiveSixDays.map((day, dayIdx) => {
              const isPower = day.gameType === "6/55";
              const cfg = GAME_CONFIGS[day.gameType as "6/55" | "6/45"];
              const isCopied = copiedDayIso === day.date;

              return (
                <div
                  key={day.date}
                  data-testid={`active-day-column-${day.date}`}
                  className={`rounded-2xl border overflow-hidden shadow-sm bg-white dark:bg-slate-900/90 ${
                    isPower
                      ? "border-red-500/30 dark:border-red-500/25"
                      : "border-blue-500/30 dark:border-blue-500/25"
                  }`}
                >
                  {/* Day Card Header */}
                  <div
                    className={`px-4 py-3.5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
                      isPower
                        ? "bg-gradient-to-r from-red-500/10 via-orange-500/5 to-transparent border-red-500/20"
                        : "bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent border-blue-500/20"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2.5 py-0.5 text-xs font-mono font-extrabold rounded-full ${
                            isPower
                              ? "bg-red-600 text-white"
                              : "bg-blue-600 text-white"
                          }`}
                        >
                          {day.gameName.toUpperCase()}
                        </span>
                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                          {day.weekday} • {day.date}
                        </span>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                          ({day.estimatedDrawId})
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                        Broadcast: {day.broadcastWindowICT} ICT • Cutoff:{" "}
                        {day.cutoffTimeICT} ICT • Calibrated from{" "}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {day.calibratedFromDrawId}
                        </strong>{" "}
                        • Seed: {day.seedHash}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyDayAllBallots(day)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Copied 5 Sets</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copy 5 Sets</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDayIso(day.date);
                          setViewMode("DAILY_DEEP_DIVE");
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        Deep-Dive →
                      </button>
                    </div>
                  </div>

                  {/* Optional Settled Actual Draw Banner when a day's draw has already completed */}
                  {day.settledActualDraw && (
                    <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                      <div>
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">
                          ✓ Settled Draw #{day.settledActualDraw.id} Actual:
                        </span>
                        {day.masterPoolHitsCount !== undefined && (
                          <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                            Master Pool Hits: {day.masterPoolHitsCount}/6 • Best Ticket:{" "}
                            {day.bestTicketMatchCount}/6
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {day.settledActualDraw.numbers.map((n) => (
                          <span
                            key={n}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold"
                          >
                            {String(n).padStart(2, "0")}
                          </span>
                        ))}
                        {day.settledActualDraw.bonus !== undefined && (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-950 text-[11px] font-extrabold ml-1">
                            {String(day.settledActualDraw.bonus).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* v2.0 Self-Learned 14-Ball Master Core Pool & t=3 Abbreviated Wheel Strip */}
                  {day.masterCorePool && day.masterCorePool.length > 0 && (
                    <div className="px-4 py-2 bg-indigo-500/5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col gap-1.5 text-[11px] font-mono">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          ★ v2.0 Self-Learned 14-Ball Master Wheel Pool:
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          t=3 Coverage:{" "}
                          <strong className="text-emerald-600 dark:text-emerald-400">
                            {day.wheelTripletsCovered ?? 100}/100 Distinct 3-Tuples
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1 flex-wrap">
                        {day.masterCorePool.map((n) => {
                          const isActualHit =
                            day.settledActualDraw?.numbers.includes(n) ?? false;
                          return (
                            <span
                              key={`master-${day.date}-${n}`}
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold ${
                                isActualHit
                                  ? "bg-emerald-600 text-white ring-2 ring-emerald-400"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {String(n).padStart(2, "0")}
                            </span>
                          );
                        })}
                        {day.learnedWeights && (
                          <span className="ml-auto text-[10px] text-slate-400 hidden sm:inline">
                            Hedge W: Surge {(day.learnedWeights.shortSurge * 100).toFixed(0)}% •
                            LagRepeat {(day.learnedWeights.lagRepeat * 100).toFixed(0)}% •
                            Lift {(day.learnedWeights.companionLift * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 5 Orthogonal Strategy Ballots */}
                  <div className="p-3 sm:p-4 space-y-2.5">
                    {day.ballots.map((ballot) => (
                      <BallotCard
                        key={`${day.date}-slot-${ballot.slot}`}
                        ballot={ballot}
                        compact={true}
                        onInspectBallot={onInspectBallot}
                      />
                    ))}
                  </div>

                  {/* Day Card Footer Summary */}
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>
                      Daily 5×6 Ticket Outlay: <strong>50,000 VND</strong> (5 × 10,000
                      VND)
                    </span>
                    {isPower ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        ★ 6-Ball Ticket Targets JP1 (6/6) &amp; JP2 (5/6 Main + 6th=Bonus)
                      </span>
                    ) : (
                      <span>
                        First Prize (5/6 Main): 10,000,000 VND (100% Tax-Exempt)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 8th Calendar Day / Next Tuesday Lookahead Section */}
          {schedule.extraLookaheadDay &&
            (gameFilter === "ALL" ||
              gameFilter === schedule.extraLookaheadDay.gameType) && (
              <div
                data-testid="extra-lookahead-day-card"
                className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-white to-slate-50 dark:from-indigo-950/20 dark:via-slate-900 dark:to-slate-900 p-4 sm:p-5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 text-xs font-mono font-bold rounded-full bg-indigo-600 text-white">
                        8-DAY EXTENDED HORIZON LOOKAHEAD
                      </span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Following {schedule.extraLookaheadDay.weekday} (
                        {schedule.extraLookaheadDay.date}) —{" "}
                        {schedule.extraLookaheadDay.gameName}{" "}
                        {schedule.extraLookaheadDay.estimatedDrawId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Markov Virtual-Draw Propagation (γ = 0.88 attenuation) applied across
                      prior weekly draws to prevent ballot repetition.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyDayAllBallots(schedule.extraLookaheadDay!)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer self-start sm:self-auto"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Next {schedule.extraLookaheadDay.weekday} Sets</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {schedule.extraLookaheadDay.ballots.map((ballot) => (
                    <BallotCard
                      key={`extra-${ballot.slot}`}
                      ballot={ballot}
                      compact={true}
                      onInspectBallot={onInspectBallot}
                    />
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* =====================================================================
          MODE B: DAILY DEEP-DIVE VIEW (When an Active Draw Day is Selected)
         ===================================================================== */}
      {viewMode === "DAILY_DEEP_DIVE" &&
        effectiveSelectedDay &&
        !effectiveSelectedDay.isMondayRestDay && (
          <div
            data-testid="daily-deep-dive-container"
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-sm space-y-6"
          >
            {/* Active Day Banner */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span
                    className={`px-3 py-1 text-xs font-mono font-extrabold rounded-full ${
                      effectiveSelectedDay.gameType === "6/55"
                        ? "bg-red-600 text-white"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    {effectiveSelectedDay.gameName.toUpperCase()}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {effectiveSelectedDay.weekday}, {effectiveSelectedDay.date}{" "}
                    <span className="font-mono text-base font-normal text-slate-500">
                      ({effectiveSelectedDay.estimatedDrawId})
                    </span>
                  </h3>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-semibold rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    ✓ 5/5 Ballots Sieve Compliant
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {effectiveSelectedDay.concurrentGamesNote} • Deterministic Seed:{" "}
                  <code className="font-mono font-bold">
                    {effectiveSelectedDay.seedHash}
                  </code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyDayAllBallots(effectiveSelectedDay)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold shadow-sm hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {copiedDayIso === effectiveSelectedDay.date ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
                      <span>All 5 Sets Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy All 5 Ballots</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 5 Full-Width Detailed Strategy Ballot Cards */}
            <div className="space-y-3">
              {effectiveSelectedDay.ballots.map((ballot) => (
                <BallotCard
                  key={`deep-${effectiveSelectedDay.date}-${ballot.slot}`}
                  ballot={ballot}
                  compact={false}
                  onInspectBallot={onInspectBallot}
                />
              ))}
            </div>

            {/* Combinatorial Sum Equilibrium by Strategy (Visual Benchmark Chart matching PDF Page 30) */}
            {(() => {
              const cfg =
                GAME_CONFIGS[effectiveSelectedDay.gameType as "6/55" | "6/45"];
              return (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Combinatorial Sum Equilibrium by Strategy
                    </h4>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      70% Target Corridor:{" "}
                      <strong>
                        [{cfg.corridor70[0]} – {cfg.corridor70[1]}]
                      </strong>{" "}
                      (Ideal Mean: <strong>{cfg.meanSum}</strong>)
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {effectiveSelectedDay.ballots.map((b) => {
                      const pct = Math.min(
                        100,
                        Math.max(
                          10,
                          Math.round((b.sum / cfg.maxPossibleSum) * 100)
                        )
                      );
                      return (
                        <div
                          key={`sum-bar-${b.slot}`}
                          className="grid grid-cols-12 items-center gap-2 text-xs font-mono"
                        >
                          <div className="col-span-4 sm:col-span-3 truncate text-slate-700 dark:text-slate-300 font-semibold">
                            S{b.slot}: {b.strategyBadge}
                          </div>
                          <div className="col-span-6 sm:col-span-7 h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
                            <div
                              className={`h-full rounded-full ${
                                effectiveSelectedDay.gameType === "6/55"
                                  ? "bg-gradient-to-r from-orange-500 to-red-500"
                                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="col-span-2 text-right font-bold text-slate-900 dark:text-white">
                            Σ = {b.sum}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
    </section>
  );
}
