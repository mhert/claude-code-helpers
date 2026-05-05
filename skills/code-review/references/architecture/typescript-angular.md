# Architecture — TypeScript / Angular checks

Stack-specific extensions to the **Architecture** dimension. Apply alongside `universal.md` for diffs that touch
Angular files.

- [ ] Components follow single responsibility — container components own data and orchestrate; presentational
      components take inputs and emit outputs and stay pure
- [ ] Services injectable at the right scope: `providedIn: 'root'` for app-wide singletons, feature-module providers
      for feature-scoped state, component providers for instance-scoped state
- [ ] Lazy-loaded routes used for feature areas off the critical path
- [ ] Public `@Input()` / `@Output()` form a coherent contract; avoid passing entire entities when a slice is enough
- [ ] Dependency direction at the module level: feature modules depend on shared modules, never the reverse
- [ ] Cross-feature communication goes through services or routed state — siblings do not reach into each other's
      internals
- [ ] HTTP interceptors and reusable form validators provided at the correct scope (root for app-wide, feature
      module for feature-scoped); avoids accidental sharing across feature contexts
