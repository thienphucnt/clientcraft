import {
  BallTelemetryStat,
  CONSECUTIVE_PAIR_INCIDENCE,
  GAME_CONFIGS,
  GameConfig,
  GameType,
  HistoricalDraw,
  MACRO_PARITY_DISTRIBUTION,
  MEGA_645_SEED_DRAWS,
  MEGA_645_TELEMETRY_LEADERS,
  POWER_655_FREQUENCY_LEADERS,
  POWER_655_SEED_DRAWS,
} from "@/data/empiricalSeed2026";

export interface RawNDJsonRecord {
  date: string;
  id: string;
  result: number[];
  process_time?: string;
}

export interface SyncStatusResponse {
  tier: "TIER_1_LIVE_CLOUD_HYBRID" | "TIER_2_OFFLINE_SEED_2026";
  syncedAt: string;
  power655TotalDraws: number;
  mega645TotalDraws: number;
  latestPowerDraw: HistoricalDraw;
  latestMegaDraw: HistoricalDraw;
  powerDraws: HistoricalDraw[];
  megaDraws: HistoricalDraw[];
  sourceUrlPower: string;
  sourceUrlMega: string;
  message: string;
}

export const GITHUB_NDJSON_URLS = {
  power655:
    "https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/power655.jsonl",
  power655Alt:
    "https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/power_655.ndjson",
  mega645:
    "https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/power645.jsonl",
  mega645Alt:
    "https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/mega_645.ndjson",
};

/**
 * Vietnamese Personal Income Tax (PIT) Law (Circular No. 111/2013/TT-BTC & 2026 framework):
 * 10% flat withholding tax deducted at the source on any single lottery prize exceeding 10,000,000 VND.
 */
export function calculateNetPayout(grossPrizeVnd: number): {
  grossVnd: number;
  taxableAmountVnd: number;
  pitTaxVnd: number;
  netVnd: number;
  effectiveTaxRatePct: number;
} {
  const threshold = 10_000_000;
  const taxableAmountVnd = Math.max(0, grossPrizeVnd - threshold);
  const pitTaxVnd = Math.round(taxableAmountVnd * 0.1);
  const netVnd = grossPrizeVnd - pitTaxVnd;
  const effectiveTaxRatePct =
    grossPrizeVnd > 0 ? (pitTaxVnd / grossPrizeVnd) * 100 : 0;

  return {
    grossVnd: grossPrizeVnd,
    taxableAmountVnd,
    pitTaxVnd,
    netVnd,
    effectiveTaxRatePct,
  };
}

/**
 * Format VND currency in full or compact Billions ("Tỷ VND") / Millions ("Tr VND")
 */
export function formatVND(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(2)}B VND`;
    }
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M VND`;
    }
    return `${amount.toLocaleString("en-US")} VND`;
  }
  return `${amount.toLocaleString("en-US")} VND`;
}

/**
 * Compute Multi-Horizon Momentum Score M_i across windows W in {10, 20, 50, 100, 150}
 * with weight vector alpha = [0.30, 0.25, 0.20, 0.15, 0.10]
 */
export function computeMomentumScore(
  hits: {
    w10: number;
    w20: number;
    w50: number;
    w100: number;
    w150: number;
  },
  maxNum: number
): number {
  const p0 = 6 / maxNum;
  const windows = [
    { w: 10, h: hits.w10, alpha: 0.3 },
    { w: 20, h: hits.w20, alpha: 0.25 },
    { w: 50, h: hits.w50, alpha: 0.2 },
    { w: 100, h: hits.w100, alpha: 0.15 },
    { w: 150, h: hits.w150, alpha: 0.1 },
  ];

  let mScore = 0;
  for (const { w, h, alpha } of windows) {
    const expected = w * p0;
    const sd = Math.sqrt(w * p0 * (1 - p0));
    const z = (h - expected) / sd;
    mScore += alpha * z;
  }
  return Number(mScore.toFixed(2));
}

/**
 * Compute Damped Log-Normal Survival Hazard Score R_i:
 * R_i = (g_i / mu_g) * exp(1 - g_i / (2.0 * mu_g))
 * Peaks in the 1.5*mu_g to 2.5*mu_g rebound zone (11-19 draws for 6/45; 14-23 draws for 6/55).
 */
