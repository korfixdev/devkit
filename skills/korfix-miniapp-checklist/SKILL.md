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
- [ ] **`custom_` префикс везде при доступе к своим каталогам/полям**:
    - `App.fetch('/db/custom_my_catalog.json')` — не `/db/my_catalog.json`
    - `record.custom_my_field` — не `record.my_field`
    - В `permissions.catalogs` и точках встраивания — тоже с префиксом
    - Исключение: при создании в `custom_dbtables.dbname` префикс **не указывается** (платформа добавит), а в `custom_dbfields.scheme` — **указывается**
- [ ] **Права `access_db` прописаны для нужных ролей**:
    - По умолчанию после создания кастомного каталога доступ имеют только `acctype_root` и `acctype_adm` (админы). Остальные роли — нет доступа.
    - Если миниап для обычных ролей (менеджер, оператор, клиент) — обновить `access_db` через API при установке **или** написать в `about` → «Настройка» инструкцию для админа.
    - Схема access_db: `dbmodule` = полный alias (`custom_X`), `from_group` = тенант, `acctype_*` = 0/1/2 (нет/все/только свои)
- [ ] `App.setFrameSize(null, document.body.scrollHeight)` вызывается после рендера

## UI / UX

- [ ] Пустое состояние: если данных нет -- осмысленное сообщение, не ошибка
- [ ] Адаптивная вёрстка: таблицы на мобильных не обрезаются
- [ ] Шрифт полей ввода >= 16px (иначе iOS Safari зумит)
- [ ] Кликабельные элементы: `<a>` или `<button>`, не `<div>` (iOS не обрабатывает клик на div)
- [ ] Есть шестерёнка (⚙) для настроек или экрана установки (если есть self-provisioning)

## Перед отправкой

- [ ] Деплой через API: `curl -X POST .../api/db/marketplace/{ID}?token={TOKEN} -F "doc1=@app.zip"`
- [ ] После деплоя проверить версию: `appconfig.version` в ответе соответствует ожидаемой
- [ ] Приложение открыто в браузере и протестировано (не только задеплоено)

---

Если хоть один пункт не выполнен -- исправить до деплоя. После самопроверки — запусти `korfix-miniapp-validate` в subagent для беспристрастного ревью.

## Документация

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md` -- полный оригинальный чеклист с расширенными пояснениями
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md` -- деплой и обновление
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/config-json.md` -- точки встраивания и permissions
