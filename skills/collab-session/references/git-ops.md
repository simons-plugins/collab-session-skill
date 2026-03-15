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

## When to Pull

**Pull ONLY on read operations:** `/collab join`, `/collab list`, `/collab catchup`,
`/collab history`, `/collab refresh`, `/collab compress`.

**NEVER pull on save.** Block files are uniquely named (`<name>_<timestamp>.md`) so there
are never write conflicts. Pulling on save adds latency for no benefit.

```bash
cd <root>
git pull origin main
```

Report the result to the user:
- `Already up to date.` → "No new saves from colleagues."
- `N files changed` → "Pulled N new files from colleagues." List new block filenames.

---

## After Write Operations

**For `/collab save` — commit the new block + updated metadata (NO pull first):**
```bash
cd <root>
git add <workspace>/session-<NNN>_<topic>/<n>_<timestamp>.md
git add <workspace>/session-<NNN>_<topic>/_meta.json
git commit -m "collab: <n> — <workspace>/<topic> block <N>"
git push origin main
```

Commit message format: `collab: <participant> — <workspace>/<topic> block <N>`
Example: `collab: simon — skill-project/workspace-arch block 3`

If `git push` fails due to remote changes (rare), pull and push again — block files
never conflict, only `_meta.json` might need a trivial merge.

**For `/collab compress` — pull first, then commit:**
```bash
cd <root>
git pull origin main
git add <workspace>/session-<NNN>_<topic>/_summary.md
git add <workspace>/session-<NNN>_<topic>/_meta.json
git commit -m "collab: compress — <workspace>/<topic>"
git push origin main
```

**For `/collab new`:**
```bash
git add <workspace>/session-<NNN>_<topic>/
git commit -m "collab: new session — <workspace>/<topic>"
git push origin main
```

**For `/collab close`:**
```bash
git add <workspace>/session-<NNN>_<topic>/_final_summary.md
git add <workspace>/session-<NNN>_<topic>/_meta.json
git add _index.json
git commit -m "collab: close — <workspace>/<topic>"
git push origin main
```

---

## Push Failure on Save

If `git push` fails because a colleague pushed since our last pull:

```
1. git pull origin main        ← pull their changes
2. Resolve _meta.json if needed (block files never conflict)
3. git push origin main        ← retry push
```

If `_meta.json` conflicts (rare — requires two saves at nearly the same instant):
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
ls -lt <workspace>/session-<NNN>_<topic>/*.md

# See what a specific block contains
cat <workspace>/session-<NNN>_<topic>/dan_20260314T143512Z.md
```

---

## Repo Hygiene

- Never create branches
- Never use `git rebase`
- Never force-push
- `.gitignore` should exclude nothing — all collab files should be tracked
- Recommended `.gitignore` for the collab repo: empty, or just `.DS_Store`
