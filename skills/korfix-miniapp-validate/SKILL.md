---
name: korfix-miniapp-validate
description: Use before deploying a Korfix miniapp to validate it against the release checklist. Produces a PASS/WARN/FAIL report with evidence per checklist item. Invoke as impartial reviewer from fresh context (not self-review).
---

# korfix-miniapp-validate

Беспристрастная валидация готового миниапа перед релизом. **Роль ревьюера, не разработчика.**

Запускается в fresh-context (subagent или отдельная сессия) — не знаешь истории разработки, не сочувствуешь автору, не «закрываешь глаза» на срезанные углы.

## Когда использовать

- Dev-агент закончил работу над миниапом и готов к деплою
- Нужен независимый аудит: все ли пункты чеклиста выполнены
- Перед публикацией в маркетплейс

## Вход

- **Путь к директории миниапа** (обязательно): `/path/to/app-dir`
- Либо путь к zip — тогда распаковать в `/tmp` и работать с распаковкой
- Опционально: версия / alias для контекста отчёта

## Процесс

1. Прочитать полный rubric: `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md`
2. Через `Glob` и `Read` обойти директорию миниапа: `config.json`, `*.html`, `*.js`, `*.css`
3. Для каждого пункта чеклиста вынести вердикт: **PASS** / **WARN** / **FAIL**
4. **Каждый вердикт ОБЯЗАН иметь evidence**: `файл:строка` или цитата. Без evidence — автоматический **FAIL**.
5. Агрегировать отчёт по блокам (config.json / файлы / код / UI-UX / после отправки)
6. Выдать общий статус: `READY` / `NOT READY` + summary причин

## Приоритеты пунктов

- **Critical (блокирует релиз):**
  - `config.json` невалиден, отсутствуют обязательные поля (`name`, `package`, `about`, `permissions`)
  - В zip/директории запрещённые расширения (`.php`, `.exe`, `.sh`)
  - `config.json` не в корне
  - Используются `window.fetch` / `XMLHttpRequest` вместо `App.fetch`
  - Отсутствует `permissions` или каталог используется без объявления
  - **Endpoint mismatch**: в миниапе (внутри iframe) используется `/api/db/...` с Bearer-токеном — должно быть `/db/...` через `App.fetch` (сессия). Bearer-токен не должен попадать в код миниапа в zip
  - **Каталог без префикса** который не существует в дефолтных тарифах: `/db/clients`, `/db/users` и подобное — должно быть `/db/crm_clients`, `/db/auth_pers` или явно указанный каталог из доступных. FAIL если используется generic-имя без проверки.
- **Must (должно быть, один FAIL = NOT READY):**
  - Все 5 разделов в `about`, прямые ссылки `/db/{catalog}` в «Где появляется в CRM»
  - `App.setFrameSize` вызывается
  - Шрифт input/select/textarea ≥ 16px
  - Кликабельные элементы — `<a>` или `<button>`
  - Массовое создание: `alias = uid()`, `from_auth`, `from_group`
  - Self-provisioning: проверка через `custom_dbtables`, а не `/db/{catalog}.json`
  - **Создание `custom_dbtables` передаёт `form[scheme]='coredb_def_catalog'`** — это обязательное поле, платформа без него отклоняет запрос. FAIL если в install-коде есть POST на `/db/custom_dbtables/add` без `form[scheme]` параметра. Единственное валидное значение сейчас — `coredb_def_catalog`, но валидатор должен проверять сам факт присутствия параметра.
  - **`custom_` префикс при доступе к своим каталогам и полям** — частая ошибка вайбкодинга:
    - URL: `App.fetch('/db/custom_X.json')`, не `/db/X.json` (FAIL если в коде есть `/db/{name}` где `{name}` совпадает с именем созданного через `custom_dbtables`, без префикса)
    - Поля: `record.custom_field`, не `record.field` (FAIL если в коде читается имя поля, созданного через `custom_dbfields`, без префикса)
    - В `permissions.catalogs` и точках встраивания — тоже с префиксом
    - Evidence: цитата из install-кода (где создавался каталог/поле без префикса) + цитата из usage-кода (где должен быть с префиксом, но нет)
  - **Права в `access_db` для новых каталогов** (self-provisioning apps):
    - После INSERT в `custom_dbtables` платформа **автоматически** создаёт запись `access_db` с дефолтом `acctype_root=1, acctype_adm=1` (остальные 0). Приложение не должно её создавать — только **обновлять** под нужную схему видимости.
    - Если миниап предназначен для обычных ролей (менеджер, клиент и т.д.) — install-код **должен обновить** `access_db` с `configureAccess(catalog, 2)` (self всем) или `configureAccess(catalog, 1)` (все видят все) или точечной настройкой.
    - Предпочтительно через helper `configureAccess` (подтягивает acctype_* из схемы — портируемо между инстансами), не хардкодить acctype_adm/acctype_b2b2/etc.
    - PASS: в install-коде есть `configureAccess(...)` или прямое обновление `/db/access_db/{alias}?edit` с осознанным выбором значений **ИЛИ** приложение только для админов и в `about` явно указано «только для администраторов».
    - FAIL: миниап встраивается в меню/каталоги для обычных ролей, install-код НЕ обновляет access_db, в `about` не указана роль доступа — юзеры получат пустой data, багрепорт гарантирован.
    - WARN: хардкод конкретных acctype_* вместо `configureAccess` — работает на текущем инстансе, но поломается на инстансе с другим набором ролей.
    - Evidence: цитата из `catalogs.{custom_X}.*` или `menu.{...}` в config.json + отсутствие update access_db в install-коде + отсутствие указания роли в about.
