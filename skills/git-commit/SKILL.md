---
name: git-commit
description: >-
  Writes high-quality, narrowly-scoped commit messages following Conventional Commits. Partitions pending changes into
  one logical change per commit (Linux-kernel style), staging hunks individually via `git add -p`. Analyzes staged
  changes, classifies the change type, determines scope, and produces a message that explains WHY the change was made.
  Triggers on "commit", "write a commit message", "stage and commit", "/git-commit", or any request to create a git
  commit.
version: 1.1.0
---

# git-commit

Partition pending changes into small, atomic commits — one logical change per commit — and produce a Conventional
Commits message for each. The message must explain the intent behind the change and provide enough context for future
readers to understand the decision without reading the diff.

## When to use

- The user asks to commit, stage and commit, write a commit message, or invokes `/git-commit`.
- A working tree contains uncommitted changes (staged, unstaged, or untracked) that need to land in one or more
  commits.
- An existing HEAD commit on a feature branch needs its message rewritten via `--amend` (see Special cases).

**Do not** use:

- On `main`, `master`, or any shared/protected branch when amending — rewriting published history is unsafe.
- For merge commits (let git's default merge message stand unless explicitly asked otherwise).
- When there is nothing to commit — inform the user instead of fabricating a message.

## Convention

Always use the **Conventional Commits** specification. Only deviate when a project has an explicit rule (in
CONTRIBUTING.md, project CLAUDE.md, or similar) defining a different convention.

### Message Structure

```
<type>[(scope)][!]: <description>

[body]

[footer(s)]
```

Append `!` before the colon to flag a breaking change (see [Breaking Changes](#breaking-changes)). Footers follow the
body after a blank line (see [Footers](#footers)).

### Types

| Type | When to Use |
|------|------------|
| `fix` | Patches a bug (correlates with PATCH in SemVer) |
| `feat` | Introduces a new feature (correlates with MINOR in SemVer) |
| `refactor` | Restructures code without changing external behavior |
| `perf` | Improves performance without changing behavior |
| `test` | Adds or modifies tests without changing production code |
| `docs` | Changes only documentation or comments |
| `style` | Formatting, whitespace, or code style with no logic change |
| `build` | Changes to build system or external dependencies |
| `ci` | Changes to CI configuration or scripts |
| `chore` | Maintenance tasks that do not fit other types |
| `revert` | Reverts a previous commit |

### Scope

- Placed in parentheses after the type: `fix(parser): ...`
- Must be a noun describing a section of the codebase
- Derive scope from recent git history (`git log --format="%s" -30`); reuse existing scopes when the change fits. Only
  introduce a new scope when the change clearly falls outside all existing ones.
- Omit scope when the change is broad or no meaningful scope exists

## Core principles

1. **One Logical Change Per Commit** — Each commit does exactly one thing: one bug fix, one refactor, one feature, one
   doc update. Never combine unrelated concerns. Reference: Linux kernel
   `Documentation/process/submitting-patches.rst`, "Separate your changes". A good commit is small enough to describe
   in a single subject line without the word "and".

2. **Intent over Inventory** — The message explains WHY the change was made, not WHAT files were changed. The diff
   shows WHAT; the commit message adds context the diff cannot convey.

3. **Atomic Accuracy** — Each message must precisely describe the actual staged changes for *that* commit. Never
   describe changes that belong to another commit in the sequence, and never omit significant staged changes. When
   pending work spans unrelated concerns, split it — do not bundle.

4. **Future Reader Perspective** — Write for the developer who reads this via `git log` or `git blame` in six months
   while investigating a bug. They need to understand the motivation and any non-obvious decisions.

5. **Brevity with Substance** — Be concise but not cryptic. Every word earns its place. Remove filler, but do not
   sacrifice clarity.

## Workflow

Run a partition phase once, then execute Phases 1–4 **once per planned commit**. Each iteration: reset index → stage
this unit's hunks → draft message → commit → loop to the next unit.

### Phase 0: Partition Changes

Before drafting any message, decide how many commits this session produces.

1. **Survey the full pending change set:**
   - `git status` — untracked + modified files
   - `git diff` — unstaged hunks
   - `git diff --cached` — already-staged hunks
2. **Group hunks into logical units.** A unit is a set of hunks that must land together to make sense on its own.
   Typical split lines:
   - Unrelated bug fixes → separate commits
   - Refactor (no behavior change) vs. behavior change → separate
   - Renames/moves vs. edits inside the renamed file → separate (use `git mv` + commit, then edit + commit)
   - Formatting/whitespace cleanup vs. logic change → separate
   - Dependency bump vs. code that uses the new version → separate when the bump stands alone
   - Feature code + its own tests → same commit (tests validate the feature landing in that commit)
   - Unrelated test additions → separate commit
   - Documentation of existing behavior → separate commit
   - Docs for a feature introduced in this session → same commit as the feature
3. **Order the units** so each commit can be reviewed without the later ones. Prerequisites first (e.g. refactor before
   feature that relies on it). For independent units: any order; prefer "smaller and more obviously correct" first.
4. **Produce an internal commit plan:** a list of (subject-hint, hunk selector) pairs. No user confirmation needed —
   execute directly.

**Skip Phase 0** when the user explicitly says "one commit", "single commit", "squash", or "just commit this".

### Staging Hunks Precisely

Use the tool that gives the finest control for each unit. `git add -p` and `git add -e` are the workhorses — file-level
`git add <file>` is only correct when the entire file belongs to one commit.

**Non-interactive use:** `git add -p` reads its commands from stdin, so it works inside Claude Code's Bash tool when
responses are piped in: `printf 'y\nn\ns\ny\nq\n' | git add -p <file>`. If hunk boundaries cannot be separated this
way, fall back to a patch round-trip: `git diff <file> > /tmp/p.diff`, edit `/tmp/p.diff` to keep only the desired
hunks, then `git apply --cached /tmp/p.diff`.

| Situation | Tool | Notes |
|-----------|------|-------|
| File belongs entirely to this commit | `git add <file>` | Cleanest. |
| File contains hunks for multiple commits | `git add -p <file>` | Answer `y`/`n` per hunk. |
| A single hunk mixes concerns | `git add -p`, then `s` to split | Splits into the smallest automatic hunks. |
| Split hunks still mix concerns | `git add -p`, then `e` to edit | Manually keep/drop lines by editing `+`/`-`. |
| New (untracked) file, partial content | `git add -N <file>` then `git add -p <file>` | `-N` registers intent-to-add. |
| New file, whole content | `git add <file>` | Normal add. |
| Moved file | `git mv` + `git add` | Commit move alone; edits inside the renamed file belong to a separate commit. |

After staging each unit and before committing:

1. `git diff --cached` — verify the index contains **only** what this commit should contain. If a stray hunk slipped
   in: `git reset <file>` and redo with `-p`.
2. `git diff` — confirm the remaining work lives in the working tree for the next commit.
3. Proceed to Phases 1–4 for that commit.

**Bisectable option (heavier branches):** After staging but before committing, run
`git stash push --keep-index --include-untracked` to stash everything *not* in the index, leaving a working tree that
contains only the staged subset. Run the project's build/test command to confirm this commit alone is green, then
`git stash pop` and commit. The default flow skips this unless the user asks for "bisectable" splits.

### Phase 1: Analyze Changes

Understand what this commit's unit of work is and why, before writing anything. "Staged changes" from here on means
"what is staged for the current commit in the sequence", not the whole session's work.

1. **Inspect staged changes** — Run `git diff --cached` to see exactly what will be committed. Read the full diff, not
   just filenames.
2. **Check the remaining pending work** — Run `git diff` to confirm the next unit is still present in the working tree
   and has not accidentally bled into the index.
3. **Read the spec** — When a plan, spec, or design doc exists, read it to understand intent — what the goal was and
   why specific decisions were made.
4. **Read surrounding code** — When the diff alone is insufficient to understand context (e.g., a small change in a
   large function), read the modified files to understand the broader purpose.
5. **Identify the motivation** — Determine why the change was made:
   - Bug fix: What was incorrect? What is correct now?
   - Feature: What new capability is introduced?
   - Refactor: What structural improvement? Why was the old structure wrong?
   - Performance: What was slow? What is the improvement?
6. **Check for related issues** — Look for issue references in the branch name, recent conversation context, or PR
   description.

### Phase 2: Classify the Change

1. **Select the type** from the types table based on the nature of the change. If this commit's unit spans multiple
   types, reconsider Phase 0 — that is usually the signal the unit should have been split further. Only when splitting
   is genuinely impossible, use the most significant type (e.g., `feat` if a feature is added alongside its tests;
   `fix` if a bug fix unavoidably includes a tiny refactor).
2. **Determine scope** — Check recent commit scopes via `git log --format="%s" -30` and reuse an existing scope if the
   change fits.
3. **Check for breaking changes** — Does the change alter public API, remove functionality, change return types,
   rename exported symbols, or require callers to update?

### Phase 3: Draft the Message

#### Subject Line

1. **Format**: `type(scope): description`
2. **Length**: Aim for under 50 characters; 72 is the hard limit. 50 keeps the subject readable in
   `git log --oneline` and GitHub's commit list without truncation.
3. **Imperative mood** — Write "add feature", not "added feature" or "adds feature". The description should complete
   the implicit phrase "If applied, this commit will…".
4. **No trailing period** — The subject is a title, not a sentence.
5. **Be specific** — "fix bug" is useless. "fix null pointer when user has no email" is useful.
6. **No "and"** — If the subject needs "and", the commit is doing two things. Return to Phase 0.

#### Body

1. **Blank line** — Always separate subject from body with a blank line.
2. **Wrap at 72 characters** per line.
3. **Structure**:
   - **Problem**: What was wrong or needed (1-2 sentences)
   - **Cause**: Root cause (for bug fixes)
   - **Solution**: Approach taken and why (1-3 sentences)
4. **Body is free-form** — May consist of any number of newline-separated paragraphs.

#### Footers

Footers carry structured metadata: issue links, breaking-change details, co-authors, reviewers. Place them after the
body, separated by one blank line. Each footer is one line in `Token: value` form (or `Token #value` for issue
references). Multiple footers each live on their own line, with no blank line between them.

Common footers:

- `Refs: #123` or `Refs: PROJ-456` — link to an issue tracker without closing the issue
- `BREAKING CHANGE: <description>` — describe a breaking API change in detail (see below)
- `Co-authored-by: Name <email>` — credit a co-author (rendered by GitHub on the commit page)

Token names are case-sensitive per Conventional Commits except `BREAKING CHANGE`, which must be uppercase.

#### Breaking Changes

Mark breaking changes in **both** places so they are visible in `git log --oneline` *and* in the body:

1. Append `!` before the colon in the subject: `feat!: drop Node 16 support` or `feat(api)!: rename /users to
   /accounts`.
2. Add a `BREAKING CHANGE:` footer that explains what broke and how callers should adapt.

Either form alone is technically valid per Conventional Commits, but using both is the project default.

### Phase 4: Validate

Before presenting the message, verify:

1. **Accuracy** — Re-read `git diff --cached`. Does the message describe exactly what changed in *this* commit and why?
2. **Format** — Does it follow `type(scope): description` with correct type and scope?
3. **Length** — Subject under 50 (72 hard limit)? Body wrapped at 72?
4. **Completeness** — Issue references included? Breaking changes marked?
5. **Atomicity** — Do this commit's staged changes represent a single logical unit, independent from the next commit's
   unit? If not, return to Phase 0 and re-partition.
6. **Tone** — Remove subjective qualifiers ("minor", "simple", "just", "small", "quick") that minimize the change.

After committing, return to the next unit in the Phase 0 plan and re-enter Phase 1 for that unit. Stop when every
planned unit has been committed.

## Output format

When a session produces multiple commits, announce the plan up-front:

```
**Commit plan:** <N> commits.

**Commit 1/N:** <subject>
  - Staged: <files/hunks summary>
  - Message: type(scope): description + body

**Commit 2/N:** ...
```

Execute the sequence; at the end report the result of `git log --oneline -<N>`.

For a single-commit session (Phase 0 skipped, or only one unit found), use the single-message format:

````
**Commit message:**

```
type(scope): description

Body wrapped at 72 characters. Explains the
motivation and approach.
```
````

When committing directly, use a HEREDOC per commit:

```bash
git commit -m "$(cat <<'EOF'
type(scope): description

Body text here.
EOF
)"
```

## Special cases

### Merge Commits

Do not rewrite merge commit messages unless explicitly asked. Git's default merge message is the expected convention.

### Revert Commits

Use `revert: <original subject>` as the subject. In the body, explain WHY the revert was necessary. Include the hash of
the reverted commit.

### Squash Commits

Combine information from all original messages into a single coherent message. Do not concatenate — write a new message
describing the final result.

### Amend Commits

Amending the current HEAD commit is fine on a feature branch you own. **Never amend on `main`, `master`, or any
shared/protected branch** — it rewrites published history and would require a force-push that can clobber other
contributors. If a commit on a shared branch is wrong, write a new commit (or `revert`) instead.

When asked to amend:

1. Read the existing message: `git log -1 --format="%B"`.
2. Inspect what's currently staged (`git diff --cached`) and the existing commit (`git show HEAD`) so the updated
   message reflects the combined state.
3. Update the message to describe the new state (subject + body).
4. Commit with `git commit --amend` using a HEREDOC for the message.

Do not re-partition — amend applies to the current HEAD commit only.

### Pre-commit Hook Failure

If a pre-commit or commit-msg hook rejects a commit, **the commit did not happen** — HEAD still points at the previous
commit. Running `git commit --amend` next would silently modify that *previous* commit, not the one you tried to make,
and may destroy already-pushed work.

After a rejected commit:

1. Fix the issue the hook reported.
2. Re-stage if needed (`git add -p`).
3. Run `git commit` again — **never** `--amend` — to create a fresh commit attempt.

Only use `--amend` when the previous commit actually succeeded and is visible in `git log -1`.

### No Staged Changes (and nothing to stage)

Do not write a commit message. Inform the user and suggest staging changes first. If there are unstaged changes, list
them and run Phase 0 on them.

## Anti-patterns

### Splitting

- **The Mega-Commit** — 17 files, 4 concerns, one message. Split.
- **The File-Level Fallacy** — staging `git add file.py` when `file.py` has two unrelated concerns. Use `-p`.
- **The Phantom Dependency** — putting a refactor + a bug fix in one commit "because the fix uses the refactor". If the
  fix works before the refactor too, split: refactor first, fix second.
- **The Drive-By Formatter** — reformatting an entire file during an unrelated change. Un-stage the formatting hunks
  from this commit; do the cleanup as a separate `style:` commit (or skip it).
- **The Test Mudslide** — bundling tests for Feature A with the code for Feature B. Tests ship with the feature they
  validate.
- **The Skip-Phase-0** — going straight to `git add .` and one message because "it's just this session's work". Phase 0
  is mandatory unless the user opted out.

### Subject Line

- **The Novelist** — `refactor(auth): refactored the entire authentication module to use dependency injection instead
  of static method calls because the old approach made testing impossible` — Keep it under 50 (72 hard limit). Move
  explanation to the body.
- **The Mystery** — `fix: fix bug` / `chore: update code` / `feat: changes` — Be specific about what was fixed, updated,
  or added.
- **The Filename** — `fix: update UserController.php` — Describe the behavior change, not the file.
- **The WIP** — `chore: WIP` / `feat: temp` / `fix: save` — Write a proper message or do not commit.
- **The Shotgun** — `fix: fix auth, update tests, refactor utils, add logging` — Split into separate commits.
- **The Wrong Type** — `feat: fix login crash` — A bug fix is `fix`, not `feat`. Match the type to the actual change.

### Body

- **The Diff Narrator** — `Changed line 42 from X to Y. Added method foo(). Removed bar().` — The diff shows this.
  Explain WHY.
- **The Silent Treatment** — A complex bug fix or refactor with no body. If the "why" is not obvious, add a body.
- **The Essay** — 20 paragraphs of history. Keep focused on immediate motivation. Link to issues for broader context.
- **The Apology** — `Sorry, quick hack to fix deployment. Will clean up later.` — If it is a hack, fix it before
  committing.

### Convention

- **The Inventor** — Creating types or scopes that do not exist in the project's history without justification.
- **The Case Rebel** — Using `Fix` or `FEAT` instead of lowercase `fix`, `feat`. Types are lowercase.
- **The Missing Colon** — `fix(auth) prevent crash` — The colon and space after type/scope are required.

## Quality checklist

Before finalizing any commit sequence:

- [ ] Pending changes were partitioned before any commit was written
- [ ] Each commit contains hunks for exactly one logical change
- [ ] `git diff --cached` was inspected before each commit
- [ ] No unrelated reformatting rode along with a logic change
- [ ] Subject follows `type(scope): description` format
- [ ] Type accurately classifies the change
- [ ] Scope matches existing project scopes (or is justifiably new)
- [ ] Subject is under 50 characters where possible (72 hard limit)
- [ ] Subject does not end with a period
- [ ] Subject is specific — a reader understands WHAT changed without the diff
- [ ] Subject does not contain "and" (split further if it does)
- [ ] Body is present and explains WHY
- [ ] Body is wrapped at 72 characters per line
- [ ] Blank line separates subject from body, and body from footers
- [ ] Issue references are included as footers when applicable
- [ ] Message describes ALL staged changes and ONLY staged changes for this commit
- [ ] No filler words ("just", "simply", "minor", "small", "quick")
- [ ] No vague subjects ("fix bug", "update code", "refactor stuff", "WIP")
- [ ] This commit's staged changes represent a single logical unit and are independent of the next commit's staged
      changes

## When to seek clarification

- The partition boundary is genuinely ambiguous (two changes that only make sense together — ask whether to merge them
  into one commit or split anyway).
- A hunk contains interleaved concerns where `git add -p` + `e` still can't cleanly separate them (rare; usually means
  the concerns were tangled in the working tree and need a manual unwind first).
- The motivation is not apparent from the code or conversation context.
- The user requests a convention that conflicts with an explicit project rule.
- Staged changes appear incomplete (e.g., new function added but never called).

## Related skills

- **`open-pr`** (sibling skill in this repo) — After the commits land, this skill pushes the branch and opens a pull
  request with a body filled from the repo's PR template (or a shipped fallback). Natural successor when the work is
  complete on a feature branch.
