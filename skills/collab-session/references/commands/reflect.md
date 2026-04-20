# `/collab reflect <workspace>`

Meta-pass across all closed sessions in a workspace. Extracts recurring patterns, repeated
dead ends, chronic blockers, and reusable approaches. Writes to `<workspace>/_patterns.md`.

Inspired by `t0ddharris/claude-code-skills` `/reflect` and `claude-memory-compiler`'s
quality gate: a pattern is only promoted if it appears in **2+ sessions**.

## When to run

- After 3+ sessions in a workspace have been closed.
- Before starting a new topic that feels familiar — `/collab reflect` first so the new
  session can reference prior patterns via wikilink.
- Periodically (e.g. monthly) to refresh `_patterns.md` as the workspace matures.

## Steps

1. Read identity and transport config.
2. **If mini-repo:** `git pull origin main`.
3. Resolve the workspace from args or the current directory context.
4. Glob all `<workspace>/session-*/` folders. Read each one's `_final_summary.md` if
   closed, else `_summary.md`. Skip sessions with no compressed summary.
5. **Extract across sessions:**

   **Recurring themes** — topics or sub-problems that came up in multiple sessions.
   Name each theme, list the sessions it appeared in with wikilinks, and write a paragraph
   synthesising how understanding evolved across them.

   **Repeated dead ends** — approaches that were tried and abandoned in 2+ sessions
   (often by different contributors who didn't know). These are the highest-value output
   of reflect — they prevent future waste.

   **Chronic blockers** — open questions that recur across sessions with the same
   `blocked_on` person. Surface these prominently so the team can decide whether to
   escalate.

   **Validated patterns** — approaches that worked in 2+ sessions. Promote these to
   reusable templates (e.g. "write-once block files for conflict-free sync" validated in
   session-002 and session-004).

   **Cross-contributor insights** — where different contributors arrived at the same
   conclusion independently. This is evidence of a strong pattern.

6. Write `<workspace>/_patterns.md`:

   ```markdown
   ---
   workspace: skill-project
   compiled_at: "2026-04-20T15:00:00Z"
   sessions_reviewed: 4
   ---

   # Patterns — skill-project

   ## Recurring themes

   ### Concurrency in shared state
   Appeared in [[session-002#phase-1]], [[session-003#phase-2]], [[session-004#phase-1]].
   First hit in session-002 with shared JSON → locking → write-once files. Session-003
   re-hit it with `_meta.json` rewrites → mitigated with atomic temp-rename. Session-004
   avoided the problem entirely by making `_meta.json` the only mutable file.

   ## Repeated dead ends

   - **File locking on NAS** — tried in session-002 (simon) and session-004 (dan);
     unreliable across SMB/NFS in both. Don't try again.
   - **Shared mutable JSON** — tried in session-002; immediate concurrent write
     conflicts. Session-003 started here too before being redirected by session-002's
     summary.

   ## Chronic blockers

   - **EA station IDs for 4 sites — blocked on brian** — raised in session-002 and still
     open in session-004. Consider escalating.

   ## Validated patterns

   - **Write-once block files** — validated in session-002 and session-004. Structural
     guarantee of no conflicts. Reusable for any async multi-writer scenario.
   - **Identity per-machine** — validated in session-002 and session-003. Removes
     per-save friction.

   ## Cross-contributor insights

   - Both Dan (session-002) and Simon (session-004) independently concluded that git
     should be pure transport with no branches when the data model is conflict-free.
   ```

7. **If mini-repo:**
   ```
   git add <workspace>/_patterns.md
   git commit -m "collab: reflect — <workspace>"
   git push origin main
   ```
8. Confirm:
   > Reflected across <N> closed sessions.
   > Themes: <count> · Dead ends: <count> · Chronic blockers: <count> · Validated: <count>
   > Written to `<workspace>/_patterns.md`.
   > Reference with `[[_patterns]]` in future session summaries.

## Quality gate

Only promote a pattern to `_patterns.md` if it appears in **2+ sessions**. Single-session
observations belong in that session's `_summary.md`, not the cross-session patterns file.
This keeps `_patterns.md` trustworthy — every entry is evidence-backed.
