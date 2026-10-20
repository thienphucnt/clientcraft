import {
  GAME_CONFIGS,
  GameConfig,
  GameType,
} from "@/data/empiricalSeed2026";
import {
  calculateNetPayout,
  getPairwiseAffinityLift,
} from "@/lib/vietlottData";

export type StrategyCode =
  | "HOT_MOMENTUM"
  | "COLD_REBOUND"
  | "DELTA_SYSTEM"
  | "GOLDEN_EQUILIBRIUM"
  | "ANTI_SPLIT_EV";

export interface SieveGateResult {
  gateNumber: number;
  gateId: string;
  name: string;
  passed: boolean;
  actualValue: string;
  expectedRule: string;
  detail: string;
}

export interface SieveInspectionReport {
  gameType: GameType;
  numbers: number[];
  isValidInput: boolean;
  inputError?: string;
  passedAllGates: boolean;
  passedCount: number;
  totalGates: 6;
  sum: number;
  meanDiff: number;
  zScore: number;
  oddCount: number;
  evenCount: number;
  oddEvenLabel: string;
  lowCount: number;
  highCount: number;
  lowHighLabel: string;
  consecPairs: number;
  hasTriplet: boolean;
  distinctDecades: number;
  decadesList: number[];
  maxSameLastDigit: number;
  maxCollisionCount: number;
  deltas: number[]; // [x1, x2-x1, x3-x2, x4-x3, x5-x4, x6-x5]
  stepDeltas: number[]; // [x2-x1, x3-x2, x4-x3, x5-x4, x6-x5]
  totalSpread: number; // x6 - x1
  affinityLiftScore: number;
  antiSplitCount: number;
  gates: SieveGateResult[];
}

export interface GeneratedBallot {
  slot: 1 | 2 | 3 | 4 | 5;
  strategyCode: StrategyCode;
  strategyName: string;
  strategyBadge: string;
  strategyDescription: string;
  gameType: GameType;
  targetDate: string; // YYYY-MM-DD
  numbers: number[]; // 6 sorted numbers
  bonusAnchor?: number; // 7th Bao-7 Bonus Anchor for Power 6/55
  deltas: number[]; // [d1, d2, d3, d4, d5, d6]
  stepDeltas: number[]; // [d2, d3, d4, d5, d6]
  totalSpread: number;
  sum: number;
  oddEven: string;
  lowHigh: string;
  distinctDecades: number;
  consecPairs: number;
  affinityLift: number;
  sievePassed: boolean;
  sieveGatesPassed: number;
  seedHash: string;
}

export interface DayScheduleForecast {
  date: string; // YYYY-MM-DD
  weekday: string;
  shortDateLabel: string; // e.g. "Tue, Oct 20"
  isMondayRestDay: boolean;
  gameType: GameType | "NO_MATRIX_DRAW";
  gameName: string;
  estimatedDrawId: string;
  cutoffTimeICT: string;
  broadcastWindowICT: string;
  seedHash: string;
  ballots: GeneratedBallot[];
  concurrentGamesNote: string;
}

export interface RollingScheduleResult {
  anchorDate: string;
  anchorWeekday: string;
  isAnchorMonday: boolean;
  seedSalt: number;
  allHorizonDays: DayScheduleForecast[]; // 8-to-9 calendar days including Monday rest day + following Tuesday
  activeSixDayCycle: DayScheduleForecast[]; // Exactly 6 active draw days (Tue-Sun = 30 ballots)
  extraLookaheadDay?: DayScheduleForecast; // 7th active draw day (following Tuesday = 5 ballots)
  totalWeeklyBallots: number; // 30
  weeklyStandardCostVnd: number; // 300,000 VND
  dailyStandardCostVnd: number; // 50,000 VND
}

/**
 * Deterministic 32-bit FNV-1a / SHA-inspired String Hash
 */
export function hashStringToUint32(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Additional avalanche mixing
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/**
 * Mulberry32 Deterministic Seeded PRNG
 */
export class Mulberry32PRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Returns float in [0, 1) */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Returns k distinct elements sampled without replacement from pool */
  sampleWithoutReplacement<T>(pool: T[], k: number): T[] {
    const copy = [...pool];
    const n = copy.length;
    const count = Math.min(k, n);
    for (let i = 0; i < count; i++) {
      const j = i + Math.floor(this.next() * (n - i));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy.slice(0, count);
  }

  /** Returns k distinct elements using weighted probability without replacement */
  sampleWeightedWithoutReplacement(
    pool: number[],
    weights: number[],
    k: number
  ): number[] {
    const items = pool.map((val, idx) => ({
      val,
      w: Math.max(0.001, weights[idx] ?? 1),
    }));
    const selected: number[] = [];

    for (let step = 0; step < k && items.length > 0; step++) {
      const totalW = items.reduce((acc, item) => acc + item.w, 0);
      let r = this.next() * totalW;
      let chosenIdx = items.length - 1;
      for (let i = 0; i < items.length; i++) {
        r -= items[i].w;
        if (r <= 0) {
          chosenIdx = i;
          break;
        }
      }
      selected.push(items[chosenIdx].val);
      items.splice(chosenIdx, 1);
    }

    return selected.sort((a, b) => a - b);
  }

  /** Shuffles array in-place deterministically and returns it */
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }
}

