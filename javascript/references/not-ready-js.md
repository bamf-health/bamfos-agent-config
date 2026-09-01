---
name: not-ready-js
description: JavaScript features that are not yet ready for use in most situations.
metadata:
  source_repo: https://github.com/Cst2989/react-tips-skill/blob/main/skills/not-ready-js/SKILL.md
---

# Not Ready JavaScript

**IMPORTANT:** The advice in this skill is not ready for use in most situations. Note each section's "When to use" note before applying the advice. If it says "NOT YET", don't use the advice. If it notes a version number, check that the version number is supported by the current runtime.

## Iterators and collections

### Concatenating iterators

**When to use:** NOT YET.

Use `Iterator.concat(a, b)` instead of a nested `yield*` generator.

```javascript
// BAD
/* eslint-disable func-style */
function* chained() {
  yield* first();
  yield* second();
}

// GOOD
const all = Iterator.concat(first(), second());
```

### Counting or caching in a Map

**When to use:** NOT YET.

Use `Map.prototype.getOrInsert` and `getOrInsertComputed`. Never write `if (!map.has(k)) map.set(k, v)`.

```javascript
// BAD
for (const word of words) {
  if (!counts.has(word)) {
    counts.set(word, 0);
  }
  counts.set(word, counts.get(word) + 1);
}

// GOOD
for (const word of words) {
  counts.set(word, counts.getOrInsert(word, 0) + 1);
}

// For expensive defaults
const getUser = function(id) {
  return cache.getOrInsertComputed(id, () => expensiveDatabaseLookup(id));
};
```

Available on both `Map` and `WeakMap`.

## Dates and times

### Any date/time operation beyond Date.now()

**When to use:** NOT YET.

Use `Temporal`. Never reach for moment.js, date-fns, or luxon for new code.

```javascript
// Parse with timezone
const meeting = Temporal.ZonedDateTime.from(
  '2026-06-15T09:00[America/New_York]',
);

// Convert timezones
const inLondon = meeting.withTimeZone('Europe/London');

// Age or duration
const birthday = Temporal.PlainDate.from('1993-10-26');
const today = Temporal.Now.plainDateISO();
const age = today.since(birthday, {largestUnit: 'years'});
// age.years === 32
```

Pick the type by what you actually mean: `PlainDate` (no time), `PlainTime` (no date), `ZonedDateTime` (moment in a zone), `PlainDateTime` (date + time, no zone), `Instant` (absolute moment), `PlainYearMonth`/`PlainMonthDay` (partial).

## Errors

### Checking if a caught value is an Error

**When to use:** On the server side, when Node.js is 24.3+ only. In browsers, when Safari supports it (not yet as of version 26.5).
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

### Summing an array of floats

**When to use:** Only in browsers. NOT YET for Node.js.
Use `Math.sumPrecise(values)`. Especially important for financial values or long arrays where rounding drift compounds.

```javascript
const cents = Array(10000).fill(0.1);

// BAD: accumulates error
cents.reduce((a, b) => a + b); // 1000.0000000001588

// GOOD
Math.sumPrecise(cents); // 1000
```

Also handles catastrophic cancellation: `Math.sumPrecise([1e20, 1, -1e20])` returns `1`, not `0`.

## Modules

### Importing a large module that's rarely used

Use `import defer` to delay module evaluation until you actually read a property off the namespace.

```javascript
// BAD: heavy.js evaluates on import, even if rarelyCalled is never called
import * as heavyModule from './heavy.js';

// GOOD: heavy.js is fetched and parsed, but not executed
import defer * as heavyModule from './heavy.js';

const rarelyCalled = function() {
  // Reading heavyModule.doExpensiveThing triggers evaluation here
  return heavyModule.doExpensiveThing();
};
```