export function computeSurvivalHazardScore(
  skipGap: number,
  maxNum: number
): number {
  const muG = maxNum / 6; // 7.50 for 6/45, 9.1667 for 6/55
  const ratio = skipGap / muG;
  const rScore = ratio * Math.exp(1 - skipGap / (2.0 * muG));
  return Number(rScore.toFixed(3));
}

/**
 * Generate full 45-ball or 55-ball telemetry dataset combining Tier 2 verified leaders
 * and complete deterministic baseline for remaining balls.
 */
export function getFullBallTelemetry(gameType: GameType): BallTelemetryStat[] {
  const cfg = GAME_CONFIGS[gameType];
  const maxNum = cfg.maxNum;
  const stats: BallTelemetryStat[] = [];

  if (gameType === "6/55") {
    const leaderMap = new Map(
      POWER_655_FREQUENCY_LEADERS.map((item) => [item.ball, item])
    );

    for (let b = 1; b <= maxNum; b++) {
      const known = leaderMap.get(b);
      if (known) {
        const momentumZ = computeMomentumScore(
          {
            w10: known.hitsW10,
            w20: known.hitsW20,
            w50: known.hitsW50,
            w100: known.hitsW100,
            w150: known.hitsW150,
          },
          maxNum
        );
        const hazardScore = computeSurvivalHazardScore(known.skipGap, maxNum);
        stats.push({
          ball: b,
          gameType,
          hitsW10: known.hitsW10,
          hitsW20: known.hitsW20,
          hitsW50: known.hitsW50,
          hitsW100: known.hitsW100,
          hitsW150: known.hitsW150,
          hitsAllTime: known.hitsAllTime,
          skipGap: known.skipGap,
          momentumZ,
          hazardScore,
          regime: known.regime,
          note: known.note,
        });
      } else {
        // Deterministic baseline around theoretical expectation (1412 * 6 / 55 = 154.04)
        const pseudoOffset = ((b * 17 + 13) % 19) - 9;
        const hitsAllTime = 154 + pseudoOffset;
        const hitsW150 = Math.max(11, Math.min(21, 16 + ((b * 7) % 5) - 2));
        const hitsW100 = Math.round(hitsW150 * 0.67);
        const hitsW50 = Math.round(hitsW150 * 0.33);
        const hitsW20 = Math.round(hitsW150 * 0.13);
        const hitsW10 = Math.round(hitsW150 * 0.07);
        const skipGap = ((b * 11 + 3) % 12) + 1;
        const momentumZ = computeMomentumScore(
          {
            w10: hitsW10,
            w20: hitsW20,
            w50: hitsW50,
            w100: hitsW100,
            w150: hitsW150,
          },
          maxNum
        );
        const hazardScore = computeSurvivalHazardScore(skipGap, maxNum);
        stats.push({
          ball: b,
          gameType,
          hitsW10,
          hitsW20,
          hitsW50,
          hitsW100,
          hitsW150,
          hitsAllTime,
          skipGap,
          momentumZ,
          hazardScore,
          regime: "NEUTRAL",
        });
      }
    }
  } else {
    const leaderMap = new Map(
      MEGA_645_TELEMETRY_LEADERS.map((item) => [item.ball, item])
    );

    for (let b = 1; b <= maxNum; b++) {
      const known = leaderMap.get(b);
      if (known) {
        const momentumZ = computeMomentumScore(
          {
            w10: known.hitsW10,
            w20: known.hitsW20,
            w50: known.hitsW50,
            w100: known.hitsW100,
            w150: known.hitsW150,
          },
          maxNum
        );
        const hazardScore = computeSurvivalHazardScore(known.skipGap, maxNum);
        stats.push({
          ball: b,
          gameType,
          hitsW10: known.hitsW10,
          hitsW20: known.hitsW20,
          hitsW50: known.hitsW50,
          hitsW100: known.hitsW100,
          hitsW150: known.hitsW150,
          hitsAllTime: known.hitsAllTime,
          skipGap: known.skipGap,
          momentumZ,
          hazardScore,
          regime: known.regime,
          note: known.note,
        });
      } else {
        // Theoretical 150-draw expectation = 20.00
        const hitsW150 = 18 + ((b * 5) % 4); // 18..21 neutral band
        const hitsW100 = Math.round(hitsW150 * 0.67);
        const hitsW50 = Math.round(hitsW150 * 0.33);
        const hitsW20 = Math.round(hitsW150 * 0.13);
        const hitsW10 = Math.round(hitsW150 * 0.07);
        const hitsAllTime = 202 + ((b * 13) % 15) - 7;
        const skipGap = ((b * 9 + 2) % 11) + 1;
        const momentumZ = computeMomentumScore(
          {
            w10: hitsW10,
            w20: hitsW20,
            w50: hitsW50,
            w100: hitsW100,
            w150: hitsW150,
          },
          maxNum
        );
        const hazardScore = computeSurvivalHazardScore(skipGap, maxNum);
        stats.push({
          ball: b,
          gameType,
          hitsW10,
          hitsW20,
          hitsW50,
          hitsW100,
          hitsW150,
          hitsAllTime,
          skipGap,
          momentumZ,
          hazardScore,
          regime: "NEUTRAL",
        });
      }
    }
  }

  return stats;
}

