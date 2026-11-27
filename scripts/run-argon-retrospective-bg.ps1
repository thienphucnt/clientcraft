param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$RepoRoot = "c:\Users\Admin\Documents\antigravity\keen-borg"
$LogDir = Join-Path $RepoRoot "logs"
$LogFile = Join-Path $LogDir "argon-retrospective-bg.log"
$LockFile = Join-Path $LogDir "argon-evolver.lock"
$AgyExe = "C:\Users\Admin\AppData\Local\agy\bin\agy.exe"
$TelemetryScript = Join-Path $RepoRoot "scripts\auto-evolve-vietlott.mjs"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

function Write-Log {
  param([string]$Message)
  $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss zzz")
  $line = "[$ts] $Message"
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
  Write-Output $line
}

function Invoke-PostAgentGitPushGuarantee {
  $pendingChanges = (& git status --porcelain -- src/ scripts/ .github/ 2>&1) | Out-String
  if ([string]::IsNullOrWhiteSpace($pendingChanges)) {
    return
  }

  Write-Log "Detected uncommitted workspace changes in src/ scripts/ .github/. Running TypeScript verification & push guarantee..."
  $prevPref = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    $tscOut = (& npx.cmd tsc --noEmit 2>&1) | Out-String
    $tscExit = $LASTEXITCODE
    if ($tscExit -ne 0) {
      Write-Log "Post-Agent tsc --noEmit failed (exit=$tscExit); skipping auto-commit/push: $tscOut"
      return
    }

    & git add src/ scripts/ .github/ 2>&1 | Out-Null
    $staged = (& git diff --cached --name-only 2>&1) | Out-String
    if (-not [string]::IsNullOrWhiteSpace($staged)) {
      $commitMsg = "feat(argon-evolver): autonomous Argon High retrospective sync & evolution"
      $commitOut = (& git commit -m $commitMsg 2>&1) | Out-String
      Write-Log "Committed changes: $commitOut"
    }

    $pushOrigin = (& git push origin master 2>&1) | Out-String
    $pushOriginExit = $LASTEXITCODE
    $pushVercel = (& git push https://github.com/thienphucnt/clientcraft.git master:vietlott-quantmatrix-pro 2>&1) | Out-String
    $pushVercelExit = $LASTEXITCODE
    Write-Log "Push guarantee results: origin(exit=$pushOriginExit), vercel(exit=$pushVercelExit) | $pushOrigin | $pushVercel"
  }
  finally {
    $ErrorActionPreference = $prevPref
  }
}

# Rotate log if > 2 MB
if ((Test-Path $LogFile) -and ((Get-Item $LogFile).Length -gt 2MB)) {
  $ArchiveLog = Join-Path $LogDir "argon-retrospective-bg.prev.log"
  Move-Item -Path $LogFile -Destination $ArchiveLog -Force
}

# Acquire PID-aware lockfile to prevent overlapping background executions
if (Test-Path $LockFile) {
  $lockInfo = Get-Content $LockFile -ErrorAction SilentlyContinue | Out-String
  $existingPid = $null
  if ($lockInfo -match "PID=(\d+)") {
    $existingPid = [int]$Matches[1]
  }
  $lockAgeMinutes = ((Get-Date) - (Get-Item $LockFile).LastWriteTime).TotalMinutes
  $isAlive = $false
  if ($existingPid) {
    $proc = Get-Process -Id $existingPid -ErrorAction SilentlyContinue
    if ($proc) { $isAlive = $true }
  }
  if ($isAlive -and $lockAgeMinutes -lt 45) {
    Write-Log "Another background Argon High run is already active (PID=$existingPid, age=$([math]::Round($lockAgeMinutes, 1))m). Skipping."
    exit 0
  } else {
    Write-Log "Removing stale lockfile (PID=$existingPid, age=$([math]::Round($lockAgeMinutes, 1))m)."
    Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
  }
}

