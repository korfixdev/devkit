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

// Текущий пользователь (включая тариф)
const { name, from_auth, from_group, alias, role, avatar, tarif, tarif_name } = (await App.getUser()).data
// from_auth   = author_id пользователя — передавать в form[from_auth] при создании записей
// from_group  = ID тенанта — передавать в form[from_group] при создании записей
// alias       = md5(login) — идентификатор пользователя в системе приложений
// name        = ФИО (author_comment)
// role        = тип аккаунта (account_type, числовой)
// avatar      = имя файла аватара → /reimg/data/auth/{avatar}?80x80
// tarif       = ID тарифа (строка с числом, "7")
// tarif_name  = название тарифа ("Премиум")
// Используй для feature gating: if (tarif === '7') showProFeatures()

// Полная биллинг-инфа (баланс, скидки, даты, прайсы):
const billing = await App.fetch('/api/user/tariff')
// data: { tarif, tarif_name, balance, discount, discount_date, payment_date, price, discount_3months, discount_12months }

// Fetch (всегда через App, не через window.fetch — CORS)
App.fetch('/db/catalog.json')
App.fetchAll('/db/catalog.json')   // все страницы автоматически

// Prefetch — запустить в фоне заранее, чтобы App.fetch() вернул сразу
App.prefetch('/db/marketplace.json?limit=200&free_cache=1')
App.prefetch('/db/installed_apps.json?limit=200&free_cache=1')
// ... позже в том же init:
const resp = await App.fetch('/db/marketplace.json?limit=200&free_cache=1') // мгновенно

// UI
App.alert('Готово', 'Заголовок')
App.modal('/db/todo', { title: 'ToDo' })
App.closeModal()
App.done()                                           // сигнал «установка завершена» из install-фрейма
App.navigate('/db/projects')                         // переход к каталогу
App.navigate('/db/installed_apps/ALIAS?frame=main&catalog=marketplace')  // открыть установленное приложение
App.navigate('/db/marketplace/ALIAS')               // открыть карточку в маркетплейсе
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

## Кеширование и дедупликация (встроено в VMCRMUserApp)

- `getUser()` и `getRequestParams()` — результат кешируется как Promise. Первый вызов идёт в postMessage, последующие в той же сессии iframe — мгновенно.
- `App.fetch(url)` — дедупликация: два параллельных вызова с одним URL получают один и тот же Promise (полезно при `Promise.all`). Отключить: добавить `not_cache=1`.
- `App.prefetch(url)` → `App.fetch(url)` — если prefetch завершился до вызова fetch, данные возвращаются без postMessage.

## App.done() — сигнал завершения install-фрейма

Вызывается из `install.html` после self-provisioning. Сообщает setup-экрану платформы, что этот install-фрейм готов — платформа немедленно переходит к следующему приложению без ожидания таймаута.

```js
async function init() {
    const user = await App.getUser();
    if (!(await checkCatalogExists('custom_myapp'))) {
        await runInstall(user.data.from_auth, user.data.from_group);
    }
    App.done();  // всегда — и после установки, и если уже установлено
}
init();
```

- Вызывать в обоих ветках: установка прошла / каталог уже был.
- За пределами setup-экрана — no-op, безопасен.
- Если не вызван — fallback: 4 секунды после загрузки iframe.

## Критично

- **Никогда не использовать `fetch()` напрямую** — CORS. Только `App.fetch()`.
- URL в `App.fetch()` — только относительные (без домена).
- Body передаётся как объект, преобразуется в URLSearchParams.
- **Ресурсы платформы — абсолютные пути**: аватары `/reimg/data/auth/{doc}?80x80`, файлы каталогов `/data/db/f_{catalog}/{doc}`, иконки приложений `/data/db/f_marketplace/{doc}`. Относительные пути в iframe резолвятся к store-URL архива приложения, а не к CRM-домену.

## Документация

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/js-api.md` — полный справочник методов и событий
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/storage-and-hooks.md` — App.storage и вебхуки
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — форматы запросов и фильтры
