---
name: mark-ticket-as-done
description: Use when every pull request for a ticket is open and the ticket should transition to its developer-done
  workflow status (e.g. "Done", "Ready for QA", "Ready for Staging"). Supports Jira tickets (via workflow transition)
  and GitHub issues tracked on a Projects v2 board (via Status field update). Posts a stakeholder-facing comment that
  links to every PR involved and adds one label per repository touched. Triggers on "mark ticket done", "mark ticket
  as done", "mark ticket ready", "mark issue done", "transition ticket", "transition issue", "update project status",
  "Jira done", "Jira ready", "GitHub issue done".
version: 1.3.0
---

# mark-ticket-as-done

Move a tracker ticket to its developer-done workflow status — the state that signals development is complete and the
work is ready for the next pipeline stage (QA, staging, release) — and leave a stakeholder-facing comment that links
to every pull request involved. Two trackers are supported, with the same end-to-end shape:

- **Jira**: resolve and apply a workflow transition by name.
- **GitHub Issues + Projects v2**: resolve the project's Status field and update the issue's project item to the
  matching option by name.

Runs once per ticket, after every PR is open.

## When to use

- Every PR for the change has been opened (across one or more repositories).
- The ticket is currently in a status from which the target transition is available.
- You have permission to comment on and transition the ticket.
- For GitHub issues: the issue is already on a Projects (v2) board with a single-select Status field whose options
  include the target name. If it isn't, abort and ask the user to add it before re-running.
- For Jira tickets: `acli` is installed and authenticated (`acli auth status`), and `marklassian` is installed
  globally (`npm i -g marklassian`) — the skill uses it to convert markdown comment bodies to ADF before posting.

**Do not** use to create PRs. That is `open-pr`.

## Core principles

- **At least one PR link is mandatory.** If the user cannot provide or confirm at least one PR URL, abort and ask
  them to run `open-pr` first.
- **Tracker is detected from the ticket reference, then confirmed.** `[A-Z]+-\d+` → Jira. Bare `#?\d+` (with
  current-repo context), `<owner>/<repo>#<num>`, or a `github.com/.../issues/<num>` URL → GitHub. A bare integer is
  ambiguous — ask. Always confirm both the key and the detected tracker with the user.
- **Resolve the target status by name at runtime.** Workflow transition IDs (Jira) and Projects v2 field/option IDs
  (GitHub) drift between projects and over time. Never hardcode them. Never assume the transition or status option is
  reachable from the current state.
- **Comment before status change.** Post the comment first. If the status change fails afterwards, the comment still
  records the work. If the comment fails, abort before changing status.
- **Stakeholder voice, exhaustive.** The comment is read by QA, delivery managers, and the on-call deployer. Use the
  vocabulary of the subject matter. Do not hide information. Avoid software-engineering artefacts (class names,
  method signatures, file paths, stack traces) — reviewers can open the PRs for that.
- **One comment per ticket per run.** Never duplicate if the skill is re-invoked on an already-transitioned ticket;
  abort instead.
- **Repository labels are additive.** For each repository touched, add the repo name as a ticket label. Always merge
  with existing labels; never overwrite. `acli jira workitem edit --labels` replaces the label set, so Jira requires
  manual merge; `gh issue edit --add-label` is natively additive.
- **Comment format is markdown, not Jira wiki markup. (Jira only.)** Jira renders comments by converting markdown
  to ADF server-side. Wiki-markup tokens (`h2.`, `[text|url]`, `{code}`, `bq.`) are not converted — they survive as
  literal text and ruin the comment. Always write in markdown: `##` / `###` for headings, `[label](url)` for links,
  `1.` / `-` for lists, `**bold**` / `*italic*` for emphasis. GitHub renders comments as GitHub-Flavored Markdown
  natively — no conversion concern there.
- **GitHub issues are not closed by this skill.** The skill stops after the Status field update, mirroring how the
  Jira flow stops at the named target transition (typically a pre-Done state like "Ready for Staging"). Closing is
  project automation's job, not this skill's.

## Workflow

### 1. Identify the ticket and tracker

