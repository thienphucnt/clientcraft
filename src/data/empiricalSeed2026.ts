export type GameType = "6/55" | "6/45";

export interface HistoricalDraw {
  id: string;
  date: string; // YYYY-MM-DD
  weekday: string;
  gameType: GameType;
  numbers: number[]; // sorted 6 main numbers
  bonus?: number; // Power 6/55 bonus ball
  sum: number;
  oddEven: string;
  lowHigh: string;
  consecPairs: number;
  consecDetail?: string;
  jackpot1Vnd: number;
  jackpot2Vnd?: number;
  jp1Winners: number;
  jp2Winners?: number;
  isJackpotWon?: boolean;
}

export interface BallTelemetryStat {
  ball: number;
  gameType: GameType;
  hitsW10: number;
  hitsW20: number;
  hitsW50: number;
  hitsW100: number;
  hitsW150: number;
  hitsAllTime: number;
  skipGap: number; // draws since last appearance (Lo Gan)
  momentumZ: number; // Multi-Horizon Momentum Score M_i
  hazardScore: number; // Damped log-normal Survival Hazard Score R_i
  regime: "HOT" | "COLD" | "OVERDUE" | "NEUTRAL";
  note?: string;
}

export interface GameConfig {
  gameType: GameType;
  name: string;
  vietnameseName: string;
  latestDrawId: string;
  latestDrawDate: string;
  nextDrawId: string;
  maxNum: number;
  midPoint: number;
  totalCombinations: number;
  jp2Combinations?: number;
  minJackpot1Vnd: number;
  minJackpot2Vnd?: number;
  spilloverThresholdVnd?: number;
  currentJackpot1Vnd: number;
  currentJackpot2Vnd?: number;
  seedMultiplier: number;
  meanSum: number;
  stdDevSum: number;
  minPossibleSum: number;
  maxPossibleSum: number;
  corridor70: [number, number];
  corridor80: [number, number];
  goldenCorridor: [number, number];
  antiSplitCutoff: number;
  minDeltaSpread: number;
  maxDeltaStep: number;
  drawDays: number[]; // 1=Mon..6=Sat, 0=Sun (JS getDay: Tue=2, Thu=4, Sat=6 for 6/55; Wed=3, Fri=5, Sun=0 for 6/45)
  drawDaysLabel: string;
  cutoffTimeICT: string;
  broadcastWindowICT: string;
  hotPool: number[];
  hotWeights: number[];
  coldOverduePool: number[];
  recentDrawsTop2: number[][];
}

