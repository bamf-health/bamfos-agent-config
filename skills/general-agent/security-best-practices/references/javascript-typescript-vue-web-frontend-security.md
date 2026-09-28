# Vue.js Web Security Spec (Vue 3.x+, Nuxt 4.x+ TypeScript/JavaScript, common tooling: Vite)

Load this file together with `javascript-general-web-frontend-security.md` (JS-* rules), which covers framework-agnostic browser risks. This file covers Vue/Nuxt-specific guidance only. The shared safety constraints, operating modes, and finding format are in SKILL.md.

---

## 0) Safety, boundaries, and anti-abuse constraints (MUST FOLLOW)

  - Vue-specific examples of disabling protections (never do this as a “fix”): weakening CSP, turning on unsafe template compilation, using `v-html` as a shortcut, bypassing backend auth, or “just store the token in localStorage”.

---

## 1) Generation and audit focus

In generation mode, MUST prefer safe-by-default framework features and MUST avoid introducing new risky sinks (runtime template compilation, `v-html` / `innerHTML`, unsafe URL navigation, dynamic script injection, etc.). ([Vue.js][1])

Recommended audit order:

1. Build/deploy entrypoints and hosting config (Docker, CI, static hosting, SSR server).
2. Secrets exposure (env usage, `.env*`, hard-coded keys). ([vitejs][2])
3. XSS surface: templates, `v-html` / `innerHTML`, URL/style injection, DOM APIs. ([Vue.js][1])
4. Auth/session handling in the browser (token storage, credentialed requests, CSRF integration). ([Vue.js][1])
5. Routing/navigation (open redirects, “return_to/next”, unsafe external navigation). ([Vue.js][1])
6. Third-party scripts and content (CDN assets, analytics, widgets, iframes). ([Vue.js][1])
7. Security headers and browser hardening expectations (CSP, clickjacking). ([Vue.js][1])
8. SSR-specific concerns (state serialization, template boundaries) when applicable. ([Vue.js][1])

---

## 2) Definitions and review guidance

### 2.1 Untrusted input (treat as attacker-controlled unless proven otherwise)

  In addition to the untrusted inputs listed in the general frontend reference (§2.1), in a Vue app treat these as untrusted (non-exhaustive):

  - Anything from APIs: `fetch`, `axios`, `useFetch`, `useAsyncData`, GraphQL responses, webhooks, third-party SDKs.
  - Router-controlled data: `route.params`, `route.query`, `route.hash`, and anything derived from `useRoute`.
  - Anything that can be influenced by an attacker through DOM clobbering or injected HTML (especially if Vue is mounted onto non-sterile DOM). ([Vue.js][1])

### 2.2 State-changing action (frontend perspective)

  An action is state-changing if it can:

  - Create/update/delete data via API calls.
  - Change authentication/session state (login, logout, refresh token).
  - Trigger privileged operations (payments, admin actions).
  - Cause side effects (sending emails, triggering webhooks, changing account settings).

---

## 3) Secure baseline: minimum production configuration (MUST in production)

This is the smallest “production baseline” that prevents common Vue/front-end misconfigurations. Details are in the referenced rules.

- MUST ship a **production build**, not a dev/preview server or development build (VUE-DEPLOY-001, VUE-DEPLOY-002).
- MUST NOT ship secrets in frontend bundles (VUE-SECRETS-001, VUE-SECRETS-002).
- MUST NOT render non-trusted templates (VUE-XSS-002); SHOULD avoid raw HTML injection (VUE-XSS-001).
- SHOULD deploy baseline security headers at the server/CDN layer (VUE-HEADERS-001).
- SHOULD use safe auth patterns (VUE-AUTH-001, VUE-CSRF-001).

---

## 4) Rules (generation + audit)

### VUE-DEPLOY-001: Do not run dev/preview servers in production

Severity: High

Required:

  - MUST NOT deploy the Vite/Vue/Nuxt dev server (`vite`, `npm run dev`, `nuxt dev`, `nuxi dev` HMR) as the production server.
  - MUST NOT use `vite preview` or `nuxt preview` as a production server. ([vitejs][5])
  - MUST build (`vite build` or `nuxt build`) and serve the built assets using a production-grade static server/CDN, or a production SSR server if you are doing SSR. ([vitejs][6])

  Insecure patterns:

  - Docker/Procfile/systemd running `vite`, `npm run dev`, `nuxt dev`, `nuxi dev`, or `vite preview` or `nuxt preview` as the production entrypoint.
  - Publicly exposed HMR endpoints.

  Detection hints:

  - Search: `vite`, `npm run dev`, `pnpm dev`, `yarn dev`, `vite preview`, `nuxt preview`, `nuxi dev`, `vue-cli-service serve`.
  - Check Docker `CMD`, `ENTRYPOINT`, CI deploy scripts, platform config.

