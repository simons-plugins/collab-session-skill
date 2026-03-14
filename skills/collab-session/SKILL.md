---
name: collab-session
description: >
  This skill should be used when the user asks to "start a collab", "share this with a colleague",
  "hand off this brainstorm", "continue someone else's thread", "let my colleague pick this up",
  "what sessions are active", "join Dan's thread", "set up a shared workspace", or invokes any
  /collab command (whoami, init, new, list, join, save, refresh, close). Enables async collaborative
  brainstorming between multiple human+Claude pairs via shared workspaces with write-once block
  files — no merge conflicts by design. Supports network drive and mini git repo transports.
---

# Collab Session Skill

Enables teams of human+Claude pairs to brainstorm together — async or near-real-time — via a
shared folder. Each participant writes only their own uniquely-named files. The skill assembles
the full picture on join by reading all files in the session folder. No conflicts, no locking,
no data loss.

Two transport options — chosen once at `/collab init`:
- **Drive** — mounted network drive (NAS, SMB, NFS) or cloud sync folder (Dropbox, iCloud,
  OneDrive). Recommended for teams on the same network or with an existing sync setup.
- **Mini-repo** — a dedicated standalone git repo, separate from any project repo. Auto-commits
  and pushes to `main` on every save. Auto-pulls on join and refresh. No branches, no PRs.

Read `references/schemas.md` for exact file formats before any read/write operation.
Read `references/git-ops.md` for the exact git commands used in mini-repo mode.

---

## Folder Structure

```
<collab-root>/
├── _index.json                          ← workspace registry
│
├── skill-project/
│   ├── session-001_initial-design/      ← closed session
│   │   ├── _meta.json
│   │   ├── _summary.json
│   │   ├── _final_summary.json
│   │   ├── simon_20260314T140000Z.json
│   │   └── dan_20260314T141200Z.json
│   │
│   └── session-002_workspace-arch/      ← active session
│       ├── _meta.json
│       ├── _summary.json
│       ├── simon_20260314T142001Z.json
│       ├── dan_20260314T143512Z.json
│       └── simon_20260314T150033Z.json
│
└── risk-engine/
    └── session-001_compression/
        └── ...
```

**Collab root is NEVER inside a project repo.** It lives on a shared drive or in its own
standalone repo. This keeps it completely separate from project branches and PRs.

**Block files (`<name>_<timestamp>.json`) are write-once.** Never modified after creation.
Only `_summary.json` and `_meta.json` are ever updated.

---

## Identity — Set Once Per Machine

### `/collab whoami [name]`

With no argument — show current identity:
```
You are Simon.
Blocks you save will be named simon_<timestamp>.json.
Change with: /collab whoami <new-name>
```

With a name — set or update:
1. Write `{"name": "Simon"}` to `~/.claude/collab-identity.json`.
2. Confirm: > Identity set to **Simon**. Stored at `~/.claude/collab-identity.json`.

**Every other command reads identity from this file.** If it doesn't exist, pause and prompt:
"What's your name for collab sessions?" then run the set flow before continuing.

Name rules: lowercase, no spaces (use hyphens). E.g. `simon`, `dan`, `simon-home`.
This becomes part of filenames so keep it consistent across machines.

---

## Setup

### `/collab init <workspace>`

Run once per workspace. Colleagues don't repeat this.

**Steps:**
1. Read identity.
2. Ask: **"Drive or mini-repo?"**

   **Drive:** "What's the path to your shared collab folder?"
   - Examples: `/Volumes/TeamNAS/collab`, `/mnt/teamshare/collab`, `~/Dropbox/team-collab`
   - Verify the path is reachable: `ls <path>` — warn if not mounted.
   - Write transport config to `~/.claude/collab-transport.json`:
     ```json
     { "mode": "drive", "root": "/Volumes/TeamNAS/collab" }
     ```

   **Mini-repo:** "What's the git remote URL for the collab repo?"
   - Must be a dedicated repo, not a project repo.
   - If repo doesn't exist yet, offer to create it: `git init`, `git remote add origin <url>`.
   - Clone or confirm local clone exists at a sensible local path (e.g. `~/collab-repo`).
   - Write transport config:
     ```json
     { "mode": "git", "root": "~/collab-repo", "remote": "origin", "branch": "main" }
     ```
   - Confirm the repo is on `main` and has no other branches: `git checkout main`.

