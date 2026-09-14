---
name: jira
description: Create and update Jira tasks in the BAMF Health project CCP1 following the team conventions. Use when asked to create, update, move or describe a Jira task.
---

# Jira

- Project **CCP1**, issue type **Task**. Prefix titles by area: `BE - `, `FE - `, `QA - `. Use the title exactly as given.
- Assign to the requesting user: look up their account id with `atlassianUserInfo`.
- Do only what is asked. Change one field per request, leave the rest untouched.

## Description

Non-technical, readable by UI/UX, managers and other teams. Bullets with bold labels, sent as markdown:

- **Why:** the user-facing problem.
- **What needs to be done:** written as pending work, never "what it does".
- **Not included (Part N):** optional, only when something is deliberately left for a later task.

## Create

1. Create the issue in CCP1 as a Task, assigned to the requesting user.
2. Look up the available transitions for the new issue and move it to **In Progress**.

## Sprint and priority

- Current sprint: find the sprint field on an issue of CCP1, search `project = CCP1 AND sprint in openSprints()` and take the sprint whose state is `active`, then set that field on the issue.
- Priority: set by name, e.g. `Medium`.