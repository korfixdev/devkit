---
name: korfix-miniapp-validate
description: Use before deploying a Korfix miniapp to validate it against the release checklist. Produces a PASS/WARN/FAIL report with evidence per checklist item. Invoke as impartial reviewer from fresh context (not self-review).
---

# korfix-miniapp-validate

Impartial validation of a finished miniapp before release. **Role: reviewer, not developer.**

Run in fresh context (subagent or separate session) — you have no knowledge of the development history, no sympathy for the author, no "turning a blind eye" to cut corners.

## When to use

- The dev agent has finished working on the miniapp and is ready to deploy
- An independent audit is needed: are all checklist items completed
- Before publishing to the marketplace

## Input

- **Path to the miniapp directory** (required): `/path/to/app-dir`
- Or path to a zip — then unpack to `/tmp` and work with the unpacked contents
- Optional: version / alias for report context

## Process

1. Read the full rubric: `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md`
2. Use `Glob` and `Read` to traverse the miniapp directory: `config.json`, `*.html`, `*.js`, `*.css`
3. For each checklist item render a verdict: **PASS** / **WARN** / **FAIL**
4. **Every verdict MUST have evidence**: `file:line` or a quote. Without evidence — automatic **FAIL**.
5. Aggregate the report by block (config.json / files / code / UI-UX / after submit)
6. Output overall status: `READY` / `NOT READY` + summary of reasons

## Item priorities

- **Critical (blocks release):**
  - `config.json` is invalid or any required field is missing. **All metadata fields are required** (single source of truth, same set as `validate-bundle.js`, `config-json.md`, and `schemas/config.schema.json`): `name`, `version`, `description`, `about`, `package`, `category` (int 1..5), `logo` (file present), `permissions`, `urls`. Missing any one → FAIL.
  - Forbidden extensions in zip/directory (`.php`, `.exe`, `.sh`)
  - `config.json` is not in the root
  - `window.fetch` / `XMLHttpRequest` used instead of `App.fetch`
  - `permissions` absent or a catalog is used without being declared
  - **Endpoint mismatch**: the miniapp (inside the iframe) uses `/api/db/...` with a Bearer token — it must use `/db/...` via `App.fetch` (session). A Bearer token must not appear in the miniapp code inside the zip
  - **Catalog without prefix** that doesn't exist in default plans: `/db/clients`, `/db/users` and similar — must be `/db/crm_clients`, `/db/auth_pers`, or an explicitly specified catalog from the available ones. FAIL if a generic name is used without verification.
- **Must (required, one FAIL = NOT READY):**
  - All 5 sections in `about`, direct links `/db/{catalog}` in "Where it appears in CRM"
  - `App.setFrameSize` is called
  - Input/select/textarea font size ≥ 16px
  - Clickable elements are `<a>` or `<button>`
  - Bulk creation: `alias = uid()`, `from_auth`, `from_group`
  - Self-provisioning: check via `custom_dbtables`, not `/db/{catalog}.json`
  - **Creating `custom_dbtables` passes `form[scheme]='coredb_def_catalog'`** — required field, the platform rejects the request without it. FAIL if the install code has a POST to `/db/custom_dbtables/add` without the `form[scheme]` parameter. The only valid value currently is `coredb_def_catalog`, but the validator should check for the presence of the parameter.
  - **`custom_` prefix when accessing own catalogs and fields** — a frequent vibe-coding mistake:
    - URL: `App.fetch('/db/custom_X.json')`, not `/db/X.json` (FAIL if code contains `/db/{name}` where `{name}` matches a catalog created via `custom_dbtables`, without the prefix)
    - Fields: `record.custom_field`, not `record.field` (FAIL if code reads a field name created via `custom_dbfields` without the prefix)
    - In `permissions.catalogs` and embed points — also with the prefix
    - Evidence: quote from install code (where catalog/field was created without prefix) + quote from usage code (where prefix is required but missing)
  - **Permissions in `access_db` for new catalogs** (self-provisioning apps):
    - After INSERT into `custom_dbtables` the platform **automatically** creates an `access_db` record with default `acctype_root=1, acctype_adm=1` (others 0). The app must not create it — only **update** it to the required visibility schema.
    - If the miniapp is intended for regular roles (manager, client, etc.) — the install code **must update** `access_db` with `configureAccess(catalog, 2)` (self for all) or `configureAccess(catalog, 1)` (everyone sees everything) or a targeted configuration.
    - Preferably via the `configureAccess` helper (fetches acctype_* from the schema — portable across instances), do not hardcode acctype_adm/acctype_b2b2/etc.
    - PASS: install code contains `configureAccess(...)` or a direct update to `/db/access_db/{alias}?edit` with a deliberate choice of values **OR** the app is admin-only and `about` explicitly states "for administrators only".
    - FAIL: the miniapp is embedded in menu/catalogs for regular roles, install code does NOT update access_db, `about` does not specify the access role — users will get empty data, bug report guaranteed.
    - WARN: hardcoded specific acctype_* instead of `configureAccess` — works on the current instance but will break on an instance with a different role set.
    - Evidence: quote from `catalogs.{custom_X}.*` or `menu.{...}` in config.json + absence of access_db update in install code + absence of role specification in about.
