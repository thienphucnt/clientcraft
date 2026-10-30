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

export interface LearnedFactorWeights {
  shortSurge: number; // W5 & W10 exponential surge
  lagRepeat: number; // Lag-1 / Lag-2 / Lag-3 repeat carryover
  companionLift: number; // Conditional co-occurrence lift with last 2 draws
  multiHorizon: number; // W20 / W50 / W100 / W150 momentum
  survivalRebound: number; // Log-normal skip-gap rebound hazard
  neighborMagnet: number; // ±1 adjacent number shift magnet
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
  drawDays: number[];
  drawDaysLabel: string;
  cutoffTimeICT: string;
  broadcastWindowICT: string;
  hotPool: number[];
  hotWeights: number[];
  coldOverduePool: number[];
  recentDrawsTop2: number[][];
  masterCorePool?: number[];
  allBallConvictionMap?: Record<number, number>;
  learnedWeights?: LearnedFactorWeights;
}

export const GAME_CONFIGS: Record<GameType, GameConfig> = {
  "6/55": {
    gameType: "6/55",
    name: "Power 6/55",
    vietnameseName: "Vietlott Power 6/55",
    latestDrawId: "01417",
    latestDrawDate: "2026-10-29",
    nextDrawId: "01418",
    maxNum: 55,
    midPoint: 27,
    totalCombinations: 28989675,
    jp2Combinations: 4831612.5,
    minJackpot1Vnd: 30_000_000_000,
    minJackpot2Vnd: 3_000_000_000,
    spilloverThresholdVnd: 300_000_000_000,
    currentJackpot1Vnd: 33_944_640_150,
    currentJackpot2Vnd: 4_675_557_550,
    seedMultiplier: 1.13,
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
      41, 22, 34, 9, 18, 7, 14, 27, 31, 50, 45, 12, 19, 24, 44, 1, 11, 13, 20,
      23, 30, 35,
    ],
    hotWeights: [
      209, 208, 199, 196, 188, 186, 184, 183, 182, 181, 179, 179, 176, 175, 174,
      185, 184, 178, 173, 172, 171, 170,
    ],
    coldOverduePool: [8, 32, 3, 43, 49, 54, 5, 15, 26, 2, 40],
    recentDrawsTop2: [
      [9, 29, 33, 38, 45, 46], // #01417 (2026-10-29)
      [9, 18, 27, 28, 31, 35], // #01416 (2026-10-27)
    ],
  },
  "6/45": {
    gameType: "6/45",
    name: "Mega 6/45",
    vietnameseName: "Vietlott Mega 6/45",
    latestDrawId: "01582",
    latestDrawDate: "2026-10-30",
    nextDrawId: "01583",
    maxNum: 45,
    midPoint: 22,
    totalCombinations: 8145060,
    minJackpot1Vnd: 12_000_000_000,
    currentJackpot1Vnd: 20_852_928_000,
    seedMultiplier: 1.74,
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
      22, 40, 31, 41, 45, 11, 44, 16, 43, 7, 25, 36, 4, 10, 9, 12, 2, 30, 6,
      27, 21, 28,
    ],
    hotWeights: [
      33, 32, 31, 28, 27, 27, 28, 29, 28, 26, 25, 25, 24, 24, 24, 23, 24, 23,
      22, 25, 23, 23,
    ],
    coldOverduePool: [8, 24, 39, 34, 19, 17, 15, 29, 3, 18, 6, 37],
    recentDrawsTop2: [
      [7, 21, 22, 40, 41, 45], // #01582 (2026-10-30)
      [1, 9, 11, 28, 33, 42], // #01581 (2026-10-28)
    ],
  },
};

/**
 * Tier 2 Built-In Empirical Seed Database (Updated through Oct 30, 2026; automatically superseded by Tier 1 Live Sync)
 */
