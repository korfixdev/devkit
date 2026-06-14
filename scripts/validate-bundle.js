#!/usr/bin/env node
/**
 * validate-bundle.js — local structural gate for a Korfix miniapp bundle.
 *
 * Pure local pre-flight (NO API calls): mirrors the platform's deploy-time manifest
 * validation so problems are caught before zipping instead of as a 422 on deploy.
 *
 * Checks (every config.json metadata field is REQUIRED — single source of truth shared
 * with config-json.md and the korfix-miniapp-validate skill):
 *   - config.json exists at the bundle root and is valid JSON
 *   - required: name, version, description, about, package, category (int 1..5),
 *     urls (object, every referenced file present), logo (file present), permissions
 *   - conditional: if `urls.widget` is declared → permissions.catalogs.dashboard_widgets
 *     includes read+write
 *   - optional: urlsConf, embed points (menu/tabs/itemsActions/footer)
 *
 * If `ajv` happens to be resolvable AND schemas/config.schema.json exists, an extra
 * JSON-Schema pass runs too. Otherwise the structural checks above are authoritative.
 *
 * Usage:   node scripts/validate-bundle.js <app-dir>
 * Exit:    0 = no FAILs (WARNs allowed), 1 = at least one FAIL or usage error.
 *
 * Also exports validateBundle(dir) -> { fails: string[], warns: string[] } for the hook.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function validateBundle(dir) {
  const fails = [];
  const warns = [];

  const cfgPath = path.join(dir, 'config.json');
  if (!fs.existsSync(cfgPath)) {
    fails.push(`config.json not found at bundle root (${cfgPath})`);
    return { fails, warns };
  }

  let raw, cfg;
  try {
    raw = fs.readFileSync(cfgPath, 'utf8');
  } catch (e) {
    fails.push(`config.json unreadable: ${e.message}`);
    return { fails, warns };
  }
  try {
    cfg = JSON.parse(raw);
  } catch (e) {
    fails.push(`config.json invalid JSON: ${e.message}`);
    return { fails, warns };
  }
  if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) {
    fails.push('config.json must be a JSON object');
    return { fails, warns };
  }

  // required: name
  if (!cfg.name || typeof cfg.name !== 'string' || !cfg.name.trim()) {
    fails.push('field "name" is required');
  }

  // urls: object, every referenced file must exist
  if (cfg.urls === undefined) {
    fails.push('field "urls" is required (object of frame -> file)');
  } else if (typeof cfg.urls !== 'object' || Array.isArray(cfg.urls)) {
    fails.push('field "urls" must be an object');
  } else {
    for (const [frame, rel] of Object.entries(cfg.urls)) {
      if (typeof rel !== 'string') { fails.push(`urls.${frame} must be a string path`); continue; }
      if (/^https?:\/\//i.test(rel)) continue; // remote frame — not a bundled file
      if (!fs.existsSync(path.join(dir, rel))) {
        fails.push(`urls.${frame} -> "${rel}" not present in the bundle`);
      }
    }
  }

  // logo: required, file must exist
  if (!cfg.logo) {
    fails.push('field "logo" is required (icon shown in the marketplace)');
  } else if (typeof cfg.logo !== 'string') {
    fails.push('field "logo" must be a string filename');
  } else if (!/^https?:\/\//i.test(cfg.logo) && !fs.existsSync(path.join(dir, cfg.logo))) {
    fails.push(`logo -> "${cfg.logo}" not present in the bundle`);
  }

  // widget frame requires dashboard_widgets read+write
  const hasWidget = cfg.urls && typeof cfg.urls === 'object' && cfg.urls.widget;
  if (hasWidget) {
    const cats = (cfg.permissions && cfg.permissions.catalogs) || {};
    const dw = cats.dashboard_widgets;
    const ok = Array.isArray(dw) && dw.includes('read') && dw.includes('write');
    if (!ok) {
      fails.push('urls.widget is declared but permissions.catalogs.dashboard_widgets is missing ["read","write"]');
    }
  }

  // required metadata fields (single source of truth: every config.json field is mandatory)
  if (!cfg.version || typeof cfg.version !== 'string' || !cfg.version.trim()) {
    fails.push('field "version" is required (SemVer, e.g. "1.0.0")');
  }
  if (!cfg.description || typeof cfg.description !== 'string' || !cfg.description.trim()) {
    fails.push('field "description" is required (short 1-2 sentence summary)');
  }
  if (!cfg.package) fails.push('field "package" is required (app package/folder name)');
  if (!cfg.permissions) fails.push('field "permissions" is required (declare every used catalog)');
  if (!cfg.about) fails.push('field "about" is required (marketplace description, 5 sections)');
  if (cfg.category === undefined) {
    fails.push('field "category" is required (int 1..5)');
  } else if (!Number.isInteger(cfg.category) || cfg.category < 1 || cfg.category > 5) {
    fails.push(`field "category" must be an integer 1..5 (got ${JSON.stringify(cfg.category)})`);
  }

  // optional JSON-Schema pass (only if ajv + schema are both available)
  try {
    const schemaPath = path.join(__dirname, '..', 'schemas', 'config.schema.json');
    if (fs.existsSync(schemaPath)) {
      let Ajv;
      try { Ajv = require('ajv'); } catch (_) { Ajv = null; }
      if (Ajv) {
        const ajv = new Ajv({ allErrors: true, strict: false });
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        const validate = ajv.compile(schema);
        if (!validate(cfg)) {
          for (const err of validate.errors || []) {
            warns.push(`schema: ${err.instancePath || '/'} ${err.message}`);
          }
        }
      }
    }
  } catch (e) {
    warns.push(`schema check skipped: ${e.message}`);
  }

  return { fails, warns };
}

function main() {
  const dir = process.argv[2];
  if (!dir) {
    console.error('Usage: node validate-bundle.js <app-dir>');
    process.exit(1);
  }
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    console.error(`Not a directory: ${dir}`);
    process.exit(1);
  }
  const { fails, warns } = validateBundle(dir);
  console.log(`=== validate-bundle: ${path.resolve(dir)} ===`);
  for (const w of warns) console.log(`  WARN: ${w}`);
  for (const f of fails) console.log(`  FAIL: ${f}`);
  if (!fails.length && !warns.length) console.log('  OK: bundle structure looks good');
  console.log(`SUMMARY: ${fails.length} FAIL, ${warns.length} WARN`);
  process.exit(fails.length ? 1 : 0);
}

if (require.main === module) main();
module.exports = { validateBundle };
