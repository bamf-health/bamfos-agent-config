# Rails Security Review

**Core principle:** Prioritize exploitable issues over style. Assume any untrusted input can be abused.

## HARD-GATE: Authorization Findings Lead the Report

```
BEFORE returning your security review, verify:
  1. The FIRST finding section in your output is "Authentication & Authorization"
  2. SQL injection, XSS, or other findings come AFTER auth/authz — even if they feel more severe or were discovered first BEFORE any other finding category
```

## Quick Reference

| Area      | Key Checks                                     |
| --------- | ---------------------------------------------- |
| Auth      | Permissions on every sensitive action          |
| Params    | No `permit!`, whitelist only safe attributes   |
| Queries   | Parameterized — no string interpolation in SQL |
| Redirects | Constrained to relative paths or allowlist     |
| Output    | No `html_safe`/`raw` on user content           |
| Secrets   | Encrypted credentials, never in code or logs   |
| Files     | Validate filename, content type, destination   |


## Review Order

1. Check authentication and authorization boundaries.
2. Check parameter handling and sensitive attribute assignment.
3. Check redirects, rendering, and output encoding.
4. Check file handling, network calls, and background job inputs.
5. Check secrets, logging, and operational exposure.
6. **Verify each finding:** Confirm it is exploitable with a concrete attack scenario before reporting. Exclude false positives (e.g., `html_safe` on a developer-defined constant, not user input).

## Severity Levels

### High

- Missing or bypassable authorization checks
- SQL, shell, YAML, or constantization injection paths
- Unsafe redirects or SSRF-capable outbound requests
- File upload handling that trusts filename, content type, or destination blindly
- Secrets or tokens stored in code, logs, or unsafe config

### Medium

- Unscoped mass assignment through weak parameter filtering
- User-controlled HTML rendered without clear sanitization
- Sensitive data logged in plaintext
- Security-relevant behavior hidden in callbacks or background jobs without guardrails
- Brittle custom auth logic where framework primitives would be safer

## Review Checklist

- Are permissions enforced on every sensitive action?
- Are untrusted inputs validated before database, filesystem, or network use?
- Are redirects and URLs constrained?
- Are secrets stored and logged safely?
- Are security assumptions explicit and testable?

## Examples

**High-severity (unscoped redirect):**

```ruby
# Bad: user-controlled redirect — open redirect / phishing risk
redirect_to params[:return_to]

# Good: relative path only
redirect_to root_path
# Good: allowlist
SAFE_PATHS = %w[/dashboard /settings].freeze
redirect_to(SAFE_PATHS.include?(params[:return_to]) ? params[:return_to] : root_path)
```

**High-severity (no authorization check):**

```ruby
# DANGEROUS:
def show
  @document = Document.find(params[:id])
end

# Good: scope to current user
def show
  @document = current_user.documents.find(params[:id])
end

# Good: use authorization
def show
  @document = Document.find(params[:id])
  authorize @document
end
```

**High-severity (String interpolation in queries):**

```ruby
# DANGEROUS:
where("name = '#{params[:name]}'")
where("name LIKE '%#{term}%'")
find_by_sql("SELECT * FROM users WHERE id = #{id}")
order("#{params[:sort]} #{params[:direction]}")

# Good: parameterized queries
where("name = ?", params[:name])
where("name LIKE ?", "%#{term}%")
where(name: params[:name])
order(Arel.sql(safe_order_string))
```

**Medium-severity (mass assignment):**

```ruby
# Bad: privilege escalation risk
params.require(:user).permit!

# Good: explicit whitelist — never include role, admin, or privilege fields
params.require(:user).permit(:name, :email)
```

## Output Style

Section order per the HARD-GATE. Every heading appears even when empty (write "No issues found.").

```
## Authentication & Authorization
## Parameter Handling & Mass Assignment
## Query Safety (SQL / NoSQL / shell injection)
## Output Encoding & Redirects
## Secrets, Logging & Operational Exposure
```

Each finding carries:

- **Severity:** **High** or **Medium** (not "Critical")
- **Attack path:** input → reach → impact
- **Affected file:** path + line, e.g. `app/controllers/documents_controller.rb:42`
- **Mitigation:** smallest credible fix
