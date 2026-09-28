---
name: flaky-tests
description: Identifying and diagnosing flaky tests with node:test
metadata:
  tags: testing, flaky-tests, node-test, debugging, ci
---

# Identifying and Diagnosing Flaky Tests

Flaky tests are tests that pass or fail intermittently without code changes. They erode trust in the test suite and waste debugging time. This guide helps identify root causes and fix them.

## Identifying Which Test/File is Timing Out

When tests timeout, use these techniques to identify the culprit:

### 1-3. Reporter, Timeout, and Isolation

Follow the fail-fast command path (explicit `--test-reporter=spec` + `--test-timeout`, then isolate file and test name) in [stuck-processes-and-tests.md](stuck-processes-and-tests.md#command-path-run-in-order). The timeout error includes the test name and file location. Additional options:

```bash
# tap format shows test file and name as each test runs
node --test --test-reporter=tap

# Keep a log to see which test hangs
node --test --test-reporter=spec 2>&1 | tee test-output.log

# Isolate by running files one at a time
for f in src/**/*.test.js; do
  echo "Running: $f"
  timeout 30s node --test "$f" || echo "TIMEOUT or FAIL: $f"
done
```

### 4. Add Diagnostic Logging to Test Hooks

```javascript
import {describe, it, before, after, beforeEach, afterEach} from 'node:test';

describe('MyTests', () => {
  before(() => console.log('[BEFORE] MyTests starting'));
  after(() => console.log('[AFTER] MyTests complete'));
  beforeEach((t) => console.log(`[BEFORE EACH] Starting: ${t.name}`));
  afterEach((t) => console.log(`[AFTER EACH] Finished: ${t.name}`));

  it('test 1', () => {
    /* ... */
  });
  it('test 2', () => {
    /* ... */
  });
});
```

### 5. Check for Hanging Async Operations

```bash
# Use --inspect to debug hanging tests
node --inspect --test src/hanging.test.js

# Then connect Chrome DevTools to chrome://inspect
# Check the "Async" call stack to see what's pending
```

### 6. Find Open Handles

Use `why-is-node-running` (`--import why-is-node-running/include` + `SIGUSR1`) to dump what's keeping Node.js alive. See [stuck-processes-and-tests.md](stuck-processes-and-tests.md#command-path-run-in-order).

## Common Causes of Flaky Tests

### 1. Timing and Race Conditions

**Symptom**: Test passes locally but fails in CI, or fails randomly.

```javascript
/* eslint-disable no-promise-executor-return */
// BAD - Race condition with setTimeout
it('should process after delay', async(t) => {
  let processed = false;

  processAsync(() => {
    processed = true;
  });

  await new Promise((resolve) => setTimeout(resolve, 100));
  t.assert.equal(processed, true); // May fail if processing takes > 100ms
});

// GOOD - Wait for the actual condition
it('should process after delay', async(t) => {
  const result = await processAsync();

  t.assert.equal(result.processed, true);
});
```

### 2. Uncontrolled Time Dependencies

**Symptom**: Tests fail around midnight, month boundaries, or in different timezones.

```javascript
// BAD - Depends on current time
it('should format today', (t) => {
  const result = formatDate(new Date());

  t.assert.equal(result, '2024-01-15'); // Fails tomorrow
});

// GOOD - Use fixed dates or mock time
it('should format date', (t) => {
  const fixedDate = new Date('2024-01-15T12:00:00Z');
  const result = formatDate(fixedDate);

  t.assert.equal(result, '2024-01-15');
});

// GOOD - Mock Date with node:test
it('should format today', (t) => {
  t.mock.timers.enable({apis: ['Date']});
  t.mock.timers.setTime(new Date('2024-01-15T12:00:00Z').getTime());

  const result = formatDate(new Date());

  t.assert.equal(result, '2024-01-15');
});
```

### 3. Port Conflicts

**Symptom**: "EADDRINUSE" errors, tests fail when run in parallel.

```javascript
// BAD - Hardcoded port
it('should start server', async(t) => {
  const server = await startServer({port: 3000}); // Conflicts with other tests
  // ...
});

// GOOD - Use dynamic port (port 0)
it('should start server', async(t) => {
  const server = await startServer({port: 0});
  const address = server.address();
  const port =
    typeof address === 'object' && address !== null ? address.port : null;
  // ...
});
```

### 4. Shared State Between Tests

**Symptom**: Tests pass individually but fail when run together.

```javascript
// BAD - Module-level state persists between tests
let cache = new Map();

it('test 1', (t) => {
  cache.set('key', 'value1');
  t.assert.equal(cache.get('key'), 'value1');
});

it('test 2', (t) => {
  t.assert.equal(cache.get('key'), undefined); // FAILS - still has 'value1'
});

// GOOD - Reset state in beforeEach or use test-scoped state
describe('cache tests', () => {
  let cache;

  beforeEach(() => {
    cache = new Map();
  });

  it('test 1', (t) => {
    cache.set('key', 'value1');
    t.assert.equal(cache.get('key'), 'value1');
  });

  it('test 2', (t) => {
    t.assert.equal(cache.get('key'), undefined); // PASSES
  });
});
```

### 5. Test Order Dependencies

**Symptom**: Tests pass with `--test` but fail with `--test --parallel`.

```javascript
// BAD - Test 2 depends on side effect from Test 1
it('test 1: create user', async(t) => {
  await db.insert({id: 1, name: 'John'});
  t.assert.ok(true);
});

it('test 2: find user', async(t) => {
  const user = await db.findById(1); // Fails if test 1 didn't run first

  t.assert.equal(user.name, 'John');
});

// GOOD - Each test sets up its own data
it('test 2: find user', async(t) => {
  await db.insert({id: 1, name: 'John'}); // Setup within test
  const user = await db.findById(1);

  t.assert.equal(user.name, 'John');
});
```

### 6. Unhandled Promise Rejections

**Symptom**: Test appears to pass but process exits with error, or random failures.

```javascript
/* eslint-disable require-await */
// BAD - Fire-and-forget async operation
it('should send notification', async(t) => {
  sendNotification(user); // Not awaited - may reject after test ends
  t.assert.ok(true);
});

// GOOD - Await all async operations
it('should send notification', async(t) => {
  await sendNotification(user);
  t.assert.ok(true);
});
```

### 7. Resource Cleanup Failures

**Symptom**: Tests fail with "too many open files" or connections exhausted.

Register cleanup in the same scope that created the resource (e.g. `t.after(() => handle.close())` right after `fs.open()`). See the deterministic teardown example in [stuck-processes-and-tests.md](stuck-processes-and-tests.md#good-deterministic-teardown).

## Debugging Strategies

### 1. Run Tests in Isolation

Run a single file, then a single test with `--test-name-pattern`, as shown in [stuck-processes-and-tests.md](stuck-processes-and-tests.md#command-path-run-in-order).

### 2. Increase Concurrency to Expose Race Conditions

```bash
# Run with high concurrency to surface race conditions
node --test --test-concurrency=10
```

Or rerun the same test many times with the stress-rerun loop in [stuck-processes-and-tests.md](stuck-processes-and-tests.md#command-path-run-in-order).

### 3. Use Test Retry to Identify Flaky Tests

```javascript
// Temporarily add retry to identify flaky test
it('potentially flaky test', {retry: 3}, async(t) => {
  // If this needs retries to pass, it's flaky
});
```

### 4. Add Diagnostic Logging

```javascript
it('flaky test', async(t) => {
  console.log('Test started at:', Date.now());
  console.log('Environment:', process.env.NODE_ENV);

  const result = await operation();

  console.log('Result:', JSON.stringify(result));

  t.assert.ok(result);
});
```

### 5. Check for Async Leaks

```javascript
/* eslint-disable require-await */
import {describe, it, after} from 'node:test';

describe('async leak detection', () => {
  const activeHandles = new Set();

  after(() => {
    if (activeHandles.size > 0) {
      console.error('Leaked handles:', [...activeHandles]);
    }
  });

  it('should not leak', async(t) => {
    const timer = setTimeout(() => {/* noop */}, 10000);

    activeHandles.add(timer);

    // Do test work...

    clearTimeout(timer);
    activeHandles.delete(timer);
  });
});
```

## Prevention Best Practices

### 1. Use Deterministic IDs

```javascript
// BAD - Random IDs make debugging hard
const randomId = crypto.randomUUID();

// GOOD - Predictable IDs in tests
const deterministicId = `test-user-${t.name}`;
```

### 2. Mock External Services

Mock `fetch` with `t.mock.method(globalThis, 'fetch', ...)` to avoid network flakiness. See [testing.md](testing.md#mocking-methods) and [Network Reliability](#3-network-reliability) below.

### 3. Use Explicit Waits Instead of Timeouts

```javascript
/* eslint-disable */
// BAD - Arbitrary timeout
await new Promise((r) => setTimeout(r, 1000));

// Helper function
const waitFor = async function(condition, timeout = 5000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('Condition not met within timeout');
};

// GOOD - Wait for specific condition
await waitFor(() => element.isVisible());
```

### 4. Ensure Test Isolation with Transactions

Begin a transaction in `beforeEach` and roll it back in `afterEach`. See [testing.md](testing.md#test-hooks-for-setupteardown).

## CI-Specific Flakiness

### 1. Resource Constraints

CI environments often have less CPU/memory. Add appropriate timeouts:

```javascript
it('heavy computation', {timeout: 30000}, async(t) => {
  // Longer timeout for CI
  const result = await heavyOperation();

  t.assert.ok(result);
});
```

### 2. Parallel Test Execution

Ensure tests don't conflict when run in parallel:

```bash
# In CI, run with controlled concurrency
node --test --test-concurrency=2
```

### 3. Network Reliability

Mock external APIs in tests to avoid network-related flakiness:

```javascript
// Always mock external HTTP calls in unit tests
t.mock.method(globalThis, 'fetch', (url) => {
  if (url.includes('api.external.com')) {
    return {ok: true, json: () => mockData};
  }
  throw new Error(`Unmocked URL: ${url}`);
});
```
