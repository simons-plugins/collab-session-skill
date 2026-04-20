# `/collab catchup [question]`

Ask questions about the session without doing a full join. Useful mid-conversation to
check what colleagues have contributed, or to query specific topics. Read-only — never
writes any files.

## Tiered retrieval — keep token cost low

Catchup follows a three-stage retrieval pattern borrowed from `claude-mem`. Start compact,
drill down on demand.

1. **Search (default, cheap)** — the response format is a compact index of recent blocks:
   one line per block with id, participant, timestamp, and a one-line gist extracted from
   the block's first paragraph or `## Decisions` header. ~50-100 tokens per block.

2. **Timeline (medium)** — the user can ask "timeline for dan" or "timeline around the EA
   station decision" — returns a chronological sequence of gists filtered by participant,
   topic, or ID range. Still no full block content.

3. **Get (expensive, explicit)** — the user asks `/collab catchup get <block-id>` or a
   full-text question that cannot be answered from gists alone. Load and read full block
   content for those IDs only.

Default behaviour when the user runs `/collab catchup` with no args: **search**. Escalate
only when the question requires it.

## Examples

- `/collab catchup` — search-style index of new activity since last save
- `/collab catchup what did Dan say about the API?` — search gists; if no match, escalate
  to reading Dan's blocks
- `/collab catchup any decisions on the data model?` — read `_summary.md` `## Decisions`
  and recent block `## Decisions` sections; return list with attribution
- `/collab catchup summarise Brian's blocks` — full read (Brian's blocks only)
- `/collab catchup what has brian contributed?` — filter blocks by participant, summarise
  contributions across all phases
- `/collab catchup what's blocked on me?` — read `_meta.json` `open_questions`, filter by
  `blocked_on == current identity`; sort by `impact` (high first)
- `/collab catchup what needs simon?` — filter `open_questions` by both `blocked_on` and
  `owner` for the named person
- `/collab catchup get dan_20260314T143512Z` — explicit full-block load

## Steps

1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main` silently.
3. Resolve the active session.
4. Read `_summary.md` and glob all block files newer than `compressed_through_timestamp`.
5. **Default (no question)** — print search-style index:
   ```
   Since your last save (3 new blocks):

     dan_20260314T143512Z   Dan    14:35  Proposed EA station IDs for hydrology join
     brian_20260314T150022Z Brian  15:00  Confirmed stationIds are EA gauging refs
     dan_20260314T151022Z   Dan    15:10  Opened question: store enriched data separately?

   Drill down: /collab catchup get <id>  |  /collab catchup <question>
   ```

6. **With a question** — try to answer from gists + `_summary.md` first. Only load full
   block content if the question can't be answered from the compact layer.
   - Filter by participant name if asked about a specific person.
   - For "what has X contributed?" queries: filter blocks by participant, summarise
     contributions across all phases.
   - For "what's blocked on me/X?" queries: read `_meta.json` `open_questions`, filter by
     `blocked_on` matching the named person (or current identity for "me"). Sort by
     `impact` descending. Also scan recent blocks for `NEED <NAME>` patterns.
   - For "what needs X?" queries: filter `open_questions` by both `blocked_on` and `owner`
     for the named person.

7. Do NOT write any files. This is read-only.
