# AI Development Pipeline — Rules & Setup

## Overview Chart

```text
                                                                                            |
                                                                                            v
         THE PIPELINE -- YELLOW = DEVELOPER, BLUE = AGENT                             HUMANS DECIDE

    +-[YELLOW]-----------------------------------------------+
    |  STAGE 0 -- Prerequisites check & kickoff (DEVELOPER)  |
.-->|    clear requirements + finished design (if UI) --     |
:   |             complete, or back as questions             |
:   | Input: design-pipeline/features/<name>/ (teal italic)  |
:   +--------------------------------------------------------+
:                                |
:                                v
:   +-[BLUE]-------------------------------------------------+        +-[YELLOW]---------------------------------+
:   |                STAGE 1 -- Planner agent                |        |           PLAN . the developer           |
:   |        tasks (backend/frontend) . API contract         |------->| correct in a loop . approve . log the go |
:   |               data mapping . self-checks               |        +------------------------------------------+
:   |            Tool: Claude Code (teal italic)             |
:   +--------------------------------------------------------+
:                                |
:                                v
:   +-[YELLOW]-----------------------------------------------+
:   |          STAGE 2 -- Architecture (DEVELOPER)           |
:   |       schema, service boundaries, trade-offs --        |
:   |                 authored, not approved                 |
:   |   Output: short notes in decisions.md (teal italic)    |
:   +--------------------------------------------------------+
:                                |
:                                v
:   +-[BLUE]-------------------------------------------------+        +-[YELLOW]---------------------------------+
:   |        STAGE 3 -- Backend agent + Tester agent         |        |       CORRECTIONS . the developer        |
:   |       builds per plan + rules/backend.md . tests       |------->|   review passes . written instructions   |
:   |              alongside . red tests block               |        +------------------------------------------+
:   |    Tool: Claude Code, feature branch (teal italic)     |
:   +--------------------------------------------------------+
:                                |
:                                v
:   +-[BLUE]-------------------------------------------------+        +-[YELLOW]---------------------------------+
:   |        STAGE 4 -- Frontend agent + Tester agent        |        |       CORRECTIONS . the developer        |
:   |      screens from design system via Code Connect       |------->|   review passes . written instructions   |
'---|               every state . wired to API               |        +------------------------------------------+
    |    Tool: Claude Code, feature branch (teal italic)     |
    +--------------------------------------------------------+
                                 |
                                 v
    +-[BLUE]-------------------------------------------------+        +-[YELLOW]---------------------------------+
    |    STAGE 5 -- QA agent (end to end, gates the PRs)     |------->|         FIX LOOP . the developer         |
    |          walks every flow on a running build           |        |        failures back to builders         |
    |           empty/error/loading . qa-report.md           |<-------|            repeat until green            |
    |    Tool: Claude Code + running build (teal italic)     |        +------------------------------------------+
    +--------------------------------------------------------+
                                 |
                                 v
    +-[BLUE]-------------------------------------------------+        +-[YELLOW]---------------------------------+
    |             STAGE 6 -- PRs: agents create,             |        |    MERGE . frontend / backend member     |
    |               Review agent reviews first               |        |         FE PR -> frontend member         |
    |          two PRs split by craft . pre-filled           |------->|         BE PR -> backend member          |
    |                green QA report required                |        |              no self-review              |
    |        Tool: Claude Code + GitHub (teal italic)        |        +------------------------------------------+
    +--------------------------------------------------------+
                                 |
                                 v
    +-[GRAY]-------------------------------------------------+
    |       merge -> STAGING deploys automatically --        |
    |               "staging is up" to design                |
    |   design's post-build check runs against this build    |
    +--------------------------------------------------------+
                                 |
                                 v
    +-[YELLOW]-----------------------------------------------+
    |  STAGE 7 -- Must-fix verdicts (with the design team)   |
    |   fix -> re-QA -> re-review -> merge . then release    |
    |               to production (one click)                |
    +--------------------------------------------------------+
                                 |
                                 v
    +-[GREEN]------------------------------------------------+
    |             IMPROVEMENT HABIT -- recurring             |
    |   every repeated review comment becomes a rules-repo   |
    |                PR or a skill self-check                |
    +--------------------------------------------------------+
```

Note:

- Dashed gray line (left gutter, `:`): runs from STAGE 4 back up to STAGE 0. Its vertical label reads: **"missing / wrong in the package -> ask the designer, never guess"**.

