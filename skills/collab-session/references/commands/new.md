# `/collab new <workspace> <topic>`

Start a fresh session on a focused topic. The topic becomes part of the folder name —
keep it short: `compression`, `api-design`, `naming`.

## Steps

1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main` before doing anything.
3. Ask: "What's the goal of this session in a sentence or two?"
4. Ask: "Continuing from a previous session? If so, which one?"
5. Determine next session number from `_index.json`.
6. Create session folder: `<root>/<workspace>/session-<NNN>_<topic>/`
7. Get current time via `date -u +%Y-%m-%dT%H:%M:%SZ` — use this for `created_at` fields.
   Create `_meta.json` and empty `_summary.md` (see `references/schemas.md`).
8. Update `_index.json`.
9. **If mini-repo:**
   ```
   git add . && git commit -m "collab: new session <workspace>/<topic>" && git push origin main
   ```
10. Confirm:
    > **<workspace> / <topic>** started (session-<NNN>).
    > Colleagues join with `/collab join <workspace> <topic>`.
