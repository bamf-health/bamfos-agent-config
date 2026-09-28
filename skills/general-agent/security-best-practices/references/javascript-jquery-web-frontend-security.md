# jQuery Frontend Security Spec (jQuery 4.0.x, modern browsers)

Load this file together with `javascript-general-web-frontend-security.md` (JS-* rules), which covers framework-agnostic browser risks. This file covers jQuery-specific guidance only. The shared safety constraints, operating modes, and finding format are in SKILL.md.

---

## 0) Safety, boundaries, and anti-abuse constraints (MUST FOLLOW)

- jQuery-specific examples of disabling protections (never do this as a “fix”): relaxing CSP to allow `unsafe-inline`, enabling JSONP “because it works”, adding broad CORS, disabling sanitization, suppressing security checks.

---

## 1) Generation and audit focus

In generation mode, MUST prefer safe-by-default patterns (text insertion, DOM node construction, allowlists, and proven sanitization libraries over custom escaping) and MUST avoid introducing new risky sinks (HTML string building, dynamic script loading, JSONP, inline script/event-handler attributes, unsafe URL assignment, unsafe object merging).

Recommended audit order:

1. jQuery sourcing, versions, and dependency hygiene (script tags, lockfiles, CDN usage, SRI).
2. CSP / Trusted Types / security headers posture (in repo and at runtime if observable).
3. DOM XSS: untrusted sources → jQuery sinks (`.html`, `.append`, `$("<…>")`, `.load`, etc.).
4. Script execution sinks: JSONP, `dataType:"script"`, `$.getScript`, dynamic `<script>` insertion.
5. URL/attribute assignment (`href`, `src`, `style`, `on*` attributes).
6. Prototype pollution / unsafe object merging (`$.extend` patterns).
7. AJAX auth patterns + CSRF for cookie-based sessions.
8. Third-party plugins and untrusted content rendering paths (comments, WYSIWYG, markdown-to-HTML).

---

## 2) Definitions and review guidance

### 2.1 Untrusted input (treat as attacker-controlled unless proven otherwise)

Use the untrusted-input list in the general frontend reference (§2.1). In jQuery code, pay particular attention to server data that originates from users (user profiles, comments, “display name”, rich text, filenames) returned by AJAX calls, and trace it into the jQuery sinks below.

### 2.2 High-risk “sinks” in jQuery contexts

A sink is a code path where untrusted input can become interpreted as executable code or HTML.

Key jQuery sink categories:

- HTML insertion / parsing:
  - DOM manipulation methods that accept HTML strings such as `.html()`, `.append()`, and related methods (see CVE notes below). ([NVD][1])
  - `$(htmlString)` (when the argument can be interpreted as HTML markup).
  - `jQuery.parseHTML(html, …, keepScripts)` especially with `keepScripts=true`. ([jQuery API][2])
  - `.load(url)` (loads HTML into DOM; has special script execution behavior). ([jQuery API][3])

- Script execution / dynamic code loading:
  - `$.getScript()` / `$.ajax({ dataType: "script" })` (executes fetched JavaScript). ([jQuery API][4])
  - JSONP (`dataType: "jsonp"` or implicit JSONP behavior) (executes remote JavaScript as a response). ([jQuery API][5])
  - `$.globalEval` (if present). Generic `eval` / `new Function` / string timers are covered by JS-XSS-003.

- Dangerous attribute assignment:
  - Assigning untrusted strings to `href`, `src`, `srcdoc`, `style`, or event-handler attributes (`onload`, `onclick`, etc.) via `.attr()` / `.prop()` (see JQ-ATTR-001).

---

## 3) Secure baseline: minimum production configuration (MUST in production)

This is the smallest “production baseline” that prevents common jQuery-related security failures. Details are in the referenced rules.

