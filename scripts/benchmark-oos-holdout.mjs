#!/usr/bin/env node
/**
 * Official 400-Draw Out-Of-Sample Holdout Benchmark (Anti-Overfitting Gate)
 * Evaluates live src/lib/vietlottData.ts + src/lib/quantEngine.ts across 200 unseen Power 6/55 draws
 * and 200 unseen Mega 6/45 draws (indices 15..214 newest-first) with zero future-data leakage.
 */

import { execFileSync } from "node:child_process";
import dns from "node:dns";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

dns.setDefaultResultOrder("ipv4first");

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const ts = require("typescript");

async function fetchTextWithFallback(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "VietlottQuantMatrixPro-HoldoutBenchmark/4.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return await res.text();
    throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    if (process.platform === "win32") {
      return execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-NonInteractive",
          "-WindowStyle",
          "Hidden",
          "-Command",
          "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; (Invoke-WebRequest -Uri $env:VIETLOTT_FETCH_URL -UseBasicParsing -TimeoutSec 15).Content",
        ],
        {
          env: { ...process.env, VIETLOTT_FETCH_URL: url },
          encoding: "utf8",
          windowsHide: true,
          maxBuffer: 20 * 1024 * 1024,
          timeout: 20000,
        }
      );
    }
    throw err;
  }
}

async function main() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vietlott-oos-"));
  try {
    for (const rel of [
      "src/data/empiricalSeed2026.ts",
      "src/lib/vietlottData.ts",
      "src/lib/quantEngine.ts",
    ]) {
      let src = fs.readFileSync(path.join(REPO_ROOT, rel), "utf8");
      src = src
        .replace(
          /from\s+["']@\/data\/empiricalSeed2026["']/g,
          'from "./empiricalSeed2026.mjs"'
        )
        .replace(
          /from\s+["']@\/lib\/vietlottData["']/g,
          'from "./vietlottData.mjs"'
        );
      const out = ts.transpileModule(src, {
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
        },
      });
      fs.writeFileSync(
        path.join(tmpDir, `${path.basename(rel, ".ts")}.mjs`),
        out.outputText,
        "utf8"
      );
    }

    const baseUrl = `file:///${tmpDir.replace(/\\/g, "/")}`;
    const { parseNDJsonDraws } = await import(`${baseUrl}/vietlottData.mjs`);
    const { generateDayForecast } = await import(`${baseUrl}/quantEngine.mjs`);

    const [pText, mText] = await Promise.all([
      fetchTextWithFallback(
        "https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/power655.jsonl"
      ),
      fetchTextWithFallback(
        "https://raw.githubusercontent.com/vietvudanh/vietlott-data/main/data/power645.jsonl"
      ),
    ]);

    const powerDraws = parseNDJsonDraws(pText, "6/55", 600);
    const megaDraws = parseNDJsonDraws(mText, "6/45", 600);

    const evaluateHoldout = (draws, gameType, startIdx, count) => {
      let masterHits = 0;
      let unionHits = 0;
      let unionSizeSum = 0;
      let t3 = 0;
      let t4 = 0;
      let t5 = 0;
      let jp2 = 0;
      let t6 = 0;
      let prizeDraws = 0;

      for (let i = startIdx; i < startIdx + count; i++) {
        const d = draws[i];
        const f = generateDayForecast(d.date, 0, new Set(), {
          powerDraws,
          megaDraws,
        });
        const actualSet = new Set(d.numbers);
        masterHits += (f.masterCorePool || []).filter((x) =>
          actualSet.has(x)
        ).length;

        const uSet = new Set();
        let anyPrize = false;
        for (const b of f.ballots) {
          b.numbers.forEach((x) => uSet.add(x));
          const h = b.numbers.filter((x) => actualSet.has(x)).length;
          const bHit = d.bonus !== undefined && b.numbers.includes(d.bonus);
          if (h === 6) {
            t6++;
            anyPrize = true;
          } else if (h === 5 && bHit && gameType === "6/55") {
            jp2++;
            anyPrize = true;
          } else if (h === 5) {
            t5++;
            anyPrize = true;
          } else if (h === 4) {
            t4++;
            anyPrize = true;
          } else if (h === 3) {
            t3++;
            anyPrize = true;
          }
        }
        if (anyPrize) prizeDraws++;
        unionSizeSum += uSet.size;
        unionHits += d.numbers.filter((x) => uSet.has(x)).length;
      }

      return {
        gameType,
        evaluatedDraws: count,
        avgMasterPoolHits: Number((masterHits / count).toFixed(3)),
        avgUnionBalls: Number((unionSizeSum / count).toFixed(1)),
        avgUnionHits: Number((unionHits / count).toFixed(3)),
        prizeDraws,
        prizeDrawRatePct: Number(((prizeDraws / count) * 100).toFixed(2)),
        totalWinningTickets: t3 + t4 + t5 + jp2 + t6,
        tiers: { t3, t4, t5, jp2, t6 },
      };
    };

    const pRes = evaluateHoldout(powerDraws, "6/55", 15, 200);
    const mRes = evaluateHoldout(megaDraws, "6/45", 15, 200);

    const fPowerNext = generateDayForecast("2026-11-26", 0, new Set(), {
      powerDraws,
      megaDraws,
    });
    const fMegaNext = generateDayForecast("2026-11-27", 0, new Set(), {
      powerDraws,
      megaDraws,
    });

    console.log(
      JSON.stringify(
        {
          benchmark: "400_DRAW_OUT_OF_SAMPLE_HOLDOUT",
          power655Holdout200: pRes,
          mega645Holdout200: mRes,
          combined400: {
            totalPrizeDraws: pRes.prizeDraws + mRes.prizeDraws,
            totalWinningTickets:
              pRes.totalWinningTickets + mRes.totalWinningTickets,
          },
          upcomingForecastPreview: {
            power655_2026_11_26: {
              drawId: fPowerNext.estimatedDrawId,
              masterCorePool: fPowerNext.masterCorePool,
              learnedWeights: fPowerNext.learnedWeights,
              ballots: fPowerNext.ballots.map((b) => ({
                slot: b.slot,
                badge: b.strategyBadge,
                numbers: b.numbers,
                sum: b.sum,
                oddEven: b.oddEven,
                lowHigh: b.lowHigh,
              })),
            },
            mega645_2026_11_27: {
              drawId: fMegaNext.estimatedDrawId,
              masterCorePool: fMegaNext.masterCorePool,
              learnedWeights: fMegaNext.learnedWeights,
              ballots: fMegaNext.ballots.map((b) => ({
                slot: b.slot,
                badge: b.strategyBadge,
                numbers: b.numbers,
                sum: b.sum,
                oddEven: b.oddEven,
                lowHigh: b.lowHigh,
              })),
            },
          },
        },
        null,
        2
      )
    );
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error("OOS Holdout Benchmark Error:", err);
  process.exit(1);
});
