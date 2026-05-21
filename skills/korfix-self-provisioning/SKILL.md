---
name: korfix-self-provisioning
description: Use when a miniapp needs to create its own catalogs (tables) and custom fields at first install. Covers the catalog existence check, field creation via App.fetch, and installer UI pattern.
---

# korfix-self-provisioning

Creating custom catalogs and fields on first miniapp launch.

## Pattern: existence check + install screen

```js
// WRONG — do not check via /db/custom_catalog.json
// CRM falls back to the default catalog, returns status:ok even if the catalog doesn't exist

// CORRECT — via the custom_dbtables registry
async function checkCatalogExists(catalogName) {
    const tablename = catalogName.replace('custom_', '')
    const resp = await App.fetch('/db/custom_dbtables.json?form[dbname]=' + tablename)
    // From iframe postMessage wraps the response: array in resp.data.data (not resp.data)
    const items = resp?.data?.data ?? (Array.isArray(resp?.data) ? resp.data : [])
    return items.length > 0
}
```

## Get current user ID (for from_auth/from_group)

```js
async function getCurrentUserId() {
    const schemaResp = await App.fetch('/db/custom_dbtables/sheme.json')
    // From iframe: schema fields in schemaResp.data.data (postMessage wrapper)
    const fields = schemaResp?.data?.data ?? schemaResp?.data ?? {}
    const arr = fields.from_auth?.arr || {}
    return Object.keys(arr).find(k => k !== '0') || 0
}
```

## Create catalog and fields

**Important: "already in use" and "duplicate" — are normal, not an error.**

The physical table is shared across accounts in the same cloud. If another user already installed the app — the table and fields already exist physically. The installer must treat these responses as success and continue (only need to add permissions via `configureAccess`).

```js
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 8) }

// Create catalog (idempotent — "already in use" = normal)
// IMPORTANT: form[scheme] is REQUIRED, without it the catalog will not be created.
async function createTable(name, dbname) {
    const resp = await App.fetch('/db/custom_dbtables/add?edit&ajax=1', {
        method: 'POST',
        body: {
            'form[alias]': uid(),
            'form[name]': name,
            'form[dbname]': dbname,               // without custom_ prefix
            'form[scheme]': 'coredb_def_catalog',  // REQUIRED (template schema)
            submit: 1
        }
    })
    const status  = resp?.data?.status ?? resp?.status
    const message = resp?.data?.message ?? resp?.message ?? ''
    if (status === 'error' && message.includes('already in use')) return  // already created → ok
    if (status !== 'ok') throw new Error(`createTable ${dbname}: ${message}`)
}

// Create field (idempotent — "duplicate" = normal)
async function createField(dbname, fieldDef) {
    const resp = await App.fetch('/db/custom_dbfields/add?edit&ajax=1', {
        method: 'POST',
        body: {
            'form[alias]': uid(),
            'form[name]': fieldDef.name,
            'form[dbname]': fieldDef.dbname,
            'form[type]': fieldDef.type,
            'form[scheme]': 'custom_' + dbname,  // with custom_ prefix
            submit: 1,
            ...(fieldDef.f_arr ? { 'form[f_arr]': fieldDef.f_arr } : {}),
            ...(fieldDef.f_default ? { 'form[f_default]': fieldDef.f_default } : {}),
        }
    })
    const status  = resp?.data?.status ?? resp?.status
    const message = resp?.data?.message ?? resp?.message ?? ''
    if (status === 'error' && /duplicate|already in use/i.test(message)) return  // field exists → ok
    if (status !== 'ok') throw new Error(`createField ${fieldDef.dbname}: ${message}`)
}
```

## Field types

| type | Description |
|------|-------------|
| `textbox` | String |
| `textarea` | Multi-line text |
| `select` | List (options in `f_arr` via `\n`) |
| `checkbox` | Checkbox |
| `datetime` | Date and time |
| `photo` | File |
| `select_from_table` | Relation to another catalog |

## Accessing fields in code

Fields of a custom catalog always use the `custom_` prefix:
```js
note.custom_content, note.custom_priority, note.custom_status
```

## install.html UI pattern

The install frame is opened by the platform in two ways:

