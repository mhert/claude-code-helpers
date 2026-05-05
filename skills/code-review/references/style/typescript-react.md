# Style / Maintainability — TypeScript / React checks

Stack-specific extensions to the **Style/Maintainability** dimension. Apply alongside `universal.md` for diffs that
touch TypeScript / React files (`.tsx`, `.jsx`, plain `.ts`/`.js` outside Angular conventions).

- [ ] `strict: true` enforced (or equivalent strictness flags); no per-file relaxation without justification
- [ ] No `any` — use `unknown` with a type guard, or proper generics
- [ ] No type assertions (`as Type`) without an accompanying runtime check
- [ ] `readonly` / `as const` used to express immutability at the type level
- [ ] Return types declared on exported functions
- [ ] ESLint rules satisfied; no `eslint-disable` without a justification comment
- [ ] No `console.log` left in production code; logging goes through the project's logger
- [ ] No `// @ts-ignore` or `// @ts-expect-error` without an explanation
- [ ] Keys in lists are stable, semantic identifiers; not array index unless the list is static
- [ ] Event handler props named `onX`, callback props named `onX`; consistent with platform conventions
