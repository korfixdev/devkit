---
name: korfix-catalog-schema
description: Use when a miniapp needs to know catalog field types, select options, or FK relationships. Reads schema via App.fetch('/db/{catalog}/sheme.json') and returns field metadata. Call before insert/update to know required fields.
---

# korfix-catalog-schema

Получение схемы каталога: поля, типы, варианты select, FK-связи.

## Запрос схемы

```js
// iframe
const schema = await App.fetch('/db/tt_tasks/sheme.json')
// schema.data — объект: { fieldName: { type, arr, catalog, ... } }
```

## Типы полей

| type | Что содержит |
|------|-------------|
| `text` / `textarea` | строка |
| `select` | `arr: {id: label}` — варианты |
| `select_from_table` | `arr`, `catalog` (связанный каталог), `total` |
| `date` / `datetime` | строка даты |
| `multiselect_from_table` | то же что select_from_table, мультивыбор |

## Получить варианты select

```js
const schema = await App.fetch('/db/tt_tasks/sheme.json')
const options = schema.data.status.arr
// {0: 'Новый', 10: 'В работе', 40: 'Завершено'}
```

## Пагинация вариантов (total > 200)

```js
const field = schema.data.client_id
if (field.total > Object.keys(field.arr).length) {
    const page2 = await App.fetch('/db/tt_tasks/sheme.json?field=client_id&p=2')
}
```

## Определить ID текущего пользователя

```js
const schema = await App.fetch('/db/dashboard_widgets/sheme.json')
const arr = schema?.data?.from_auth?.arr || {}
const currentUserId = Object.keys(arr).find(k => k !== '0') || 0
```

## load_values — читаемые значения вместо ID

```js
// Без: person_id = "1715761701"
// С:   person_id = "Алексей Григорьев"
GET /api/db/tt_tasks?load_values=1
```

## Документация

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — раздел «Получение схемы каталога»
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/korfix-catalogs.md` — полный список каталогов по модулям
