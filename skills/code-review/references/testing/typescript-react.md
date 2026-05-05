# Testing — TypeScript / React checks

Stack-specific extensions to the **Testing** dimension. Apply alongside `universal.md` for diffs that touch
TypeScript / React files (`.tsx`, `.jsx`, plain `.ts`/`.js` outside Angular conventions).

- [ ] Component tests assert what the user sees (Testing Library queries: `getByRole`, `getByLabelText`), not
      implementation (selector by class)
- [ ] Async behaviour awaited with `findBy*` / `waitFor`; no arbitrary `setTimeout` in tests
- [ ] User events go through `userEvent` / `fireEvent`, not direct prop calls
- [ ] Hooks tested via a dedicated harness or by mounting a test component, not by calling them directly
- [ ] MSW (or equivalent) stubs network calls; no live HTTP in unit tests
- [ ] Snapshots small and meaningful — large auto-generated snapshots replaced with explicit assertions; updates
      only when intent changes (no reflexive `-u`)
