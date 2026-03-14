---
name: collab-session
description: >
  This skill should be used when the user asks to "start a collab", "share this with a colleague",
  "hand off this brainstorm", "continue someone else's thread", "let my colleague pick this up",
  "what sessions are active", "join Dan's thread", "set up a shared workspace", "what did Dan say",
  "catch me up", "what happened in the session", "show me the history", or invokes any /collab
  command (whoami, init, new, list, join, save, compress, catchup, history, refresh, close).
  Enables async collaborative brainstorming between multiple human+Claude pairs via shared
  workspaces with write-once block files — no merge conflicts by design. Supports network drive
  and mini git repo transports.
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
│   │   ├── simon_20260314T140000Z.md
│   │   └── dan_20260314T141200Z.md
│   │
│   └── session-002_workspace-arch/      ← active session
│       ├── _meta.json
│       ├── _summary.json
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
Only `_summary.json` and `_meta.json` are ever updated.

---

## Identity — Set Once Per Machine

### `/collab whoami [name]`

With no argument — show current identity:
```
You are Simon.
Blocks you save will be named simon_<timestamp>.md.
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

Join loads two layers of history:
1. **Summary** (`_summary.json`) — compressed narrative of all blocks up to the last
   `/collab compress` checkpoint. This is the "story so far" in tight form.
2. **Raw blocks since** — all block files newer than the summary's
   `compressed_through_timestamp`, loaded verbatim in chronological order.

This means a fresh joiner gets a fast, high-quality briefing (the summary) plus full
fidelity on recent uncompressed work. Use `/collab catchup` to ask questions about
either layer. Use `/collab history` to dig into raw blocks behind the summary.

**Steps:**
1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main` — report how many new files were fetched:
   > Pulled 2 new blocks (dan_20260314T143512Z.md, dan_20260314T151022Z.md).
3. Resolve session folder from `_index.json`.
4. If `status = "closed"`: warn and offer read-only load or suggest `/collab new`.
5. Read `_meta.json` and `_summary.json`.
6. Glob all `<name>_<timestamp>.md` files. Sort by timestamp ascending.
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

Write this session's progress to a new block file. **Optimised for speed** — dumps raw
conversation turns with minimal processing. Never modifies any existing block file.

**Steps:**
1. Read identity and transport config.
2. Generate timestamp: ISO 8601 UTC compact — `20260314T142001Z`.
   Collision guard: if `<name>_<timestamp>.md` already exists, append `_2`, `_3`.
3. Dump raw conversation turns since last save (or full conversation if first save):
   - Write as markdown with YAML frontmatter — Claude's natural output format, no conversion
   - Use `## Human` and `## Claude` section headers for turns
   - Include all turns as-is — preserve the full exchange
   - Do NOT summarise, compress, or rewrite turns — speed over polish
   - Optionally add `## Decisions` and `## Open Questions` sections if obvious, but
     these are optional — omit rather than slow down the save
4. Write `<name>_<timestamp>.md` to session folder (see `references/schemas.md`).
5. Update `_meta.json`: participants list, last_save_by, last_save_at, total_saves,
   open_question_count.
6. **If mini-repo:**
   ```
   git add <block-file> _meta.json
   git commit -m "collab: <name> — <workspace>/<topic> block <N>"
   git push origin main
   ```
   Report: > Pushed to main. Colleagues will see this on their next join or refresh.

**No git pull on save.** Block files are uniquely named — there are never conflicts.
Pulling adds latency for no benefit. Pull only on read operations (join, catchup,
history, refresh, compress).
8. Confirm:
   > Saved: `simon_20260314T142001Z.md`
   > Session: <N> total saves from <participants>.

   If total_saves >= 10:
   > Getting long — consider `/collab close` when this topic wraps up.

   If more than 5 uncompressed blocks exist:
   > <N> uncompressed blocks — run `/collab compress` when ready.

---

### `/collab compress`

Deliberately compress raw blocks into a tight narrative summary. This is the **quality pass**
— separate from save so that saving stays fast and lossless.

**Steps:**
1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main` first.
3. Resolve the active session (or accept `<workspace> <topic>` arguments).
4. Read `_summary.json` to find `compressed_through_timestamp`.
5. Glob all block files newer than that timestamp (or all blocks if no prior compression).
6. Read each uncompressed block in chronological order.
7. Synthesise a tight narrative summary covering all blocks — including any already in
   `_summary.json`. The result replaces the existing summary, not appends.
   - Extract and consolidate **decisions** across all blocks
   - Extract and consolidate **open questions** — remove any that have been resolved
   - Compress filler, preserve reasoning and key exchanges
8. Rewrite `_summary.json` with the new narrative and update `compressed_through_timestamp`
   to the latest block's timestamp.
9. Update `_meta.json`: `open_question_count`.
10. **If mini-repo:**
    ```
    git add <session-folder>/_summary.json <session-folder>/_meta.json
    git commit -m "collab: compress — <workspace>/<topic>"
    git push origin main
    ```
11. Confirm:
    > Compressed <N> blocks into summary.
    > Decisions: <consolidated list>
    > Open questions: <consolidated list>
    > Raw blocks preserved — summary used for faster `/collab join`.

---

### `/collab catchup [question]`

Ask questions about the session without doing a full join. Useful mid-conversation to
check what colleagues have contributed, or to query specific topics.

**Examples:**
- `/collab catchup` — "What's happened since I last saved?"
- `/collab catchup what did Dan say about the API?`
- `/collab catchup any decisions on the data model?`
- `/collab catchup summarise Brian's blocks`

