# Frontend JavaScript/TypeScript Web Security Spec (Vanilla Browser JS/TS, Modern Browsers)

This file applies to all browser JS/TS (no specific framework assumed). Load it alongside any framework-specific frontend file. The shared safety constraints, operating modes, and finding format are in SKILL.md.

---

## 0) Frontend-specific constraints (MUST FOLLOW)

- Secrets:
  - Frontend code is inherently observable by end users. If a value must remain secret, it must not be in browser-delivered code.
  - If the project uses “public” keys (e.g., publishable analytics keys), they MUST be treated as non-secret and scoped accordingly.

- Frontend trust model: any code shipped to browsers is attacker-readable and attacker-modifiable. Frontend checks (route guards, UI gating/hiding, “disable button”, hidden fields, client-side validation) MUST NOT be treated as authorization or a security boundary; server-side authorization and validation MUST exist even if the frontend is “correct”.

- Examples of disabling protections (never do this as a “fix”): weakening CSP with `unsafe-inline`/`unsafe-eval` without justification, removing origin checks for `postMessage`, switching to `innerHTML` for convenience, accepting arbitrary redirects/URLs, or turning off sanitization.

- Security headers (CSP, frame-ancestors, etc.) might be set by server/edge/CDN rather than in repo code. Note that `<meta http-equiv=...>` only simulates a subset of headers; don’t assume other security headers exist just because a meta tag exists. ([MDN Web Docs][1])

---

## 1) Generation and audit focus

In generation mode, MUST prefer proven libraries over custom security code (especially for HTML sanitization) and MUST avoid introducing new risky sinks (DOM XSS injection sinks like `innerHTML`, navigation to `javascript:` URLs, dynamic code execution via `eval`/`Function`, unsafe `postMessage`, unsafe third-party script loading, etc.). ([OWASP Cheat Sheet Series][2])

Recommended audit order:

1. HTML entrypoints (`index.html`, server-rendered templates), script/style includes, and any CSP delivery (header vs meta). ([W3C][3])
2. DOM XSS sinks (`innerHTML`, `document.write`, `insertAdjacentHTML`, event-handler attributes) and their data sources (URL params/hash, storage, postMessage, API responses). ([OWASP Cheat Sheet Series][2])
3. Navigation/redirect handling (`window.location*`, link targets, URL allowlists) including `javascript:` URL hazards. ([MDN Web Docs][4])
4. Cross-origin communication (`postMessage`, iframe embed patterns, sandboxing). ([MDN Web Docs][5])
5. Storage of sensitive data (localStorage/sessionStorage) and assumptions about trust. ([OWASP Cheat Sheet Series][6])
6. Third-party scripts / tag managers / CDNs, and integrity controls (SRI) and policy controls (CSP). ([OWASP Cheat Sheet Series][7])
7. DOM clobbering gadgets and unsafe reliance on `window`/`document` named properties. ([OWASP Cheat Sheet Series][8])

---

## 2) Definitions and review guidance

### 2.1 Untrusted input (treat as attacker-controlled unless proven otherwise)

Examples include:

- URL-derived data: `location.href`, `location.search`, `location.hash`, `document.URL`, `document.baseURI`, `new URLSearchParams(location.search)`, routing fragments. ([OWASP Cheat Sheet Series][2])
- Other browser-controlled values: `document.referrer`, `window.name`.
- DOM content that may include user-controlled markup (comments, profiles, CMS content, markdown-to-HTML output, etc.), especially if inserted dynamically. ([OWASP Cheat Sheet Series][2])
- `postMessage` event data (`event.data`) and metadata (`event.origin`) from other windows/frames. ([MDN Web Docs][5])
- Browser storage: `localStorage`, `sessionStorage`, IndexedDB (contents can be attacker-influenced via XSS or local machine access; never treat as “trusted”). ([OWASP Cheat Sheet Series][6])
- Any data returned from network calls (even if from “your API”), because it may contain stored attacker content that becomes dangerous only when inserted into the DOM. ([OWASP Cheat Sheet Series][2])

### 2.2 Dangerous sink (DOM XSS / code execution sink)

A sink is any API/operation that can execute script or interpret attacker-controlled strings as HTML/JS/URL in a security-sensitive way. High-signal sinks include:

- HTML parsing / insertion: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `document.writeln`. ([OWASP Cheat Sheet Series][2])
- Dynamic code execution: `eval`, `new Function`, `setTimeout("...")`, `setInterval("...")`. ([MDN Web Docs][10])
- Navigation to script-bearing URLs (e.g., `javascript:`) via setters like `location.href`/`window.location` (and via link `href` if attacker-controlled). ([MDN Web Docs][4])
- Setting event handler attributes from strings, e.g. `setAttribute("onclick", "...")`. ([OWASP Cheat Sheet Series][2])