- MUST use a supported, patched jQuery version (JQ-SUPPLY-001).
- MUST load jQuery safely: bundled via your build pipeline, or from the official/trusted CDN with SRI (JQ-SUPPLY-002).
- SHOULD deploy CSP and consider Trusted Types (JQ-CSP-001, plus JS-CSP-001 and JS-TT-001 in the general frontend reference).
- SHOULD set common security headers (CSP, `X-Content-Type-Options: nosniff`, clickjacking protection via `frame-ancestors` / `X-Frame-Options`, `Referrer-Policy`). Even though these are typically set server-side, they materially reduce the blast radius of jQuery-related mistakes. However if the context is only the frontend web application, these cannot be acted on. ([OWASP Cheat Sheet Series][12])

---

## 4) Rules (generation + audit)

### JQ-SUPPLY-001: jQuery MUST be patched; do not run known vulnerable versions

Severity: Medium (High if internet-facing app AND version is known-vulnerable)

NOTE: Before performing an upgrade, get concent from the user and try to understand if they have reasons to keep it back. Upgrading can break applications in unexpected ways. Report and recommend upgrades rather than just performing them.

Required:

- MUST NOT use jQuery versions with known high-impact vulnerabilities when a patched version exists.
- MUST upgrade past:
  - CVE-2019-11358 (prototype pollution in jQuery before 3.4.0). ([NVD][13])
  - CVE-2020-11022 / CVE-2020-11023 (XSS risks in DOM manipulation methods when handling untrusted HTML; patched in 3.5.0). ([NVD][1])

Insecure patterns:

- Script tags or package manifests referencing old jQuery (e.g., `jquery-1.*`, `jquery-2.*`, `jquery-3.3.*`, `jquery-3.4.*`, `jquery-3.4.1`, etc.).
- Bundled vendor directories containing old minified jQuery without an upgrade path.

Detection hints:

- Search HTML/templates for `jquery-` and parse version strings.
- Check `package.json`, `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`.
- Check `vendor/`, `public/`, `static/`, `assets/`, `wwwroot/` for `jquery*.js`.

Fix:

- Upgrade to current jQuery (prefer latest stable major; as of 2026-01-27, 4.0.0 is current). ([blog.jquery.com][7])
- If upgrade is constrained, at minimum upgrade beyond the CVE thresholds and add compensating controls (strong CSP, strict sanitization, remove risky APIs like JSONP, remove deep-extend of untrusted objects).

Notes:

- If a product requirement forces old versions, report as “accepted risk requiring compensating controls”.
- If you must support very old browsers (notably IE < 11), jQuery 4 does not support them and you may need to stay on jQuery 3.x; treat this as a higher risk posture and patch aggressively. ([blog.jquery.com][7])

---

### JQ-SUPPLY-002: Third-party script loading SHOULD use integrity and trusted origins

Severity: High

Required:

- MUST load jQuery and plugins only from trusted origins: your own build pipeline (bundled via npm/yarn + lockfile), or the official jQuery CDN / a trusted CDN.
- CDN loads follow JS-SRI-001 (`integrity` + correct `crossorigin`); the jQuery project explicitly supports and recommends SRI on its CDN. ([jquery.com][8])

Insecure patterns:

- `<script src="https://…/jquery.min.js"></script>` with no `integrity`.
- Loading jQuery from random third-party CDNs without an explicit trust decision.

Detection hints:

- Scan HTML for jQuery/plugin `<script src=` tags and check for `integrity=` + `crossorigin=`.
- Identify dynamic script insertion with untrusted URLs (see JQ-EXEC-001).

Fix:

- Prefer bundling via npm + lockfile.
- If using CDN, copy official script tag (jQuery CDN supports SRI). ([jquery.com][8])

Note: If unable to get the correct SRI tag, skip this step but tell the user. If you end up using the wrong one the app will not function. In that case remove it and inform the user.

---

### JQ-XSS-001: Untrusted data MUST NOT be inserted as HTML via jQuery DOM-manipulation methods

Severity: High (if attacker-controlled content reaches these sinks)

Required:

- MUST treat any HTML string insertion as a code execution boundary.
- MUST use safe alternatives for untrusted text:
  - `.text(untrusted)` (text, not HTML). ([jQuery API][14])
  - `.val(untrusted)` for form fields. ([jQuery API][15])
  - Create elements and set text/attributes safely instead of concatenating HTML strings.

Insecure patterns (examples):