### Legend

```text
[BLUE]    AI agent (a Claude Code skill) -- produces + self-checks
[YELLOW]  The developer / the guilds -- authorship, decisions, merges
[GRAY]    Outside this pipeline
[GREEN]   Learning loop -- how the pipeline gets faster over time

Line in each box marked with `(teal italic)` = which tool that stage uses
```

## Setup Overview

**Team**: 6 developers (2 frontend-oriented, 4 backend-oriented) Tools: Claude Code, GitHub, GCP (dev / staging / production), the design pipeline's frozen packages. Claude handles the producing (planning, backend, frontend, tests, QA runs, PR reviews) through skills.

**The big idea**: One developer runs one project end to end — frontend and backend — with the agents as the team. The developer authors the architecture and makes the decisions; agents plan, build, test, QA, and open the pull requests. Nothing merges without a human: frontend PRs are reviewed and merged by a frontend team member, backend PRs by a backend team member. Yellow boxes are the developer's work, blue boxes are agent work.

**Where it starts**: every project has two prerequisites before any agent touches it — clear requirements, and the finished design (if the feature has a UI; pure backend work needs only the requirements). The developer checks personally that both are complete before handing anything to agents. Agents build fast in whatever direction they're pointed — pointed at gaps and guesses, they build the wrong thing fast. For features coming from the design pipeline, the frozen package is that input: the brief, the Figma links, the data sheet, the API sketch, the documentation, and the decision log. If something is missing, it goes back as a question — never gets guessed.

## GitHub Is Where Code Lives

This rule is not negotiable:

**GitHub is where code lives. Branches are the sketchpad. Claude is the brain.**

