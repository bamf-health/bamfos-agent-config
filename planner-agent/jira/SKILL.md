---
name: jira
description: Create and update Jira tasks in the BAMF Health project CCP1 following the team conventions. Use when asked to create, update, move or describe a Jira task.
---

# Jira

- Assign to the requesting user: look up their account id with `atlassianUserInfo`.
- Do only what is asked. Change one field per request, leave the rest untouched.

## Project

- When working on RRx/Radiopharmacy tasks, use the **RP1** project and **Task** issue type.
- For all other tasks, use the **CCP1** project.
- Use the title exactly as given.
- Use the **Task** issue type.
- Prefix titles by area: `BE - `, `FE - `, `QA - `. In the **bamfhealth.com** project, prefix titles with `WWW - `.
- Allow the user to confirm the project and issue type before creating the issue.

## Description

Non-technical, readable by UI/UX, managers and other teams. Bullets with bold labels, sent as markdown:

- **Why:** the user-facing problem.
- **What needs to be done:** written as pending work, never "what it does".
- **Not included (Part N):** optional, only when something is deliberately left for a later task.

## Create

1. Create the issue in CCP1 or RP1 as a Task, assigned to the requesting user.
2. Look up the available transitions for the new issue and move it to **In Progress** if it is available.

## Sprint and priority

- Current sprint: find the sprint field on an issue of CCP1 or RP1, depending on the current project. Search either `project = CCP1 AND sprint in openSprints()` or `project = RP1 AND sprint in openSprints()`, take the sprint whose state is `active`, and set that field on the issue.
- Priority: set by name, e.g. `Medium`.
