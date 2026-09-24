# Glossary — BAMF's Claude-based workflow

Shared vocabulary for the pipeline described in [ai-dev-pipeline.md](ai-dev-pipeline.md).

Two vocabularies overlap in our day-to-day, and most confusion comes from mixing them:

- **Claude Code terms** — defined by Anthropic. Canonical source:
  **<https://code.claude.com/docs/en/glossary#glossary>**. When this file and the official
  glossary disagree, the official glossary wins; fix this file.
- **BAMF org terms** — craft, guild, team. Ours. Nobody else defines these, so we do.

Each Claude Code entry links to its canonical anchor. This file explains *how we use* the term;
the link explains *what it is*.

---

## 1. Agents and delegation

### Agent

Generic term: a model running in a loop with tools, able to read files, run commands, and make
changes. Claude Code itself is an agent. See
[agentic coding](https://code.claude.com/docs/en/glossary#agentic-coding) and
[agentic loop](https://code.claude.com/docs/en/glossary#agentic-loop).

In `ai-dev-pipeline.md`, "the 6 agents" (Planner, Backend, Frontend, Tester, QA, Review) is used
in a **looser, organizational sense**: a named role in the pipeline with a saved instruction set.
That is a useful shorthand for talking about the process. It is not a precise statement about
which Claude Code mechanism implements it — see the note in §6.

### Subagent

[Canonical definition →](https://code.claude.com/docs/en/glossary#subagent)

A specialized assistant that runs **in its own context window**, with its own system prompt, tool
allowlist, and model. It receives one delegated task, cannot see the parent conversation, and
returns a single summary when done.

Defined as a markdown file with YAML frontmatter:

```
.claude/agents/<name>.md      # project scope, committed with the repo
~/.claude/agents/<name>.md    # user scope, available in every project
```

```markdown
---
name: 06-review
description: Reviews a PR against the stack rules and the frozen design package.
tools: Read, Grep, Glob, Bash
model: opus
---

System prompt for the subagent...
```

Ours live in [`agents/`](agents/) — `01-planner.md` through `06-review.md` — and are installed by
copying into a project's `.claude/agents/`.

### Agent vs. subagent — the actual difference

Same thing, named from different vantage points. "Subagent" is *relative to a parent*: an agent
spawned by another agent. Claude Code's own naming is inconsistent, which is the usual source of
confusion:

| Where | What it's called |
|---|---|
| Config directory | `.claude/agents/` |
| Documentation page | **Subagents** |
| The tool that spawns one | **Agent** (formerly `Task`) |

All three mean the same `.md` file. Use **"subagent"** when the parent/child relationship is the
point — context isolation, delegation, what gets returned. Use **"agent"** when it isn't.

One real constraint: a subagent stays inside the session that spawned it, and the main thread is
the orchestrator. "Subagent" reliably means *one level down from the conversation*, not an
open-ended tree.

### When to use a subagent

Reach for one when the work is **self-contained and you only want the conclusion**:

- **Large exploration** — sweeping many files to answer one question. The file dumps stay out of
  your main context; only the answer comes back.
- **Parallel work** — several independent investigations at once.
- **A restricted toolset** — a reviewer that can read and grep but not write.
- **Fresh eyes** — our Review agent should judge the diff on its merits, not be talked into it by
  the conversation that produced it. Context isolation is the feature, not a limitation.

**Don't** use one when the work needs the current conversation's context, or when the result is a
judgment you'll immediately iterate on with Claude. Starting blind costs a re-explanation; if
you'd spend more tokens briefing the subagent than doing the work inline, do it inline.

The trade-off in one line: **a skill spends main-thread context to keep continuity; a subagent
preserves context at the cost of starting blind.**

### Managed Agents

[Canonical docs →](https://platform.claude.com/docs/en/managed-agents/overview) · **Beta**

A different product plane from everything else in this glossary. Claude Managed Agents is an
Anthropic-hosted **agent harness** — you define an agent and Anthropic runs it, rather than you
running an agent loop on your own machine or server.

> "Pre-built, configurable agent harness that runs in managed infrastructure. Best for
> long-running tasks and asynchronous work."

Four concepts, per the docs:

| Concept | Is |
|---|---|
| **Agent** | the model, system prompt, tools, MCP servers, and skills — created once, referenced by ID |
| **Environment** | where sessions run: an Anthropic-managed cloud sandbox, or a self-hosted one on your infrastructure |
| **Session** | a running agent instance in an environment, doing one task |
| **Events** | messages between your application and the agent — user turns, tool results, status updates |

Claude gets Bash, file operations, web search and fetch, and MCP servers inside the sandbox.
Sessions are **stateful**: persistent filesystem, conversation history stored server-side,
resumable after pauses, and schedulable on a cron via scheduled deployments. You can steer or
interrupt a session mid-run by sending more events.

### Where Managed Agents sits relative to the rest

Three planes, easy to conflate:

| | Runs where | You build | Reach for it when |
|---|---|---|---|
| **Claude Code** | your machine (or a cloud session) | nothing — it's the finished harness | a developer is doing the work, interactively |
| **Agent SDK** | your infrastructure | your own loop, hosting, and sandboxing | you need full control over the loop |
| **Managed Agents** | Anthropic's infrastructure | agent config only | long-running, unattended, programmatic work |

**Not a substitute for a subagent.** A subagent is delegation *inside* one Claude Code session
and reports to that session. A Managed Agent is a separately deployed, API-invoked service with
its own sandbox and lifecycle — closer to a background worker than to a teammate in your session.

Where it could fit our pipeline: the unattended, repeatable stages — a scheduled nightly QA run
against the dev build, or a Review pass triggered by a PR webhook — work that shouldn't require a
developer's laptop to be open. The interactive stages stay in Claude Code.

> ⚠️ **Before we use this on anything patient-facing.** Because Managed Agents is stateful by
> design — conversation history, sandbox state, and outputs are stored server-side — it is
> **not currently eligible for Zero Data Retention (ZDR) or HIPAA Business Associate Agreement
> (BAA) coverage**. For BAMF Health that rules it out for any workload that could touch PHI until
> that changes. Sessions and uploaded files can be deleted via the API, but deletion after the
> fact is not the same as BAA coverage. Verify current eligibility in the
> [API and data retention docs](https://platform.claude.com/docs/en/manage-claude/api-and-data-retention#feature-eligibility)
> before building anything on it, and treat this entry as a snapshot, not a clearance.

---

## 2. Instructions: what Claude reads

### Skill

[Canonical definition →](https://code.claude.com/docs/en/glossary#skill)

A `SKILL.md` file containing instructions, knowledge, or a workflow. Claude loads it
**into the current conversation** when it judges it relevant — or you invoke it directly with
`/skill-name`.

```
.claude/skills/<name>/SKILL.md     # project scope
~/.claude/skills/<name>/SKILL.md   # user scope
```

```markdown
---
name: css
description: Tailwind and CSS conventions. Use when writing or reviewing styles.
---

Instructions...
```

The key property is **progressive disclosure**: only `name` and `description` sit in context
until the skill triggers. The body loads on demand, and bundled `references/`, `scripts/` and
`examples/` subdirectories load only when the body points at them. That is why our skills carry
large reference files without bloating every session — see
[`skills/frontend-agent/vue-nuxt/`](skills/frontend-agent/vue-nuxt/).

Ours live under [`skills/`](skills/), grouped by the agent that uses them, and install with
`npx skills@latest add https://github.com/bamf-health/bamfos-agent-config`.

Skills are also the **recommended successor to custom commands**. `.claude/commands/deploy.md`
and `.claude/skills/deploy/SKILL.md` both create `/deploy`; the skill form is preferred for
anything multi-step.

### Skill vs. subagent

Both are markdown files with YAML frontmatter, discovered by their `description`, scoped to a
project or a user, and able to restrict tools. The difference is **where the work happens**:

| | Skill | Subagent |
|---|---|---|
| Runs in | the current conversation | its own context window |
| Sees your context? | yes | no — starts blank |
| Costs main-thread context? | yes, the body loads in | no, only the report returns |
| Run several at once? | no | yes, in parallel |
| Tool restriction | `allowed-tools` | `tools` |
| Different model? | no | yes, via `model:` |

**Skill for know-how, subagent for delegation.** They compose: a skill's instructions can direct
Claude to spawn subagents, and a subagent can invoke skills of its own.

### Rules

[Canonical definition →](https://code.claude.com/docs/en/glossary#rules)

⚠️ **This word means three different things in our world.** Say which one you mean.

1. **`engineering-rules/rules/*.md`** — *our* shared rulebooks: `backend.md`, `frontend.md`,
   `shared.md`, synced into every project repo. Ownership follows the craft (§3), and this is the
   backbone of consistency across six developers. This is what `ai-dev-pipeline.md` means by
   "rules" throughout.
2. **`.claude/rules/`** — a *Claude Code* feature: modular instruction files that load alongside
   `CLAUDE.md`. A rule can carry YAML `paths:` frontmatter so it loads only when Claude touches a
   matching file, keeping context lean until it's relevant. We do not use this directory yet; it
   is the natural home for our synced rulebooks if we want path-scoped loading.
3. **A skill's own supporting files** — e.g.
   [`skills/backend-agent/node/references/async-patterns.md`](skills/backend-agent/node/references/async-patterns.md).
   These are just files the skill body points at, with no special meaning to Claude Code. We name
   that folder `references/` in every skill, never `rules/`, precisely so sense 3 cannot be
   mistaken for sense 1 or 2.

### CLAUDE.md

[Canonical definition →](https://code.claude.com/docs/en/glossary#claude-md)

Persistent instructions **you write**, loaded at the start of every session. Project conventions,
architecture notes, "always do X" rules.

Discovered at several scopes and **concatenated** — broadest to most specific, not overriding
each other:

| Path | Scope |
|---|---|
| `~/.claude/CLAUDE.md` | user — applies to every project |
| `<repo>/CLAUDE.md` or `<repo>/.claude/CLAUDE.md` | project — committed, shared with the team |

Project-root `CLAUDE.md` survives [compaction](https://code.claude.com/docs/en/glossary#compaction)
and is re-read from disk afterward, which is why durable conventions belong here rather than in
chat.

Per `ai-dev-pipeline.md`: **one `CLAUDE.md` per repo, never per feature**, containing the project
in five lines, pointers to the synced `rules/`, the mirror rule, and the universal rules.

### AGENTS.md

[Canonical definition →](https://code.claude.com/docs/en/glossary#agents-md)

The **vendor-neutral** equivalent of `CLAUDE.md` — the same idea of project instructions, in a
file that Cursor, Copilot, and other agents also read. If a repo has an `AGENTS.md` and no
`CLAUDE.md`, Claude reads it as the project instructions with no extra setup.

### CLAUDE.md vs. AGENTS.md

Same job, different audience. `CLAUDE.md` is Claude-specific; `AGENTS.md` is the cross-tool
standard.

- **Both present**: by default Claude reads `CLAUDE.md`. The **Project instructions** setting in
  `/config` can make it read both, or only `CLAUDE.md`.
- **Reading `AGENTS.md` directly** needs Claude Code v2.1.277+; on older versions, import it from
  a `CLAUDE.md`.
- **Our stance**: this repo's README already advertises the skills as usable by "Claude, Cursor,
  Copilot, or any other AI assistant." If that stays true, project instructions belong in
  `AGENTS.md` with a one-line `CLAUDE.md` importing it — one source of truth, no drift. If a
  project is Claude-only, plain `CLAUDE.md` is simpler. Pick per repo, don't maintain both by hand.

⚠️ Do not confuse `AGENTS.md` (project instructions) with this repo's
[`agents/README.md`](agents/README.md) (documentation for our six subagent files). Unrelated.

---

## 3. People: craft, guild, team

Ours, not Anthropic's. These three are **not** interchangeable.

### Craft

**The discipline itself** — frontend or backend. An abstraction, not a group of people. A craft
owns a rulebook: `rules/frontend.md` belongs to the frontend craft, `rules/backend.md` to the
backend craft.

> "Ownership follows the craft — this rule is not negotiable." — `ai-dev-pipeline.md`

### Guild

**The people who practice a craft.** The frontend guild is the 2 frontend developers; the backend
guild is the 4 backend developers.

A guild is the approval authority for its craft's rulebook. Anyone may *suggest* a change as a PR
to the rules repo; only a member of that guild may *approve* it. `rules/shared.md` needs one
approval from each guild.

Guild membership also gates merges: **frontend PRs are reviewed and merged by a frontend team
member, backend PRs by a backend team member.**

### Team

**All six developers together.** Every guild member is a team member; no one is only a team member.

| Term | Is | Size today |
|---|---|---|
| Craft | a discipline (FE, BE) | 2 crafts |
| Guild | the people of one craft | 2 FE · 4 BE |
| Team | everyone | 6 |

Quick test: *"the frontend **craft**'s conventions"* (the discipline's rules), *"ask the frontend
**guild**"* (those two people), *"the whole **team** standup"* (all six).

---

## 4. Configuration and extension

### MCP (Model Context Protocol)

[Canonical definition →](https://code.claude.com/docs/en/glossary#mcp-model-context-protocol)

An open standard for connecting agents to external systems. An **MCP server** is a program that
gives Claude new tools — Jira, GitHub, Slack, a database, a browser. Added with `claude mcp add`,
in `.mcp.json` (committable, so a whole repo shares a server), through a plugin, or as a claude.ai
**connector**.

Relevant to us: our Planner agent's [Jira skill](skills/planner-agent/jira/SKILL.md) is the kind
of work an MCP server can do natively instead of through shell commands.

Watch the context cost — every connected server's tools occupy context.
[MCP Tool Search](https://code.claude.com/docs/en/glossary#mcp-tool-search) defers tool schemas
until a tool is actually used, which keeps idle servers cheap.

### Hooks

[Canonical definition →](https://code.claude.com/docs/en/glossary#hook)

A handler that fires **automatically at a fixed point** in the session lifecycle — before a tool
runs, after a file edit, at session start, at the end of a turn. The handler can be a shell
command, an HTTP endpoint, an MCP tool, an LLM prompt, or a subagent.

Three parts: the **event** (which lifecycle point), the **matcher** (which occurrences fire it),
and the **handler** (what runs).

The distinction that matters: **hooks are deterministic; skills are discretionary.** A skill
loads when Claude judges it relevant. A hook fires every time, whether or not Claude thinks it
should. "Run the linter after every edit" is a hook, not a skill — the model's judgment must not
be in that loop. Configured in `settings.json`.

### Permission rules

[Canonical definition →](https://code.claude.com/docs/en/glossary#permission-rule)

Settings entries that **allow**, **ask** about, or **deny** a tool call, matched on tool name and
argument pattern. Evaluated **deny → ask → allow, first match wins**.

```jsonc
// .claude/settings.json  — committed, applies to everyone on the repo
{
  "permissions": {
    "allow": ["Bash(npm run test:*)", "Bash(git status)"],
    "deny":  ["Bash(git push --force:*)", "Read(./.env)"]
  }
}
```

Layered on top of the broader **[permission mode](https://code.claude.com/docs/en/glossary#permission-mode)**
(`default`/Manual, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`) — the mode sets
the baseline, rules are the fine-grained exceptions.

Which file to put them in:

| File | Scope | Commit? |
|---|---|---|
| `.claude/settings.json` | project — the team's shared policy | **yes** |
| `.claude/settings.local.json` | project, your machine only | **no** — gitignore it |
| `~/.claude/settings.json` | your user defaults, every project | n/a |

### Plugins

[Canonical definition →](https://code.claude.com/docs/en/glossary#plugin)

A bundle of skills, hooks, subagents, and MCP servers distributed as **one installable unit**,
shared across teams via a **marketplace**. Plugin skills are namespaced `plugin-name:skill-name`,
so two plugins can both ship a `review` skill without colliding.

Relevant to us: this repo is effectively a plugin's worth of content distributed by
`npx skills@latest`. Packaging it as a proper plugin would let one install deliver the skills, the
six subagents, our permission rules, and any hooks together — with versioning and a real update
path, instead of per-artifact copying.

---

## 5. Quick reference

| Term | One line | Lives in |
|---|---|---|
| **Agent** | model in a loop with tools | — |
| **Subagent** | agent in its own context, returns a summary | `.claude/agents/*.md` |
| **Managed Agents** | Anthropic-hosted agent harness (beta; no HIPAA BAA) | Claude API |
| **Skill** | know-how loaded into the current conversation | `.claude/skills/<n>/SKILL.md` |
| **Rules** (ours) | per-craft rulebooks synced into every repo | `rules/*.md` |
| **Rules** (Claude Code) | modular, optionally path-scoped instructions | `.claude/rules/` |
| **CLAUDE.md** | project instructions, Claude-specific | repo root |
| **AGENTS.md** | project instructions, cross-tool standard | repo root |
| **Craft** | the discipline — FE or BE | — |
| **Guild** | the people of one craft — 2 FE, 4 BE | — |
| **Team** | all six | — |
| **MCP** | protocol connecting Claude to external systems | `.mcp.json` |
| **Hook** | deterministic handler at a lifecycle point | `settings.json` |
| **Permission rule** | allow/ask/deny a tool call | `settings.json` |
| **Plugin** | skills + hooks + subagents + MCP as one unit | marketplace |

---

## 6. Known ambiguity in our own docs

`ai-dev-pipeline.md` and `agents/README.md` use **"agent" and "skill" interchangeably** — the
pipeline doc says *"An 'agent' here is a saved Claude Code instruction set (a skill)"*, while
`agents/README.md` describes the same six as subagent files. Both readings are live in this repo:
the six roles exist as subagent definitions in [`agents/`](agents/) **and** as skills under
[`skills/`](skills/).

That is not wrong — it reflects a real choice we haven't finished making. But when precision
matters (writing a new definition, debugging why something didn't load, onboarding someone), use
the canonical meanings in §1 and §2 and say which mechanism you mean.

Rule of thumb for our six: **the role is the agent; the mechanism may be a skill, a subagent, or
both.**

---

*Canonical reference: <https://code.claude.com/docs/en/glossary#glossary> — check it before
trusting this file on a Claude Code term. Last reconciled 2026-09-21.*
