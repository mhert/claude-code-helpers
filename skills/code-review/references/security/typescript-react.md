# Security — TypeScript / React checks

Stack-specific extensions to the **Security** dimension. Apply alongside `universal.md` for diffs that touch
TypeScript / React files (`.tsx`, `.jsx`, plain `.ts`/`.js` outside Angular conventions). Items are grouped by the
OWASP category they extend.

## A01: Broken access control

- [ ] Route guards or middleware enforce auth before the handler runs
- [ ] Client-side route guards are backed by server-side enforcement (never trust the client)
