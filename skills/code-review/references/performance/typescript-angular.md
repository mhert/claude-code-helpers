# Performance — TypeScript / Angular checks

Stack-specific extensions to the **Performance** dimension. Apply alongside `universal.md` for diffs that touch
Angular files.

- [ ] `OnPush` change detection on components whose inputs are immutable
- [ ] Heavy logic kept out of template expressions — bindings re-evaluate on every change-detection cycle
- [ ] `trackBy` provided on `*ngFor` to keep DOM identity stable across collection updates
- [ ] Pure pipes preferred over impure pipes; impure pipes justified by a real need to recompute on every cycle
- [ ] Lazy-loaded routes used for feature modules off the critical path; preloading strategy chosen deliberately
- [ ] Lists virtualised (CDK Virtual Scroll or equivalent) when they may exceed a few hundred rows
- [ ] Bundle size watched — new dependencies justified; tree-shaking confirmed for large libraries
- [ ] Network: requests deduplicated, parallelised where independent, batched where the API supports it
- [ ] Images served at the size they will be rendered at; modern formats (`webp`, `avif`) used where supported