---

## 3) Secure baseline: minimum production configuration (MUST in production)

This is the smallest baseline that prevents common frontend JS/TS security misconfigurations. Some items are “in repo” (HTML/JS) and some may live at the server/edge. Details are in the referenced rules.

- CSP (SHOULD; MUST for high-risk apps): header-delivered where possible, meta-delivered with its limitations otherwise; strict nonce/hash `script-src` without `unsafe-inline`/`unsafe-eval`; consider Trusted Types. See JS-CSP-001, JS-CSP-002, JS-TT-001.
- Third-party scripts (SHOULD): minimize them, treat them as first-party privilege, and use SRI for CDN assets. See JS-SUPPLY-001, JS-SRI-001.
- Cross-window communication (SHOULD): explicit origins, validated origin and message shape. See JS-MSG-001.
- Cookie-authenticated requests: CSRF protection coordinated with the backend. See JS-CSRF-001.

---

## 4) Rules (generation + audit)

### JS-XSS-001: Do not inject untrusted HTML into the DOM (avoid `innerHTML` and friends)

Severity: Critical if you can prove attacker-controlled input can reach these APIs; otherwise Medium

Required:

- MUST treat `innerHTML`, `outerHTML`, and `insertAdjacentHTML` as dangerous sinks when their input can contain untrusted data. ([OWASP Cheat Sheet Series][2])
- MUST prefer safe DOM APIs that do not parse HTML:
  - `textContent` for text. ([OWASP Cheat Sheet Series][2])
  - `document.createElement`, `appendChild`, `setAttribute` for non-event-handler attributes. ([OWASP Cheat Sheet Series][2])

- If HTML insertion is truly required, SHOULD sanitize with a well-reviewed HTML sanitizer and strongly consider enforcing Trusted Types to confine usage to audited code paths. ([MDN Web Docs][11])
- MUST NOT “roll your own” HTML sanitizer with regexes. If user-controlled HTML must be displayed (e.g., rich text comments), MUST sanitize using a well-maintained HTML sanitizer and a restrictive allowlist:
  - DOMPurify is a common choice; use conservative configuration and keep it updated. ([GitHub][22])
  - Where available, MAY consider the browser HTML Sanitizer API (note: limited browser availability). ([MDN Web Docs][23])

Insecure patterns:

- `el.innerHTML = userInput`
- `el.insertAdjacentHTML('beforeend', userInput)`
- `el.outerHTML = userInput`
- Regex-based “strip `<script>`” or “escape `<`” attempts followed by HTML insertion.
- DOMPurify (or similar) configured to allow overly broad tags/attributes, or configuration that’s not reviewed.

Detection hints:

- Search for: `.innerHTML`, `.outerHTML`, `insertAdjacentHTML(`.
- Trace the origin of inserted string: URL params/hash, postMessage, storage, API responses, DOM attributes. ([OWASP Cheat Sheet Series][2])
- Search for “sanitize” helper functions, regex replacing `<`/`>` patterns, or “allow all tags” configs; identify features that render user-generated “rich text” or “custom HTML”.

Fix:

- Replace with `textContent` for plain text. ([OWASP Cheat Sheet Series][2])
- For structured UI, build DOM nodes explicitly.
- For “rich text” requirements:
  - Sanitize using an allowlist-based sanitizer.
  - Centralize the “sanitize then inject” pattern into a single reviewed module.
  - Add regression tests covering representative malicious inputs (don’t store payloads in logs or telemetry).
  - Prefer returning safe “components” instead of arbitrary HTML strings.
  - Use Trusted Types enforcement to ensure only `TrustedHTML` reaches sinks where supported. ([MDN Web Docs][11])

Mitigation:

- Deploy a strict CSP and consider Trusted Types enforcement (`require-trusted-types-for 'script'`). ([MDN Web Docs][10])

False positive notes:

- If the string is provably constant or fully generated from trusted constants, it may be safe. Still prefer safer APIs.

---

### JS-XSS-002: Avoid `document.write` / `document.writeln` (XSS + document clobbering hazards)

Severity: Critical if you can prove attacker-controlled input can reach these APIs; otherwise Medium

Required:

- MUST avoid `document.write()` and `document.writeln()` in production code (they are XSS vectors and can be abused with crafted HTML even if some browsers block injected `<script>` in certain situations). ([MDN Web Docs][13])
- If legacy use is unavoidable, MUST ensure no untrusted input reaches these APIs and SHOULD enforce Trusted Types (`TrustedHTML`) where supported. ([MDN Web Docs][14])

Insecure patterns:

- `document.write(userInput)`
- `document.writeln(getParam('q'))`

Detection hints:

- Search for `document.write(`, `document.writeln(`. ([OWASP Cheat Sheet Series][2])

