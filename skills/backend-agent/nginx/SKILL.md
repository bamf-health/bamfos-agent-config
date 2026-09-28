---
name: nginx
description: Use this skill when helping with Nginx development tasks. Triggers include writing or debugging Nginx configuration (server blocks, location blocks, upstreams, proxy_pass, rewrites, maps, try_files) and Nginx performance tuning (buffer sizing, keepalive tuning, caching, connection pooling, benchmarking). Also use when the user mentions .conf files, nginx.conf, or any directive-level Nginx questions. Do NOT use for Apache, Caddy, HAProxy, or general web server questions unrelated to Nginx.
license: MIT
metadata:
  author: Nejc Lovrencic
  version: "1.0"
  source_repo: https://github.com/nejclovrencic/nginx-agent-skills
---

# Nginx Development

## Core Guidance

When writing or reviewing Nginx configuration:

1. Always consider the **directive inheritance model**: redefining an array-type directive (e.g. one `proxy_set_header`) in a child block wipes all inherited ones. See [Directive Inheritance](references/nginx-gotchas.md#directive-inheritance).
2. Prefer `map` over `if` for conditional logic. See [The `if` Directive](references/nginx-gotchas.md#the-if-directive).
3. Always clarify `proxy_pass` trailing-slash behavior — it is the single most common source of subtle bugs. See [proxy_pass trailing slash behavior](references/nginx-gotchas.md#proxy_pass-trailing-slash-behavior).
4. When writing `upstream` blocks, always include keepalive configuration and explain connection pooling implications. See [Upstream Keepalive](references/nginx-gotchas.md#upstream-keepalive).
5. When writing Nginx directives, always check [docs](https://nginx.org/en/docs/), specifically module references, to verify that a directive actually exists, and what values it accepts (on/off, variable, fixed values, etc).

When advising on performance:

1. Always consider the full request path: client → Nginx → upstream, and tune each segment.
2. Buffer sizing has cascading effects — refer to the buffer tuning section in references/nginx-gotchas.md.

## Reference Files

Load these as needed based on the task:

- **[references/nginx-gotchas.md](references/nginx-gotchas.md)** — Directive behavior gotchas, inheritance rules, location matching, common misconfigurations. Read when writing or debugging any Nginx config.
