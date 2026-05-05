# Testing — PHP / Symfony checks

Stack-specific extensions to the **Testing** dimension. Apply alongside `universal.md` for diffs that touch PHP
files.

- [ ] PHPUnit tests in the matching `tests/` directory; namespace mirrors `src/`
- [ ] Use `MockObject` / Prophecy via constructor injection, not via reflection of private state
- [ ] Functional tests use Symfony's `WebTestCase` + Panther where DOM interaction matters
- [ ] Database tests use transactions or per-test rollback; no leakage between cases
- [ ] Data providers used for parameterised cases instead of copy-paste tests
- [ ] Functional tests reboot the kernel between cases where state could leak
      (`KernelTestCase::ensureKernelShutdown()`); shared kernel reuse is opt-in and documented
