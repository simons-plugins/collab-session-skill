#!/usr/bin/env node
// SessionEnd hook: gentle reminder if an active collab session exists and the current
// user hasn't saved recently. Non-blocking, read-only, no network.

const fs = require('fs');
const path = require('path');
const os = require('os');

const IDENTITY_FILE = path.join(os.homedir(), '.claude', 'collab-identity.json');
const TRANSPORT_FILE = path.join(os.homedir(), '.claude', 'collab-transport.json');
const NUDGE_THRESHOLD_HOURS = 2;

function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~/')) return path.join(os.homedir(), p.slice(2));
  return p;
}

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
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

  const stale = [];
  const now = Date.now();
  for (const ws of index.workspaces) {
    for (const session of ws.sessions || []) {
      if (session.status !== 'active') continue;
      const meta = readJSON(path.join(root, ws.workspace, session.folder, '_meta.json'));
      if (!meta || !Array.isArray(meta.participants)) continue;
      if (!meta.participants.includes(identity.name)) continue;

      const lastSave = session.last_save_at ? new Date(session.last_save_at).getTime() : 0;
      const lastSaveWasMine = session.last_save_by === identity.name;
      const hoursSinceMySave = lastSaveWasMine ? (now - lastSave) / 3600000 : Infinity;

      if (hoursSinceMySave >= NUDGE_THRESHOLD_HOURS) {
        stale.push(`${ws.workspace} / ${session.topic}`);
      }
    }
  }

  if (stale.length === 0) {
    console.log(JSON.stringify({}));
    return;
  }

  const list = stale.slice(0, 3).map(s => `  • ${s}`).join('\n');
  const msg = `Collab reminder — active sessions you haven't saved to recently:\n${list}\n\nConsider \`/collab save\` next time so colleagues can pick up.`;
  console.log(JSON.stringify({ systemMessage: msg }));
}

main();
