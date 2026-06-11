<#
  ralph-ui.ps1 — Windows PowerShell Ralph runner for the Maersk Design UI refresh.

  Drives the FRONTEND-ONLY refresh backlog (.ralph/prd-ui-maersk.json) and logs to
  .ralph/progress-ui.txt — fully separate from the v1 record (.ralph/prd.json) and the
  v2 enterprise backlog (on the v2-enterprise branch). Intended to run on the `ui-maersk`
  branch, which keeps the current anonymous (no-auth) app exactly as it is.

  Usage (from the project root, in PowerShell):
    .\.ralph\ralph-ui.ps1 -Iterations 5

  Requires `claude` on PATH. One foreground call per iteration (no backgrounding) to avoid
  the concurrency hazard where parallel `claude -p` runs clobber the same files.
#>
param(
  [int]$Iterations = 5
)

$ErrorActionPreference = "Stop"
$prd  = ".ralph/prd-ui-maersk.json"
$log  = ".ralph/progress-ui.txt"

$prompt = @"
study ./$prd and ./.ralph/loop.md

CONTEXT: This is the Maersk Design UI refresh track. It is FRONTEND-ONLY (apps/web). You MUST NOT
change the API (apps/api), the Prisma schema, the contracts package, or the anonymous share-link /
name+role flow. This is a Tailwind REPLICA of Maersk Design — do NOT add @maersk-global / MDS npm
packages (they are not on a reachable registry and will not build on Railway). Use the existing
Tailwind + React + Vite stack and the Maersk palette: Maersk Blue #42b0d5, deep blue #00a3e0,
steel #b0c4d8, slate #6b7b8d, amber #f0b429; Inter (UI) + Fira Code (mono).

1. PICK THE NEXT STORY IN STRICT PHASE ORDER from ./$prd. Find the FIRST phase whose status is
   "active". Within it, find the FIRST story whose status is "todo". Work only on that one story.
   Do not skip ahead.

2. Read the story's description, acceptance_criteria, and output_files. Read every output_file that
   already exists BEFORE editing it. Implement the story to satisfy ALL acceptance criteria.

3. Verify: run 'npm run check' and 'npm run build' for the web workspace and 'npm run test' at the
   repo root. For [MANUAL] visual criteria you cannot verify headlessly, record them as SKIP with a
   one-line note (a human will eyeball them) — do NOT fail the story on a [MANUAL] line, but DO make
   the change the criterion describes. All non-[MANUAL] criteria must genuinely pass.

4. Update ./$prd: mark the story status "done", add a "completed" date and a "completion_notes" string.

5. Append a structured iteration report to ./$log (header line with timestamp + story id + status; a
   CRITERIA block with PASS/FAIL/SKIP per criterion; a NOTES paragraph). Create the file if absent.

6. Make ONE git commit starting with the story id (e.g. "U1-S1 — Maersk Tailwind tokens"). Never use
   --no-verify.

ONLY WORK ON A SINGLE STORY.
If every story in every phase is "done", output <PROMISE>COMPLETE</PROMISE>.
If you genuinely cannot proceed without a permission you lack, print what you need and output
<PROMISE>NEED_PERMISSIONS</PROMISE> and stop.
"@

if (-not (Test-Path $prd)) { Write-Error "Backlog not found: $prd (run from the project root on the ui-maersk branch)"; exit 1 }

for ($i = 1; $i -le $Iterations; $i++) {
  Write-Host "--------------------------------"
  Write-Host "UI refresh iteration $i / $Iterations"
  Write-Host "--------------------------------"

  # Free dev-server ports from any prior iteration (Windows-safe; ignore if nothing is bound).
  foreach ($port in 4003, 5182) {
    try {
      Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction Stop |
        Select-Object -ExpandProperty OwningProcess -Unique |
        ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    } catch {}
  }

  $result = claude --permission-mode bypassPermissions -p $prompt
  Write-Host $result
  Write-Host ""

  if ($result -match "<PROMISE>NEED_PERMISSIONS</PROMISE>") { Write-Host "Needs permissions — stopping."; exit 1 }
  if ($result -match "<PROMISE>COMPLETE</PROMISE>")        { Write-Host "UI refresh backlog complete."; exit 0 }
}
