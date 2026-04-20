---
name: korfix-miniapp-checklist
description: Use during miniapp development to ensure quality and avoid common mistakes. Run this checklist mentally before asking for validation. Intended for the developer, not the reviewer.
---

# korfix-miniapp-checklist

**ОБЯЗАТЕЛЬНО** запускать этот чеклист перед каждым деплоем миниаппа.
Не пропускать пункты, не считать что "и так понятно что сделано правильно".

## config.json

- [ ] JSON валидный (нет trailing comma, нет необработанных `\` или спецсимволов)
- [ ] `name` заполнен
- [ ] `package` заполнен (имя пакета / папки)
- [ ] `description` -- краткое (1-2 предложения)
- [ ] `about` -- строка с markdown через `\n`, содержит все разделы:
  - `## Что делает`
  - `## Где появляется в CRM` (с прямыми ссылками `/db/catalog`)
  - `## Возможности`
  - `## Как пользоваться`
  - `## Настройка`
- [ ] `logo` -- файл существует в zip
- [ ] `urls` -- все пути относительные (для zip-приложений), без домена
- [ ] `urlsConf` -- для локальных фреймов `"method": "get"`
- [ ] `permissions` -- явно объявлены все используемые каталоги и операции

## Файлы в zip

- [ ] `config.json` лежит в корне архива, не в папке
- [ ] Все файлы из `urls` существуют в архиве
- [ ] Нет запрещённых расширений: php, exe, sh

## Код

- [ ] `App.fetch()` используется для всех запросов (не `window.fetch`)
- [ ] `/db/` -- поля с `form[]`, `/api/db/` -- без `form[]`
- [ ] Массовое создание записей: явный `alias = uid()`, передаются `from_auth` и `from_group`
- [ ] Self-provisioning проверяет каталог через `custom_dbtables`, не через `/db/{catalog}.json`
- [ ] **При создании `custom_dbtables` передаётся `form[scheme]='coredb_def_catalog'`** — обязательное template-поле. Без него система не создаст таблицу.
- [ ] **`custom_` префикс везде при доступе к своим каталогам/полям**:
    - `App.fetch('/db/custom_my_catalog.json')` — не `/db/my_catalog.json`
    - `record.custom_my_field` — не `record.my_field`
    - В `permissions.catalogs` и точках встраивания — тоже с префиксом
    - Исключение: при создании в `custom_dbtables.dbname` префикс **не указывается** (платформа добавит), а в `custom_dbfields.scheme` — **указывается**
- [ ] **Права `access_db` — осознанно выбраны под целевую роль/схему**:
    - После INSERT `custom_dbtables` платформа **автоматически создаёт** запись `access_db` (root+adm=1, остальные=0). Обновлять, не создавать.
    - Прежде чем писать код — спросить пользователя если не очевидно: для какой роли каталог, как должны работать разные роли (см. skill `korfix-self-provisioning`).
    - Если для обычных ролей с персональными данными — `configureAccess(catalog, 2)` (каждый видит свои)
    - Если коллаборация (общие данные) — `configureAccess(catalog, 1)` (все видят все)
    - Если оставляем только админам — в `about` явно написать «Каталог доступен только администраторам»
    - Хелпер `configureAccess` подтягивает список ролей из схемы — портируемо между инстансами
- [ ] `App.setFrameSize(null, document.body.scrollHeight)` вызывается после рендера

## Фреймы

- [ ] **`install`-фрейм** (если есть self-provisioning):
  - [ ] Каждый мутирующий `App.fetch` → статус ответа проверяется явно (`resp.status === 'error'` → throw)
  - [ ] Лог устновки сохраняется в `App.storage` — ключ `install.log`
  - [ ] При повторном открытии: показывает сохранённый лог + «Переустановить» + «Закрыть»
  - [ ] Если `urls.widget` есть — в конце install вызывается `installWidgetOnDashboard(token)`
  - [ ] После установки переходит в `main`: `App.navigate('/db/installed_apps/${token}?frame=main')`
- [ ] **`main`-фрейм** (если есть `urls.install`): при загрузке проверяет `checkCatalogExists`, иначе `App.navigate(... frame=install)`
- [ ] **`widget`-фрейм**: `permissions.catalogs` содержит `"dashboard_widgets": ["read", "write"]`

Полный паттерн install + виджет + ответы API → `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/frames.md`

## UI / UX

- [ ] Пустое состояние: если данных нет -- осмысленное сообщение, не ошибка
- [ ] Адаптивная вёрстка: таблицы на мобильных не обрезаются
- [ ] Шрифт полей ввода >= 16px (иначе iOS Safari зумит)
- [ ] Кликабельные элементы: `<a>` или `<button>`, не `<div>` (iOS не обрабатывает клик на div)
- [ ] Есть шестерёнка (⚙) для настроек или экрана установки (если есть self-provisioning)

## Перед отправкой

- [ ] **`README.md` обновлён** — версия в нём совпадает с `config.json`, упомянуты использованные каталоги, custom-каталоги, история изменений. Запусти `korfix-tech-writer` (haiku-агент) если ещё не вызван
- [ ] **`README.md` включён в zip** — переносит документацию вместе с приложением, нужно для git и для следующих сессий
- [ ] Деплой через API: `curl -X POST .../api/db/marketplace/{ID}?token={TOKEN} -F "doc1=@app.zip"`
- [ ] После деплоя проверить версию: `appconfig.version` в ответе соответствует ожидаемой
- [ ] Приложение открыто в браузере и протестировано (не только задеплоено)

---

Если хоть один пункт не выполнен -- исправить до деплоя. После самопроверки — запусти `korfix-miniapp-validate` в subagent для беспристрастного ревью.

## Документация

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md` -- полный оригинальный чеклист с расширенными пояснениями
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md` -- деплой и обновление
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/config-json.md` -- точки встраивания и permissions
