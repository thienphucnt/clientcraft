#!/usr/bin/env node
/**
 * 100% Cloud-Autonomous Vietlott QuantMatrix Pro Sync, Retrospective & 8-Factor Evolution Script
 * Executed automatically in the cloud by GitHub Actions (.github/workflows/daily-vietlott-cloud-evolver.yml)
 * every day at 19:10 & 19:50 Asia/Ho_Chi_Minh (ICT) without requiring any local machine to be online.
 */

import fs from "node:fs";
import path from "node:path";

const WORKSPACE_ROOT = path.resolve(import.meta.dirname, "..");
const SEED_FILE = path.join(WORKSPACE_ROOT, "src/data/empiricalSeed2026.ts");
const RETRO_LOG_FILE = path.join(WORKSPACE_ROOT, "RETROSPECTIVE_CLOUD_LOG.md");

const SOURCES = {
  power655Jsonl:
    "https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/power655.jsonl",
  mega645Jsonl:
    "https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/power645.jsonl",
  minhNgocPower:
    "https://www.minhngoc.net.vn/ket-qua-xo-so/dien-toan-vietlott/power-6x55.html",
  minhNgocMega:
    "https://www.minhngoc.net.vn/ket-qua-xo-so/dien-toan-vietlott/mega-6x45.html",
};

async function fetchJsonlTail(url, count = 200) {
  const res = await fetch(url, {
    headers: { "User-Agent": "VietlottQuantMatrixPro-CloudEvolver/3.0" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} fetching ${url}`);
  }
  const text = await res.text();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const parsed = lines
    .slice(-count)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  return { totalDraws: lines.length, recentDraws: parsed };
}

function parseDigits(raw) {
  if (!raw) return undefined;
  const digits = raw.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  const val = Number(digits);
  return Number.isFinite(val) && val > 0 ? val : undefined;
}

async function fetchMinhNgocJackpot(url, gameType) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "VietlottQuantMatrixPro-CloudEvolver/3.0" },
    });
    if (!res.ok) return null;
    const html = await res.text();

    const idMatch =
      html.match(/id="DT6X[45]5_KY_VE"[^>]*>\s*#?(\d+)/i) ||
      html.match(/Kỳ vé:\s*<span[^>]*>#?(\d+)/i);

    const dateMatch =
      html.match(/Ng(?:à|&agrave;)y quay thưởng\s*(\d{1,2}\/\d{1,2}\/\d{4})/i) ||
      html.match(/NGÀY:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);

    let dateIso = undefined;
    if (dateMatch) {
      const parts = dateMatch[1].split("/");
      if (parts.length === 3) {
        dateIso = `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
      }
    }

    const firstUl = html.match(/<ul class="result-number">[\s\S]*?<\/ul>/i);
    let mainNums = undefined;
    let bonusNum = undefined;

    if (firstUl) {
      const ballMatches = [
        ...firstUl[0].matchAll(/<div class="finnish(\d) bool">(\d+)<\/div>/g),
      ];
      const main = [];
      for (const m of ballMatches) {
        const pos = parseInt(m[1], 10);
        const val = parseInt(m[2], 10);
        if (pos >= 1 && pos <= 6) {
          main.push(val);
        } else if (pos === 7) {
          bonusNum = val;
        }
      }
      if (main.length === 6) {
        mainNums = main.sort((a, b) => a - b);
      }
    }

    if (gameType === "6/55") {
      const jp1Match = html.match(/id="DT6X[45]5_G_JACKPOT"[^>]*>\s*([0-9.,]+)/i);
      const jp2Match = html.match(/id="DT6X55_G_JACKPOT2"[^>]*>\s*([0-9.,]+)/i);
      const w1Match = html.match(/id="DT6X[45]5_S_JACKPOT"[^>]*>\s*(\d+)/i);
      const w2Match = html.match(/id="DT6X55_S_JACKPOT2"[^>]*>\s*(\d+)/i);
      return {
        gameType,
        drawId: idMatch?.[1] ? String(idMatch[1]).padStart(5, "0") : undefined,
        date: dateIso,
        numbers: mainNums,
        bonus: bonusNum,
        jackpot1Vnd: parseDigits(jp1Match?.[1]),
        jackpot2Vnd: parseDigits(jp2Match?.[1]),
        jp1Winners: w1Match?.[1] !== undefined ? Number(w1Match[1]) : 0,
        jp2Winners: w2Match?.[1] !== undefined ? Number(w2Match[1]) : 0,
      };
    } else {
      const jp1Match = html.match(/id="DT6X[45]5_G_JACKPOT"[^>]*>\s*([0-9.,]+)/i);
      const w1Match = html.match(/id="DT6X[45]5_S_JACKPOT"[^>]*>\s*(\d+)/i);
      return {
        gameType,
        drawId: idMatch?.[1] ? String(idMatch[1]).padStart(5, "0") : undefined,
        date: dateIso,
        numbers: mainNums,
        jackpot1Vnd: parseDigits(jp1Match?.[1]),
        jp1Winners: w1Match?.[1] !== undefined ? Number(w1Match[1]) : 0,
      };
    }
  } catch {
    return null;
  }
}