1. **Setup screen** (first login of a new user) — hidden iframe, the user sees nothing and clicks nothing. Required: auto-run + `App.done()`.
2. **Regular call** (user opens the app for the first time manually) — visible frame, UI can be shown.

The correct pattern covers both cases — auto-run without a button + `App.done()`:

```html
<div id="status">Checking...</div>

<script type="module">
import VMCRMUserApp from '/templates/def/db/marketplace/vmcrm-user-app.js';
const App = new VMCRMUserApp();

async function init() {
    const exists = await checkCatalogExists('custom_mycatalog');

    if (!exists) {
        document.getElementById('status').textContent = 'Installing...';
        const user = await App.getUser();
        await runInstall(user.data.from_auth, user.data.from_group);
        document.getElementById('status').textContent = '✓ Done';
    }

    // Signal the setup screen: this frame is done.
    // In regular mode — no-op, no setup screen present.
    App.done();
}

init();
</script>
```

> **Why not a button**: in the setup screen the iframe is hidden — no one can click. Auto-run is required. A button can be left as a fallback for reinstallation, but the main path is auto.

> **App.done() in both branches**: call it both after install and if the catalog already exists. The setup screen must receive the signal in any case — otherwise it will wait for a timeout.

```js
// Minimal variant for simple apps
async function init() {
    const user = await App.getUser();
    if (!(await checkCatalogExists('custom_mycatalog'))) {
        await runInstall(user.data.from_auth, user.data.from_group);
    }
    App.done();
}
init();
```

## Access permissions (access_db) — always think about this

After creating `custom_dbtables` (via UI or API) the platform **automatically creates** a record in `access_db` with default `acctype_root=1, acctype_adm=1` (other roles = 0). This means:

- The catalog is immediately visible **only to admin roles** (root + administrator)
- Regular roles (manager, operator, client, etc.) will get empty `data: []` when reading
- The table has `UNIQUE (dbmodule, from_auth, from_group)` — and the platform on the server substitutes `from_group` from the session/token (during INSERT into any catalog with a role model), so the client does not need to pass `form[from_group]`/`form[from_auth]` manually — they can be omitted

If the miniapp is intended for regular roles — **you must update the existing access_db record** for the required access schema. Do not create a new one: `access_db` has one record per `(dbmodule, from_group)` — permissions are encoded in the `acctype_*` columns.

**Anti-pattern for access_db:** do not use `from_auth=0` ("shared for the group") to expand visibility. In other catalogs `from_auth=0` means "record is accessible to the whole group", but in `access_db` visibility is defined by the `acctype_*` columns themselves. Creating two records `(catalog, 0, group)` + `(catalog, user, group)` is pointless and confusing. Always one record per `(dbmodule, from_group)`.

**Before creating a catalog for a miniapp — ask the user if it's not clear from context:**
> For which visibility role is this catalog?
> 1. Admins only (leave default)
> 2. Personal data — each role sees only its own records (`acctype_* = 2`)
> 3. Collaboration — all roles see all records (`acctype_* = 1`)
> 4. Custom — specify exactly which roles and how

Do not guess. The answer determines the `configureAccess` logic.

### acctype_* values

| Value | Access |
|-------|--------|
| `0` | None (catalog hidden) |
| `1` | All organization records (from_group) — for collaborative catalogs (tasks, clients) |
| `2` | Own records only (from_auth = user_id) — for personal data |

### Best default: "self for all roles" (value 2)

**The most common case — set `2` (self) for all roles.** Each user sees only what they created themselves. Safe, suitable for 80% of miniapp scenarios.

Use the ready helper that fetches the current role list from the schema — do not hardcode roles (they are instance-specific):

The helper is idempotent — **create-or-update**. If the afteradd record already exists (standard case) — it updates it. If it's missing for some reason (old platform version / afteradd error) — it creates it.