Fix:

  - Build artifacts with `vite build` or `nuxt build`.
  - Serve `dist/` with hardened hosting (CDN/static server) or integrate into your backend server as static assets.

Notes:

  - Using dev/preview servers locally is fine; only flag if it is the production entrypoint.

---

### VUE-DEPLOY-002: Use Vue production builds and keep devtools off in production

Severity: Medium (High if production devtools/debug hooks are enabled)

Required:

- If loading Vue from CDN/self-host without a bundler, MUST use the `.prod.js` builds in production. ([Vue.js][3])
- SHOULD ensure production bundles do not enable Vue devtools in production builds, and SHOULD not intentionally enable production devtools flags. ([Vue.js][7])

Insecure patterns:

- Production includes development build artifacts.
- Explicitly enabling production devtools/diagnostic hooks.

Detection hints:

- Search HTML for `vue.global.js` / non-`.prod.js` variants when using CDN builds.
- Search build config for Vue feature flags like `__VUE_PROD_DEVTOOLS__`. ([Vue.js][7])

Fix:

- Switch to production build artifacts and ensure compile-time flags are configured for production.

---

### VUE-SECRETS-001: Never ship secrets in frontend code or env variables

Severity: High (Critical if real credentials are exposed)

Required:

  - MUST treat all frontend code and configuration as public.
  - MUST NOT embed secrets in:
      - source code
      - `.env` files committed to repo
      - `import.meta.env.*` variables included in the bundle

  - MUST assume any env var that ends up in the client bundle is attacker-readable. ([vitejs][2])

  Insecure patterns:

  - `VITE_API_KEY=...` containing a true secret (not just a public identifier).
  - Hard-coded API keys, private tokens, service credentials, signing keys in JS/TS.

  Detection hints:

  - Search: `VITE_`, `import.meta.env`, `.env`, `.env.production`, `.env.*.local`.
  - Grep for `API_KEY`, `SECRET`, `TOKEN`, `PRIVATE_KEY`, `BEGIN`, `sk-`, `AKIA`, etc.

Fix:

  - Move secrets to backend/edge functions.
  - Use backend-minted short-lived tokens for the browser when needed.

Notes:

  - Vite specifically warns that `.env.*.local` should be gitignored. ([vitejs][2])

---

### VUE-SECRETS-002: Do not broaden Vite env exposure

Severity: High

Required:

- MUST NOT configure Vite to expose all environment variables to the client.
- SHOULD keep `envPrefix` strict and explicit.

Insecure patterns:

- Setting `envPrefix` to overly broad values (or `''`) to “make env vars work”.
- Custom scripts that inject server secrets into global variables in HTML at build time.

Detection hints:

- Check `vite.config.*` for `envPrefix`.
- Check `nuxt.config.*` for `envPrefix`.
- Look for `define: { 'process.env': ... }` or manual injection into `window.__CONFIG__`.
- Look for `process.env.NUXT_` variables in the client bundle.

Fix:

- Keep secrets server-side.
- Only expose non-sensitive values intentionally designed to be public.

Notes:

- Vite only exposes variables matching `envPrefix`, which is why broadening it leaks env vars into the bundle. ([vitejs][2])

---

### VUE-XSS-001: Prefer Vue’s default escaping; avoid raw HTML injection

Severity: High

Required:

  - MUST rely on Vue’s automatic escaping for text interpolation and attribute binding where possible. ([Vue.js][1])
  - MUST NOT render user-provided HTML via:
      - `v-html` with untrusted content
      - `innerHTML` in render functions / JSX
  unless the HTML is trusted or robustly sanitized and the risk is explicitly accepted. ([Vue.js][1]) Direct DOM APIs (`element.innerHTML`, `insertAdjacentHTML`) are covered by JS-XSS-001.

  Insecure patterns:

  - `<div v-html="userProvidedHtml"></div>`
  - `h('div', { innerHTML: userProvidedHtml })`
  - `<div innerHTML={userProvidedHtml}></div>`

  Detection hints:

  - Search: `v-html`, `innerHTML` in render functions / JSX, `DOMParser`.

