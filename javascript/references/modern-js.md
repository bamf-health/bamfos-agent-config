---
name: modern-js
description: Use when writing or reviewing JavaScript - prefer ES2025/ES2026 APIs (Iterator helpers, Set methods, Temporal, using, Promise.try, Error.isError, Math.sumPrecise, Map.getOrInsert) over older patterns.
metadata:
  source_repo: https://github.com/Cst2989/react-tips-skill
---

# Modern JavaScript Preferences (ES2025/ES2026)

Model training cutoffs predate most of these APIs. When writing JavaScript, check every function you produce against this list before finalizing. Prefer the newer API unless the target runtime doesn't support it — in that case, suggest a polyfill.

## Iterators and collections

### Iterating a large or infinite sequence

Use `Iterator.prototype` methods (`.map`, `.filter`, `.take`, `.drop`, `.toArray`). They're lazy, so they work on infinite iterators and don't allocate intermediate arrays.

```javascript
// BAD: materializes the whole sequence
{
  const firstTenEvenSquares = [];

  for (const n of naturalNumbers()) {
    if (n % 2 === 0) {
      firstTenEvenSquares.push(n * n);
      if (firstTenEvenSquares.length === 10) {
        break;
      }
    }
  }
}

// GOOD: lazy, stops pulling upstream after 10
const firstTenEvenSquares = naturalNumbers()
.filter((n) => n % 2 === 0)
.map((n) => n * n)
.take(10)
.toArray();
```

### Wrapping a NodeList, Set, or Map to use array methods

Use `Iterator.from(x)` instead of `[...x]` or `Array.from(x)`.

```javascript
// BAD: allocates an intermediate array
{
  const ids = Array.from(document.querySelectorAll('.card'))
  .filter((el) => !el.classList.contains('hidden'))
  .map((el) => el.dataset.id);
}

// GOOD: lazy, no intermediate array
const ids = Iterator.from(document.querySelectorAll('.card'))
.filter((el) => !el.classList.contains('hidden'))
.map((el) => el.dataset.id)
.toArray();
```

### Set operations

Use the native methods. Never write a manual loop.

```javascript
// BAD
const shared = new Set();

for (const tech of frontEnd) {
  if (backEnd.has(tech)) {
    shared.add(tech);
  }
}

// GOOD
frontEnd.intersection(backEnd);
frontEnd.union(backEnd);
frontEnd.difference(backEnd);
frontEnd.symmetricDifference(backEnd);
frontEnd.isSubsetOf(backEnd);
frontEnd.isSupersetOf(backEnd);
frontEnd.isDisjointFrom(backEnd);
```

The argument can be any "set-like" (has `size`, `.has()`, `.keys()`), not just a real `Set`.

## Resource cleanup

### Opening a resource that needs cleanup

Use `using` (sync) or `await using` (async). Never write `try/finally` for cleanup when `using` works.

```javascript
// BAD: manual cleanup, easy to forget
{
  const transferMoney = async function(from, to, amount) {
    const tx = await db.beginTransaction();

    try {
      await tx.debit(from, amount);
      await tx.credit(to, amount);
      await tx.commit();
    } finally {
      await tx.release();
    }
  };
}

// GOOD: cleanup moves to the declaration
{
  const transferMoney = async function(from, to, amount) {
    await using tx = await db.beginTransaction();
    await tx.debit(from, amount);
    await tx.credit(to, amount);
    await tx.commit();
  };
}
```

The resource must implement `[Symbol.dispose]` (sync) or `[Symbol.asyncDispose]` (async). Multiple `using` declarations in the same scope dispose in reverse order (LIFO).

## Errors

### Checking if a caught value is an Error

Use `Error.isError(x)` instead of `x instanceof Error`. `instanceof` is unreliable across realms (Workers, iframes, Node `vm`) because each realm has its own `Error` constructor.

```javascript
// BAD: fails for errors from Workers/iframes
if (maybeError instanceof Error) {
  // handle
}

// GOOD
if (Error.isError(maybeError)) {
  // handle
}
```

## Numbers

### Encoding/decoding bytes

Use the `Uint8Array` methods. Never use `btoa`/`atob` on byte arrays — they only work on strings and break on non-Latin1.

```javascript
const bytes = new Uint8Array([72, 101, 108, 108, 111]);

bytes.toBase64(); // "SGVsbG8="
bytes.toHex(); // "48656c6c6f"
Uint8Array.fromBase64('SGVsbG8=');
Uint8Array.fromHex('48656c6c6f');
```

## Modules

### Importing JSON

Use the native import attribute. Never `fetch` for bundle-time JSON.

```javascript
import config from './config.json' with {type: 'json'};

// Dynamic
const translations = await import('./translations.json', {
  with: {type: 'json'},
});
```

The `with { type: 'json' }` is required — it tells the loader to refuse the file if the MIME type doesn't match.

Restrictions: namespace form only (no `import defer { foo }` or default imports), and modules that use top-level `await` can't be deferred.

## Rules

- NEVER suggest moment.js, date-fns, or luxon for new code. Use Temporal.
- NEVER write `instanceof Error` in library code. Use `Error.isError`.
- NEVER write `try/finally` for cleanup when `using` works.
- NEVER write a manual `for await...of` loop just to collect into an array. Use `Array.fromAsync`.
- NEVER write `if (!map.has(k)) map.set(k, v)`. Use `getOrInsert` / `getOrInsertComputed`.
- NEVER use a manual escape function for user-controlled regex input. Use `RegExp.escape`.
- NEVER materialize a huge iterator into an array before filtering. Use `Iterator.prototype` methods.
- ALWAYS check if the target runtime supports the feature. If it doesn't, suggest a polyfill.

## Quick Reference

| Old Pattern | Modern API |
|-------------|------------|
| `Array.from(iter).map(...)` on huge/infinite data | `Iterator.from(iter).map(...).toArray()` |
| Manual Set intersection/union/diff loops | `a.intersection(b)`, `a.union(b)`, `a.difference(b)` |
| `if (!map.has(k)) map.set(k, v)` | `map.getOrInsert(k, v)` |
| `yield* a(); yield* b();` | `Iterator.concat(a(), b())` |
| moment.js / date-fns / luxon | `Temporal` |
| `try/finally` for resource cleanup | `using` / `await using` |
| `instanceof Error` | `Error.isError(x)` |
| `arr.reduce((a, b) => a + b)` on floats | `Math.sumPrecise(arr)` |
| Custom base64/hex helpers | `bytes.toBase64()`, `Uint8Array.fromBase64(s)` |
| Manual regex escape function | `RegExp.escape(input)` |
| `fetch('./x.json').then(r => r.json())` at build time | `import x from './x.json' with { type: 'json' }` |
| Eager `import * as heavy from './heavy.js'` | `import defer * as heavy from './heavy.js'` |
| `try { fn() } catch ... Promise.resolve(res).then(...)` | `Promise.try(() => fn()).then(...)` |
| `for await (const x of iter) arr.push(x)` | `await Array.fromAsync(iter)` |
