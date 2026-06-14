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
        // from_group: omit — server forces it to your group.
        // from_auth: omit → personal record; pass 0 → shared with the whole group.
        submit: 1
    }
})
```

**Critical:**
- `alias` — always generate explicitly for bulk creation. Otherwise collisions and confusion.
- **Don't pass `from_group`**, and pass `from_auth` only to choose ownership (omit = personal, `0` =
  whole group) — full rules in *Common mistakes → Record ownership* below. (On Korfix the server fills
  these via `kat_admin.php`; the old "pass both or it goes to the admin" advice applies only to legacy
  instances without `FEATURES_USED.auth_role`.)

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

**Preferred — use `App.fetchV2()`:** always returns `{ok, status, data, error?, total?}` with `data` as the payload — same shape from both iframe and root window:

```js
const resp = await App.fetchV2('/db/tt_tasks.json?form[status]=open');
const items = resp.data ?? [];  // always an array/object, never double-nested
```

**Legacy — `App.fetch()` workaround:** `resp.data` is the payload in root window, but `resp.data.data` in the iframe (postMessage wrapping). Use `asArray` to normalise:

```js
function asArray(resp) {
    if (Array.isArray(resp?.data)) return resp.data;
    if (Array.isArray(resp?.data?.data)) return resp.data.data;
    return [];
}
```

`App.fetch()` now always includes `ok: boolean` in the JSON response (added client-side when the server omits it), so `resp.ok` (root window) and `resp.data.ok` (iframe) are reliable.

## Checking write results

`/db/` write endpoints return HTTP 200 even on error — always check `ok` or `status`:

```js
const resp = await App.fetchV2('/db/tt_tasks/add?edit&ajax=1', {
    method: 'POST',
    body: { 'form[name]': 'Task', 'form[alias]': uid(), submit: 1 }
});
if (!resp.ok) throw new Error(resp.error?.message ?? 'Write failed');
// resp.data — created record info (alias, id, ...)
```

`/api/db/` write endpoints return proper HTTP codes (201 create, 200 update, 422 validation error, 404 not found) so `if (!resp.ok)` is sufficient.

## Filtering and sorting

```js
// Filter by field
App.fetch('/db/tt_tasks.json?form[status]=open&form[priority]=high')

// Sorting and pagination via /api/db/ (if advanced options are needed)
App.fetch('/api/db/tt_tasks?filter[status]=open&order_by=created&order=DESC&limit=20&load_values=1')
```

## Common mistakes (guard)

- **`form[]` vs flat — picked by endpoint, not by preference.** `/db/...` always wraps fields in
  `form[name]=value`; `/api/db/...` always takes flat `name=value`. Mixing them silently drops the
  fields (record saves empty / "nothing created"). Same rule for `App.fetch`, curl, and external calls.
- **No generic catalog names.** There is no `/db/clients`, `/db/users`, `/db/orders`. Real catalogs are
  prefixed: `crm_contacts`, `auth_pers`, `crm_orders`, `b2b_clients`, your own `custom_*`. Verify the
  exact alias via `/api/db/getcatalogs` before coding — a guessed generic name 404s.
- **Delete is not the HTTP `DELETE` verb.** Soft-delete is `POST /db/{cat}/{alias}?udel&ajax=1`. There is
  no REST `DELETE` method — using `method: 'DELETE'` does nothing.
- **Record ownership — `from_group` / `from_auth`** (with `FEATURES_USED.auth_role`, enforced server-side
  in `kat_admin.php` → `KAT::save`; this is the case on Korfix instances):
  - **`from_group`** — don't pass it. The server forces it to your session group (a non-admin can't leave
    their group, and it can't be empty). Passing it is a no-op for normal apps.
  - **`from_auth`** — controls personal vs group ownership, by your app logic:
    - omit → defaults to the current user (personal record).
    - `form[from_auth]=0` → record is **shared with the whole group** (everyone in the group sees it);
      allowed everywhere **except `access_db`**.
    - `form[from_auth]=<userId>` → assign to a specific user.
  - (Only on a legacy instance *without* `auth_role` would omitting these matter — there the record could
    fall to the admin/0. On Korfix the server fills them as above.)

## Documentation

Read before working with CRUD:

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — full reference: `/db/` vs `/api/db/`, session filter cache (`not_cache=1` — don't write, `free_cache=1` — don't read), hidden fields and `select=`, response normalization
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/korfix-catalogs.md` — list of available catalogs
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/self-provisioning.md` — working with custom catalogs (`custom_` prefix)
