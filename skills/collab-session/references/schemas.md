# Collab Session — File Schemas

Metadata and summaries are JSON. Block files (raw saves) are **markdown with YAML frontmatter**
— markdown is Claude's natural output format, making saves near-instant with no conversion overhead.
Block files are **write-once** — never modified after creation. Only `_summary.json` and
`_meta.json` are ever updated.

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
  "open_question_count": 2
}
```

---

## `_summary.md` — Rolling Compressed Narrative

**Path:** `<session-folder>/_summary.md`
Rewritten during compression (user-confirmed, never automatic mid-save).
Represents all blocks up to the `compressed_through_timestamp` in its frontmatter.

The summary is a **journey-style narrative** in markdown — human-readable when browsing
the repo, and machine-parseable via YAML frontmatter for structured fields. This replaces
the old `_summary.json` format where the narrative was an unreadable escaped `\n` string.

```markdown
---
compressed_through_timestamp: "20260314T143512Z"
decisions:
  - "Flat-file-per-save: each save is a new uniquely-named file, never modified"
  - "Two transports: drive (NAS/Dropbox) and mini-repo (dedicated git repo, push to main)"
  - "Identity stored in ~/.claude/collab-identity.json, set with /collab whoami"
  - "Collab root is never inside a project repo"
open_questions:
  - "Auto-compression: trigger automatically or user-prompted?"
  - "Should /collab refresh be timer-based or purely manual?"
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
```

**Narrative body** follows this structure using markdown headings:
- **Starting point** — problem/goal and initial assumptions
- **Phase N — <name>** — chronological phases showing evolution of understanding
- **Dead ends & pivots** — what was tried and abandoned, and why
- **Key discoveries** — surprises and aha moments that changed direction
- **Current state** — what artifacts exist, what's been validated

**YAML frontmatter** holds structured fields for programmatic access:
- `compressed_through_timestamp` — latest block's timestamp
- `decisions` — consolidated, deduplicated list
- `open_questions` — unresolved items (resolved ones removed)

These fields are used by `/collab catchup` and `/collab join` for quick extraction
without parsing the full narrative.

When the file is empty (no frontmatter, no body), all block files are treated as
verbatim (no compression has happened yet).

**Migration:** If a session has `_summary.json` from before this change, read it
and treat identically — the JSON `summary` field maps to the markdown body, and
`compressed_through_timestamp`/`decisions`/`open_questions` map to frontmatter fields.
On next compress, write the new `_summary.md` format. The old `_summary.json` can be
left in place (harmless) or deleted.

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
`/collab compress`, which reads raw blocks and writes a tight narrative to `_summary.json`.

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

## `_final_summary.json` — Session Close Record

**Path:** `<session-folder>/_final_summary.json`
Written once by `/collab close`. Never modified.

```json
{
  "final_summary": "The session redesigned the collab skill from a single shared JSON file to a flat-file-per-save architecture. Each participant writes only their own uniquely-named files, eliminating all concurrent write conflicts. Two transport options were designed: drive mode (NAS or cloud sync, instant via file watcher) and mini-repo mode (dedicated git repo, push to main on every save). User identity is set once per machine via /collab whoami. The /collab refresh command was added for lightweight delta checks without full context reload. Key open question carried forward: whether compression should be auto-triggered or always user-prompted.",
  "closed_by": "simon",
  "closed_at": "2026-03-14T16:00:00Z",
  "total_saves": 5,
  "participants": ["simon", "dan"],
  "decisions_summary": [
    "Flat-file-per-save: each save is a new uniquely-named file, never modified",
    "Two transports: drive (NAS/Dropbox) and mini-repo (dedicated git repo, push to main)",
    "Identity stored in ~/.claude/collab-identity.json, set with /collab whoami",
    "Collab root is never inside a project repo",
    "Compression is user-prompted, not automatic"
  ],
  "open_questions_carried_forward": [
    "Auto-compression threshold: is 5 blocks the right trigger?"
  ]
}
```