function getWeekdayName(dateStr) {
  const dt = new Date(`${dateStr}T12:00:00+07:00`);
  return dt.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function computeMomentumScore(hits, maxNum) {
  const p = 6 / maxNum;
  const z = (k, w) => {
    const mu = w * p;
    const sd = Math.sqrt(w * p * (1 - p));
    return sd > 0 ? (k - mu) / sd : 0;
  };
  return (
    0.3 * z(hits.w10, 10) +
    0.25 * z(hits.w20, 20) +
    0.2 * z(hits.w50, 50) +
    0.15 * z(hits.w100, 100) +
    0.1 * z(hits.w150, 150)
  );
}

function computeSurvivalHazardScore(skipGap, maxNum) {
  const muGap = maxNum / 6 - 1;
  if (skipGap <= 0) return 0.1;
  const ratio = skipGap / muGap;
  if (ratio <= 2.4) {
    return Math.min(1.35, 0.25 + 0.65 * Math.sin((ratio / 2.4) * Math.PI * 0.75));
  }
  return Math.max(0.35, 1.15 - (ratio - 2.4) * 0.15);
}

function computeSignalsForHistory(historyNewestFirst, maxNum) {
  const d0 = historyNewestFirst[0]?.main ?? [];
  const d1 = historyNewestFirst[1]?.main ?? [];
  const d2 = historyNewestFirst[2]?.main ?? [];
  const b0 = historyNewestFirst[0]?.bonus;
  const b1 = historyNewestFirst[1]?.bonus;
  const b2 = historyNewestFirst[2]?.bonus;

  const set0 = new Set(d0);
  const set1 = new Set(d1);
  const set2 = new Set(d2);
  const recentUnion = new Set([...d0, ...d1]);
  const pool2WithBonus = new Set([
    ...d0,
    ...(b0 !== undefined ? [b0] : []),
    ...d1,
    ...(b1 !== undefined ? [b1] : []),
  ]);
  const pool3WithBonus = new Set([
    ...pool2WithBonus,
    ...d2,
    ...(b2 !== undefined ? [b2] : []),
  ]);

  const decadeCount0 = new Map();
  const decadeCount1 = new Map();
  for (const x of d0) {
    const dec = Math.floor((x - 1) / 10);
    decadeCount0.set(dec, (decadeCount0.get(dec) ?? 0) + 1);
  }
  for (const x of d1) {
    const dec = Math.floor((x - 1) / 10);
    decadeCount1.set(dec, (decadeCount1.get(dec) ?? 0) + 1);
  }

  const window120 = historyNewestFirst.slice(0, 120);
  const out = [];

  for (let b = 1; b <= maxNum; b++) {
    let expSurge = 0;
    const w10Len = Math.min(10, historyNewestFirst.length);
    for (let j = 0; j < w10Len; j++) {
      if (historyNewestFirst[j].main.includes(b)) {
        expSurge += Math.pow(0.82, j);
      } else if (historyNewestFirst[j].bonus === b) {
        expSurge += 0.55 * Math.pow(0.82, j);
      }
    }
    const shortSurge = Math.min(1, expSurge / 2.2);

    let lagRepeat = 0;
    if (set0.has(b)) lagRepeat += 0.55;
    if (b0 === b) lagRepeat += 0.42;
    if (set1.has(b)) lagRepeat += 0.68;
    if (b1 === b) lagRepeat += 0.38;
    if (set2.has(b)) lagRepeat += 0.32;
    lagRepeat = Math.min(1, lagRepeat);

    let coHits = 0;
    let anchorDraws = 0;
    for (const d of window120) {
      if (d.main.some((x) => recentUnion.has(x))) {
        anchorDraws++;
        if (d.main.includes(b)) coHits++;
      }
    }
    const companionLift =
      anchorDraws > 0
        ? Math.min(1, coHits / anchorDraws / (6 / maxNum) / 2.2)
        : 0.4;

    const countW = (w) =>
      historyNewestFirst.slice(0, w).filter((d) => d.main.includes(b)).length;
    const hits = {
      w10: countW(10),
      w20: countW(20),
      w50: countW(50),
      w100: countW(100),
      w150: countW(150),
    };
    const mZ = computeMomentumScore(hits, maxNum);
    const multiHorizon = Math.max(0, Math.min(1, 0.48 + mZ * 0.2));

    let skipGap = historyNewestFirst.length;
    for (let idx = 0; idx < historyNewestFirst.length; idx++) {
      if (historyNewestFirst[idx].main.includes(b)) {
        skipGap = idx;
        break;
      }
    }
    const rScore = computeSurvivalHazardScore(skipGap, maxNum);
    const restedHotBonus =
      skipGap >= 2 && skipGap <= 6 && hits.w20 >= 3 ? 0.28 : 0;
    const survivalRebound = Math.min(1, rScore / 1.35 + restedHotBonus);

    let neighborMagnet = 0;
    if (set0.has(b - 1) || set0.has(b + 1) || b0 === b - 1 || b0 === b + 1)
      neighborMagnet += 0.58;
    if (set1.has(b - 1) || set1.has(b + 1) || b1 === b - 1 || b1 === b + 1)
      neighborMagnet += 0.42;
    neighborMagnet = Math.min(1, neighborMagnet);

    let bridgeMidpoint = 0;
    if (pool2WithBonus.has(b - 1) && pool2WithBonus.has(b + 1))
      bridgeMidpoint += 0.72;
    if (pool2WithBonus.has(b - 2) && pool2WithBonus.has(b + 2))
      bridgeMidpoint += 0.55;
    if (pool3WithBonus.has(b - 1) && pool3WithBonus.has(b + 1))
      bridgeMidpoint += 0.28;
    bridgeMidpoint = Math.min(1, bridgeMidpoint);

    const dec = Math.floor((b - 1) / 10);
    const c0 = decadeCount0.get(dec) ?? 0;
    const c1 = decadeCount1.get(dec) ?? 0;
    let decadeRebound = 0.3;
    if (c0 === 0 && c1 === 0) decadeRebound = 0.92;
    else if (c0 === 0) decadeRebound = 0.75;
    else if (c0 === 1 && c1 === 0) decadeRebound = 0.46;
    else if (c0 >= 3) decadeRebound = 0.14;

    out.push({
      ball: b,
      shortSurge,
      lagRepeat,
      companionLift,
      multiHorizon,
      survivalRebound,
      neighborMagnet,
      bridgeMidpoint,
      decadeRebound,
      skipGap,
    });
  }
  return out;
}

function learn8FactorWeightsAndPools(rawDrawsChronological, maxNum, gameType) {
  const historyNewestFirst = [...rawDrawsChronological]
    .map((d) => ({
      id: String(d.id).padStart(5, "0"),
      date: d.date,
      main: d.result.slice(0, 6).map(Number).sort((a, b) => a - b),
      bonus: gameType === "6/55" && d.result.length >= 7 ? Number(d.result[6]) : undefined,
    }))
    .reverse();

  const weights = {
    shortSurge: 0.17,
    lagRepeat: 0.18,
    companionLift: 0.13,
    multiHorizon: 0.13,
    survivalRebound: 0.1,
    neighborMagnet: 0.11,
    bridgeMidpoint: 0.09,
    decadeRebound: 0.09,
  };

  const factorKeys = Object.keys(weights);
  const steps = Math.min(18, Math.max(0, historyNewestFirst.length - 4));
  const learningRate = 0.36;
  const effectiveTarget = gameType === "6/55" ? 6.5 : 6;
  const expectedTop14 = (effectiveTarget * 14) / maxNum;

  for (let step = steps; step >= 1; step--) {
    const targetDraw = historyNewestFirst[step - 1];
    const targetSet = new Set(targetDraw.main);
    const targetBonus = targetDraw.bonus;
    const slice = historyNewestFirst.slice(step);
    const sigs = computeSignalsForHistory(slice, maxNum);
    const recency = Math.pow(0.92, step - 1);

    for (const key of factorKeys) {
      const top14 = [...sigs]
        .sort((a, b) => b[key] - a[key] || a.ball - b.ball)
        .slice(0, 14);
      const mainH = top14.filter((x) => targetSet.has(x.ball)).length;
      const bonusH =
        targetBonus !== undefined && top14.some((x) => x.ball === targetBonus)
          ? 0.5
          : 0;
      const adv = (mainH + bonusH - expectedTop14) / 6;
      weights[key] = weights[key] * Math.exp(learningRate * recency * adv);
    }

    const sumW = Object.values(weights).reduce((a, b) => a + b, 0);
    for (const key of factorKeys) {
      weights[key] = Number((weights[key] / sumW).toFixed(4));
    }
  }

  const currentSigs = computeSignalsForHistory(historyNewestFirst, maxNum);
  const scored = currentSigs.map((sig) => {
    const comp =
      weights.shortSurge * sig.shortSurge +
      weights.lagRepeat * sig.lagRepeat +
      weights.companionLift * sig.companionLift +
      weights.multiHorizon * sig.multiHorizon +
      weights.survivalRebound * sig.survivalRebound +
      weights.neighborMagnet * sig.neighborMagnet +
      weights.bridgeMidpoint * sig.bridgeMidpoint +
      weights.decadeRebound * sig.decadeRebound;
    const convictionWeight = Math.max(
      25,
      Math.round(30 + Math.pow(comp, 1.35) * 280)
    );
    const rScore = computeSurvivalHazardScore(sig.skipGap, maxNum);
    return {
      ball: sig.ball,
      convictionWeight,
      hazardScore:
        rScore +
        (sig.skipGap >= 7 ? 0.35 : 0) +
        sig.survivalRebound * 0.4 +
        sig.decadeRebound * 0.25,
    };
  });

  const sortedHot = [...scored]
    .sort((a, b) => b.convictionWeight - a.convictionWeight || a.ball - b.ball)
    .slice(0, 22);
  const sortedCold = [...scored]
    .sort((a, b) => b.hazardScore - a.hazardScore || a.ball - b.ball)
    .slice(0, 12);

  return {
    latest: historyNewestFirst[0],
    second: historyNewestFirst[1],
    hotPool: sortedHot.map((x) => x.ball),
    hotWeights: sortedHot.map((x) => x.convictionWeight),
    coldOverduePool: sortedCold.map((x) => x.ball),
    masterCorePool: sortedHot.slice(0, 14).map((x) => x.ball),
    learnedWeights: weights,
  };
}

function buildSeedDrawEntryCode(drawObj, gameType, jpInfo) {
  const id = String(drawObj.id).padStart(5, "0");
  const date = drawObj.date;
  const weekday = getWeekdayName(date);
  const main = drawObj.result
    .slice(0, 6)
    .map(Number)
    .sort((a, b) => a - b);
  const bonus =
    gameType === "6/55" && drawObj.result.length >= 7
      ? Number(drawObj.result[6])
      : undefined;
  const sum = main.reduce((a, b) => a + b, 0);
  const odds = main.filter((n) => n % 2 === 1).length;
  const mid = gameType === "6/55" ? 27 : 22;
  const lows = main.filter((n) => n <= mid).length;

  let consecPairs = 0;
  const consecList = [];
  for (let i = 0; i < 5; i++) {
    if (main[i + 1] - main[i] === 1) {
      consecPairs++;
      consecList.push(
        `${String(main[i]).padStart(2, "0")}-${String(main[i + 1]).padStart(2, "0")}`
      );
    }
  }

  const jp1Vnd =
    jpInfo?.drawId === id && jpInfo?.jackpot1Vnd
      ? jpInfo.jackpot1Vnd
      : gameType === "6/55"
      ? 42_432_448_800
      : 13_500_000_000;
  const jp2Vnd =
    gameType === "6/55"
      ? jpInfo?.drawId === id && jpInfo?.jackpot2Vnd
        ? jpInfo.jackpot2Vnd
        : 5_618_647_400
      : undefined;
  const jp1Winners =
    jpInfo?.drawId === id && jpInfo?.jp1Winners !== undefined
      ? jpInfo.jp1Winners
      : 0;
  const jp2Winners =
    gameType === "6/55"
      ? jpInfo?.drawId === id && jpInfo?.jp2Winners !== undefined
        ? jpInfo.jp2Winners
        : 0
      : undefined;

  const lines = [
    `  {`,
    `    id: "${id}",`,
    `    date: "${date}",`,
    `    weekday: "${weekday}",`,
    `    gameType: "${gameType}",`,
    `    numbers: [${main.join(", ")}],`,
  ];
  if (bonus !== undefined) {
    lines.push(`    bonus: ${bonus},`);
  }
  lines.push(`    sum: ${sum},`);
  lines.push(`    oddEven: "${odds}O-${6 - odds}E",`);
  lines.push(`    lowHigh: "${lows}L-${6 - lows}H",`);
  lines.push(`    consecPairs: ${consecPairs},`);
  if (consecList.length > 0) {
    lines.push(`    consecDetail: "${consecList.join(", ")}",`);
  }
  lines.push(`    jackpot1Vnd: ${jp1Vnd.toLocaleString("en-US").replace(/,/g, "_")},`);
  if (jp2Vnd !== undefined) {
    lines.push(`    jackpot2Vnd: ${jp2Vnd.toLocaleString("en-US").replace(/,/g, "_")},`);
  }
  lines.push(`    jp1Winners: ${jp1Winners},`);
  if (jp2Winners !== undefined) {
    lines.push(`    jp2Winners: ${jp2Winners},`);
  }
  if (jp1Winners > 0) {
    lines.push(`    isJackpotWon: true,`);
  }
  lines.push(`  },`);
  return lines.join("\n");
}

function updateGameConfigBlockInSeed(seedContent, gameKey, evolved, jpInfo) {
  const blockStartMarker = `"${gameKey}": {`;
  const startIdx = seedContent.indexOf(blockStartMarker);
  if (startIdx < 0) return seedContent;

  const nextMarker =
    gameKey === "6/55"
      ? `"6/45": {`
      : `export const POWER_655_SEED_DRAWS`;
  const endIdx = seedContent.indexOf(nextMarker, startIdx);
  if (endIdx < 0) return seedContent;

  let block = seedContent.slice(startIdx, endIdx);
  const latestId = evolved.latest.id;
  const latestDate = evolved.latest.date;
  const nextId = String(Number(latestId) + 1).padStart(5, "0");

  const minJp1 = gameKey === "6/55" ? 30_000_000_000 : 12_000_000_000;
  let curJp1 =
    jpInfo?.drawId === latestId && jpInfo?.jackpot1Vnd
      ? jpInfo.jackpot1Vnd
      : undefined;
  if (curJp1 && jpInfo?.jp1Winners && jpInfo.jp1Winners > 0 && curJp1 > minJp1 * 1.3) {
    curJp1 = minJp1;
  }

  let curJp2 =
    gameKey === "6/55" && jpInfo?.drawId === latestId && jpInfo?.jackpot2Vnd
      ? jpInfo.jackpot2Vnd
      : undefined;
  if (
    curJp2 &&
    jpInfo?.jp2Winners &&
    jpInfo.jp2Winners > 0 &&
    curJp2 > 3_500_000_000
  ) {
    curJp2 = 3_000_000_000;
  }

  block = block.replace(/latestDrawId:\s*"[^"]+"/, `latestDrawId: "${latestId}"`);
  block = block.replace(
    /latestDrawDate:\s*"[^"]+"/,
    `latestDrawDate: "${latestDate}"`
  );
  block = block.replace(/nextDrawId:\s*"[^"]+"/, `nextDrawId: "${nextId}"`);

  if (curJp1) {
    const mult = Number((curJp1 / minJp1).toFixed(2));
    block = block.replace(
      /currentJackpot1Vnd:\s*[0-9_]+/,
      `currentJackpot1Vnd: ${curJp1.toLocaleString("en-US").replace(/,/g, "_")}`
    );
    block = block.replace(/seedMultiplier:\s*[0-9.]+/, `seedMultiplier: ${mult}`);
  }
  if (curJp2 && gameKey === "6/55") {
    block = block.replace(
      /currentJackpot2Vnd:\s*[0-9_]+/,
      `currentJackpot2Vnd: ${curJp2.toLocaleString("en-US").replace(/,/g, "_")}`
    );
  }

  block = block.replace(
    /hotPool:\s*\[[\s\S]*?\]/,
    `hotPool: [\n      ${evolved.hotPool.join(", ")},\n    ]`
  );
  block = block.replace(
    /hotWeights:\s*\[[\s\S]*?\]/,
    `hotWeights: [\n      ${evolved.hotWeights.join(", ")},\n    ]`
  );
  block = block.replace(
    /coldOverduePool:\s*\[[\s\S]*?\]/,
    `coldOverduePool: [${evolved.coldOverduePool.join(", ")}]`
  );
  block = block.replace(
    /masterCorePool:\s*\[[\s\S]*?\]/,
    `masterCorePool: [${evolved.masterCorePool.join(", ")}]`
  );

  const w = evolved.learnedWeights;
  const weightsBlock = `learnedWeights: {
      shortSurge: ${w.shortSurge},
      lagRepeat: ${w.lagRepeat},
      companionLift: ${w.companionLift},
      multiHorizon: ${w.multiHorizon},
      survivalRebound: ${w.survivalRebound},
      neighborMagnet: ${w.neighborMagnet},
      bridgeMidpoint: ${w.bridgeMidpoint},
      decadeRebound: ${w.decadeRebound},
    }`;
  block = block.replace(/learnedWeights:\s*\{[\s\S]*?\}/, weightsBlock);

  const top2Block = `recentDrawsTop2: [
      [${evolved.latest.main.join(", ")}], // #${evolved.latest.id} (${evolved.latest.date})
      [${evolved.second.main.join(", ")}], // #${evolved.second.id} (${evolved.second.date})
    ]`;
  block = block.replace(/recentDrawsTop2:\s*\[[\s\S]*?\n    \]/, top2Block);

  return seedContent.slice(0, startIdx) + block + seedContent.slice(endIdx);
}