Fix:

- Replace with DOM manipulation (`createElement`, `appendChild`) or safe text insertion (`textContent`). ([OWASP Cheat Sheet Series][2])

Mitigation:

- Strict CSP + Trusted Types enforcement reduces blast radius if a sink remains. ([MDN Web Docs][10])

---

### JS-XSS-003: Do not use string-to-code execution (`eval`, `new Function`, string timeouts)

Severity: Critical if you can prove attacker-controlled input can reach these APIs; otherwise Medium

Required:

- MUST NOT pass untrusted data to:
  - `eval()`
  - `new Function(...)`
  - `setTimeout("...")` / `setInterval("...")` with string arguments ([MDN Web Docs][10])

- SHOULD avoid these APIs entirely in modern frontend code; refactor to non-eval logic. ([MDN Web Docs][10])
- MUST NOT “fix CSP breakage” by adding `unsafe-eval` unless there is a documented, reviewed justification and compensating controls. ([MDN Web Docs][10])

Insecure patterns:

- `eval(userInput)`
- `new Function("return " + userInput)()`
- `setTimeout(userInput, 0)` where userInput is a string

Detection hints:

- Search for `eval(`, `new Function`, `setTimeout("`, `setInterval("`.
- Also search for construction of code strings used later.

Fix:

- Replace dynamic code with:
  - structured data + explicit branching/handlers,
  - JSON parsing (`JSON.parse`) instead of `eval` for JSON. ([OWASP Cheat Sheet Series][2])

Mitigation:

- CSP that blocks `eval()`-like APIs by default, and avoid `unsafe-eval`. ([MDN Web Docs][10])
- Consider Trusted Types for controlled cases, but treat it as a hardening layer, not a license to keep eval patterns. ([MDN Web Docs][10])

---

### JS-XSS-004: Do not set event handler attributes from strings (e.g., `setAttribute("onclick", "...")`)

Severity: High

Required:

- MUST NOT use `setAttribute("on…", string)` or similar patterns with untrusted data; this coerces strings into executable code in the event-handler context. ([OWASP Cheat Sheet Series][2])
- SHOULD prefer `addEventListener` with function references.

Insecure patterns:

- `el.setAttribute("onclick", userInput)`
- `el.onclick = userControlledString` (string assignment)

Detection hints:

- Search for `.setAttribute("on`, `.onclick =`, `.onmouseover =`, etc.
- Trace whether RHS can be influenced by URL/hash/storage/postMessage. ([OWASP Cheat Sheet Series][2])

Fix:

- Replace with `addEventListener("click", () => { ... })`.
- If dynamic dispatch is needed, use an allowlisted mapping from identifiers to functions (no string eval). ([OWASP Cheat Sheet Series][2])

---

### JS-URL-001: Sanitize and allowlist URLs before navigation (especially `window.location` / `location.replace`)

Severity: Low (High if you can prove an attacker can fully control the URL)

IMPORTANT (applies to JS-URL-001 and JS-URL-002): This can cause a lot of false positives. Please perform extra analysis to determine if the url is fully attacker controlled. If not fully attacker controlled, then this is informational at best.

NOTE: It may be important functionality to be able to redirect to any given url. If that is the goal of the feature, then at a minimum, ensure it checks the schema even if the origin is allowed to be anything.

Required:

- MUST treat any assignment to navigation targets as security-sensitive:
  - `window.location = ...`
  - `location.href = ...`
  - `location.assign(...)`
  - `location.replace(...)` ([MDN Web Docs][4])

- MUST prevent navigation to `javascript:` URLs (and generally other script-bearing/active schemes), especially when input is derived from URL params, storage, or messages. ([MDN Web Docs][4]). Only allow `http:` and `https:`.
- SHOULD validate/allowlist the destination. A safe baseline is:
  - Allow only same-origin relative paths, OR
  - Allow only a strict allowlist of origins and protocols (typically `https:` and optionally `http:` for localhost dev). ([OWASP Cheat Sheet Series][8])

Insecure patterns:

- `location.replace(getParam("next"))`
- `window.location = userSuppliedUrl`
- `location.assign(window.redirectTo || "/")` where `redirectTo` can be clobbered or attacker-set ([OWASP Cheat Sheet Series][8])

Detection hints:

- Search for `window.location`, `location.href`, `location.assign`, `location.replace`.
- Search for common redirect parameters: `next`, `returnTo`, `redirect`, `url`, `continue`.
- Search for `javascript:` literal usage. ([MDN Web Docs][4])

Fix:

- Parse and validate with `new URL(value, location.origin)` and then enforce:
  - `url.protocol` in `{ "https:" }` (and only include `http:` in explicit dev-only code paths),
  - `url.origin` equals `location.origin` for internal redirects, or in a strict allowlist for external redirects,
  - optionally allow only specific path prefixes. ([MDN Web Docs][4])

