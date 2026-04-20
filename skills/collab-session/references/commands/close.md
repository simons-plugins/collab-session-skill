# `/collab close`

Finalise the session. Freeze it as a permanent reference.

## Steps

1. Offer a final `/collab save` first.
2. **If mini-repo:** `git pull origin main` to ensure nothing is missed.
3. Write `_final_summary.md` to the session folder — complete narrative: what was explored,
   decided, left open, what the next session should know. Best possible briefing for the
   future. Preserve any `[[session-NNN#phase-N]]` wikilinks from `_summary.md` so the
   lineage remains traceable.
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

## After close

Once ~3+ sessions in a workspace are closed, suggest:
> Consider `/collab reflect <workspace>` to extract cross-session patterns.
