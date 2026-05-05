---
name: code-review
description: >-
  Performs a multi-perspective code review by fanning out six dimension-focused subagents (correctness, security,
  architecture, testing, performance, style) once over the branch's cumulative diff against its base, then merging
  their findings into a single severity-classified report. Each finding is attributed back to the originating commit
  via `git blame`, so reviewers see which commit introduced which weakness — but the agents review the branch as a
  whole, with commit history serving as context (not as an iteration unit). Default scope is "current branch vs. its
  default branch". Scope can be overridden with a PR number/URL, a ref range (`base..head`), a single commit (sha or
  `HEAD~n`), or pending diffs (`--staged`, `--working`). Triggers on "review my branch", "review this PR", "code
  review", "/code-review".
version: 1.0.0
---

# code-review

Run a structured, multi-agent review of a feature branch. The orchestrator computes the cumulative diff between the
branch and its base, dispatches six dimension-focused subagents in parallel against that diff, and gives each agent
the branch's commit history as context. After every subagent returns, the orchestrator attributes each finding to the
commit that introduced the offending line (via `git blame`), merges and deduplicates findings, and emits a single
severity-classified report with a verdict.

## When to use

Trigger this skill when the user asks for any of:

- "review my branch", "review the branch", "review my changes" — default scope, branch vs. default branch.
- "review this PR <num|url>", "review PR <num|url>", "/code-review <num|url>" — PR scope via `gh`.
- "review <base>..<head>" — explicit ref range.
- "review <sha>", "review HEAD", "review HEAD~1" — single-commit scope (resolved as `<sha>~1...<sha>`).
- "review my staged changes", "/code-review --staged" — pending staged diff.
- "review my working changes", "/code-review --working" — pending working-tree diff.
- Any invocation of `/code-review` (with or without an argument).

**Do not** use:

- For one-line typo fixes or pure formatting changes — six dimensional agents is overkill; suggest a quick read
  instead.
- On the default branch itself (`main`, `master`) — there is nothing to compare against. Tell the user to run on a
  feature branch or pass an explicit ref range.
- For diffs spanning multiple repositories or submodules — the attribution step assumes one git history.
- When `git` is not available or the working directory is not a repository.

## Core principles

1. **Branch-level fan-out, not per-commit fan-out.** The agents review the cumulative branch diff once. Commits are
   context — their messages explain *why* changes happened — but they do not multiply the dispatch. Total fan-out is
   six subagents per invocation, regardless of how many commits the branch contains.

2. **Six dimensions, one agent each.** Correctness, Security, Architecture, Testing, Performance,
   Style/Maintainability. Each subagent owns one lens, loads only its own reference checklist, and ignores the other
   five dimensions. This keeps prompts focused and findings categorised at the source.

3. **Findings track the diff, not the wider repo.** Agents review what the branch changed. They may read surrounding
   code for context, but they only file findings on lines the branch added or modified. Pre-existing weaknesses that
   the branch did not touch are out of scope.

4. **The orchestrator owns commit attribution.** Subagents emit findings with `file:line` and skip commit attribution.
   The orchestrator runs `git blame` after collection to attach the originating short sha to each finding. Centralising
   attribution avoids each agent re-implementing it and keeps the output consistent.

5. **Verdict is mechanical, not editorial.** REQUEST CHANGES if any Critical exists; COMMENT if any Warning but no
   Critical; APPROVE otherwise. Do not soften or escalate the verdict based on tone.

6. **Reasoning, not linting.** This skill does not run language linters or static analysers — it produces
   human-readable review findings. If a project has its own static analysis, use it alongside, not through this skill.

## Workflow

Execute the four phases in order. Phase 2 dispatches all six subagents in a single parallel batch.

### Phase 1: Resolve scope

Parse the invocation argument and produce a `(base_ref, head_ref, commits)` triple.

| Argument shape | Resolution |
|----------------|------------|
| no argument | `base` = detected default branch (origin); `head` = `HEAD`; `commits` = `git log --reverse <base>..HEAD`. |
| PR number (`1234`) or URL | `gh pr view <ref> --json baseRefName,headRefOid,commits` → use `baseRefName` and the PR head. |
| `<base>..<head>` | Use the explicit refs; `commits` = `git log --reverse <base>..<head>`. |
| `HEAD`, `HEAD~n`, full or short sha | Single-commit scope: `base` = `<sha>~1`, `head` = `<sha>`, `commits` = `[<sha>]`. |
| `--staged` | `base` = `HEAD`; `head` = synthetic "staged"; `commits` = `[]`; diff comes from `git diff --cached`. |
| `--working` | `base` = `HEAD`; `head` = synthetic "working"; `commits` = `[]`; diff comes from `git diff HEAD`. |

