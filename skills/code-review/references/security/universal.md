# Security — universal checks (OWASP Top 10 aligned)

Reference for the **Security** dimension subagent. Aligned with the OWASP Top 10 (2021). Apply items relevant to the
changes under review. Findings here usually map to **Critical** or **Warning** severity — treat user-input handling,
authentication, and authorisation flaws as Critical by default. The orchestrator will also pass stack-specific files
(`<stack>.md` in this directory) when the changed-file list matches a stack.

## A01: Broken access control

- [ ] Authorisation checks present on every endpoint / handler that modifies or reads protected data
- [ ] Role- or attribute-based access control enforced at the service layer, not just the controller
- [ ] Direct object references validated — a user can only access resources they own
- [ ] CORS configuration restricts allowed origins to known domains
- [ ] HTTP method restrictions enforced (no unintended `DELETE` or `PUT` on read-only endpoints)
- [ ] Elevation of privilege prevented — no path from a lower to a higher privilege level without an explicit grant
- [ ] API endpoints enforce the same access control as the equivalent UI action

## A02: Cryptographic failures

- [ ] Sensitive data encrypted at rest (passwords, tokens, PII, payment data)
- [ ] Passwords hashed with bcrypt, argon2, or scrypt — never MD5, SHA-1, or plain SHA-256
- [ ] TLS enforced for all external communication
- [ ] Secrets and API keys live in environment variables or a secrets manager — never in code or committed config
- [ ] Cryptographic random generators used for tokens and nonces (`random_bytes()`, `crypto.randomUUID()`,
      `rand::rngs::OsRng`)
- [ ] No sensitive data in URLs, logs, or error messages
- [ ] Encryption keys rotated on a schedule and not hardcoded

## A03: Injection

- [ ] SQL queries use parameterised statements or an ORM query builder — never string concatenation
- [ ] User input is never interpolated into shell commands
- [ ] Template engines auto-escape output by default (Twig, React JSX, Angular bindings)
- [ ] HTML rendering does not use `dangerouslySetInnerHTML` or `|raw` without explicit sanitisation
- [ ] LDAP, XPath, and NoSQL queries use parameterised equivalents
- [ ] HTTP headers built from user input are validated and sanitised
- [ ] Log messages never include unsanitised user input (log injection)

## A04: Insecure design

- [ ] Business logic validates all preconditions, not just input format
- [ ] Rate limiting on sensitive operations (login, password reset, API quotas)
- [ ] Abuse scenarios considered — what happens if a user repeats this action 1,000 times?
- [ ] Feature flags and A/B experiments cleaned up after rollout (stale flags become attack surface)
- [ ] Multi-tenancy isolation enforced at the data layer, not just the application layer

## A05: Security misconfiguration

- [ ] Debug mode disabled in production
- [ ] Default credentials changed or removed
- [ ] Error messages do not leak stack traces, SQL queries, or internal paths to end users
- [ ] Security headers set: `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`,
      `Strict-Transport-Security`, `Referrer-Policy`
- [ ] Unnecessary features, endpoints, or services disabled
- [ ] Directory listing disabled on web servers

## A06: Vulnerable and outdated components

- [ ] Dependencies up to date with no known CVEs in the current versions
- [ ] Lock files committed (`composer.lock`, `package-lock.json`, `Cargo.lock`, `pnpm-lock.yaml`)
- [ ] Dependency audit runs in CI (`composer audit`, `npm audit`, `cargo audit`, `pnpm audit`)
- [ ] No abandoned or unmaintained packages introduced
- [ ] Transitive dependencies reviewed for known vulnerabilities

## A07: Identification and authentication failures

- [ ] Authentication tokens have an appropriate expiration
- [ ] Session fixation prevented — session id regenerated after login
- [ ] Brute-force protection on login (rate limiting, account lockout)
- [ ] Multi-factor authentication supported for privileged operations
- [ ] Password strength requirements enforced
- [ ] Logout invalidates server-side session state
- [ ] JWT tokens validated completely: signature, expiration, issuer, audience

## A08: Software and data integrity failures

- [ ] CI/CD pipeline artifacts signed or checksummed
- [ ] Deserialisation of untrusted data uses safe mechanisms — no `unserialize()` on user input in PHP, no
      `pickle.loads()` on untrusted data in Python equivalents
- [ ] Package integrity verified via lock files and hash checks
- [ ] Auto-update mechanisms verify signatures before applying updates
- [ ] Git commits signed or protected by branch protection rules

## A09: Security logging and monitoring failures

- [ ] Authentication events logged (success and failure)
- [ ] Authorisation failures logged with sufficient context
- [ ] Log entries include timestamp, user identity, action, outcome
- [ ] Sensitive data excluded from logs (passwords, tokens, PII)
- [ ] Log injection prevented — user input sanitised before logging
- [ ] Alerting configured for suspicious patterns (repeated auth failures, privilege escalation attempts)

## A10: Server-side request forgery (SSRF)

- [ ] URLs from user input validated against an allowlist of permitted hosts
- [ ] Internal network addresses blocked: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`,
      `169.254.169.254` (cloud metadata)
- [ ] Redirect responses not followed blindly when fetching user-provided URLs
- [ ] DNS rebinding mitigated — resolve hostname before the request, verify the resolved IP
- [ ] Cloud metadata endpoints blocked at the outgoing-request validator
