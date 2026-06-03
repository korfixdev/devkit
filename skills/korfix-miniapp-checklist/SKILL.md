---
name: korfix-miniapp-checklist
description: Use during miniapp development to ensure quality and avoid common mistakes. Run this checklist mentally before asking for validation. Intended for the developer, not the reviewer.
---

# korfix-miniapp-checklist

**REQUIRED** — run this checklist before every miniapp deploy.
Do not skip items; do not assume "it's obviously done correctly".

> **After this checklist:** run `korfix-pre-deploy` — it will walk you through zip assembly and deploy.
> **For independent validation:** use the `korfix-miniapp-validator` agent in a fresh subagent.

## config.json

- [ ] JSON is valid (no trailing comma, no unescaped `\` or special characters)
- [ ] `name` is filled in
- [ ] `package` is filled in (package name / folder)
- [ ] `description` — brief (1-2 sentences)
- [ ] `about` — a string with markdown via `\n`, contains all sections:
  - `## What it does`
  - `## Where it appears in CRM` (with direct links `/db/catalog`)
  - `## Features`
  - `## How to use`
  - `## Configuration`
- [ ] `logo` — file exists in zip
- [ ] `urls` — all paths are relative (for zip apps), no domain
- [ ] `urlsConf` — for local frames `"method": "get"`
- [ ] `permissions` — all used catalogs and operations are explicitly declared

## Files in zip

- [ ] `config.json` is in the archive root, not inside a folder
- [ ] All files from `urls` exist in the archive
- [ ] No forbidden extensions: php, exe, sh

## Code

- [ ] `App.fetch()` is used for all requests (not `window.fetch`)
- [ ] `/db/` — fields with `form[]`, `/api/db/` — without `form[]`
- [ ] Bulk record creation: explicit `alias = uid()`, `from_auth` and `from_group` are passed
- [ ] Self-provisioning checks for the catalog via `custom_dbtables`, not via `/db/{catalog}.json`
- [ ] **When creating `custom_dbtables`, `form[scheme]='coredb_def_catalog'` is passed** — required template field. Without it the system will not create the table.
- [ ] **`custom_` prefix everywhere when accessing own catalogs/fields**:
    - `App.fetch('/db/custom_my_catalog.json')` — not `/db/my_catalog.json`
    - `record.custom_my_field` — not `record.my_field`
    - In `permissions.catalogs` and embed points — also with the prefix
    - Exception: when creating in `custom_dbtables.dbname` the prefix is **not specified** (the platform adds it), but in `custom_dbfields.scheme` — it **is specified**
- [ ] **`access_db` permissions — consciously chosen for the target role/schema**:
    - After INSERT into `custom_dbtables`, the platform **automatically creates** an `access_db` record (root+adm=1, others=0). Update, do not create.
    - Before writing code — ask the user if it's not obvious: for which role is the catalog, how should different roles behave (see the `korfix-self-provisioning` skill).
    - If for regular roles with personal data — `configureAccess(catalog, 2)` (each sees their own)
    - If collaboration (shared data) — `configureAccess(catalog, 1)` (everyone sees everything)
    - If leaving only for admins — explicitly write in `about` "Catalog is accessible to administrators only"
    - The `configureAccess` helper fetches the role list from the schema — portable across instances
- [ ] `App.setFrameSize(null, document.body.scrollHeight)` is called after rendering

## Frames

- [ ] **`install` frame** — any type (self-provisioning or widget setup):
  - [ ] **"Open App" button is present** on the done/success screen — navigates to `main`:
    ```js
    const params = await App.getRequestParams();
    const selfToken = params?.data?.token || '';
    // in done screen:
    App.navigate('/db/installed_apps/' + selfToken + '?frame=main');
    ```
  - [ ] *(self-provisioning only)* Every mutating `App.fetch` → response status is checked explicitly
  - [ ] *(self-provisioning only)* Install log is saved to `App.storage` — key `install.log`
  - [ ] *(self-provisioning only)* On repeated open: shows saved log + "Reinstall" + "Close"
  - [ ] *(self-provisioning only)* If `urls.widget` exists — `installWidgetOnDashboard(token)` is called
- [ ] **`main` frame** (if `urls.install` exists): checks `checkCatalogExists` on load, otherwise `App.navigate(... frame=install)`
- [ ] **`widget` frame**: `permissions.catalogs` contains `"dashboard_widgets": ["read", "write"]`

Full install + widget + API response pattern → `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/frames.md`

## UI / UX

- [ ] Empty state: if there's no data — a meaningful message, not an error
- [ ] Responsive layout: tables are not clipped on mobile
- [ ] Input field font size >= 16px (otherwise iOS Safari zooms in)
- [ ] Clickable elements: `<a>` or `<button>`, not `<div>` (iOS doesn't handle click on div)
- [ ] A gear icon (⚙) exists for settings or the install screen (if self-provisioning is present)

## Before submitting

- [ ] **`README.md` is updated** — version matches `config.json`, used catalogs and custom catalogs are mentioned, changelog included. Run `korfix-tech-writer` (haiku agent) if not yet called
- [ ] **`README.md` is included in the zip** — carries documentation with the app, needed for git and future sessions
- [ ] Deploy via API: `curl -X POST .../api/db/marketplace/{ID}?token={TOKEN} -F "doc1=@app.zip"`
- [ ] After deploy, verify version: `appconfig.version` in the response matches the expected value
- [ ] App is opened in the browser and tested (not just deployed)

---

If even one item is not done — fix it before deploying. After self-review — run `korfix-miniapp-validate` in a subagent for an impartial review.

## Documentation

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md` -- full original checklist with extended explanations
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md` -- deploy and update
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/config-json.md` -- embed points and permissions
