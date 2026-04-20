# `/collab init <workspace>`

Run once per workspace per machine. Colleagues joining an existing workspace also run
`/collab init <workspace>` — it detects the workspace already exists and just writes their
local transport config.

## Steps

1. Read identity (from `~/.claude/collab-identity.json`).
2. Ask: **"Drive or mini-repo?"**

   ### Drive
   "What's the path to your shared collab folder?"
   - Examples: `/Volumes/TeamNAS/collab`, `/mnt/teamshare/collab`, `~/Dropbox/team-collab`
   - Verify the path is reachable: `ls <path>` — warn if not mounted.
   - Write transport config to `~/.claude/collab-transport.json`:
     ```json
     { "mode": "drive", "root": "/Volumes/TeamNAS/collab" }
     ```

   ### Mini-repo
   "What's the git remote URL for the collab repo?"
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