Accept any of:

- **Jira key** — `[A-Z]+-\d+` (e.g. `PROJ-1234`). Tracker = Jira.
- **GitHub issue** — bare `#123` or `123` in current-repo context, `<owner>/<repo>#<num>`, or
  `https://github.com/<owner>/<repo>/issues/<num>`. Tracker = GitHub.

Auto-detect from `git rev-parse --abbrev-ref HEAD` first, then from the latest commit subject and body. Branch
patterns: `^[A-Z]+-\d+` → Jira; `^#?\d+`, `^gh-\d+`, or `^issue-\d+` → GitHub. A bare integer with no surrounding
context is ambiguous — ask the user which tracker.

**Always confirm** both the key and the detected tracker with the user before acting. If the tracker is GitHub and
no `<owner>/<repo>` is implicit from the working directory, ask the user to supply it.

### 2. Identify the target status

The transition target is the workflow status the ticket should land in (e.g. `Done`, `Ready for QA`,
`Ready for Staging`). Accept a user-provided value, or ask. Do not assume `Done` — the right value depends on the
project's workflow. Confirm the target status with the user before continuing.

### 3. Collect PR URLs

Options in order:

1. User-provided list of URLs.
2. `gh search prs --author @me --state open "<TICKET-KEY>"` — present the results and ask which belong to this
   ticket.

Require **at least one** PR URL. If none, abort and suggest running `open-pr` first.

For each URL, fetch `gh pr view <url> --json number,title,headRepository,commits` so the comment can render
`[<repo> PR #<num>](<url>)` (markdown link), step 4 can read commit subjects to detect the comment type, and step 10
can derive the repo names.

### 4. Identify the comment type

Reuse the heuristic from `open-pr` step 3. Inspect the commit subjects gathered in step 3 and map each Conventional
Commits prefix to a type:

- `fix` / `bugfix` / `hotfix` → **fix**
- `feat` / `feature` → **feature**
- everything else (`refactor`, `chore`, `perf`, `docs`, `style`, `build`, `ci`, `test`, `revert`) → **misc**

Resolution rules across multiple PRs / commits:

- All commits map to the same type → that type.
- Mixed types → pick by precedence: `feat` > `fix` > anything else. Mixed `feat`+`fix` is rare and usually means the
  ticket should have been split; if the user confirms it's intentional, use the **feature** template.
- No conventional-commits prefixes → ask the user which type fits.

**Always confirm the detected type with the user** before continuing. The type determines which template step 7 uses.

### 5. Fetch the ticket

#### Jira

Run `acli jira workitem view <KEY> --fields summary,status,labels --json` and parse the JSON for `fields.summary`,
`fields.status.name`, and `fields.labels`.

Abort if:

- The ticket does not exist or is inaccessible (`acli` exits non-zero).
- The current status equals or is downstream of the target status (re-posting the comment would create noise; this
  skill is not idempotent-with-replay).

#### GitHub

Run `gh issue view <num> --repo <owner>/<repo> --json
number,title,state,labels,projectItems` and capture each project item's id, project (id, number, title), and the
current value of its Status field.

Abort if:

- The issue does not exist or is inaccessible.
- The issue is not on any Projects (v2) board (`projectItems` empty). Ask the user to add it before re-running.
- The current Status value equals or is downstream of the target status (same idempotency rule as Jira).

If the issue is on multiple project boards, ask the user which one to target. Carry the chosen project's ids and the
project item id forward to steps 6, 10, and 11.

### 6. Resolve the target-status reference

#### Jira

`acli` resolves status names at apply time via `acli jira workitem transition --status "<name>"`. Confirm the target
status name with the user (already done in step 2) and proceed. Reachability of the transition from the current
status is checked implicitly when step 10 runs the transition; if the target is not reachable, the command errors
out and surfaces the reachable transitions.

#### GitHub

Query the chosen project's fields with `gh project field-list <project-number> --owner <owner> --format json`. Locate
a single-select field whose `name` matches `Status` (or a user-provided field name; default `Status`). Within that
field's `options`, find the option whose `name` exactly matches the target status from step 2 (case-sensitive).

