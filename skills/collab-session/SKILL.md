---
name: collab-session
description: >
  Async collaborative brainstorming between multiple human+Claude pairs via a shared folder —
  write-once block files, assembly on read, no merge conflicts. Use when the user invokes any
  /collab subcommand, asks to start/join/share a brainstorm with a colleague, hand off a thread,
  catch up on what a teammate added, reflect on patterns across sessions, or browse session
  history. Supports network drive and dedicated mini-repo transports.
---

# Collab Session Skill

Enables teams of human+Claude pairs to brainstorm together — async or near-real-time — via a
shared folder. Each participant writes only their own uniquely-named files. The skill assembles
the full picture on join by reading all files in the session folder. No conflicts, no locking,
no data loss.

Two transport options, chosen once at `/collab init`:
- **Drive** — mounted network drive (NAS, SMB, NFS) or cloud sync folder (Dropbox, iCloud,
  OneDrive). Recommended for teams on the same network or with an existing sync setup.
- **Mini-repo** — a dedicated standalone git repo, separate from any project repo. Auto-commits
  and pushes to `main` on every save. Auto-pulls on join and refresh. No branches, no PRs.

## Before Any Command — Load the Right References

1. Read `references/schemas.md` for exact file formats before any read/write operation.
2. Read `references/git-ops.md` for the exact git commands used in mini-repo mode.
3. Read `references/commands/<subcommand>.md` for the step-by-step flow of the specific
   `/collab` subcommand being run. Each command file is self-contained — do not re-implement
   from memory.

## Timestamps

Always get the current time by running `date -u` via Bash. Never guess, estimate, or invent
timestamps. Claude has no internal clock — any timestamp not sourced from the system clock is
a hallucination and will be wrong. Compact form: `date -u +%Y%m%dT%H%M%SZ`.

---

## Folder Structure

```
<collab-root>/
├── _index.json                          ← workspace registry
│
├── skill-project/
│   ├── _patterns.md                     ← workspace-level cross-session patterns (/collab reflect)
│   │
│   ├── session-001_initial-design/      ← closed session
│   │   ├── _meta.json
│   │   ├── _summary.md
│   │   ├── _final_summary.md
│   │   ├── simon_20260314T140000Z.md
│   │   └── dan_20260314T141200Z.md
│   │
│   └── session-002_workspace-arch/      ← active session
│       ├── _meta.json
│       ├── _summary.md
│       ├── _files/                      ← conversation artifacts (mini-repo only)
│       │   └── src/model.py
│       ├── simon_20260314T142001Z.md
│       ├── dan_20260314T143512Z.md
│       └── simon_20260314T150033Z.md
│
└── risk-engine/
    └── session-001_compression/
        └── ...
```

**Collab root is NEVER inside a project repo.** It lives on a shared drive or in its own
standalone repo. This keeps it completely separate from project branches and PRs.

**Block files (`<name>_<timestamp>.md`) are write-once.** Never modified after creation.
Only `_summary.md`, `_meta.json`, and `_patterns.md` are ever updated.

---

## Identity — Set Once Per Machine

Identity is stored at `~/.claude/collab-identity.json` (`{"name": "simon"}`). Set or change
it with `/collab whoami [name]`. Every other command reads identity from this file. If it
doesn't exist, pause and prompt: "What's your name for collab sessions?" then run the set
flow before continuing. Name rules: lowercase, no spaces (hyphens ok). See
`references/commands/whoami.md`.

## Transport Config — Set Once Per Workspace Per Machine

Written to `~/.claude/collab-transport.json` by `/collab init`. See
`references/commands/init.md` for the full setup flow.

---

## Commands

Each subcommand has a dedicated reference file under `references/commands/`. Load the
matching file when the user invokes that subcommand — do not rely on memory of previous
sessions or this SKILL.md alone.

| Command | Purpose | Reference |
|---|---|---|
| `/collab whoami [name]` | Set or show your identity | `references/commands/whoami.md` |
| `/collab init <workspace>` | Set up shared workspace (drive or mini-repo) | `references/commands/init.md` |
| `/collab new <workspace> <topic>` | Start a new session on a focused topic | `references/commands/new.md` |
| `/collab list [workspace]` | Show active sessions and recent activity | `references/commands/list.md` |
| `/collab join <workspace> <topic>` | Load a session with narrative handoff brief | `references/commands/join.md` |
| `/collab save` | Write progress as a new block file | `references/commands/save.md` |
| `/collab compress` | Compress raw blocks into a journey summary | `references/commands/compress.md` |
| `/collab catchup [question]` | Tiered read-only search over recent activity | `references/commands/catchup.md` |
| `/collab history [range]` | Browse raw blocks behind the summary | `references/commands/history.md` |
| `/collab refresh` | Pull latest saves without full reload | `references/commands/refresh.md` |
| `/collab reflect <workspace>` | Extract cross-session patterns for a workspace | `references/commands/reflect.md` |
| `/collab close` | Finalise session with closing summary | `references/commands/close.md` |
| `/collab publish [workspace] [topic]` | Post summary to GitHub Discussions | `references/commands/publish.md` |

---

## Auto-Resume on Session Start

