# Correctness — TypeScript / Angular checks

Stack-specific extensions to the **Correctness** dimension. Apply alongside `universal.md` for diffs that touch
Angular files (`*.component.ts`, `*.module.ts`, `*.service.ts`, `*.directive.ts`, `*.pipe.ts`, `*.guard.ts`,
`*.resolver.ts`, or any TypeScript file in an Angular project).

- [ ] No `any` — `unknown` with type guards, or properly parameterised generics
- [ ] No type assertions (`as Type`) without a runtime check that justifies the assertion
- [ ] Discriminated unions used for variant types so the type checker covers all branches
- [ ] RxJS subscriptions are cleaned up — prefer the `async` pipe in templates, `takeUntilDestroyed`, or an explicit
      `unsubscribe()` in `ngOnDestroy`. Long-lived components must not leak subscriptions.
- [ ] `@Input()` and `@Output()` types are explicit; no `any` in component contracts
- [ ] Lifecycle hooks (`ngOnInit`, `ngOnChanges`, `ngOnDestroy`) used for the right phase — no constructor work that
      depends on bindings
- [ ] `trackBy` provided on `*ngFor` over collections that change to keep DOM identity stable
- [ ] Signals and observables not silently mixed in the same data flow without explicit conversion
      (`toSignal` / `toObservable`)
- [ ] Async event handlers catch their own errors — uncaught promise rejections in template-bound handlers swallow
      stack traces
