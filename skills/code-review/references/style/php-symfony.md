# Style / Maintainability — PHP / Symfony checks

Stack-specific extensions to the **Style/Maintainability** dimension. Apply alongside `universal.md` for diffs that
touch PHP files.

- [ ] PHPStan satisfies the project's level (no baseline additions without justification in the diff)
- [ ] PHP-CS-Fixer rules satisfied
- [ ] Rector refactoring rules applied where the project uses them
- [ ] No suppression annotations (`@phpstan-ignore`, `@codeCoverageIgnore`, `@SuppressWarnings`) without an inline
      comment that explains the reason
- [ ] No `mixed` unless absolutely necessary — union types preferred
- [ ] `readonly` and `final` used where the design intent is "do not change / do not extend"
