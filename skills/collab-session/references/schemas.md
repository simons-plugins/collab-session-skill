# Collab Session — File Schemas

Metadata is JSON. Summaries and block files are **markdown with YAML frontmatter** —
markdown is Claude's natural output format, making saves near-instant with no conversion
overhead. Block files are **write-once** — never modified after creation. Only `_summary.md`
and `_meta.json` are ever updated.

---

## `~/.claude/collab-identity.json` — User Identity

Per-machine. Never in the shared folder or repo.

```json
{
  "name": "simon"
}
```

Name rules: lowercase, no spaces (hyphens ok). Becomes part of block filenames — keep it
consistent across machines (e.g. always `simon`, not `Simon` on one machine and `simon` on another).

---

## `~/.claude/collab-transport.json` — Transport Config

Per-machine. Never in the shared folder or repo.

**Drive mode:**
```json
{
  "mode": "drive",
  "root": "/Volumes/TeamNAS/collab",
  "publish_repo": "org/repo"
}
```

**Mini-repo mode:**
```json
{
  "mode": "git",
  "root": "~/collab-repo",
  "remote": "origin",
  "branch": "main"
}
```

---

## `_index.json` — Workspace Registry

**Path:** `<collab-root>/_index.json`
Lightweight metadata only. Readable at a glance. Updated by `/collab new` and `/collab close`.

```json
{
  "collab_root": ".claude/collab",
  "workspaces": [
    {
      "workspace": "skill-project",
      "created_by": "simon",
      "created_at": "2026-03-14T14:00:00Z",
      "sessions": [
        {
          "number": 1,
          "topic": "initial-design",
          "folder": "session-001_initial-design",
          "status": "closed",
          "created_by": "simon",
          "created_at": "2026-03-14T14:00:00Z",
          "closed_at": "2026-03-14T14:20:00Z",
          "last_save_by": "simon",
          "last_save_at": "2026-03-14T14:18:00Z",
          "total_saves": 2,
          "open_question_count": 0,
          "prior_session": null
        },
        {
          "number": 2,
          "topic": "workspace-arch",
          "folder": "session-002_workspace-arch",
          "status": "active",
          "created_by": "simon",
          "created_at": "2026-03-14T14:20:00Z",
          "closed_at": null,
          "last_save_by": "dan",
          "last_save_at": "2026-03-14T14:35:00Z",
          "total_saves": 3,
          "open_question_count": 2,
          "prior_session": 1
        }
      ]
    }
  ]
}
```

---

## `_meta.json` — Session Metadata

**Path:** `<session-folder>/_meta.json`
Updated on every `/collab save` and `/collab close`. Never holds turn content.

**`open_questions` field:** array of structured objects with `question` (required),
`owner` (optional — who's working on it), `blocked_on` (optional — who it's waiting on),
`raised_by` (optional — who raised it), `phase` (optional — which phase it relates to).
`open_question_count` stays as a convenience integer.

**Migration:** old sessions may have `open_questions` as a string array. Compress rewrites
them as objects on next run. Code consuming `open_questions` should handle both formats
(check if first element is string or object).

```json
{
  "workspace": "skill-project",
  "topic": "workspace-arch",
  "number": 2,
  "folder": "session-002_workspace-arch",
  "goal": "Redesign the collab skill to use flat files per save, eliminating merge conflicts.",
  "status": "active",
  "created_by": "simon",
  "created_at": "2026-03-14T14:20:00Z",
  "closed_at": null,
  "closed_by": null,
  "prior_session": 1,
  "participants": ["simon", "dan"],
  "last_save_by": "dan",
  "last_save_at": "2026-03-14T14:35:12Z",
  "total_saves": 3,
  "open_question_count": 2,
  "published_url": null,
  "published_discussion_id": null,
  "open_questions": [
    {
      "question": "Auto-compression: trigger automatically or user-prompted?",
      "raised_by": "simon",
      "phase": 1
    },
    {
      "question": "Should /collab refresh be timer-based or purely manual?",
      "raised_by": "simon",
      "phase": 1
    }
  ]
}
```

