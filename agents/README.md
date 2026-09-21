# BAMF agents — the six from AI-Dev-Pipeline-Rules-and-Setup.pdf

The PDF's "The 6 Agents" section, written out as Claude Code subagent files. An agent here is a
saved instruction set — a detailed prompt written once and reused forever.

| File | Agent | Stage | Model (PDF) | Works in |
|------|-------|-------|-------------|----------|
| `01-planner.md`  | Planner  | 1 | Fable | Claude Code |
| `02-backend.md`  | Backend  | 3 | Sonnet | feature branch |
| `03-frontend.md` | Frontend | 4 | Sonnet | feature branch |
| `04-tester.md`   | Tester   | alongside 3 & 4 | Sonnet | feature branch |
| `05-qa.md`       | QA       | 5 | Sonnet mid-build · Fable for the final run | running dev build |
| `06-review.md`   | Review   | 6 | Opus · Fable if disputed | the PR |

Stages 0, 2 and 7 have no agent: receiving the package, authoring the architecture, and the
staging check and release are the developer's (the yellow boxes).

## Install

Copy into a project so Claude Code discovers them:

```sh
mkdir -p <project-repo>/.claude/agents
cp BAMF-agents/0*.md <project-repo>/.claude/agents/
```

`~/.claude/agents/` makes them available in every project instead. Invoke by name — e.g. "use
the 01-planner agent on features/dose-schedule-override".

## Models and the escalation ladder

Each file's frontmatter carries the model the PDF lists for that agent. The PDF's ladder says
every agent *starts one tier below* its listed model, earns the upgrade the first time its output
disappoints at review, and earns Fable the second time — so lower the `model:` field when you
first stand an agent up, and raise it as it earns the tier. Never let a looping agent sit on Fable
permanently: if a loop keeps needing Fable, fix the agent file (better gold example, tighter
self-check), not the model.

## What these assume exists

- `CLAUDE.md` at the project repo root — the project in five lines, pointers to the synced
  `rules/`, the mirror rule, the universal rules.
- `rules/backend.md`, `rules/frontend.md`, `rules/shared.md` synced from the `engineering-rules`
  repo. Guild-owned: frontend rules by the 2 frontend members, backend rules by the 4 backend
  members, shared rules need one approval from each side.
- `features/<feature-name>/` in the code repo — `plan.md`, `qa-report.md`, `status.md`.
- `design-pipeline/features/<feature-name>/` — the frozen package, read-only except for
  `decisions.md`, the one file dev writes.

## The gates these files enforce

- **No green QA report = no pull request.** (`05-qa.md`)
- **Humans only see PRs the Review agent approved.** (`06-review.md`)
- **Nothing merges without a human from the right guild** — frontend PRs by a frontend member,
  backend PRs by a backend member, never the author. Enforced by branch protection and
  CODEOWNERS.
- **Red tests block progress.** A failing test is fixed, never skipped or deleted.
- **Unknown = ask or mark `UNVERIFIED`.** Never guessed.

## Gold examples

Every file ends with a gold example — a real plan excerpt, service, component, spec, QA report, or
review from past work considered excellent. Replace the placeholders here with BAMF's own once
feature #1 produces better ones; that is the cheapest quality lever in the pipeline.