**Steps:**
1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main` silently.
3. Resolve the active session.
4. Read `_summary.json` and glob all block files newer than `compressed_through_timestamp`.
5. If a question was provided, search across the summary and recent blocks to answer it
   specifically. Filter by participant name if asked about a specific person.
6. If no question, provide a quick status:
   > **Since your last save:**
   > Dan saved 2 blocks (14:35, 15:10):
   > — Proposed using EA station IDs for the hydrology join
   > — Open question: should we store enriched data in ThamesWatch or separately?
   >
   > Brian saved 1 block (15:22):
   > — Confirmed stationIds are EA gauging station references
   > — Provided missing IDs for Kingston sites
7. Do NOT write any files. This is read-only.

---

### `/collab history [range]`

Browse raw blocks behind the summary — dig back into the full conversation history.
Useful when the summary compressed away detail that turns out to be important.

**Examples:**
- `/collab history` — list all blocks with timestamps and participants
- `/collab history 1-3` — show raw content of blocks 1 through 3
- `/collab history dan` — show all of Dan's blocks
- `/collab history before compress` — show blocks that were compressed into the summary

**Steps:**
1. Read transport config.
2. **If mini-repo:** `git pull origin main` silently.
3. Resolve the active session.
4. Glob all block files. Sort by timestamp ascending. Number them 1..N.
5. If no range specified, list all blocks as an index:
   ```
   ## Session History — 8 blocks

     1. simon_20260314T120500Z  — Simon  — 14 Mar 12:05  [compressed]
     2. dan_20260314T121200Z    — Dan    — 14 Mar 12:12  [compressed]
     3. simon_20260314T130000Z  — Simon  — 14 Mar 13:00  [compressed]
     ── compress checkpoint ──
     4. brian_20260314T140000Z  — Brian  — 14 Mar 14:00
     5. simon_20260314T143000Z  — Simon  — 14 Mar 14:30
     6. dan_20260314T150000Z    — Dan    — 14 Mar 15:00
   ```
   Mark blocks older than `compressed_through_timestamp` as `[compressed]` — their content
   is in the summary but the raw files are still available.
6. If a range, participant name, or `before compress` is specified, read and display the
   matching raw block files. Show the full turns content.
7. Do NOT write any files. This is read-only.

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
   > Dan added 1 block (dan_20260314T151022Z.md):
   > — Decision: Auto-compression should be user-prompted, not automatic
   > — Open question: Should refresh be on a timer?
   > Type /collab join to fully reload context, or keep going with this summary.
5. If nothing new: > No new saves since last check.

**Tip for near-real-time:** run a folder/file watcher on the session folder and trigger
`/collab refresh` when new `*.md` block files appear. On drive, changes appear within seconds.
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
small and structured. If a push fails because a colleague pushed since our last pull,
a quick pull-then-retry resolves it. Block files never conflict — only metadata can.

**Save fast, compress later.** Saves dump raw conversation turns with no summarisation —
speed and losslessness over polish. Compression is a separate deliberate step via
`/collab compress`, which reads raw blocks and produces a tight narrative summary.
This separation means saves are near-instant and no nuance is lost to over-eager extraction.

**Compression is a checkpoint, not a deletion.** When `/collab compress` runs, it writes a
narrative summary to `_summary.json` — but the raw block files are always preserved.
The summary is an acceleration layer for `/collab join`, not a replacement. Anyone can
browse the original raw blocks via `/collab history` at any time.

**Two layers of history.** Join loads: (1) the compressed summary (everything before the
last compress checkpoint) + (2) raw blocks since. This gives newcomers a fast brief plus
full fidelity on recent work. `/collab catchup` queries both layers interactively.
`/collab history` digs into raw blocks behind the summary when needed.

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
→ reads all raw blocks, writes tight narrative to _summary.json
→ future /collab join starts from this summary + any blocks after it

# Later, someone needs detail from before the compress
/collab history before compress
→ shows raw blocks that were compressed, full content preserved

# New person joins — gets summary + recent raw blocks
/collab join skill-project workspace-arch
→ fast brief from summary, then raw blocks since compress

# Topic done
/collab close   ← writes _final_summary.json, pushes, marks closed
```
