# Security — Shell checks

Stack-specific extensions to the **Security** dimension. Apply alongside `universal.md` for diffs that touch shell
scripts. Items are grouped by the OWASP category they extend.

## A03: Injection

- [ ] Every variable in a command argument is quoted
- [ ] No `eval` with external input