3. Create `<root>/<workspace>/` folder.
4. If `<root>/_index.json` doesn't exist, create it (see `references/schemas.md`).
5. Add workspace entry to `_index.json`.
6. **If mini-repo:** auto-commit and push:
   `git add . && git commit -m "collab: init workspace <workspace>" && git push origin main`
7. Confirm:
   > Workspace **<workspace>** ready.
   > Transport: <drive path | git remote>.
   > Share the transport details with colleagues — they set it up with `/collab init <workspace>`.

**Colleagues joining an existing workspace** run `/collab init <workspace>` too — it detects
the workspace already exists, just writes their local transport config and confirms they're connected.

---

## Commands

### `/collab new <workspace> <topic>`

Start a fresh session on a focused topic.
Topic becomes part of the folder name — keep it short: `compression`, `api-design`, `naming`.

**Steps:**
1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main` before doing anything.
3. Ask: "What's the goal of this session in a sentence or two?"
4. Ask: "Continuing from a previous session? If so, which one?"
5. Determine next session number from `_index.json`.
6. Create session folder: `<root>/<workspace>/session-<NNN>_<topic>/`
7. Create `_meta.json` and empty `_summary.json` (see `references/schemas.md`).
8. Update `_index.json`.
9. **If mini-repo:** `git add . && git commit -m "collab: new session <workspace>/<topic>" && git push origin main`
10. Confirm:
    > **<workspace> / <topic>** started (session-<NNN>).
    > Colleagues join with `/collab join <workspace> <topic>`.

---

### `/collab list [workspace]`

Front door for the team. Shows what's active and who last touched it.

**Steps:**
1. Read transport config.
2. **If mini-repo:** `git pull origin main` silently before reading.
3. Read `_index.json` and each active session's `_meta.json`.
4. Format — active first, closed dimmed:

```
## Collab Workspaces  [transport: /Volumes/TeamNAS/collab]

### skill-project
  ● 002  workspace-arch      "Redesign with flat-file blocks"
         Simon · Dan  ·  3 saves  ·  14 min ago  ·  2 open questions
  ○ 001  initial-design      [closed]

### risk-engine
  ● 001  compression         "Summarise without losing signal"
         Dan  ·  1 save  ·  2h ago  ·  1 open question
```

5. > Join: `/collab join <workspace> <topic-or-number>`
   > New topic: `/collab new <workspace> <topic>`

---

### `/collab join <workspace> <topic-or-number>`

Load a session as a new participant or resume your own.
This is the primary entry point for picking up a colleague's thread.

**Steps:**
1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main` — report how many new files were fetched:
   > Pulled 2 new blocks (dan_20260314T143512Z.json, dan_20260314T151022Z.json).
3. Resolve session folder from `_index.json`.
4. If `status = "closed"`: warn and offer read-only load or suggest `/collab new`.
5. Read `_meta.json` and `_summary.json`.
6. Glob all `<name>_<timestamp>.json` files. Sort by timestamp ascending.
   Identify which are newer than `_summary.compressed_through_timestamp` — these are
   "recent verbatim" blocks. Older ones are already in the summary narrative.
7. Build context: goal → summary → recent verbatim blocks in chronological order.
8. Present **handoff brief** — narrative, never a raw dump:

```
## skill-project / workspace-arch  (session-002)
**Goal:** Redesign collab to use flat files per save, eliminating merge conflicts.

**Story so far:**
Simon and Claude explored the conflict problem with shared JSON and agreed to switch to one
file per save per user, assembled on join. Dan joined and proposed storing identity once per
machine rather than re-asking each save. Both agreed the collab root should live outside any
project repo — on a network drive or in a dedicated mini git repo.

**Decisions made:**
- Each save writes a new uniquely-named file; existing files never touched
- Identity stored in ~/.claude/collab-identity.json, set once with /collab whoami
- Collab root is never inside a project repo

**Open questions:**
- Auto-compression: trigger automatically or user-prompted?
- Should /collab refresh be timed or manual?

**Contributors:** Simon (2 saves) · Dan (1 save)
**Last save:** Dan · 3 min ago
```

9. Ask: "Ready to pick up? Anything to add before we dive in?"
10. Continue brainstorm naturally. Remind them to `/collab save` before handing off.

---

### `/collab save`

Write this session's progress to a new block file. Never modifies any existing file.