/**
 * Generate Laplace-smoothed Pairwise Co-Occurrence Lift L_{i,j} between two balls
 */
export function getPairwiseAffinityLift(
  ballA: number,
  ballB: number,
  gameType: GameType
): number {
  if (ballA === ballB) return 1.0;
  const i = Math.min(ballA, ballB);
  const j = Math.max(ballA, ballB);
  const draws =
    gameType === "6/55" ? POWER_655_SEED_DRAWS : MEGA_645_SEED_DRAWS;
  const cfg = GAME_CONFIGS[gameType];

  let coCount = 0;
  for (const d of draws) {
    if (d.numbers.includes(i) && d.numbers.includes(j)) {
      coCount += 1;
    }
  }
  const hotSet = new Set(cfg.hotPool.slice(0, 12));
  const bonusLift = hotSet.has(i) && hotSet.has(j) ? 0.18 : 0.0;
  const expected = draws.length * (30 / (cfg.maxNum * (cfg.maxNum - 1)));
  const lift = (coCount + 1) / (expected + 1) + bonusLift;
  return Number(lift.toFixed(3));
}

/**
 * Generate Gaussian Sum Distribution Bell Curve points for Recharts
 * Mega 6/45: Mean = 138.0, SD = 29.95, 70% corridor = [106, 170]
 * Power 6/55: Mean = 168.0, SD = 37.04, 70% corridor = [129, 207]
 */
export function generateGaussianBellCurveData() {
  const points: Array<{
    sum: number;
    megaDensityPct: number;
    powerDensityPct: number;
    megaCorePct: number | null;
    powerCorePct: number | null;
  }> = [];

  const mu45 = 138.0;
  const sd45 = 29.95;
  const mu55 = 168.0;
  const sd55 = 37.04;

  for (let s = 30; s <= 300; s += 5) {
    const z45 = (s - mu45) / sd45;
    const pdf45 =
      s <= 255
        ? (1 / (sd45 * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z45 * z45) * 100
        : 0;

    const z55 = (s - mu55) / sd55;
    const pdf55 =
      (1 / (sd55 * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z55 * z55) * 100;

    const megaDensityPct = Number(pdf45.toFixed(3));
    const powerDensityPct = Number(pdf55.toFixed(3));

    points.push({
      sum: s,
      megaDensityPct,
      powerDensityPct,
      megaCorePct: s >= 106 && s <= 170 ? megaDensityPct : null,
      powerCorePct: s >= 129 && s <= 207 ? powerDensityPct : null,
    });
  }

  return points;
}

/**
 * Parse raw NDJSON string from vietvudanh/vietlott-data into HistoricalDraw items
 */
export function parseNDJsonDraws(
  ndjsonText: string,
  gameType: GameType,
  limit = 25
): HistoricalDraw[] {
  const lines = ndjsonText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const recentLines = lines.slice(-limit);
  const mid = gameType === "6/55" ? 27 : 22;
  const parsed: HistoricalDraw[] = [];

  for (const line of recentLines) {
    try {
      const obj = JSON.parse(line);
      if (!obj || !Array.isArray(obj.result) || obj.result.length < 6) continue;
      const rawNums = obj.result.map((n: string | number) => Number(n));
      const mainNums = rawNums.slice(0, 6).sort((a: number, b: number) => a - b);
      const bonus =
        gameType === "6/55" && rawNums.length >= 7 ? rawNums[6] : undefined;
      const sum = mainNums.reduce((acc: number, v: number) => acc + v, 0);
      const odds = mainNums.filter((n: number) => n % 2 !== 0).length;
      const lows = mainNums.filter((n: number) => n <= mid).length;
      let consecPairs = 0;
      for (let i = 0; i < 5; i++) {
        if (mainNums[i + 1] - mainNums[i] === 1) consecPairs++;
      }

      const dObj = new Date(`${obj.date}T00:00:00+07:00`);
      const weekday = dObj.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "Asia/Ho_Chi_Minh",
      });

      parsed.push({
        id: String(obj.id).padStart(5, "0"),
        date: String(obj.date),
        weekday,
        gameType,
        numbers: mainNums,
        bonus,
        sum,
        oddEven: `${odds}O-${6 - odds}E`,
        lowHigh: `${lows}L-${6 - lows}H`,
        consecPairs,
        jackpot1Vnd:
          gameType === "6/55" ? 164_048_997_900 : 26_444_954_000,
        jackpot2Vnd: gameType === "6/55" ? 3_816_405_550 : undefined,
        jp1Winners: 0,
        jp2Winners: 0,
      });
    } catch {
      // Ignore malformed line
    }
  }
  return parsed.reverse();
}

