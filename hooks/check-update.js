#!/usr/bin/env node
// SessionStart hook: check if a newer version exists and notify via systemMessage.
// No update logic — users run: /plugin update collab-session

const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

const REPO = 'AI-Collab-Skill/collab-session-skill';
const CACHE_FILE = path.join(os.homedir(), '.claude', 'cache', 'collab-session-update-check.json');
const PLUGIN_JSON = path.join(__dirname, '..', '.claude-plugin', 'plugin.json');
const CACHE_MAX_AGE = 3600; // 1 hour

function getInstalledVersion() {
  try {
    return JSON.parse(fs.readFileSync(PLUGIN_JSON, 'utf8')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function readCache() {
  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    if (Date.now() / 1000 - cache.checked < CACHE_MAX_AGE) return cache;
  } catch {}
  return null;
}

function outputResult(installed, latest) {
  const output = {};
  if (latest && latest !== installed && latest !== 'unknown') {
    output.systemMessage = `Collab Session plugin update available: ${installed} → ${latest}. Run \`/plugin update collab-session\` to install.`;
  }
  console.log(JSON.stringify(output));
}

function refreshCacheInBackground(installed) {
  const { spawn } = require('child_process');
  const child = spawn(process.execPath, ['-e', `
    const fs = require('fs');
    const https = require('https');
    const url = 'https://raw.githubusercontent.com/${REPO}/main/.claude-plugin/plugin.json';
    const req = https.get(url, { headers: { 'User-Agent': 'collab-session-update-check' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const latest = JSON.parse(data).version || 'unknown';
          const dir = '${path.dirname(CACHE_FILE).replace(/'/g, "\\'")}';
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync('${CACHE_FILE.replace(/'/g, "\\'")}', JSON.stringify({
            installed: '${installed}', latest, checked: Math.floor(Date.now() / 1000)
          }));
        } catch {}
      });
    });
    req.on('error', () => {});
    setTimeout(() => req.destroy(), 10000);
  `], { stdio: 'ignore', detached: true });
  child.unref();
}

// Main
const installed = getInstalledVersion();
const cache = readCache();

if (cache) {
  outputResult(installed, cache.latest);
} else {
  console.log(JSON.stringify({}));
  refreshCacheInBackground(installed);
}
