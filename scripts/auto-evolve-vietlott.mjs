#!/usr/bin/env node
/**
 * Daily Vietlott QuantMatrix Auto-Evolver Telemetry, Live Sync & Missed-Day Catch-Up Detector
 * Used both by headless background Gemini 4 Argon (High) automation and diagnostics.
 */

import fs from "node:fs";
import path from "node:path";

const WORKSPACE_ROOT = path.resolve(import.meta.dirname, "..");
const SEED_FILE = path.join(WORKSPACE_ROOT, "src/data/empiricalSeed2026.ts");
const RETRO_STATE_FILE = path.join(
  WORKSPACE_ROOT,
  "src/data/argonRetrospectiveState.json"
);

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

async function fetchJsonlTail(url, count = 60) {
  const res = await fetch(url, {
    headers: { "User-Agent": "VietlottQuantMatrixPro-AutoEvolver/3.1" },
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
      headers: { "User-Agent": "VietlottQuantMatrixPro-AutoEvolver/3.1" },
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
        jp1Winners: w1Match?.[1] !== undefined ? Number(w1Match[1]) : undefined,
        jp2Winners: w2Match?.[1] !== undefined ? Number(w2Match[1]) : undefined,
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
        jp1Winners: w1Match?.[1] !== undefined ? Number(w1Match[1]) : undefined,
      };
    }
  } catch {
    return null;
  }
}

function computeDrawAttributionAtIndex(draws, idx, maxNum) {
  if (idx < 2 || !draws[idx]) return null;
  const maxDec = Math.floor((maxNum - 1) / 10);
  const target = draws[idx];
  const p1 = draws[idx - 1];
  const p2 = draws[idx - 2];
  const p1Main = p1.result.slice(0, 6).map(Number);
  const pool2 = new Set([...p1.result.map(Number), ...p2.result.map(Number)]);
  const emptyDecs = [];
  for (let d = 0; d <= maxDec; d++) {
    if (!p1Main.some((x) => Math.floor((x - 1) / 10) === d)) emptyDecs.push(d);
  }
  const targetMain = target.result.slice(0, 6).map(Number).sort((a, b) => a - b);
  const targetBonus =
    maxNum === 55 && target.result.length >= 7
      ? Number(target.result[6])
      : undefined;

  return {
    drawId: String(target.id).padStart(5, "0"),
    date: target.date,
    numbers: targetMain,
    ...(targetBonus !== undefined ? { bonus: targetBonus } : {}),
    emptyDecadesInPrevDraw: emptyDecs,
    emptyDecadeReboundWinners: targetMain.filter((b) =>
      emptyDecs.includes(Math.floor((b - 1) / 10))
    ),
    sandwichBridgeWinners: targetMain.filter(
      (b) =>
        (pool2.has(b - 1) && pool2.has(b + 1)) ||
        (pool2.has(b - 2) && pool2.has(b + 2))
    ),
    lag1To2RepeatWinners: targetMain.filter((b) => pool2.has(b)),
    neighborShiftWinners: targetMain.filter(
      (b) => pool2.has(b - 1) || pool2.has(b + 1)
    ),
  };
}

function evaluateSubModelHitRate(draws, maxNum) {
  if (draws.length < 10) return null;
  let lagRepeatHits = 0;
  let neighborHits = 0;
  let shortSurgeHits = 0;
  let sandwichBridgeHits = 0;
  let emptyDecadeHits = 0;
  let evaluatedDraws = 0;
  const maxDec = Math.floor((maxNum - 1) / 10);

  for (let idx = 5; idx < draws.length; idx++) {
    const target = draws[idx].result.slice(0, 6).map(Number);
    const prev1Main = draws[idx - 1].result.slice(0, 6).map(Number);
    const prev1 = new Set(draws[idx - 1].result.map(Number));
    const prev2 = new Set(draws[idx - 2].result.map(Number));
    const pool2 = new Set([...prev1, ...prev2]);

    const emptyDecs = new Set();
    for (let d = 0; d <= maxDec; d++) {
      if (!prev1Main.some((x) => Math.floor((x - 1) / 10) === d)) {
        emptyDecs.add(d);
      }
    }

    const prev5Counts = new Map();
    for (let k = idx - 5; k < idx; k++) {
      for (const n of draws[k].result.slice(0, 6).map(Number)) {
        prev5Counts.set(n, (prev5Counts.get(n) || 0) + 1);
      }
    }

    for (const ball of target) {
      if (prev1.has(ball) || prev2.has(ball)) lagRepeatHits++;
      if (prev1.has(ball - 1) || prev1.has(ball + 1)) neighborHits++;
      if ((prev5Counts.get(ball) || 0) >= 2) shortSurgeHits++;
      if (
        (pool2.has(ball - 1) && pool2.has(ball + 1)) ||
        (pool2.has(ball - 2) && pool2.has(ball + 2))
      ) {
        sandwichBridgeHits++;
      }
      if (emptyDecs.has(Math.floor((ball - 1) / 10))) {
        emptyDecadeHits++;
      }
    }
    evaluatedDraws++;
  }

  const latestDrawAttribution = computeDrawAttributionAtIndex(
    draws,
    draws.length - 1,
    maxNum
  );

  return {
    evaluatedDraws,
    maxNum,
    avgLagRepeatPerDraw: +(lagRepeatHits / evaluatedDraws).toFixed(2),
    avgNeighborShiftPerDraw: +(neighborHits / evaluatedDraws).toFixed(2),
    avgShortSurgePerDraw: +(shortSurgeHits / evaluatedDraws).toFixed(2),
    avgSandwichBridgePerDraw: +(sandwichBridgeHits / evaluatedDraws).toFixed(2),
    avgEmptyDecadeReboundPerDraw: +(emptyDecadeHits / evaluatedDraws).toFixed(2),
    latestDrawAttribution,
  };
}