Fix:

  - Render untrusted content as text (interpolation).
  - If HTML rendering is required (e.g., Markdown), sanitize and harden per JS-XSS-001 and JS-TT-001 (Trusted Types is worth considering for apps with significant `v-html` surface). ([Vue.js][1])

Notes:

  - Vue’s docs explicitly warn that user-provided HTML is never “100% safe” unless sandboxed or strictly self-only exposure. ([Vue.js][1])

---

### VUE-XSS-002: Never use non-trusted templates (client-side template/code injection)

Severity: Critical

Required:

- MUST NOT use non-trusted content as a Vue component template.
- MUST treat “user can write a Vue template” as “user can execute arbitrary JavaScript in your app”, and potentially in SSR contexts too. ([Vue.js][1])
- SHOULD prefer the runtime-only build (templates compiled at build time) and avoid shipping the runtime compiler unless you have a vetted need.

Insecure patterns:

- `createApp({ template: '<div>' + userProvidedString + '</div>' }).mount(...)`
- Storing templates in DB and compiling/rendering them in the browser.
- Admin/CMS features that allow entering Vue template syntax.

Detection hints:

- Search: `template:` where the value is not a static string.
- Search: `@vue/compiler-dom`, `compile(`, “runtime compiler” build selection, dynamic SFC compilation.
- Search for “template editor”, “custom template”, “theme HTML” features.

Fix:

- Treat templates as code: keep them developer-controlled.
- If end-user customization is required, use a safe format (restricted Markdown subset) rendered via a sanitizer, or isolate in a sandboxed iframe.

---

### VUE-XSS-003: Do not mount Vue onto DOM that may contain user-provided server-rendered HTML

Severity: Medium

Required:

  - MUST NOT mount Vue on nodes that may contain server-rendered and user-provided content (because attacker-controlled HTML that is “safe as HTML” may become unsafe as a Vue template). ([Vue.js][1])
  - SHOULD mount Vue into a “sterile” root element and render the app’s DOM from Vue-controlled templates/components.

  Insecure patterns:

  - Server renders user content into `#app`, then Vue mounts on `#app` and compiles/interprets that DOM as a template.
  - “Sprinkling Vue” on large server-rendered pages that include user-generated content.

  Detection hints:

  - Check server templates (e.g., Rails/Django/Express templates) for user HTML inserted inside the Vue mount root.
  - Look for `mount('#app')` where `#app` includes server-rendered UGC.

Fix:

  - Move user-rendered HTML outside the Vue mount root, or render it in a safe way (text/sanitized HTML) from Vue components.

---

### VUE-XSS-004: Prevent URL injection in bindings and navigations

Severity: High

Required:

- MUST validate/sanitize any user-influenced URL before binding it to Vue attribute bindings (`:href`, `:src`, `:action`) or passing it to `window.open` or external router navigation. URL validation itself (scheme/host allowlists via `new URL(...)`) follows JS-URL-001 / JS-URL-002; redirect parameters (`next`, `return_to`, `redirect`) are covered by VUE-ROUTER-002.
- MUST specifically prevent `javascript:` URL execution in bindings like `<a :href="userProvidedUrl">`. ([Vue.js][1])
- SHOULD allow `mailto:`/`tel:` only if intended.

Insecure patterns:

- `<a :href="userProvidedUrl">`
- `<iframe :src="userProvidedUrl">`
- `window.open(userProvidedUrl)`

Detection hints:

- Search: `:href=`, `:src=`, `:action=`, `window.open`, `router.push(` with untrusted input.

Fix:

- Prefer internal navigation via route names/paths you control.
- Sanitize and validate on the backend before storing user URLs (Vue docs explicitly recommend backend sanitization). ([Vue.js][1])

---

### VUE-XSS-005: Prevent style/CSS injection and UI redress

Severity: Low

Required:

  - MUST NOT bind attacker-controlled CSS strings broadly (e.g., `:style="userProvidedStyles"`).
  - SHOULD use Vue’s style object syntax and only allow safe, specific properties if user customization is needed. ([Vue.js][1])
  - SHOULD isolate “user can control layout/CSS” features inside sandboxed iframes.

  Insecure patterns:

  - `:style="userProvidedStyles"` where styles are attacker-controlled.
  - Rendering user-provided `<style>` content (even if Vue blocks some patterns, don’t try to work around it).

  Detection hints:

  - Search: `:style="` bound to non-constant variables that originate from API/user content.
  - Search for “custom CSS”, “theme editor”, “profile CSS”.

