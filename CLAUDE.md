# CLAUDE.md — repo conventions

Durable rules for working in this repo. Read before every change.

## Version bump — mandatory

**Every change that gets pushed must bump `.claude-plugin/plugin.json` `version`.** No exceptions — docs, hooks, schemas, refactors, everything. The `check-update.js` hook notifies users when a newer version is published, so every shipped commit needs a new number or users won't be told to pull it.

Semver:
- **Patch** (`1.8.0 → 1.8.1`) — docs, internal refactors, bug fixes, wording, schema clarifications that don't change file formats.
- **Minor** (`1.8.x → 1.9.0`) — new subcommand, new hook, new reference file, additive schema field, new capability users can opt into.
- **Major** (`1.x.y → 2.0.0`) — breaking schema change, renamed subcommand, removed feature, transport protocol change.

If a PR has multiple commits, bump on each commit that introduces a shippable change. Do not batch bumps at the end — the commit that adds the feature and the commit that bumps the version must be the same commit (or consecutive, but never separated by other feature commits).

## Branching

- Develop on the branch the task assigns. Never push to `main` or other non-development branches without explicit permission.
- Create the branch locally if it doesn't exist.

## Commit style

Prefix with type: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`. Keep the subject line under 72 characters, explain the "why" in the body. Example:

```
feat: add /collab reflect for cross-session patterns

Writes _patterns.md from 2+ closed sessions — inspired by the
memory-compiler quality gate (a pattern only promoted when seen twice).
```

## Plugin structure invariants

- `SKILL.md` stays under ~300 lines. Anything longer moves to `references/commands/<cmd>.md` or `references/<topic>.md`. Anthropic's progressive-disclosure convention.
- Hooks must be synchronous, local-only, and return `{}` gracefully when config is missing. Never auto-pull, never auto-write, never prompt for credentials.
- Every new `/collab` subcommand needs:
  1. An entry in the `SKILL.md` command table.
  2. A step-by-step reference at `references/commands/<cmd>.md`.
  3. An entry in `README.md` commands table.
  4. The subcommand name added to `commands/collab.md` frontmatter description and the parse list.
  5. Schema additions in `references/schemas.md` if it writes new file formats.

## File format invariants

- Block files (`<name>_<timestamp>.md`) are write-once. Never edit one after creation — not even to fix a typo.
- Only `_meta.json`, `_summary.md`, and `_patterns.md` are mutable.
- Collab root never lives inside a project repo.

## Timestamps

Always `date -u` via Bash. Never estimate. No internal clock.
