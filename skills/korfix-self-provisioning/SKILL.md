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
// ВАЖНО: form[scheme] ОБЯЗАТЕЛЬНО, без него каталог не создастся.
// Единственное доступное значение сейчас: 'coredb_def_catalog' (template-схема базового каталога).
// Проверь актуальный список: App.fetch('/db/custom_dbtables/sheme.json') → data.scheme.arr
await App.fetch('/db/custom_dbtables/add?edit&ajax=1', {
    method: 'POST',
    body: {
        'form[alias]': uid(),
        'form[name]': 'My Catalog',
        'form[dbname]': 'mycatalog',              // без custom_ префикса
        'form[scheme]': 'coredb_def_catalog',      // ОБЯЗАТЕЛЬНО (template-схема)
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

## Права доступа (access_db) — обязательно подумать

После создания `custom_dbtables` (через UI или API) платформа **автоматически создаёт** запись в `access_db` с дефолтом `acctype_root=1, acctype_adm=1` (остальные роли = 0). Это значит:

- Каталог сразу виден **только admin-ролям** (root + администратор)
- Обычные роли (менеджер, оператор, клиент и т.п.) получат пустой `data: []` при чтении
- На таблице стоит `UNIQUE (dbmodule, from_auth, from_group)` — и платформа на сервере подставляет `from_group` из сессии/токена (при INSERT в любой каталог с ролевой моделью), так что клиенту передавать `form[from_group]`/`form[from_auth]` руками не нужно — можно опустить

Если миниап предназначен для обычных ролей — **обязательно обновить существующую access_db-запись** под нужную схему доступа. Не создавать новую: в `access_db` одна запись на `(dbmodule, from_group)` — права закодированы в колонках `acctype_*`.

**Анти-паттерн для access_db:** не использовать `from_auth=0` ("общая для группы") для расширения видимости. В других каталогах `from_auth=0` = "запись доступна всей группе", но в `access_db` видимость задаётся самими `acctype_*` колонками. Делать сразу две записи `(catalog, 0, group)` + `(catalog, user, group)` — бессмысленно и запутывает. Всегда одна запись на `(dbmodule, from_group)`.

**Перед созданием каталога для миниапа — спросить пользователя если не ясно из контекста:**
> Этот каталог — для какой роли видимости?
> 1. Только админ (оставить дефолт)
> 2. Персональные данные — каждая роль видит только свои записи (`acctype_* = 2`)
> 3. Коллаборация — все роли видят все записи (`acctype_* = 1`)
> 4. Точечно — указать конкретно для каких ролей и как

Не угадывать. От ответа зависит логика `configureAccess`.

### Значения acctype_*

| Значение | Доступ |
|---|---|
| `0` | Нет (каталог скрыт) |
| `1` | Все записи организации (from_group) — для коллаборативных каталогов (задачи, клиенты) |
| `2` | Только свои записи (from_auth = user_id) — для персональных данных |

### Best default: «self всем ролям» (значение 2)

**Самый типовой кейс — поставить `2` (self) всем ролям.** Каждый видит только то что создал сам. Безопасно, подходит для 80% миниап-сценариев.

Используй готовый хелпер, который подтягивает актуальный список ролей из схемы — не хардкодить роли (они специфичны для инстанса):

Хелпер идемпотентный — **create-or-update**. Если afteradd-запись уже есть (стандартный случай) — обновит её. Если по какой-то причине отсутствует (старая версия платформы / ошибка в afteradd) — создаст.

```js
async function configureAccess(catalog, defaultValue = 2) {
    // 1. Список acctype_* полей из схемы текущего инстанса (не хардкодить)
    const schema = await App.fetch('/db/access_db/sheme.json');
    const acctypeFields = Object.keys(schema.data || {})
        .filter(k => k.startsWith('acctype_'));

    // 2. Искать существующую запись — одна на (dbmodule, from_group сессии)
    const existing = (await App.fetch(
        `/db/access_db.json?form[dbmodule]=${catalog}`
    )).data?.[0];

    // 3. Body: все роли = defaultValue
    const body = {
        'form[dbmodule]': catalog,
        'form[name]': catalog,
        submit: 1,
    };
    for (const field of acctypeFields) {
        body[`form[${field}]`] = defaultValue;
    }
    // from_group/from_auth не передаём — сервер подставит из сессии

    if (!existing) {
        // Create
        body['form[alias]'] = Date.now().toString(36) + Math.random().toString(36).substr(2, 8);
        await App.fetch('/db/access_db/add?edit&ajax=1', { method: 'POST', body });
    } else {
        // Update (не создаём дубль — UNIQUE на (dbmodule, from_auth, from_group))
        body['form[id]'] = existing.id;
        body['form[alias]'] = existing.alias;
        await App.fetch(`/db/access_db/${existing.alias}?edit&ajax=1`, { method: 'POST', body });
    }
}

// В installer:
await configureAccess('custom_my_notes');         // self всем (default 2)
await configureAccess('custom_shared_tasks', 1);  // все видят все
```

### Когда отклоняться от default

- **`1` (all)** — коллаборативные каталоги: задачи/поручения (вся команда видит), клиенты, сделки, склад. Пример: «написал задачу — её видят все участники»
- **`0` (нет)** — технические/служебные каталоги, скрытые от конкретных ролей (например, клиенты не должны видеть внутренние заметки)
- **Смешанно** — если роли реально отличаются (админ=1, менеджер=1, клиент=2)

### Альтернатива: инструкция админу

Если логика прав сложная или зависит от конкретного деплоя — в `about` → «Настройка»:
> После установки откройте `/db/access_db`, найдите запись для `custom_{catalog}`, пропишите права ролям.

## MCP-доступ к кастомным каталогам

После self-provisioning кастомный каталог **не виден через MCP по умолчанию**. MCP-агент обнаруживает каталоги через `/api/db/getcatalogs`, который читает поле `custom_catalogs` токена. Поле не заполняется автоматически при создании каталога.

**Способ 1 — Вручную:** `/db/api` → токен → поле «Доступ к кастомным каталогам» → выбрать нужные → сохранить.

**Способ 2 — Из install-фрейма** (требует `db_api_get` + `db_api_post` в `apiclasses_id` токена):

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

// В runInstall() — опциональный шаг, MCP-интеграция необязательна:
try {
    await registerCatalogForMCP('custom_quicknotes', tokenAlias)
    logLine('✓ Каталог зарегистрирован для MCP')
} catch (e) {
    logLine(`⚠ MCP-регистрация пропущена: ${e.message} — добавьте вручную в /db/api`)
}
```

`tokenAlias` — из контекста установки (спросить пользователя или взять из параметров фрейма). **Не хардкодить** в коде приложения.

## Документация

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/self-provisioning.md` — полный справочник, типы полей, FK-связи, раздел про access_db
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — CRUD через App.fetch