export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  "6/55": {
    gameType: "6/55",
    name: "Power 6/55",
    vietnameseName: "Vietlott Power 6/55",
    latestDrawId: "01412",
    latestDrawDate: "2026-10-17",
    nextDrawId: "01413",
    maxNum: 55,
    midPoint: 27,
    totalCombinations: 28989675,
    jp2Combinations: 4831612.5,
    minJackpot1Vnd: 30_000_000_000,
    minJackpot2Vnd: 3_000_000_000,
    spilloverThresholdVnd: 300_000_000_000,
    currentJackpot1Vnd: 164_048_997_900,
    currentJackpot2Vnd: 3_816_405_550,
    seedMultiplier: 5.47,
    meanSum: 168.0,
    stdDevSum: 37.04,
    minPossibleSum: 21,
    maxPossibleSum: 315,
    corridor70: [129, 207],
    corridor80: [120, 216],
    goldenCorridor: [158, 178],
    antiSplitCutoff: 32,
    minDeltaSpread: 30,
    maxDeltaStep: 15,
    drawDays: [2, 4, 6], // Tuesday, Thursday, Saturday
    drawDaysLabel: "Tuesday, Thursday & Saturday",
    cutoffTimeICT: "17:30",
    broadcastWindowICT: "18:00–18:30",
    hotPool: [
      41, 22, 34, 8, 9, 12, 15, 1, 7, 11, 27, 13, 18, 24, 25, 52, 14, 17, 21,
      37, 38, 45,
    ],
    hotWeights: [
      208, 208, 198, 196, 194, 179, 167, 185, 182, 184, 180, 176, 175, 174, 173,
      170, 169, 168, 166, 165, 164, 163,
    ],
    coldOverduePool: [19, 44, 8, 32, 3, 29, 33, 35, 43, 49, 54],
    recentDrawsTop2: [
      [1, 10, 11, 12, 16, 37], // #01412 (2026-10-17)
      [7, 23, 25, 42, 45, 51], // #01411 (2026-10-15)
    ],
  },
  "6/45": {
    gameType: "6/45",
    name: "Mega 6/45",
    vietnameseName: "Vietlott Mega 6/45",
    latestDrawId: "01577",
    latestDrawDate: "2026-10-18",
    nextDrawId: "01578",
    maxNum: 45,
    midPoint: 22,
    totalCombinations: 8145060,
    minJackpot1Vnd: 12_000_000_000,
    currentJackpot1Vnd: 26_444_954_000,
    seedMultiplier: 2.2,
    meanSum: 138.0,
    stdDevSum: 29.95,
    minPossibleSum: 21,
    maxPossibleSum: 255,
    corridor70: [106, 170],
    corridor80: [99, 177],
    goldenCorridor: [128, 148],
    antiSplitCutoff: 27,
    minDeltaSpread: 24,
    maxDeltaStep: 13,
    drawDays: [3, 5, 0], // Wednesday, Friday, Sunday
    drawDaysLabel: "Wednesday, Friday & Sunday",
    cutoffTimeICT: "17:30",
    broadcastWindowICT: "18:00–18:30",
    hotPool: [
      31, 16, 43, 36, 45, 44, 7, 12, 2, 30, 6, 27, 20, 29, 37, 23, 28, 18, 38,
      22, 33, 26,
    ],
    hotWeights: [
      31, 29, 28, 25, 24, 23, 23, 23, 23, 23, 22, 25, 22, 21, 22, 22, 22, 21,
      21, 21, 18, 18,
    ],
    coldOverduePool: [5, 8, 14, 24, 39, 21, 25, 4, 34, 19, 17, 32],
    recentDrawsTop2: [
      [10, 11, 31, 38, 40, 44], // #01577 (2026-10-18)
      [15, 20, 29, 37, 40, 45], // #01571 / recent anchor
    ],
  },
};

/**
 * Tier 2 Built-In October 2026 Empirical Seed Database:
 * Power 6/55 15-Draw Rollover Surge (#01398 to #01412)
 */
