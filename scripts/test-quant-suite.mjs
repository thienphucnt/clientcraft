#!/usr/bin/env node
/**
 * Zero-Dependency Automated Quantitative Regression Suite (v4.1)
 * Verifies zero-lookahead causality, O(1) sieve equivalence, covering wheel invariants,
 * anti-split crowd uniqueness monotonicity, Minh Ngoc jackpot normalization, and 10% PIT tax math.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import test from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const require = createRequire(path.join(REPO_ROOT, "package.json"));
const ts = require("typescript");

function loadQuantModules() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "vietlott-test-"));
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
  return { tmpDir, baseUrl: `file:///${tmpDir.replace(/\\/g, "/")}` };
}

const { tmpDir, baseUrl } = loadQuantModules();
const seedMod = await import(`${baseUrl}/empiricalSeed2026.mjs`);
const dataMod = await import(`${baseUrl}/vietlottData.mjs`);
const engineMod = await import(`${baseUrl}/quantEngine.mjs`);

test.after(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("Suite 1: Strict Zero-Lookahead Causality Invariant (6/55 and 6/45)", () => {
  const { POWER_655_SEED_DRAWS, MEGA_645_SEED_DRAWS } = seedMod;
  const { generateDayForecast } = engineMod;

  const powerTarget = POWER_655_SEED_DRAWS[2].date;
  const megaTarget = MEGA_645_SEED_DRAWS[2].date;

  const mutatedPower = POWER_655_SEED_DRAWS.map((d) =>
    d.date >= powerTarget
      ? { ...d, numbers: [1, 2, 3, 4, 5, 6], bonus: 7, sum: 21 }
      : d
  );
  const mutatedMega = MEGA_645_SEED_DRAWS.map((d) =>
    d.date >= megaTarget ? { ...d, numbers: [1, 2, 3, 4, 5, 6], sum: 21 } : d
  );

  const origPowerForecast = generateDayForecast(powerTarget, 0, new Set(), {
    powerDraws: POWER_655_SEED_DRAWS,
    megaDraws: MEGA_645_SEED_DRAWS,
  });
  const mutPowerForecast = generateDayForecast(powerTarget, 0, new Set(), {
    powerDraws: mutatedPower,
    megaDraws: mutatedMega,
  });

  assert.deepStrictEqual(
    mutPowerForecast.masterCorePool,
    origPowerForecast.masterCorePool
  );
  assert.deepStrictEqual(
    mutPowerForecast.learnedWeights,
    origPowerForecast.learnedWeights
  );
  assert.deepStrictEqual(
    mutPowerForecast.ballots,
    origPowerForecast.ballots
  );

  const origMegaForecast = generateDayForecast(megaTarget, 0, new Set(), {
    powerDraws: POWER_655_SEED_DRAWS,
    megaDraws: MEGA_645_SEED_DRAWS,
  });
  const mutMegaForecast = generateDayForecast(megaTarget, 0, new Set(), {
    powerDraws: mutatedPower,
    megaDraws: mutatedMega,
  });

  assert.deepStrictEqual(
    mutMegaForecast.masterCorePool,
    origMegaForecast.masterCorePool
  );
  assert.deepStrictEqual(
    mutMegaForecast.learnedWeights,
    origMegaForecast.learnedWeights
  );
  assert.deepStrictEqual(
    mutMegaForecast.ballots,
    origMegaForecast.ballots
  );
});

test("Suite 2: O(1) passesCombinatorialSieve Equivalence Property (1,000 Trials)", () => {
  const { GAME_CONFIGS } = seedMod;
  const { inspectCombinatorialSieve, passesCombinatorialSieve, Mulberry32PRNG } =
    engineMod;

  const rng = new Mulberry32PRNG(0x41424344);
  const games = ["6/55", "6/45"];

  for (let t = 0; t < 1000; t++) {
    const gameType = games[t % 2];
    const maxNum = GAME_CONFIGS[gameType].maxNum;
    const pool = Array.from({ length: maxNum }, (_, idx) => idx + 1);
    const combo = rng.sampleWithoutReplacement(pool, 6);
    const options = {
      allowWideSum: rng.next() < 0.5,
      allowHighSkew: rng.next() < 0.5,
      allowAllHighOrLow: rng.next() < 0.35,
      allowSkewParity: rng.next() < 0.5,
      allowTwoConsecPairs: rng.next() < 0.5,
      allowThreeDecades: rng.next() < 0.5,
      allowMod10Triad: rng.next() < 0.4,
    };

    const fastResult = passesCombinatorialSieve(combo, gameType, options);
    const fullResult = inspectCombinatorialSieve(
      combo,
      gameType,
      options
    ).passedAllGates;
    assert.equal(
      fastResult,
      fullResult,
      `Mismatch on ${gameType} combo=${combo.join(",")} opts=${JSON.stringify(options)}`
    );
  }
});

test("Suite 3: Covering Wheel, Monday Rest Day, Bounds & Seed Salt Invariants", () => {
  const { generateDayForecast } = engineMod;

  // Monday Rest Day (2026-11-30 is Monday)
  const monForecast = generateDayForecast("2026-11-30", 0);
  assert.equal(monForecast.isMondayRestDay, true);
  assert.equal(monForecast.gameType, "NO_MATRIX_DRAW");
  assert.equal(monForecast.ballots.length, 0);

  for (const [dateStr, expectedGame, maxNum] of [
    ["2026-11-28", "6/55", 55],
    ["2026-11-29", "6/45", 45],
  ]) {
    const f0a = generateDayForecast(dateStr, 0);
    const f0b = generateDayForecast(dateStr, 0);
    const f7 = generateDayForecast(dateStr, 7);

    assert.equal(f0a.isMondayRestDay, false);
    assert.equal(f0a.gameType, expectedGame);
    assert.equal(f0a.ballots.length, 5);
    assert.ok(
      (f0a.wheelTripletsCovered ?? 0) >= 80,
      `Expected >= 80 triplets covered on ${expectedGame}, got ${f0a.wheelTripletsCovered}`
    );

    const seenSigs = new Set();
    for (const b of f0a.ballots) {
      assert.equal(b.numbers.length, 6);
      assert.equal(new Set(b.numbers).size, 6);
      for (let i = 0; i < 6; i++) {
        assert.ok(b.numbers[i] >= 1 && b.numbers[i] <= maxNum);
        if (i > 0) assert.ok(b.numbers[i] > b.numbers[i - 1]);
      }
      seenSigs.add(b.numbers.join(","));
    }
    assert.equal(seenSigs.size, 5, "All 5 tickets must be distinct");

    // Determinism at seedSalt = 0
    assert.deepStrictEqual(f0a.ballots, f0b.ballots);

    // Distinct valid portfolio at seedSalt = 7
    assert.equal(f7.ballots.length, 5);
    const sigs0 = f0a.ballots.map((b) => b.numbers.join(",")).join("|");
    const sigs7 = f7.ballots.map((b) => b.numbers.join(",")).join("|");
    assert.notEqual(
      sigs0,
      sigs7,
      `Re-roll seedSalt=7 should vary tickets on ${expectedGame}`
    );
  }
});

test("Suite 4: Anti-Split Crowd-Uniqueness Index Monotonicity & Bounds", () => {
  const { computeCrowdUniquenessScore } = engineMod;

  const linearLow55 = computeCrowdUniquenessScore([1, 2, 3, 4, 5, 6], "6/55");
  const mult5Low55 = computeCrowdUniquenessScore(
    [5, 10, 15, 20, 25, 30],
    "6/55"
  );
  const irregularHigh55 = computeCrowdUniquenessScore(
    [14, 33, 37, 42, 49, 54],
    "6/55"
  );

  assert.equal(mult5Low55.score, 15);
  assert.equal(mult5Low55.label, "CROWDED");
  assert.equal(irregularHigh55.score, 99);
  assert.equal(irregularHigh55.label, "ELITE");
  assert.ok(linearLow55.score >= 15 && linearLow55.score <= 99);
  assert.ok(irregularHigh55.score - linearLow55.score >= 45);
  assert.ok(irregularHigh55.score - mult5Low55.score >= 70);

  const linear45 = computeCrowdUniquenessScore([1, 2, 3, 4, 5, 6], "6/45");
  const high45 = computeCrowdUniquenessScore(
    [2, 17, 29, 34, 41, 43],
    "6/45"
  );
  assert.ok(linear45.score >= 15 && linear45.score <= 99);
  assert.ok(high45.score > linear45.score + 30);
});

test("Suite 5: Minh Ngoc Multi-Winner Pool Normalization & 10% PIT Tax Math", () => {
  const { calculateNetPayout, parseMinhNgocJackpots } = dataMod;

  // Vietnam Circular 111/2013/TT-BTC PIT validation
  const taxFree = calculateNetPayout(10_000_000);
  assert.equal(taxFree.taxableAmountVnd, 0);
  assert.equal(taxFree.pitTaxVnd, 0);
  assert.equal(taxFree.netVnd, 10_000_000);

  const minorPrize = calculateNetPayout(500_000);
  assert.equal(minorPrize.pitTaxVnd, 0);
  assert.equal(minorPrize.netVnd, 500_000);

  const jack = calculateNetPayout(50_000_000_000);
  assert.equal(jack.taxableAmountVnd, 49_990_000_000);
  assert.equal(jack.pitTaxVnd, 4_999_000_000);
  assert.equal(jack.netVnd, 45_001_000_000);

  // Minh Ngoc multi-winner jackpot scaling (per-winner divided amounts < min seed)
  const mockHtml = `
    <span id="DT6X55_KY_VE">#01425</span>
    <div>Ngày quay thưởng 17/11/2026</div>
    <ul class="result-number">
      <li><div class="finnish1 bool">06</div></li>
      <li><div class="finnish2 bool">20</div></li>
      <li><div class="finnish3 bool">36</div></li>
      <li><div class="finnish4 bool">41</div></li>
      <li><div class="finnish5 bool">49</div></li>
      <li><div class="finnish6 bool">52</div></li>
      <li><div class="finnish7 bool">34</div></li>
    </ul>
    <span id="DT6X55_G_JACKPOT">22,500,000,000</span>
    <span id="DT6X55_S_JACKPOT">2</span>
    <span id="DT6X55_G_JACKPOT2">243,380,000</span>
    <span id="DT6X55_S_JACKPOT2">15</span>
  `;

  const parsed = parseMinhNgocJackpots(mockHtml, "6/55");
  assert.equal(parsed.drawId, "01425");
  assert.equal(parsed.date, "2026-11-17");
  assert.deepStrictEqual(parsed.numbers, [6, 20, 36, 41, 49, 52]);
  assert.equal(parsed.bonus, 34);
  assert.equal(parsed.jp1Winners, 2);
  assert.equal(parsed.jackpot1Vnd, 45_000_000_000);
  assert.equal(parsed.jp2Winners, 15);
  assert.equal(parsed.jackpot2Vnd, 243_380_000 * 15);
});