- `$(selector).html(untrusted)`
- `$(selector).append(untrusted)`
- `$(selector).before(untrusted)` / `.after(untrusted)` / `.replaceWith(untrusted)` / `.wrap(untrusted)` (and similar)
- Building markup: `"<div>" + untrusted + "</div>"` then passing to jQuery

Detection hints:

- Grep for: `.html(`, `.append(`, `.prepend(`, `.before(`, `.after(`, `.replaceWith(`, `.wrap(`, `.wrapAll(`, `.wrapInner(`
- Trace dataflow into these calls from sources in §2.1.

Fix:

- Replace with `.text()` / `.val()` or node construction:
  - `const $el = $("<span>").text(untrusted); container.append($el);`

- If the output must contain limited markup, see JQ-XSS-002 (sanitization).

Notes:

- Older jQuery versions had additional edge cases even when attempting sanitization; patched in 3.5.0+. Still: never rely on “string sanitization” alone—prefer structured creation or proven sanitizers. ([GitHub][16])

---

### JQ-XSS-002: If rendering user-controlled HTML is required, it MUST be sanitized with a proven HTML sanitizer

Severity: Medium (High if rich HTML is attacker-controlled and sanitizer is weak/misconfigured)

Required:

- Sanitizer choice, configuration, and the “no regex sanitizers” rule follow JS-XSS-001 (DOMPurify or the HTML Sanitizer API, restrictive allowlist, CSP/Trusted Types as defense in depth).
- Only the sanitizer’s output may reach `.html()` / `.append()` and related jQuery sinks.

Insecure patterns:

- Regex-based “strip `<script>`” or “escape `<`” attempts followed by `.html()` insertion.

Detection hints:

- Check if sanitizer results (or unsanitized values) are inserted with `.html()` or equivalent jQuery sinks.

Fix:

- Route every rich-HTML insertion through the centralized “sanitize then inject” module before calling `.html()`.

False positive notes:

- If content is guaranteed trusted (e.g., compiled templates shipped by you), document the trust boundary and why it is not attacker-controlled.

---

### JQ-XSS-003: `$(untrustedString)` and `jQuery.parseHTML` MUST NOT process attacker-controlled markup

Severity: High (if attacker-controlled)

Required:

- MUST NOT pass attacker-controlled strings to `$()` when they might be interpreted as HTML.
- MUST treat `jQuery.parseHTML(html, …, keepScripts)` as a high-risk primitive; keepScripts MUST be `false` for any untrusted input. ([jQuery API][2])

Insecure patterns:

- `const $node = $(untrusted);`
- `$.parseHTML(untrusted, /* context */, true)` (scripts preserved)

Detection hints:

- Search for `$(` calls where the argument is not a static selector or static markup.
- Search for `$.parseHTML(` and inspect the `keepScripts` argument.

Fix:

- Use DOM creation with constant tag names and `.text()` for untrusted values.
- If parsing HTML is necessary, sanitize first (JQ-XSS-002) and keep scripts disabled.

---

### JQ-XSS-004: `.load()` MUST be treated as an HTML+script injection surface

Severity: Medium (High if URL/content is attacker-controlled)

Required:

- MUST NOT use `.load()` with attacker-controlled URLs or attacker-controlled HTML fragments.
- MUST understand jQuery `.load()` script behavior:
  - Without a selector in the URL, content is passed to `.html()` before scripts are removed, which can execute scripts. ([jQuery API][3])

- SHOULD prefer `fetch()`/XHR to retrieve data, then render with safe DOM creation or sanitize explicitly.

Insecure patterns:

- `$("#target").load(untrustedUrl)`
- `$("#target").load("/path?param=" + untrusted)`

Detection hints:

- Search for `.load(` across JS/TS files.
- Identify whether a selector is appended to the URL (the behavior differs). ([jQuery API][3])
- Trace whether the URL can be influenced by user input.

Fix:

- Replace `.load()` with:
  - `fetch()` to retrieve JSON, then render via `.text()` / node construction, or
  - `fetch()` to retrieve HTML, sanitize it, then inject.

- If `.load()` must remain, ensure the URL is constant or strictly allowlisted and the returned content is trusted.

---