try {
  Set-Content -Path $LockFile -Value "PID=$PID`nSTARTED=$((Get-Date).ToString('o'))" -Encoding UTF8
  Set-Location $RepoRoot

  if (-not (Test-Path $AgyExe)) {
    throw "Antigravity CLI binary not found at $AgyExe"
  }

  # Wait/retry telemetry check in case Windows just booted and Wi-Fi is still connecting
  $telemetryRaw = $null
  $telemetry = $null
  $maxAttempts = 3
  $prevPref = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  for ($attempt = 1; $attempt -le $maxAttempts; $attempt++) {
    try {
      $telemetryRaw = (& node $TelemetryScript 2>&1) | Out-String
      if ($LASTEXITCODE -eq 0) {
        $telemetry = $telemetryRaw | ConvertFrom-Json
        break
      }
      Write-Log "Telemetry attempt $attempt/$maxAttempts failed (exit=$LASTEXITCODE): $telemetryRaw"
    } catch {
      Write-Log "Telemetry attempt $attempt/$maxAttempts threw error: $($_.Exception.Message)"
    }
    if ($attempt -lt $maxAttempts) {
      Start-Sleep -Seconds 15
    }
  }
  $ErrorActionPreference = $prevPref

  if (-not $telemetry) {
    Write-Log "Unable to fetch live Vietlott telemetry after $maxAttempts attempts (offline or upstream timeout). Running push guarantee if needed and exiting cleanly."
    Invoke-PostAgentGitPushGuarantee
    exit 0
  }

  $needsRetro = [bool]$telemetry.needsArgonRetrospective
  $unAuditedPowerCount = @($telemetry.unAuditedPowerDraws).Count
  $unAuditedMegaCount = @($telemetry.unAuditedMegaDraws).Count

  if ((-not $needsRetro) -and (-not $Force)) {
    Invoke-PostAgentGitPushGuarantee
    Write-Log "No un-audited draws pending; exiting cleanly (Power=#$($telemetry.lastAuditedPowerDrawId), Mega=#$($telemetry.lastAuditedMegaDrawId))."
    exit 0
  }

  $unAuditedPowerIds = (@($telemetry.unAuditedPowerDraws) | ForEach-Object { "#$($_.drawId) ($($_.date))" }) -join ", "
  $unAuditedMegaIds = (@($telemetry.unAuditedMegaDraws) | ForEach-Object { "#$($_.drawId) ($($_.date))" }) -join ", "
  Write-Log "Triggering headless Gemini 4 Carbon (High) retrospective (fallback: Argon High): Force=$Force | UnauditedPower=[$unAuditedPowerIds] | UnauditedMega=[$unAuditedMegaIds]"

  $prompt = @"
In workspace c:/Users/Admin/Documents/antigravity/keen-borg, run the autonomous Jackpot Day Retrospective & Missed-Day Catch-Up workflow:
IMPORTANT: For every run_command tool call, always pass WaitMsBeforeAsync: 10000 and keep commands fast (<15s) so no command ever backgrounds unexpectedly.
1. Run `node scripts/auto-evolve-vietlott.mjs` to inspect the latest live draws from raw.githubusercontent.com/vietvudanh/vietlott-data and www.minhngoc.net.vn, plus every missed/un-audited draw in `unAuditedPowerDraws` ($unAuditedPowerCount) and `unAuditedMegaDraws` ($unAuditedMegaCount).
2. Sync all new or missed draws into `src/data/empiricalSeed2026.ts` (including normalized jackpot prize pools, resetting `currentJackpot1Vnd`/`currentJackpot2Vnd` to minimum seed whenever winners > 0, and updating `learnedWeights`, `hotPool`, `hotWeights`, `coldOverduePool`, `masterCorePool`, `recentDrawsTop2` using `buildDynamicGameConfigForDate`), and update fallback dates in `src/app/page.tsx`, `src/components/ExecutiveHeader.tsx`, and `src/components/RollingForecastMatrix.tsx`.
3. Execute a chronological retrospective across every draw in `unAuditedPowerDraws` and `unAuditedMegaDraws`. Remember the user strictly purchases 5 standard 6-number tickets (`5 x 10,000 VND = 50,000 VND/day`, no Bao-7); on Power 6/55, Jackpot 1 wins on 6/6 main matches and Jackpot 2 wins on 5/6 main + 6th number matching the JP2 special bonus ball.
   STRICT ANTI-OVERFITTING GUARDRAILS (MANDATORY):
   - NEVER add single-draw boolean regime predicates, date-specific hacks, static future-pool constants (such as `CAUSAL_PRIOR_HOT_POOL`), or `attempt === 0` hardcoded slot overrides to chase hindsight 6/6 hits on the latest settled draw.
   - Measure baseline BEFORE any engine edit by running `node scripts/benchmark-oos-holdout.mjs`.
   - ONLY propose changes to `src/lib/vietlottData.ts` or `src/lib/quantEngine.ts` if they represent mathematically generalizable signals or covering optimizations. After editing, re-run `node scripts/benchmark-oos-holdout.mjs` and compare against the baseline.
   - Keep code changes in `src/lib/vietlottData.ts` / `src/lib/quantEngine.ts` ONLY if BOTH the 400-draw (`200+200`) and 700-draw (`350+350`) strictly out-of-sample holdout metrics improve without regressing either game. Otherwise immediately run `git checkout -- src/lib/vietlottData.ts src/lib/quantEngine.ts` and commit ONLY the draw sync (`src/data/empiricalSeed2026.ts`, fallback dates, and an honest post-mortem in `src/data/argonRetrospectiveState.json`).
4. Update `src/data/argonRetrospectiveState.json` with the newly audited draw IDs (`lastAuditedPowerDrawId`, `lastAuditedPowerDrawDate`, `lastAuditedMegaDrawId`, `lastAuditedMegaDrawDate`, `lastAuditedAtIct`, `recentAudits`).
5. Run `npx.cmd tsc --noEmit` to confirm zero TypeScript errors, commit all updates with `git add` and `git commit`, and push to both `origin master` and `https://github.com/thienphucnt/clientcraft.git master:vietlott-quantmatrix-pro` (which triggers automatic GitHub Pages and Vercel rebuilds).
"@

  $prevAgyPref = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & $AgyExe --model gemini-4-carbon-high --effort high --mode accept-edits --dangerously-skip-permissions --print $prompt 2>&1 |
    ForEach-Object { Write-Log "[agy:carbon-high] $_" }
  $agyExit = $LASTEXITCODE
  if ($agyExit -ne 0) {
    Write-Log "gemini-4-carbon-high exited with status code $agyExit; retrying once with gemini-4-argon-high fallback..."
    & $AgyExe --model gemini-4-argon-high --effort high --mode accept-edits --dangerously-skip-permissions --print $prompt 2>&1 |
      ForEach-Object { Write-Log "[agy:argon-high] $_" }
    $agyExit = $LASTEXITCODE
  }
  $ErrorActionPreference = $prevAgyPref

  # Guarantee tsc verification, commit & push even if agy exited mid-cleanup or skipped git push
  Invoke-PostAgentGitPushGuarantee

  if ($agyExit -ne 0) {
    throw "agy.exe exited with status code $agyExit"
  }

  Write-Log "Headless Gemini 4 Argon (High) retrospective completed successfully."
  exit 0
}
catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
}
finally {
  if (Test-Path $LockFile) {
    Remove-Item $LockFile -Force -ErrorAction SilentlyContinue
  }
}
