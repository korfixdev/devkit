---
name: korfix-token-audit
description: Use BEFORE starting Korfix miniapp development to verify what catalogs and operations the user's KORFIX_TOKEN actually has access to. Prevents wasted work building against catalogs the token can't read or write. If access is missing, the agent must ask the user to extend the token or pick an alternative catalog — never silently fail later.
---

# korfix-token-audit

Before starting miniapp development — **verify what the token can actually do**, so you don't build against catalogs you have no access to.

## When it triggers

- Before the first access to any specific catalog for development/testing
- On a new task — "need to work with catalog X"
- When you see HTTP 403/404 on `/api/db/{catalog}` — need to determine if it's a token problem or a name problem

## Process

### Step 1. Get the list of catalogs available to the token

```bash
curl -s "${KORFIX_API_URL}/api/db/getcatalogs" \
  -H "Authorization: Bearer ${KORFIX_TOKEN}" | head -c 2000
```

Returns JSON with a list of catalogs and available methods (`get`/`post`/`put`/`delete`). This is the **actual set** defined when the token was created in `/db/api`.

### Step 2. Check a specific catalog

```bash
# Read
curl -sI "${KORFIX_API_URL}/api/db/{catalog}?limit=1" \
  -H "Authorization: Bearer ${KORFIX_TOKEN}"

# Possible responses:
# HTTP/2 200 — access granted
# HTTP/2 403 — token does NOT have the db_{catalog}_get class
# HTTP/2 404 — catalog does not exist
# HTTP/2 401 — token is invalid or expired
```

### Step 3. If access is missing — ALWAYS ask the user

**Do not stay silent. Do not try to work around it. Do not use another catalog without confirmation.**

Possible options:

**A. Ask to extend the token:**
> "To work with catalog `{catalog}`, the token is missing the class `db_{catalog}_{method}`. Can you add it? In `/db/api` find your token → 'API Classes' section → check the needed one → save."

**B. Suggest an alternative** if you know one:
> "Catalog `{catalog}` is not accessible, but `{alternative}` provides similar functionality (the token has it). Use it?"

**C. If the task requires a structure not in the token:**
> "There are no alternatives in the current token. Create a custom catalog via self-provisioning (`custom_{name}`)? Or extend the token?"

## Common cases

| Case | What to do |
|------|-----------|
| Need `crm_clients`, token doesn't have it | Ask to add class `db_crm_clients_get` and `db_crm_clients_post` |
| Need "clients" (no prefix) — doesn't exist | Clarify — most likely it's `crm_clients` (default) or `ag_clients` (AG module). Ask the user "which one?" — do not guess |
| Custom catalog created, not visible in MCP (`/api/db/getcatalogs`) | For custom catalogs MCP reads the `custom_catalogs` field of the token. To add: `/db/api` → token → "Custom catalog access" → select catalog → save. Or automatically from install frame via `registerCatalogForMCP` (see `korfix-self-provisioning` skill) |
| Creating `custom_X` via self-provisioning | Token must have: `db_custom_dbtables_get`, `db_custom_dbtables_post`, `db_custom_dbfields_post`, `db_access_db_get`, `db_access_db_post` (for role permission setup). Without them self-provisioning will stall on the first request. |
| Programmatic deploy via API | Token must have: `marketplace_deploy_post` (atomic endpoint) or `db_marketplace_post` + `marketplace_refresh_post` (two separate calls). See [docs](${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md). |

## Integration with workflow

1. The **`korfix-miniapp-dev` agent** must run this skill at the start of a development session or on first access to a catalog.
2. **Do not use a catalog whose access has not been confirmed** — otherwise errors surface at deploy/usage time, not immediately.
3. **When creating a self-provisioned catalog** — immediately check that the token has `db_custom_*` and `db_access_db_post` (for permission setup).

## Documentation

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — section "Key rule: which endpoint from where"
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/self-provisioning.md` — about access_db
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/korfix-catalogs.md` — Korfix ERP catalogs
