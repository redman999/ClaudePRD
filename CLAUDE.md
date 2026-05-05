# CLAUDE.md — ClaudePRD

## What this project is

ClaudePRD is a web app for AI-powered PRD generation. A project creator sets up a
project (name, description, topic), shares a link with stakeholders, and each
stakeholder has a role-adaptive Claude interview. Claude asks drilling questions,
detects coverage completeness, and synthesizes all session inputs into a live shared
PRD. The PRD exports as Markdown and as ralph-compatible `prd.json`.

## Tech stack

- **Backend** — Node 20 + TypeScript, Express 4, Prisma 5 + PostgreSQL 16, Zod, Anthropic SDK
- **Frontend** — React 18 + Vite + TypeScript, Tailwind CSS, React Router 6, react-markdown
- **AI** — claude-sonnet-4-6 via Anthropic SDK (interview prompts + PRD synthesis)
- **Deployment** — Railway; local dev via Docker Compose
- **Repo layout** — npm workspaces (`apps/api`, `apps/web`, `packages/contracts`)

## Ports (local dev)

| Service | Host port | Notes |
|---|---|---|
| Postgres | 5436 | Avoids clash with other local projects |
| API | 4003 | |
| Web (Vite) | 5182 | |

## Running locally

```bash
# 1. Start Postgres
docker compose up -d postgres

# 2. API
cd apps/api
cp .env.example .env
# Edit .env: set your ANTHROPIC_API_KEY
npm install
npx prisma migrate dev --name init
npm run dev   # :4003

# 3. Web (new terminal)
cd apps/web
npm install
npm run dev   # :5182
```

## Ralph loop — how to make progress

```bash
cd C:\Users\chris\ClaudePRD
.ralph/ralph.sh 30           # run up to 30 iterations
.ralph/ralph-once.sh         # run a single iteration
```

See `.ralph/loop.md` for the full iteration protocol and `.ralph/prd.json` for story status.

## Key design decisions

### Interview flow
- Claude conducts role-adaptive interviews (Developer, Business Owner, End User, PM, etc.)
- System prompt in `apps/api/src/services/interview.ts` — role guidance varies per stakeholder role
- Claude signals completion with `[INTERVIEW_COMPLETE]` on its own line, followed by a structured Markdown summary
- Backend detects this marker and triggers async PRD synthesis

### PRD synthesis
- Triggered fire-and-forget after each session completes
- `apps/api/src/services/prd-writer.ts` calls Claude with current PRD + all session summaries
- Claude returns `{markdown: string, ralphPrd: Phase[]}` as JSON
- Stored in `Project.prdMarkdown` and `Project.prdRalphJson`
- Exported at `GET /api/projects/:id/export/markdown` and `/export/ralph`

### Share link
- Each project has a unique `shareToken` (cuid)
- Stakeholders visit `/join/:shareToken` — enter name + role — redirected to `/session/:id`
- No login required
