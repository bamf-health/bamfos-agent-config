---
name: general-code-quality
description: Use this skill when helping with code quality tasks. Triggers include writing or debugging code, refactoring code, and improving code readability and maintainability.
license: MIT
metadata:
  author: Karl Swedberg
  version: "1.0"
---

# General Code Quality

## Overview

This skill provides a general overview of code quality best practices and guidelines.

- Only modify code related to the task at hand, with minimal changes.
- Always write correct, DRY (Don't Repeat Yourself), bug-free code that fully implements all requested functionality. Verify it before finishing.
- Favor readable code over performant code.
- Use early returns whenever possible to make the code more readable.

## Commit Messages

- Write meaningful, clear commit messages and maintain clean git history.
- Avoid lengthy introductions such as "Refactored [the feature] by…" or "Enhanced [the feature] by…". Instead, focus on summarizing the changes made and, perhaps, the reason for the change in a single concise sentence.
- Keep dependencies up to date and audit for vulnerabilities

## Smart Comments

- Don't comment on what the code does - make the code self-documenting
- Use comments to explain why something is done a certain way
- Document APIs, complex algorithms, and non-obvious side effects

## Meaningful Names

- Variables, functions, and classes should reveal their purpose
- Names should explain why something exists and how it's used
- Avoid abbreviations unless they're universally understood

## Code Quality Maintenance

- Refactor continuously
- Fix technical debt early
- Leave code cleaner than you found it
