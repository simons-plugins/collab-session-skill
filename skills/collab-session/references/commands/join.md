# `/collab join <workspace> <topic-or-number>`

Load a session as a new participant or resume your own. This is the primary entry point
for picking up a colleague's thread.

## Two layers of history loaded

1. **Summary** (`_summary.md`) — compressed narrative of all blocks up to the last
   `/collab compress` checkpoint. This is the "story so far" in tight form.
2. **Raw blocks since** — all block files newer than the summary's
   `compressed_through_timestamp`, loaded verbatim in chronological order.

A fresh joiner gets a fast, high-quality briefing (the summary) plus full fidelity on
recent uncompressed work. Use `/collab catchup` to ask questions about either layer.
Use `/collab history` to dig into raw blocks behind the summary.

## Steps

1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main` — report how many new files were fetched:
   > Pulled 2 new blocks (dan_20260314T143512Z.md, dan_20260314T151022Z.md).
3. Resolve session folder from `_index.json`.
4. If `status = "closed"`: warn and offer read-only load or suggest `/collab new`.
5. Read `_meta.json` and `_summary.md`.
6. Glob all `<name>_<timestamp>.md` files. Sort by timestamp ascending. Identify which
   are newer than `_summary.compressed_through_timestamp` — these are "recent verbatim"
   blocks. Older ones are already in the summary narrative.
7. **Resolve wikilinks.** When the summary contains `[[session-NNN#phase-N]]` or
   `[[session-NNN]]` references, resolve them by reading the target session's
   `_summary.md` (or `_final_summary.md` if closed) and inlining a one-paragraph preview
   next to the link. Don't load the whole linked session — the preview keeps token cost
   bounded while giving the joiner the lineage.
8. Build context: goal → summary (with wikilink previews) → recent verbatim blocks in
   chronological order.
9. Present **handoff brief** — the journey, not just conclusions:

```
## skill-project / workspace-arch  (session-002)
**Goal:** Redesign collab to use flat files per save, eliminating merge conflicts.

**Contributors:**
- Simon (8 blocks, 14-15 Mar): data analysis, model building
- Brian (2 blocks, 15 Mar): site knowledge, data validation
- Dan (3 blocks, 14-16 Mar): architecture review, system design

**How we got here:**
Started with shared JSON but hit concurrent write conflicts immediately. File locking
was tried but unreliable on NAS. **Simon** proposed write-once files with unique names —
this makes conflicts structurally impossible. **Dan** joined and pointed out identity should
be per-machine to avoid re-asking on every save. Both agreed collab root must live
outside project repos.

**Builds on:** [[session-001#phase-2]] — earlier exploration of shared-JSON trade-offs.

**Blocked items:**
- ⚠ (high) EA stationIds for 4 sites — **waiting on brian** (raised by simon, Phase 2)
- (medium) Confirm S3 bucket naming — **waiting on dan** (raised by simon, Phase 4)

**Dead ends:** Shared mutable JSON (conflicts). File locking on NAS (unreliable).

**What exists now:** Skill spec with both transport modes (drive + mini-repo).
Identity config designed. Commands: save/join/refresh/compress.

**Decisions:** [consolidated list from summary]

**Open questions:**
- Build real-time alert script? — **owner: simon** (raised by simon, Phase 9)
- Should AMBER be split into AMBER-HIGH and AMBER-LOW? (raised by dan, Phase 8)

**Last save:** Dan · 3 min ago
```

   The handoff brief highlights items blocked on specific people with urgency markers,
   so a joiner immediately sees if anything high-impact is waiting on them. The
   Contributors section includes domain expertise so joiners know who to ask about what.
   The "Builds on" line surfaces the wikilink lineage.

10. Ask: "Ready to pick up? Anything to add before we dive in?"
11. Continue brainstorm naturally. Remind them to `/collab save` before handing off.