- **Frames (frame conventions from `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/frames.md`):**
  - **Critical:** `main.html` is present + `urls.install` is declared, but `main.html` has no `checkCatalogExists` or `App.navigate(... frame=install)` → FAIL
  - **Critical:** `install.html` contains mutating `App.fetch` calls (POST to `/db/.../add`, `/db/.../edit`, writing to catalogs) — **every** such call must have a check `if (!resp || resp.status === 'error' || resp.status === 'no') throw new Error(...)`. Check not only the final step but every one: catalog creation, field creation, `configureAccess`, `registerCatalogForMCP`. One missed check → FAIL (user thinks install succeeded, catalog was not created)
  - **Must:** `urls.widget` is declared + `urls.install` is declared, but `install.html` has no `installWidgetOnDashboard` or equivalent → WARN ("widget will not be installed automatically during installation")
  - **Must:** `urls.widget` is declared, but `permissions.catalogs` does not contain `dashboard_widgets` → WARN
  - **Must-WARN:** `install.html` creates `custom_dbtables` (POST to `/db/custom_dbtables/add`), but no `registerCatalogForMCP` call and no text about "give the token access to the catalog" in `about`/install UI → WARN ("the custom catalog will not be visible via MCP — add registration or instructions for the user")
  - Evidence for Must: quote from `install.html` (missing call) + `urls.widget` field from `config.json`

- **Nice-to-have (WARN, does not block):**
  - CSS optimization, code readability
  - Gear icon for settings
  - Empty state is meaningfully designed
  - **`README.md` in the miniapp root** — technical module description for developers:
    - PASS: README.md exists, version matches `config.json` version, used catalogs and custom_ catalogs are mentioned (if any)
    - WARN: README.md is absent or outdated (e.g., version doesn't match) — recommend running `korfix-tech-writer` before deploy
    - README.md must be included in the zip (for portability and git), not in `.gitignore`

## Report format

```
=== MINIAPP VALIDATION: <name> v<version> ===

[config.json]
  PASS: name is filled in (config.json:2)
  FAIL: permissions not declared
  WARN: tags absent (config.json — field missing)

[files in zip]
  PASS: config.json in root
  FAIL: widget.html:urls.main does not exist in directory

[code]
  FAIL: index.html:45 — direct fetch() instead of App.fetch
  WARN: settings.html:12 — input font-size 14px, requires ≥16

[UI/UX]
  PASS: responsive layout (styles.css:89 @media)
  WARN: no gear icon for settings

SUMMARY
  Critical: 2 FAIL
  Must: 1 FAIL, 1 WARN
  Nice: 1 WARN

STATUS: NOT READY
Blockers: permissions, direct fetch in index.html:45

Recommended actions (by priority):
1. Add permissions.catalogs to config.json
2. Replace fetch() with App.fetch() in index.html:45
3. Increase font-size in settings.html:12 to 16px
```

## Impartiality rules

- Do not accept justifications like "it's obvious", "I'll add it later", "it works anyway". Either done or not.
- If the developer passed additional context ("I didn't have time to do X, but it's not important") — **ignore it**. Judge only by the artifact.
- If a checklist item is ambiguous — interpret it **in favor of strictness** (WARN at minimum).
- Do not give advice on optimization or architectural improvements — only checklist compliance.

## Documentation

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md` — rubric (source of truth, read on every run)
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/frames.md` — frame standards: install/main/footer/widget, patterns, validation rules
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md` — what release readiness means
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/config-json.md` — config.json spec for verification

---

*Difference from `korfix-miniapp-checklist`: this skill is the reviewer role with a structured report. Checklist is the developer's instruction while working on the miniapp.*