- If validation fails, navigate to a safe default (home/dashboard).

Mitigation:

- Deploy strict CSP and Trusted Types enforcement to reduce the impact of DOM XSS sinks, but note that Trusted Types do not prevent every possible unsafe navigation scenario on their own. ([W3C][15])

False positive notes:

- Some apps intentionally support external redirects (SSO, payment flows). Those MUST be allowlisted and documented.

---

### JS-URL-002: Sanitize URLs before inserting into DOM URL contexts (`href`, `src`, etc.)

Severity: Low (High if you can prove an attacker can fully control the URL; see the false-positive note under JS-URL-001)

Required:

- MUST treat setting URL-bearing DOM attributes/properties as security-sensitive, especially:
  - `a.href`, `img.src`, `script.src`, `iframe.src`, `form.action`, `link.href`.

- MUST prevent script-bearing schemes (`javascript:` and other active schemes) when values can be attacker-influenced. ([MDN Web Docs][4])
- SHOULD prefer setting properties (e.g., `a.href = url.toString()`) after parsing and validation, rather than string concatenation.

Insecure patterns:

- `link.href = getParam("u")`
- `el.setAttribute("href", userInput)` without validation
- constructing URLs via concatenation with untrusted pieces

Detection hints:

- Search for `.href =`, `.src =`, `.action =`, `setAttribute("href"`, `setAttribute("src"`.
- Search for `javascript:` / `data:` usage in URLs. ([MDN Web Docs][4])

Fix:

- Use `new URL(...)` and validate:
  - protocol allowlist
  - avoid passing user-provided values into `<script src>` at all (treat as code execution). ([OWASP Cheat Sheet Series][8])

---

### JS-CSP-001: Use CSP; meta delivery is allowed

Severity: Medium to High (depends on threat model; High when handling untrusted content)

NOTE: It is most important to set the CSP's script-src. All other directives are not as important and can generally be excluded for the ease of development.

Required:

- SHOULD deploy a CSP as a major defense-in-depth against XSS, delivered via HTTP response headers when possible. ([MDN Web Docs][10])
- MAY provide CSP via `<meta http-equiv="Content-Security-Policy" ...>` when headers are not available (e.g., purely static hosting constraints). ([MDN Web Docs][1])
- If CSP is delivered via meta, MUST:
  - place it early — the policy only applies to content that follows the meta element, so it must precede any scripts/resources you want governed, and
  - not rely on unsupported directives in meta policies (`report-uri`, `frame-ancestors`, `sandbox` are ignored); “report-only” CSP also cannot be set via meta. ([W3C][3])

- MUST avoid adding `unsafe-inline` as a “quick fix” for CSP issues unless explicitly required and reviewed (it defeats much of CSP’s purpose). ([MDN Web Docs][10])
- MUST avoid adding `unsafe-eval` unless explicitly required and reviewed (it allows eval-like APIs that are commonly abused). ([MDN Web Docs][10])

Insecure patterns:

- No CSP present anywhere (repo HTML or server/edge) for an app that renders untrusted content.
- CSP includes `script-src 'unsafe-inline'` and/or `script-src 'unsafe-eval'` without strong justification. ([MDN Web Docs][10])
- CSP delivered via meta but includes `frame-ancestors` (it will be ignored in meta). ([W3C][3])

Detection hints:

- Search HTML for `<meta http-equiv="Content-Security-Policy"`.
- Search server/edge configs for `Content-Security-Policy` header.
- If CSP is only in meta, check it appears before any `<script>` tags you want governed. ([W3C][3])

Fix:

- Prefer header-delivered CSP at the server/edge.
- If constrained to meta, keep a strong allowlist CSP and document the limitations; implement clickjacking protections (e.g., `frame-ancestors`) at the server/edge, not in meta. ([W3C][3])

---

### JS-CSP-002: Prefer strict CSP (nonces/hashes); avoid inline/eval patterns in code

Severity: Medium

Required:

- SHOULD design frontend code to work under a strict CSP:
  - avoid inline scripts and inline event handlers,
  - avoid eval-like APIs (see JS-XSS-003),
  - allow scripts via nonce or hash when needed. ([MDN Web Docs][10])

Insecure patterns:

- Large amounts of inline script blocks and inline `onclick="..."` handlers.
- Libraries that require `unsafe-eval`.

Detection hints:

- Search for `<script>` blocks with inline code, `onclick="`, `onload="`, etc.
- Search for CSP directives containing `unsafe-inline` or `unsafe-eval`. ([MDN Web Docs][10])

Fix:

- Move inline scripts into external JS files (same-origin).
- Use nonces/hashes for any unavoidable inline blocks. ([MDN Web Docs][10])

