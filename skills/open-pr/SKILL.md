---
name: open-pr
description: Use when a fix or change has been committed locally to a feature branch and a pull request needs to be
  opened on GitHub. Triggers on "open PR", "create pull request", "push and open PR", "open fix PR".
version: 1.0.0
---

# open-pr

Open a GitHub pull request from the current branch after one or more commits have been made locally. Produces a PR
with a consistent body, linked to a confirmed ticket key.

## When to use

- A change has been committed locally to a feature branch.
- The branch has not yet been pushed, or has been pushed but has no PR.
- You intend to open **one** PR for this branch.

**Do not** use to create draft scaffolding before any code is written — this skill assumes there is a real diff to
describe.

## Core principles

- **Use the repo's PR template if one exists.** Check, in order: `.github/PULL_REQUEST_TEMPLATE.md`,
  `.github/pull_request_template.md`, `docs/pull_request_template.md`, `PULL_REQUEST_TEMPLATE.md`.
- **If no repo template exists, fall back to a type-specific template shipped with this skill:**
  - bugfix → `assets/pr-fix-description.template.md`
  - feature → `assets/pr-feat-description.template.md`
  - misc (refactor / chore / perf / docs / style / build / ci / test / revert) → `assets/pr-misc-description.template.md`
- **Fill every section.** If a section genuinely does not apply, write `None` rather than placeholder text.
- **A confirmed ticket key is required.** Never open a PR with an invented or unconfirmed key. If detection fails, ask
  the user.
- **PR title format.** `<branch-name> — <short description>`. Under 100 characters. The short description is a human
  summary derived from the commit subject (strip conventional-commit `type(scope):` prefix) or supplied by the user.
- **Technical voice.** The PR body is for reviewers reading the diff — reference classes, methods, files, and test
  commands.

## Workflow

### 1. Preconditions

Run in parallel:

```bash
git status --porcelain
git rev-parse --abbrev-ref HEAD
git log @{upstream}..HEAD --oneline 2>/dev/null || git log origin/HEAD..HEAD --oneline
gh repo view --json name,nameWithOwner,defaultBranchRef
```

Abort with a clear message to the user if any of these hold:

- Worktree has uncommitted/unstaged changes.
- Current branch is the repo's default branch (typically `main`, `master`, or `develop`).
- No commits ahead of the remote (nothing to push).

### 2. Identify the ticket (mandatory)

Try, in order:

1. Branch name: match `^[A-Z]+-\d+` (Jira / Linear) or `^#?\d+` (GitHub issues).
2. Latest commit subject: `git log -1 --format=%s`.
3. Commit body: `git log -1 --format=%b`.

Always **confirm the matched key with the user** before continuing — never act on an unconfirmed ticket.

If no key is found by automatic detection, **ask the user for one**. Do not proceed without a confirmed ticket key. Do
not invent a key.

### 3. Identify the PR type

Run `git log @{upstream}..HEAD --format=%s` (or `origin/HEAD..HEAD` if no upstream) and inspect each commit's
Conventional Commits prefix.

Map prefix → type:

- `fix` / `bugfix` / `hotfix` → **bugfix**
- `feat` / `feature` → **feature**
- everything else (`refactor`, `chore`, `perf`, `docs`, `style`, `build`, `ci`, `test`, `revert`) → **misc**

Resolution rules:

- All commits map to the same type → that type.
- Mixed types → pick by precedence: `feat` > `fix` > anything else. Mixed `feat`+`fix` is rare and usually means the
  branch should have been split; if the user confirms it's intentional, use the feature template.
- No conventional-commits prefixes → ask the user which type fits.

Confirm the detected type with the user before continuing. The type determines which fallback template is used in
step 5.

### 4. Draft the PR title

```
<branch-name> — <short description>
```

- `branch-name` is `git rev-parse --abbrev-ref HEAD` verbatim.
- `short description`: take the latest commit subject; strip `type(scope):` prefix; condense to under 80 chars. If the
  commit subject is cryptic, ask the user for a one-line summary.
- Total length under 100 chars; shorten the description, never the branch.

Examples:

- `fix-stale-session — refresh session token after password rotation`
- `PROJ-987-split-returns — use adjusted series across split boundary`

