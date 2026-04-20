# `/collab list [workspace]`

Front door for the team. Shows what's active and who last touched it.

## Steps

1. Read transport config.
2. **If mini-repo:** `git pull origin main` silently before reading.
3. Read `_index.json` and each active session's `_meta.json`.
4. Format — active first, closed dimmed. Flag high-impact blockers:

```
## Collab Workspaces  [transport: /Volumes/TeamNAS/collab]

### skill-project
  ● 002  workspace-arch      "Redesign with flat-file blocks"
         Simon (8) · Brian (2) · Dan (3)  ·  13 saves  ·  14 min ago
         ⚠ 2 high-impact items blocked on brian
  ○ 001  initial-design      [closed]

### risk-engine
  ● 001  compression         "Summarise without losing signal"
         Dan (5)  ·  5 saves  ·  2h ago  ·  1 open question
```

The blocker flag reads from `_meta.json` `open_questions`, filtering by
`blocked_on != null && impact == "high"`. Lower-impact blockers aren't surfaced here —
`/collab catchup what's blocked on me?` shows all of them.

5. Footer:
   > Join: `/collab join <workspace> <topic-or-number>`
   > New topic: `/collab new <workspace> <topic>`