### JQ-EXEC-001: Dynamic script execution and script fetching MUST NOT be reachable from untrusted input

Severity: High

Required:

- MUST NOT fetch-and-execute scripts from untrusted or user-influenced URLs.
- MUST treat these as code execution primitives:
  - `$.getScript(url)` executes the fetched script in the global context. ([jQuery API][4])
  - `$.ajax({ dataType: "script" })` and other script-typed requests that execute responses.

- SHOULD remove these patterns unless there is a strong, reviewed justification.

Insecure patterns:

- `$.getScript(untrustedUrl)`
- `$.ajax({ url: untrustedUrl, dataType: "script" })`
- Dynamic `<script src=...>` injection where `src` is derived from untrusted input.

Detection hints:

- Search for `getScript(`, `dataType: "script"`, `globalEval` (generic `eval`/`new Function`: JS-XSS-003).
- Look for “plugin loader” or “theme loader” features that accept URLs.

Fix:

- Bundle scripts at build time.
- If runtime-loading is required, restrict to allowlisted, versioned, integrity-checked assets (and ideally still avoid runtime code loading).

---

### JQ-AJAX-001: JSONP MUST be disabled unless the endpoint is fully trusted (and even then, avoid)

Severity: Medium (High if attacker can influence URL/endpoint)

Required:

- MUST NOT use JSONP for untrusted endpoints because it executes JavaScript responses.
- When using `$.ajax`, MUST explicitly disable JSONP for non-fully-trusted targets; jQuery’s own docs recommend setting `jsonp: false` “for security reasons” if you don’t trust the target. ([jQuery API][5])
- SHOULD prefer CORS with JSON (`dataType: "json"`) and explicit origin allowlists server-side.

Insecure patterns:

- `dataType: "jsonp"`
- URLs containing `callback=?` or patterns that trigger JSONP behavior. callback arguments are historically XSS vectors.
- `$.get(untrustedUrl)` without pinning `dataType` and disabling JSONP (risk depends on options and jQuery behavior)

Detection hints:

- Search for `jsonp`, `dataType: "jsonp"`, `callback=?`.
- Search for cross-domain AJAX where the URL is not hard-coded or allowlisted.

Fix:

- Use JSON over HTTPS with CORS configured server-side.
- Set:
  - `dataType: "json"`
  - `jsonp: false` (defense in depth when URL might be ambiguous) ([jQuery API][5])

---

### JQ-AJAX-002: State-changing AJAX requests using cookie auth MUST be CSRF-protected

Severity: High

Required:

- Follow JS-CSRF-001 (applies only to cookie-based auth; jQuery’s default `X-Requested-With` header is not CSRF protection). ([OWASP Cheat Sheet Series][19])

Insecure patterns:

- `$.post("/transfer", {...})` or `$.ajax({ method: "POST", ... })` with cookie auth and no CSRF token/header.

Detection hints:

- Enumerate `$.post` / `$.ajax` state-changing calls and check for a `$.ajaxSetup` / `beforeSend` that adds the CSRF header.

Fix:

- Add CSRF token inclusion in a centralized place, e.g., `$.ajaxSetup({ headers: { "X-CSRF-Token": token } })`, and ensure server verifies.

---

### JQ-ATTR-001: Untrusted values MUST NOT be written into dangerous attributes without validation/allowlisting

Severity: Low (High for events like onclick)

Required:

- MUST validate/allowlist URLs written via `.attr()` / `.prop()` into `href`, `src`, `action`, etc., blocking `javascript:` and other dangerous schemes (validation rules: JS-URL-002). ([MDN Web Docs][6])
- MUST NOT set event-handler attributes (`onclick`, `onerror`, etc.) from strings via `.attr()` (see JS-XSS-004).
- SHOULD avoid writing untrusted strings into `style` attributes; prefer toggling predefined CSS classes.

Insecure patterns:

- `$("a").attr("href", untrustedUrl)`
- `$("img").attr("src", untrustedUrl)`
- `$(el).attr("style", untrustedCss)`
- `$(el).attr("onclick", untrustedJs)`

Detection hints:

