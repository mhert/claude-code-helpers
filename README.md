# claude-code-helpers
Stuff I use in my claude-code-setup

## Skills

| Skill | Description |
|-------|-------------|
| [git-commit](skills/git-commit/SKILL.md) | Writes high-quality, narrowly-scoped commit messages following Conventional Commits. Partitions pending changes into one logical change per commit (Linux-kernel style), staging hunks individually via `git add -p`. |
| [open-pr](skills/open-pr/SKILL.md) | Pushes a feature branch and opens a GitHub pull request with a body filled from the repo's PR template (or a shipped fallback per type: bugfix / feature / misc). Confirms a ticket key, never force-pushes, never targets the default branch. |
| [mark-ticket-as-done](skills/mark-ticket-as-done/SKILL.md) | Moves a tracker ticket to its developer-done status after every PR is open. Supports Jira (workflow transition) and GitHub Issues on Projects v2 (Status field update). Posts a stakeholder-facing markdown comment that links to every PR involved, adds one ticket / issue label per repository touched (additive, never overwriting), and resolves the target by name at runtime. |
| [code-review](skills/code-review/SKILL.md) | Runs a multi-perspective code review by fanning out six dimension-focused subagents (correctness, security, architecture, testing, performance, style) once over the branch's cumulative diff against its base, then attributing each finding back to the originating commit via `git blame`. Output is a single deduplicated, severity-classified report with verdict. Default scope is "current branch vs. its default branch"; can be overridden with a PR number/URL, a ref range (`base..head`), a single commit, or pending diffs (`--staged`, `--working`). |
| [typescript-react-mui](skills/typescript-react-mui/SKILL.md) | Creates or refactors TypeScript React 19 components in MUI 7 projects (Vite or Next.js App Router). Classifies the request into a mode (Patch / Leaf / Folder Component / Feature / Page / Setup) and applies only that mode's rules, never escalating a small change into a feature scaffold. Enforces a bounded-context layout with a four-layer split (`domain` / `application` / `infrastructure` / `ui`), Zod-first domain types with branded IDs, a three-layer component split (hook / component / styles), MUI 7 idioms (slots, `cssVariables`, theme augmentation), and no `null` in our code (`Option` from fp-ts, `Result` / `ResultAsync` from neverthrow). |

## Dependencies

### External CLI tools

Some skills shell out to external tools. Install these once:

| Skill | Tool | Purpose | Install |
|-------|------|---------|---------|
| `open-pr`, `mark-ticket-as-done`, `code-review` | [`gh`](https://cli.github.com/) | GitHub CLI — PR creation, issue and project updates, PR-scoped reviews | platform-specific (`pacman -S github-cli`) |
| `mark-ticket-as-done` | [`acli`](https://developer.atlassian.com/cloud/acli/) | Atlassian CLI — Jira ticket view / comment / edit / transition | platform-specific (`pikaur -S acli-bin`) |
| `mark-ticket-as-done` | [`marklassian`](https://github.com/jamsinclair/marklassian) | Markdown → ADF (Atlassian Document Format) converter — `acli` accepts only plain text or ADF, so the skill converts client-side | `npm i -g marklassian` (requires Node ≥ 18) |
| `mark-ticket-as-done` | [`jq`](https://jqlang.org/) | JSON parsing in verification steps | platform-specific (`pacman -S jq`) |

### Project dependencies (`typescript-react-mui`)

Unlike the CLI tools above, `typescript-react-mui` does not shell out to anything — its dependencies are npm packages
installed **per project** by its Setup mode (once per repo, when initializing). See
[`references/setup.md`](skills/typescript-react-mui/references/setup.md) for the rationale behind each.