```js
async function configureAccess(catalog, defaultValue = 2) {
    // 1. List of acctype_* fields from the current instance schema (do not hardcode)
    const schemaResp = await App.fetch('/db/access_db/sheme.json')
    // From iframe postMessage wraps: fields in schemaResp.data.data
    const schemaFields = schemaResp?.data?.data ?? schemaResp?.data ?? {}
    const acctypeFields = Object.keys(schemaFields)
        .filter(k => k.startsWith('acctype_'))

    // 2. Find existing record — one per (dbmodule, from_group in session)
    const existingResp = await App.fetch(`/db/access_db.json?form[dbmodule]=${catalog}`)
    const existing = (existingResp?.data?.data ?? (Array.isArray(existingResp?.data) ? existingResp.data : []))?.[0]

    // 3. Body: all roles = defaultValue
    const body = {
        'form[dbmodule]': catalog,
        'form[name]': catalog,
        submit: 1,
    };
    for (const field of acctypeFields) {
        body[`form[${field}]`] = defaultValue;
    }
    // from_group/from_auth are not passed — server fills them from session

    if (!existing) {
        // Create
        body['form[alias]'] = Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
        await App.fetch('/db/access_db/add?edit&ajax=1', { method: 'POST', body });
    } else {
        // Update (do not create a duplicate — UNIQUE on (dbmodule, from_auth, from_group))
        body['form[id]'] = existing.id;
        body['form[alias]'] = existing.alias;
        await App.fetch(`/db/access_db/${existing.alias}?edit&ajax=1`, { method: 'POST', body });
    }
}

// In installer:
await configureAccess('custom_my_notes');         // self for all (default 2)
await configureAccess('custom_shared_tasks', 1);  // everyone sees everything
```

### When to deviate from default

- **`1` (all)** — collaborative catalogs: tasks/assignments (whole team sees), clients, deals, inventory. Example: "I wrote a task — everyone on the team sees it"
- **`0` (none)** — technical/service catalogs, hidden from specific roles (e.g., clients must not see internal notes)
- **Mixed** — if roles genuinely differ (admin=1, manager=1, client=2)

### Alternative: admin instruction

If the permissions logic is complex or depends on the specific deployment — in `about` → "Configuration":
> After installation, open `/db/access_db`, find the record for `custom_{catalog}`, and set permissions for roles.

## MCP access to custom catalogs

After self-provisioning a custom catalog is **not visible via MCP by default**. The MCP agent discovers catalogs via `/api/db/getcatalogs`, which reads the `custom_catalogs` field of the token. The field is not populated automatically when the catalog is created.

**Method 1 — Manual:** `/db/api` → token → "Custom catalog access" field → select the needed catalogs → save.

**Method 2 — From the install frame** (requires `db_api_get` + `db_api_post` in the token's `apiclasses_id`):

```js
async function registerCatalogForMCP(catalogAlias, tokenAlias) {
    if (!tokenAlias) return
    const apiResp = await App.fetch(`/db/api.json?form[alias]=${encodeURIComponent(tokenAlias)}`)
    const apiRecord = apiResp?.data?.[0]
    if (!apiRecord) return

    const existing = (apiRecord.custom_catalogs || '').split(',').map(s => s.trim()).filter(Boolean)
    const toAdd = [`db_${catalogAlias}_get`, `db_${catalogAlias}_post`].filter(a => !existing.includes(a))
    if (!toAdd.length) return

    const resp = await App.fetch(`/db/api/${apiRecord.alias}?edit&ajax=1`, {
        method: 'POST',
        body: {
            'form[id]': apiRecord.id,
            'form[alias]': apiRecord.alias,
            'form[custom_catalogs]': [...existing, ...toAdd].join(','),
            submit: 1
        }
    })
    if (!resp || resp.status === 'error' || resp.status === 'no') {
        throw new Error(`registerCatalogForMCP failed: ${resp?.message || JSON.stringify(resp)}`)
    }
}

// In runInstall() — optional step, MCP integration is not required:
try {
    await registerCatalogForMCP('custom_quicknotes', tokenAlias)
    logLine('✓ Catalog registered for MCP')
} catch (e) {
    logLine(`⚠ MCP registration skipped: ${e.message} — add manually in /db/api`)
}
```

`tokenAlias` — from the install context (ask the user or get from frame parameters). **Do not hardcode** in the app code.

## Documentation

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/self-provisioning.md` — full reference, field types, FK relations, access_db section
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — CRUD via App.fetch