- Search for `.attr("href"`, `.attr("src"`, `.attr("style"`, `.prop("href"`, `.prop("src"`.
- Trace whether inputs come from URL params, server JSON, DOM, or storage.

Fix:

- Validate URLs per JS-URL-002 (`new URL(value, location.origin)` + protocol/host allowlist) before passing them to `.attr()` / `.prop()`.
- For navigation targets, prefer relative paths you construct rather than full URLs.
- Replace `style` strings with `addClass/removeClass` using predefined class names.

---

### JQ-SELECTOR-001: User-controlled selector fragments MUST be escaped with `jQuery.escapeSelector`

Severity: Medium (can become High if it enables wrong-element selection in security-relevant UI)

Required:

- If you must select by an ID/class that can contain special CSS characters, SHOULD use `jQuery.escapeSelector()` (available in jQuery 3.0+). ([jQuery API][20])
- MUST NOT concatenate raw attacker-controlled strings into selector expressions.

Insecure patterns:

- `$("#" + untrustedId)`
- `$("[data-id='" + untrusted + "']")` (especially without strict quoting/escaping)

Detection hints:

- Search for `"#" +`, `". " +`, or template strings used inside `$(` selectors.
- Look for “select by user-supplied id”.

Fix:

- `$("#" + $.escapeSelector(untrustedId))` ([jQuery API][20])
- Prefer stable internal IDs over user-derived selectors.

Notes:

- This is often “robustness”, but it can become security-relevant if incorrect selection causes UI to reveal/modify the wrong data or skip security-related prompts.

---

### JQ-PROTOTYPE-001: Do not deep-merge untrusted objects; prevent prototype pollution

Severity: Medium

Required:

- MUST NOT deep-merge (`$.extend(true, …)`) attacker-controlled objects into application objects without filtering dangerous keys.
- MUST ensure jQuery is >= 3.4.0 (see JQ-SUPPLY-001 for the prototype-pollution CVE).

Insecure patterns:

- `$.extend(true, target, untrustedObj)`
- `$.extend(true, {}, defaults, untrustedObj)` where untrustedObj comes from URL/JSON/storage

Detection hints:

- Search for `$.extend(true` and inspect sources of merged objects.
- Search for “merge options” / “apply config” patterns using untrusted JSON.

Fix:

- Prefer:
  - Shallow merges with an allowlisted set of keys, or
  - A safe merge helper that explicitly rejects `__proto__`, `prototype`, `constructor`, and nested occurrences.

- Keep jQuery patched.

---

### JQ-CSP-001: CSP and Trusted Types SHOULD be used to make DOM XSS harder to introduce and exploit

Severity: Medium

Required:

- CSP and Trusted Types requirements follow JS-CSP-001, JS-CSP-002, and JS-TT-001 in the general frontend reference.
- jQuery-specific: jQuery 4.0 explicitly added Trusted Types support so that TrustedHTML can be passed to jQuery manipulation methods without violating `require-trusted-types-for`. When using jQuery 4 with Trusted Types enforced, SHOULD route DOM injection through Trusted Types policies and pass TrustedHTML to jQuery. ([blog.jquery.com][7])

---

## 5) Practical scanning heuristics (how to “hunt”)

When actively scanning, use these high-signal patterns:

- jQuery version / sourcing:
  - `jquery-*.js` in `vendor/` or `static/`
  - `package.json` dependency `jquery` pinned to old versions
  - CDN script tags lacking `integrity`/`crossorigin` ([jquery.com][8])

- HTML injection sinks (DOM XSS):
  - `.html(`, `.append(`, `.prepend(`, `.before(`, `.after(`, `.replaceWith(`, `.wrap(`
  - `$(` where argument might be HTML / template strings
  - `$.parseHTML(` especially with `keepScripts=true` ([jQuery API][2])
  - `.load(` (and whether selector is appended; script behavior differs) ([jQuery API][3])

- Script execution / dynamic code:
  - `$.getScript(`, `dataType: "script"` ([jQuery API][4])
  - `dataType: "jsonp"` or `jsonp:` usage; `callback=?` patterns ([jQuery API][5])
  - `$.globalEval`