/**
 * Compute First-Difference Delta Vector [x1, x2-x1, x3-x2, x4-x3, x5-x4, x6-x5]
 */
export function computeDeltas(combo: number[]): number[] {
  const sc = [...combo].sort((a, b) => a - b);
  if (sc.length === 0) return [];
  const deltas = [sc[0]];
  for (let i = 1; i < sc.length; i++) {
    deltas.push(sc[i] - sc[i - 1]);
  }
  return deltas;
}

/**
 * Full 6-Gate Combinatorial Sieve Inspector & Validator
 */
export function inspectCombinatorialSieve(
  combo: number[],
  gameType: GameType,
  options?: {
    allowWideSum?: boolean;
    allowHighSkew?: boolean;
  }
): SieveInspectionReport {
  const cfg: GameConfig = GAME_CONFIGS[gameType];
  const sc = [...combo].sort((a, b) => a - b);

  const uniqueSet = new Set(sc);
  const inRange = sc.every(
    (n) => Number.isInteger(n) && n >= 1 && n <= cfg.maxNum
  );
  const isValidInput = sc.length === 6 && uniqueSet.size === 6 && inRange;

  let inputError: string | undefined;
  if (sc.length !== 6) {
    inputError = `Ballot must contain exactly 6 numbers (currently ${sc.length}).`;
  } else if (uniqueSet.size !== 6) {
    inputError = "All 6 numbers in a ballot must be distinct (no duplicates).";
  } else if (!inRange) {
    inputError = `All numbers must be integers between 01 and ${cfg.maxNum}.`;
  }

  const sum = sc.reduce((acc, n) => acc + n, 0);
  const meanDiff = sum - cfg.meanSum;
  const zScore = Number((meanDiff / cfg.stdDevSum).toFixed(2));

  // Gate 1: Gaussian Sum Corridor
  const [minSum, maxSum] = options?.allowWideSum
    ? cfg.corridor80
    : cfg.corridor70;
  const gate1Passed = isValidInput && sum >= minSum && sum <= maxSum;

  // Gate 2: Odd/Even Parity Equilibrium (2, 3, or 4)
  const oddCount = sc.filter((n) => n % 2 !== 0).length;
  const evenCount = 6 - oddCount;
  const oddEvenLabel = `${oddCount}O-${evenCount}E`;
  const gate2Passed =
    isValidInput && (oddCount === 2 || oddCount === 3 || oddCount === 4);

  // Gate 3: Low/High Half-Space Split
  const lowCount = sc.filter((n) => n <= cfg.midPoint).length;
  const highCount = 6 - lowCount;
  const lowHighLabel = `${lowCount}L-${highCount}H`;
  const validLows = options?.allowHighSkew ? [1, 2, 3, 4] : [2, 3, 4];
  const gate3Passed = isValidInput && validLows.includes(lowCount);

  // Gate 4: Consecutive Adjacency Cap (Max 1 pair, 0 triplets)
  let consecPairs = 0;
  for (let i = 0; i < sc.length - 1; i++) {
    if (sc[i + 1] - sc[i] === 1) consecPairs++;
  }
  let hasTriplet = false;
  for (let i = 0; i < sc.length - 2; i++) {
    if (sc[i + 2] - sc[i] === 2) hasTriplet = true;
  }
  const gate4Passed = isValidInput && consecPairs <= 1 && !hasTriplet;

  // Gate 5: Decade & Modulo-10 Dispersion
  const decadesSet = new Set(sc.map((n) => Math.floor((n - 1) / 10)));
  const distinctDecades = decadesSet.size;
  const mod10Counts = new Map<number, number>();
  for (const n of sc) {
    const d = n % 10;
    mod10Counts.set(d, (mod10Counts.get(d) ?? 0) + 1);
  }
  const maxSameLastDigit = Math.max(0, ...Array.from(mod10Counts.values()));
  const gate5Passed =
    isValidInput && distinctDecades >= 4 && maxSameLastDigit <= 2;

  // Gate 6: Recent Draw Collision Guard (< 4 shared with last 2 draws)
  let maxCollisionCount = 0;
  for (const rDraw of cfg.recentDrawsTop2) {
    const rSet = new Set(rDraw);
    const overlap = sc.filter((n) => rSet.has(n)).length;
    if (overlap > maxCollisionCount) maxCollisionCount = overlap;
  }
  const gate6Passed = isValidInput && maxCollisionCount < 4;

  const deltas = computeDeltas(sc);
  const stepDeltas = deltas.slice(1);
  const totalSpread = sc.length === 6 ? sc[5] - sc[0] : 0;

  // Pairwise Affinity Lift
  let pairLiftSum = 0;
  let pairCount = 0;
  for (let i = 0; i < sc.length; i++) {
    for (let j = i + 1; j < sc.length; j++) {
      pairLiftSum += getPairwiseAffinityLift(sc[i], sc[j], gameType);
      pairCount++;
    }
  }
  const affinityLiftScore =
    pairCount > 0 ? Number((pairLiftSum / pairCount).toFixed(2)) : 1.0;

  const antiSplitCount = sc.filter((n) => n >= cfg.antiSplitCutoff).length;

  const gates: SieveGateResult[] = [
    {
      gateNumber: 1,
      gateId: "SUM_CORRIDOR",
      name: "Gate 1: Gaussian Sum Corridor",
      passed: gate1Passed,
      actualValue: `Σ = ${sum} (${zScore >= 0 ? "+" : ""}${zScore}σ)`,
      expectedRule: `[${minSum}, ${maxSum}] (μ = ${cfg.meanSum})`,
      detail: gate1Passed
        ? `Resides inside the central ${options?.allowWideSum ? "80%" : "70%"} Gaussian probability corridor.`
        : `Sum ${sum} falls in the extreme low-probability tail outside [${minSum}, ${maxSum}].`,
    },
    {
      gateNumber: 2,
      gateId: "ODD_EVEN_PARITY",
      name: "Gate 2: Odd/Even Parity Balance",
      passed: gate2Passed,
      actualValue: oddEvenLabel,
      expectedRule: "2O-4E, 3O-3E, or 4O-2E",
      detail: gate2Passed
        ? `Captures the ${gameType === "6/45" ? "81.31%" : "80.72%"} hypergeometric core triad.`
        : `Extreme parity split (${oddEvenLabel}) resides in the <19% outer tail.`,
    },
    {
      gateNumber: 3,
      gateId: "LOW_HIGH_SPLIT",
      name: "Gate 3: Low/High Half-Space Split",
      passed: gate3Passed,
      actualValue: lowHighLabel,
      expectedRule: `2L-4H, 3L-3H, or 4L-2H (Mid = ${cfg.midPoint})`,
      detail: gate3Passed
        ? `Balanced partition across Low (01–${cfg.midPoint}) and High (${cfg.midPoint + 1}–${cfg.maxNum}).`
        : `Skewed partition (${lowHighLabel}) violates half-space equilibrium.`,
    },
    {
      gateNumber: 4,
      gateId: "CONSECUTIVE_CAP",
      name: "Gate 4: Consecutive Adjacency Cap",
      passed: gate4Passed,
      actualValue: `${consecPairs} pair(s), ${hasTriplet ? "1+ triplet" : "0 triplets"}`,
      expectedRule: "≤ 1 consecutive pair & 0 triplets",
      detail: gate4Passed
        ? "Consecutive spacing matches empirical hypergeometric adjacency."
        : "Excessive adjacent clustering (≥2 pairs or consecutive triplet).",
    },
    {
      gateNumber: 5,
      gateId: "DECADE_MOD10_DISPERSION",
      name: "Gate 5: Decade & Mod-10 Spread",
      passed: gate5Passed,
      actualValue: `${distinctDecades} decades, max ${maxSameLastDigit} same last digit`,
      expectedRule: "≥ 4 decades & ≤ 2 shared terminal digits",
      detail: gate5Passed
        ? "Strong decade coverage and terminal digit dispersion."
        : "Insufficient decade breadth (<4) or terminal digit clustering (>2).",
    },
    {
      gateNumber: 6,
      gateId: "COLLISION_GUARD",
      name: "Gate 6: Recent Draw Collision Guard",
      passed: gate6Passed,
      actualValue: `Max ${maxCollisionCount} overlap with last 2 draws`,
      expectedRule: "< 4 numbers shared with last 2 draws",
      detail: gate6Passed
        ? `Clear of recent draw repetition (#${cfg.latestDrawId}).`
        : `Collides with ≥4 numbers from recent completed draws.`,
    },
  ];

  const passedCount = gates.filter((g) => g.passed).length;

  return {
    gameType,
    numbers: sc,
    isValidInput,
    inputError,
    passedAllGates: isValidInput && passedCount === 6,
    passedCount,
    totalGates: 6,
    sum,
    meanDiff,
    zScore,
    oddCount,
    evenCount,
    oddEvenLabel,
    lowCount,
    highCount,
    lowHighLabel,
    consecPairs,
    hasTriplet,
    distinctDecades,
    decadesList: Array.from(decadesSet).sort((a, b) => a - b),
    maxSameLastDigit,
    maxCollisionCount,
    deltas,
    stepDeltas,
    totalSpread,
    affinityLiftScore,
    antiSplitCount,
    gates,
  };
}

