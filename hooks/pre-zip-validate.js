#!/usr/bin/env node
/**
 * PreToolUse hook (Bash) — advisory miniapp bundle gate before `zip`.
 *
 * When a Bash command packages a Korfix miniapp (`zip ... config.json ...`), run the local
 * structural validator and surface any FAILs as additional context. It is **advisory only**:
 * it never blocks the command and never errors out — any internal problem → silent exit 0.
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

  if (result && result.fails && result.fails.length) {
    const lines = result.fails.map((f) => `  FAIL: ${f}`).join('\n');
    const warns = (result.warns || []).map((w) => `  WARN: ${w}`).join('\n');
    emit(
      `korfix-devkit bundle gate found structural problems in ${dir} before zipping — the platform ` +
      `will reject this deploy with 422. Fix before packaging:\n${lines}${warns ? '\n' + warns : ''}`
    );
  }
  process.exit(0);
}

try { main(); } catch (_) { process.exit(0); }
