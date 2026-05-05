# Style / Maintainability — TypeScript / Angular checks

Stack-specific extensions to the **Style/Maintainability** dimension. Apply alongside `universal.md` for diffs that
touch Angular files.

- [ ] `strict: true` enforced (or equivalent strictness flags); no per-file relaxation without justification
- [ ] No `any` — use `unknown` with a type guard, or proper generics
- [ ] No type assertions (`as Type`) without an accompanying runtime check
- [ ] `readonly` / `as const` used to express immutability at the type level
- [ ] Return types declared on exported functions and on service methods
- [ ] ESLint rules satisfied; no `eslint-disable` without a justification comment
- [ ] No `console.log` left in production code; logging goes through the project's logger
- [ ] No `// @ts-ignore` or `// @ts-expect-error` without an explanation
- [ ] Standalone components / directives / pipes preferred for new code over NgModule scaffolding
- [ ] Signals used for reactive state where they fit; clear separation between signal-based and observable-based
      flows
- [ ] File and class naming follow Angular conventions: `*.component.ts`, `*.service.ts`, `*.module.ts`,
      `*.directive.ts`, `*.pipe.ts`, `*.guard.ts`, `*.resolver.ts`
- [ ] Constructor reserved for dependency injection — no business logic; defer initialisation to `ngOnInit`
