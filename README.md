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

All published skills live under `skills/`, grouped by the kind of agent that uses them:

```
skills/
  <agent>/SKILL.md           # the agent's own role and process
  <agent>/<skill>/SKILL.md   # a topic skill that agent uses
```

## Included Skills

### Frontend

- [accessibility](skills/frontend-agent/accessibility/SKILL.md)
- [css](skills/frontend-agent/css/SKILL.md)
- [formkit](skills/frontend-agent/formkit/SKILL.md)
- [javascript](skills/frontend-agent/javascript/SKILL.md)
- [vue-nuxt](skills/frontend-agent/vue-nuxt/SKILL.md)

### Backend

- [mongoose](skills/backend-agent/mongoose/SKILL.md)
- [nginx](skills/backend-agent/nginx/SKILL.md)
- [node](skills/backend-agent/node/SKILL.md)

### General

- [code-simplification](skills/general-agent/code-simplification/SKILL.md)
- [general-code-quality](skills/general-agent/general-code-quality/SKILL.md)
- [ponytail](skills/general-agent/ponytail/SKILL.md)
- [ponytail-audit](skills/general-agent/ponytail-audit/SKILL.md)
- [security-best-practices](skills/general-agent/security-best-practices/SKILL.md)

### Planner

- [planner-agent](skills/planner-agent/SKILL.md)
- [jira](skills/planner-agent/jira/SKILL.md)

### Tester

- [tester-agent](skills/tester-agent/SKILL.md)

### QA

- [qa-agent](skills/qa-agent/SKILL.md)

### Review

- [review-agent](skills/review-agent/SKILL.md)
