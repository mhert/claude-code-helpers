# Security — TypeScript / Angular checks

Stack-specific extensions to the **Security** dimension. Apply alongside `universal.md` for diffs that touch Angular
files. Items are grouped by the OWASP category they extend.

## A01: Broken access control

- [ ] Route guards (`CanActivate`, `CanMatch`, `CanActivateChild`) enforce auth before the route resolves
- [ ] Client-side route guards are backed by server-side enforcement (never trust the client)
- [ ] HTTP interceptors that attach auth tokens do not leak them to third-party origins

## A03: Injection

- [ ] No `[innerHTML]` / `[srcdoc]` bindings on user-controlled strings without `DomSanitizer.sanitize()`
- [ ] `bypassSecurityTrust*` methods used only on hardcoded, audited values — never on user-controlled strings
- [ ] `Renderer2` preferred over direct DOM manipulation when dynamic content is involved
