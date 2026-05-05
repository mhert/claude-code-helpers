# Testing — TypeScript / Angular checks

Stack-specific extensions to the **Testing** dimension. Apply alongside `universal.md` for diffs that touch Angular
files.

- [ ] Test isolation verified — `TestBed` configured per test (or framework auto-reset confirmed); no provider
      state leaks across tests
- [ ] Component tests use `TestBed` with the minimum providers and imports needed — avoid pulling whole feature
      modules into a unit test
- [ ] DOM assertions go through `ComponentFixture` + `DebugElement` queries (`By.css`, `By.directive`), not raw
      `nativeElement` selectors that couple tests to markup details
- [ ] HTTP calls stubbed via `provideHttpClientTesting()` / `HttpTestingController`; no real network in unit tests
- [ ] Async behaviour driven by `fakeAsync` + `tick`, or `waitForAsync`, or marble tests for streams — no arbitrary
      `setTimeout`
- [ ] Service tests verify behaviour through the public API, not by reaching into private RxJS subjects
- [ ] Standalone components tested by importing the component directly into the `TestBed` `imports` — no wrapper
      `NgModule` just to make the test compile
- [ ] Pipes and directives tested in isolation where behaviour is well-defined; integration-tested only where their
      effect on the host component matters