Default-branch detection:

```bash
git symbolic-ref --quiet --short refs/remotes/origin/HEAD | sed 's@^origin/@@' \
  || (git show-ref --quiet refs/remotes/origin/main && echo main) \
  || (git show-ref --quiet refs/remotes/origin/master && echo master) \
  || { echo "default branch unknown"; exit 1; }
```

If detection fails, ask the user which ref to compare against.

**Empty diff.** If the cumulative diff is empty (e.g. branch is even with default), say "nothing to review" and stop.
Do not dispatch subagents.

**Large-diff sanity check.** If the cumulative diff exceeds ~3,000 changed lines or ~50 files, warn the user that the
review will be coarse and offer to narrow scope (PR, ref range, single commit). Proceed if they confirm.

**Detect stacks.** Run `git diff --name-only <base>...<head>` (or the synthetic-scope equivalent) and map each changed
path to a stack tag using the table below. The result is a deduplicated stack list passed to every dimension
subagent in Phase 2 so they load only the relevant per-stack reference file(s).

| Path / extension                                                                                                          | Stack tag            |
|---------------------------------------------------------------------------------------------------------------------------|----------------------|
| `*.php`                                                                                                                   | `php-symfony`        |
| `*.tsx`, `*.jsx` (any TS/JS that is **not** an Angular convention below)                                                  | `typescript-react`   |
| `*.component.ts`, `*.module.ts`, `*.service.ts`, `*.directive.ts`, `*.pipe.ts`, `*.guard.ts`, `*.resolver.ts`, `angular.json` | `typescript-angular` |
| `*.rs`, `Cargo.toml`, `Cargo.lock`                                                                                        | `rust`               |
| `*.sh`, `*.bash`, `*.zsh`                                                                                                 | `shell`              |
| `Dockerfile*`, `docker-compose*.y{,a}ml`                                                                                  | `docker`             |
| `.github/workflows/*.y{,a}ml`                                                                                             | `ci`                 |

A file may match multiple tags (e.g. a workflow file is both YAML and CI); take the union. Plain `*.ts` / `*.js`
files default to `typescript-react` unless they match an Angular naming convention (or the repo contains
`angular.json`), in which case they map to `typescript-angular`. If a repo contains both frameworks (rare), both
stack tags are emitted and both files load. If nothing matches, the stack list is empty and agents load only
`<dimension>/universal.md`.

### Phase 2: Branch-level fan-out

Build the shared review context **once**:

- `base_sha` (`git rev-parse <base>`) and `head_sha` (`git rev-parse <head>`).
- Cumulative diff: `git diff <base_sha>...<head_sha>` (three-dot — diff vs. merge-base, excludes upstream-only
  changes). For `--staged` use `git diff --cached`; for `--working` use `git diff HEAD`.
- Commit list with messages: `git log --reverse --format='%h %s%n%n%b%n---' <base>..<head>`. Skip for synthetic
  scopes.
- Changed-file list: `git diff --name-only <base_sha>...<head_sha>`.

Dispatch the six dimension subagents **in parallel** (single message, six tool calls). Each agent receives:

- Its dimension name and an **explicit list of reference paths** to load:
  `references/<dimension>/universal.md` plus `references/<dimension>/<stack>.md` for each detected stack that has a
  file (cells with no language-specific content do not have a file — skip silently).
- The cumulative diff.
- The commit list with messages (or a note that this is a synthetic scope without commits).
- The changed-file list.
- An instruction to load **only the listed reference files** — no globbing, no inference, no loading sibling
  dimensions.
- The finding schema (see Subagent prompt contract below). The agent must return a JSON-style block.

Wait for all six to return before continuing.

### Phase 3: Attribute and merge

Once every subagent has returned, the orchestrator post-processes findings:

1. **Attribute each finding to a commit.** For each finding with a `file` and `line`:
   - Run `git blame -L <line>,<line> --porcelain <head_sha> -- <file>`.
   - Read the commit hash on the first line.
   - If that commit is on the branch (`git merge-base --is-ancestor <commit> <base>` exits non-zero, i.e. the commit
     is NOT an ancestor of base), record its short sha as `originating_commit`.
   - If the commit is **older** than the base (the line predates the branch), mark the finding `pre_existing: true`.
   - For findings without a `line` (file-level findings), use the commit that last touched the file in the branch
     range (`git log -1 --format=%h <base>..<head> -- <file>`) if any; otherwise mark `pre_existing`.
   - For synthetic scopes (`--staged`, `--working`), set `originating_commit` to `"staged"` or `"working"` and skip
     `git blame`.
