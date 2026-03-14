# Collab Session — Git Operations (Mini-Repo Mode)

Exact git commands for each operation. Always run from the local clone root (`transport.root`).
Always on `main`. No branches. No PRs. No rebasing.

---

## Setup (first time, `/collab init`)

```bash
# If repo doesn't exist yet — create and push empty structure
git init <local-path>
cd <local-path>
git checkout -b main
git remote add origin <remote-url>
echo '{}' > .gitkeep
git add .gitkeep
git commit -m "collab: init repo"
git push -u origin main

# If repo already exists — clone
git clone <remote-url> <local-path>
cd <local-path>
git checkout main
```

---

## Before Any Read Operation (`/collab list`, `/collab join`, `/collab refresh`)

```bash
cd <root>
git pull origin main
```

Report the result to the user:
- `Already up to date.` → "No new saves from colleagues."
- `N files changed` → "Pulled N new files from colleagues." List new block filenames.

---

## After Any Write Operation (`/collab new`, `/collab save`, `/collab close`)

**For `/collab save` — commit only the new block + updated metadata:**
```bash
cd <root>
git add <workspace>/session-<NNN>_<topic>/<n>_<timestamp>.json
git add <workspace>/session-<NNN>_<topic>/_meta.json
# Only if compression ran:
git add <workspace>/session-<NNN>_<topic>/_summary.json
git commit -m "collab: <n> — <workspace>/<topic> [block <N>]"
git push origin main
```

Commit message format: `collab: <participant> — <workspace>/<topic> [block <N>]`
Example: `collab: simon — skill-project/workspace-arch [block 3]`

**For `/collab new`:**
```bash
git add <workspace>/session-<NNN>_<topic>/
git commit -m "collab: new session — <workspace>/<topic>"
git push origin main
```

**For `/collab close`:**
```bash
git add <workspace>/session-<NNN>_<topic>/_final_summary.json
git add <workspace>/session-<NNN>_<topic>/_meta.json
git add _index.json
git commit -m "collab: close — <workspace>/<topic>"
git push origin main
```

---

## Pull-Before-Save Race Condition

Mini-repo mode does a `git pull origin main` at the start of `/collab save`. This ensures
any colleague blocks saved since the last pull are incorporated before extracting the current
turn. Workflow:

```
1. git pull origin main
2. If new blocks: surface them to the user ("Dan saved 1 block while you were working")
3. Incorporate new block content into awareness
4. Write new block file
5. git add / commit / push
```

If `git pull` surfaces a conflict on `_meta.json` (rare — requires two people saving at
almost exactly the same time):
- Run `git checkout --theirs _meta.json` to take the remote version as base
- Re-apply local changes (last_save_by, last_save_at, total_saves) on top
- This is safe because block files never conflict — only metadata can

---

## Refresh Without Full Reload (`/collab refresh`)

```bash
cd <root>
git fetch origin main
git log HEAD..origin/main --name-only --pretty=format:""
```

This shows which files changed on remote without merging yet. Surface the list to the user,
then:
```bash
git pull origin main
```

The user decides whether to `/collab join` for a full context reload or just carry on
informed by the refresh summary.

---

## Useful Diagnostics

```bash
# See who saved what and when
git log --oneline --all

# See all block files for a session
ls -lt <workspace>/session-<NNN>_<topic>/*.json

# See what a specific block contains
cat <workspace>/session-<NNN>_<topic>/dan_20260314T143512Z.json
```

---

## Repo Hygiene

- Never create branches
- Never use `git rebase`
- Never force-push
- `.gitignore` should exclude nothing — all collab files should be tracked
- Recommended `.gitignore` for the collab repo: empty, or just `.DS_Store`
