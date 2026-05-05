# Architecture — TypeScript / React checks

Stack-specific extensions to the **Architecture** dimension. Apply alongside `universal.md` for diffs that touch
TypeScript / React files (`.tsx`, `.jsx`, plain `.ts`/`.js` outside Angular conventions).

- [ ] Components follow single responsibility — presentation, data fetching, and orchestration live in different
      units
- [ ] Hooks encapsulate reusable behaviour; not every component owns its own data-fetching code
- [ ] Context providers and global stores scoped at the right level — no accidental cross-feature state leaking
- [ ] Public component props form a coherent contract; rest-spread (`...props`) is used sparingly and intentionally
- [ ] Dependency direction at the module level: feature modules depend on shared modules, never the reverse
- [ ] Data fetching is centralised in dedicated hooks or query/repository services (e.g. `useQuery`, `useFetch`);
      components do not call `fetch` / `axios` inline