- Nothing is "real" until it's merged. Agents work on feature branches; the main branch only ever changes through a pull request reviewed by an agent AND approved by a human.
- One name everywhere: design feature folder = feature branch = PR title. One thread from stakeholder conversation to production.
- The frozen design package is the spec. Deviations get logged in the feature's `decisions.md`, never made silently — this is the mirror rule from the design pipeline, and it's what makes the design team's post-build check meaningful.
- Chats are throwaway; commits, files, and PR threads are permanent. Any output worth keeping is committed before the session ends.
- **Three environments, all on GCP**: `dev` (where the QA agent runs the feature end to end before any PR exists), `staging` (deployed after merge — where the design team's post-build check runs and stakeholders click), and `production` (released only after staging is verified). Code moves forward only: `dev → staging → production, never sideways.`

## The 6 Agents

An "agent" here is a saved Claude Code instruction set (a skill) — a detailed prompt written once and reused forever.


| Agent | What it does | Works in |
| --- | --- | --- |
| 1. Planner | Reads the frozen design package and turns it into an implementation plan: breakdown (backend / frontend), the API contract grown from the design's API sketch, data mapping checked against  `data-sources.md`, and what NOT to build | Claude |
| 2. Backend | Builds the backend per the approved plan: models, migrations, endpoints, business logic — following  `rules/backend.md` | Claude Code, feature branch |
| 3. Frontend | Builds the frontend per the approved plan and the Figma package: screens from the design system components (via Code Connect), every state, wired to the API — following `rules/frontend.md` | Claude Code, feature branch |
| 4. Tester | Writes and maintains the automated tests alongside the build: unit and integration tests for everything Backend and Frontend produce. Red tests block progress | Claude Code, feature branch |
| 5. QA | Runs the feature **end to end on a running build** before any PR exists: walks every flow like a real user against the frozen package and the Definition of Done — happy path, empty, error, loading, permissions, refresh mid-flow. Writes the QA report. **No green QA report = no pull request** | Claude Code + running build |
| 6. Review | Reviews every PR before a human sees it: against the stack rules, the design package, `decisions.md`, security basics, and test coverage. The producing agent fixes; the Review agent re-reviews until it approves. Only then do humans review | Claude Code + the PR |

Every agent that produces something also checks its own work first — the skill ends with "review the output against this checklist, fix what fails, then show it."

**The line between human and agent, in one rule**: if the work sets structure or carries responsibility — architecture, non-obvious trade-offs, plan approval, merge decisions, talking to the designer — a human does it (the yellow boxes). If the work is producing, testing, checking, or assembling, an agent does it and a human corrects it (the blue boxes). A wrong architecture looks fine on review and gets expensive later; that's why architecture is authored, not approved.

## Rules: One Rulebook Per Technology, Owned by the People Who Know It

This is the backbone of quality across six developers and every project. Three layers:

1. **One shared rules repo** —  `engineering-rules/`  — cloned into (or synced into) every project repo. It holds one rules file per technology:

```text
  engineering-rules/
  ├── rules/
  │   ├── backend.md    ← Rails conventions, service patterns, migrations, API
  standards, security
  │   ├── frontend.md   ← Vue/Nuxt conventions, component usage, state management,
  design system rules
  │   └── shared.md     ← naming, GitHub conventions, PR format, testing standards,
  logging
```

2. **Ownership follows the craft — this rule is not negotiable**:
  - `rules/frontend.md`  is written and maintained **only by the 2 frontend team members**. Anyone can suggest a change (as a PR to the rules repo); a frontend member approves it.
  - `rules/backend.md` is written and maintained **only by the 4 backend team members**, the same way.
  - `rules/shared.md` changes need one approval from each side.
3. **Same technology = same rules, everywhere**. Because there is exactly one `backend.md` and one `frontend.md` , every project built on the same stack follows the same rules automatically. No project gets its own private conventions. If a project genuinely needs an exception, it goes in that feature's `decisions.md` with a reason — visible, never silent.
4. **Each project repo's `CLAUDE.md` sits at the repo root** and contains: what the project is in five lines, where the rules live (pointing at the synced `rules/`  files), the mirror rule ("Before building a feature, read its folder in `design-pipeline/features/`. The frozen package is the spec. Deviations get logged, never made silently."), and the universal rules below. One `CLAUDE.md` per repo — never per feature.
5. Rules that go in every skill:
  - Never invent endpoints, fields, data sources, or business rules. Unknown ask or mark UNVERIFIED, never guess.
  - The frozen design package is the spec. The design system components (via Code Connect) are the only frontend building blocks — a missing component gets flagged to the designer, not improvised.
  - Follow  `rules/backend.md`  /  `rules/frontend.md`  /  `rules/shared.md` exactly. A rule that seems wrong gets challenged as a PR to the rules repo, not ignored.
  - Red tests block progress. A failing test is fixed, not skipped or deleted.
  - Commit every output before the session ends. A chat that ends without a commit produced nothing.

## Which Model for Which Agent

Same budget logic as the design pipeline: cost is **model tier × call frequency** Sonnet has its own separate weekly pool on Premium seats; Fable is included at half the plan's limits and is the scarcest resource. So:
**Fable for the once-per-feature planning and judgment calls, Sonnet for everything that loops, Opus as the step in between.**

| Agent | Model | Why |
| --- | --- | --- |
| 1. Planner | Fable | The planning call everything depends on — a weak plan wastes a whole build. Runs once or twice per feature, so it costs almost nothing against the cap |
| 2. Backend | Sonnet | High-volume building inside an approved plan and strict rules — the busiest agent, keep it on the Sonnet pool |
| 3. Frontend | Sonnet | Same: assembly from the design system with the plan and rules as guardrails |
| 4. Tester | Sonnet | Writing tests against a spec — well-defined work |
| 5. QA | Sonnet for mid-build smoke runs — Fable for the final full end-to-end run | The final run is the judgment call that gates the pull request: does this actually match the design intent? Once per feature before the PR |
| 6. Review | Opus — Fable if a review is disputed | Code review is judgment, and it runs once or twice per PR. Opus handles it; escalate a single disputed call to Fable rather than running everything there |

**The escalation ladder**: every agent starts one tier below its listed model. An agent earns its upgrade the first time its output disappoints at a review, and earns Fable the second time. Never let a looping agent sit on Fable permanently — if a loop keeps needing Fable, fix the skill (better example, tighter self-check), not the model.

**Token discipline that costs nothing**: keep each skill's "Read first" list minimal; one feature per session, always; and put one gold example in every skill — a real plan, a real QA report, a real PR description from a past feature considered excellent.

## Collaboration Structure — Shared Context

Dev files live with the code. The design-pipeline repo is the **spec** — developers read it, and write to exactly one file in it: the feature's  `decisions.md`. Everything the dev pipeline produces lives in the project code repo, versioned next to the code it describes.

### The project code repo (where dev works):

```text
<project-repo>/
├── CLAUDE.md            ← the project rulebook (points at the synced rules/)
├── rules/               ← synced from the engineering-rules repo
└── features/
└── <feature-name>/      ← same name as the design folder and the branch
├── plan.md              ← Stage 1 output: tasks, API contract, data mapping (approved version)
├── qa-report.md         ← Stage 5 output: the end-to-end run results, updated each run
└── status.md            ← one line: current stage + what happens next
```

### The design-pipeline repo (the spec — read everything, write one file):

- **Read**: `brief.md`, `structure.md`, `docs/`, `handoff.md`  — the frozen package.
- **Write**: the feature's `decisions.md`  only — dev appends its entries there so there is ONE decision log per feature that both teams share. This single shared file is what makes design's post-build check meaningful and disputes easy to settle.

### What goes in each file

| File | What needs to be in it | Who writes it |
| --- | --- | --- |
| `features/<name>/plan.md` | The task breakdown (backend / frontend), the API contract grown from the design's API sketch, the data mapping (field → source → sync notes, UNVERIFIED items resolved or  escalated), the build order, and what's out of scope. | Planner agent drafts; the developer corrects and approves |
| `decisions.md`  (in design-pipeline) | The same log design uses — the only file dev writes in the design repo. Dev adds: architecture choices and why, approved deviations from the package (with the designer's OK), resolved UNVERIFIED items, anything a future agent must not undo. One entry: date — decision — why. | Whoever's stage produced the decision; the developer owns dev entries |
| `features/<name>/qa-report.md` | Every end-to-end run: what was walked, what passed, what failed, with the failing state named (empty / error / loading / permission). The final green report is attached to the PRs. | QA agent |
| `features/<name>/status.md` | One line, overwritten each session: current stage + what happens next ("Stage 4 running — next: QA full run"). | Whoever ends the session |
| Project repo `CLAUDE.md` | The project in five lines, pointers to the synced  `rules/`  files, the mirror rule, the universal rules. | The developers, once per repo; guild-owned rules live in the rules repo, not here |

### The collaboration rules

1. **Files are the memory**. Plans, QA reports, and status live in the code repo's feature folder; decisions go to the shared `decisions.md`  in the design repo. All committed before the session ends — if it's not committed, it didn't happen.
2. **One feature = one branch = one session at a time**. Never mix two features in one agent session.
3. **Every agent session starts by loading both**: the design package (the spec) and the code repo's feature folder (the dev state). The mirror rule in `CLAUDE.md` makes this automatic.
4. **`decisions.md` is only ever added to**. Running solo on a project, this log matters more, not less — it's the witness when anyone later asks "why was it built this way?"
5. **Feedback to agents is written as instructions, not reactions**. Not "this code smells" — instead "extract the sync logic into a service object; endpoints must not call external APIs directly." Written instructions get done; reactions get interpreted.
6. **Rule improvements go to the rules repo, not into chat**. A review comment that would apply to every project becomes a PR to `rules/frontend.md` or `rules/backend.md` , approved by that guild.

## Pull Requests: Created by Agents, Merged by Humans

This is the quality gate of the whole pipeline. The flow, per feature:

1. Two PRs, split by craft. The agents open separate pull requests for backend and frontend (backend usually first — the API the frontend builds against). Separate PRs exist so the right humans review the right code.
2. No PR without a green QA report. The QA agent's final end-to-end run must pass before either PR is created. The green `qa-report.md` is linked in every PR description.
3. The agent writes the PR properly. Pre-filled description: what and why (from the brief), link to the feature folder, the plan, the QA report, screenshots against the Figma frames (frontend), any logged deviations. A reviewer should never have to ask "what is this?"
4. The Review agent goes first. It reviews against the stack rules, the design package, `decisions.md`, security basics, and test coverage — and posts its findings on the PR. The producing agent fixes; the Review agent re-reviews. Humans only see PRs the Review agent has already approved.
5. Then the human — and this rule is absolute: - Frontend PRs: reviewed and merged by one of the 2 frontend team members. - Backend PRs: reviewed and merged by one of the 4 backend team members. - Nothing merges without that human approval. Ever. Not urgent features, not one-line changes, not the project owner's own code. - No self-review: if the developer running the project is a frontend member, their frontend PR goes to the other frontend member. Same for backend.
6. Enforced by the platform, not by discipline. Branch protection on main + a `CODEOWNERS` file: frontend paths owned by the frontend team, backend paths owned by the backend team. GitHub then physically refuses to merge without the right guild's approval — the rule can't be forgotten on a busy day.

**What the human reviews for** (the agents already checked rules, tests, and design match): does the architecture make sense, is this how we would build it, is anything here we'll regret in six months. Judgment — the part the agents can't own. A human comment that would apply everywhere becomes a rules-repo PR, so the agents inherit it and never make that mistake again.

## Deployment: Dev → Staging → Production

All three environments run on GCP. The setup itself (services, pipelines, secrets) is a one-time job — after that, deployments are automatic and boring, which is the goal.

| Environment | What runs there | Who/what deploys | When |
| --- | --- | --- | --- |
| Dev | The feature branch, with realistic test data | Automatic on every push to the feature branch | Continuously during Stages 3–5 — this is the running build the QA agent walks end to end |
| Staging | The main branch — production-like data shape, no real patient data | Automatic on every merge to main | After the guild merges the PRs — the design team's post-build check and stakeholder clicks happen here |
| Production | The released version | A human presses the button (the developer running the feature, after staging is verified) | Only after staging is green: post-build must-fixes done, verdicts closed |

### The rules:

- **Merge = staging**. Nothing extra to do — a merged PR is on staging minutes later, and the "staging is up" message to the design team is part of the merge routine. -
- **Production is a human decision, never automatic**. One click, by the developer, after the design team's verdicts are closed. The release is tagged with the feature name — one name from stakeholder conversation to production, traceable end to end.
- **Environment configuration lives in the repo** (pipeline definitions, per-environment config), so agents can read how deployment works — **but secrets and GCP access never appear in any file an agent writes**. Unknown config = ask, never guess.
- **Rollback is one step back, not a firefight**: if production misbehaves, redeploy the previous tag first, investigate second. The fix then flows through the normal path — branch, QA, PR, review — never patched directly on production.
- If a deploy fails, the agent that can read the pipeline logs drafts the diagnosis; the developer decides the fix.

**Result**: Environments nobody thinks about. The QA agent always has a running build, the design team always has a staging to check, and production only ever receives features that survived both.

## Getting Started — Day One and the First Feature

**Read this first**: you only ever create two things by hand — the feature folder in the code repo, and your own yellow-stage outputs (architecture notes, decision entries). Every other file appears when its agent runs.


### One-time setup for the whole team (one day)

1. **Create the `engineering-rules` repo**. Frontend members write the first  `rules/frontend.md`, backend members write the first `rules/backend.md`, everyone agrees `rules/shared.md`. First versions — aim for "agents can build from it," not perfect. Gaps get fixed the first time an agent hits them.
2. **Set up branch protection + `CODEOWNERS`** on each project repo: frontend paths → frontend team, backend paths → backend team, required review before merge.
3. **Set up the three GCP environments** (dev, staging, production) with automatic deploys: feature branch → dev, merge to main → staging, production behind a manual release step. One-time plumbing — after this, nobody thinks about deployment.
4. **Write each project repo's `CLAUDE.md`** (five lines + pointers + mirror rule) and sync the rules files in.
5. **Write two skills only**: `01-planner.md` and  `02-backend.md`. The rest get written the day their stage first arrives. By the end of feature #1 all six exist, each tested on real work.

### Per developer, once (five minutes)

Clone the project repo and the design-pipeline repo side by side. Open Claude Code at the project root — `CLAUDE.md` loads automatically every session from now on.


### Running a feature (the repeatable routine)

1. Design's package freezes → create the feature branch and `features/<feature-name>/` in the project code repo (same name as the design folder).
2. **Stage 0 (you):** check the prerequisites first — clear requirements, and the finished design if the feature has a UI. Not complete = not handed to agents; send the gaps back as questions. Then read the package — handoff, brief, decisions, docs — sit with the designer for the walk-through, and chase the UNVERIFIED data items to their sources.
3. **Stage 1:** run the Planner → it writes `features/<name>/plan.md`. Correct it in a loop, approve, log the go in `decisions.md`.
4. **Stage 2 (you):** author the architecture — schema changes, service boundaries, the non-obvious trade-offs. Short notes into `decisions.md`. An agent may propose rough options to react against; you decide and write why.
5. **Stages 3–4:** Backend agent builds, then Frontend agent builds — Tester runs alongside both, red tests block progress. You review outputs and correct with written instructions.
6. **Stage 5:** QA agent runs the feature end to end on the running build. Failures loop back to the building agents. Repeats until green.
7. **Stage 6:** agents open the two PRs → Review agent reviews and the builders fix → the frontend member and a backend member review and merge. You never merge your own craft's PR.
8. The merge lands on staging automatically → tell the design team "staging is up" (their post-build check runs) → must-fix verdicts come back as drafted tickets → fix, re-QA, re-review, merge.
9. Staging green and verdicts closed → release to production: one click, tagged with the feature name.
10. End every session: one line in `status.md`, commit.

### Running more than one project

Same as the design pipeline: six developers, six feature branches, one rules repo. Each developer's morning orientation is their feature's `status.md` line. One feature per session, never mixed. Review load spreads across the guilds — with 2 frontend reviewers for six projects, frontend review is the bottleneck to watch: keep frontend PRs small and well-described so review takes minutes, not hours.

## Stage 0 — Receive the Package & Kickoff (Human)

**The developer. No AI in this stage.** This stage is a gate: **the project does not move to agents until the prerequisites are complete.**

### The prerequisites checklist:

- **Clear requirements** — what the feature must do, for whom, and what success looks like. If the feature has a UI, this comes as the frozen design package; if it's pure backend (a sync job, an integration, an internal service), a clear written brief is enough — but it must exist as a file, not as "we discussed it."
- **The design, if applicable** — for anything with a UI: the Figma files, every state, the documentation. No "the design is almost done, start anyway" — an agent building against a moving design builds twice.
- **The data answered** — every UNVERIFIED item in the data sheet chased to its real source (AthenaOne, CorePoint, Snowflake, BAMF OS) and logged in `decisions.md`.

Read the package end to end: `handoff.md`, `brief.md`, `decisions.md`, the docs, the Figma files. Then sit with the designer for a live walk-through — the handoff is a working relationship, not a file drop. Ask now what would otherwise become guesses later.

**One rule:** the package is the spec. If something is missing or wrong, it goes back to the designer (or the requester) as a question — never gets silently "fixed" in code. A day spent completing the prerequisites is cheaper than a week of agents building on guesses.

**Result:** The build starts from real understanding of the why, not just the what.

## Stage 1 — Plan (Agent drafts · Human corrects · loop)

**The Planner agent:** reads the project `CLAUDE.md`, the rules, and the whole feature folder — then writes `features/<name>/plan.md`: the task breakdown split backend/frontend, the API contract grown from the design's API sketch, the data mapping checked against `data-sources.md`, the build order, and what's explicitly out of scope. Every claim cites its source in the package; anything without one is marked UNVERIFIED. It ends with its open questions listed — a plan that shows its seams invites correction instead of rubber-stamping.

**The developer — correct and decide.** Correct the plan, the agent revises, repeat until it's right. Then approve and log the go in `decisions.md`.

**Result:** A plan the developer owns before a line of code exists. Bad approaches die here, where they're free.

## Stage 2 — Architecture (Human)

**The developer authors the technical structure — this is the point**. The plan says what to build; it doesn't decide how the system should think. Schema changes, service boundaries, where the sync logic lives, what happens when AthenaOne is slow — these are the decisions that look fine on review and get expensive later, which is why they're authored, not approved. Working through them yourself is where the hard questions surface ("wait — what happens when the dose record updates mid-request?").

Short architecture notes go into `decisions.md`: what was chosen and why. On request, an agent can propose rough competing options to react against — never the draft; the developer decides and writes the why.

**Result:** A structure someone owns and can defend in review.

## Stage 3 — Backend Build (Agent, with Tester)

**The Backend agent** builds per the approved plan and `rules/backend.md`: migrations, models, services, endpoints matching the API contract. It never invents fields or business rules — unknowns get flagged. **The Tester agent** writes the unit and integration tests alongside; red tests block progress, and a failing test gets fixed, never skipped or deleted. The developer reviews in passes and corrects with written instructions.

**Result:** A tested backend the frontend can build against.

## Stage 4 — Frontend Build (Agent, with Tester)

**The Frontend agent** builds per the plan, the Figma package, and `rules/frontend.md`: screens from the design system components via Code Connect — never hand-rolled lookalikes — every state the design specifies (normal, empty, loading, every error), wired to the real API. A design component that has no code counterpart gets flagged to the designer, not improvised. The Tester agent covers it; the developer reviews and corrects.

**Result:** Screens that match the frozen design because they're built from the same components it was.

## Stage 5 — QA End-to-End (Agent ⇄ fix loop — gates the PRs)

**The QA agent** runs the feature on the dev environment — a real running build — before any pull request exists. It walks every flow like a real user against the frozen package and the Definition of Done: happy path, empty, error, loading, permission denied, refresh mid-flow, slow data from AthenaOne. Every run is written to `features/<name>/qa-report.md` with failures named precisely. Failures go back to the Backend/Frontend agents as fixes; the loop repeats until the report is green.

**No green report = no pull request.** This is the gate that means humans only ever review working features — and it works because the dev environment always has the feature branch running, automatically.

**Result:** Reviewers review code quality, not broken features.

## Stage 6 — Pull Requests (Agents create · Agents review · Humans merge)

The full flow is in the Pull Requests section above. In short: two PRs split by craft, pre-filled descriptions with the QA report linked, the Review agent reviews first and the builders fix — **then a frontend member reviews and merges the frontend PR, a backend member the backend PR**. Nothing merges without that human. No self-review. Enforced by `CODEOWNERS` and branch protection, not memory.

Every human review comment that would apply to other projects becomes a PR to the rules repo — that's how the guilds' judgment compounds across all six developers.

**Result:** Human judgment exactly where it matters, on features that already work.

## Stage 7 — Staging, the Design Check & Release (Human coordinates)

The merge lands on staging automatically — tell the design team "staging is up" — their post-build check agent compares what shipped against the frozen Figma package and sorts the differences. Must-fix verdicts come back as drafted tickets with the exact frame linked: fix them, re-run QA, re-review, merge. "Fine" deviations get logged in the shared `decisions.md` so both sides' files stay true. When the verdicts are closed and staging is green, the developer releases to production — one click, tagged with the feature name.

**The seam rule:** design's handoff = this pipeline's Stage 0, and design's post-build check runs against this pipeline's staging build. Those two touchpoints are the entire connection — everything else stays separate, so either pipeline can improve without breaking the other.

## Who Decides What

Every decision on a feature belongs to the one developer running it: the plan (approve / redo), the architecture (authored, not just approved), resolving UNVERIFIED items, when QA is genuinely done, and the deviations worth asking the designer about. Two decisions never belong to them alone: **merging frontend code (a frontend member) and merging backend code (a backend member)**. And the rules belong to the guilds: frontend rules to the 2 frontend members, backend rules to the 4 backend members.

Everything else — planning drafts, backend code, frontend code, tests, end-to-end runs, PR descriptions, first-pass reviews — is agent work with agent self-checks. The developer's calendar should be mostly reading, deciding, and reviewing; if hand-coding is creeping back in, a skill needs fixing.

### What stays human, and why

- **Checking the prerequisites and sitting with the designer (Stage 0).** The developer personally confirms the requirements and design are complete before agents start — agents pointed at gaps build the wrong thing fast. And the why behind the feature lives in this conversation, not in the files alone.
- **Architecture (Stage 2).** A wrong structure, executed perfectly by agents, is the most expensive mistake possible — and it looks fine on review.
- **Merge approval, split by craft.** Six developers each running full-stack projects means everyone ships outside their strongest craft. The guild review is what keeps frontend quality owned by frontend people and backend quality by backend people — and it's where the team teaches its agents, one review comment at a time.
- **The rules.** `rules/frontend.md` and `rules/backend.md` are the guilds' judgment written down. Agents follow them; only the guild changes them.
- **Talking to the designer about deviations.** A deviation is a conversation, then a logged decision — never a silent edit.

## The Improvement Habit

On a regular rhythm: look at every correction made by hand — every plan fix, every human review comment, every QA failure the agents should have caught themselves. Each one that repeats becomes either a new self-check line in the relevant skill or a PR to the rules repo, approved by the right guild. The agents inherit the team's judgment one rule at a time — this is why the pipeline needs less human effort the longer it runs, and why all six developers' agents get better every time any one of them reviews a PR.

**Rules edition.** Skills, `CLAUDE.md`, and the rules repo are living documents: when output disappoints, fix the rule, not the output.
