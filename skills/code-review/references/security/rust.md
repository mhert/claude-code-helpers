# Security — Rust checks

Stack-specific extensions to the **Security** dimension. Apply alongside `universal.md` for diffs that touch Rust
files. Items are grouped by the OWASP category they extend.

## A02: Cryptographic failures

- [ ] Random tokens use `rand::rngs::OsRng` or the `getrandom` crate; never `thread_rng` for security-sensitive values

## A03: Injection

- [ ] `Command::new()` arguments passed via `.arg()`, never assembled with string interpolation
- [ ] SQL via `sqlx` uses `query!()` macros or bind parameters

## A04: Insecure design

- [ ] `unsafe` blocks limited to FFI or measured perf-critical sections; each block documents the invariant the
      caller must uphold
