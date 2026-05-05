# Architecture — PHP / Symfony checks

Stack-specific extensions to the **Architecture** dimension. Apply alongside `universal.md` for diffs that touch PHP
files.

- [ ] Layered architecture respected: Application → Core → Module → Domain → Infrastructure
- [ ] Domain layer has zero dependencies on Infrastructure
- [ ] No direct database queries outside Repository classes
- [ ] CQRS: Command handlers do not return domain data; Query handlers are read-only with no side effects
- [ ] Value Objects used for domain concepts instead of primitive `string`/`int` everywhere
- [ ] Entities have private constructors with named static factory methods where invariants must be enforced
- [ ] Services autowired via constructor injection (no setter injection)
- [ ] Controllers stay thin — logic lives in services or handlers
- [ ] Service IDs follow a single, consistent convention (FQCN as ID is the modern Symfony default; named string
      IDs only where a runtime alias is required)
