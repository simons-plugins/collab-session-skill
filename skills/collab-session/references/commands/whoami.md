# `/collab whoami [name]`

Set or show your identity. Stored at `~/.claude/collab-identity.json` — per-machine, never
in the shared folder or repo.

## With no argument — show current identity

```
You are Simon.
Blocks you save will be named simon_<timestamp>.md.
Change with: /collab whoami <new-name>
```

## With a name — set or update

1. Write `{"name": "Simon"}` to `~/.claude/collab-identity.json`.
2. Confirm: > Identity set to **Simon**. Stored at `~/.claude/collab-identity.json`.

## Rules

- Lowercase, no spaces (use hyphens). E.g. `simon`, `dan`, `simon-home`.
- This becomes part of filenames — keep it consistent across machines.
- Every other command reads identity from this file. If it doesn't exist, pause and prompt:
  "What's your name for collab sessions?" then run the set flow before continuing.
