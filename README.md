# Collab Session

Async collaborative brainstorming between multiple human+Claude pairs. Each participant works in their own Claude Code session, saving progress to a shared workspace. No merge conflicts by design.

## How it works

Two people (each with their own Claude Code session) work on the same topic asynchronously. Every `/collab save` writes a uniquely-named markdown file — nobody edits anyone else's files. When a colleague runs `/collab join`, all files are assembled into a narrative handoff brief so they can pick up where you left off.

```
Simon + Claude                         Dan + Claude
     │                                      │
     ├─ /collab save                        │
     │  → simon_20260314T142001Z.md         │
     │  → git push                          │
     │                                      │
     │                    /collab join ──────┤
     │                    ← git pull         │
     │                    ← assembles brief  │
     │                                      │
     │                        /collab save ──┤
     │                        → dan_...Z.md  │
     │                        → git push     │
     │                                      │
     ├─ /collab refresh                     │
     │  ← sees Dan's new block              │
```

## Install

```bash
claude plugin add AI-Collab-Skill/collab-session-skill
```

## Quick start

```bash
# 1. Set your identity (once per machine)
/collab whoami simon

# 2. Set up a shared workspace (once per team)
/collab init my-project
# Choose: drive (network/cloud folder) or mini-repo (dedicated git repo)

# 3. Start a session
/collab new my-project api-design
# Answer: goal, prior session?

# 4. Brainstorm with Claude, then save
/collab save

# 5. Colleague joins from their machine
/collab join my-project api-design
# Gets a narrative handoff brief, picks up where you left off
```

## Commands

| Command | Description |
|---------|-------------|
| `/collab whoami [name]` | Set or show your identity |
| `/collab init <workspace>` | Set up shared workspace (drive or mini-repo) |
| `/collab new <workspace> <topic>` | Start a new session |
| `/collab list [workspace]` | Show active sessions and recent activity |
| `/collab join <workspace> <topic>` | Load a session with narrative handoff brief |
| `/collab save` | Save progress as a new block file |
| `/collab compress` | Compress raw blocks into a tight summary |
| `/collab catchup [question]` | Tiered read-only search over recent activity |
| `/collab history [range]` | Browse raw blocks behind the summary |
| `/collab refresh` | Pull latest saves without full reload |
| `/collab reflect <workspace>` | Extract cross-session patterns into `_patterns.md` |
| `/collab close` | Finalise session with closing summary |
| `/collab publish [workspace] [topic]` | Post summary to GitHub Discussions |

## Transport options

Chosen once at `/collab init`:

**Drive** — mounted network drive (NAS, SMB) or cloud sync folder (Dropbox, iCloud, OneDrive). Changes appear within seconds via file system.

**Mini-repo** — a dedicated standalone git repo (not your project repo). Auto-commits and pushes to `main` on every save. No branches, no PRs — git is just a transport layer.

| | Drive | Mini-repo |
|---|---|---|
| Setup | Mount share, set path | Create repo, clone |
| Save speed | Instant | ~2s (commit + push) |
| Conflict risk | None | None |
| Audit log | Folder timestamps | Full git history |
| Best for | Same network / VPN | Distributed teams |

## Architecture

```
~/.claude/collab-identity.json     ← your name (per machine)
~/.claude/collab-transport.json    ← drive path or git remote (per machine)

<collab-root>/                     ← shared folder or git repo
├── _index.json                    ← workspace registry
└── my-project/
    └── session-001_api-design/
        ├── _meta.json             ← session metadata (mutable)
        ├── _summary.json          ← compressed narrative (updated by /compress)
        ├── simon_20260314T142001Z.md   ← block file (write-once)
        └── dan_20260314T143512Z.md     ← block file (write-once)
```

**Block files are markdown** with YAML frontmatter — Claude's natural output format. Raw conversation turns dumped as-is for speed. No JSON wrapping, no conversion overhead.

**Save fast, compress later.** `/collab save` dumps raw turns instantly. `/collab compress` is a separate quality pass that reads all blocks and writes a tight narrative to `_summary.json`.

**Two layers of history.** `/collab join` loads the compressed summary (everything before the last compress checkpoint) plus raw blocks since. Fast brief for newcomers, full fidelity on recent work.

## Design principles

- **Write-once block files** — saves never touch existing files. Two people saving simultaneously produce two independent files.
- **Assembly on read** — the full picture is only constructed at join/refresh time.
- **No pull on save** — block files are uniquely named so there are never conflicts. Pulling adds latency for no benefit.
- **Compression is a checkpoint, not a deletion** — raw blocks are always preserved. The summary is an acceleration layer.
- **Collab root is infrastructure, not code** — it lives outside project repos, in its own dedicated space.
- **Tiered retrieval** — `/collab catchup` starts with a compact index of recent blocks and only loads full content on demand. Keeps token cost bounded on long sessions.
- **Cross-session wikilinks** — summaries reference prior sessions with `[[session-NNN#phase-N]]` so lineage is visible without reloading history. `/collab reflect` aggregates patterns across 2+ closed sessions into `_patterns.md`.

## Privacy and safety

Participants can wrap sensitive content in `<private>...</private>` fences in any message or file. On `/collab save`, the skill replaces each fenced region with `[redacted by participant]` in the block file — the original never hits disk. Use this for secrets shared mid-brainstorm.

Open questions support impact levels — `!high`, `!medium`, `!low` — so `/collab list` and the join handoff brief can flag high-impact blockers prominently.

## Auto-resume on launch

A SessionStart hook surfaces any active collab sessions you've participated in (last 7 days). No auto-pull, no auto-write — just a nudge:

```
Active collab sessions you've participated in:
  • skill-project / workspace-arch — last saved 3h ago by dan · 2 open
Resume with `/collab join <workspace> <topic>` or list with `/collab list`.
```

A matching SessionEnd hook reminds you to `/collab save` if you have an active session you haven't contributed to in the last 2 hours.

## Plugin structure

```
collab-session-skill/
├── .claude-plugin/
│   ├── plugin.json                ← version, name, description
│   └── marketplace.json           ← marketplace metadata
├── commands/
│   └── collab.md                  ← /collab command entry point
├── hooks/
│   ├── hooks.json                 ← hook registration
│   ├── check-update.js            ← version check on launch
│   ├── active-session-check.js    ← auto-resume nudge on launch
│   └── save-nudge.js              ← save reminder on session end
└── skills/
    └── collab-session/
        ├── SKILL.md                ← skill overview, design principles, command index
        └── references/
            ├── schemas.md          ← file format definitions
            ├── git-ops.md          ← exact git commands for mini-repo mode
            └── commands/           ← per-subcommand step-by-step flows
                ├── whoami.md
                ├── init.md
                ├── new.md
                ├── list.md
                ├── join.md
                ├── save.md
                ├── compress.md
                ├── catchup.md
                ├── history.md
                ├── refresh.md
                ├── reflect.md
                ├── close.md
                └── publish.md
```

## License

MIT
