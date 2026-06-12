# Ralph Loop Instructions — Maersk PRD Studio

## How to run
```bash
cd "C:\Users\CGR126\OneDrive - Maersk Group\Claude\maersk-prd-studio"
.ralph/ralph.sh 30           # run up to 30 iterations
.ralph/ralph-once.sh         # run one iteration
```

## What this project is

Maersk PRD Studio is a multi-user web app for AI-powered PRD generation. A project creator
sets up a project (name, description, topic), shares a link, and stakeholders visit
to have a role-adaptive Claude interview. Claude asks drilling questions, detects when
coverage is complete, synthesizes all session inputs into a live shared PRD. The PRD
exports as Markdown and as ralph-compatible prd.json for use by build loops.

## Tech stack

- **Backend** — Node 20 + TypeScript, Express 4, Prisma 5 + PostgreSQL 16, Zod, Anthropic SDK
- **Frontend** — React 18 + Vite + TypeScript, Tailwind CSS, React Router 6
- **AI** — claude-sonnet-4-6 via Anthropic SDK (interview + PRD synthesis)
- **Deployment** — Railway; local dev via Docker Compose
- **Repo layout** — npm workspaces (`apps/api`, `apps/web`, `packages/contracts`)

## Ports (local dev)

| Service | Host port | Container port |
|---|---|---|
| Postgres | 5436 | 5432 |
| API | 4003 | — |
| Web (Vite) | 5182 | — |

These avoid clash with other projects on this machine (TVDashboard, Waypoint, OOPs, MTMS, locsetup).

## Loop behavior — each iteration

### Step 1 — Read the active story
- Open `.ralph/prd.json`
- Find the first phase with `"status": "active"`
- Within that phase, find the first story with `"status": "todo"`
- If no `"todo"` story exists in any active phase, all work is complete — write a final
  COMPLETE entry to `progress.txt` and emit `<PROMISE>COMPLETE</PROMISE>`

### Step 2 — Execute the story
- Read every file listed in `output_files` before writing (if they exist)
- Write or modify code to satisfy all acceptance criteria
- Run the verification commands specified in the story

### Step 3 — Verify each acceptance criterion
- Perform a concrete test for each: run a command, read a file, make an HTTP request
- Record each as PASS or FAIL with a one-line note
- If ANY criterion fails, attempt to fix (up to 2 attempts), then mark BLOCKED

### Step 4 — Write the iteration report to progress.txt
```
------------------------------------------------------------
[YYYY-MM-DD HH:MM] STORY {id} — {title}
STATUS: DONE | BLOCKED | PARTIAL
CRITERIA:
  [PASS] criterion text
  [FAIL] criterion text — reason
  [SKIP] criterion text — reason skipped
NOTES: free-text summary of what was done
------------------------------------------------------------
```

### Step 5 — Update prd.json story status
- DONE: set `"status": "done"`, add `"completed": "YYYY-MM-DD"`, add `"completion_notes"`
- BLOCKED: set `"status": "blocked"` — DO NOT advance

### Step 6 — Phase completion check
- If all stories in the active phase are `"done"`: set phase `"status": "done"`, set next phase `"status": "active"`

### Step 7 — Commit
After PASS: `git commit` with message `feat(P#): story title`. Never use `--no-verify`.

### Step 8 — HALT on BLOCKED
```
------------------------------------------------------------
[YYYY-MM-DD HH:MM] LOOP HALTED
REASON: Story {id} is BLOCKED
BLOCKER: {specific error}
ACTION REQUIRED: {what the user must do}
------------------------------------------------------------
```

## Blocked story rules

A story is BLOCKED when:
- A required service is not running (check: `pg_isready -h localhost -p 5436`)
- A required env var is missing (check: `cat apps/api/.env`)
- A command errors and cannot be fixed in 2 attempts

To resume: fix the blocker, set story back to `"status": "todo"`, re-run ralph.sh.

## Verification commands

```bash
# Static gates (every code story)
npm run check        # tsc --noEmit across all workspaces
npm run test         # vitest across all workspaces

# Database
cd apps/api && pg_isready -h localhost -p 5436
cd apps/api && npx prisma migrate status
cd apps/api && npx prisma migrate dev --name <name>

# Server health
curl -s http://localhost:4003/health

# API smoke test
curl -s -X POST http://localhost:4003/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","description":"Test project","topic":"Web app"}'

# Frontend
curl -s http://localhost:5182 | head -c 200
```

## Critical file paths

| File | Purpose |
|---|---|
| apps/api/package.json | Backend dependencies |
| apps/web/package.json | Frontend dependencies |
| apps/api/prisma/schema.prisma | DB schema — source of truth |
| apps/api/src/app.ts | Express entry point |
| apps/api/src/routes/projects.ts | Project CRUD + share token |
| apps/api/src/routes/sessions.ts | Session create + messages |
| apps/api/src/routes/export.ts | PRD export (md + ralph JSON) |
| apps/api/src/services/claude.ts | Anthropic SDK integration |
| apps/api/src/services/interview.ts | Role-adaptive prompts, completion detection |
| apps/api/src/services/prd-writer.ts | Claude PRD synthesis after each session |
| apps/web/src/pages/Home.tsx | Project list |
| apps/web/src/pages/NewProject.tsx | Create project form |
| apps/web/src/pages/ProjectDashboard.tsx | Shared PRD view + sessions + export |
| apps/web/src/pages/JoinSession.tsx | Stakeholder landing page |
| apps/web/src/pages/ChatSession.tsx | Chat interview interface |
| packages/contracts/src/index.ts | Zod schemas + shared types |
| .ralph/prd.json | Story status — updated each iteration |
| .ralph/progress.txt | Iteration reports — append only |

## Environment setup

```bash
# 1. Start Postgres
docker compose up -d postgres

# 2. API setup
cd apps/api
cp .env.example .env
# Edit .env — choose ONE provider:
#
#   Option A (Anthropic):
#     LLM_PROVIDER=anthropic
#     ANTHROPIC_API_KEY=sk-ant-...
#
#   Option B (RunPod Ollama):
#     LLM_PROVIDER=ollama
#     OLLAMA_BASE_URL=https://your-pod-id-11434.proxy.runpod.net
#     OLLAMA_MODEL=qwen2.5:72b-instruct-q5_K_M
#     OLLAMA_MAX_TOKENS=10000
#
npm install
npx prisma migrate dev --name init
npm run dev   # :4003

# 3. Web setup (new terminal)
cd apps/web
npm install
npm run dev   # :5182
```

## Code quality rules

- Every API route validates input with Zod
- No placeholders in production code paths (no TODO, [INSERT], [TBD])
- TypeScript must compile clean — `npm run check` green before any story is marked done
- `npm run test` must pass before marking done
- No `--no-verify` on git commits
- Anthropic SDK calls use `claude-sonnet-4-6` model