export const POWER_655_SEED_DRAWS: HistoricalDraw[] = [
  {
    id: "01412",
    date: "2026-10-17",
    weekday: "Saturday",
    gameType: "6/55",
    numbers: [1, 10, 11, 12, 16, 37],
    bonus: 48,
    sum: 87,
    oddEven: "3O-3E",
    lowHigh: "5L-1H",
    consecPairs: 2,
    consecDetail: "10-11-12",
    jackpot1Vnd: 164_048_997_900,
    jackpot2Vnd: 3_816_405_550,
    jp1Winners: 0,
    jp2Winners: 0,
  },
  {
    id: "01411",
    date: "2026-10-15",
    weekday: "Thursday",
    gameType: "6/55",
    numbers: [7, 23, 25, 42, 45, 51],
    bonus: 4,
    sum: 193,
    oddEven: "5O-1E",
    lowHigh: "3L-3H",
    consecPairs: 0,
    jackpot1Vnd: 156_701_347_950,
    jackpot2Vnd: 5_217_498_700,
    jp1Winners: 0,
    jp2Winners: 2,
  },
  {
    id: "01410",
    date: "2026-10-13",
    weekday: "Tuesday",
    gameType: "6/55",
    numbers: [2, 14, 27, 40, 50, 53],
    bonus: 26,
    sum: 186,
    oddEven: "2O-4E",
    lowHigh: "3L-3H",
    consecPairs: 0,
    jackpot1Vnd: 146_262_248_400,
    jackpot2Vnd: 4_057_598_750,
    jp1Winners: 0,
    jp2Winners: 0,
  },
  {
    id: "01409",
    date: "2026-10-10",
    weekday: "Saturday",
    gameType: "6/55",
    numbers: [14, 17, 21, 23, 24, 39],
    bonus: 30,
    sum: 138,
    oddEven: "4O-2E",
    lowHigh: "5L-1H",
    consecPairs: 1,
    consecDetail: "23-24",
    jackpot1Vnd: 136_743_859_650,
    jackpot2Vnd: 3_785_670_500,
    jp1Winners: 0,
    jp2Winners: 1,
  },
  {
    id: "01408",
    date: "2026-10-08",
    weekday: "Thursday",
    gameType: "6/55",
    numbers: [1, 7, 12, 27, 31, 52],
    bonus: 6,
    sum: 130,
    oddEven: "4O-2E",
    lowHigh: "4L-2H",
    consecPairs: 0,
    jackpot1Vnd: 129_672_825_150,
    jackpot2Vnd: 3_800_633_150,
    jp1Winners: 0,
    jp2Winners: 1,
  },
  {
    id: "01407",
    date: "2026-10-06",
    weekday: "Tuesday",
    gameType: "6/55",
    numbers: [6, 7, 18, 20, 24, 27],
    bonus: 1,
    sum: 102,
    oddEven: "2O-4E",
    lowHigh: "6L-0H",
    consecPairs: 1,
    consecDetail: "06-07",
    jackpot1Vnd: 122_467_126_800,
    jackpot2Vnd: 4_771_759_950,
    jp1Winners: 0,
    jp2Winners: 1,
  },
  {
    id: "01406",
    date: "2026-10-03",
    weekday: "Saturday",
    gameType: "6/55",
    numbers: [7, 11, 13, 16, 18, 54],
    bonus: 41,
    sum: 119,
    oddEven: "3O-3E",
    lowHigh: "5L-1H",
    consecPairs: 0,
    jackpot1Vnd: 112_784_140_200,
    jackpot2Vnd: 3_695_872_550,
    jp1Winners: 0,
    jp2Winners: 0,
  },
  {
    id: "01405",
    date: "2026-10-01",
    weekday: "Thursday",
    gameType: "6/55",
    numbers: [4, 5, 13, 34, 52, 55],
    bonus: 15,
    sum: 163,
    oddEven: "3O-3E",
    lowHigh: "3L-3H",
    consecPairs: 1,
    consecDetail: "04-05",
    jackpot1Vnd: 106_521_287_250,
    jackpot2Vnd: 3_739_088_100,
    jp1Winners: 0,
    jp2Winners: 2,
  },
  {
    id: "01404",
    date: "2026-09-29",
    weekday: "Tuesday",
    gameType: "6/55",
    numbers: [2, 4, 13, 17, 35, 36],
    bonus: 11,
    sum: 107,
    oddEven: "3O-3E",
    lowHigh: "4L-2H",
    consecPairs: 1,
    consecDetail: "35-36",
    jackpot1Vnd: 99_864_450_000,
    jackpot2Vnd: 4_454_120_000,
    jp1Winners: 0,
    jp2Winners: 1,
  },
  {
    id: "01403",
    date: "2026-09-26",
    weekday: "Saturday",
    gameType: "6/55",
    numbers: [14, 18, 21, 38, 48, 52],
    bonus: 49,
    sum: 191,
    oddEven: "1O-5E",
    lowHigh: "3L-3H",
    consecPairs: 0,
    jackpot1Vnd: 91_389_210_000,
    jackpot2Vnd: 3_512_840_000,
    jp1Winners: 0,
    jp2Winners: 0,
  },
  {
    id: "01402",
    date: "2026-09-24",
    weekday: "Thursday",
    gameType: "6/55",
    numbers: [1, 13, 23, 25, 26, 28],
    bonus: 27,
    sum: 116,
    oddEven: "4O-2E",
    lowHigh: "5L-1H",
    consecPairs: 1,
    consecDetail: "25-26",
    jackpot1Vnd: 86_770_510_000,
    jackpot2Vnd: 5_462_190_000,
    jp1Winners: 0,
    jp2Winners: 0,
  },
  {
    id: "01401",
    date: "2026-09-22",
    weekday: "Tuesday",
    gameType: "6/55",
    numbers: [1, 3, 9, 11, 41, 46],
    bonus: 10,
    sum: 111,
    oddEven: "5O-1E",
    lowHigh: "4L-2H",
    consecPairs: 0,
    jackpot1Vnd: 79_394_100_000,
    jackpot2Vnd: 4_641_250_000,
    jp1Winners: 0,
    jp2Winners: 0,
  },
  {
    id: "01400",
    date: "2026-09-19",
    weekday: "Saturday",
    gameType: "6/55",
    numbers: [4, 7, 11, 18, 22, 25],
    bonus: 50,
    sum: 87,
    oddEven: "3O-3E",
    lowHigh: "6L-0H",
    consecPairs: 0,
    jackpot1Vnd: 73_332_900_000,
    jackpot2Vnd: 3_968_400_000,
    jp1Winners: 0,
    jp2Winners: 0,
  },
  {
    id: "01399",
    date: "2026-09-17",
    weekday: "Thursday",
    gameType: "6/55",
    numbers: [6, 11, 25, 27, 37, 45],
    bonus: 15,
    sum: 151,
    oddEven: "5O-1E",
    lowHigh: "4L-2H",
    consecPairs: 0,
    jackpot1Vnd: 71_038_500_000,
    jackpot2Vnd: 3_712_600_000,
    jp1Winners: 0,
    jp2Winners: 0,
  },
  {
    id: "01398",
    date: "2026-09-15",
    weekday: "Tuesday",
    gameType: "6/55",
    numbers: [24, 27, 32, 36, 38, 47],
    bonus: 52,
    sum: 204,
    oddEven: "2O-4E",
    lowHigh: "2L-4H",
    consecPairs: 0,
    jackpot1Vnd: 67_984_087_800,
    jackpot2Vnd: 3_374_110_000,
    jp1Winners: 0,
    jp2Winners: 0,
  },
];

