# Style / Maintainability — CI checks

Stack-specific extensions to the **Style/Maintainability** dimension. Apply alongside `universal.md` for diffs that
touch `.github/workflows/` files.

- [ ] Workflow YAML uses a consistent style (key order, quoting, list form vs. inline form)
- [ ] Step `name:` fields describe what the step does in human-readable terms, not just the command
- [ ] No hardcoded paths to runner-specific filesystem layout when a built-in variable exists (`${{ runner.temp }}`,
      `$RUNNER_TEMP`)
