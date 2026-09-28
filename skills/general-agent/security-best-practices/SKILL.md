---
name: "security-best-practices"
description: Perform language and framework specific security best-practice reviews and suggest improvements. Trigger only when the user explicitly requests security best practices guidance, a security review/report/audit, or secure-by-default coding help. Trigger only for supported languages (JavaScript, Ruby). Do not trigger for general code review, debugging, or non-security tasks.
metadata:
  sources:
    - https://github.com/github/awesome-copilot
    - https://github.com/ChitoLabs/ai-skill-pack/
---

# Security Best Practices

## Overview

This skill provides a description of how to identify the language and frameworks used by the current context, and then to load information from this skill's references directory about the security best practices for this language and or frameworks.

This information, if present, can be used to write new secure by default code, or to passively detect major issues within existing code, or (if requested by the user) provide a vulnerability report and suggest fixes.

The JavaScript reference files are written as **normative requirements** ("MUST/SHOULD/MAY") plus **audit rules** (insecure patterns, detection hints, and fixes/mitigations), each with a stable rule ID.

## Workflow

The initial step for this skill is to identify ALL languages and ALL frameworks which you are being asked to use or already exist in the scope of the project you are working in. Focus on the primary core frameworks. If the language/framework is unclear, inspect the repo to determine it and list your evidence.

Then check this skill's references directory to see if there are any relevant documentation for the language and or frameworks. Make sure you read ALL reference files which relate to the specific framework or language, and load only the relevant files. The format of the filenames is `<language>-<framework>-<stack>-security.md`. You should also check if there is a `<language>-general-<stack>-security.md` which is agnostic to the framework you may be using.

If the web application includes (or will include) both a frontend and a backend, load the reference documents for BOTH — it is important that you understand how to secure both. For any JavaScript frontend, load `references/javascript-general-web-frontend-security.md`, plus the framework-specific frontend file if one exists (or on its own if the frontend framework is not specified).

If no relevant information is available in the skill's references directory, think a little bit about what you know about the language, the framework, and all well known security best practices for it. If you are unsure you can try to search online for documentation on security best practices. If asked to generate a report in this case, let the user know that concrete guidance is not available (you can still generate the report or flag definite critical vulnerabilities).

From there it can operate in a few ways.

1. The primary mode is to just use the information to write secure by default code from this point forward. This is useful for starting a new project or when writing new code. Follow every **MUST** requirement in the loaded references, and every **SHOULD** unless the user explicitly says otherwise. Prefer safe-by-default APIs and proven libraries over custom security code, and avoid introducing the risky sinks each reference lists.

2. The secondary mode is to passively detect vulnerabilities while working in the project and writing code for the user. Notice violations in touched/nearby code. Critical or very important vulnerabilities or major issues going against security guidance can be flagged and the user can be told about them, with a brief explanation and a safe fix. This passive mode should focus on the largest impact vulnerabilities and secure defaults.

3. The user can ask for a security report or to improve the security of the codebase ("scan", "audit", "hunt for vulnerabilities"). In this case systematically search the codebase for violations, following each reference's recommended audit order, and produce a full report describing all the ways the project fails to follow security best practices guidance. The report should be prioritized and have clear sections of severity and urgency. Then offer to start working on fixes for these issues. See #fixes below.

## Safety constraints (MUST FOLLOW)

These apply in every mode and to every reference file (which add framework-specific examples):

- MUST NOT request, output, log, hard-code, or commit secrets (API keys intended to be secret, passwords, private keys, session secrets, session tokens, OAuth/refresh tokens, CSRF tokens, cookies).
- MUST NOT "fix" security by disabling protections (weakening CSP, cookie flags, CSRF defenses, sanitization, origin checks, etc.).
- MUST provide **evidence-based findings** during audits: cite file paths, code snippets, and the relevant configuration values that justify the claim.
- MUST treat uncertainty honestly: if a protection might exist outside the repo (CDN, reverse proxy, gateway, WAF, server/edge headers), report it as "not visible in repo; verify at runtime/config."

When evaluating a potential finding, always try to confirm:

