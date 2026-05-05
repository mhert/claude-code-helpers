# Correctness — PHP / Symfony checks

Stack-specific extensions to the **Correctness** dimension. Apply alongside `universal.md` for diffs that touch PHP
files.

- [ ] `declare(strict_types=1);` in every PHP file
- [ ] Method parameters and return types declared (including `void`)
- [ ] Nullable types declared with `?Type` syntax, not by accepting `null` in `mixed`
- [ ] Doctrine cascades and lazy loading produce the data the caller expects (no surprise extra queries, no missing
      relations)
- [ ] Form types reject malformed input before it reaches handlers
- [ ] Command handlers return `void` (or a void-shaped result); query handlers return data
- [ ] Value Objects validate invariants in their constructors