The `open_questions` array is the **quick-glance list** of what's still needed. Updated on
every `/collab save` (from the block's `## Open Questions` section) and `/collab compress`
(consolidated and deduplicated). This means a collaborator browsing the repo can open
`_meta.json` to see session status AND outstanding questions without reading the full summary.

`open_question_count` is kept for backwards compatibility and quick display in `/collab list`.

**`published_url`** and **`published_discussion_id`** are set by `/collab publish`. When
present, re-publishing updates the existing Discussion instead of creating a new one.
`published_discussion_id` is the GitHub GraphQL node ID (e.g. `D_kwDO...`).

---

## `_summary.md` — Rolling Compressed Narrative

**Path:** `<session-folder>/_summary.md`
Rewritten during compression (user-confirmed, never automatic mid-save).
Represents all blocks up to the `compressed_through_timestamp` in its frontmatter.

The summary is a **journey-style narrative** in markdown — human-readable when browsing
the repo on GitHub. Only minimal metadata goes in YAML frontmatter; decisions and open
questions are rendered as proper markdown sections so they display well in GitHub's preview.

```markdown
---
compressed_through_timestamp: "20260314T143512Z"
---

## Contributors

- **Simon** (8 blocks, 14-15 Mar): Built correlation engine, CSO integration,
  upstream catchment expansion, exec summary. Domain: data analysis, API integration.
- **Brian** (2 blocks, 15 Mar): EA station ID confirmation, site-specific local
  knowledge. Domain: site geography, water testing.
- **Dan** (3 blocks, 14-16 Mar): Architecture review, suggested tributary flow
  approach. Domain: system design.

## Starting point

We set out to eliminate merge conflicts in shared brainstorming sessions.

## Phase 1 — Shared JSON (abandoned) (14 Mar, 1 contributor)

**Simon** (14 Mar, 1 block): Started with a single shared session.json file. Immediately
hit concurrent write conflicts when two people saved near-simultaneously. Tried file
locking but it was fragile across NAS mounts.

## Phase 2 — Flat file per save (14 Mar, 1 contributor)

**Simon** (14 Mar, 2 blocks): Proposed write-once block files with unique names
(<user>_<timestamp>.md). This eliminates conflicts entirely — two simultaneous saves
just create two files. Tested with network drive and confirmed no issues.

## Phase 3 — Transport layer (14-15 Mar, 2 contributors)

**Simon** (14 Mar, 1 block): Proposed adding git as an alternative to shared drives.

**Dan** (15 Mar, 1 block): Pointed out that identity should be per-machine, not per-save
— avoids re-asking every time. Both agreed the collab folder must live outside project repos.

**Key finding:** Git works as a pure transport (no branches, no PRs) when the data model
is conflict-free.

## Dead ends & pivots

- File locking on NAS (unreliable across SMB/NFS)
- Shared mutable JSON (concurrent writes)
- Storing identity in the session folder (gets out of sync)

## Key discoveries

- Write-once files make conflicts structurally impossible, not just unlikely
- Git works as a pure transport (no branches, no PRs) when the data model is conflict-free

## Current state

Skill spec written with both transport modes (drive + mini-repo). Identity stored in
~/.claude/collab-identity.json. Save/join/refresh/compress commands designed. No
implementation yet — spec only.

## Decisions

- Flat-file-per-save: each save is a new uniquely-named file, never modified (simon)
- Two transports: drive (NAS/Dropbox) and mini-repo (proposed: simon, validated: dan)
- Identity stored in ~/.claude/collab-identity.json, set with /collab whoami (proposed: dan)
- Collab root is never inside a project repo

## Open questions

- Auto-compression: trigger automatically or user-prompted? (raised by simon, Phase 2)
- Should /collab refresh be timer-based or purely manual? (raised by simon, Phase 3)
```

**Structure:**
- **YAML frontmatter** — only `compressed_through_timestamp` (true metadata, not content)
- **Contributors** — per-person block counts, date ranges, key contributions, domain expertise
- **Narrative body** — journey-style headings: Starting point, Phase N (with attribution),
  Dead ends, Key discoveries, Current state
- **Decisions** — consolidated bullet list as a `## Decisions` section (with attribution
  for contested decisions)
- **Open questions** — unresolved items as a `## Open questions` section (with blocked_on/
  owner/raised_by attribution; resolved ones removed during compress)

Decisions and open questions are in the markdown body (not frontmatter) so they render
properly on GitHub. The same lists are also kept in `_meta.json` for programmatic access
by `/collab catchup`, `/collab join`, and `/collab list`.

When the file is empty (no frontmatter, no body), all block files are treated as
verbatim (no compression has happened yet).

**Migration from `_summary.json`:** If a session has the old JSON format, read it and
treat identically — the `summary` field maps to the markdown body, structured fields
map to the corresponding sections. On next compress, write `_summary.md`. The old
JSON file can be left in place (harmless) or deleted.

**Attribution rules** (applied in the example above):
- **Contributors section** (before first phase): name, block count, date range, key contributions (2-3 phrases), domain expertise. Order by contribution volume. Always present, even for solo sessions.
- **Phase paragraphs**: lead with contributor name in bold, date and block count. Multiple contributors get separate paragraphs within the phase. End each phase with "Key finding" or "Phase outcome" line.
- **Phase headings**: include date range and contributor count: `## Phase 3 — CSO integration (14-15 Mar, 2 contributors)`.
- **Decisions**: contested/multi-contributor decisions get `(proposed: name, validated: name)`. Single-contributor uncontested decisions optionally get `(name)`. Consensus decisions need no attribution.
- **Open questions**: include `— **blocked on name**` or `— **owner: name**` where applicable, plus `(raised by name, Phase N)` for traceability.

---

## `<name>_<timestamp>.md` — Block File (Write-Once, Markdown)

**Path:** `<session-folder>/simon_20260314T142001Z.md`
**Filename:** `<identity-name>_<YYYYMMDDTHHmmssZ>.md`
**Collision guard:** append `_2`, `_3` if timestamp already exists for this user.

Written once by `/collab save`. Never modified. Markdown with YAML frontmatter.

```markdown
---
participant: simon
timestamp: "2026-03-14T14:20:01Z"
timestamp_compact: "20260314T142001Z"
workspace: skill-project
topic: workspace-arch
session_number: 2
---

## Human
We don't want to continually push to GitHub do we? What about network drives?

## Claude
Network drives work identically to cloud sync for this skill — flat-file-per-save
means no locking issues. Proposed two transport modes: drive (NAS/Dropbox) and
mini-repo (dedicated git repo, auto-push to main, no branches).

## Decisions
- Collab root lives outside project repos — on a shared drive or in a dedicated mini git repo
- Mini-repo mode: auto-commit and push to main on every save, auto-pull on join
- Drive mode: NAS or cloud sync folder, file watcher for near-real-time notifications

## Files
- `_files/skill-project/design-spec.md` — skill specification document (mini-repo: actual file)
- `workspace/local/path/to/notes.md` — working notes (drive: local path reference)

## Open Questions
- Should /collab refresh be timer-based or purely manual?
- Auto-compression: trigger automatically or user-prompted?
- EA stationIds for 4 sites — NEED BRIAN
- Build alert script? — owner: simon
```

**Why markdown?** Markdown is Claude's natural output format — no conversion overhead, no
escaping, no JSON structure to build. Saves are near-instant. The YAML frontmatter provides
structured metadata that can be parsed programmatically when needed.

**Conversation turns:** dump as `## Human` and `## Claude` sections. Include all turns
as-is — do not summarise or compress during save. Compression happens later via
`/collab compress`, which reads raw blocks and writes a tight narrative to `_summary.md`.

**Decisions and Open Questions:** tag these as `## Decisions` and `## Open Questions`
sections with bullet lists. Include if obvious during save, but these sections are
optional — empty or omitted is fine. The `/collab compress` step extracts and consolidates
these exhaustively.

**Files:** tag as `## Files` with bullet list of files created or modified during the
conversation. Each entry has a path and one-line description.
- **Mini-repo mode:** paths are relative to `_files/` in the session folder — actual files
  are copied there on save. Colleagues get them on join/pull.
- **Drive mode:** paths are local filesystem paths — clickable references, no copy needed.

**Open questions attribution convention:** when writing open questions in block files, use
simple text conventions that compress will parse into structured objects:
- `EA stationIds for 4 sites — NEED BRIAN` (blocked on someone)
- `Build alert script? — owner: simon` (has an owner)
- `Should AMBER be split?` (no owner/blocker yet)

Keep it simple text — structure is extracted during `/collab compress`, not during save.

---

## `_final_summary.md` — Session Close Record

**Path:** `<session-folder>/_final_summary.md`
Written once by `/collab close`. Never modified. Same markdown format as `_summary.md`.

```markdown
---
closed_by: simon
closed_at: "2026-03-14T16:00:00Z"
total_saves: 5
participants:
  - simon
  - dan
---

## Starting point

[Same journey-style narrative as _summary.md — but this is the definitive
final version, written at close time as the best possible briefing for
future sessions that reference this one as prior art.]

## Phase 1 — ...

[Full phase narrative]

## Dead ends & pivots

[What was tried and abandoned]

## Key discoveries

[Surprises and aha moments]

## Final state

[What exists at close — the definitive inventory of artifacts, validated
results, and conclusions.]

## Decisions

- Flat-file-per-save: each save is a new uniquely-named file, never modified
- Two transports: drive (NAS/Dropbox) and mini-repo (dedicated git repo, push to main)
- Identity stored in ~/.claude/collab-identity.json, set with /collab whoami
- Collab root is never inside a project repo
- Compression is user-prompted, not automatic

## Open questions carried forward

- Auto-compression threshold: is 5 blocks the right trigger?
```