- data origin (untrusted vs trusted),
- sink type (e.g., HTML/DOM insertion, template compilation/rendering, script/code execution, URL navigation/redirect, attribute/selector/style injection, object merging, message handling, storage, SQL/NoSQL, subprocess, filesystem, outbound HTTP),
- protective controls present (sanitizers, allowlists, schema validation, CSP/Trusted Types, CSRF validation, middleware, proxy config, header policies, backend validation),
- whether protections are at the edge vs in app code.

# Overrides

While these references contain the security best practices for languages and frameworks, customers may have cases where they need to bypass or override these practices. Pay attention to specific rules and instructions in the project's documentation and prompt files which may require you to override certain best practices. When overriding a best practice, you MAY report it to the user, but do not fight with them. If a security best practice needs to be bypassed / ignored for some project specific reason, you can also suggest to add documentation about this to the project so it is clear why the best practice is not being followed and to follow that bypass in the future.

# Report Format

When producing a report, you should write the report as a markdown file in `security_best_practices_report.md` or some other location if provided by the user. You can ask the user where they would like the report to be written to.

The report should have a short executive summary at the top.

The report should be clearly delineated into multiple sections based on severity of the vulnerability. The report should focus on the most critical findings as these have the highest impact for the user.

Each finding should include:

- ID: a numeric ID to make it easier to reference, plus the reference Rule ID when one applies
- Severity: Critical / High / Medium / Low
- Location: file path + function/component/route/middleware + line(s). When referencing code, make sure to find and include line numbers.
- Evidence: the exact code/config snippet
- Impact: what could go wrong, who can exploit it (for critical findings, a one sentence impact statement)
- Fix: safe change (prefer minimal diff)
- Mitigation: defense-in-depth if immediate fix is hard
- False positive notes: what to verify if uncertain

A reference file may override the section order or severity scale for its stack (e.g., `references/rails-security.md` requires auth findings first and uses only High/Medium); follow it for findings in that stack.

Once the report file is written, tell the user where it was written and summarize the findings to them directly (you may be less verbose than the report). You can offer to explain any of the findings or the reasons behind the security best practices guidance if the user wants more info on any findings.

# Fixes

If you produced a report, let the user read the report and ask to begin performing fixes.

If you passively found a critical finding, notify the user and ask if they would like you to fix this finding.

When producing fixes, focus on fixing a single finding at a time. The fixes should have concise clear comments explaining that the new code is based on the specific security best practice, and perhaps a very short reason why it would be dangerous to not do it in this way.

Always consider if the changes you want to make will impact the functionality of the user's code. Consider if the changes may cause regressions with how the project works currently. It is often the case that insecure code is relied on for other reasons (and this is why insecure code lives on for so long). Avoid breaking the user's project as this may make them not want to apply security fixes in the future. It is better to write a well thought out, well informed by the rest of the project, fix, then a quick slapdash change.

Always follow any normal change or commit flow the user has configured. If making git commits, provide clear commit messages explaining this is to align with security best practices. Try to avoid bunching a number of unrelated findings into a single commit.

Always follow any normal testing flows the user has configured (if any) to confirm that your changes are not introducing regressions. Consider the second order impacts the changes may have and inform the user before making them if there are any.

# General Security Advice

Below are a few bits of secure coding advice that applies to almost any language or framework.

### Avoid Using Incrementing IDs for Public IDs of Resources

When assigning an ID for some resource, which will then be used by exposed to the internet, avoid using small auto-incrementing IDs. Use longer, random UUID4 or random hex string instead. This will prevent users from learning the quantity of a resource and being able to guess resource IDs.

### A note on TLS

While TLS is important for production deployments, most development work will be with TLS disabled or provided by some out-of-scope TLS proxy. Due to this, be very careful about not reporting lack of TLS as a security issue (internal apps likely won't have TLS). Also be very careful around use of "secure" cookies. They should only be set if the application will actually be over TLS. If they are set on non-TLS applications (such as when deployed for local dev or testing), it will break the application. You can provide a env or other flag to override setting secure as a way to keep it off until on a TLS production deployment. Additionally avoid recommending HSTS. It is dangerous to use without full understanding of the lasting impacts (can cause major outages and user lockout) and it is not generally recommended for the scope of projects being reviewed by codex.
