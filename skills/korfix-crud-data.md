---
name: korfix-crud-data
description: Use when a Korfix miniapp needs to create, read, update, or delete catalog records through App.fetch inside iframe. Covers /db/ endpoint form[] format, alias generation, from_auth/from_group requirements, and response normalization.
---

# korfix-crud-data

CRUD-операции с каталогами Korfix через App.fetch изнутри iframe миниапа.

## Эндпоинт /db/ — формат form[]

Изнутри iframe используй `/db/catalog` с полями в формате `form[fieldName]`. Авторизация — через сессию пользователя, токен не нужен.

## Чтение

```js
// Список
App.fetch('/db/tt_tasks.json?form[status]=open')

// Одна запись по alias
App.fetch('/db/tt_tasks/ALIAS.json')

// Все страницы автоматически
App.fetchAll('/db/tt_tasks.json?form[status]=open')
```

## Создание

```js
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 8) }

App.fetch('/db/tt_tasks/add?edit&ajax=1', {
    method: 'POST',
    body: {
        'form[name]': 'Задача',
        'form[alias]': uid(),
        'form[from_auth]': userId,
        'form[from_group]': userId,
        submit: 1
    }
})
```

**Критично:**
- `alias` — всегда генерировать явно при массовом создании. Иначе коллизии и путаница.
- `from_auth` и `from_group` — **обязательно** передавать. Иначе запись принадлежит суперадмину и не видна обычным пользователям.

## Редактирование

```js
App.fetch(`/db/tt_tasks/${alias}?edit&ajax=1`, {
    method: 'POST',
    body: {
        'form[name]': 'Новое',
        'form[id]': id,
        'form[alias]': alias,
        submit: 1
    }
})
```

## Удаление (мягкое, в корзину)

```js
App.fetch(`/db/tt_tasks/${alias}?udel&ajax=1`, { method: 'POST' })
```

## Нормализация ответа

`resp.data` может быть массивом, объектом или вложенным — зависит от каталога и пагинации. Безопасный парсинг:

```js
function asArray(resp) {
    if (Array.isArray(resp?.data)) return resp.data;
    if (Array.isArray(resp?.data?.data)) return resp.data.data;
    return [];
}
```

## Фильтрация и сортировка

```js
// Фильтр по полю
App.fetch('/db/tt_tasks.json?form[status]=open&form[priority]=high')

// Сортировка и пагинация через /api/db/ (если нужны расширенные опции)
App.fetch('/api/db/tt_tasks?filter[status]=open&order_by=created&order=DESC&limit=20&load_values=1')
```

## Документация

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — полный справочник с параметрами и примерами
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/korfix-catalogs.md` — список доступных каталогов
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/self-provisioning.md` — работа с кастомными каталогами (префикс `custom_`)
