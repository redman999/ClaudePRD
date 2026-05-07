#!/usr/bin/env bash
set -e

if [ -z "$1" ]; then
	echo "Usage: $0 <iterations>"
	exit 1
fi

for ((i=1; i<=$1; i++)); do
	echo "--------------------------------"
	echo "Iteration $i"
	echo "--------------------------------"
	# Kill any orphaned dev servers from previous iterations before starting
	fuser -k 4003/tcp 2>/dev/null || true
	fuser -k 5182/tcp 2>/dev/null || true
	pkill -f "ts-node-dev" 2>/dev/null || true
	pkill -f "vite" 2>/dev/null || true
	sleep 1
	result=$(claude --permission-mode bypassPermissions -p "study ./.ralph/prd.json and ./.ralph/loop.md

1. PICK THE NEXT STORY IN STRICT PHASE ORDER. Open .ralph/prd.json. Find the FIRST phase whose status is \"active\". Within that phase, find the FIRST story whose status is \"todo\". That is the story you must work on. Do NOT skip ahead to later stories or later phases, even if they look easier or look like they have no infrastructure dependencies. The PRD ordering reflects integration order — skipping it accumulates untested integration risk.

   If the chosen story turns out to be unworkable (a required service is down, a required env var is missing, a tool errors out and you can't fix it within 2 attempts), do NOT pick a different story. Instead:
     - First, actually TEST whether the dependency is available. If a story says \"PostgreSQL running on port 5436\", run \`pg_isready -h localhost -p 5436\` or \`docker ps | grep postgres\` to verify — do not assume it is down.
     - Only if a real blocker is confirmed, mark the story \"blocked\" in prd.json with a specific reason in completion_notes, write a HALT entry to .ralph/progress.txt, and exit without committing. The user will unblock and re-run the loop.

2. Read the story's description, acceptance_criteria, and output_files. Implement the story to satisfy ALL acceptance criteria. Test each one concretely (curl, psql, file inspection, tsc --noEmit, vitest run) — do not assume.

3. Verify types check via 'npm run check' at the repo root (runs tsc --noEmit and eslint across workspaces). Verify unit tests via 'npm run test'. If either fails, the story is not done — fix root cause, do not weaken types, do not skip tests.

4. Update prd.json: mark the story status \"done\", add a \"completed\" date and a \"completion_notes\" string summarising what was done.

5. Append a structured iteration report to .ralph/progress.txt (NOT progress.md — progress.txt is the canonical log). Use the format documented in loop.md: a header line with timestamp, story id, status; a CRITERIA block with PASS/FAIL/SKIP per criterion; a NOTES paragraph.

6. Make a git commit of the feature. Use a clear commit message starting with the story id (e.g. \"P1-S1 — install dependencies and run type-check clean\").

ONLY WORK ON A SINGLE STORY.
If, while implementing the story, you notice the entire PRD is complete (every story in every phase has status \"done\"), output <PROMISE>COMPLETE</PROMISE>.

If you need additional permissions to complete the task, first double-check that you don't already have them via bypassPermissions. If you have the necessary permission, proceed. Otherwise print the permissions you need with <PROMISE>NEED_PERMISSIONS</PROMISE> and exit.
")

	echo "$result"
	echo ""

	if [[ "$result" == *"<PROMISE>NEED_PERMISSIONS</PROMISE>"* ]]; then
		exit 1
	fi
	if [[ "$result" == *"<PROMISE>COMPLETE</PROMISE>"* ]]; then
		echo "PRD complete, exiting."
		exit 0
	fi
done
