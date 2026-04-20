# `/collab save`

Write this session's progress to a new block file. **Optimised for speed** — dumps raw
conversation turns with minimal processing. Never modifies any existing block file.

## Steps

1. Read identity and transport config.
2. **Resolve the active session** from `_meta.json` in the current directory context, or
   ask if ambiguous.
3. **Dedup guard.** Read `_meta.json` `last_save_by` and `last_save_at`. If the most recent
   save was by the current identity and was within the last 30 seconds, prompt:
   > You saved 15s ago. **Append to the previous block, or write a new one?** [a/n]
   - **Append** — read the previous block, add a `---` divider and the new turns to the
     bottom, keep the original timestamp. This is the "I just double-tapped save" path.
   - **New** — proceed with step 4 as normal.

   If the most recent save was by someone else (even just seconds ago), skip the prompt
   and write a new block — we never modify other participants' files.

4. Generate timestamp by running `date -u +%Y%m%dT%H%M%SZ` via Bash.
   **NEVER guess or estimate the time — always use the system clock.**
   Claude has no internal clock; any timestamp not from `date` is a hallucination.
   Collision guard: if `<name>_<timestamp>.md` already exists, append `_2`, `_3`.

5. **Dump raw conversation turns** since last save (or full conversation if first save):
   - Write as markdown with YAML frontmatter — Claude's natural output format, no conversion.
   - Use `## Human` and `## Claude` section headers for turns.
   - Include all turns as-is — preserve the full exchange.
   - Do NOT summarise, compress, or rewrite turns — speed over polish.
   - **Honour `<private>...</private>` fences.** Any content the user wrapped in
     `<private>...</private>` during the conversation (in their messages or in files they
     asked not to share) is replaced with `[redacted by participant]` in the saved block.
     The fence itself is stripped. This is the "I shared a secret mid-brainstorm" guard.
     Err on the side of redacting — if in doubt, redact and tell the user.
   - Optionally add `## Decisions` and `## Open Questions` sections if obvious, but
     these are optional — omit rather than slow down the save.
   - For open questions, use simple text conventions that compress will parse:
     `EA stationIds for 4 sites — NEED BRIAN` (blocked on someone),
     `Build alert script? — owner: simon` (has an owner),
     `Should AMBER be split?` (no owner/blocker yet).
     To mark urgency, add `!high` or `!low` at the end: `NEED BRIAN !high`.
     Default is `medium` if unmarked. Structure is extracted during compress.

6. **Collect conversation artifacts** — files created or modified during this conversation
   that are relevant to the session (scripts, data files, configs, documents). Detect these
   by reviewing tool calls in the conversation (Write, Edit, Bash output mentioning file
   creation). List them with sizes.

   **If mini-repo mode:**
   - Show the file list and ask: "Include these files in the session? (colleagues will get
     them on join)" — let the user confirm, deselect, or skip.
   - Copy confirmed files into `<session-folder>/_files/` preserving relative paths from
     the working directory. E.g. `thameswatch-analysis/model_v3.py` →
     `_files/thameswatch-analysis/model_v3.py`.
   - **Size guardrails:** warn if any file >1MB, skip files >10MB with a note (user can
     override with explicit confirmation). Skip binary files unless explicitly requested.
   - Add a `## Files` section to the block listing each included file with a one-line
     description of what it is and why it matters.

   **If drive mode:**
   - Add a `## Files` section to the block with **local paths** (clickable file links) and
     one-line descriptions. Don't copy — drive users share filesystem access.
   - Example:
     ```
     ## Files
     - `thameswatch-analysis/traffic_light_model_v3.py` — site-specific prediction model
     - `thameswatch-analysis/walton_flow.csv` — 597 days EA flow data for station 3100TH
     ```

7. Write `<name>_<timestamp>.md` to session folder (see `references/schemas.md`).
8. Update `_meta.json`: participants list, last_save_by, last_save_at, total_saves,
   open_question_count.
9. **If mini-repo:**
   ```
   git add <block-file> _meta.json _files/
   git commit -m "collab: <name> — <workspace>/<topic> block <N>"
   git push origin main
   ```
   Report: > Pushed to main. Colleagues will see this on their next join or refresh.
   If files were included: > Included <N> files in `_files/` (<total size>).

   **No git pull on save.** Block files are uniquely named — there are never conflicts.
   Pulling adds latency for no benefit. Pull only on read operations (join, catchup,
   history, refresh, compress).

10. Confirm:
    > Saved: `simon_20260314T142001Z.md`
    > Session: <N> total saves from <participants>.

    If total_saves >= 10:
    > Getting long — consider `/collab close` when this topic wraps up.

    If more than 5 uncompressed blocks exist:
    > <N> uncompressed blocks — run `/collab compress` when ready.
