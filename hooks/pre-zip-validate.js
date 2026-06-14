#!/usr/bin/env node
/**
 * PreToolUse hook (Bash) — advisory miniapp bundle gate before `zip`.
 *
 * When a Bash command packages a Korfix miniapp (`zip ... config.json ...`), run the local
 * structural validator AND a conservative static scan of the bundled .js/.html for common write
 * anti-patterns (REST DELETE verb, form[] on /api/db/, writes without a .ok/status check,
 * storage.get() rendered into innerHTML), surfacing both as additional context. It is **advisory
 * only**: it never blocks the command and never errors out — any internal problem → silent exit 0.
 * The authoritative gate is `korfix-pre-deploy` Step 4 (explicit `node scripts/validate-bundle.js`).
 *
 * Reads the PreToolUse payload on stdin, may print a JSON object with additionalContext on stdout.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch (_) { return ''; }
}

function emit(context) {
  // Non-blocking: provide additional context for the model, allow the tool to proceed.
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      additionalContext: context,
    },
  }));
}

// Advisory static scan of bundled .js/.html for common write anti-patterns.
// Conservative, file-level heuristics — advisory only, false positives are tolerable.
function scanCodeAntipatterns(dir) {
  const advisories = [];
  let files = [];
  try {
    files = fs.readdirSync(dir)
      .filter((f) => /\.(js|html)$/i.test(f))
      .slice(0, 40);
  } catch (_) { return advisories; }

  for (const f of files) {
    let txt = '';
    try {
      const p = path.join(dir, f);
      if (fs.statSync(p).size > 512 * 1024) continue; // skip large/minified bundles
      txt = fs.readFileSync(p, 'utf8');
    } catch (_) { continue; }

    // 1. REST DELETE verb — does nothing on this platform (soft-delete = POST ...?udel)
    if (/\bmethod\s*:\s*['"]DELETE['"]/i.test(txt)) {
      advisories.push(`${f}: uses method:'DELETE' — the platform has no REST DELETE; soft-delete is POST /db/{cat}/{alias}?udel&ajax=1`);
    }
    // 2. form[] sent to /api/db/ — that endpoint takes flat fields, form[] is dropped
    if (txt.split('\n').some((ln) => ln.includes('/api/db/') && ln.includes('form['))) {
      advisories.push(`${f}: form[...] used with /api/db/ — that endpoint takes flat fields (name=value); use /db/ for form[] or drop the wrapper`);
    }
    // 3. write calls but no success check anywhere in the file
    const hasWrite = /(\?|&)(udel|edit)\b|\/add\b|add\?edit/i.test(txt);
    if (hasWrite && !/\.ok\b/.test(txt) && !/status/.test(txt)) {
      advisories.push(`${f}: write calls present but no .ok / status check found — writes return HTTP 200 even on error; check resp.ok (or use App.fetchV2)`);
    }
    // 4. storage.get() result written straight into innerHTML — prints "[object Object]"
    if (/innerHTML\s*=\s*(await\s+)?[\w.$]*storage\.get\s*\(/i.test(txt)) {
      advisories.push(`${f}: App.storage.get() value rendered into innerHTML — get() returns the {value,...} record, not the value; use getValue(key) or .value`);
    }
  }
  return advisories;
}

function main() {
  let payload;
  try { payload = JSON.parse(readStdin() || '{}'); } catch (_) { process.exit(0); }

  const input = payload.tool_input || payload.toolInput || {};
  const cmd = typeof input.command === 'string' ? input.command : '';
  if (!cmd) process.exit(0);

  // Only care about zip commands that bundle a config.json (i.e. a miniapp package step).
  if (!/\bzip\b/.test(cmd) || !/config\.json/.test(cmd)) process.exit(0);

  // Resolve the bundle dir: an explicit `cd <dir>` in the command, else the session cwd.
  let dir = payload.cwd || process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const cdMatch = cmd.match(/\bcd\s+("([^"]+)"|'([^']+)'|([^\s&;|]+))/);
  if (cdMatch) {
    const candidate = cdMatch[2] || cdMatch[3] || cdMatch[4];
    if (candidate && fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) dir = candidate;
  }

  const cfgPath = path.join(dir, 'config.json');
  if (!fs.existsSync(cfgPath)) process.exit(0);

  // Only treat it as a miniapp manifest if it parses and has a `urls` object.
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8')); } catch (_) { process.exit(0); }
  if (!cfg || typeof cfg !== 'object' || cfg.urls === undefined) process.exit(0);

  let result;
  try {
    const { validateBundle } = require(path.join(__dirname, '..', 'scripts', 'validate-bundle.js'));
    result = validateBundle(dir);
  } catch (_) {
    process.exit(0);
  }

  let codeAdvisories = [];
  try { codeAdvisories = scanCodeAntipatterns(dir); } catch (_) { codeAdvisories = []; }

  const hasFails = result && result.fails && result.fails.length;
  if (hasFails || codeAdvisories.length) {
    let msg = '';
    if (hasFails) {
      const lines = result.fails.map((f) => `  FAIL: ${f}`).join('\n');
      const warns = (result.warns || []).map((w) => `  WARN: ${w}`).join('\n');
      msg += `korfix-devkit bundle gate found structural problems in ${dir} before zipping — the platform ` +
        `will reject this deploy with 422. Fix before packaging:\n${lines}${warns ? '\n' + warns : ''}`;
    }
    if (codeAdvisories.length) {
      if (msg) msg += '\n\n';
      msg += `korfix-devkit code scan — likely write anti-patterns (advisory, verify each):\n` +
        codeAdvisories.map((a) => `  CHECK: ${a}`).join('\n');
    }
    emit(msg);
  }
  process.exit(0);
}

try { main(); } catch (_) { process.exit(0); }