/**
 * Fast boolean 6-Gate Combinatorial Sieve check used by the 5 Strategy Samplers
 */
export function passesCombinatorialSieve(
  combo: number[],
  gameType: GameType,
  options?: {
    allowWideSum?: boolean;
    allowHighSkew?: boolean;
  }
): boolean {
  return inspectCombinatorialSieve(combo, gameType, options).passedAllGates;
}

/**
 * Generate the 5 Orthogonal Strategy Ballots for an active draw day
 */
export function generateDayForecast(
  targetDateStr: string, // YYYY-MM-DD
  seedSalt = 0,
  attenuatedNumbers: Set<number> = new Set()
): DayScheduleForecast {
  const dateObj = new Date(`${targetDateStr}T12:00:00+07:00`);
  const weekday = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const shortDateLabel = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });

  // Check Monday Exclusion Rule
  if (weekday === "Monday") {
    return {
      date: targetDateStr,
      weekday,
      shortDateLabel,
      isMondayRestDay: true,
      gameType: "NO_MATRIX_DRAW",
      gameName: "Monday Matrix Rest Day (No 6/45 or 6/55 Draw)",
      estimatedDrawId: "REST",
      cutoffTimeICT: "N/A",
      broadcastWindowICT: "N/A",
      seedHash: "0xMONDAY00",
      ballots: [],
      concurrentGamesNote:
        "No Mega 6/45 or Power 6/55 draw on Mondays. Concurrent digit games active: Max 3D (18:00), Lotto 5/35 (13:00, 21:00), Keno (06:00–21:55).",
    };
  }

  const isPowerDay =
    weekday === "Tuesday" || weekday === "Thursday" || weekday === "Saturday";
  const gameType: GameType = isPowerDay ? "6/55" : "6/45";
  const cfg = GAME_CONFIGS[gameType];

  // Calculate exact sequential draw ID from latest October 2026 draw date
  const latestAnchorDate = new Date(`${cfg.latestDrawDate}T12:00:00+07:00`);
  const diffDays = Math.round(
    (dateObj.getTime() - latestAnchorDate.getTime()) / (1000 * 3600 * 24)
  );
  let drawStepsAhead = 0;
  if (diffDays > 0) {
    for (let step = 1; step <= diffDays; step++) {
      const checkIso = addDaysISO(cfg.latestDrawDate, step);
      const checkDt = new Date(`${checkIso}T12:00:00+07:00`);
      const checkWk = checkDt.toLocaleDateString("en-US", {
        weekday: "long",
        timeZone: "Asia/Ho_Chi_Minh",
      });
      const isStepPower =
        checkWk === "Tuesday" ||
        checkWk === "Thursday" ||
        checkWk === "Saturday";
      const isStepMega =
        checkWk === "Wednesday" ||
        checkWk === "Friday" ||
        checkWk === "Sunday";
      if (
        (gameType === "6/55" && isStepPower) ||
        (gameType === "6/45" && isStepMega)
      ) {
        drawStepsAhead++;
      }
    }
  }
  const estimatedDrawId = `#${String(
    Number(cfg.latestDrawId) + Math.max(1, drawStepsAhead)
  ).padStart(5, "0")}`;

  // Deterministic Horizon Seed: latestDrawId + YYYY-MM-DD + gameType + seedSalt
  const seedKey = `${cfg.latestDrawId}|${targetDateStr}|${gameType}|${seedSalt}`;
  const seedInt = hashStringToUint32(seedKey);
  const seedHash = `0x${seedInt.toString(16).toUpperCase().padStart(8, "0")}`;
  const rng = new Mulberry32PRNG(seedInt);

  const allNums = Array.from({ length: cfg.maxNum }, (_, idx) => idx + 1);
  const usedSignatures = new Set<string>();
  const ballots: GeneratedBallot[] = [];

  // Apply Markov Virtual-Draw Propagation attenuation (gamma = 0.88) to hot weights
  const adjustedHotWeights = cfg.hotPool.map((ball, idx) => {
    const baseW = cfg.hotWeights[idx] ?? 100;
    return attenuatedNumbers.has(ball) ? baseW * 0.88 : baseW;
  });

  const buildBallotObject = (
    slot: 1 | 2 | 3 | 4 | 5,
    strategyCode: StrategyCode,
    strategyName: string,
    strategyBadge: string,
    strategyDescription: string,
    nums: number[]
  ): GeneratedBallot => {
    const sc = [...nums].sort((a, b) => a - b);
    const report = inspectCombinatorialSieve(sc, gameType, {
      allowWideSum: slot === 5,
    });

    // Select deterministic 7th Bao-7 Bonus Anchor on Power 6/55 days
    let bonusAnchor: number | undefined;
    if (gameType === "6/55") {
      const candidatePool =
        slot === 2
          ? [...cfg.coldOverduePool, ...cfg.hotPool]
          : [...cfg.hotPool, ...cfg.coldOverduePool];
      const remaining = candidatePool.filter((x) => !sc.includes(x));
      bonusAnchor = remaining[(slot * 3 + seedSalt) % remaining.length];
    }

    return {
      slot,
      strategyCode,
      strategyName,
      strategyBadge,
      strategyDescription,
      gameType,
      targetDate: targetDateStr,
      numbers: sc,
      bonusAnchor,
      deltas: report.deltas,
      stepDeltas: report.stepDeltas,
      totalSpread: report.totalSpread,
      sum: report.sum,
      oddEven: report.oddEvenLabel,
      lowHigh: report.lowHighLabel,
      distinctDecades: report.distinctDecades,
      consecPairs: report.consecPairs,
      affinityLift: report.affinityLiftScore,
      sievePassed: report.passedAllGates,
      sieveGatesPassed: report.passedCount,
      seedHash,
    };
  };

  // =========================================================================
  // STRATEGY 1 (HOT_MOMENTUM): Weighted sampling from top-momentum balls + pairwise co-occurrence affinity
  // =========================================================================
  let bestSlot1: number[] | null = null;
  let bestSlot1Lift = -1;
  for (let attempt = 0; attempt < 1500; attempt++) {
    const cand = rng.sampleWeightedWithoutReplacement(
      cfg.hotPool,
      adjustedHotWeights,
      6
    );
    const sig = cand.join(",");
    if (
      !usedSignatures.has(sig) &&
      passesCombinatorialSieve(cand, gameType)
    ) {
      const rep = inspectCombinatorialSieve(cand, gameType);
      if (rep.affinityLiftScore > bestSlot1Lift) {
        bestSlot1Lift = rep.affinityLiftScore;
        bestSlot1 = cand;
      }
      if (attempt >= 25 && bestSlot1) break;
    }
  }
  if (!bestSlot1) {
    // Fallback across allNums if needed
    for (let attempt = 0; attempt < 2000; attempt++) {
      const cand = rng
        .sampleWithoutReplacement(allNums, 6)
        .sort((a, b) => a - b);
      if (passesCombinatorialSieve(cand, gameType)) {
        bestSlot1 = cand;
        break;
      }
    }
  }
  if (bestSlot1) {
    usedSignatures.add(bestSlot1.join(","));
    ballots.push(
      buildBallotObject(
        1,
        "HOT_MOMENTUM",
        "Hot Momentum & Companion Affinity",
        "HOT MOMENTUM",
        "Weighted sampling from upper-quantile multi-horizon momentum balls maximizing pairwise co-occurrence lift.",
        bestSlot1
      )
    );
  }

  // =========================================================================
  // STRATEGY 2 (COLD_REBOUND): Locks 2 overdue/skip-gap numbers paired with 4 balanced pivot numbers passing the 6 gates
  // =========================================================================
  let slot2Nums: number[] | null = null;
  for (let attempt = 0; attempt < 2500; attempt++) {
    const coldPicks = rng.sampleWithoutReplacement(cfg.coldOverduePool, 2);
    const remPool = allNums.filter((x) => !coldPicks.includes(x));
    const pivots = rng.sampleWithoutReplacement(remPool, 4);
    const cand = [...coldPicks, ...pivots].sort((a, b) => a - b);
    const sig = cand.join(",");
    if (
      !usedSignatures.has(sig) &&
      passesCombinatorialSieve(cand, gameType)
    ) {
      slot2Nums = cand;
      break;
    }
  }
  if (slot2Nums) {
    usedSignatures.add(slot2Nums.join(","));
    ballots.push(
      buildBallotObject(
        2,
        "COLD_REBOUND",
        "Overdue Skip-Gap Rebound (Lô Gan)",
        "COLD REBOUND",
        "Locks 2 top-decile Survival Hazard overdue numbers paired with 4 high-stability equilibrium pivots.",
        slot2Nums
      )
    );
  }

  // =========================================================================
  // STRATEGY 3 (DELTA_SYSTEM): Generates 6 first-difference deltas (1 in [1..4], 2 in [2..8], 1 in [7..10], 2 in [8..13/15]),
  // permutes step deltas, computes prefix sums, and enforces total spread >= 24 (6/45) or >= 30 (6/55)
  // =========================================================================
  let slot3Nums: number[] | null = null;
  for (let attempt = 0; attempt < 3500; attempt++) {
    const d1 = rng.nextInt(1, 4);
    const stepDeltas = rng.shuffle([
      rng.nextInt(2, 8),
      rng.nextInt(2, 8),
      rng.nextInt(7, 10),
      rng.nextInt(8, cfg.maxDeltaStep),
      rng.nextInt(8, cfg.maxDeltaStep),
    ]);
    const cand = [d1];
    for (const s of stepDeltas) {
      cand.push(cand[cand.length - 1] + s);
    }
    const spread = cand[5] - cand[0];
    const sig = cand.join(",");
    if (
      cand[5] <= cfg.maxNum &&
      spread >= cfg.minDeltaSpread &&
      !usedSignatures.has(sig) &&
      passesCombinatorialSieve(cand, gameType)
    ) {
      slot3Nums = cand;
      break;
    }
  }
  if (!slot3Nums) {
    // Relaxed delta step fallback still enforcing spread >= minDeltaSpread and 6 gates
    for (let attempt = 0; attempt < 3000; attempt++) {
      const cand = rng
        .sampleWithoutReplacement(allNums, 6)
        .sort((a, b) => a - b);
      const sig = cand.join(",");
      if (
        cand[0] <= 6 &&
        cand[5] - cand[0] >= cfg.minDeltaSpread &&
        !usedSignatures.has(sig) &&
        passesCombinatorialSieve(cand, gameType)
      ) {
        slot3Nums = cand;
        break;
      }
    }
  }
  if (slot3Nums) {
    usedSignatures.add(slot3Nums.join(","));
    ballots.push(
      buildBallotObject(
        3,
        "DELTA_SYSTEM",
        "Delta Harmonic Spacing System",
        "DELTA SYSTEM",
        `Constructed in first-difference Delta space (δ₁..δ₆) with permuted step intervals and spread ≥ ${cfg.minDeltaSpread}.`,
        slot3Nums
      )
    );
  }

  // =========================================================================
  // STRATEGY 4 (GOLDEN_EQUILIBRIUM): Enforces 3O-3E or 4O-2E parity, 3L-3H split,
  // and sum within Mean ± 10 ([128, 148] for 6/45; [158, 178] for 6/55)
  // =========================================================================
  const lowOdd = allNums.filter((x) => x <= cfg.midPoint && x % 2 !== 0);
  const lowEven = allNums.filter((x) => x <= cfg.midPoint && x % 2 === 0);
  const highOdd = allNums.filter((x) => x > cfg.midPoint && x % 2 !== 0);
  const highEven = allNums.filter((x) => x > cfg.midPoint && x % 2 === 0);

  let slot4Nums: number[] | null = null;
  for (let attempt = 0; attempt < 3500; attempt++) {
    // Alternate between 3O-3E (33.5% modal peak) and 4O-2E (25.1% asymmetric peak) while keeping 3L-3H
    const use4Odd = attempt % 3 === 1;
    const cand = use4Odd
      ? [
          ...rng.sampleWithoutReplacement(lowOdd, 2),
          ...rng.sampleWithoutReplacement(lowEven, 1),
          ...rng.sampleWithoutReplacement(highOdd, 2),
          ...rng.sampleWithoutReplacement(highEven, 1),
        ].sort((a, b) => a - b)
      : [
          ...rng.sampleWithoutReplacement(lowOdd, 2),
          ...rng.sampleWithoutReplacement(lowEven, 1),
          ...rng.sampleWithoutReplacement(highOdd, 1),
          ...rng.sampleWithoutReplacement(highEven, 2),
        ].sort((a, b) => a - b);

    const sum = cand.reduce((acc, v) => acc + v, 0);
    const sig = cand.join(",");
    if (
      sum >= cfg.goldenCorridor[0] &&
      sum <= cfg.goldenCorridor[1] &&
      !usedSignatures.has(sig) &&
      passesCombinatorialSieve(cand, gameType)
    ) {
      slot4Nums = cand;
      break;
    }
  }
  if (slot4Nums) {
    usedSignatures.add(slot4Nums.join(","));
    ballots.push(
      buildBallotObject(
        4,
        "GOLDEN_EQUILIBRIUM",
        "Golden Mean Combinatorial Equilibrium",
        "GOLDEN EQUILIBRIUM",
        `Enforces modal 3O-3E / 4O-2E parity, exact 3L-3H split, and tight Gaussian core sum within [${cfg.goldenCorridor[0]}, ${cfg.goldenCorridor[1]}].`,
        slot4Nums
      )
    );
  }

  // =========================================================================
  // STRATEGY 5 (ANTI_SPLIT_EV): Selects >= 4 numbers above calendar birthday range
  // (>= 27 for 6/45; >= 32 for 6/55) paired with 2 low anchors to maximize solo-jackpot EV
  // =========================================================================
  const upperAntiSplitPool = allNums.filter((x) => x >= cfg.antiSplitCutoff);
  const lowerAnchorPool = allNums.filter((x) => x <= cfg.midPoint);

  let slot5Nums: number[] | null = null;
  for (let attempt = 0; attempt < 3500; attempt++) {
    const highPicks = rng.sampleWithoutReplacement(upperAntiSplitPool, 4);
    const lowPicks = rng.sampleWithoutReplacement(lowerAnchorPool, 2);
    const cand = [...lowPicks, ...highPicks].sort((a, b) => a - b);
    const sig = cand.join(",");
    if (
      !usedSignatures.has(sig) &&
      passesCombinatorialSieve(cand, gameType, { allowWideSum: false })
    ) {
      slot5Nums = cand;
      break;
    }
  }
  if (!slot5Nums) {
    // Allow 80% sum corridor if 70% corridor was tight
    for (let attempt = 0; attempt < 2500; attempt++) {
      const highPicks = rng.sampleWithoutReplacement(upperAntiSplitPool, 4);
      const lowPicks = rng.sampleWithoutReplacement(lowerAnchorPool, 2);
      const cand = [...lowPicks, ...highPicks].sort((a, b) => a - b);
      const sig = cand.join(",");
      if (
        !usedSignatures.has(sig) &&
        passesCombinatorialSieve(cand, gameType, { allowWideSum: true })
      ) {
        slot5Nums = cand;
        break;
      }
    }
  }
  if (slot5Nums) {
    usedSignatures.add(slot5Nums.join(","));
    ballots.push(
      buildBallotObject(
        5,
        "ANTI_SPLIT_EV",
        "Contrarian Anti-Split EV Optimizer",
        "ANTI-SPLIT EV",
        `Selects ≥ 4 numbers above calendar birthday bias (≥ ${cfg.antiSplitCutoff}) with 2 low anchors (2L-4H) to protect solo-jackpot equity.`,
        slot5Nums
      )
    );
  }

  return {
    date: targetDateStr,
    weekday,
    shortDateLabel,
    isMondayRestDay: false,
    gameType,
    gameName: cfg.name,
    estimatedDrawId,
    cutoffTimeICT: cfg.cutoffTimeICT,
    broadcastWindowICT: cfg.broadcastWindowICT,
    seedHash,
    ballots,
    concurrentGamesNote:
      gameType === "6/55"
        ? "Power 6/55 Draw Day (18:00–18:30 ICT). Concurrent: Max 3D Pro, Lotto 5/35, Keno."
        : "Mega 6/45 Draw Day (18:00–18:30 ICT). Concurrent: Max 3D, Lotto 5/35, Keno.",
  };
}

