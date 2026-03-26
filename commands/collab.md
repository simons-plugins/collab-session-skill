---
name: collab
description: >
  Async collaborative brainstorming between multiple human+Claude pairs.
  Usage: /collab <subcommand> [args]
  Subcommands: whoami, init, new, list, join, save, compress, catchup, history, refresh, close, publish
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent, AskUserQuestion
---

Load and follow the skill at `${CLAUDE_PLUGIN_ROOT}/skills/collab-session/SKILL.md`.

The user invoked `/collab` with these arguments: $ARGUMENTS

Parse the first argument as the subcommand (whoami, init, new, list, join, save, compress, catchup, history, refresh, close, publish) and execute accordingly. If no subcommand given, show available commands.