/**
 * Tier 2 Built-In October 2026 Empirical Seed Database:
 * Mega 6/45 Recent & Verified 2026 Jackpot Draws
 */
export const MEGA_645_SEED_DRAWS: HistoricalDraw[] = [
  {
    id: "01577",
    date: "2026-10-18",
    weekday: "Sunday",
    gameType: "6/45",
    numbers: [10, 11, 31, 38, 40, 44],
    sum: 174,
    oddEven: "2O-4E",
    lowHigh: "2L-4H",
    consecPairs: 1,
    consecDetail: "10-11",
    jackpot1Vnd: 26_444_954_000,
    jp1Winners: 0,
  },
  {
    id: "01576",
    date: "2026-10-16",
    weekday: "Friday",
    gameType: "6/45",
    numbers: [2, 16, 23, 27, 36, 43],
    sum: 147,
    oddEven: "3O-3E",
    lowHigh: "2L-4H",
    consecPairs: 0,
    jackpot1Vnd: 23_180_450_000,
    jp1Winners: 0,
  },
  {
    id: "01575",
    date: "2026-10-14",
    weekday: "Wednesday",
    gameType: "6/45",
    numbers: [7, 12, 18, 27, 31, 45],
    sum: 140,
    oddEven: "4O-2E",
    lowHigh: "3L-3H",
    consecPairs: 0,
    jackpot1Vnd: 20_412_900_000,
    jp1Winners: 0,
  },
  {
    id: "01574",
    date: "2026-10-11",
    weekday: "Sunday",
    gameType: "6/45",
    numbers: [6, 16, 22, 30, 36, 44],
    sum: 154,
    oddEven: "0O-6E",
    lowHigh: "3L-3H",
    consecPairs: 0,
    jackpot1Vnd: 17_890_120_000,
    jp1Winners: 0,
  },
  {
    id: "01573",
    date: "2026-10-09",
    weekday: "Friday",
    gameType: "6/45",
    numbers: [2, 7, 16, 27, 31, 43],
    sum: 126,
    oddEven: "4O-2E",
    lowHigh: "3L-3H",
    consecPairs: 0,
    jackpot1Vnd: 15_610_800_000,
    jp1Winners: 0,
  },
  {
    id: "01572",
    date: "2026-10-07",
    weekday: "Wednesday",
    gameType: "6/45",
    numbers: [12, 18, 23, 28, 37, 43],
    sum: 161,
    oddEven: "3O-3E",
    lowHigh: "2L-4H",
    consecPairs: 0,
    jackpot1Vnd: 13_450_000_000,
    jp1Winners: 0,
  },
  {
    id: "01571",
    date: "2026-10-04",
    weekday: "Sunday",
    gameType: "6/45",
    numbers: [15, 20, 29, 37, 40, 45],
    sum: 186,
    oddEven: "4O-2E",
    lowHigh: "2L-4H",
    consecPairs: 0,
    jackpot1Vnd: 42_810_500_000,
    jp1Winners: 1,
    isJackpotWon: true,
  },
  {
    id: "01544",
    date: "2026-08-02",
    weekday: "Sunday",
    gameType: "6/45",
    numbers: [3, 12, 20, 25, 27, 37],
    sum: 124,
    oddEven: "4O-2E",
    lowHigh: "3L-3H",
    consecPairs: 0,
    jackpot1Vnd: 38_420_000_000,
    jp1Winners: 1,
    isJackpotWon: true,
  },
  {
    id: "01535",
    date: "2026-07-12",
    weekday: "Sunday",
    gameType: "6/45",
    numbers: [6, 9, 11, 17, 35, 44],
    sum: 122,
    oddEven: "4O-2E",
    lowHigh: "4L-2H",
    consecPairs: 0,
    jackpot1Vnd: 29_150_000_000,
    jp1Winners: 1,
    isJackpotWon: true,
  },
  {
    id: "01532",
    date: "2026-07-05",
    weekday: "Sunday",
    gameType: "6/45",
    numbers: [1, 5, 13, 29, 32, 35],
    sum: 115,
    oddEven: "5O-1E",
    lowHigh: "3L-3H",
    consecPairs: 0,
    jackpot1Vnd: 16_890_000_000,
    jp1Winners: 1,
    isJackpotWon: true,
  },
  {
    id: "01528",
    date: "2026-06-26",
    weekday: "Friday",
    gameType: "6/45",
    numbers: [9, 14, 31, 36, 41, 45],
    sum: 176,
    oddEven: "4O-2E",
    lowHigh: "2L-4H",
    consecPairs: 0,
    jackpot1Vnd: 24_510_000_000,
    jp1Winners: 1,
    isJackpotWon: true,
  },
];

