# Correctness — Shell checks

Stack-specific extensions to the **Correctness** dimension. Apply alongside `universal.md` for diffs that touch
shell scripts.

- [ ] `set -euo pipefail` at the top of every script
- [ ] Variables quoted everywhere they are expanded: `"$var"` (not `$var`)
- [ ] `[[ ]]` for conditionals, not `[ ]`
- [ ] Exit codes are meaningful and documented; non-zero exits propagate when the caller cares
- [ ] `trap` cleans up temp files and child processes on exit and on signal
- [ ] Functions defined before use; recursion-free unless intentional