export const POWER_655_SEED_DRAWS: HistoricalDraw[] = [
  {
    id: "01417",
    date: "2026-10-29",
    weekday: "Thursday",
    gameType: "6/55",
    numbers: [9, 29, 33, 38, 45, 46],
    bonus: 53,
    sum: 200,
    oddEven: "4O-2E",
    lowHigh: "1L-5H",
    consecPairs: 1,
    consecDetail: "45-46",
    jackpot1Vnd: 33_944_640_150,
    jackpot2Vnd: 4_675_557_550,
    jp1Winners: 0,
    jp2Winners: 0,
  },
  {
    id: "01416",
    date: "2026-10-27",
    weekday: "Tuesday",
    gameType: "6/55",
    numbers: [9, 18, 27, 28, 31, 35],
    bonus: 50,
    sum: 148,
    oddEven: "4O-2E",
    lowHigh: "3L-3H",
    consecPairs: 1,
    consecDetail: "27-28",
    jackpot1Vnd: 31_758_267_450,
    jackpot2Vnd: 4_432_627_250,
    jp1Winners: 0,
    jp2Winners: 0,
  },
  {
    id: "01415",
    date: "2026-10-24",
    weekday: "Saturday",
    gameType: "6/55",
    numbers: [6, 7, 18, 41, 44, 50],
    bonus: 53,
    sum: 166,
    oddEven: "2O-4E",
    lowHigh: "3L-3H",
    consecPairs: 1,
    consecDetail: "06-07",
    jackpot1Vnd: 199_984_640_250,
    jackpot2Vnd: 4_237_264_200,
    jp1Winners: 1,
    jp2Winners: 0,
    isJackpotWon: true,
  },
  {
    id: "01414",
    date: "2026-10-22",
    weekday: "Thursday",
    gameType: "6/55",
    numbers: [14, 19, 24, 31, 34, 42],
    bonus: 37,
    sum: 164,
    oddEven: "2O-4E",
    lowHigh: "3L-3H",
    consecPairs: 0,
    jackpot1Vnd: 188_849_262_450,
    jackpot2Vnd: 3_285_995_250,
    jp1Winners: 0,
    jp2Winners: 2,
  },
  {
    id: "01413",
    date: "2026-10-20",
    weekday: "Tuesday",
    gameType: "6/55",
    numbers: [13, 20, 23, 30, 50, 55],
    bonus: 45,
    sum: 191,
    oddEven: "3O-3E",
    lowHigh: "3L-3H",
    consecPairs: 0,
    jackpot1Vnd: 177_132_635_850,
    jackpot2Vnd: 5_270_143_100,
    jp1Winners: 0,
    jp2Winners: 0,
  },
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

export const MEGA_645_SEED_DRAWS: HistoricalDraw[] = [
  {
    id: "01582",
    date: "2026-10-30",
    weekday: "Friday",
    gameType: "6/45",
    numbers: [7, 21, 22, 40, 41, 45],
    sum: 176,
    oddEven: "4O-2E",
    lowHigh: "3L-3H",
    consecPairs: 2,
    consecDetail: "21-22, 40-41",
    jackpot1Vnd: 20_852_928_000,
    jp1Winners: 0,
  },
  {
    id: "01581",
    date: "2026-10-28",
    weekday: "Wednesday",
    gameType: "6/45",
    numbers: [1, 9, 11, 28, 33, 42],
    sum: 124,
    oddEven: "4O-2E",
    lowHigh: "3L-3H",
    consecPairs: 0,
    jackpot1Vnd: 18_424_878_000,
    jp1Winners: 0,
  },
  {
    id: "01580",
    date: "2026-10-25",
    weekday: "Sunday",
    gameType: "6/45",
    numbers: [4, 13, 22, 25, 40, 41],
    sum: 145,
    oddEven: "3O-3E",
    lowHigh: "3L-3H",
    consecPairs: 1,
    consecDetail: "40-41",
    jackpot1Vnd: 16_103_186_000,
    jp1Winners: 0,
  },
  {
    id: "01579",
    date: "2026-10-23",
    weekday: "Friday",
    gameType: "6/45",
    numbers: [2, 5, 11, 22, 32, 40],
    sum: 112,
    oddEven: "2O-4E",
    lowHigh: "4L-2H",
    consecPairs: 0,
    jackpot1Vnd: 13_983_147_000,
    jp1Winners: 0,
  },
  {
    id: "01578",
    date: "2026-10-21",
    weekday: "Wednesday",
    gameType: "6/45",
    numbers: [4, 10, 14, 22, 25, 44],
    sum: 119,
    oddEven: "1O-5E",
    lowHigh: "4L-2H",
    consecPairs: 0,
    jackpot1Vnd: 31_281_381_500,
    jp1Winners: 1,
    isJackpotWon: true,
  },
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
    numbers: [9, 20, 26, 35, 36, 38],
    sum: 164,
    oddEven: "2O-4E",
    lowHigh: "2L-4H",
    consecPairs: 1,
    consecDetail: "35-36",
    jackpot1Vnd: 22_839_868_000,
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
    jackpot1Vnd: 20_329_744_500,
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
    jackpot1Vnd: 17_917_606_500,
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
    jackpot1Vnd: 15_889_161_000,
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
    jackpot1Vnd: 14_163_913_000,
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
    jackpot1Vnd: 199_576_277_000,
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
];

export const POWER_655_FREQUENCY_LEADERS = [
  { ball: 41, hitsAllTime: 209, hitsW150: 25, hitsW100: 17, hitsW50: 10, hitsW20: 5, hitsW10: 2, skipGap: 1, regime: "HOT" as const, note: "#1 All-Time Leader (Hit in #01415)" },
  { ball: 22, hitsAllTime: 208, hitsW150: 23, hitsW100: 15, hitsW50: 8, hitsW20: 3, hitsW10: 1, skipGap: 10, regime: "HOT" as const, note: "#2 All-Time Leader" },
  { ball: 34, hitsAllTime: 199, hitsW150: 23, hitsW100: 16, hitsW50: 9, hitsW20: 4, hitsW10: 2, skipGap: 2, regime: "HOT" as const, note: "#3 All-Time Frequency (Hit in #01414)" },
  { ball: 8,  hitsAllTime: 196, hitsW150: 19, hitsW100: 12, hitsW50: 5, hitsW20: 0, hitsW10: 0, skipGap: 21, regime: "OVERDUE" as const, note: "Dual-State Outlier: #4 All-Time yet 21-draw skip drought" },
  { ball: 9,  hitsAllTime: 195, hitsW150: 22, hitsW100: 15, hitsW50: 8, hitsW20: 3, hitsW10: 1, skipGap: 0, regime: "HOT" as const, note: "Hit in latest Draw #01416" },
  { ball: 18, hitsAllTime: 188, hitsW150: 23, hitsW100: 16, hitsW50: 9, hitsW20: 5, hitsW10: 3, skipGap: 0, regime: "HOT" as const, note: "Back-to-back hits in #01415 & #01416" },
  { ball: 7,  hitsAllTime: 186, hitsW150: 23, hitsW100: 16, hitsW50: 9, hitsW20: 6, hitsW10: 3, skipGap: 1, regime: "HOT" as const, note: "Hit in #01415 Jackpot win" },
  { ball: 27, hitsAllTime: 183, hitsW150: 21, hitsW100: 15, hitsW50: 8, hitsW20: 5, hitsW10: 2, skipGap: 0, regime: "HOT" as const, note: "Hit in latest Draw #01416" },
  { ball: 31, hitsAllTime: 182, hitsW150: 21, hitsW100: 15, hitsW50: 8, hitsW20: 4, hitsW10: 3, skipGap: 0, regime: "HOT" as const, note: "Hit in #01414 & #01416" },
  { ball: 50, hitsAllTime: 181, hitsW150: 20, hitsW100: 14, hitsW50: 8, hitsW20: 4, hitsW10: 3, skipGap: 1, regime: "HOT" as const, note: "Hit in #01413, #01415 & Bonus #01416" },
  { ball: 32, hitsAllTime: 151, hitsW150: 14, hitsW100: 10, hitsW50: 4, hitsW20: 0, hitsW10: 0, skipGap: 18, regime: "OVERDUE" as const, note: "18 consecutive draws absent" },
];

export const MEGA_645_TELEMETRY_LEADERS = [
  { ball: 31, hitsW150: 31, hitsW100: 20, hitsW50: 10, hitsW20: 5, hitsW10: 2, hitsAllTime: 248, skipGap: 3, zScore150: 2.64, regime: "HOT" as const, note: "#1 150-Draw Hot Leader" },
  { ball: 22, hitsW150: 28, hitsW100: 19, hitsW50: 11, hitsW20: 6, hitsW10: 4, hitsAllTime: 236, skipGap: 0, zScore150: 1.92, regime: "HOT" as const, note: "3 consecutive hits (#01578, #01579, #01580)!" },
  { ball: 40, hitsW150: 25, hitsW100: 17, hitsW50: 9,  hitsW20: 5, hitsW10: 3, hitsAllTime: 222, skipGap: 0, zScore150: 1.20, regime: "HOT" as const, note: "Hit in #01577, #01579 & #01580" },
  { ball: 16, hitsW150: 29, hitsW100: 19, hitsW50: 10, hitsW20: 3, hitsW10: 1, hitsAllTime: 239, skipGap: 4, zScore150: 2.16, regime: "HOT" as const, note: "#2 150-Draw Hot Leader" },
  { ball: 43, hitsW150: 28, hitsW100: 19, hitsW50: 9,  hitsW20: 3, hitsW10: 1, hitsAllTime: 235, skipGap: 5, zScore150: 1.92, regime: "HOT" as const, note: "#3 150-Draw Hot Leader" },
  { ball: 44, hitsW150: 25, hitsW100: 17, hitsW50: 9,  hitsW20: 4, hitsW10: 2, hitsAllTime: 220, skipGap: 2, zScore150: 1.20, regime: "HOT" as const, note: "Hit in #01577 & #01578" },
  { ball: 25, hitsW150: 22, hitsW100: 15, hitsW50: 8,  hitsW20: 3, hitsW10: 2, hitsAllTime: 210, skipGap: 0, zScore150: 0.48, regime: "HOT" as const, note: "Hit in #01578 & #01580" },
  { ball: 8,  hitsW150: 17, hitsW100: 10, hitsW50: 2,  hitsW20: 0, hitsW10: 0, hitsAllTime: 196, skipGap: 24, zScore150: -0.72, regime: "OVERDUE" as const, note: "24-draw severe skip drought" },
];

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
