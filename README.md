# AI Skills for Claude, Cursor, Copilot, or any other AI assistant

This repository contains a collection of AI skills for Claude, Cursor, Copilot, or any other AI assistant.

**Note**: These skills are are a work in progress and not exhaustive.

## Installation

To install skills from this repository into a project, run the following command and follow the prompts:
```bash
npx skills@latest add https://github.com/bamf-health/bamfos-agent-config
```

To update skills:
```bash
npx skills@latest update --project
```

## Included Skills

Skills are grouped by the kind of agent that uses them.

### Frontend

- [accessibility](frontend-agent/accessibility/SKILL.md)
- [css](frontend-agent/css/SKILL.md)
- [formkit](frontend-agent/formkit/SKILL.md)
- [javascript](frontend-agent/javascript/SKILL.md)
- [vue-nuxt](frontend-agent/vue-nuxt/SKILL.md)

### Backend

- [mongoose](backend-agent/mongoose/SKILL.md)
- [nginx](backend-agent/nginx/SKILL.md)
- [node](backend-agent/node/SKILL.md)

### General

- [code-simplification](general/code-simplification/SKILL.md)
- [general-code-quality](general/general-code-quality/SKILL.md)
- [ponytail](general/ponytail/SKILL.md)
- [ponytail-audit](general/ponytail-audit/SKILL.md)
- [security-best-practices](general/security-best-practices/SKILL.md)