2. **Drop pre-existing findings.** A finding the branch did not introduce is out of scope. Remove it.
3. **Compute `last_touched_commit`.** For attributed findings, also run
   `git log -1 --format=%h <base>..<head> -- <file>` on the file. If the resulting sha differs from
   `originating_commit`, record it as `last_touched_commit`.
4. **Deduplicate.** Group by `(file, line, dimension, normalised_title)`. Normalised title is lowercased, punctuation
   stripped, whitespace collapsed. Within a group, keep the most informative description; do not concatenate.
5. **Sort.** By severity (Critical → Warning → Suggestion → Praise), then file path, then line number.

### Phase 4: Render

Produce the output described in the Output format section. Always include both the detailed findings list AND the
Overall Assessment summary table.

### Subagent prompt contract

Every dispatched subagent receives a self-contained prompt with the following structure:

```
You are the <DIMENSION> reviewer for this branch. Load ONLY these reference files (do not glob, do not infer
additional paths):

  skills/code-review/references/<dimension>/universal.md
  skills/code-review/references/<dimension>/<stack-1>.md
  skills/code-review/references/<dimension>/<stack-2>.md
  ...

Apply the checklists to the diff below. Items that do not apply (e.g. a PHP rule when only TypeScript files changed)
should be skipped silently — the orchestrator pre-selected the stack files for you. Ignore concerns that belong to
the other five dimensions (Correctness, Security, Architecture, Testing, Performance, Style) — peers are reviewing
those.

You are reviewing the cumulative diff for the branch as a whole. The commit list and messages are CONTEXT to help you
understand WHY changes were made — they are not iteration units. Only file findings on lines the branch added or
modified.

Base:          <base_short_sha>  (<base_ref>)
Head:          <head_short_sha>  (<head_ref>)
Files changed: <count>

--- Commits on this branch (oldest to newest) ---
<short_sha>  <subject>
  <body if any>
---

--- Cumulative diff (git diff <base>...<head>) ---
<full diff>
---

Do NOT attempt to attribute findings to specific commits — the orchestrator handles attribution via git blame after
you return.

Return findings as a JSON array. Each entry:
{
  "severity": "critical" | "warning" | "suggestion" | "praise",
  "dimension": "<DIMENSION>",
  "file": "<path>",
  "line": <int|null>,
  "title": "<short title>",
  "description": "<why it matters — reference the commit message that explains the change when relevant>",
  "suggested_fix": "<short prose or code, optional>"
}

If you find nothing worth reporting, return an empty JSON array: [].
```

The orchestrator parses each response, validates the schema, and feeds findings into Phase 3.

## Output format

```
## Code Review — <branch or scope label>  (<N> commits, <K> files)

### Findings

🔴 Critical: <title>                                  (<dimension>)
  src/foo/Bar.php:42
  Introduced in: abc1234  feat(api): add /accounts endpoint
  <description>
  Suggested fix: <code or short prose>

🟠 Warning: <title>                                   (<dimension>)
  ...

🔵 Suggestion: <title>                                (<dimension>)
  ...

🟢 Praise: <title>                                    (<dimension>)
  ...

---
## Overall Assessment

Verdict: REQUEST CHANGES | COMMENT | APPROVE
<1-3 sentence summary>

Counts: <C> critical, <W> warnings, <S> suggestions, <P> praise.

| Severity      | Dimension     | Title                          | Commit   |
|---------------|---------------|--------------------------------|----------|
| 🔴 Critical    | Security      | SQL injection in handler       | abc1234  |
| 🟠 Warning     | Testing       | Missing 401 path coverage      | def5678  |
| 🔵 Suggestion  | Style         | Rename to RequestValidator     | def5678  |
| 🟢 Praise      | Architecture  | Clean separation of parsing    | abc1234  |
```

Output rules:

- The findings list is grouped by severity then ordered by file and line. No per-commit blocks.
- The first column of the Overall Assessment table is severity with a color indicator (🔴 / 🟠 / 🔵 / 🟢).
- The `Commit` column shows the originating short sha; if the finding's file was last touched by a different commit
  on the branch, append `→<last_short_sha>` (e.g. `abc1234→def5678`).
- For synthetic scopes (`--staged` / `--working`), the `Commit` column reads `staged` or `working`.
- File and line do not appear in the table — they belong to the detailed entries above.
- Verdict rules: REQUEST CHANGES (any Critical) → COMMENT (any Warning, no Critical) → APPROVE (otherwise).
- If the cumulative diff is empty, print "Nothing to review on this scope." and exit; do not produce a table.