- Dangerous attribute writes:
  - `.attr("href", …)`, `.attr("src", …)`, `.attr("style", …)`
  - Any assignment of `javascript:`-like schemes or suspicious URL construction ([MDN Web Docs][6])

- Selector construction:
  - `$("#" + user)` and similar; fix via `$.escapeSelector` ([jQuery API][20])

- Prototype pollution:
  - `$.extend(true, …, userObj)`; ensure jQuery >= 3.4.0 and filter dangerous keys ([NVD][13])

- CSRF posture for AJAX:
  - `$.post(` / `$.ajax({ method: ... })` with cookies and no CSRF token/header ([OWASP Cheat Sheet Series][19])

- Defense-in-depth:
  - Absence of CSP/security headers in configs (or not visible; require runtime verification) ([OWASP Cheat Sheet Series][12])

---

## 6) Sources (accessed 2026-01-27)

Primary jQuery project documentation and release notes:

- jQuery 4.0.0 release notes (Trusted Types/CSP changes; version info): `https://blog.jquery.com/2026/01/17/jquery-4-0-0/`. ([blog.jquery.com][7])
- Download jQuery (latest version info; CDN + SRI guidance): `https://jquery.com/download/`. ([jquery.com][8])
- jQuery API: `.html()`: `https://api.jquery.com/html/`. ([jQuery API][21])
- jQuery API: `.text()`: `https://api.jquery.com/text/`. ([jQuery API][14])
- jQuery API: `.append()`: `https://api.jquery.com/append/`. ([jQuery API][22])
- jQuery API: `.load()` (script execution behavior): `https://api.jquery.com/load/`. ([jQuery API][3])
- jQuery API: `jQuery.parseHTML(…, keepScripts)`: `https://api.jquery.com/jQuery.parseHTML/`. ([jQuery API][2])
- jQuery API: `$.ajax()` (`jsonp: false` security note): `https://api.jquery.com/jQuery.ajax/`. ([jQuery API][5])
- jQuery API: `$.getScript()` (executes script): `https://api.jquery.com/jQuery.getScript/`. ([jQuery API][4])
- jQuery API: `jQuery.escapeSelector()`: `https://api.jquery.com/jQuery.escapeSelector/`. ([jQuery API][20])

jQuery vulnerabilities / advisories:

- NVD CVE-2019-11358 (prototype pollution; jQuery < 3.4.0): `https://nvd.nist.gov/vuln/detail/CVE-2019-11358`. ([NVD][13])
- NVD CVE-2020-11022 (XSS risk in DOM manipulation methods; patched in 3.5.0): `https://nvd.nist.gov/vuln/detail/CVE-2020-11022`. ([NVD][1])
- NVD CVE-2020-11023 (XSS risk involving `<option>`; patched in 3.5.0): `https://nvd.nist.gov/vuln/detail/CVE-2020-11023`. ([NVD][23])
- GitHub Security Advisory GHSA-gxr4-xjj5-5px2 (jQuery htmlPrefilter XSS; patched in 3.5.0): `https://github.com/jquery/jquery/security/advisories/GHSA-gxr4-xjj5-5px2`. ([GitHub][16])

OWASP Cheat Sheet Series (web app security foundations relevant to jQuery usage):

- XSS Prevention: `https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html`. ([OWASP Cheat Sheet Series][24])
- DOM-based XSS Prevention: `https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html`. ([OWASP Cheat Sheet Series][25])
- CSRF Prevention: `https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html`. ([OWASP Cheat Sheet Series][19])
- HTTP Security Headers: `https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html`. ([OWASP Cheat Sheet Series][12])
- Content Security Policy Cheat Sheet: `https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html`. ([OWASP Cheat Sheet Series][9])

Browser/platform references (SRI, CSP, Trusted Types, and dangerous URL schemes):

