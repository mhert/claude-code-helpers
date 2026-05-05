# Correctness — TypeScript / React checks

Stack-specific extensions to the **Correctness** dimension. Apply alongside `universal.md` for diffs that touch
TypeScript / React files (`.tsx`, `.jsx`, plain `.ts`/`.js` outside Angular conventions).

- [ ] No `any` — `unknown` with type guards, or properly parameterised generics
- [ ] No type assertions (`as Type`) without a runtime check that justifies the assertion
- [ ] Discriminated unions used for variant types so the type checker covers all branches
- [ ] `useEffect` dependency arrays are complete; no stale closures over props or state
- [ ] No state updates in render path; effects guard against concurrent invocations
- [ ] List keys are stable and unique (not array index unless the list is static)
- [ ] Async handlers in event listeners catch their own errors — unhandled promise rejections kill the handler, not
      the page