Fix:

  - Allowlist properties and values; avoid raw style strings.
  - Use sandboxed iframes for rich user customization.

---

### VUE-XSS-006: Never bind user-provided JavaScript into event handler attributes

Severity: Critical

Required:

- MUST NOT bind attacker-provided strings into event handler attributes (e.g., `onclick`, `onfocus`, etc.).
- MUST treat “user-provided JS” as unsafe unless sandboxed and self-only exposure is guaranteed. ([Vue.js][1])

Insecure patterns:

- `<div :onclick="userProvidedString">`
- `<a :onmouseenter="userProvidedString">`

Detection hints:

- Search: `:on` followed by event attribute names (`:onclick`, `:onload`, etc.). (Plain-DOM `setAttribute('on…')` is covered by JS-XSS-004.)

Fix:

- Use real event listeners with developer-controlled handlers.
- If you truly need user scripting, isolate it (sandboxed iframe + strict boundaries).

---

### VUE-ROUTER-001: Do not treat client-side route guards as authorization

Severity: High

Required:

  - This is the Vue Router application of the frontend trust model in the general frontend reference (§0): MUST NOT rely on Vue Router guards, UI hiding, or client-side checks to enforce authorization; enforce it on the backend for every privileged action and sensitive data response. ([OWASP Cheat Sheet Series][8])

  Insecure patterns:

  - “Admin route is protected because `beforeEach` checks `user.isAdmin`.”
  - Sensitive API endpoints that assume “the frontend won’t call this unless allowed.”

  Detection hints:

  - Search `router.beforeEach` for role-based gating and see if the backend is also enforcing.
  - Look for “security by route meta” patterns (`meta.requiresAdmin`) with no server corroboration.

Fix:

  - Keep route guards as UX only (reduce accidental access), but enforce real checks server-side.

---

### VUE-ROUTER-002: Prevent open redirects and unsafe “return_to/next” handling

Severity: Low

Required:

- MUST validate redirect destinations derived from untrusted input (`next`, `return_to`, `redirect`) before passing them to `router.push`, `navigateTo`, or `window.location` (validation rules: JS-URL-001).
- SHOULD allow only same-site relative paths or an explicit allowlist of destinations.

Insecure patterns:

- `router.push(route.query.next)`
- `navigateTo(route.query.next)`
- `window.location = route.query.next`
- `window.location.href = route.query.redirect`
- `navigateTo(route.query.redirect)`

Detection hints:

- Search for `route.query.next`, `route.query.redirect`, `return_to`, `continue`, `callback`.
- Trace the value into router (`router.push`, `navigateTo`) or window navigation sinks.

Fix:

- Allow only relative paths starting with `/` (and reject `//host`, `javascript:`, etc.).
- Prefer redirecting to named routes you control.

Notes:

- Even Vue’s docs note that sanitized URLs still may not guarantee safe destinations. ([Vue.js][1])

---

### VUE-AUTH-001: Token storage must assume XSS is possible

Severity: Low

Required:

  - Follow JS-STORAGE-001 (no session/auth tokens in JS-accessible storage; prefer backend-set HttpOnly cookies, combined with CSRF protections per VUE-CSRF-001). ([Vue.js][1])
  - Vue-specific: persisted state stores count as JS-accessible storage. Do not persist auth/session material via Pinia persistence.

  Insecure patterns:

  - Auth/refresh tokens kept in a Pinia store persisted with `pinia-plugin-persistedstate` (or a `persist` option).

  Detection hints:

  - Search: `persist`, `pinia-plugin-persistedstate`, and identify whether persisted store values are auth/session material.

---

### VUE-CSRF-001: Coordinate with the backend for CSRF when using cookies

Severity: High (for cookie-authenticated state-changing requests)

Required:

- Follow JS-CSRF-001 (applies only to cookie-based auth). ([OWASP Cheat Sheet Series][9])
- Vue-specific: axios `withCredentials: true` is the equivalent of `credentials: 'include'`; when set, the axios instance/API wrapper must send the backend’s CSRF token/header. ([Vue.js][1])

Detection hints:

- Search: `withCredentials`, and inspect the axios instance/API wrapper for CSRF header handling.

Notes:

