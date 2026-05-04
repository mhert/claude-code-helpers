# claude-code-helpers
Stuff I use in my claude-code-setup

## Skills

| Skill | Description |
|-------|-------------|
| [git-commit](skills/git-commit/SKILL.md) | Writes high-quality, narrowly-scoped commit messages following Conventional Commits. Partitions pending changes into one logical change per commit (Linux-kernel style), staging hunks individually via `git add -p`. |
| [open-pr](skills/open-pr/SKILL.md) | Pushes a feature branch and opens a GitHub pull request with a body filled from the repo's PR template (or a shipped fallback per type: bugfix / feature / misc). Confirms a ticket key, never force-pushes, never targets the default branch. |

## Dependencies

Some skills shell out to external tools. Install these once:

| Skill | Tool | Purpose | Install |
|-------|------|---------|---------|
| `open-pr`, `mark-ticket-as-done` | [`gh`](https://cli.github.com/) | GitHub CLI — PR creation, issue and project updates | platform-specific (`pacman -S github-cli`) |
