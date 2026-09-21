---
name: backend-node
description: Provides domain-specific best practices for Node.js development, covering async patterns, error handling, streams, modules, testing, performance, caching, logging, and more. Use when setting up Node.js projects or when the user needs guidance on error handling, graceful shutdown, flaky tests, profiling, or environment configuration in Node.js. Helps configure tsconfig.json or jsonconfig.json, set up package.json scripts, handle module resolution and import extensions, and apply robust patterns across the full Node.js stack.
metadata:
  tags: node, nodejs, javascript, backend, server
  source: https://github.com/mcollina/skills/tree/main/skills/node
---

## When to use

Use this skill whenever you are dealing with Node.js code to obtain domain-specific knowledge for building robust, performant, and maintainable Node.js applications.

## Common Workflows

For multi-step processes, follow these high-level sequences before consulting the relevant rule file:

**Graceful shutdown**: Register signal handlers (SIGTERM/SIGINT) → stop accepting new work → drain in-flight requests → close external connections (DB, cache) → exit with appropriate code. See [references/graceful-shutdown.md](references/graceful-shutdown.md).

**Error handling**: Define a shared error base class → classify errors (operational vs programmer) → add async boundary handlers (`process.on('unhandledRejection')`) → propagate typed errors through the call stack → log with context before responding or crashing. See [references/error-handling.md](references/error-handling.md).

**Diagnosing flaky tests**: Isolate the test with `--test-only` → check for shared state or timer dependencies → inspect async teardown order → add retry logic as a temporary diagnostic step → fix root cause. See [references/flaky-tests.md](references/flaky-tests.md).

**Diagnosing stuck processes/tests** (`node --test` hangs, "process did not exit", CI timeout, open handles): isolate file/test → run with explicit timeout/reporter → inspect handles via `why-is-node-running` (`SIGUSR1`) → patch deterministic teardown in resource-creation scope → rerun isolated + full suite until stable. See [references/stuck-processes-and-tests.md](references/stuck-processes-and-tests.md).

**Profiling a slow path**: Reproduce under realistic load → capture a CPU profile with `--cpu-prof` → identify hot functions → check for stream backpressure or unnecessary serialisation → validate improvement with a benchmark. See [references/profiling.md](references/profiling.md) and [references/performance.md](references/performance.md).

## High-priority activation checklist (streams + caching)

When the task mentions **CSV**, **ETL**, **ingestion pipelines**, **large file processing**, **backpressure**, **repeated lookups**, or **deduplicating concurrent async calls**, explicitly apply this checklist:

1. Use `await pipeline(...)` from `node:stream/promises` (prefer this over chained `.pipe()` in guidance/code).
2. Include at least one explicit `async function*` transform when data is being transformed in-stream.
3. Choose a cache strategy when repeated work appears:
   - `lru-cache` for bounded in-memory reuse in a single process.
   - `async-cache-dedupe` for async request deduplication / stale-while-revalidate behavior.
4. Show where backpressure is handled (implicitly via `pipeline()` or explicitly via `drain`).

### Integrated example pattern (CSV/ETL)

For CSV/ETL-style prompts, prefer an answer structure like:

- `createReadStream(input)`
- `async function*` parser/transform
- optional cached enrichment lookup (`async-cache-dedupe` or `lru-cache`)
- `await pipeline(...)` to a writable destination

Link relevant rules directly in explanations so models can retrieve details:

- [references/streams.md](references/streams.md)
- [references/caching.md](references/caching.md)

## How to use

Read individual rule files for detailed explanations and code examples:

- [references/error-handling.md](references/error-handling.md) - Error handling patterns in Node.js
- [references/async-patterns.md](references/async-patterns.md) - Async/await and Promise patterns
- [references/streams.md](references/streams.md) - Working with Node.js streams
- [references/modules.md](references/modules.md) - ES Modules and CommonJS patterns
- [references/testing.md](references/testing.md) - Testing strategies for Node.js applications
- [references/flaky-tests.md](references/flaky-tests.md) - Identifying and diagnosing flaky tests with node:test
- [references/stuck-processes-and-tests.md](references/stuck-processes-and-tests.md) - Diagnosing processes that do not exit and tests that get stuck
- [references/node-modules-exploration.md](references/node-modules-exploration.md) - Navigating and analyzing node_modules directories
- [references/performance.md](references/performance.md) - Performance optimization techniques
- [references/caching.md](references/caching.md) - Caching patterns and libraries
- [references/profiling.md](references/profiling.md) - Profiling and benchmarking tools
- [references/logging.md](references/logging.md) - Logging and debugging patterns
- [references/environment.md](references/environment.md) - Environment configuration and secrets management
- [references/graceful-shutdown.md](references/graceful-shutdown.md) - Graceful shutdown and signal handling
