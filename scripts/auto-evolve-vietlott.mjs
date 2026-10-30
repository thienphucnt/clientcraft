#!/usr/bin/env node
/**
 * Daily Vietlott QuantMatrix Auto-Evolver Telemetry & Live Sync Script
 * Invoked by the scheduled automation at 19:00 Asia/Ho_Chi_Minh (ICT) after the 18:30 draw settles.
 */

import fs from "node:fs";
import path from "node:path";

const WORKSPACE_ROOT = path.resolve(import.meta.dirname, "..");
const SEED_FILE = path.join(WORKSPACE_ROOT, "src/data/empiricalSeed2026.ts");

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

async function fetchJsonlTail(url, count = 25) {
  const res = await fetch(url, {
    headers: { "User-Agent": "VietlottQuantMatrixPro-AutoEvolver/2.0" },
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
      headers: { "User-Agent": "VietlottQuantMatrixPro-AutoEvolver/2.0" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (gameType === "6/55") {
      const idMatch = html.match(/id="DT6X55_KY_VE"[^>]*>\s*#?(\d+)/i);
      const jp1Match = html.match(/id="DT6X55_G_JACKPOT"[^>]*>\s*([0-9.,]+)/i);
      const jp2Match = html.match(/id="DT6X55_G_JACKPOT2"[^>]*>\s*([0-9.,]+)/i);
      const w1Match = html.match(/id="DT6X55_S_JACKPOT"[^>]*>\s*(\d+)/i);
      const w2Match = html.match(/id="DT6X55_S_JACKPOT2"[^>]*>\s*(\d+)/i);
      return {
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
        drawId: idMatch?.[1] ? String(idMatch[1]).padStart(5, "0") : undefined,
        jackpot1Vnd: parseDigits(jp1Match?.[1]),
        jp1Winners: w1Match?.[1] !== undefined ? Number(w1Match[1]) : undefined,
      };
    }
  } catch {
    return null;
  }
}

function evaluateSubModelHitRate(draws, maxNum) {
  if (draws.length < 10) return null;
  let lagRepeatHits = 0;
  let neighborHits = 0;
  let shortSurgeHits = 0;
  let evaluatedDraws = 0;

  for (let idx = 5; idx < draws.length; idx++) {
    const target = draws[idx].result.slice(0, 6).map(Number);
    const prev1 = new Set(draws[idx - 1].result.slice(0, 6).map(Number));
    const prev2 = new Set(draws[idx - 2].result.slice(0, 6).map(Number));
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
    }
    evaluatedDraws++;
  }

  return {
    evaluatedDraws,
    maxNum,
    avgLagRepeatPerDraw: +(lagRepeatHits / evaluatedDraws).toFixed(2),
    avgNeighborShiftPerDraw: +(neighborHits / evaluatedDraws).toFixed(2),
    avgShortSurgePerDraw: +(shortSurgeHits / evaluatedDraws).toFixed(2),
  };
}

async function main() {
  const seedText = fs.readFileSync(SEED_FILE, "utf8");
  const allSeedIds = [
    ...seedText.matchAll(/id:\s*"#?(\d{5})"/g),
    ...seedText.matchAll(/latestDrawId:\s*"#?(\d{5})"/g),
  ].map((m) => m[1]);

  const [powerData, megaData, powerJp, megaJp] = await Promise.all([
    fetchJsonlTail(SOURCES.power655Jsonl, 25),
    fetchJsonlTail(SOURCES.mega645Jsonl, 25),
    fetchMinhNgocJackpot(SOURCES.minhNgocPower, "6/55"),
    fetchMinhNgocJackpot(SOURCES.minhNgocMega, "6/45"),
  ]);

  const latestPower = powerData.recentDraws.at(-1);
  const latestMega = megaData.recentDraws.at(-1);

  const report = {
    checkedAtIct: new Date().toLocaleString("sv-SE", {
      timeZone: "Asia/Ho_Chi_Minh",
    }),
    seedContainsLatestPower: latestPower
      ? allSeedIds.includes(String(latestPower.id).padStart(5, "0"))
      : false,
    seedContainsLatestMega: latestMega
      ? allSeedIds.includes(String(latestMega.id).padStart(5, "0"))
      : false,
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