async function main() {
  const [powerData, megaData, powerJp, megaJp] = await Promise.all([
    fetchJsonlTail(SOURCES.power655Jsonl, 220),
    fetchJsonlTail(SOURCES.mega645Jsonl, 220),
    fetchMinhNgocJackpot(SOURCES.minhNgocPower, "6/55"),
    fetchMinhNgocJackpot(SOURCES.minhNgocMega, "6/45"),
  ]);

  let latestPower = powerData.recentDraws.at(-1);
  if (
    powerJp?.drawId &&
    powerJp.numbers?.length === 6 &&
    (!latestPower || Number(powerJp.drawId) > Number(latestPower.id))
  ) {
    const liveDraw = {
      date: powerJp.date || new Date().toISOString().slice(0, 10),
      id: powerJp.drawId,
      result: powerJp.bonus
        ? [...powerJp.numbers, powerJp.bonus]
        : powerJp.numbers,
    };
    powerData.recentDraws.push(liveDraw);
    latestPower = liveDraw;
  }

  let latestMega = megaData.recentDraws.at(-1);
  if (
    megaJp?.drawId &&
    megaJp.numbers?.length === 6 &&
    (!latestMega || Number(megaJp.drawId) > Number(latestMega.id))
  ) {
    const liveDraw = {
      date: megaJp.date || new Date().toISOString().slice(0, 10),
      id: megaJp.drawId,
      result: megaJp.numbers,
    };
    megaData.recentDraws.push(liveDraw);
    latestMega = liveDraw;
  }

  const powerEvolved = learn8FactorWeightsAndPools(
    powerData.recentDraws,
    55,
    "6/55"
  );
  const megaEvolved = learn8FactorWeightsAndPools(
    megaData.recentDraws,
    45,
    "6/45"
  );

  let seedText = fs.readFileSync(SEED_FILE, "utf8");
  const existingIds = new Set(
    [...seedText.matchAll(/id:\s*"(\d{5})"/g)].map((m) => m[1])
  );

  // Insert any missing recent Power 6/55 draws at the top of POWER_655_SEED_DRAWS
  const missingPower = powerData.recentDraws
    .slice(-5)
    .filter((d) => !existingIds.has(String(d.id).padStart(5, "0")))
    .reverse();

  if (missingPower.length > 0) {
    const entriesCode = missingPower
      .map((d) => buildSeedDrawEntryCode(d, "6/55", powerJp))
      .join("\n");
    seedText = seedText.replace(
      "export const POWER_655_SEED_DRAWS: HistoricalDraw[] = [\n",
      `export const POWER_655_SEED_DRAWS: HistoricalDraw[] = [\n${entriesCode}\n`
    );
  }

  // Insert any missing recent Mega 6/45 draws at the top of MEGA_645_SEED_DRAWS
  const missingMega = megaData.recentDraws
    .slice(-5)
    .filter((d) => !existingIds.has(String(d.id).padStart(5, "0")))
    .reverse();

  if (missingMega.length > 0) {
    const entriesCode = missingMega
      .map((d) => buildSeedDrawEntryCode(d, "6/45", megaJp))
      .join("\n");
    seedText = seedText.replace(
      "export const MEGA_645_SEED_DRAWS: HistoricalDraw[] = [\n",
      `export const MEGA_645_SEED_DRAWS: HistoricalDraw[] = [\n${entriesCode}\n`
    );
  }

  // Update GAME_CONFIGS for both 6/55 and 6/45
  seedText = updateGameConfigBlockInSeed(
    seedText,
    "6/55",
    powerEvolved,
    powerJp
  );
  seedText = updateGameConfigBlockInSeed(seedText, "6/45", megaEvolved, megaJp);

  fs.writeFileSync(SEED_FILE, seedText, "utf8");

  // Update default fallback date in UI components to the newest settled draw date
  const newestDateIso =
    powerEvolved.latest.date > megaEvolved.latest.date
      ? powerEvolved.latest.date
      : megaEvolved.latest.date;

  for (const relPath of [
    "src/app/page.tsx",
    "src/components/ExecutiveHeader.tsx",
    "src/components/RollingForecastMatrix.tsx",
  ]) {
    const fullP = path.join(WORKSPACE_ROOT, relPath);
    if (fs.existsSync(fullP)) {
      const content = fs.readFileSync(fullP, "utf8");
      const updated = content.replace(
        /useState<string>\("2026-\d{2}-\d{2}"\)/g,
        `useState<string>("${newestDateIso}")`
      );
      if (updated !== content) {
        fs.writeFileSync(fullP, updated, "utf8");
      }
    }
  }

  // Write Cloud Retrospective Audit Log
  const ictNow = new Date().toLocaleString("sv-SE", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const logMd = `# Vietlott QuantMatrix Pro — Autonomous Cloud Retrospective & Evolution Log

- **Last Cloud Evolution Run (ICT)**: \`${ictNow} (Asia/Ho_Chi_Minh)\`
- **Engine Architecture**: \`v3.0 8-Factor Multiplicative-Weights Hedge + t=3 Abbreviated Combinatorial Wheel (5 × 6-Number Standard Tickets)\`

## 1. Latest Power 6/55 State (\`#${powerEvolved.latest.id}\` — \`${powerEvolved.latest.date}\`)
- **Winning Numbers**: \`[${powerEvolved.latest.main.map((n) => String(n).padStart(2, "0")).join(", ")}]\` | **JP2 Special Bonus**: \`${String(powerEvolved.latest.bonus ?? 0).padStart(2, "0")}\`
- **Live Jackpot 1**: \`${(powerJp?.jackpot1Vnd ?? 42432448800).toLocaleString("en-US")} VND\` (\`${powerJp?.jp1Winners ?? 0}\` winners)
- **Live Jackpot 2**: \`${(powerJp?.jackpot2Vnd ?? 5618647400).toLocaleString("en-US")} VND\` (\`${powerJp?.jp2Winners ?? 0}\` winners)
- **Recalibrated 14-Ball Master Wheel Pool (for Draw \`#${String(Number(powerEvolved.latest.id) + 1).padStart(5, "0")}\`)**: \`[${powerEvolved.masterCorePool.map((n) => String(n).padStart(2, "0")).join(", ")}]\`
- **Self-Learned 8-Factor Weights**: \`${JSON.stringify(powerEvolved.learnedWeights)}\`

## 2. Latest Mega 6/45 State (\`#${megaEvolved.latest.id}\` — \`${megaEvolved.latest.date}\`)
- **Winning Numbers**: \`[${megaEvolved.latest.main.map((n) => String(n).padStart(2, "0")).join(", ")}]\`
- **Live Jackpot**: \`${(megaJp?.jackpot1Vnd ?? 12000000000).toLocaleString("en-US")} VND\` (\`${megaJp?.jp1Winners ?? 0}\` winners)
- **Recalibrated 14-Ball Master Wheel Pool (for Draw \`#${String(Number(megaEvolved.latest.id) + 1).padStart(5, "0")}\`)**: \`[${megaEvolved.masterCorePool.map((n) => String(n).padStart(2, "0")).join(", ")}]\`
- **Self-Learned 8-Factor Weights**: \`${JSON.stringify(megaEvolved.learnedWeights)}\`
`;

  fs.writeFileSync(RETRO_LOG_FILE, logMd, "utf8");

  console.log(
    JSON.stringify(
      {
        status: "CLOUD_EVOLUTION_COMPLETE",
        syncedAtIct: ictNow,
        addedPowerDraws: missingPower.map((d) => d.id),
        addedMegaDraws: missingMega.map((d) => d.id),
        latestPowerId: powerEvolved.latest.id,
        latestPowerDate: powerEvolved.latest.date,
        latestPowerMasterPool: powerEvolved.masterCorePool,
        latestMegaId: megaEvolved.latest.id,
        latestMegaDate: megaEvolved.latest.date,
        latestMegaMasterPool: megaEvolved.masterCorePool,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error("Cloud Auto-Evolve Error:", err);
  process.exit(1);
});