---

### JS-TT-001: Use Trusted Types to reduce DOM XSS attack surface (where supported)

Severity: Low

Required:

- SHOULD consider enabling Trusted Types enforcement with CSP `require-trusted-types-for 'script'` to make many DOM XSS sinks reject raw strings. ([MDN Web Docs][11])
- If using Trusted Types, SHOULD also use the CSP `trusted-types` directive to restrict which policies can be created (reduces policy sprawl and improves auditability). ([MDN Web Docs][16])
- MUST keep Trusted Types policy code small, heavily reviewed, and used as the only path to produce trusted values for sinks. ([W3C][15])

Insecure patterns:

- “Trusted Types enabled” but policy simply returns input unchanged (no sanitization/validation).
- Many ad-hoc policies created across the codebase without restriction.
- Belief that Trusted Types alone prevents all unsafe navigations or all XSS classes. (It targets DOM injection sinks; it is not a universal sandbox.) ([W3C][15])

Detection hints:

- Search for CSP directives: `require-trusted-types-for` and `trusted-types`.
- Search code for `trustedTypes.createPolicy(` and inspect policy implementations. ([MDN Web Docs][11])

Fix:

- Add a small set of well-reviewed policies (e.g., `createHTML` that sanitizes).
- Restrict allowed policies via `trusted-types <policyName...>`.
- Migrate sinks to require `TrustedHTML` / `TrustedScriptURL` as appropriate. ([MDN Web Docs][11])

---

### JS-MSG-001: `postMessage` must use strict origin validation and explicit targetOrigin

Severity: Medium (High if dangerous behavior can be triggered via postMessage)

Required:

- When sending messages, MUST set an explicit `targetOrigin` (not `*`) to avoid sending data to an unexpected origin after redirects or window origin changes. ([MDN Web Docs][5])
- When receiving messages, MUST:
  - Validate `event.origin` exactly against an allowlist of expected origins (no substring matching). ([OWASP Cheat Sheet Series][6])
  - Consider validating `event.source` (expected window reference) when applicable. ([MDN Web Docs][5])
  - Validate `event.data` structure (schema/shape) and treat it purely as data (never evaluate it as code and never insert into DOM with `innerHTML`). ([OWASP Cheat Sheet Series][6])

Insecure patterns:

- `otherWindow.postMessage(payload, "*")`
- `window.addEventListener("message", (e) => { doSomething(e.data) })` with no `origin` check
- `if (e.origin.includes("trusted.com"))` (substring checks)
- `el.innerHTML = e.data` ([OWASP Cheat Sheet Series][6])

Detection hints:

- Search for `postMessage(`, `addEventListener("message"`, `onmessage =`.
- Audit all handlers for explicit allowlist checks on `event.origin`. ([OWASP Cheat Sheet Series][6])

Fix:

- Define an allowlist:
  - `const ALLOWED = new Set(["https://app.example.com", "https://accounts.example.com"]);`
    NOTE: For ease of development, you can use the current page's origin `window.location.origin` as a safe default origin.

- On receive:
  - `if (!ALLOWED.has(event.origin)) return;`
  - Validate `event.data` with a strict schema and reject unknown/extra fields.

- On send:
  - use the exact expected origin string as `targetOrigin`. ([OWASP Cheat Sheet Series][6])

Mitigation:

- Combine with a strict CSP and avoid DOM sinks in message paths. ([MDN Web Docs][10])

---

### JS-STORAGE-001: Web Storage is not a safe place for secrets (and is attacker-influencable)

Severity: Low

Required:

- MUST NOT store sensitive secrets or session identifiers in `localStorage` (or `sessionStorage`) if compromise would matter; a single XSS can exfiltrate everything in storage. ([OWASP Cheat Sheet Series][6])
- MUST treat values read from storage as untrusted input (attackers can load malicious values into storage via XSS). ([OWASP Cheat Sheet Series][6])
- SHOULD prefer server-set cookies with `HttpOnly` for session identifiers (JS cannot set `HttpOnly`, so avoid storing session IDs in JS-accessible storage). ([OWASP Cheat Sheet Series][6])
- SHOULD avoid hosting multiple unrelated apps on the same origin if they rely on storage separation (storage is origin-wide). ([OWASP Cheat Sheet Series][6])

Insecure patterns:

- `localStorage.setItem("access_token", token)`
- `localStorage.setItem("session", sessionId)`
- Long-lived bearer tokens, and especially refresh tokens, in JS-accessible storage.
- Assuming `localStorage` is “trusted because same-origin.”

Detection hints:

- Search for `localStorage.getItem`, `localStorage.setItem`, `sessionStorage.*`.
- Flag storage keys named `token`, `jwt`, `session`, `auth`, `refresh`. ([OWASP Cheat Sheet Series][6])

