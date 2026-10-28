import { NextResponse } from "next/server";
import {
  GITHUB_NDJSON_URLS,
  MEGA_645_SEED_DRAWS,
  parseMinhNgocJackpots,
  parseNDJsonDraws,
  POWER_655_SEED_DRAWS,
  SyncStatusResponse,
} from "@/lib/vietlottData";

export async function GET() {
  const syncedAt = new Date().toISOString();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6500);

    const [powerRes, megaRes, mnPowerRes, mnMegaRes] = await Promise.all([
      fetch(GITHUB_NDJSON_URLS.power655, {
        signal: controller.signal,
        cache: "no-store",
      }),
      fetch(GITHUB_NDJSON_URLS.mega645, {
        signal: controller.signal,
        cache: "no-store",
      }),
      fetch(GITHUB_NDJSON_URLS.minhNgocPower655, {
        signal: controller.signal,
        cache: "no-store",
      }).catch(() => null),
      fetch(GITHUB_NDJSON_URLS.minhNgocMega645, {
        signal: controller.signal,
        cache: "no-store",
      }).catch(() => null),
    ]);

    clearTimeout(timeoutId);

    if (!powerRes.ok || !megaRes.ok) {
      throw new Error(
        `GitHub NDJSON HTTP status ${powerRes.status} / ${megaRes.status}`
      );
    }

    const [powerText, megaText, mnPowerHtml, mnMegaHtml] = await Promise.all([
      powerRes.text(),
      megaRes.text(),
      mnPowerRes && mnPowerRes.ok ? mnPowerRes.text().catch(() => "") : "",
      mnMegaRes && mnMegaRes.ok ? mnMegaRes.text().catch(() => "") : "",
    ]);

    const livePowerJp = mnPowerHtml
      ? parseMinhNgocJackpots(mnPowerHtml, "6/55")
      : undefined;
    const liveMegaJp = mnMegaHtml
      ? parseMinhNgocJackpots(mnMegaHtml, "6/45")
      : undefined;

    const powerLinesCount = powerText
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0).length;
    const megaLinesCount = megaText
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0).length;

    const parsedPower = parseNDJsonDraws(
      powerText,
      "6/55",
      2500,
      livePowerJp
    );
    const parsedMega = parseNDJsonDraws(
      megaText,
      "6/45",
      2500,
      liveMegaJp
    );

    // Merge Tier 1 live NDJSON records with Tier 2 October 2026 Empirical Seed Database
    const powerMap = new Map(parsedPower.map((d) => [d.id, d]));
    for (const seedDraw of POWER_655_SEED_DRAWS) {
      const existing = powerMap.get(seedDraw.id);
      if (!existing) {
        powerMap.set(seedDraw.id, seedDraw);
      } else {
        // Keep live jackpot override if newer, otherwise preserve verified seed jackpot metadata
        powerMap.set(seedDraw.id, {
          ...existing,
          jackpot1Vnd:
            livePowerJp?.drawId === seedDraw.id && livePowerJp?.jackpot1Vnd
              ? livePowerJp.jackpot1Vnd
              : seedDraw.jackpot1Vnd,
          jackpot2Vnd:
            livePowerJp?.drawId === seedDraw.id && livePowerJp?.jackpot2Vnd
              ? livePowerJp.jackpot2Vnd
              : seedDraw.jackpot2Vnd,
          jp1Winners:
            livePowerJp?.drawId === seedDraw.id &&
            livePowerJp?.jp1Winners !== undefined
              ? livePowerJp.jp1Winners
              : seedDraw.jp1Winners,
          jp2Winners:
            livePowerJp?.drawId === seedDraw.id &&
            livePowerJp?.jp2Winners !== undefined
              ? livePowerJp.jp2Winners
              : seedDraw.jp2Winners,
          isJackpotWon: seedDraw.isJackpotWon,
        });
      }
    }
    const mergedPower = Array.from(powerMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    const megaMap = new Map(parsedMega.map((d) => [d.id, d]));
    for (const seedDraw of MEGA_645_SEED_DRAWS) {
      const existing = megaMap.get(seedDraw.id);
      if (!existing) {
        megaMap.set(seedDraw.id, seedDraw);
      } else {
        megaMap.set(seedDraw.id, {
          ...existing,
          jackpot1Vnd:
            liveMegaJp?.drawId === seedDraw.id && liveMegaJp?.jackpot1Vnd
              ? liveMegaJp.jackpot1Vnd
              : seedDraw.jackpot1Vnd,
          jp1Winners:
            liveMegaJp?.drawId === seedDraw.id &&
            liveMegaJp?.jp1Winners !== undefined
              ? liveMegaJp.jp1Winners
              : seedDraw.jp1Winners,
          isJackpotWon: seedDraw.isJackpotWon,
        });
      }
    }
    const mergedMega = Array.from(megaMap.values()).sort((a, b) =>
      b.date.localeCompare(a.date)
    );

    const responsePayload: SyncStatusResponse = {
      tier: "TIER_1_LIVE_CLOUD_HYBRID",
      syncedAt,
      power655TotalDraws: Math.max(1416, powerLinesCount, mergedPower.length),
      mega645TotalDraws: Math.max(1580, megaLinesCount, mergedMega.length),
      latestPowerDraw: mergedPower[0] || POWER_655_SEED_DRAWS[0],
      latestMegaDraw: mergedMega[0] || MEGA_645_SEED_DRAWS[0],
      powerDraws: mergedPower,
      megaDraws: mergedMega,
      sourceUrlPower: GITHUB_NDJSON_URLS.power655,
      sourceUrlMega: GITHUB_NDJSON_URLS.mega645,
      message: `Tier 1 Live Cloud Sync Active (${mergedPower.length} Power 6/55 through #${mergedPower[0]?.id} & ${mergedMega.length} Mega 6/45 through #${mergedMega[0]?.id}).`,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Network offline";
    const fallbackPayload: SyncStatusResponse = {
      tier: "TIER_2_OFFLINE_SEED_2026",
      syncedAt,
      power655TotalDraws: 1416,
      mega645TotalDraws: 1580,
      latestPowerDraw: POWER_655_SEED_DRAWS[0],
      latestMegaDraw: MEGA_645_SEED_DRAWS[0],
      powerDraws: POWER_655_SEED_DRAWS,
      megaDraws: MEGA_645_SEED_DRAWS,
      sourceUrlPower: GITHUB_NDJSON_URLS.power655,
      sourceUrlMega: GITHUB_NDJSON_URLS.mega645,
      message: `Tier 2 Offline-First Empirical Seed Database Active (Fallback reason: ${errorMsg}).`,
    };

    return NextResponse.json(fallbackPayload, { status: 200 });
  }
}
