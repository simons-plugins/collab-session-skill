#!/usr/bin/env node
// SessionStart hook: surface any active collab sessions the current user has touched.
// Never pulls from git, never writes files. Fast, local-only read.

const fs = require('fs');
const path = require('path');
const os = require('os');

const IDENTITY_FILE = path.join(os.homedir(), '.claude', 'collab-identity.json');
const TRANSPORT_FILE = path.join(os.homedir(), '.claude', 'collab-transport.json');
const MAX_AGE_DAYS = 7;
const MAX_SESSIONS = 3;

function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function relativeTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function main() {
  const identity = readJSON(IDENTITY_FILE);
  const transport = readJSON(TRANSPORT_FILE);
  if (!identity || !transport || !transport.root) {
    console.log(JSON.stringify({}));
    return;
  }

  const root = expandHome(transport.root);
  const index = readJSON(path.join(root, '_index.json'));
  if (!index || !Array.isArray(index.workspaces)) {
    console.log(JSON.stringify({}));
    return;
  }

  const cutoff = Date.now() - MAX_AGE_DAYS * 86400000;
  const active = [];
  for (const ws of index.workspaces) {
    for (const session of ws.sessions || []) {
      if (session.status !== 'active') continue;
      const lastSaveAt = session.last_save_at || session.created_at;
      if (!lastSaveAt || new Date(lastSaveAt).getTime() < cutoff) continue;

      const meta = readJSON(path.join(root, ws.workspace, session.folder, '_meta.json'));
      if (!meta || !Array.isArray(meta.participants)) continue;
      if (!meta.participants.includes(identity.name)) continue;

      active.push({
        workspace: ws.workspace,
        topic: session.topic,
        last_save_by: session.last_save_by || 'unknown',
        last_save_at: lastSaveAt,
        open_question_count: session.open_question_count || 0
      });
    }
  }

  if (active.length === 0) {
    console.log(JSON.stringify({}));
    return;
  }

  active.sort((a, b) => new Date(b.last_save_at) - new Date(a.last_save_at));
  const top = active.slice(0, MAX_SESSIONS);
  const lines = top.map(s => {
    const q = s.open_question_count > 0 ? ` · ${s.open_question_count} open` : '';
    return `  • ${s.workspace} / ${s.topic} — last saved ${relativeTime(s.last_save_at)} by ${s.last_save_by}${q}`;
  });
  const more = active.length > MAX_SESSIONS ? `\n  ... and ${active.length - MAX_SESSIONS} more` : '';
  const msg = `Active collab sessions you've participated in:\n${lines.join('\n')}${more}\n\nResume with \`/collab join <workspace> <topic>\` or list with \`/collab list\`.`;
  console.log(JSON.stringify({ systemMessage: msg }));
}

main();
