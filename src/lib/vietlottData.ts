import {
  BallTelemetryStat,
  CONSECUTIVE_PAIR_INCIDENCE,
  GAME_CONFIGS,
  GameConfig,
  GameType,
  HistoricalDraw,
  LearnedFactorWeights,
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

export interface LiveJackpotScrapeResult {
  gameType: GameType;
  drawId?: string;
  jackpot1Vnd?: number;
  jackpot2Vnd?: number;
  jp1Winners?: number;
  jp2Winners?: number;
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
  minhNgocPower655:
    "https://www.minhngoc.net.vn/ket-qua-xo-so/dien-toan-vietlott/power-6x55.html",
  minhNgocMega645:
    "https://www.minhngoc.net.vn/ket-qua-xo-so/dien-toan-vietlott/mega-6x45.html",
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
 * Format VND currency in full or compact Billions ("B VND") / Millions ("M VND")
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
 * Generate full 45-ball or 55-ball telemetry dataset.
 * When `customDraws` contains >= 150 draws (from live synced NDJSON), computes 100% live
 * empirical W10, W20, W50, W100, W150, All-Time hits, and Lô Gan skip-gap streaks directly
 * from the draw stream. Otherwise falls back to Tier 2 October 2026 calibrated leaders.
 */
export function getFullBallTelemetry(
  gameType: GameType,
  customDraws?: HistoricalDraw[]
): BallTelemetryStat[] {
  const cfg = GAME_CONFIGS[gameType];
  const maxNum = cfg.maxNum;
  const stats: BallTelemetryStat[] = [];

  if (customDraws && customDraws.length >= 150) {
    const sortedDraws = [...customDraws].sort((a, b) =>
      b.date.localeCompare(a.date)
    );
    const totalDraws = sortedDraws.length;

    for (let b = 1; b <= maxNum; b++) {
      let hitsW10 = 0;
      let hitsW20 = 0;
      let hitsW50 = 0;
      let hitsW100 = 0;
      let hitsW150 = 0;
      let hitsAllTime = 0;
      let skipGap = totalDraws;
      let foundFirst = false;

      for (let idx = 0; idx < totalDraws; idx++) {
        const hit = sortedDraws[idx].numbers.includes(b);
        if (hit) {
          hitsAllTime++;
          if (idx < 10) hitsW10++;
          if (idx < 20) hitsW20++;
          if (idx < 50) hitsW50++;
          if (idx < 100) hitsW100++;
          if (idx < 150) hitsW150++;
          if (!foundFirst) {
            skipGap = idx;
            foundFirst = true;
          }
        }
      }

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
      const overdueCutoff = gameType === "6/55" ? 13 : 11;
      const regime: BallTelemetryStat["regime"] =
        skipGap >= overdueCutoff
          ? "OVERDUE"
          : momentumZ >= 0.65
          ? "HOT"
          : momentumZ <= -0.65
          ? "COLD"
          : "NEUTRAL";

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
        regime,
        note: `Live #${sortedDraws[0]?.id}: ${hitsAllTime} all-time • ${hitsW150} in 150d • Skip=${skipGap}`,
      });
    }

    return stats;
  }

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
        const hitsW150 = 18 + ((b * 5) % 4);
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
 * Dynamically uses `customDraws` (most recent 150 draws) and `customConfig` when supplied.
 */
export function getPairwiseAffinityLift(
  ballA: number,
  ballB: number,
  gameType: GameType,
  customDraws?: HistoricalDraw[],
  customConfig?: GameConfig
): number {
  if (ballA === ballB) return 1.0;
  const i = Math.min(ballA, ballB);
  const j = Math.max(ballA, ballB);
  const fallbackDraws =
    gameType === "6/55" ? POWER_655_SEED_DRAWS : MEGA_645_SEED_DRAWS;
  const rawDraws =
    customDraws && customDraws.length > 0 ? customDraws : fallbackDraws;
  const draws = rawDraws.slice(0, 150);
  const cfg = customConfig ?? GAME_CONFIGS[gameType];

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
 * Parse live Minh Ngoc Vietlott HTML page for the latest Jackpot VND amounts and winner counts
 */
export function parseMinhNgocJackpots(
  html: string,
  gameType: GameType
): LiveJackpotScrapeResult {
  const parseDigits = (raw?: string): number | undefined => {
    if (!raw) return undefined;
    const digits = raw.replace(/[^0-9]/g, "");
    if (!digits) return undefined;
    const val = Number(digits);
    return Number.isFinite(val) && val > 0 ? val : undefined;
  };

  if (gameType === "6/55") {
    const idMatch = html.match(/id="DT6X55_KY_VE"[^>]*>\s*#?(\d+)/i);
    const jp1Match = html.match(/id="DT6X55_G_JACKPOT"[^>]*>\s*([0-9.,]+)/i);
    const jp2Match = html.match(/id="DT6X55_G_JACKPOT2"[^>]*>\s*([0-9.,]+)/i);
    const w1Match = html.match(/id="DT6X55_S_JACKPOT"[^>]*>\s*(\d+)/i);
    const w2Match = html.match(/id="DT6X55_S_JACKPOT2"[^>]*>\s*(\d+)/i);

    return {
      gameType,
      drawId: idMatch?.[1] ? String(idMatch[1]).padStart(5, "0") : undefined,
      jackpot1Vnd: parseDigits(jp1Match?.[1]),
      jackpot2Vnd: parseDigits(jp2Match?.[1]),
      jp1Winners: w1Match?.[1] !== undefined ? Number(w1Match[1]) : undefined,
      jp2Winners: w2Match?.[1] !== undefined ? Number(w2Match[1]) : undefined,
    };
  } else {
    const idMatch = html.match(/id="DT6X45_KY_VE"[^>]*>\s*#?(\d+)/i);
    const jp1Match = html.match(/id="DT6X45_G_JACKPOT"[^>]*>\s*([0-9.,]+)/i);
    const w1Match = html.match(/id="DT6X45_S_JACKPOT"[^>]*>\s*(\d+)/i);

    return {
      gameType,
      drawId: idMatch?.[1] ? String(idMatch[1]).padStart(5, "0") : undefined,
      jackpot1Vnd: parseDigits(jp1Match?.[1]),
      jp1Winners: w1Match?.[1] !== undefined ? Number(w1Match[1]) : undefined,
    };
  }
}

/**
 * Parse raw NDJSON string from vietvudanh/vietlott-data into HistoricalDraw items.
 * Defaults to parsing up to 2500 lines (entire 2016–2026+ history) and enriches known draws
 * with verified jackpot pools and winner counts, while estimating progressive rollover jackpots
 * for any newly arrived draws beyond the seed table.
 */
export function parseNDJsonDraws(
  ndjsonText: string,
  gameType: GameType,
  limit = 2500,
  liveJackpotOverride?: LiveJackpotScrapeResult
): HistoricalDraw[] {
  const lines = ndjsonText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const recentLines = lines.slice(-limit);
  const mid = gameType === "6/55" ? 27 : 22;
  const seedDraws =
    gameType === "6/55" ? POWER_655_SEED_DRAWS : MEGA_645_SEED_DRAWS;
  const seedMap = new Map(seedDraws.map((d) => [d.id, d]));

  const parsedChronological: HistoricalDraw[] = [];
  let rollingJp1 =
    gameType === "6/55" ? 31_758_267_450 : 16_103_186_000;
  let rollingJp2 = gameType === "6/55" ? 4_432_627_250 : undefined;

  for (const line of recentLines) {
    try {
      const obj = JSON.parse(line);
      if (!obj || !Array.isArray(obj.result) || obj.result.length < 6) continue;
      const drawId = String(obj.id).padStart(5, "0");
      const knownSeed = seedMap.get(drawId);

      const rawNums = obj.result.map((n: string | number) => Number(n));
      const mainNums = rawNums.slice(0, 6).sort((a: number, b: number) => a - b);
      const bonus =
        gameType === "6/55" && rawNums.length >= 7 ? rawNums[6] : undefined;
      const sum = mainNums.reduce((acc: number, v: number) => acc + v, 0);
      const odds = mainNums.filter((n: number) => n % 2 !== 0).length;
      const lows = mainNums.filter((n: number) => n <= mid).length;
      let consecPairs = 0;
      const consecList: string[] = [];
      for (let i = 0; i < 5; i++) {
        if (mainNums[i + 1] - mainNums[i] === 1) {
          consecPairs++;
          consecList.push(
            `${String(mainNums[i]).padStart(2, "0")}-${String(mainNums[i + 1]).padStart(2, "0")}`
          );
        }
      }

      const dObj = new Date(`${obj.date}T00:00:00+07:00`);
      const weekday = dObj.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "Asia/Ho_Chi_Minh",
      });

      let jackpot1Vnd = knownSeed?.jackpot1Vnd;
      let jackpot2Vnd = knownSeed?.jackpot2Vnd;
      let jp1Winners = knownSeed?.jp1Winners ?? 0;
      let jp2Winners = knownSeed?.jp2Winners ?? 0;
      let isJackpotWon = knownSeed?.isJackpotWon;

      if (jackpot1Vnd !== undefined) {
        // Update rolling state from verified seed draw
        rollingJp1 =
          jp1Winners > 0
            ? gameType === "6/55"
              ? 30_000_000_000
              : 12_000_000_000
            : jackpot1Vnd;
        if (gameType === "6/55") {
          rollingJp2 =
            jp2Winners > 0
              ? 3_000_000_000
              : jackpot2Vnd ?? 3_500_000_000;
        }
      } else {
        // Estimate progressive rollover for draws newer than the seed table
        if (Number(drawId) > Number(seedDraws[0]?.id ?? "0")) {
          rollingJp1 += gameType === "6/55" ? 9_800_000_000 : 2_350_000_000;
          if (gameType === "6/55" && rollingJp2 !== undefined) {
            rollingJp2 += 650_000_000;
          }
          jackpot1Vnd = rollingJp1;
          jackpot2Vnd = rollingJp2;
        } else {
          jackpot1Vnd =
            gameType === "6/55" ? 55_000_000_000 : 20_000_000_000;
          jackpot2Vnd = gameType === "6/55" ? 3_500_000_000 : undefined;
        }
      }

      // Apply live scraped jackpot override if matching drawId
      if (
        liveJackpotOverride &&
        liveJackpotOverride.drawId === drawId &&
        liveJackpotOverride.jackpot1Vnd
      ) {
        jackpot1Vnd = liveJackpotOverride.jackpot1Vnd;
        if (liveJackpotOverride.jackpot2Vnd) {
          jackpot2Vnd = liveJackpotOverride.jackpot2Vnd;
        }
        if (liveJackpotOverride.jp1Winners !== undefined) {
          jp1Winners = liveJackpotOverride.jp1Winners;
          isJackpotWon = jp1Winners > 0;
        }
        if (liveJackpotOverride.jp2Winners !== undefined) {
          jp2Winners = liveJackpotOverride.jp2Winners;
        }
      }

      parsedChronological.push({
        id: drawId,
        date: String(obj.date),
        weekday,
        gameType,
        numbers: mainNums,
        bonus,
        sum,
        oddEven: `${odds}O-${6 - odds}E`,
        lowHigh: `${lows}L-${6 - lows}H`,
        consecPairs,
        consecDetail: consecList.length > 0 ? consecList.join(", ") : undefined,
        jackpot1Vnd,
        jackpot2Vnd,
        jp1Winners,
        jp2Winners,
        isJackpotWon,
      });
    } catch {
      // Ignore malformed line
    }
  }

  // If liveJackpotOverride is for the latest draw in parsedChronological (even if drawId wasn't matched)
  if (
    parsedChronological.length > 0 &&
    liveJackpotOverride &&
    liveJackpotOverride.jackpot1Vnd
  ) {
    const newest = parsedChronological[parsedChronological.length - 1];
    if (
      !liveJackpotOverride.drawId ||
      liveJackpotOverride.drawId === newest.id
    ) {
      newest.jackpot1Vnd = liveJackpotOverride.jackpot1Vnd;
      if (liveJackpotOverride.jackpot2Vnd) {
        newest.jackpot2Vnd = liveJackpotOverride.jackpot2Vnd;
      }
      if (liveJackpotOverride.jp1Winners !== undefined) {
        newest.jp1Winners = liveJackpotOverride.jp1Winners;
        newest.isJackpotWon = liveJackpotOverride.jp1Winners > 0;
      }
      if (liveJackpotOverride.jp2Winners !== undefined) {
        newest.jp2Winners = liveJackpotOverride.jp2Winners;
      }
    }
  }

  return parsedChronological.reverse();
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
 * Compute 6 normalized quantitative signals in [0, 1] for all balls 1..maxNum
 * given a strictly causal historical slice `historySlice` (sorted newest-first).
 */
function computeCausalSignalsForSlice(
  historySlice: HistoricalDraw[],
  maxNum: number,
  baseCfg: GameConfig
): Array<{
  ball: number;
  shortSurge: number;
  lagRepeat: number;
  companionLift: number;
  multiHorizon: number;
  survivalRebound: number;
  neighborMagnet: number;
  skipGap: number;
}> {
  const d0 = historySlice[0]?.numbers ?? [];
  const d1 = historySlice[1]?.numbers ?? [];
  const d2 = historySlice[2]?.numbers ?? [];
  const b0 = historySlice[0]?.bonus;
  const b1 = historySlice[1]?.bonus;
  const set0 = new Set(d0);
  const set1 = new Set(d1);
  const set2 = new Set(d2);
  const recentUnion = new Set([...d0, ...d1]);
  const window120 = historySlice.slice(0, 120);

  const rawSignals = [];
  for (let b = 1; b <= maxNum; b++) {
    // 1. Short-Window W5 & W10 Exponential Surge (includes Power 6/55 Bonus Ball appearances for 6-number JP2 & main crossover)
    let expSurge = 0;
    const w10Len = Math.min(10, historySlice.length);
    for (let j = 0; j < w10Len; j++) {
      if (historySlice[j].numbers.includes(b)) {
        expSurge += Math.pow(0.82, j);
      } else if (historySlice[j].bonus === b) {
        expSurge += 0.55 * Math.pow(0.82, j);
      }
    }
    const shortSurge = Math.min(1, expSurge / 2.2);

    // 2. Lag-1, Lag-2 & Lag-3 Repeat Carryover Signal (plus Bonus->Main transition carryover on Power 6/55)
    let lagRepeat = 0;
    if (set0.has(b)) lagRepeat += 0.55;
    if (b0 === b) lagRepeat += 0.42;
    if (set1.has(b)) lagRepeat += 0.68;
    if (b1 === b) lagRepeat += 0.38;
    if (set2.has(b)) lagRepeat += 0.32;
    lagRepeat = Math.min(1, lagRepeat);

    // 3. Companion Co-Occurrence Lift with numbers from the last 2 draws
    let coHits = 0;
    let anchorDraws = 0;
    for (const d of window120) {
      const sharesAnchor = d.numbers.some((x) => recentUnion.has(x));
      if (sharesAnchor) {
        anchorDraws++;
        if (d.numbers.includes(b)) coHits++;
      }
    }
    const companionLift =
      anchorDraws > 0
        ? Math.min(1, (coHits / anchorDraws) / (6 / maxNum) / 2.2)
        : 0.4;

    // 4. Multi-Horizon Momentum (W10, W20, W50, W100, W150)
    const countW = (w: number) =>
      historySlice.slice(0, w).filter((d) => d.numbers.includes(b)).length;
    const hits = {
      w10: countW(10),
      w20: countW(20),
      w50: countW(50),
      w100: countW(100),
      w150: countW(150),
    };
    const mZ = computeMomentumScore(hits, maxNum);
    const baseIdx = baseCfg.hotPool.indexOf(b);
    const baseBonus = baseIdx >= 0 ? (22 - baseIdx) / 44 : 0;
    const multiHorizon = Math.max(
      0,
      Math.min(1, 0.45 + mZ * 0.18 + baseBonus * 0.25)
    );

    // 5. Survival Hazard Rebound (Damped Log-Normal + Rested Hot-Ball Rebound)
    let skipGap = historySlice.length;
    for (let idx = 0; idx < historySlice.length; idx++) {
      if (historySlice[idx].numbers.includes(b)) {
        skipGap = idx;
        break;
      }
    }
    const rScore = computeSurvivalHazardScore(skipGap, maxNum);
    const restedHotBonus =
      skipGap >= 2 && skipGap <= 6 && (hits.w20 >= 3 || baseIdx >= 0 && baseIdx < 12)
        ? 0.28
        : 0;
    const survivalRebound = Math.min(1, rScore / 1.35 + restedHotBonus);

    // 6. Neighbor ±1 Shift Magnet (captures adjacent step transitions e.g. 27->28->29, 40->41)
    let neighborMagnet = 0;
    if (set0.has(b - 1) || set0.has(b + 1)) neighborMagnet += 0.58;
    if (set1.has(b - 1) || set1.has(b + 1)) neighborMagnet += 0.42;
    neighborMagnet = Math.min(1, neighborMagnet);

    rawSignals.push({
      ball: b,
      shortSurge,
      lagRepeat,
      companionLift,
      multiHorizon,
      survivalRebound,
      neighborMagnet,
      skipGap,
    });
  }

  return rawSignals;
}

/**
 * Dynamically recalibrate GameConfig for a target date using all completed draws strictly prior to targetDateStr.
 * Runs an Online Multiplicative-Weights Walk-Forward Learner (Hedge / Exp3) over the most recent completed draws
 * so that factor weights (Short Surge, Lag-1/2 Repeat, Companion Lift, Multi-Horizon Momentum, Survival Rebound,
 * Neighbor Magnet) self-optimize automatically as every new draw settles.
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

  // Compute live currentJackpot1Vnd and currentJackpot2Vnd from newestDraw
  let currentJackpot1Vnd = newestDraw.jackpot1Vnd || baseCfg.currentJackpot1Vnd;
  if (
    newestDraw.jp1Winners &&
    newestDraw.jp1Winners > 0 &&
    currentJackpot1Vnd > baseCfg.minJackpot1Vnd * 1.3
  ) {
    currentJackpot1Vnd = baseCfg.minJackpot1Vnd;
  }

  let currentJackpot2Vnd =
    gameType === "6/55"
      ? newestDraw.jackpot2Vnd ?? baseCfg.currentJackpot2Vnd ?? 3_000_000_000
      : undefined;
  if (
    gameType === "6/55" &&
    newestDraw.jp2Winners &&
    newestDraw.jp2Winners > 0 &&
    currentJackpot2Vnd &&
    currentJackpot2Vnd > 3_500_000_000
  ) {
    currentJackpot2Vnd = 3_000_000_000;
  }

  const seedMultiplier = Number(
    (currentJackpot1Vnd / baseCfg.minJackpot1Vnd).toFixed(2)
  );

  // =========================================================================
  // ONLINE WALK-FORWARD MULTIPLICATIVE-WEIGHTS LEARNER (Hedge / Exp3)
  // Evaluates the 6 sub-models across the most recent completed draws and updates
  // factor weights proportionally to out-of-sample hit performance.
  // =========================================================================
  const maxNum = baseCfg.maxNum;
  const weights: LearnedFactorWeights = {
    shortSurge: 0.22,
    lagRepeat: 0.22,
    companionLift: 0.16,
    multiHorizon: 0.16,
    survivalRebound: 0.12,
    neighborMagnet: 0.12,
  };

  const walkForwardSteps = Math.min(18, Math.max(0, priorDraws.length - 4));
  const learningRate = 0.35;
  const effectiveTargetBalls = gameType === "6/55" ? 6.5 : 6;
  const expectedTop14Hits = (effectiveTargetBalls * 14) / maxNum;

  for (let step = walkForwardSteps; step >= 1; step--) {
    const targetDraw = priorDraws[step - 1];
    const targetOutcome = new Set(targetDraw.numbers);
    const targetBonus = targetDraw.bonus;
    const historyAtStep = priorDraws.slice(step);
    const sigs = computeCausalSignalsForSlice(historyAtStep, maxNum, baseCfg);

    const factorKeys: Array<keyof LearnedFactorWeights> = [
      "shortSurge",
      "lagRepeat",
      "companionLift",
      "multiHorizon",
      "survivalRebound",
      "neighborMagnet",
    ];

    // Recency emphasis: more recent draws carry higher learning weight
    const recencyMultiplier = Math.pow(0.92, step - 1);

    for (const key of factorKeys) {
      const top14 = [...sigs]
        .sort((a, b) => b[key] - a[key] || a.ball - b.ball)
        .slice(0, 14);
      const mainHits = top14.filter((item) =>
        targetOutcome.has(item.ball)
      ).length;
      const bonusHit =
        targetBonus !== undefined &&
        top14.some((item) => item.ball === targetBonus)
          ? 0.5
          : 0;
      const hitsCount = mainHits + bonusHit;
      const advantage = (hitsCount - expectedTop14Hits) / 6;
      weights[key] =
        weights[key] *
        Math.exp(learningRate * recencyMultiplier * advantage);
    }

    // Normalize weight vector to sum to 1.0
    const wSum = Object.values(weights).reduce((acc, v) => acc + v, 0);
    if (wSum > 0) {
      for (const key of factorKeys) {
        weights[key] = Number((weights[key] / wSum).toFixed(4));
      }
    }
  }

  // Compute current causal signals on full priorDraws using the self-learned weights
  const currentSignals = computeCausalSignalsForSlice(
    priorDraws,
    maxNum,
    baseCfg
  );

  const ballScores: Array<{
    ball: number;
    convictionWeight: number;
    hazardScore: number;
  }> = [];
  const allBallConvictionMap: Record<number, number> = {};

  for (const sig of currentSignals) {
    const compositeScore =
      weights.shortSurge * sig.shortSurge +
      weights.lagRepeat * sig.lagRepeat +
      weights.companionLift * sig.companionLift +
      weights.multiHorizon * sig.multiHorizon +
      weights.survivalRebound * sig.survivalRebound +
      weights.neighborMagnet * sig.neighborMagnet;

    // Scale conviction weight into [25 .. 260] so weighted sampling strongly favors high-conviction numbers
    const convictionWeight = Math.max(
      25,
      Math.round(30 + Math.pow(compositeScore, 1.35) * 280)
    );
    allBallConvictionMap[sig.ball] = convictionWeight;

    const rScore = computeSurvivalHazardScore(sig.skipGap, maxNum);
    ballScores.push({
      ball: sig.ball,
      convictionWeight,
      hazardScore:
        rScore + (sig.skipGap >= 7 ? 0.35 : 0) + sig.survivalRebound * 0.4,
    });
  }

  const sortedHot = [...ballScores]
    .sort((a, b) => b.convictionWeight - a.convictionWeight || a.ball - b.ball)
    .slice(0, 22);
  const sortedCold = [...ballScores]
    .sort((a, b) => b.hazardScore - a.hazardScore || a.ball - b.ball)
    .slice(0, 12);

  // Master 14-Ball Core Pool for t=3 Abbreviated Combinatorial Wheeling
  const masterCorePool = sortedHot.slice(0, 14).map((x) => x.ball);

  return {
    ...baseCfg,
    latestDrawId: newestDraw.id,
    latestDrawDate: newestDraw.date,
    nextDrawId: String(Number(newestDraw.id) + 1).padStart(5, "0"),
    currentJackpot1Vnd,
    currentJackpot2Vnd,
    seedMultiplier,
    hotPool: sortedHot.map((x) => x.ball),
    hotWeights: sortedHot.map((x) => x.convictionWeight),
    coldOverduePool: sortedCold.map((x) => x.ball),
    recentDrawsTop2: [newestDraw.numbers, secondDraw.numbers],
    masterCorePool,
    allBallConvictionMap,
    learnedWeights: weights,
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
export type {
  GameConfig,
  GameType,
  HistoricalDraw,
  BallTelemetryStat,
  LearnedFactorWeights,
};
