---
name: korfix-miniapp-checklist
description: Use during miniapp development to ensure quality and avoid common mistakes. Run this checklist mentally before asking for validation. Intended for the developer, not the reviewer.
---

# korfix-miniapp-checklist

**REQUIRED** — go through the checklist before every miniapp deploy. Do not skip items.

> **Single source of truth:** the full item list lives in `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md`.
> **Read it and tick every item.** This skill does not re-list the checklist — it points you at the
> canonical rubric and highlights the items that are missed most often. The independent reviewer
> (`korfix-miniapp-validate`) grades against the *same* file, so there is exactly one checklist.

## How to use

1. Open `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md` and walk every section
   (config.json · frames · responsiveness · UI/UX · code · after installation).
2. Fix anything that fails **before** packaging.
3. Then run `korfix-pre-deploy` — it walks you through the local bundle gate, zip assembly, and deploy.
4. For an impartial pass, spawn the `korfix-miniapp-validator` agent in a fresh subagent.

## Most-missed highlights (the ones that bite — full rules in checklist.md)

- **`config.json` fields:** `name`, `package` (recommended), **`category` (int 1..5)**, `about` with all
  5 sections, `permissions` with every used catalog. `category`/`package`/`alias` status: `category` is
  set explicitly (1..5); `package` is recommended (missing → deploy warning); record `alias` is generated
  by `uid()` only for **bulk catalog inserts** (the marketplace record's own alias is assigned by the platform).
- **`App.fetch` everywhere** — never `window.fetch`/`XMLHttpRequest`. Inside the iframe use `/db/...`
  (session auth, `form[]`); a Bearer token must never appear in shipped miniapp code.
- **`custom_` prefix** on every access to your own catalogs/fields; `form[scheme]='coredb_def_catalog'`
  when creating `custom_dbtables`; update (don't create) the auto-made `access_db` record via `configureAccess`.
- **`App.setFrameSize()` after render**; input/select/textarea `font-size ≥ 16px`; clickable = `<a>`/`<button>`.
- **README.md updated and included in the zip** — run `korfix-tech-writer` if it's stale.

If even one checklist item is unmet — fix it before deploying.

## Documentation

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md` — **the** checklist (source of truth, read every run)
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md` — deploy decision table and update flow
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/config-json.md` — embed points and permissions
