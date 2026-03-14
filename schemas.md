# Collab Session — File Schemas

All files are JSON. Block files (`<n>_<timestamp>.json`) are **write-once** — never modified
after creation. Only `_meta.json` and `_summary.json` are ever updated.

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

## `_summary.json` — Rolling Compressed Narrative

**Path:** `<session-folder>/_summary.json`
Rewritten during compression (user-confirmed, never automatic mid-save).
Represents all blocks up to `compressed_through_timestamp`.

```json
{
  "summary": "Simon and Claude explored the conflict problem with shared JSON and agreed to switch to one file per save per user, assembled on join. Simon proposed a dedicated mini git repo as an alternative to shared drives — auto-push to main on save, auto-pull on join, no branches or PRs. Both options documented. Dan joined and suggested storing user identity once per machine.",
  "compressed_through_timestamp": "20260314T143512Z"
}
```

When `summary` is empty and `compressed_through_timestamp` is null, all block files are
treated as verbatim (no compression has happened yet).

---

## `<name>_<timestamp>.json` — Block File (Write-Once)

**Path:** `<session-folder>/simon_20260314T142001Z.json`
**Filename:** `<identity-name>_<YYYYMMDDTHHmmssZ>.json`
**Collision guard:** append `_2`, `_3` if timestamp already exists for this user.

Written once by `/collab save`. Never modified.

```json
{
  "participant": "simon",
  "timestamp": "2026-03-14T14:20:01Z",
  "timestamp_compact": "20260314T142001Z",
  "workspace": "skill-project",
  "topic": "workspace-arch",
  "session_number": 2,
  "turns": [
    {
      "role": "human",
      "content": "We don't want to continually push to GitHub do we? What about network drives?"
    },
    {
      "role": "claude",
      "content": "Network drives work identically to cloud sync for this skill — flat-file-per-save means no locking issues. Proposed two transport modes: drive (NAS/Dropbox) and mini-repo (dedicated git repo, auto-push to main, no branches)."
    }
  ],
  "decisions": [
    "Collab root lives outside project repos — on a shared drive or in a dedicated mini git repo",
    "Mini-repo mode: auto-commit and push to main on every save, auto-pull on join",
    "Drive mode: NAS or cloud sync folder, file watcher for near-real-time notifications"
  ],
  "open_questions": [
    "Should /collab refresh be timer-based or purely manual?",
    "Auto-compression: trigger automatically or user-prompted?"
  ]
}
```

**Turns field:** meaningful compression of the conversation — not a verbatim transcript.
Preserve reasoning and key exchanges. Compress filler and repetition.

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