The plugin's SessionStart hook detects if the current working directory matches a known
workspace root and surfaces any active session via `systemMessage`:

> Active collab session: `skill-project / workspace-arch` — last saved 3h ago by Dan.
> Run `/collab join skill-project workspace-arch` to resume.

This replaces the cognitive load of remembering you had a session running. If the user
wants to resume they run `/collab join`; otherwise they ignore the message. The hook never
takes action on its own.

---

## Design Principles

**Write-once block files.** Every `/collab save` creates a new uniquely-named file and never
touches any existing one. Two people saving simultaneously produce two independent files —
neither knows or cares about the other. This eliminates every class of concurrent write conflict.

**Assembly on read.** The full session picture is only constructed at `/collab join` or
`/collab refresh`. At save time: write your file, update metadata, push if git. That's it.

**Collab root is infrastructure, not code.** It lives outside project repos deliberately.
Project repos have branches, PRs, and history that don't apply to conversation state.
The mini-repo is a dedicated single-purpose repo — always on main, always linear, always fast.

**Git in mini-repo mode is a transport, not a workflow.** No feature branches. No PRs.
No rebasing. Just: pull → write → commit → push. Colleagues pull to receive. The commit
history is a perfect audit log of who saved what and when.

**`_meta.json` is the only shared mutable file.** Low collision risk in practice — it's
small and structured. If a push fails because a colleague pushed since our last pull,
a quick pull-then-retry resolves it. Block files never conflict — only metadata can.

**Save fast, compress later.** Saves dump raw conversation turns with no summarisation —
speed and losslessness over polish. Compression is a separate deliberate step via
`/collab compress`, which reads raw blocks and produces a tight narrative summary.
This separation means saves are near-instant and no nuance is lost to over-eager extraction.

**Compression is a checkpoint, not a deletion.** `/collab compress` writes a narrative
summary to `_summary.md` but the raw block files are always preserved. The summary is an
acceleration layer for `/collab join`, not a replacement. Anyone can browse the original
raw blocks via `/collab history` at any time.

**Two layers of history.** Join loads: (1) the compressed summary (everything before the
last compress checkpoint) + (2) raw blocks since. This gives newcomers a fast brief plus
full fidelity on recent work. `/collab catchup` queries both layers interactively.
`/collab history` digs into raw blocks behind the summary when needed.

**Tiered retrieval for catchup.** `/collab catchup` defaults to a compact index (participant,
timestamp, one-line gist) across recent blocks. The user drills down with `/collab catchup
<id>` or a focused question. This keeps token cost low on long sessions — borrowed from
`claude-mem`'s staged retrieval pattern.

**Cross-session wikilinks.** Decisions that build on prior sessions reference them with
`[[session-NNN#phase-N]]` syntax in summaries. `/collab join` resolves these inline so a
joiner sees the lineage without hunting. Inspired by `claude-memory-compiler`'s Obsidian-style
knowledge graph.

**The handoff brief is the product.** Tight, narrative, actionable. Someone should be able
to dive into a session within 30 seconds of running `/collab join`. The `/collab compress`
step ensures the summary powering the brief is high quality.

---

## Transport Comparison

| | **Drive** | **Mini-repo** |
|---|---|---|
| Setup | Mount share, set path | Create repo, clone |
| Save | Write file | Write file + git push |
| Refresh | File watcher (instant) | git pull (seconds) |
| Conflict risk | None (unique filenames) | None (unique filenames) |
| Audit log | Folder timestamps | Full git history |
| Works offline | If cached | No (needs push/pull) |
| Best for | Same office / VPN | Distributed teams |
| Security | Inside network perimeter | Depends on git host |

---

## Example Lifecycle

```
# Each person — once, on their own machine
/collab whoami Simon     ← Simon's machine
/collab whoami Dan       ← Dan's machine

# Simon creates workspace (mini-repo mode)
/collab init skill-project
→ "mini-repo or drive?" → mini-repo
→ "remote URL?" → git@github.com:team/collab.git
→ pushes _index.json to main

# Dan sets up his end
/collab init skill-project
→ same remote URL → clones locally, ready

# Simon starts a session
/collab new skill-project workspace-arch
→ pushes session folder + _meta.json to main

# Dan lists active sessions
/collab list
→ pulls, sees workspace-arch is active

# Dan joins
/collab join skill-project workspace-arch
→ pulls, assembles blocks, shows handoff brief

# Both working — saves go to main continuously
/collab save    ← Simon writes simon_...Z.md, pushes (no pull needed)
/collab save    ← Dan writes dan_...Z.md, pushes (no conflict, unique filenames)

# Simon gets notified Dan saved, checks what Dan said
/collab catchup what did Dan say?
→ pulls, reads Dan's new blocks, answers the question

# Or just pull the latest without context reload
/collab refresh
→ pulls, shows new block summary

# After several saves, compress to create a checkpoint
/collab compress
→ reads all raw blocks, writes tight narrative to _summary.md

# Later, extract cross-session patterns for the workspace
/collab reflect skill-project
→ reads all closed sessions, writes recurring themes to _patterns.md

# Topic done
/collab close   ← writes _final_summary.md, pushes, marks closed
```
