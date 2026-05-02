## Iterators and collections

### Concatenating iterators

**When to use:** NOT YET.

Use `Iterator.concat(a, b)` instead of a nested `yield*` generator.

```javascript
// BAD
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
  '2026-06-15T09:00[America/New_York]'
);

// Convert timezones
const inLondon = meeting.withTimeZone('Europe/London');

// Age or duration
const birthday = Temporal.PlainDate.from('1993-10-26');
const today = Temporal.Now.plainDateISO();
const age = today.since(birthday, {largestUnit: 'years'});

age.years; // 32
```

Pick the type by what you actually mean: `PlainDate` (no time), `PlainTime` (no date), `ZonedDateTime` (moment in a zone), `PlainDateTime` (date + time, no zone), `Instant` (absolute moment), `PlainYearMonth`/`PlainMonthDay` (partial).

## Promises and async

### Calling a function that might be sync, async, or throw

**When to use:** All current browsers and Node.js 24+ only.

Use `Promise.try(() => fn())`. Sync throws, async rejections, and plain return values all flow through the same `.then`/`.catch`.

```javascript
// BAD: two error paths to remember
try {
  const result = thirdParty.doThing();

  Promise.resolve(result).then(processResult).catch(handleAnyFailure);
} catch (err) {
  handleAnyFailure(err);
}

// GOOD
Promise.try(() => thirdParty.doThing())
.then(processResult)
.catch(handleAnyFailure);
```

### Collecting an async iterable into an array

Use `Array.fromAsync`. Never write a manual `for await...of` loop just to push items into an array.

```javascript
// BAD
{
  const allItems = [];

  for await (const item of fetchPages()) {
    allItems.push(item);
  }
}

// GOOD
const allItems = await Array.fromAsync(fetchPages());
```

## Numbers

### Summing an array of floats

Use `Math.sumPrecise(values)`. Especially important for financial values or long arrays where rounding drift compounds.

```javascript
const cents = Array(10000).fill(0.1);

// BAD: accumulates error
cents.reduce((a, b) => a + b); // 1000.0000000001588

// GOOD
Math.sumPrecise(cents); // 1000
```

Also handles catastrophic cancellation: `Math.sumPrecise([1e20, 1, -1e20])` returns `1`, not `0`.

## Regular expressions

### Building a regex from user-controlled input

**When to use:** All current browsers and Node.js 24+ only.

Use `RegExp.escape(input)` instead of a custom escape function.

```javascript
// BAD: every codebase ships its own buggy version
const escapeRegex = function(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// GOOD
const pattern = new RegExp(RegExp.escape(userInput));
```

## Modules

### Importing a large module that's rarely used

Use `import defer` to delay module evaluation until you actually read a property off the namespace.

```javascript
// BAD: heavy.js evaluates on import, even if rarelyCalled is never called
import * as heavyModule from './heavy.js';

// GOOD: heavy.js is fetched and parsed, but not executed
import defer * as heavyModule from './heavy.js';

function rarelyCalled() {
  // Reading heavyModule.doExpensiveThing triggers evaluation here
  return heavyModule.doExpensiveThing();
}
```