### 5. Locate the PR template

Look for a repo-level template, in order:

1. `.github/PULL_REQUEST_TEMPLATE.md`
2. `.github/pull_request_template.md`
3. `docs/pull_request_template.md`
4. `PULL_REQUEST_TEMPLATE.md` at the repo root

If none exists, fall back to the type-specific template shipped with this skill (using the type confirmed in step 3),
read relative to this skill's directory:

- bugfix → `assets/pr-fix-description.template.md`
- feature → `assets/pr-feat-description.template.md`
- misc → `assets/pr-misc-description.template.md`

The fallback templates ship with the skill — read the chosen one as-is and fill its placeholders.

### 6. Draft the PR body

Read the template located in step 5 and fill every placeholder. Sources vary by template type:

- **Summary**: derive from the commit message body and the diff. Name classes and methods.
- **Issue**: the URL for the confirmed ticket key from step 2, or `None` if the user explicitly confirmed there is none.
- **Bugfix sections** (`Problem` / `Root cause` / `Fix` / `Affected code paths`): grep the diff for
  `class |function |def |fn ` markers and trace the bad branch through the changed code.
- **Feature sections** (`Motivation` / `What's new` / `Approach` / `Migration / Rollout`): derive from the commit body,
  any linked spec, and the diff. Ask the user when motivation isn't recoverable from those sources.
- **Misc sections** (`Motivation` / `Changes` / `Behaviour preservation`): for refactors/chores, name the structural
  change and state explicitly that runtime behaviour is unchanged. For `perf`, replace `Behaviour preservation` with
  before/after numbers.
- **Verification**: use the test commands the user actually ran. If unknown, ask.

### 7. Push the branch

Announce the push to the user, then:

```bash
git push -u origin HEAD
```

This is the **only** state-mutating git command this skill runs. Never push to the default branch (already blocked by
step 1). Never use `--force` or `--force-with-lease` without explicit user approval.

### 8. Create the PR

Use a HEREDOC for the body so multiline content survives unchanged:

```bash
gh pr create \
  --title "$PR_TITLE" \
  --body "$(cat <<'EOF'
<filled body content>
EOF
)"
```

If a PR already exists for this branch (`gh pr status --json currentBranch`), update its body in place:

```bash
gh pr edit <number> --body "$(cat <<'EOF' ... EOF)"
```

### 9. Report

Print the PR URL to the user (`gh pr view --json url -q .url`).

## Red flags — STOP and fix

| Symptom | Fix |
|---------|-----|
| About to push to the default branch | Abort. Branch off first. |
| Tempted to write a free-form body | Use the template. Every section. |
| Tempted to invent a ticket key | Ask the user. Do not guess. |
| No ticket key found and tempted to skip the field | Ask the user for one. Do not proceed without it. |
| Commit subject is cryptic | Ask for a one-line summary before drafting the title. |
| Tempted to `git push --force` | Don't. Regular push only, unless the user explicitly approves. |

## Rationalizations to reject

| Excuse | Reality |
|--------|---------|
| "The reviewer can infer the root cause from the diff" | The PR body is where blast radius is recorded. Fill it. |
| "It's a one-liner, the template is overkill" | Template still takes 90 seconds. Fill it. |
| "Force-push is fine for my own branch" | Not from this skill. Regular push, or explicit user approval. |
| "No PR template means anything goes" | Fall back to the skill's type-specific template (see step 5). |
| "There's no ticket for this change" | Ask the user. If they confirm none exists, they must say so explicitly. |

## Anti-patterns

- **Free-form body when a template is available.** The whole point is a consistent shape across PRs. Repo template,
  then default fallback.
- **Guessed ticket key.** Always confirm.
- **Skipping the ticket field silently.** Ask the user; never proceed with an empty Ticket section by default.
- **Force push without explicit approval.** Use regular `git push`. If an amend is required later, push without
  `--force` or `--force-with-lease` unless the user explicitly approves.

## Related skills

- **`git-commit`** (sibling skill in this repo) — Produces the Conventional-Commits messages this skill reads to
  detect the PR type in step 3. Natural predecessor: commit with `git-commit`, then push and open the PR with this
  skill.
