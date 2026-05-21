---
name: korfix-crud-data
description: Use when working with Korfix catalog data in any context — miniapp iframe (App.fetch), server-side scripts, deployment tools, or direct API calls. Covers /db/ endpoint (session auth) vs /api/db/ (Bearer token) differences, marketplace record operations, form[] format, alias generation, from_auth/from_group requirements, and response normalization.
---

# korfix-crud-data

CRUD operations with Korfix catalogs via App.fetch from inside a miniapp iframe.

## /db/ endpoint — form[] format

From inside the iframe use `/db/catalog` with fields in the `form[fieldName]` format. Authorization is via the user's session — no token needed.

## Reading

```js
// List
App.fetch('/db/tt_tasks.json?form[status]=open')

// Single record by alias
App.fetch('/db/tt_tasks/ALIAS.json')

// All pages automatically
App.fetchAll('/db/tt_tasks.json?form[status]=open')
```

## Creating

```js
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 8) }

App.fetch('/db/tt_tasks/add?edit&ajax=1', {
    method: 'POST',
    body: {
        'form[name]': 'Task',
        'form[alias]': uid(),
        'form[from_auth]': userId,
        'form[from_group]': userId,
        submit: 1
    }
})
```

**Critical:**
- `alias` — always generate explicitly for bulk creation. Otherwise collisions and confusion.
- `from_auth` and `from_group` — **required**. Without them the record belongs to the superadmin and is not visible to regular users.

## Editing

```js
App.fetch(`/db/tt_tasks/${alias}?edit&ajax=1`, {
    method: 'POST',
    body: {
        'form[name]': 'New name',
        'form[id]': id,
        'form[alias]': alias,
        submit: 1
    }
})
```

## Deleting (soft delete, to trash)

```js
App.fetch(`/db/tt_tasks/${alias}?udel&ajax=1`, { method: 'POST' })
```

## Response normalization

`resp.data` can be an array, object, or nested — depends on the catalog and pagination. Safe parsing:

```js
function asArray(resp) {
    if (Array.isArray(resp?.data)) return resp.data;
    if (Array.isArray(resp?.data?.data)) return resp.data.data;
    return [];
}
```

## Filtering and sorting

```js
// Filter by field
App.fetch('/db/tt_tasks.json?form[status]=open&form[priority]=high')

// Sorting and pagination via /api/db/ (if advanced options are needed)
App.fetch('/api/db/tt_tasks?filter[status]=open&order_by=created&order=DESC&limit=20&load_values=1')
```

## Documentation

Read before working with CRUD:

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — full reference: `/db/` vs `/api/db/`, session filter cache (`not_cache=1` — don't write, `free_cache=1` — don't read), hidden fields and `select=`, response normalization
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/korfix-catalogs.md` — list of available catalogs
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/self-provisioning.md` — working with custom catalogs (`custom_` prefix)