/**
 * Get Indochina Time (Asia/Ho_Chi_Minh, UTC+7) parts and countdown to 17:30 cutoff / 18:00 draw
 */
export function getICTTelemetryClock(now: Date = new Date()) {
  const ictFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = ictFormatter.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  const hour = Number(map.hour === "24" ? "0" : map.hour);
  const minute = Number(map.minute);
  const second = Number(map.second);
  const weekday = map.weekday || "Tuesday";

  const isoDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;

  const isMonday = weekday === "Monday";
  const isPowerDay =
    weekday === "Tuesday" || weekday === "Thursday" || weekday === "Saturday";
  const activeGameToday: GameType | "NO_MATRIX_DRAW" = isMonday
    ? "NO_MATRIX_DRAW"
    : isPowerDay
    ? "6/55"
    : "6/45";

  // Seconds since midnight in ICT
  const currentSec = hour * 3600 + minute * 60 + second;
  const cutoffSec = 17 * 3600 + 30 * 60; // 17:30:00 ICT
  const drawStartSec = 18 * 3600; // 18:00:00 ICT
  const drawEndSec = 18 * 3600 + 30 * 60; // 18:30:00 ICT

  let phase:
    | "REST_DAY_MONDAY"
    | "TICKET_SALES_OPEN"
    | "SALES_CLOSED_PRE_DRAW"
    | "LIVE_DRAW_BROADCAST"
    | "POST_DRAW_SETTLED" = "TICKET_SALES_OPEN";

  let secondsToCutoff = 0;
  let secondsToDraw = 0;

  if (isMonday) {
    phase = "REST_DAY_MONDAY";
    // Next cutoff is Tuesday 17:30 ICT
    secondsToCutoff = 24 * 3600 - currentSec + cutoffSec;
    secondsToDraw = 24 * 3600 - currentSec + drawStartSec;
  } else if (currentSec < cutoffSec) {
    phase = "TICKET_SALES_OPEN";
    secondsToCutoff = cutoffSec - currentSec;
    secondsToDraw = drawStartSec - currentSec;
  } else if (currentSec < drawStartSec) {
    phase = "SALES_CLOSED_PRE_DRAW";
    secondsToCutoff = 0;
    secondsToDraw = drawStartSec - currentSec;
  } else if (currentSec <= drawEndSec) {
    phase = "LIVE_DRAW_BROADCAST";
    secondsToCutoff = 0;
    secondsToDraw = 0;
  } else {
    phase = "POST_DRAW_SETTLED";
    // Next active day (if Sunday after 18:30, next active matrix draw is Tuesday 17:30!)
    const extraDays = weekday === "Sunday" ? 2 : 1;
    secondsToCutoff = extraDays * 24 * 3600 - currentSec + cutoffSec;
    secondsToDraw = extraDays * 24 * 3600 - currentSec + drawStartSec;
  }

  const formatDuration = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  };

  return {
    isoDate,
    weekday,
    timeString,
    isMonday,
    activeGameToday,
    phase,
    secondsToCutoff,
    secondsToDraw,
    cutoffCountdownFormatted: formatDuration(secondsToCutoff),
    drawCountdownFormatted: formatDuration(secondsToDraw),
  };
}

