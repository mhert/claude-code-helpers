# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository purpose

Personal collection of Claude Code helpers — skills agent definitions and other harness configuration
that the owner uses across projects. Each helper is self-contained under its own directory.

## Layout

- `skills/<name>` — one skill per directory. Skills follow Anthropic's skill format.
- `README.md` — index. The Skills table lists every skill with a one-line summary and a link to its `SKILL.md`.

The README is the human-facing entry point; keep it in sync when adding or renaming skills.

## Conventions

- **Always increase the skill `version:` field on every change to a `SKILL.md`** (or its files). Use semantic
  versioning. New skills start at `1.0.0`. Skills without a version field need one added.
- **Always run `/validate-skill` after updating a skill** Treat validation failures as blockers — fix and re-validate 
  before considering the change done. Always dispatch an Agent for validation
- **Hard-wrap all markdown at 120 characters.** Applies to all markdown files. Code fences   and tables are exempt where
- wrapping would break rendering, but keep prose lines under the limit.
- **No references to actual projects.** Skills, templates, and examples in this repo must stay generic — no real
  company names, repo names, project codes, ticket prefixes, URLs, or org-specific labels. Project-flavoured variants
  belong in a separate, private skill set, not here.

## Skill structure

Skills should follow a consistent section order so readers (and Claude) can find their way around quickly. New
`SKILL.md` files use this template; existing skills keep this order when edited.

**Required sections** (in this order):

1. `# <skill-name>` followed by a 1-paragraph summary of what the skill does.
2. `## When to use` — concrete triggers and when NOT to use.
3. `## Core principles` — the small set of non-negotiable rules the skill enforces.
4. `## Workflow` — the executable steps. Use numbered subsections (`### 1. Foo`, `### 2. Bar`, …) for sequential
   skills, or `### Phase 0/1/2 …` for skills that loop.
5. `## Anti-patterns` — patterns to avoid, each with the reason. Group with `### …` subsections when there are many.
6. `## Related skills` — links to skills that typically run before or after this one, with a one-line note on when
   each applies.

**Optional sections** (include only when they earn their place; keep the order below if multiple are used):

- `## Convention` — placed immediately after the intro when the skill follows an external spec (e.g. Conventional
  Commits). Subsections detail the spec.
- `## Output format` — placed after `Workflow`. For skills that produce structured output the caller will read.
- `## Special cases` — placed after `Output format`. Alternate flows (merge / revert / amend, etc.).
- `## Red flags — STOP and fix` — placed after `Special cases`. A table of symptoms → corrective action.
- `## Rationalizations to reject` — placed immediately after `Red flags`. A table of "Excuse | Reality" rebuttals.
- `## Quality checklist` — placed after `Anti-patterns`. A final pre-completion checklist.
- `## When to seek clarification` — placed after `Quality checklist`. Ambiguities the skill should escalate to the
  user instead of guessing.

Do not invent new top-level sections without a clear reason — prefer extending an existing one with subsections.

## Tooling

There is no build system, lint runner, or test suite in this repo — content is markdown-only. Verification of a skill
edit is done via `/validate-skill`. There are no commands to memorise beyond the standard git workflow.
