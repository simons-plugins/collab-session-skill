# `/collab refresh`

Pull latest colleague saves without fully reloading the session. For near-real-time use —
run this when a file watcher or notification tells you someone just saved.

## Steps

1. Read transport config.
2. **If drive:** glob the session folder for any block files newer than the last known
   timestamp. Report new files found.
3. **If mini-repo:** `git pull origin main`. Report new commits pulled.
4. If new blocks found, summarise what changed:
   > Dan added 1 block (dan_20260314T151022Z.md):
   > — Decision: Auto-compression should be user-prompted, not automatic
   > — Open question: Should refresh be on a timer?
   > Type /collab join to fully reload context, or keep going with this summary.
5. If nothing new: > No new saves since last check.

## Tip for near-real-time

Run a folder/file watcher on the session folder and trigger `/collab refresh` when new
`*.md` block files appear. On drive, changes appear within seconds. On mini-repo, after a
colleague pushes, a periodic `git fetch` (e.g. every 60 seconds via a background script)
can trigger the refresh.