/**
 * Helper to add days to a YYYY-MM-DD date string in ICT
 */
export function addDaysISO(isoDate: string, daysToAdd: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  dt.setUTCDate(dt.getUTCDate() + daysToAdd);
  const yr = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const da = String(dt.getUTCDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

/**
 * Generate the 7-to-8 Day Rolling Combinatorial & Algorithmic Ballot Schedule
 * Enforces the Monday Matrix Rest Day rule and Markov Virtual-Draw Propagation (gamma = 0.88).
 */
export function generateRollingSchedule(
  anchorDate: Date | string,
  daysCount = 8,
  seedSalt = 0
): RollingScheduleResult {
  const anchorIso =
    typeof anchorDate === "string"
      ? anchorDate.slice(0, 10)
      : anchorDate.toLocaleDateString("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
        });

  const firstDayTest = new Date(`${anchorIso}T12:00:00+07:00`);
  const anchorWeekday = firstDayTest.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const isAnchorMonday = anchorWeekday === "Monday";

  // When anchor date is Monday, we generate 9 calendar days (Monday Rest Day + Tue..Sun 6 active days + next Mon + next Tue)
  // so that Tuesday through Sunday (all 6 active draw days = 30 ballots) AND the following Tuesday are always included!
  const effectiveSpan = isAnchorMonday ? Math.max(9, daysCount) : Math.max(8, daysCount);

  const allHorizonDays: DayScheduleForecast[] = [];
  const prevPowerSelected = new Set<number>();
  const prevMegaSelected = new Set<number>();

  for (let i = 0; i < effectiveSpan; i++) {
    const targetIso = addDaysISO(anchorIso, i);
    const dObj = new Date(`${targetIso}T12:00:00+07:00`);
    const wk = dObj.toLocaleDateString("en-US", {
      weekday: "long",
      timeZone: "Asia/Ho_Chi_Minh",
    });

    const isPower = wk === "Tuesday" || wk === "Thursday" || wk === "Saturday";
    const attenuatedSet =
      wk === "Monday"
        ? new Set<number>()
        : isPower
        ? prevPowerSelected
        : prevMegaSelected;

    const dayForecast = generateDayForecast(targetIso, seedSalt, attenuatedSet);
    allHorizonDays.push(dayForecast);

    // Update Markov Virtual-Draw Propagation state for subsequent draw of same game
    if (!dayForecast.isMondayRestDay && dayForecast.ballots.length > 0) {
      const targetSet = isPower ? prevPowerSelected : prevMegaSelected;
      targetSet.clear();
      for (const b of dayForecast.ballots.slice(0, 2)) {
        for (const num of b.numbers) {
          targetSet.add(num);
        }
      }
    }
  }

  const activeDaysAll = allHorizonDays.filter((d) => !d.isMondayRestDay);
  const activeSixDayCycle = activeDaysAll.slice(0, 6); // 6 active draw days (Tue-Sun = 30 ballots)
  const extraLookaheadDay = activeDaysAll[6]; // 7th active draw day (following Tuesday = 5 ballots)

  return {
    anchorDate: anchorIso,
    anchorWeekday,
    isAnchorMonday,
    seedSalt,
    allHorizonDays,
    activeSixDayCycle,
    extraLookaheadDay,
    totalWeeklyBallots: activeSixDayCycle.reduce(
      (acc, d) => acc + d.ballots.length,
      0
    ),
    weeklyStandardCostVnd: 300_000,
    dailyStandardCostVnd: 50_000,
  };
}

/**
 * Combinatorial helper C(n, k)
 */
export function combinationsCount(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let result = 1;
  const symK = Math.min(k, n - k);
  for (let i = 1; i <= symK; i++) {
    result = (result * (n - i + 1)) / i;
  }
  return Math.round(result);
}

export interface SystemPlayTierSpec {
  code: string;
  name: string;
  ballsSelected: number;
  combinations: number;
  costVnd: number;
  jp1OddsRatio: string;
  jp2OddsRatio: string;
  description: string;
  fixedPrizeWhenMatching5MainVnd: number;
  fixedPrizeWhenMatching4MainVnd: number;
  fixedPrizeWhenMatching3MainVnd: number;
}

/**
 * System Play ("Chơi Bao") Cost, Odds & Compound Prize Matrix Calculator
 * Covers Standard (Bao 6), Bao 5 (Roll 40/49 remaining balls), and Bao 7 through Bao 15 + Bao 18
 */
export function getSystemPlayMatrix(gameType: GameType): SystemPlayTierSpec[] {
  const cfg = GAME_CONFIGS[gameType];
  const firstPrize = gameType === "6/55" ? 40_000_000 : 10_000_000;
  const secondPrize = gameType === "6/55" ? 500_000 : 300_000;
  const thirdPrize = gameType === "6/55" ? 50_000 : 30_000;

  const tiers: SystemPlayTierSpec[] = [];

  // Bao 5 (Roll 5 anchors with all remaining N-5 numbers: 40 combinations for 6/45, 49 combinations for 6/55)
  const bao5Combos = cfg.maxNum - 5;
  tiers.push({
    code: "BAO_5",
    name: `Bao 5 (Roll ${bao5Combos} Balls)`,
    ballsSelected: 5,
    combinations: bao5Combos,
    costVnd: bao5Combos * 10_000,
    jp1OddsRatio: `1 : ${Math.round(cfg.totalCombinations / bao5Combos).toLocaleString("en-US")}`,
    jp2OddsRatio:
      gameType === "6/55"
        ? `1 : ${Math.round(4831612.5 / bao5Combos).toLocaleString("en-US")}`
        : "N/A",
    description: `Select 5 anchor balls; terminal pairs them with all ${bao5Combos} remaining balls in the drum.`,
    fixedPrizeWhenMatching5MainVnd:
      firstPrize + (bao5Combos - 1) * secondPrize,
    fixedPrizeWhenMatching4MainVnd:
      2 * firstPrize + (bao5Combos - 2) * secondPrize,
    fixedPrizeWhenMatching3MainVnd:
      3 * secondPrize + (bao5Combos - 3) * thirdPrize,
  });

  // Standard Single Ballot (6 Balls)
  tiers.push({
    code: "STANDARD_6",
    name: "Standard Ticket (6 Balls)",
    ballsSelected: 6,
    combinations: 1,
    costVnd: 10_000,
    jp1OddsRatio: `1 : ${cfg.totalCombinations.toLocaleString("en-US")}`,
    jp2OddsRatio:
      gameType === "6/55" ? "1 : 4,831,613" : "N/A",
    description: "Standard 6-number single line ballot (10,000 VND).",
    fixedPrizeWhenMatching5MainVnd: firstPrize,
    fixedPrizeWhenMatching4MainVnd: secondPrize,
    fixedPrizeWhenMatching3MainVnd: thirdPrize,
  });

  // Bao 7 through Bao 15 + Bao 18
  const systemSizes = [7, 8, 9, 10, 11, 12, 13, 14, 15, 18];
  for (const m of systemSizes) {
    const combos = combinationsCount(m, 6);
    const costVnd = combos * 10_000;

    // If player matches 5 winning numbers inside their m chosen balls:
    // C(5,5)*C(m-5,1) First Prizes + C(5,4)*C(m-5,2) Second Prizes + C(5,3)*C(m-5,3) Third Prizes
    const match5FirstCount = combinationsCount(m - 5, 1);
    const match5SecondCount = 5 * combinationsCount(m - 5, 2);
    const match5ThirdCount = 10 * combinationsCount(m - 5, 3);
    const compound5MainVnd =
      match5FirstCount * firstPrize +
      match5SecondCount * secondPrize +
      match5ThirdCount * thirdPrize;

    // If player matches 4 winning numbers inside their m chosen balls:
    // C(4,4)*C(m-4,2) Second Prizes + C(4,3)*C(m-4,3) Third Prizes
    const match4SecondCount = combinationsCount(m - 4, 2);
    const match4ThirdCount = 4 * combinationsCount(m - 4, 3);
    const compound4MainVnd =
      match4SecondCount * secondPrize + match4ThirdCount * thirdPrize;

    // If player matches 3 winning numbers inside their m chosen balls:
    // C(3,3)*C(m-3,3) Third Prizes
    const match3ThirdCount = combinationsCount(m - 3, 3);
    const compound3MainVnd = match3ThirdCount * thirdPrize;

    tiers.push({
      code: `BAO_${m}`,
      name:
        m === 7
          ? "Bao 7 (6 Main + Bonus Anchor ★)"
          : m === 8
          ? "Bao 8 (Spillover Pro ★)"
          : `Bao ${m} System`,
      ballsSelected: m,
      combinations: combos,
      costVnd,
      jp1OddsRatio: `1 : ${Math.round(cfg.totalCombinations / combos).toLocaleString("en-US")}`,
      jp2OddsRatio:
        gameType === "6/55"
          ? `1 : ${Math.round(4831612.5 / combos).toLocaleString("en-US")}`
          : "N/A",
      description: `Generates all ${combos.toLocaleString("en-US")} combinations of 6 numbers from ${m} selected balls.`,
      fixedPrizeWhenMatching5MainVnd: compound5MainVnd,
      fixedPrizeWhenMatching4MainVnd: compound4MainVnd,
      fixedPrizeWhenMatching3MainVnd: compound3MainVnd,
    });
  }

  return tiers;
}

export { calculateNetPayout };