- Vue’s docs explicitly say CSRF is primarily backend-addressed but recommends coordinating on CSRF token submission. ([Vue.js][1])

---

### VUE-HTTP-001: Do not put secrets in URLs; avoid leaking sensitive data in navigation/logs

Severity: Medium

Required:

  - MUST NOT place tokens/secrets in query strings or fragments (they leak via logs, referrers, browser history).
  - SHOULD avoid logging sensitive values to console in production.

  Insecure patterns:

  - `/?token=...`, `/#access_token=...` used beyond short-lived OAuth handoff.
  - `console.log(userSession)` that includes tokens/PII.

  Detection hints:

  - Search for `token=` in router parsing, auth callback handlers, and analytics logs.
  - Search for `console.log(` around auth code.

Fix:

  - Use Authorization headers or HttpOnly cookies.
  - Scrub logs; gate debug logs behind dev-only checks.

---

### VUE-HEADERS-001: Require security headers at the deployment layer

Severity: Medium

Required:

- SHOULD deploy a CSP suitable for your Vue app (see JS-CSP-001 / JS-CSP-002).
- SHOULD deploy clickjacking defenses (CSP `frame-ancestors` and/or `X-Frame-Options`) unless intentional embedding is required.
- SHOULD deploy `X-Content-Type-Options: nosniff`, plus other headers as appropriate (Referrer-Policy, Permissions-Policy). ([OWASP Cheat Sheet Series][4])

Insecure patterns:

- No evidence of headers in server/CDN config for an app with UGC or rich HTML rendering.

Detection hints:

- Look for hosting config: nginx, Netlify/Vercel headers config, CloudFront/Cloudflare rules.
- If absent in repo, flag as “verify at edge”.

Fix:

- Set headers at the edge or in the server. Start with a conservative CSP and tighten.

---

### Trusted Types, third-party scripts, and SRI

Formerly VUE-CSP-001, VUE-THIRDPARTY-001, and VUE-SRI-001. These are framework-agnostic; apply JS-TT-001, JS-SUPPLY-001, and JS-SRI-001 from the general frontend reference (Trusted Types is especially worth considering for apps with significant `v-html` surface).

---

### VUE-SUPPLY-001: Dependency and patch hygiene is mandatory

Severity: Low

Required:

- SHOULD keep Vue and official companion libraries updated; Vue explicitly recommends using latest versions to remain as secure as possible. ([Vue.js][1])
- MUST respond to security advisories promptly.
- SHOULD pin dependencies and keep lockfiles committed (to reduce drift in production artifacts).

Insecure patterns:

- Outdated major versions with known CVEs.
- No lockfile in repo; wide semver ranges for critical deps.
- Ignoring advisories for template/rendering/compiler packages.

Detection hints:

- Inspect `package.json`, lockfiles, CI install commands.
- Search for `npm audit` disabled, “ignore vulnerabilities” scripts.

Fix:

- Upgrade dependencies and add regression tests around the impacted behavior.
- Add dependency scanning in CI.

---

### VUE-SSR-001: SSR adds additional trust boundaries; treat state injection as XSS-sensitive

Severity: Medium

Required:

  - When using SSR, MUST treat anything injected into the HTML document (initial state, serialized data, inline scripts) as XSS-sensitive.
  - MUST keep the “trusted templates only” rule even stricter, because unsafe templates can lead to server-side execution during rendering. ([Vue.js][1])
  - SHOULD follow Vue SSR documentation and best practices for SSR security. ([Vue.js][1])

  Insecure patterns:

  - Concatenating untrusted strings into SSR templates.
  - Injecting JSON into `<script>` blocks without robust escaping/serialization controls.

  Detection hints:

  - Search server code for `__INITIAL_STATE__`, `window.__*STATE__`, template concatenation, and SSR render pipelines.
  - Trace untrusted data into those sinks.

Fix:

  - Use safe serialization patterns recommended by your SSR stack.
  - Avoid rendering untrusted HTML; sanitize or isolate.

---

## 5) Practical scanning heuristics (how to “hunt”)

When actively scanning, use these high-signal patterns:

- Dev/preview servers in production:
  - `npm run dev`, `vite`, `vite preview`, `vue-cli-service serve` ([vitejs][5])

- Secrets exposure:
  - `.env`, `.env.production`, `.env.*.local`, `VITE_`, `import.meta.env`, hard-coded `API_KEY` / `SECRET` ([vitejs][2])