Fix:

- Use server-managed sessions (HttpOnly cookies) or short-lived tokens delivered and rotated securely, with careful XSS defenses (CSP/Trusted Types/strict sanitization) and minimal JS exposure. If bearer tokens are unavoidable, keep them short-lived, in memory rather than persisted storage, and rotate frequently.
- If storage must be used for non-sensitive state, keep it non-auth and validate/escape before use.

---

### JS-SUPPLY-001: Third-party JavaScript is a major supply-chain risk; minimize and control it

Severity: Low

Required:

- MUST treat third-party JS as equivalent to first-party JS in privilege (it can execute arbitrary code in your origin and access DOM data). ([OWASP Cheat Sheet Series][7])
- SHOULD minimize third-party scripts and prefer:
  - self-hosting / script mirroring,
  - strict CSP allowlists,
  - SRI for any CDN-hosted scripts,
  - ongoing monitoring for unexpected changes. ([OWASP Cheat Sheet Series][7])

Insecure patterns:

- Loading arbitrary remote scripts from many vendors without review.
- Using tag managers that can dynamically inject scripts with no integrity controls.
- Allowing scripts from broad wildcards in CSP (e.g., `script-src *`). ([MDN Web Docs][10])
- Injecting `<script src="...">` where the URL is user-controlled: `const s=document.createElement('script'); s.src = userProvidedUrl; ...` (MUST NOT).
- “Plugin marketplace” features that load arbitrary remote scripts.

Detection hints:

- Search HTML (`index.html`, server templates) for `<script src="https://...">` and `tag manager` snippets.
- Search CSP `script-src` sources for wildcards or overly broad domains.
- Search for dynamic script injection: `document.createElement("script")`, `script.src = ...`, `appendChild(script)`, and helpers like `loadExternalScript`, `injectScript`, `cdnUrl`. ([OWASP Cheat Sheet Series][8])

Fix:

- Remove unnecessary third-party tags.
- Bundle dependencies, or self-host or mirror scripts where possible.
- Lock down CSP `script-src` to the smallest set of trusted sources.
- Add SRI for CDN scripts/styles. ([OWASP Cheat Sheet Series][7])
- Consider sandboxed iframes for untrusted third-party UI.

---

### JS-SRI-001: Use Subresource Integrity (SRI) for third-party scripts/styles

Severity: Low

Required:

- SHOULD use SRI to ensure browsers only load third-party resources if they match an expected cryptographic hash. ([MDN Web Docs][12])
- MUST update SRI hashes whenever the underlying resource changes (pin versions; avoid “latest” URLs).

Insecure patterns:

- `<script src="https://cdn.example.com/lib.js"></script>` with no `integrity`.
- Loading `latest` or unpinned third-party resources.

Detection hints:

- Search for `<script src="https://` and `<link rel="stylesheet" href="https://` without `integrity=`.
- Check whether `integrity` is present and uses strong hashes (sha256/384/512 are typical). ([MDN Web Docs][12])

Fix:

- Add `integrity="sha384-..."` (or appropriate) and ensure proper CORS mode where needed.
- Prefer self-hosting critical libraries.

---

### FS-DOMC-001: Prevent DOM clobbering (avoid relying on `window`/`document` named properties)

Severity: Medium to High (can become Critical if it enables script loading or `javascript:` navigation)

Required:

- MUST NOT rely on implicit global variables or `window.someName` / `document.someName` lookups that can be clobbered by injected HTML elements with matching `id`/`name`. ([OWASP Cheat Sheet Series][8])
- MUST avoid patterns like `let x = window.redirectTo || "/safe"; location.assign(x);` where `redirectTo` could be clobbered to an `<a>` element whose `href` is attacker-controlled (including `javascript:`). ([OWASP Cheat Sheet Series][8])
- SHOULD use explicit variable declarations, local scope, and explicit DOM queries (`getElementById`) rather than named property access. ([OWASP Cheat Sheet Series][8])
- If the app inserts user-controlled markup (even sanitized), SHOULD ensure sanitization strategies consider `id`/`name` collisions. ([OWASP Cheat Sheet Series][8])

Insecure patterns:

- `const cfg = window.config || {};` used for security-sensitive URLs.
- `const redirect = window.redirectTo || "/"; location.assign(redirect);` ([OWASP Cheat Sheet Series][8])
- Loading scripts from `window.*` config values without strict validation.

Detection hints:

- Search for `window.` and `document.` used as config stores (especially `||` fallback patterns).
- Search for usage of `location.assign/replace` with variables that come from `window`/`document` properties.
- Search for dynamic script creation (`createElement('script')`) where `.src` comes from a non-local variable. ([OWASP Cheat Sheet Series][8])

