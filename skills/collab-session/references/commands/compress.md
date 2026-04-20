# `/collab compress`

Deliberately compress raw blocks into a tight narrative summary. This is the **quality pass**
— separate from save so that saving stays fast and lossless.

## Steps

1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main` first.
3. Resolve the active session (or accept `<workspace> <topic>` arguments).
4. Read `_summary.md` to find `compressed_through_timestamp`.
5. Glob all block files newer than that timestamp (or all blocks if no prior compression).
6. Read each uncompressed block in chronological order.
7. **Read the prior session's `_final_summary.md`** (if `prior_session` is set in
   `_meta.json`). This gives you context to write `[[session-NNN#phase-N]]` wikilinks
   where appropriate — see the Wikilinks section below.
8. Build a **journey-style summary** from all blocks (including any already in `_summary.md`).
   The result replaces the existing summary, not appends. Write it as a teammate would
   want to read it — not a Wikipedia article about the final state, but the story of how
   we got here. See `references/schemas.md` for the full format with attribution examples.

### Structure the summary with these sections

**Contributors** (before Starting point): For each participant, list their name, block
count, date range, key contributions (2-3 phrases), and primary domain expertise. This is
the "who to ask about what" index. Order by contribution volume. Always include, even for
solo sessions.

**Starting point** — the problem/goal and initial assumptions (1-2 sentences).

**Phases of work** — chronological, showing how understanding evolved. Each phase is a
paragraph covering: what was attempted, what was discovered, what changed as a result.
Name the phases by what happened, not by timestamp (e.g. "CSO integration", not "Block 5").
Show the *progression* — "we started thinking X, then discovered Y, which led us to Z".
Phase headings include date range and contributor count:
`## Phase 3 — CSO integration (14-15 Mar, 2 contributors)`.

**Attribution in phases**: Each phase paragraph leads with the contributor's name in bold,
their date range and block count. When multiple people contributed to a phase, give each
their own paragraph within the phase. End each phase with a "Key finding" or "Phase
outcome" line that synthesises across contributors.

**Disagreement preservation**: When contributors proposed different approaches, briefly
capture both positions and explain why one was chosen. This goes in the relevant phase,
not as a separate section. E.g. "Dan proposed using ML (Random Forest), Simon argued
simple thresholds were more interpretable for scout leaders. Went with thresholds —
validated at 94% accuracy."

**Dead ends & pivots** — what was tried and abandoned, and *why*. These are gold for
teammates — they prevent someone from re-exploring a path that was already ruled out.

**Key discoveries** — the "aha moments" that changed direction or significantly deepened
understanding. Not just facts, but *surprises* — things that contradicted expectations or
revealed something non-obvious.

**Current state** — what concretely exists now: scripts, datasets, models, documents.
What has been validated, what are the numbers.

**Decisions**: Extract and consolidate across all blocks. For contested or
multi-contributor decisions, add parenthetical attribution: `(proposed: name, validated:
name)` or `(proposed: name after name flagged X)`. For uncontested single-contributor
decisions, optionally add just `(name)`. Consensus decisions with no clear proposer need
no attribution.

**Open questions**: Extract and consolidate — remove any that have been resolved. Each
question should include `— **blocked on name**` or `— **owner: name**` where applicable,
plus `(raised by name, Phase N)` for traceability. Parse block-file conventions like
`NEED BRIAN` and `owner: simon` into structured format. Parse urgency markers `!high`
and `!low` into the structured `impact` field; default to `medium`.

Also write structured `open_questions` to `_meta.json` as objects with `question`,
`owner`, `blocked_on`, `raised_by`, `phase`, and `impact` fields (see
`references/schemas.md`).

### Wikilinks — cross-session lineage

When a phase or decision builds on work from a prior session, reference it with
`[[session-NNN#phase-N]]` (or `[[session-NNN]]` for the whole session). These are plain
markdown so they render on GitHub; `/collab join` resolves them inline.

Use sparingly — only when the link genuinely helps a joiner understand lineage. Criteria:
- The current decision explicitly reverses, refines, or extends a prior one
- A dead end being revisited because context changed
- A pattern identified via `/collab reflect` that applies here

Don't link every phase — that's noise. One or two links per session is typical.

### Quality bar

A teammate reading this summary should be able to:
1. Understand *why* we're where we are, not just *what* we concluded
2. Avoid re-exploring dead ends
3. Know what artifacts exist and where
4. Pick up any open thread and continue productively
5. Understand the confidence level of conclusions (validated vs hypothesised)
6. Know who contributed what and who to ask about specific topics
7. Know which open items are high-impact vs routine

9. Rewrite `_summary.md` with the new narrative and update
   `compressed_through_timestamp` to the latest block's timestamp.
10. Update `_meta.json`: `open_question_count` and `open_questions` (with impact).
11. **If mini-repo:**
    ```
    git add <session-folder>/_summary.md <session-folder>/_meta.json
    git commit -m "collab: compress — <workspace>/<topic>"
    git push origin main
    ```
12. Confirm:
    > Compressed <N> blocks into journey summary.
    > Phases: <number of phases identified>
    > Dead ends: <count of approaches tried and abandoned>
    > Decisions: <consolidated count>
    > Open questions: <consolidated count> (<high-impact count> high-impact)
    > Wikilinks: <count> cross-session references
    > Raw blocks preserved — summary used for faster `/collab join`.