**Steps:**
1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main` first — surface any new colleague blocks:
   > Dan saved 1 new block while you were working. It's included in the session context.
   Then silently incorporate any new blocks into awareness before extracting the current turn.
3. Ask: "Anything specific to flag — decisions, open questions?" (can say "just extract it").
4. Generate timestamp: ISO 8601 UTC compact — `20260314T142001Z`.
   Collision guard: if `<name>_<timestamp>.json` already exists, append `_2`, `_3`.
5. Extract from conversation since last save (or full conversation if first save):
   - Meaningful turn summaries — not verbatim transcript, preserve reasoning
   - **Decisions**: concrete conclusions
   - **Open questions**: unresolved threads
6. Write `<name>_<timestamp>.json` to session folder (see `references/schemas.md`).
7. Update `_meta.json`: participants list, last_save_by, last_save_at, total_saves,
   open_question_count.
8. **Compression check** — if more than 5 block files exist newer than
   `_summary.compressed_through_timestamp`, offer:
   > "5 uncompressed blocks — want me to rewrite the summary? (~20 seconds)"
   If yes: read all uncompressed blocks, rewrite `_summary.json` as a tight narrative,
   update `compressed_through_timestamp`.
9. **If mini-repo:**
   ```
   git add <block-file> _meta.json [_summary.json if rewritten]
   git commit -m "collab: <name> — <workspace>/<topic> block <N>"
   git push origin main
   ```
   Report: > Pushed to main. Colleagues will see this on their next join or refresh.
10. Confirm:
    > Saved: `simon_20260314T142001Z.json`
    > Decisions: <list>
    > Open questions: <list>
    > Session: <N> total saves from <participants>.

    If total_saves >= 10:
    > Getting long — consider `/collab close` when this topic wraps up.

---

### `/collab refresh`

Pull latest colleague saves without fully reloading the session. For near-real-time use —
run this when a file watcher or notification tells you someone just saved.

**Steps:**
1. Read transport config.
2. **If drive:** glob the session folder for any block files newer than the last known timestamp.
   Report new files found.
3. **If mini-repo:** `git pull origin main`. Report new commits pulled.
4. If new blocks found: summarise what changed:
   > Dan added 1 block (dan_20260314T151022Z.json):
   > — Decision: Auto-compression should be user-prompted, not automatic
   > — Open question: Should refresh be on a timer?
   > Type /collab join to fully reload context, or keep going with this summary.
5. If nothing new: > No new saves since last check.

**Tip for near-real-time:** run a folder/file watcher on the session folder and trigger
`/collab refresh` when new `*.json` files appear. On drive, changes appear within seconds.
On mini-repo, after a colleague pushes, a periodic `git fetch` (e.g. every 60 seconds via
a background script) can trigger the refresh.

---

### `/collab close`

Finalise the session. Freeze it as a permanent reference.

**Steps:**
1. Offer a final `/collab save` first.
2. **If mini-repo:** `git pull origin main` to ensure nothing is missed.
3. Write `_final_summary.json` to the session folder — complete narrative: what was explored,
   decided, left open, what the next session should know. Best possible briefing for the future.
4. Update `_meta.json`: `status: "closed"`, `closed_at`, `closed_by`.
5. Update `_index.json`: mark session closed.
6. **If mini-repo:**
   ```
   git add .
   git commit -m "collab: close <workspace>/<topic>"
   git push origin main
   ```
7. Confirm:
   > **<workspace> / <topic>** closed. <N> blocks from <participants> preserved.
   > To continue: `/collab new <workspace> <next-topic>`
   > Reference session-<NNN> as prior art when prompted.

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
small and structured. On mini-repo, the pull-before-save step means conflicts are rare;
if they occur on the metadata fields (not block content), `git mergetool` resolves trivially.

**Extract, don't transcribe.** Blocks are meeting notes, not chat logs. Compress filler,
preserve reasoning, always explicitly capture decisions and open questions.

**The handoff brief is the product.** Tight, narrative, actionable. Someone should be able
to dive into a session within 30 seconds of running `/collab join`.

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
/collab save    ← Simon writes simon_...Z.json, pushes
/collab save    ← Dan writes dan_...Z.json, pushes (no conflict)

# Simon gets notified Dan saved, refreshes
/collab refresh
→ pulls, shows Dan's new block summary without full context reload

# Topic done
/collab close   ← writes _final_summary.json, pushes, marks closed
```
