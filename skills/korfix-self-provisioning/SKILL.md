---
name: korfix-self-provisioning
description: Use when a miniapp needs to create its own catalogs (tables) and custom fields at first install. Covers the catalog existence check, field creation via App.fetch, and installer UI pattern.
---

# korfix-self-provisioning

Создание кастомных каталогов и полей при первом запуске миниаппа.

## Паттерн: проверка + экран установки

```js
// НЕПРАВИЛЬНО — не проверять через /db/custom_catalog.json
// CRM fallback'ит на дефолтный каталог, вернёт status:ok даже если каталога нет

// ПРАВИЛЬНО — через реестр custom_dbtables
async function checkCatalogExists(catalogName) {
    const tablename = catalogName.replace('custom_', '')
    const resp = await App.fetch('/db/custom_dbtables.json?form[dbname]=' + tablename)
    return !!(resp?.data && Array.isArray(resp.data) && resp.data.length > 0)
}
```

## Получить ID текущего пользователя (для from_auth/from_group)

```js
async function getCurrentUserId() {
    const schema = await App.fetch('/db/custom_dbtables/sheme.json')
    const arr = schema?.data?.from_auth?.arr || {}
    return Object.keys(arr).find(k => k !== '0') || 0
}
```

## Создать каталог и поля

```js
function uid() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 8) }

// Создать каталог
await App.fetch('/db/custom_dbtables/add?edit&ajax=1', {
    method: 'POST',
    body: {
        'form[alias]': uid(),
        'form[name]': 'My Catalog',
        'form[dbname]': 'mycatalog',   // без custom_ префикса
        'form[from_auth]': userId,
        'form[from_group]': userId,
        submit: 1
    }
})

// Создать поле
await App.fetch('/db/custom_dbfields/add?edit&ajax=1', {
    method: 'POST',
    body: {
        'form[alias]': uid(),
        'form[name]': 'Текст',
        'form[dbname]': 'content',
        'form[type]': 'textarea',
        'form[scheme]': 'custom_mycatalog',   // с custom_ префиксом
        'form[from_auth]': userId,
        'form[from_group]': userId,
        submit: 1
    }
})
```

## Типы полей

| type | Описание |
|------|---------|
| `textbox` | Строка |
| `textarea` | Многострочный текст |
| `select` | Список (варианты в `f_arr` через `\n`) |
| `checkbox` | Чекбокс |
| `datetime` | Дата и время |
| `photo` | Файл |
| `select_from_table` | Связь с другим каталогом |

## Доступ к полям в коде

Поля кастомного каталога всегда с префиксом `custom_`:
```js
note.custom_content, note.custom_priority, note.custom_status
```

## UI-шаблон

```html
<div id="installScreen" style="display:none;">
    <button id="btnInstall">Установить структуру данных</button>
</div>
<div id="mainUI" style="display:none;"></div>

<script type="module">
const App = new VMCRMUserApp();
const exists = await checkCatalogExists('custom_mycatalog')
document.getElementById(exists ? 'mainUI' : 'installScreen').style.display = ''
document.getElementById('btnInstall')?.addEventListener('click', async () => {
    await runInstall()
    location.reload()
})
</script>
```

## Права доступа (access_db) — обязательно

После создания кастомного каталога платформа автоматически создаёт запись в `access_db`, но **только для admin/root**. Обычные роли (менеджер, оператор, клиент и т.д.) **не увидят** каталог.

Миниап должен либо:

**1. Обновить `access_db` после создания каталога:**

```js
// Найти auto-created запись access_db
const acc = (await App.fetch(
    '/db/access_db.json?form[dbmodule]=custom_quicknotes'
)).data?.[0];

if (acc) {
    // Значения acctype_*: 0=нет, 1=все, 2=только свои
    await App.fetch(`/db/access_db/${acc.alias}?edit&ajax=1`, {
        method: 'POST',
        body: {
            'form[id]': acc.id,
            'form[alias]': acc.alias,
            'form[dbmodule]': acc.dbmodule,
            'form[acctype_adm]': 1,     // менеджеры — полный доступ
            'form[acctype_b2b2]': 2,    // операторы — только свои
            submit: 1
        }
    });
}
```

**2. Написать в `about` → «Настройка»** явную инструкцию: «После установки откройте `/db/access_db`, найдите запись для `custom_{catalog}`, пропишите права ролям».

Список всех `acctype_*` — специфичен для инстанса. Получать через `App.fetch('/db/access_db/sheme.json')`. На `panel.korfix.ru`: acctype_root, acctype_adm, acctype_res, acctype_fin, acctype_ag1..6, acctype_ec1..5, acctype_b2b1..3, acctype_md1..3.

## Документация

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/self-provisioning.md` — полный справочник, типы полей, FK-связи, раздел про access_db
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — CRUD через App.fetch
