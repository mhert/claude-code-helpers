# Performance — PHP / Symfony checks

Stack-specific extensions to the **Performance** dimension. Apply alongside `universal.md` for diffs that touch PHP
files.

- [ ] Doctrine: lazy loading configured to match the access pattern — no surprise eager loads, no surprise lazy fetch
      inside a loop
- [ ] Doctrine: `setMaxResults()` / `setFirstResult()` for pagination; cursor-based pagination on large tables
- [ ] Repository methods that return collections justify the size — no unbounded `findAll()` on tables that grow
- [ ] DQL prefers query builder for complex queries; partial objects and array hydration used where full entities are
      not needed
- [ ] HTTP cache (`Cache-Control`, ETag) configured on cacheable responses
- [ ] Symfony cache pools used for expensive computed values; pool keys include all inputs
- [ ] FormType `EntityType` choice lists do not trigger N+1 — `query_builder` with explicit joins, or pre-fetched
      arrays for large option sets