/**
 * Power 6/55 All-Time Frequency Leaders & Overdue Skip-Gap ("Lo Gan") Telemetry
 */
export const POWER_655_FREQUENCY_LEADERS = [
  { ball: 41, hitsAllTime: 208, hitsW150: 24, hitsW100: 16, hitsW50: 9, hitsW20: 4, hitsW10: 2, skipGap: 5, regime: "HOT" as const, note: "Co-Leader All-Time (#1)" },
  { ball: 22, hitsAllTime: 208, hitsW150: 23, hitsW100: 15, hitsW50: 8, hitsW20: 3, hitsW10: 1, skipGap: 6, regime: "HOT" as const, note: "Co-Leader All-Time (#1)" },
  { ball: 34, hitsAllTime: 198, hitsW150: 22, hitsW100: 15, hitsW50: 8, hitsW20: 3, hitsW10: 1, skipGap: 7, regime: "HOT" as const, note: "#3 All-Time Frequency" },
  { ball: 8,  hitsAllTime: 196, hitsW150: 19, hitsW100: 12, hitsW50: 5, hitsW20: 1, hitsW10: 0, skipGap: 17, regime: "OVERDUE" as const, note: "Dual-State Outlier: #4 All-Time (196 hits) yet 17-draw skip drought" },
  { ball: 9,  hitsAllTime: 194, hitsW150: 21, hitsW100: 14, hitsW50: 7, hitsW20: 2, hitsW10: 1, skipGap: 11, regime: "HOT" as const, note: "#5 All-Time Frequency" },
  { ball: 12, hitsAllTime: 179, hitsW150: 20, hitsW100: 14, hitsW50: 7, hitsW20: 4, hitsW10: 2, skipGap: 0, regime: "HOT" as const, note: "Hit in #01412 & #01408" },
  { ball: 15, hitsAllTime: 167, hitsW150: 18, hitsW100: 12, hitsW50: 6, hitsW20: 2, hitsW10: 1, skipGap: 9, regime: "NEUTRAL" as const, note: "Bonus in #01405 & #01399" },
  { ball: 6,  hitsAllTime: 146, hitsW150: 16, hitsW100: 11, hitsW50: 6, hitsW20: 3, hitsW10: 1, skipGap: 5, regime: "NEUTRAL" as const, note: "Mid-Range Baseline" },
  { ball: 7,  hitsAllTime: 182, hitsW150: 22, hitsW100: 15, hitsW50: 9, hitsW20: 6, hitsW10: 4, skipGap: 1, regime: "HOT" as const, note: "5 hits in 15-draw surge (33.3%)" },
  { ball: 11, hitsAllTime: 184, hitsW150: 21, hitsW100: 15, hitsW50: 8, hitsW20: 5, hitsW10: 2, skipGap: 0, regime: "HOT" as const, note: "5 hits in 15-draw surge (33.3%)" },
  { ball: 1,  hitsAllTime: 185, hitsW150: 21, hitsW100: 14, hitsW50: 8, hitsW20: 5, hitsW10: 2, skipGap: 0, regime: "HOT" as const, note: "5 hits in 15-draw surge (33.3%)" },
  { ball: 27, hitsAllTime: 180, hitsW150: 20, hitsW100: 14, hitsW50: 8, hitsW20: 5, hitsW10: 3, skipGap: 2, regime: "HOT" as const, note: "5 hits in 15-draw surge (33.3%)" },
  { ball: 19, hitsAllTime: 142, hitsW150: 12, hitsW100: 8,  hitsW50: 3, hitsW20: 0, hitsW10: 0, skipGap: 24, regime: "OVERDUE" as const, note: "#1 Overdue Skip-Gap Leader (24 draws absent)" },
  { ball: 44, hitsAllTime: 148, hitsW150: 13, hitsW100: 9,  hitsW50: 4, hitsW20: 0, hitsW10: 0, skipGap: 20, regime: "OVERDUE" as const, note: "#2 Overdue Skip-Gap Leader (20 draws absent)" },
  { ball: 32, hitsAllTime: 151, hitsW150: 14, hitsW100: 10, hitsW50: 4, hitsW20: 1, hitsW10: 0, skipGap: 14, regime: "OVERDUE" as const, note: "#4 Overdue Skip-Gap Leader (14 draws absent)" },
  { ball: 38, hitsAllTime: 164, hitsW150: 19, hitsW100: 14, hitsW50: 7, hitsW20: 2, hitsW10: 1, skipGap: 9, regime: "NEUTRAL" as const, note: "100-Draw Window Leader (14 hits)" },
  { ball: 29, hitsAllTime: 158, hitsW150: 18, hitsW100: 13, hitsW50: 5, hitsW20: 1, hitsW10: 0, skipGap: 13, regime: "OVERDUE" as const, note: "100-Draw Window Co-Leader (13 hits)" },
];