function readRetroStateSafe() {
  try {
    if (fs.existsSync(RETRO_STATE_FILE)) {
      return JSON.parse(fs.readFileSync(RETRO_STATE_FILE, "utf8"));
    }
  } catch {
    // Fall back to defaults below
  }
  return {
    lastAuditedPowerDrawId: "00000",
    lastAuditedMegaDrawId: "00000",
  };
}

function getUnAuditedDraws(draws, lastAuditedId, maxNum) {
  const threshold = Number(lastAuditedId || "0");
  const list = [];
  for (let i = 0; i < draws.length; i++) {
    const idStr = String(draws[i].id).padStart(5, "0");
    if (Number(idStr) > threshold) {
      const attr = computeDrawAttributionAtIndex(draws, i, maxNum);
      list.push(
        attr ?? {
          drawId: idStr,
          date: draws[i].date,
          numbers: draws[i].result.slice(0, 6).map(Number).sort((a, b) => a - b),
        }
      );
    }
  }
  return list;
}

async function main() {
  const seedText = fs.readFileSync(SEED_FILE, "utf8");
  const allSeedIds = [
    ...seedText.matchAll(/id:\s*"#?(\d{5})"/g),
    ...seedText.matchAll(/latestDrawId:\s*"#?(\d{5})"/g),
  ].map((m) => m[1]);
  const seedIdSet = new Set(allSeedIds);

  const retroState = readRetroStateSafe();

  const [powerData, megaData, powerJp, megaJp] = await Promise.all([
    fetchJsonlTail(SOURCES.power655Jsonl, 60),
    fetchJsonlTail(SOURCES.mega645Jsonl, 60),
    fetchMinhNgocJackpot(SOURCES.minhNgocPower, "6/55"),
    fetchMinhNgocJackpot(SOURCES.minhNgocMega, "6/45"),
  ]);

  let latestPower = powerData.recentDraws.at(-1);
  if (
    powerJp?.drawId &&
    powerJp.numbers &&
    powerJp.numbers.length === 6 &&
    (!latestPower || Number(powerJp.drawId) > Number(latestPower.id))
  ) {
    const liveDraw = {
      date: powerJp.date || new Date().toISOString().slice(0, 10),
      id: powerJp.drawId,
      result: powerJp.bonus ? [...powerJp.numbers, powerJp.bonus] : powerJp.numbers,
      process_time: `${powerJp.date || new Date().toISOString().slice(0, 10)}T12:00:05Z`,
    };
    powerData.recentDraws.push(liveDraw);
    powerData.totalDraws = Math.max(powerData.totalDraws + 1, Number(powerJp.drawId));
    latestPower = liveDraw;
  }

  let latestMega = megaData.recentDraws.at(-1);
  if (
    megaJp?.drawId &&
    megaJp.numbers &&
    megaJp.numbers.length === 6 &&
    (!latestMega || Number(megaJp.drawId) > Number(latestMega.id))
  ) {
    const liveDraw = {
      date: megaJp.date || new Date().toISOString().slice(0, 10),
      id: megaJp.drawId,
      result: megaJp.numbers,
      process_time: `${megaJp.date || new Date().toISOString().slice(0, 10)}T12:00:08Z`,
    };
    megaData.recentDraws.push(liveDraw);
    megaData.totalDraws = Math.max(megaData.totalDraws + 1, Number(megaJp.drawId));
    latestMega = liveDraw;
  }

  const seedContainsLatestPower = latestPower
    ? seedIdSet.has(String(latestPower.id).padStart(5, "0"))
    : false;
  const seedContainsLatestMega = latestMega
    ? seedIdSet.has(String(latestMega.id).padStart(5, "0"))
    : false;

  const unAuditedPowerDraws = getUnAuditedDraws(
    powerData.recentDraws,
    retroState.lastAuditedPowerDrawId,
    55
  );
  const unAuditedMegaDraws = getUnAuditedDraws(
    megaData.recentDraws,
    retroState.lastAuditedMegaDrawId,
    45
  );

  const needsArgonRetrospective =
    unAuditedPowerDraws.length > 0 ||
    unAuditedMegaDraws.length > 0 ||
    !seedContainsLatestPower ||
    !seedContainsLatestMega;

  const report = {
    checkedAtIct: new Date().toLocaleString("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh",
    }),
    needsArgonRetrospective,
    lastAuditedPowerDrawId: retroState.lastAuditedPowerDrawId,
    lastAuditedMegaDrawId: retroState.lastAuditedMegaDrawId,
    seedContainsLatestPower,
    seedContainsLatestMega,
    unAuditedPowerDraws,
    unAuditedMegaDraws,
    power655: {
      totalHistoricalDraws: powerData.totalDraws,
      latestDraw: latestPower,
      liveMinhNgocJackpot: powerJp,
      walkForwardSignalTelemetry: evaluateSubModelHitRate(
        powerData.recentDraws,
        55
      ),
    },
    mega645: {
      totalHistoricalDraws: megaData.totalDraws,
      latestDraw: latestMega,
      liveMinhNgocJackpot: megaJp,
      walkForwardSignalTelemetry: evaluateSubModelHitRate(
        megaData.recentDraws,
        45
      ),
    },
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("Auto-Evolver telemetry error:", err);
  process.exit(1);
});
