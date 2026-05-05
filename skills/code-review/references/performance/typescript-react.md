# Performance — TypeScript / React checks

Stack-specific extensions to the **Performance** dimension. Apply alongside `universal.md` for diffs that touch
TypeScript / React files (`.tsx`, `.jsx`, plain `.ts`/`.js` outside Angular conventions).

- [ ] `useMemo` / `useCallback` used only where measurement shows benefit — premature memoisation costs more than it
      saves
- [ ] Heavy children memoised with `React.memo` only after profiling shows them re-rendering unnecessarily
- [ ] State colocated with the component that owns it — global stores reserved for genuinely shared state
- [ ] Lists virtualised when they may exceed a few hundred rows
- [ ] Bundle size watched — new dependencies justified; tree-shaking confirmed for large libraries
- [ ] Network: requests deduplicated, parallelised where independent, batched where the API supports it
- [ ] Images served at the size they will be rendered at; modern formats (`webp`, `avif`) used where supported
- [ ] SSR-aware: no random IDs, locale-dependent formatting, or `Date.now()` in render output that would force the
      client to discard the SSR tree on hydration
