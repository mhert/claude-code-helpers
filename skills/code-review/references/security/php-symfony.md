# Security — PHP / Symfony checks

Stack-specific extensions to the **Security** dimension. Apply alongside `universal.md` for diffs that touch PHP
files. Items are grouped by the OWASP category they extend.

## A01: Broken access control

- [ ] Symfony Voters or `#[IsGranted]` attributes used for authorisation
- [ ] No ad-hoc `$user->getId() === $entity->getOwnerId()` checks scattered through controllers — centralise the
      policy

## A03: Injection

- [ ] Doctrine DQL uses `setParameter()`; never string interpolation
- [ ] `exec()`, `shell_exec()`, `system()`, `passthru()` not used with user input

## A04: Insecure design

- [ ] CSRF tokens validated on state-changing requests; Symfony Form's built-in protection or
      `CsrfTokenManagerInterface` used on every non-API POST/PUT/DELETE

## A08: Software and data integrity failures

- [ ] No `unserialize()` with user-controlled input
- [ ] Composer `--no-scripts` considered for untrusted packages
