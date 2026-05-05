# Style / Maintainability — Shell checks

Stack-specific extensions to the **Style/Maintainability** dimension. Apply alongside `universal.md` for diffs that
touch shell scripts.

- [ ] ShellCheck passes with zero warnings (or warnings have inline justifications)
- [ ] `local` keyword used for function-scoped variables
- [ ] `readonly` used for constants
- [ ] `command -v` used to check command existence (not `which`)
- [ ] Arrays used for multi-word values; never space-separated strings parsed by word splitting
- [ ] `printf` preferred over `echo` for portable output
- [ ] Functions defined before use; helper functions named with a project-consistent prefix when they share a
      namespace
