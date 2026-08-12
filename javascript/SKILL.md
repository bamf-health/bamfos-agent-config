---
name: javascript
description: Use this skill when helping with JavaScript code. Triggers include writing or debugging code, refactoring code, and improving code readability and maintainability. Trigger this skill when the current project is using JavaScript, including frameworks such as Vue, Nuxt, and Astro.
license: MIT
metadata:
  author: Karl Swedberg
  version: "1.0"
---

# JavaScript

## Overview

This skill provides a general overview of JavaScript best practices and guidelines.

- Use early returns whenever possible to make the code more readable.
- Use descriptive variable and function/const names. Only use abbreviations when they are well-known and universally understood.
- Prefer CSS transitions/animations over JavaScript for smoother, GPU-accelerated effects
- Check the code for linting errors and fix them, using `eslint` and `eslint-config-kswedberg` if available.

## Function Syntax

- Use function expressions instead of function declarations.
- Use named function expressions when you need to use the function name in the function body (e.g. for recursion).
- Use arrow functions for concise anonymous functions.
- Avoid arrow functions ONLY when you need to access a `this` keyword scoped within the function.
- When returning an object literal, NEVER use the shorthand format. Instead, use curly braces and return the object explicitly.

### Good Examples (Function Expressions and proper return syntax)

```javascript
const toggle = () => {/* code */};
const factorial = function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
};

const getUser = () => {
  return {name: 'John', age: 30};
};
```

### Bad Examples (Function Declarations and improper return syntax)

```javascript
function toggle() {/* code */}

function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

const getUser = () => ({name: 'John', age: 30});
```

## JSDoc Comments

- Use JSDoc comments for documentation and type safety
- Use `@param` and `@returns` JSDoc comments for function parameters and return values
- Use `@type` and `@typedef` JSDoc comments for typed props and default values
- Use `@example` JSDoc comments for code examples
- Use `@deprecated` JSDoc comments for deprecated functions
- Use `@module` JSDoc comments for module descriptions
- Use `@namespace` JSDoc comments for namespace descriptions

### Place shared type definitions in a separate (`.d.ts`) file and import them into the files that need them.

```javascript
// app/types.d.ts
export type User = {
  id: string;
  name: string;
  email: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
};
```

```javascript
// app/composables/useUser.js
import type {User} from './types.d.ts';

/**
 * @param {import('./types.d.ts').User | null} user
 */
export function useUser(user = null) {
  return {
    user,
  };
}
```

## Promises

- Prefer async/await over mixed promise chains
- Throw and handle specific error classes with clear operational meaning
- Use `Promise.all` for multiple promises that should run in parallel and all succeed for the operation to succeed
- Use `Promise.allSettled` for multiple promises that should not fail the entire operation if one fails
- Use `Promise.race` for multiple promises when you only need the result of the first to succeed or fail
- Use `Promise.any` for multiple promises when you only need the result of the first one that succeeds, and only fail if all fail

## Security

- Treat all external input as untrusted; validate and sanitize it.
- Prevent injection attacks by parameterizing queries and escaping output contexts
- Avoid logging secrets, tokens, or PII.
- Ensure logging contains enough context for triage without leaking secrets

## Performance

- Avoid repeated expensive operations in loops; cache intentionally
- Bound concurrency for bulk async operations
- Stream or paginate large payloads to avoid memory issues

## Reference Files

Load these as needed based on the task:

- **[references/modern-js.md](references/modern-js.md)** — Modern JavaScript best practices and guidelines. Read when writing or debugging any JavaScript code.
- **[references/not-ready-js.md](references/not-ready-js.md)** — JavaScript features that are not yet ready for use in most situations. Only use these features if the target runtime supports them as indicated in their "When to use" notes.