/**
 * Dynamically recalibrate GameConfig for a target date using all completed draws strictly prior to targetDateStr.
 * Whenever a new draw completes (after 18:30 ICT) and is synced from Tier 1 Cloud NDJSON or added by the user,
 * this function updates latestDrawId, recentDrawsTop2 (Gate 6), hotPool/hotWeights (Momentum), and coldOverduePool (Skip-Gap),
 * automatically re-synthesizing upcoming predictions day-by-day.
 */
export function buildDynamicGameConfigForDate(
  gameType: GameType,
  targetDateStr: string,
  liveDraws?: HistoricalDraw[]
): GameConfig {
  const baseCfg = GAME_CONFIGS[gameType];
  const seedDraws =
    gameType === "6/55" ? POWER_655_SEED_DRAWS : MEGA_645_SEED_DRAWS;
  const sourceDraws =
    liveDraws && liveDraws.length > 0 ? liveDraws : seedDraws;

  // Filter strictly causal completed draws before targetDateStr (sorted newest-first)
  const priorDraws = [...sourceDraws]
    .filter((d) => d.date < targetDateStr)
    .sort((a, b) => b.date.localeCompare(a.date));

  if (priorDraws.length === 0) {
    return baseCfg;
  }

  const newestDraw = priorDraws[0];
  const secondDraw = priorDraws[1] ?? priorDraws[0];

  // If newestDraw matches the canonical October 2026 baseline (#01412 or #01577), keep exact calibrated pools
  if (newestDraw.id === baseCfg.latestDrawId && priorDraws.length <= seedDraws.length) {
    return {
      ...baseCfg,
      latestDrawId: newestDraw.id,
      latestDrawDate: newestDraw.date,
      recentDrawsTop2: [newestDraw.numbers, secondDraw.numbers],
    };
  }

  // Otherwise dynamically recompute Multi-Horizon Momentum & Skip-Gap Hazard across priorDraws!
  const maxNum = baseCfg.maxNum;
  const ballScores: Array<{
    ball: number;
    momentumWeight: number;
    hazardScore: number;
  }> = [];

  for (let b = 1; b <= maxNum; b++) {
    const countInWindow = (w: number) =>
      priorDraws
        .slice(0, w)
        .filter((d) => d.numbers.includes(b)).length;

    const hits = {
      w10: countInWindow(10),
      w20: countInWindow(20),
      w50: countInWindow(50),
      w100: countInWindow(100),
      w150: countInWindow(150),
    };

    // Find current skip streak g_i
    let skipGap = priorDraws.length;
    for (let idx = 0; idx < priorDraws.length; idx++) {
      if (priorDraws[idx].numbers.includes(b)) {
        skipGap = idx;
        break;
      }
    }

    const mZ = computeMomentumScore(hits, maxNum);
    const rScore = computeSurvivalHazardScore(skipGap, maxNum);
    const baseIdx = baseCfg.hotPool.indexOf(b);
    const priorWeight =
      baseIdx >= 0 ? baseCfg.hotWeights[baseIdx] : gameType === "6/55" ? 154 : 20;

    ballScores.push({
      ball: b,
      momentumWeight: Math.max(10, Math.round(priorWeight + mZ * 12)),
      hazardScore: rScore + (skipGap >= 6 ? 0.25 : 0),
    });
  }

  const sortedHot = [...ballScores]
    .sort((a, b) => b.momentumWeight - a.momentumWeight)
    .slice(0, 22);
  const sortedCold = [...ballScores]
    .sort((a, b) => b.hazardScore - a.hazardScore)
    .slice(0, 12);

  return {
    ...baseCfg,
    latestDrawId: newestDraw.id,
    latestDrawDate: newestDraw.date,
    nextDrawId: String(Number(newestDraw.id) + 1).padStart(5, "0"),
    hotPool: sortedHot.map((x) => x.ball),
    hotWeights: sortedHot.map((x) => x.momentumWeight),
    coldOverduePool: sortedCold.map((x) => x.ball),
    recentDrawsTop2: [newestDraw.numbers, secondDraw.numbers],
  };
}

export {
  GAME_CONFIGS,
  POWER_655_SEED_DRAWS,
  MEGA_645_SEED_DRAWS,
  POWER_655_FREQUENCY_LEADERS,
  MEGA_645_TELEMETRY_LEADERS,
  MACRO_PARITY_DISTRIBUTION,
  CONSECUTIVE_PAIR_INCIDENCE,
};
export type { GameConfig, GameType, HistoricalDraw, BallTelemetryStat };
