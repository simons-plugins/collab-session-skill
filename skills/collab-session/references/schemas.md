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
  "root": "/Volumes/TeamNAS/collab"
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
  "open_questions": [
    "Auto-compression: trigger automatically or user-prompted?",
    "Should /collab refresh be timer-based or purely manual?"
  ]
}
```

The `open_questions` array is the **quick-glance list** of what's still needed. Updated on
every `/collab save` (from the block's `## Open Questions` section) and `/collab compress`
(consolidated and deduplicated). This means a collaborator browsing the repo can open
`_meta.json` to see session status AND outstanding questions without reading the full summary.

`open_question_count` is kept for backwards compatibility and quick display in `/collab list`.

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

## Starting point

We set out to eliminate merge conflicts in shared brainstorming sessions.

## Phase 1 — Shared JSON (abandoned)

Started with a single shared session.json file. Immediately hit concurrent write conflicts
when two people saved near-simultaneously. Tried file locking but it was fragile across
NAS mounts.

## Phase 2 — Flat file per save

Simon proposed write-once block files with unique names (<user>_<timestamp>.md). This
eliminates conflicts entirely — two simultaneous saves just create two files. Tested with
network drive and confirmed no issues.

## Phase 3 — Transport layer

Simon proposed adding git as an alternative to shared drives. Dan joined and pointed out
that identity should be per-machine, not per-save — avoids re-asking every time. Both
agreed the collab folder must live outside project repos.

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

- Flat-file-per-save: each save is a new uniquely-named file, never modified
- Two transports: drive (NAS/Dropbox) and mini-repo (dedicated git repo, push to main)
- Identity stored in ~/.claude/collab-identity.json, set with /collab whoami
- Collab root is never inside a project repo

## Open questions

- Auto-compression: trigger automatically or user-prompted?
- Should /collab refresh be timer-based or purely manual?
```

**Structure:**
- **YAML frontmatter** — only `compressed_through_timestamp` (true metadata, not content)
- **Narrative body** — journey-style headings: Starting point, Phase N, Dead ends, Key
  discoveries, Current state
- **Decisions** — consolidated bullet list as a `## Decisions` section
- **Open questions** — unresolved items as a `## Open questions` section (resolved ones
  removed during compress)

Decisions and open questions are in the markdown body (not frontmatter) so they render
properly on GitHub. The same lists are also kept in `_meta.json` for programmatic access
by `/collab catchup`, `/collab join`, and `/collab list`.

When the file is empty (no frontmatter, no body), all block files are treated as
verbatim (no compression has happened yet).

**Migration from `_summary.json`:** If a session has the old JSON format, read it and
treat identically — the `summary` field maps to the markdown body, structured fields
map to the corresponding sections. On next compress, write `_summary.md`. The old
JSON file can be left in place (harmless) or deleted.

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