- **Фреймы (frame conventions из `docs/miniapps/frames.md`):**
  - **Critical:** `main.html` присутствует + `urls.install` объявлен, но в `main.html` нет `checkCatalogExists` или `App.navigate(... frame=install)` → FAIL
  - **Critical:** `install.html` содержит мутирующие `App.fetch` (POST на `/db/.../add`, `/db/.../edit`, запись в каталоги) — **каждый** такой вызов должен иметь проверку `if (!resp || resp.status === 'error' || resp.status === 'no') throw new Error(...)`. Проверять не только финальный шаг, но каждый: создание каталога, создание полей, `configureAccess`, `registerCatalogForMCP`. Один пропущенный check → FAIL (пользователь думает что установка прошла, каталог не создался)
  - **Must:** `urls.widget` объявлен + `urls.install` объявлен, но в `install.html` нет `installWidgetOnDashboard` или аналога → WARN («виджет не установится автоматически при инсталляции»)
  - **Must:** `urls.widget` объявлен, но `permissions.catalogs` не содержит `dashboard_widgets` → WARN
  - **Must-WARN:** `install.html` создаёт `custom_dbtables` (есть POST на `/db/custom_dbtables/add`), но нет вызова `registerCatalogForMCP` и в `about`/install-UI нет текста про «добавьте токену доступ к каталогу» → WARN («кастомный каталог не будет виден через MCP — добавьте регистрацию или инструкцию для пользователя»)
  - Evidence для Must: цитата из `install.html` (отсутствие вызова) + поле `urls.widget` из `config.json`

- **Nice-to-have (WARN, не блокирует):**
  - Оптимизация CSS, читаемость кода
  - Наличие шестерёнки для настроек
  - Пустое состояние оформлено осмысленно
  - **`README.md` в корне миниапа** — техническое описание модуля для разработчиков:
    - PASS: README.md существует, версия в нём совпадает с `config.json` version, упоминаются используемые каталоги и custom_-каталоги (если есть)
    - WARN: README.md отсутствует или устарел (например, версия не совпадает) — рекомендуй запустить `korfix-tech-writer` перед деплоем
    - README.md должен быть включён в zip (для переносимости и git'а), не в `.gitignore`

## Формат отчёта

```
=== MINIAPP VALIDATION: <name> v<version> ===

[config.json]
  PASS: name заполнен (config.json:2)
  FAIL: permissions не объявлены
  WARN: tags отсутствуют (config.json — нет поля)

[файлы в zip]
  PASS: config.json в корне
  FAIL: widget.html:urls.main не существует в директории

[код]
  FAIL: index.html:45 — прямой fetch() вместо App.fetch
  WARN: settings.html:12 — input font-size 14px, требуется ≥16

[UI/UX]
  PASS: адаптивная вёрстка (styles.css:89 @media)
  WARN: нет шестерёнки для настроек

SUMMARY
  Critical: 2 FAIL
  Must: 1 FAIL, 1 WARN
  Nice: 1 WARN

STATUS: NOT READY
Блокеры: permissions, прямой fetch в index.html:45

Рекомендуемые действия (по приоритету):
1. Добавить permissions.catalogs в config.json
2. Заменить fetch() на App.fetch() в index.html:45
3. Увеличить font-size в settings.html:12 до 16px
```

## Правила беспристрастности

- Не принимать оправдания «это очевидно», «потом добавлю», «работает же». Либо выполнено, либо нет.
- Если разработчик передал дополнительный контекст («я не успел сделать X, но это не важно») — **игнорировать**. Судить только по артефакту.
- Если пункт чеклиста неоднозначен — трактовать **в пользу строгости** (WARN минимум).
- Не давать советов по оптимизации или улучшению архитектуры — только соответствие чеклисту.

## Документация

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md` — rubric (источник правды, читать при каждом запуске)
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/frames.md` — стандарты фреймов: install/main/footer/widget, паттерны, правила проверки
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md` — что означает готовность к релизу
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/config-json.md` — спека config.json для верификации

---

*Отличие от `korfix-miniapp-checklist`: этот skill — роль ревьюера с структурированным отчётом. Checklist — инструкция для разработчика при работе над миниапом.*