### Severity definitions

| Severity | Icon | Meaning | Verdict impact |
|----------|------|---------|----------------|
| Critical | 🔴 | Bug, security vulnerability, data loss risk, or correctness error that will cause production issues. | Forces REQUEST CHANGES. |
| Warning | 🟠 | Code smell, potential issue, or deviation from established patterns that should be addressed. | Forces at least COMMENT. |
| Suggestion | 🔵 | Improvement opportunity — better naming, cleaner pattern, minor optimisation. | None. |
| Praise | 🟢 | Particularly well-written code, good pattern usage, or thorough handling worth highlighting. | None. |

## Anti-patterns

### Orchestration

- **The Sequential Fan-Out.** Dispatching the six dimension subagents one after another instead of in parallel. The
  point of the fan-out is parallelism; sequential dispatch wastes wall time and gains nothing.
- **The Per-Commit Loop.** Re-introducing a per-commit iteration "to be thorough". The redesign explicitly moved away
  from this — commits are context, not iteration units. One fan-out per invocation, full stop.
- **The Cross-Dimension Reviewer.** A subagent that reports findings outside its assigned dimension (e.g. the Security
  agent flagging a naming issue). Each agent owns exactly one lens; cross-dimension findings produce duplicates after
  the merge.
- **The Reference Loader Of Everything.** A subagent that loads more than the explicit path list it was handed (e.g.
  globbing `references/<dim>/*.md`, or pulling files from a sibling dimension directory). The orchestrator already
  pre-selected the universal file plus the relevant per-stack files based on the changed-file list — loading more is
  pure overhead and pulls in irrelevant rules.
- **The Subagent Attributor.** A subagent that runs `git blame` itself and tries to attribute findings to commits.
  Attribution is the orchestrator's job — agents only file findings with `file:line`. Centralising attribution keeps
  the output consistent and avoids redundant tool use.

### Scope and verdict

- **The Drive-By Default-Branch Review.** Running the skill on `main` / `master` and producing a verdict against
  itself. Refuse and ask for a feature branch or explicit range.
- **The Whole-Repo Review.** Reviewing files the branch did not touch. The mandate is "what this branch changes" —
  pre-existing weaknesses are out of scope and the orchestrator drops findings the branch did not introduce.
- **The Tone Verdict.** Softening REQUEST CHANGES to COMMENT because the Critical "feels minor". Verdict rules are
  mechanical; if the severity is wrong, fix the severity, not the verdict.

### Output

- **The Per-Commit Block.** Producing one section per commit in the final output. Per-commit structure was never the
  user-facing format — commit attribution lives inline on each finding and in the summary table only.
- **The Naked Table.** Emitting only the Overall Assessment table without the detailed findings list above it. The
  table is a summary; reviewers need the file/line and description to act on findings.
- **The Editorialised Verdict.** A verdict line that disagrees with the counts ("Verdict: APPROVE — but please look at
  the critical issue first"). Either the issue is Critical and the verdict is REQUEST CHANGES, or it is not.
- **The Unattributed Finding.** A finding without `originating_commit` (outside synthetic-scope mode). If `git blame`
  failed, retry; do not silently drop attribution.

## Quality checklist

Before producing the final report:

- [ ] Scope was resolved before any subagent dispatch.
- [ ] Empty-diff path was handled — if no diff, the skill said so and exited without dispatching.
- [ ] All six dimension subagents were dispatched in **one** parallel batch.
- [ ] Each subagent loaded only its own reference file.
- [ ] No subagent attempted commit attribution itself.
- [ ] Every finding has been attributed to a commit (or marked `pre_existing` and dropped, or marked synthetic).
- [ ] Pre-existing findings (lines that predate the branch) were dropped.
- [ ] Findings were deduplicated by `(file, line, dimension, normalised_title)`.
- [ ] Output contains both the detailed findings list and the Overall Assessment table.
- [ ] Verdict matches the mechanical rules (Critical → REQUEST CHANGES; Warning → COMMENT; otherwise APPROVE).
- [ ] No per-commit sections in the output.
- [ ] Severity icons (🔴 / 🟠 / 🔵 / 🟢) appear in both the detailed list and the Overall Assessment table.

## Related skills

- **`git-commit`** (sibling skill in this repo) — Runs before the review when the branch has uncommitted work that
  should be partitioned into atomic commits first. Better commit messages give the review agents better context, which
  produces better findings.
- **`open-pr`** (sibling skill in this repo) — Runs after the review when findings are addressed and the branch is
  ready to be pushed and turned into a pull request.