- MDN: Subresource Integrity (SRI): `https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity`. ([MDN Web Docs][26])
- W3C: SRI specification: `https://www.w3.org/TR/sri-2/`. ([W3C][27])
- MDN: CSP guide: `https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP`. ([MDN Web Docs][28])
- MDN: `require-trusted-types-for` directive: `https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for`. ([MDN Web Docs][11])
- MDN: Trusted Types API: `https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API`. ([MDN Web Docs][29])
- W3C: Trusted Types specification: `https://www.w3.org/TR/trusted-types/`. ([W3C][10])
- MDN: `javascript:` URL scheme warning: `https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/javascript`. ([MDN Web Docs][6])
- DOMPurify project documentation: `https://github.com/cure53/DOMPurify`. ([GitHub][17])

[1]: https://nvd.nist.gov/vuln/detail/cve-2020-11022?utm_source=chatgpt.com "CVE-2020-11022 Detail - NVD"
[2]: https://api.jquery.com/jQuery.parseHTML/?utm_source=chatgpt.com "jQuery.parseHTML()"
[3]: https://api.jquery.com/load/?utm_source=chatgpt.com ".load() | jQuery API Documentation"
[4]: https://api.jquery.com/jQuery.getScript/?utm_source=chatgpt.com "jQuery.getScript()"
[5]: https://api.jquery.com/jQuery.ajax/?utm_source=chatgpt.com "jQuery.ajax()"
[6]: https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/javascript?utm_source=chatgpt.com "javascript: URLs - URIs - MDN Web Docs"
[7]: https://blog.jquery.com/2026/01/17/jquery-4-0-0/ "jQuery 4.0.0 | Official jQuery Blog"
[8]: https://jquery.com/download/ "Download jQuery | jQuery"
[9]: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html?utm_source=chatgpt.com "Content Security Policy - OWASP Cheat Sheet Series"
[10]: https://www.w3.org/TR/trusted-types/?utm_source=chatgpt.com "Trusted Types"
[11]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/require-trusted-types-for?utm_source=chatgpt.com "Content-Security-Policy: require-trusted-types-for directive"
[12]: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html?utm_source=chatgpt.com "HTTP Security Response Headers Cheat Sheet"
[13]: https://nvd.nist.gov/vuln/detail/cve-2019-11358?utm_source=chatgpt.com "CVE-2019-11358 Detail - NVD"
[14]: https://api.jquery.com/text/?utm_source=chatgpt.com ".text() | jQuery API Documentation"
[15]: https://api.jquery.com/val/?utm_source=chatgpt.com ".val() | jQuery API Documentation"
[16]: https://github.com/jquery/jquery/security/advisories/GHSA-gxr4-xjj5-5px2 "Potential XSS vulnerability in jQuery.htmlPrefilter and related methods · Advisory · jquery/jquery · GitHub"
[17]: https://github.com/cure53/DOMPurify?utm_source=chatgpt.com "DOMPurify - a DOM-only, super-fast, uber-tolerant XSS ..."
[18]: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Sanitizer_API?utm_source=chatgpt.com "HTML Sanitizer API - MDN Web Docs"
[19]: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html?utm_source=chatgpt.com "Cross-Site Request Forgery Prevention Cheat Sheet"
[20]: https://api.jquery.com/jQuery.escapeSelector/?utm_source=chatgpt.com "jQuery.escapeSelector()"
[21]: https://api.jquery.com/html/?utm_source=chatgpt.com ".html() | jQuery API Documentation"
[22]: https://api.jquery.com/append/?utm_source=chatgpt.com ".append() | jQuery API Documentation"
[23]: https://nvd.nist.gov/vuln/detail/cve-2020-11023?utm_source=chatgpt.com "CVE-2020-11023 Detail - NVD"
[24]: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html?utm_source=chatgpt.com "Cross Site Scripting Prevention - OWASP Cheat Sheet Series"
[25]: https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html?utm_source=chatgpt.com "DOM based XSS Prevention Cheat Sheet"
[26]: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity?utm_source=chatgpt.com "Subresource Integrity - Security - MDN Web Docs"
[27]: https://www.w3.org/TR/sri-2/?utm_source=chatgpt.com "Subresource Integrity"
[28]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP?utm_source=chatgpt.com "Content Security Policy (CSP) - HTTP - MDN Web Docs"
[29]: https://developer.mozilla.org/en-US/docs/Web/API/Trusted_Types_API?utm_source=chatgpt.com "Trusted Types API - MDN Web Docs"