/**
 * Mega 6/45 150-Draw Rolling Hot & Cold/Overdue Telemetry (Expected = 20.00, SD = 4.16)
 */
export const MEGA_645_TELEMETRY_LEADERS = [
  { ball: 31, hitsW150: 31, hitsW100: 20, hitsW50: 10, hitsW20: 5, hitsW10: 3, hitsAllTime: 248, skipGap: 0, zScore150: 2.64, regime: "HOT" as const, note: "#1 Hot Leader (+2.64σ above 20.0 expectation)" },
  { ball: 16, hitsW150: 29, hitsW100: 19, hitsW50: 10, hitsW20: 4, hitsW10: 2, hitsAllTime: 239, skipGap: 1, zScore150: 2.16, regime: "HOT" as const, note: "#2 Hot Leader (+2.16σ)" },
  { ball: 43, hitsW150: 28, hitsW100: 19, hitsW50: 9,  hitsW20: 4, hitsW10: 2, hitsAllTime: 235, skipGap: 1, zScore150: 1.92, regime: "HOT" as const, note: "#3 Hot Leader (+1.92σ)" },
  { ball: 36, hitsW150: 25, hitsW100: 21, hitsW50: 9,  hitsW20: 4, hitsW10: 2, hitsAllTime: 226, skipGap: 1, zScore150: 1.20, regime: "HOT" as const, note: "21 hits in 100-draw window" },
  { ball: 45, hitsW150: 24, hitsW100: 17, hitsW50: 11, hitsW20: 4, hitsW10: 2, hitsAllTime: 221, skipGap: 2, zScore150: 0.96, regime: "HOT" as const, note: "11 hits in 50-draw window" },
  { ball: 44, hitsW150: 23, hitsW100: 16, hitsW50: 8,  hitsW20: 3, hitsW10: 2, hitsAllTime: 218, skipGap: 0, zScore150: 0.72, regime: "HOT" as const, note: "Hit in #01577" },
  { ball: 7,  hitsW150: 23, hitsW100: 15, hitsW50: 8,  hitsW20: 3, hitsW10: 2, hitsAllTime: 216, skipGap: 2, zScore150: 0.72, regime: "HOT" as const, note: "Persistent Upper Quartile" },
  { ball: 12, hitsW150: 23, hitsW100: 15, hitsW50: 8,  hitsW20: 3, hitsW10: 2, hitsAllTime: 215, skipGap: 2, zScore150: 0.72, regime: "HOT" as const, note: "Persistent Upper Quartile" },
  { ball: 2,  hitsW150: 23, hitsW100: 15, hitsW50: 7,  hitsW20: 3, hitsW10: 2, hitsAllTime: 214, skipGap: 1, zScore150: 0.72, regime: "HOT" as const, note: "Persistent Upper Quartile" },
  { ball: 30, hitsW150: 23, hitsW100: 15, hitsW50: 7,  hitsW20: 2, hitsW10: 1, hitsAllTime: 213, skipGap: 3, zScore150: 0.72, regime: "HOT" as const, note: "Persistent Upper Quartile" },
  { ball: 6,  hitsW150: 22, hitsW100: 14, hitsW50: 7,  hitsW20: 2, hitsW10: 1, hitsAllTime: 211, skipGap: 3, zScore150: 0.48, regime: "HOT" as const, note: "Above Expectation" },
  { ball: 27, hitsW150: 18, hitsW100: 14, hitsW50: 11, hitsW20: 7, hitsW10: 3, hitsAllTime: 205, skipGap: 1, zScore150: -0.48, regime: "HOT" as const, note: "Short-Term Velocity Surge: 7 hits in last 20 draws (vs 2.67 exp)" },
  { ball: 8,  hitsW150: 17, hitsW100: 10, hitsW50: 2,  hitsW20: 0, hitsW10: 0, hitsAllTime: 196, skipGap: 21, zScore150: -0.72, regime: "OVERDUE" as const, note: "0 hits in last 20 draws, only 2 in last 50" },
  { ball: 25, hitsW150: 16, hitsW100: 11, hitsW50: 5,  hitsW20: 1, hitsW10: 0, hitsAllTime: 192, skipGap: 14, zScore150: -0.96, regime: "COLD" as const, note: "Cold / Rebound Zone" },
  { ball: 21, hitsW150: 16, hitsW100: 10, hitsW50: 4,  hitsW20: 1, hitsW10: 0, hitsAllTime: 190, skipGap: 15, zScore150: -0.96, regime: "COLD" as const, note: "Cold / Rebound Zone" },
  { ball: 39, hitsW150: 16, hitsW100: 10, hitsW50: 4,  hitsW20: 1, hitsW10: 0, hitsAllTime: 189, skipGap: 13, zScore150: -0.96, regime: "COLD" as const, note: "Cold / Rebound Zone" },
  { ball: 24, hitsW150: 16, hitsW100: 10, hitsW50: 4,  hitsW20: 1, hitsW10: 0, hitsAllTime: 188, skipGap: 16, zScore150: -0.96, regime: "COLD" as const, note: "Cold / Rebound Zone" },
  { ball: 40, hitsW150: 16, hitsW100: 11, hitsW50: 5,  hitsW20: 2, hitsW10: 1, hitsAllTime: 191, skipGap: 0, zScore150: -0.96, regime: "COLD" as const, note: "Rebounded in #01577" },
  { ball: 14, hitsW150: 14, hitsW100: 9,  hitsW50: 3,  hitsW20: 0, hitsW10: 0, hitsAllTime: 182, skipGap: 18, zScore150: -1.44, regime: "OVERDUE" as const, note: "#2 Coldest Over 150 Draws (14 hits)" },
  { ball: 5,  hitsW150: 13, hitsW100: 8,  hitsW50: 2,  hitsW20: 0, hitsW10: 0, hitsAllTime: 178, skipGap: 19, zScore150: -1.68, regime: "OVERDUE" as const, note: "#1 Coldest Over 150 Draws (13 hits, -1.68σ, 2 in 50)" },
];