- XSS sinks:
  - `v-html`, `innerHTML`, `insertAdjacentHTML`, `DOMParser`, `document.write` ([Vue.js][1])

- Client-side template injection:
  - `template:` concatenation, `compile(`, runtime compiler usage, mounting on non-sterile DOM ([Vue.js][1])

- URL injection / open redirects:
  - `:href="..."` / `:src="..."` from user data
  - `javascript:` occurrences
  - `route.query.next` / `redirect` / `return_to` flowing into `router.push` or `window.location` ([Vue.js][1])

- Style injection:
  - `:style="userProvidedStyles"` or user-driven theme CSS ([Vue.js][1])

- Token storage:
  - `localStorage.setItem('token'...)`, persisted auth stores, refresh tokens in JS-accessible storage

- CSRF integration red flags:
  - `credentials: 'include'` / `withCredentials: true` without any CSRF header/token handling ([Vue.js][1])

- Third-party scripts:
  - dynamic script injection (`createElement('script')`), CDN scripts without SRI ([MDN Web Docs][11])

- External links security:
  - `target="_blank"` without `rel="noopener"`/`noreferrer` (still recommended for legacy and explicitness) ([MDN Web Docs][12])

---

## 6) Sources (accessed 2026-01-27)

  Primary Vue documentation:

  - Vue Docs: Security — `https://vuejs.org/guide/best-practices/security` ([Vue.js][1])
  - Vue Docs: Template Syntax (security warning about in-DOM templates) — `https://vuejs.org/guide/essentials/template-syntax` ([Vue.js][13])
  - Vue Docs: Production Deployment — `https://vuejs.org/guide/best-practices/production-deployment` ([Vue.js][3])
  - Vue Docs: Feature Flags — `https://link.vuejs.org/feature-flags` ([Vue.js][7])

  Vite documentation (common Vue tooling):

  - Vite Docs: Env Variables and Modes (VITE\_\* exposure + security notes) — `https://vite.dev/guide/env-and-mode` ([vitejs][2])
  - Vite Docs: CLI (`vite preview` not designed for production) — `https://vite.dev/guide/cli` ([vitejs][5])
  - Vite Docs: Server Options (`server.host` can listen on public addresses) — `https://vite.dev/config/server-options` ([vitejs][14])

  OWASP and web platform hardening references:

  - OWASP Cheat Sheet Series: XSS Prevention — `https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html` ([Vue.js][1])
  - OWASP Cheat Sheet Series: CSRF Prevention — `https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html` ([OWASP Cheat Sheet Series][9])
  - OWASP Cheat Sheet Series: Authorization — `https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html` ([OWASP Cheat Sheet Series][8])
  - OWASP Cheat Sheet Series: HTTP Headers — `https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html` ([OWASP Cheat Sheet Series][4])
  - HTML5 Security Cheat Sheet (referenced by Vue) — `https://html5sec.org/` ([Vue.js][1])

  Browser/platform references:

  - MDN: `rel="noopener"` — `https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener` ([MDN Web Docs][12])
  - MDN: Subresource Integrity — `https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity` ([MDN Web Docs][11])
  - web.dev: Trusted Types — `https://web.dev/trusted-types/` ([web.dev][10])

  [1]: https://vuejs.org/guide/best-practices/security "https://vuejs.org/guide/best-practices/security"
  [2]: https://vite.dev/guide/env-and-mode "https://vite.dev/guide/env-and-mode"
  [3]: https://vuejs.org/guide/best-practices/production-deployment "https://vuejs.org/guide/best-practices/production-deployment"
  [4]: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html"
  [5]: https://vite.dev/guide/cli "https://vite.dev/guide/cli"
  [6]: https://vite.dev/guide/build "https://vite.dev/guide/build"
  [7]: https://vuejs.org/guide/best-practices/production-deployment?utm_source=chatgpt.com "Production Deployment"
  [8]: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html"
  [9]: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html"
  [10]: https://web.dev/articles/trusted-types "https://web.dev/articles/trusted-types"
  [11]: https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Subresource_Integrity?utm_source=chatgpt.com "Subresource Integrity - Security - MDN Web Docs"
  [12]: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener "https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/noopener"
  [13]: https://vuejs.org/guide/essentials/template-syntax "Template Syntax | Vue.js"
  [14]: https://vite.dev/config/server-options "https://vite.dev/config/server-options"