Fix:

- Store config in module-scoped constants (not on `window`/`document`) and pass it explicitly.
- Validate any URL-like config with protocol/origin allowlists (see JS-URL-001). ([OWASP Cheat Sheet Series][8])
- Consider hardening: sanitization, CSP, and (in limited cases) freezing sensitive objects, but treat these as defense-in-depth, not a substitute for safe coding patterns. ([OWASP Cheat Sheet Series][8])

---

### JS-CSRF-001: Cookie-authenticated state-changing requests MUST be CSRF-protected (coordinate with the backend)

Severity: High (for cookie-authenticated state-changing requests)

NOTE: This only matters when cookies authenticate the user. If requests authenticate via an `Authorization` header (e.g., bearer token), classic browser CSRF is not a concern; verify the actual auth mechanism before reporting.

Required:

- If requests include cookies (`credentials: 'include'`, or the framework/library equivalent) and cookies authenticate the user, MUST protect state-changing requests (POST/PUT/PATCH/DELETE) with CSRF protections coordinated with the backend: server-verified CSRF tokens (for AJAX/fetch calls, commonly sent in a custom header), Origin checks, and SameSite cookies as defense-in-depth. ([OWASP Cheat Sheet Series][24])
- MUST NOT treat “it’s an AJAX request” as CSRF protection by itself.
- MUST NOT “solve CORS/CSRF errors” by disabling protections on the backend or using `mode: 'no-cors'` on the frontend.

Insecure patterns:

- `fetch(url, { credentials: 'include', method: 'POST', body: ... })` with no CSRF token/header usage anywhere.
- “CSRF protection” that only checks for `X-Requested-With` (defense-in-depth only, not primary).
- Enabling cross-origin credentialed requests without strict origin allowlists (backend-side).

Detection hints:

- Enumerate state-changing requests and locate whether they include CSRF tokens.
- Search: `credentials: 'include'`, `xsrf`, `csrf`, `X-CSRF-Token`, `X-XSRF-TOKEN`.
- Look at API wrapper modules for headers and cookie settings.
- Identify how the server expects CSRF validation (meta tag, cookie-to-header double submit, synchronizer token, etc.).

Fix:

- Implement backend-issued CSRF tokens and require them on state-changing requests; add token inclusion in a centralized place (API wrapper / request setup) and ensure the server verifies it.
- Keep cookies `SameSite=Lax/Strict` where compatible and verify Origin/Referer where appropriate (backend-driven).
- Follow OWASP CSRF guidance for token properties and validation. ([OWASP Cheat Sheet Series][24])

---

## 5) Practical scanning heuristics (how to “hunt”)

When actively scanning, use these high-signal patterns:

- DOM XSS sinks:
  - `.innerHTML`, `.outerHTML`, `insertAdjacentHTML(`
  - `document.write(`, `document.writeln(` ([OWASP Cheat Sheet Series][2])

- Dangerous navigation / URL sinks:
  - `window.location`, `location.href`, `location.assign`, `location.replace`
  - `javascript:` literals (and other suspicious schemes like `data:text/html`) ([MDN Web Docs][4])

- String-to-code execution:
  - `eval(`, `new Function`, `setTimeout("`, `setInterval("` ([MDN Web Docs][10])

- Event-handler string injection:
  - `.setAttribute("on`, `.onclick =`, `.onload =` with strings ([OWASP Cheat Sheet Series][2])

- `postMessage`:
  - `postMessage(` with `"*"` as targetOrigin
  - `addEventListener("message"` without strict `event.origin` allowlist checks ([MDN Web Docs][5])

- Storage:
  - `localStorage.setItem(` / `getItem(`, `sessionStorage.*`
  - keys containing `token`, `jwt`, `session`, `auth`, `refresh` ([OWASP Cheat Sheet Series][6])

- CSP and related:
  - `Content-Security-Policy` header config (server/edge)
  - `<meta http-equiv="Content-Security-Policy" ...>`
  - CSP containing `unsafe-inline` or `unsafe-eval`
  - `require-trusted-types-for` / `trusted-types` directives ([MDN Web Docs][1])

- Third-party scripts:
  - `<script src="https://...">` without `integrity=`
  - Tag manager snippets and dynamic script injection code paths ([MDN Web Docs][12])

- DOM clobbering gadgets:
  - `window.<name> || ...` and `document.<name> || ...` patterns
  - security-sensitive usage of `window`/`document` properties as config sources ([OWASP Cheat Sheet Series][8])

- CSRF posture:
  - `credentials: 'include'` on state-changing requests without any CSRF header/token handling ([OWASP Cheat Sheet Series][24])

---

## 6) Sources (accessed 2026-01-27)

Primary standards / platform docs:

