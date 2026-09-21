# AI Skills for Claude, Cursor, Copilot, or any other AI assistant

This repository contains a collection of AI skills for Claude, Cursor, Copilot, or any other AI assistant.

**Note**: These skills are a work in progress and not exhaustive.

## Installation

To install skills from this repository into a project, run the following command and follow the prompts:
```bash
npx skills@latest add https://github.com/bamf-health/bamfos-agent-config
```

To update skills:
```bash
npx skills@latest update --project
```

## Layout

All published skills live in a single flat level under `skills/`, one directory per skill.
Claude Code only discovers skills at exactly `<skills-root>/<skill-name>/SKILL.md`, so the
agent grouping lives in the skill name rather than in a parent directory:

```
skills/
  <agent>-<topic>/SKILL.md   # a topic skill, e.g. frontend-vue-nuxt
  <agent>-agent/SKILL.md     # an agent's own role and process, e.g. review-agent
```

A skill's directory name and its front matter `name:` must match.

## Included Skills

### Frontend

- [frontend-accessibility](skills/frontend-accessibility/SKILL.md)
- [frontend-bamfos](skills/frontend-bamfos/SKILL.md)
- [frontend-css](skills/frontend-css/SKILL.md)
- [frontend-formkit](skills/frontend-formkit/SKILL.md)
- [frontend-javascript](skills/frontend-javascript/SKILL.md)
- [frontend-vue-nuxt](skills/frontend-vue-nuxt/SKILL.md)

### Backend

- [backend-mongoose](skills/backend-mongoose/SKILL.md)
- [backend-nginx](skills/backend-nginx/SKILL.md)
- [backend-node](skills/backend-node/SKILL.md)

### General

- [general-code-simplification](skills/general-code-simplification/SKILL.md)
- [general-code-quality](skills/general-code-quality/SKILL.md)
- [general-ponytail](skills/general-ponytail/SKILL.md)
- [general-ponytail-audit](skills/general-ponytail-audit/SKILL.md)
- [general-security-best-practices](skills/general-security-best-practices/SKILL.md)

### Planner

- [planner-agent](skills/planner-agent/SKILL.md)
- [planner-jira](skills/planner-jira/SKILL.md)

### Tester

- [tester-agent](skills/tester-agent/SKILL.md)

### QA

- [qa-agent](skills/qa-agent/SKILL.md)

### Review

- [review-agent](skills/review-agent/SKILL.md)
