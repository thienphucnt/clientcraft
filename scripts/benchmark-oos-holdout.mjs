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
    const { buildDynamicGameConfigForDate, parseNDJsonDraws } = await import(
      `${baseUrl}/vietlottData.mjs`
    );
    const { addDaysISO, generateDayForecast } = await import(
      `${baseUrl}/quantEngine.mjs`
    );

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

    const poissonUpperTailPValue = (observed, lambda) => {
      if (observed <= 0) return 1;
      let cdf = 0;
      let term = Math.exp(-lambda);
      cdf += term;
      for (let k = 1; k < observed; k++) {
        term *= lambda / k;
        cdf += term;
      }
      return Math.max(0, Math.min(1, 1 - cdf));
    };

    const evaluateHoldoutMulti = (draws, gameType, startIdx, checkpoints) => {
      const is55 = gameType === "6/55";
      const pWinPerTicket = is55 ? 0.01334 : 0.023842;
      const maxCount = Math.max(...checkpoints);
      const checkpointSet = new Set(checkpoints);
      const results = {};

      let masterHits = 0;
      let unionHits = 0;
      let unionSizeSum = 0;
      let t3 = 0;
      let t4 = 0;
      let t5 = 0;
      let jp2 = 0;
      let t6 = 0;
      let prizeDraws = 0;

      for (let offset = 0; offset < maxCount; offset++) {
        const d = draws[startIdx + offset];
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
          } else if (h === 5 && bHit && is55) {
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

        const evaluated = offset + 1;
        if (checkpointSet.has(evaluated)) {
          const totalWinningTickets = t3 + t4 + t5 + jp2 + t6;
          const expectedRandomTickets = evaluated * 5 * pWinPerTicket;
          const winningTicketLiftPct =
            expectedRandomTickets > 0
              ? ((totalWinningTickets - expectedRandomTickets) /
                  expectedRandomTickets) *
                100
              : 0;
          const estimatedPrizeReturnVnd =
            t3 * (is55 ? 50_000 : 30_000) +
            t4 * (is55 ? 500_000 : 300_000) +
            t5 * (is55 ? 40_000_000 : 10_000_000) +
            jp2 * 3_500_000_000 +
            t6 * (is55 ? 50_000_000_000 : 20_000_000_000);

          results[evaluated] = {
            gameType,
            evaluatedDraws: evaluated,
            avgMasterPoolHits: Number((masterHits / evaluated).toFixed(3)),
            avgUnionBalls: Number((unionSizeSum / evaluated).toFixed(1)),
            avgUnionHits: Number((unionHits / evaluated).toFixed(3)),
            prizeDraws,
            prizeDrawRatePct: Number(
              ((prizeDraws / evaluated) * 100).toFixed(2)
            ),
            totalWinningTickets,
            expectedRandomWinningTickets: Number(
              expectedRandomTickets.toFixed(2)
            ),
            winningTicketLiftPct: Number(winningTicketLiftPct.toFixed(2)),
            poissonUpperTailPValue: Number(
              poissonUpperTailPValue(
                totalWinningTickets,
                expectedRandomTickets
              ).toFixed(4)
            ),
            estimatedPrizeReturnVnd,
            tiers: { t3, t4, t5, jp2, t6 },
          };
        }
      }

      return results;
    };

    const getNextDrawDate = (latestDateIso, isPower) => {
      const targetDays = isPower
        ? new Set(["Tuesday", "Thursday", "Saturday"])
        : new Set(["Wednesday", "Friday", "Sunday"]);
      for (let d = 1; d <= 7; d++) {
        const cand = addDaysISO(latestDateIso, d);
        const wk = new Date(`${cand}T12:00:00+07:00`).toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            timeZone: "Asia/Ho_Chi_Minh",
          }
        );
        if (targetDays.has(wk)) return cand;
      }
      return addDaysISO(latestDateIso, 2);
    };

    const pMulti = evaluateHoldoutMulti(powerDraws, "6/55", 15, [200, 350]);
    const mMulti = evaluateHoldoutMulti(megaDraws, "6/45", 15, [200, 350]);
    const p200 = pMulti[200];
    const m200 = mMulti[200];
    const p350 = pMulti[350];
    const m350 = mMulti[350];

    const buildCombinedStats = (pRes, mRes) => {
      const totalWinningTickets =
        pRes.totalWinningTickets + mRes.totalWinningTickets;
      const expectedRandomWinningTickets = Number(
        (
          pRes.expectedRandomWinningTickets +
          mRes.expectedRandomWinningTickets
        ).toFixed(2)
      );
      return {
        totalPrizeDraws: pRes.prizeDraws + mRes.prizeDraws,
        totalWinningTickets,
        expectedRandomWinningTickets,
        winningTicketLiftPct: Number(
          (
            ((totalWinningTickets - expectedRandomWinningTickets) /
              expectedRandomWinningTickets) *
            100
          ).toFixed(2)
        ),
        poissonUpperTailPValue: Number(
          poissonUpperTailPValue(
            totalWinningTickets,
            expectedRandomWinningTickets
          ).toFixed(4)
        ),
        estimatedPrizeReturnVnd:
          pRes.estimatedPrizeReturnVnd + mRes.estimatedPrizeReturnVnd,
      };
    };

    const nextPowerDate = getNextDrawDate(powerDraws[0].date, true);
    const nextMegaDate = getNextDrawDate(megaDraws[0].date, false);

    const fPowerNext = generateDayForecast(nextPowerDate, 0, new Set(), {
      powerDraws,
      megaDraws,
    });
    const fMegaNext = generateDayForecast(nextMegaDate, 0, new Set(), {
      powerDraws,
      megaDraws,
    });

    const powerCfgNext = buildDynamicGameConfigForDate(
      "6/55",
      nextPowerDate,
      powerDraws
    );
    const megaCfgNext = buildDynamicGameConfigForDate(
      "6/45",
      nextMegaDate,
      megaDraws
    );

    const formatUpcoming = (f, cfg) => ({
      targetDate: f.date,
      weekday: f.weekday,
      drawId: f.estimatedDrawId,
      calibratedFromDrawId: cfg.latestDrawId,
      calibratedFromDrawDate: cfg.latestDrawDate,
      hotPool: cfg.hotPool,
      hotWeights: cfg.hotWeights,
      coldOverduePool: cfg.coldOverduePool,
      masterCorePool: cfg.masterCorePool,
      learnedWeights: cfg.learnedWeights,
      wheelTripletsCovered: f.wheelTripletsCovered,
      avgCrowdUniquenessScore: Number(
        (
          f.ballots.reduce((s, b) => s + b.crowdUniquenessScore, 0) /
          Math.max(1, f.ballots.length)
        ).toFixed(1)
      ),
      ballots: f.ballots.map((b) => ({
        slot: b.slot,
        badge: b.strategyBadge,
        numbers: b.numbers,
        sum: b.sum,
        oddEven: b.oddEven,
        lowHigh: b.lowHigh,
        crowdUniquenessScore: b.crowdUniquenessScore,
        crowdUniquenessLabel: b.crowdUniquenessLabel,
      })),
    });

    console.log(
      JSON.stringify(
        {
          benchmark400: {
            power655Holdout200: p200,
            mega645Holdout200: m200,
            combined400: buildCombinedStats(p200, m200),
          },
          benchmark700: {
            power655Holdout350: p350,
            mega645Holdout350: m350,
            combined700: buildCombinedStats(p350, m350),
          },
          upcomingForecastPreview: {
            power655Next: formatUpcoming(fPowerNext, powerCfgNext),
            mega645Next: formatUpcoming(fMegaNext, megaCfgNext),
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