Capture: project id, project item id (from step 5), Status field id, target option id.

If the field is missing or no option matches, abort and list the available field/option names so the user can adjust
the project configuration or pick a different target.

Prefer the high-level `gh project item-edit` command (gh ≥ 2.34) for the eventual write in step 10; fall back to
`gh api graphql` with the `updateProjectV2ItemFieldValue` mutation if the high-level command is unavailable on the
caller's `gh` version.

### 7. Build the comment

Pick the template from `assets/` based on the type confirmed in step 4 (paths relative to this skill's directory):

- **fix** → `assets/comment-fix.template.md`
- **feature** → `assets/comment-feat.template.md`
- **misc** → `assets/comment-misc.template.md`

Read the chosen template and fill every section. Common to all three: **Summary** is one short paragraph in
subject-matter terms; **Affected features and inputs** is one bullet per feature, noting which inputs are now
affected; **How to verify** is exhaustive user-facing steps with exact inputs, expected outputs, and tolerances;
**Out of scope** lists related issues explicitly *not* addressed by this change; **Pull requests** (mandatory) is
one bullet per PR in markdown link form `[<repo> PR #<num>](<url>)`.

Type-specific guidance for the middle sections:

- **fix** —
  - **Problem**: exhaustive. Cover inputs, conditions, scope, frequency, and which invariant or contract was
    violated.
  - **Root cause**: subject-matter level. Use the vocabulary of the domain. No class names, no file paths, no stack
    traces.
  - **Fix**: what changed in subject-matter terms. Every user-visible behaviour change. Any knobs, parameters, or
    defaults adjusted.
- **feature** —
  - **Motivation**: the need or gap being addressed and who benefits, framed in subject-matter terms.
  - **What's new**: user-visible behaviour with concrete examples — inputs newly accepted/rejected, screens or
    reports affected, defaults or limits that newly apply.
  - **Approach**: subject-matter level summary of the design choice — only when non-obvious to the reader. Skip or
    write `None` when mechanical.
  - **Migration / Rollout**: feature flags, breaking changes, schema or data migrations, ordering constraints,
    downstream notifications. `None` if purely additive.
- **misc** (refactor / chore / perf / docs / style / build / ci / test / revert) —
  - **Motivation**: what made this worth doing now — pain point, prep for upcoming work, dependency or platform
    requirement, follow-up to a recent incident. No vague "cleanup".
  - **Changes**: what was restructured / renamed / moved / swapped / upgraded, in subject-matter terms.
  - **Behaviour preservation**: explicit statement that user-visible behaviour is unchanged and how QA can confirm
    it. For `perf`, replace this section with **Performance impact** carrying before/after numbers, the workload
    measured, and any trade-off the user might notice.

Source material for every type: the commit message body, the PR descriptions, and the user's own description of the
change. Ask the user for subject-matter detail the commit and PR do not carry.

### 8. Format pre-flight check

#### Jira

Before posting, scan the drafted comment string for any Jira wiki markup that survived from older templates or
muscle memory — `marklassian` (the markdown→ADF converter used in step 9) does not recognise these tokens, so they
survive as literal text in the resulting ADF. **Reject the draft and rewrite** if any of these patterns appear:

- A line beginning with `h1.`, `h2.`, `h3.`, `h4.`, `h5.`, or `h6.` (use `#`, `##`, … instead).
- A link in the form `[anything|http…]` (use `[anything](http…)` instead). Bare `[text|url]` renders as the literal
  characters.
- `{code}`, `{quote}`, `{noformat}`, `{panel}`, or any other `{macro}` block (use markdown fenced code blocks or
  plain text).
- `bq.` line prefix for blockquotes (use `>`).

If the draft is clean, proceed.

#### GitHub

GitHub renders comments as native GitHub-Flavored Markdown, so most Jira-style wiki constructs render as harmless
literal text. Only one common Jira-muscle-memory leak warrants blocking: a link in the form `[anything|http…]` will
render as the literal characters and break the PR list. Reject the draft if any `[text|url]` pattern is present;
rewrite as `[text](url)`. Other Jira wiki tokens (`h2.`, `{code}`, `bq.`) are not blockers on GitHub.

### 9. Post the comment

#### Jira

`acli` accepts only plain text or ADF JSON for `--body` / `--body-file` — it does **not** convert markdown. The
skill bridges the gap with a bundled helper script (`assets/md-to-adf.mjs`) that pipes markdown through
`marklassian`. Convert, then submit:

```bash
NODE_PATH="$(npm root -g)" node <skill-dir>/assets/md-to-adf.mjs \
  < /tmp/comment.md > /tmp/comment.adf.json
acli jira workitem comment create --key <KEY> --body-file /tmp/comment.adf.json
```

If `marklassian` is missing (`Error [ERR_MODULE_NOT_FOUND]`), abort and tell the user to install it
(`npm i -g marklassian`); see the README for setup notes.

After the call returns, re-fetch the comment list and verify the ADF that Jira stored:

```bash
acli jira workitem comment list --key <KEY> --json | jq '.[-1].body' > /tmp/posted.adf.json
```

Confirm against `/tmp/posted.adf.json`:

- The first content node is a `heading` of `attrs.level: 2` (not a `paragraph` containing the literal text "h2.
  …" or the section header as raw text).
- Each PR link is a `text` node with a `link` mark whose `href` matches the PR URL (not a bare `text` node
  containing `"[<repo> PR #<num>|https://…]"` or `"[<repo> PR #<num>](https://…)"`).

If either check fails, the format is broken: post a follow-up comment with the corrected markdown, lead it with a
one-line note that it supersedes the previous comment, and surface the malformed comment id to the user (`acli
jira workitem comment delete --id <comment-id>` is available if they want to clean up).

#### GitHub

Pipe the markdown body via stdin to keep multiline content unchanged:

```bash
gh issue comment <num> --repo <owner>/<repo> --body-file - <<'EOF'
<filled comment body>
EOF
```

After the call returns, re-read with `gh issue view <num> --repo <owner>/<repo> --json comments` and confirm the
latest comment's `body` matches the body sent. GitHub renders Markdown natively — no ADF check needed. If the
posted body diverges (e.g. the shell mangled a HEREDOC), post a corrected follow-up that supersedes the previous
comment and surface the bad comment URL to the user for manual deletion.

### 10. Add labels and apply the status

Bundle the label edit and the status change as one logical step. Order **labels first, status second** — labels
should be on the ticket before any automation (notifications, project rules) fires on the status change.

Common to both trackers — collect repo names: unique `headRepository.name` across the PRs gathered in step 3.

#### Jira

1. Reuse the ticket's current labels read in step 5. Compute the union with the repo-name set; drop duplicates.
2. `acli jira workitem edit --key <KEY> --labels "<merged,comma,separated,list>" --yes`. The `--labels` flag
   **replaces** the label set, so the merged list must be the full union. **Never** pass only the new labels —
   that overwrites. (`acli` also exposes `--remove-labels` for removal but no `--add-labels` for addition; manual
   merge is the only path.)
3. If the edit fails, abort before transitioning. The comment is already posted; a partial state with comment +
   labels-missing is recoverable by re-running. A transitioned-but-unlabelled ticket is not.
4. `acli jira workitem transition --key <KEY> --status "<TARGET-STATUS>" --yes`. If the target is not reachable
   from the current status, the command exits non-zero and lists the reachable transitions; surface that output
   to the user and abort.

#### GitHub

1. `gh issue edit <num> --repo <owner>/<repo>` with one `--add-label <repo-name>` per repository touched.
   `--add-label` is natively additive — no merge logic needed. If the repo does not have a label of the chosen name,
   `gh` returns an error; abort and surface the missing label name to the user so they can either create it
   (`gh label create`) or rerun without that repo's label.
2. If the label edit fails, abort before the status change. The comment is already posted; a partial state with
   comment + labels-missing is recoverable by re-running. A status-changed-but-unlabelled item is not.
3. Update the project item's Status field. Preferred:

   ```bash
   gh project item-edit \
     --id <project-item-id> \
     --project-id <project-id> \
     --field-id <status-field-id> \
     --single-select-option-id <target-option-id>
   ```

   Fall back to `gh api graphql` with the `updateProjectV2ItemFieldValue` mutation if the high-level command is
   unavailable. Use the ids captured in step 6.

Do not call `gh issue close` — closing the issue is out of scope (see Core principles).

### 11. Verify

#### Jira

Re-read the ticket with `acli jira workitem view <KEY> --fields status,labels --json` and the comments with
`acli jira workitem comment list --key <KEY> --json`. Confirm:

- `fields.status.name` equals the target status from step 2.
- `fields.labels` contains every repo name collected in step 10.
- The latest entry from `comment list` is the one just posted.

#### GitHub

Re-read the issue with `gh issue view <num> --repo <owner>/<repo> --json
labels,comments,projectItems`. Confirm:

- The chosen project item's Status field equals the target option name from step 2.
- `labels` contains every repo name collected in step 10.
- The latest entry in `comments` is the one just posted.

#### Both

Print the ticket / issue URL, the final status, and the labels applied.

## Red flags — STOP and fix

| Symptom | Fix |
|---------|-----|
| No PR URLs available | Abort. Run `open-pr` first. |
| About to hardcode a project id, field id, or option id (GitHub) | Resolve by name every run via `gh project field-list`. (Jira: the CLI takes status names directly — no IDs to hardcode.) |
| Tempted to apply the status change without a comment | Never. Comment first. |
| Tempted to omit a PR "because it's small" | Every PR appears in the comment. |
| Tempted to skip a repo's label | Every involved repo gets its label. No exceptions. |
| **(Jira)** About to pass only the new labels to `acli jira workitem edit --labels` | Merge with existing labels first. `--labels` replaces. Overwriting is a bug. |
| **(Jira)** Draft contains `h2.` / `h3.` / `[text\|url]` / `{code}` / other Jira wiki markup | Rewrite as markdown (`##`, `###`, `[text](url)`, fenced code). `marklassian` does not recognise wiki markup; tokens survive as literal text in the resulting ADF. |
| **(Jira)** About to pass the markdown body straight to `acli ... --body-file` | `acli` accepts only plain text or ADF. Convert via `node assets/md-to-adf.mjs` first. |
| **(Jira)** Post-write check shows the first content node as a `paragraph` instead of a `heading` | Conversion failed. Repost with corrected markdown and surface the malformed comment id to the user. |
| **(Jira)** `marklassian` is missing (`ERR_MODULE_NOT_FOUND`) | Abort. Tell the user to run `npm i -g marklassian`. |
| Comment draft references `SomeClass::method()` | Rewrite in subject-matter terms. |
| Ticket is already at or past the target status | Abort. Do not re-comment. |
| Draft is a one-liner ("fixed the thing") | Rewrite exhaustively. The audience depends on it. |
| Drafted Problem / Root cause / Fix headings for a feature or refactor ticket | Wrong template. Switch to `comment-feat.template.md` or `comment-misc.template.md`. |
| **(GitHub)** Issue is not on any Projects v2 board | Abort. Ask the user to add it to the project before re-running. |
| **(GitHub)** Issue is on multiple project boards and no preference confirmed | Don't pick silently. Ask the user which project to target. |
| **(GitHub)** Project's Status field has no option matching the target name | Abort and list available options. Don't fuzzy-match. |
| **(GitHub)** `gh issue edit --add-label` fails because the repo has no label of that name | Abort. Surface the missing label so the user can `gh label create` it (or rerun without that label). |
| **(GitHub)** Tempted to call `gh issue close` after the Status update | Don't. Closing is project automation's job, not this skill's. |

## Rationalizations to reject

| Excuse | Reality |
|--------|---------|
| "The PR description already says everything" | Jira readers don't open PRs first. The comment is the entry point. |
| "One-liner is enough for a small fix" | Small-code change ≠ small subject-matter impact. Be exhaustive about the latter. |
| "I'll skip the lookup, the IDs worked last time" | Transition IDs (Jira) and project / field / option IDs (GitHub) drift. Always resolve by name. |
| "QA can just read the PR diffs" | QA are subject-matter experts, not software engineers. Write for them. |
| "I'll simplify the root cause for readability" | Don't dumb it down. Use the domain's full vocabulary. |
| "I'll change the status first and comment later" | If the comment fails, ticket state is inconsistent. Comment first. |
| "The PR already has the repo-name label" | PR labels and ticket labels are independent systems. Label the ticket. |
| "Labels are cosmetic, skip them" | Reporting and filters depend on them. Always add repo-name labels. |
| **(Jira)** "Jira understands wiki markup, `h2.` will work" | `marklassian` doesn't convert wiki markup; tokens survive as literal text. Use markdown. |
| **(Jira)** "I'll skip the markdown→ADF step and pass markdown to acli directly" | `acli` will store the markdown as a single plain-text paragraph. Headings, bold, links — gone. Always run `assets/md-to-adf.mjs` first. |
| **(Jira)** "`acli` exited 0, the formatting must be fine" | Exit 0 only means the request was accepted. Re-fetch with `acli jira workitem comment list --json` and verify headings and links rendered as the right ADF node types. |
| **(GitHub)** "I'll just `gh issue close` and skip the Status update" | Closing is project automation's job. The named Status update is the developer-done signal, mirroring the Jira flow. |
| **(GitHub)** "There's only one project on this issue, surely I can skip the lookup" | Lookups are cheap. Resolve project / field / option ids by name every run. |

## Anti-patterns

- **Hardcoded transition / project / field / option IDs.** Workflow configuration (Jira) and project metadata
  (GitHub) drift across projects and over time; resolve by name every run.
- **Comment without PR links.** Every involved PR must appear in the comment.
- **Dumbing down the root cause.** The audience is fluent in the domain — write to that fluency.
- **Duplicate comments on re-runs.** Abort instead of re-commenting on an already-transitioned ticket.
- **(Jira) Using Jira wiki markup instead of markdown.** `marklassian` does not recognise wiki markup
  (`h2.`, `[text|url]`, `{code}`, `bq.`); tokens survive as literal text in the ADF and ruin the comment. Use
  `##`, `[text](url)`, fenced code blocks, `>` instead.
- **(Jira) Skipping the markdown→ADF conversion.** `acli` accepts only plain text or ADF. Always run the body
  through `assets/md-to-adf.mjs` (which uses `marklassian`) before passing to `acli ... --body-file`.
- **(Jira) Trusting `acli`'s exit code without verifying the stored ADF.** Always re-fetch with `acli jira
  workitem comment list --json` and confirm headings became `heading` nodes and links became `link`-marked text
  nodes — not literal text in paragraphs.
- **(Jira) Overwriting labels.** Always merge repo-name labels with the ticket's existing labels; never replace.
  `acli jira workitem edit --labels` and `gh issue edit --add-label` differ here: `gh` is natively additive,
  `acli` replaces — so the merge logic is a Jira-only concern.
- **Missing repo labels.** Every repo contributing a PR must appear as a ticket label.
- **Bug-fix shape on a feature or refactor comment.** Pick the template by detected type (step 4); do not force a
  feature or refactor into a Problem / Root cause / Fix mould. Each type has its own template under `assets/`.
- **(GitHub) Closing the issue.** This skill stops at the Status field update. Closing is out of scope — it's
  project automation's job, or a later manual step.
- **(GitHub) Editing labels on the project item instead of on the issue.** Labels live on the issue (set via
  `gh issue edit`); Status lives on the project item (set via `gh project item-edit`). Do not conflate them.
- **(GitHub) Picking a project silently when the issue is on more than one.** Ask the user every time.

## Related skills

- **`open-pr`** (sibling skill in this repo) — Opens the pull requests this skill links to. Natural predecessor: open
  every PR with `open-pr` first, then run this skill once to transition the ticket.
- **`git-commit`** (sibling skill in this repo) — Produces the commit messages whose bodies feed the comment's
  Problem / Root cause / Fix sections.