- W3C Content Security Policy Level 2 (HTML `<meta>` delivery restrictions; unsupported directives in meta CSP): `https://www.w3.org/TR/CSP2/` ([W3C][3])
- MDN: CSP Guide (strict CSP, nonces/hashes, `unsafe-inline`/`unsafe-eval`, eval blocking): `https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP` ([MDN Web Docs][10])
- MDN: `<meta http-equiv>` (CSP via meta and warning about meta-based security headers): `https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/http-equiv` ([MDN Web Docs][1])
- MDN: `frame-ancestors` (and note it’s not supported in `<meta>`): `https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors` ([MDN Web Docs][18])

DOM XSS and dangerous sinks:

- OWASP: DOM Based XSS Prevention Cheat Sheet (dangerous sinks + safe patterns like `textContent`): `https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html` ([OWASP Cheat Sheet Series][2])
- MDN: `innerHTML` (security considerations): `https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML` ([MDN Web Docs][19])
- MDN: `insertAdjacentHTML` (security considerations): `https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML` ([MDN Web Docs][20])
- MDN: `document.write()` / `document.writeln()` (security considerations): `https://developer.mozilla.org/en-US/docs/Web/API/Document/write` and `https://developer.mozilla.org/en-US/docs/Web/API/Document/writeln` ([MDN Web Docs][13])

URL scheme hazards:

- MDN: `javascript:` URLs (execution on navigation; discouraged; references `window.location`): `https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/javascript` ([MDN Web Docs][4])

Trusted Types:

- W3C: Trusted Types spec (DOM XSS sinks include `Element.innerHTML` and `Location.href` setters; goals and limitations): `https://www.w3.org/TR/trusted-types/` ([W3C][15])
- MDN: `require-trusted-types-for` directive: `https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for` ([MDN Web Docs][11])
- MDN: `trusted-types` directive: `https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/trusted-types` ([MDN Web Docs][16])

Cross-window messaging:

- MDN: `window.postMessage` (security guidance: specify targetOrigin; validate origin): `https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage` ([MDN Web Docs][5])
- OWASP: HTML5 Security Cheat Sheet (Web Messaging guidance: explicit origin, strict checks, no `innerHTML`): `https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html` ([OWASP Cheat Sheet Series][6])

Third-party scripts and integrity:

- OWASP: Third Party JavaScript Management Cheat Sheet (risks and mitigations including SRI/mirroring): `https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html` ([OWASP Cheat Sheet Series][7])
- MDN: Subresource Integrity overview: `https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity` ([MDN Web Docs][12])
- W3C: Subresource Integrity spec: `https://www.w3.org/TR/sri-2/` ([W3C][21])

DOM clobbering:

- OWASP: DOM Clobbering Prevention Cheat Sheet (named property access risk; example attacks involving `location.assign` and `javascript:`): `https://cheatsheetseries.owasp.org/cheatsheets/DOM_Clobbering_Prevention_Cheat_Sheet.html` ([OWASP Cheat Sheet Series][8])

[1]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/http-equiv "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/meta/http-equiv"
[2]: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html "https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html"
[3]: https://www.w3.org/TR/CSP2/ "Content Security Policy Level 2"
[4]: https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/javascript "javascript: URLs - URIs | MDN"
[5]: https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage "https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage"
[6]: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html "https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html"
[7]: https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html "https://cheatsheetseries.owasp.org/cheatsheets/Third_Party_Javascript_Management_Cheat_Sheet.html"
[8]: https://cheatsheetseries.owasp.org/cheatsheets/DOM_Clobbering_Prevention_Cheat_Sheet.html "https://cheatsheetseries.owasp.org/cheatsheets/DOM_Clobbering_Prevention_Cheat_Sheet.html"
[9]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener"
[10]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP "https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP"
[11]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for"
[12]: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity "https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity"
[13]: https://developer.mozilla.org/en-US/docs/Web/API/Document/write "https://developer.mozilla.org/en-US/docs/Web/API/Document/write"
[14]: https://developer.mozilla.org/en-US/docs/Web/API/Document/writeln "https://developer.mozilla.org/en-US/docs/Web/API/Document/writeln"
[15]: https://www.w3.org/TR/trusted-types/ "https://www.w3.org/TR/trusted-types/"
[16]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/trusted-types "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/trusted-types"
[18]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors "https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors"
[19]: https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML "https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML"
[20]: https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML "https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentHTML"
[21]: https://www.w3.org/TR/sri-2/ "https://www.w3.org/TR/sri-2/"
[22]: https://github.com/cure53/DOMPurify "DOMPurify"
[23]: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API "HTML Sanitizer API - MDN Web Docs"
[24]: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html "Cross-Site Request Forgery Prevention Cheat Sheet"
