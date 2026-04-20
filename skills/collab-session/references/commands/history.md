# `/collab history [range]`

Browse raw blocks behind the summary — dig back into the full conversation history.
Useful when the summary compressed away detail that turns out to be important.
Read-only — never writes any files.

## Examples

- `/collab history` — list all blocks with timestamps and participants
- `/collab history 1-3` — show raw content of blocks 1 through 3
- `/collab history dan` — show all of Dan's blocks
- `/collab history before compress` — show blocks that were compressed into the summary

## Steps

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