/**
 * Macro-State Hypergeometric Parity & Low/High Distribution Data (from PDF Page 5-8)
 */
export const MACRO_PARITY_DISTRIBUTION = [
  {
    state: "0O-6E / 0L-6H",
    shortLabel: "0:6",
    megaPct: 0.9,
    powerPct: 1.0,
    megaCombos: 74613,
    powerCombos: 296010,
    isCore: false,
  },
  {
    state: "1O-5E / 1L-5H",
    shortLabel: "1:5",
    megaPct: 7.4,
    powerPct: 7.8,
    megaCombos: 605904,
    powerCombos: 2249676,
    isCore: false,
  },
  {
    state: "2O-4E / 4L-2H ★",
    shortLabel: "2:4",
    megaPct: 22.72,
    powerPct: 22.88,
    megaCombos: 1850695,
    powerCombos: 6633900,
    isCore: true,
  },
  {
    state: "3O-3E / 3L-3H ★",
    shortLabel: "3:3",
    megaPct: 33.48,
    powerPct: 33.05,
    megaCombos: 2727340,
    powerCombos: 9582300,
    isCore: true,
  },
  {
    state: "4O-2E / 2L-4H ★",
    shortLabel: "4:2",
    megaPct: 25.11,
    powerPct: 24.79,
    megaCombos: 2045505,
    powerCombos: 7186725,
    isCore: true,
  },
  {
    state: "5O-1E / 5L-1H",
    shortLabel: "5:1",
    megaPct: 9.1,
    powerPct: 9.2,
    megaCombos: 740610,
    powerCombos: 2661960,
    isCore: false,
  },
  {
    state: "6O-0E / 6L-0H",
    shortLabel: "6:0",
    megaPct: 1.2,
    powerPct: 1.3,
    megaCombos: 100947,
    powerCombos: 376740,
    isCore: false,
  },
];

export const CONSECUTIVE_PAIR_INCIDENCE = [
  {
    game: "Mega 6/45 (8.15M)",
    zeroConsecutivePct: 47.13,
    zeroConsecutiveCombos: 3838380,
    atLeastOnePairPct: 52.87,
    atLeastOnePairCombos: 4306680,
  },
  {
    game: "Power 6/55 (28.99M)",
    zeroConsecutivePct: 54.82,
    zeroConsecutiveCombos: 15890700,
    atLeastOnePairPct: 45.18,
    atLeastOnePairCombos: 13098975,
  },
];
