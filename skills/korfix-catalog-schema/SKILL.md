---
name: korfix-catalog-schema
description: Use when a miniapp needs to know catalog field types, select options, or FK relationships. Reads schema via App.fetch('/db/{catalog}/sheme.json') and returns field metadata. Call before insert/update to know required fields.
---

# korfix-catalog-schema

Fetching a catalog schema: fields, types, select options, FK relationships.

## Schema request

```js
// iframe
const schema = await App.fetch('/db/tt_tasks/sheme.json')
// schema.data — object: { fieldName: { type, arr, catalog, ... } }
```

## Field types

| type | Contains |
|------|----------|
| `text` / `textarea` | string |
| `select` | `arr: {id: label}` — options |
| `select_from_table` | `arr`, `catalog` (related catalog), `total` |
| `date` / `datetime` | date string |
| `multiselect_from_table` | same as select_from_table, multi-select |

## Get select options

```js
const schema = await App.fetch('/db/tt_tasks/sheme.json')
const options = schema.data.status.arr
// {0: 'New', 10: 'In progress', 40: 'Done'}
```

## Option pagination (total > 200)

```js
const field = schema.data.client_id
if (field.total > Object.keys(field.arr).length) {
    const page2 = await App.fetch('/db/tt_tasks/sheme.json?field=client_id&p=2')
}
```

## Get current user ID

```js
const schema = await App.fetch('/db/dashboard_widgets/sheme.json')
const arr = schema?.data?.from_auth?.arr || {}
const currentUserId = Object.keys(arr).find(k => k !== '0') || 0
```

## load_values — human-readable values instead of IDs

```js
// Without: person_id = "1715761701"
// With:    person_id = "Alex Grigoriev"
GET /api/db/tt_tasks?load_values=1
```

## Documentation

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — section "Getting catalog schema"
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/korfix-catalogs.md` — full list of catalogs by module
