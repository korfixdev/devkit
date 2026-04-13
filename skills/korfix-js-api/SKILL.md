---
name: korfix-js-api
description: Use when writing JS inside a Korfix miniapp iframe that needs to interact with the platform — read/write catalogs, storage, modals, navigation, events. Covers VMCRMUserApp methods and CORS rules.
---

# korfix-js-api

VMCRMUserApp — JS-класс для взаимодействия миниаппа с CRM через postMessage.

## Подключение

```html
<script type="module">
import VMCRMUserApp from '/templates/def/db/marketplace/vmcrm-user-app.js';
const App = new VMCRMUserApp();
</script>
```

Путь абсолютный — всегда такой, не менять.

## Ключевые методы

```js
// Контекст фрейма
const { app_id, domain, catalog, itemId, items, user } = (await App.getRequestParams()).data

// Текущий пользователь
const { name, group, role, id } = (await App.getUser()).data
// group = from_group (тенант), id = хеш логина

// Fetch (всегда через App, не через window.fetch — CORS)
App.fetch('/db/catalog.json')
App.fetchAll('/db/catalog.json')   // все страницы автоматически

// UI
App.alert('Готово', 'Заголовок')
App.modal('/db/todo', { title: 'ToDo' })
App.closeModal()
App.navigate('/db/projects')
App.reload()
App.setFrameSize(null, 600)        // только высота

// KV-хранилище
App.storage.get('key', defaultVal)
App.storage.set('key', value)
App.storage.unset('key')

// События
App.on('page.navigated', (data) => { /* ... */ })
App.on('modal.closed', (data) => refreshData())
App.on('catalog.selected', (data) => { /* data.catalog, data.ids */ })
App.on('*', ({event, data}) => { /* wildcard */ })
App.off('page.navigated')           // отписать все
```

## Критично

- **Никогда не использовать `fetch()` напрямую** — CORS. Только `App.fetch()`.
- URL в `App.fetch()` — только относительные (без домена).
- Body передаётся как объект, преобразуется в URLSearchParams.

## Документация

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/js-api.md` — полный справочник методов и событий
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/storage-and-hooks.md` — App.storage и вебхуки
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — форматы запросов и фильтры
