# Changelog

Все значимые изменения плагина будут здесь.

Формат — [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), версионирование — [SemVer](https://semver.org/).

## [0.23.0] — 2026-06-05

### Added
- **`skills/korfix-js-api` + `docs/miniapps/storage-and-hooks.md`** — `App.storage.getValue(key, default)` returns the bare stored value (`default` if the key is absent), symmetric with `set()` — the recommended way to read. `App.storage.getRow(key)` is an explicit alias of `get()` returning the full `{name, value, alias, app_id, ...}` record. Replaced the misleading cheat-sheet line `App.storage.get('key', defaultVal)` (which implied `get()` returns the value) with the correct forms.
- **`docs/miniapps/deploy.md` + `docs/miniapps/checklist.md` + `skills/korfix-miniapp-checklist`** — deploy-time manifest validation. The platform now validates the bundled `config.json` + archive on deploy and returns the verdict in the API response (both `POST /api/db/marketplace/{id}` and `POST /api/marketplace/deploy/{id}`): `errors` block the deploy (invalid JSON; missing `name`; missing/non-object `urls`; any `urls.*` or `logo` file absent from the zip); `warnings` come back on success (missing recommended `package`/`permissions`/`about`). Read them straight from the deploy response instead of opening the app to discover a broken manifest.

### Fixed
- **`docs/miniapps/data-api.md`** — corrected the `/api/db/` auth guidance. The previous note ("`App.fetch('/api/db/...')` is unauthenticated inside the iframe → 401, always use `/db/`") was WRONG: `App.fetch` proxies through the logged-in parent window, so `/api/db/` authenticates via the user **session** (no token needed). Removed the false "401 in iframe" claim and the **antipattern** in-app `?token=YOUR_TOKEN` examples. Inside a miniapp: prefer `/db/...` (with `form[]`) and pass no token; the Bearer / `?token=` path is for **external** callers (curl / CI / server / n8n); never hard-code a platform token in a shipped miniapp (marketplace-review failure).

### Changed
- All of the above mirrored to `korfix-docs` (ru + en).

> The storage (`getValue`/`getRow`) and deploy-validation items document **platform (sited_core3php8) changes** — they require the corresponding core deployed on the instances you target.

## [0.22.0] — 2026-06-04

### Added
- **`skills/korfix-js-api`** — Critical: never pass `undefined`/`null` as the 2nd arg to `App.fetch`. A GET wrapper `App.fetch(url, opts)` with `opts===undefined` serializes to `null`, the host fetch hits `typeof null==='object'` → `null.body` → the request hangs until the 60s timeout (silent: nothing loads). Branch on opts instead. (Found debugging Flappy: profile/avatar never loaded.)
- **`skills/korfix-gamedev`** — canvas-game layout rule: the iframe auto-resizes to content, so `#app{height:100%}`+`.canvas-wrap{flex:1}` stretches overlays taller than the canvas (980 vs 640). Use a centered `max-width` column (coin-clicker pattern); canvas fills column width, height by aspect.
- Mirrored both to `korfix-docs` (ru + en): `miniapps/js-api.md` fetch trap, `gamedev/styling.md` Rule #1.5 layout.

## [0.21.0] — 2026-06-03

### Added
- **`skills/korfix-gamedev`** — new "Profile strip — 3 систематические ошибки" rule and "Распаковка списков `/db/*.json`" rule. Captures bugs that hit every game (snake, tetris, memory, space-invaders): `display_name`-only naming, mandatory `absUrl()` for avatars, correct Games Hub profile navigation (`/db/installed_apps/{alias}?frame=main&tab=profile` by `form[app_id]`), and the `r?.data?.data || r?.data` unwrap order for catalog lists.
- **`agents/korfix-gamedev`** — same gotchas added to the Key Rules section (rule 4a + expanded rules 3, 4).

### Changed
- These are doc/skill fixes mirroring corrections also pushed to `korfix-docs` gamedev recipes & client-api (canonical profile-strip recipe, `goToProfileTab` helper, fixed `findAppByPackage` unwrap order, `#absolute-urls` anchor).

## [0.20.2] — 2026-06-03

### Fixed
- **`skills/korfix-miniapp-checklist`** — added mandatory "Open App" button check for all installer frames (not just self-provisioning). Installers without a link to `frame=main` leave users stranded after widget setup.

## [0.20.1] — 2026-06-03

### Fixed
- **`skills/korfix-js-api`** — corrected `modal.closed` pattern: debounce 50 ms required (multiple host instances relay same event); added concrete `App.modal()` + handler example showing the URL connection. Corrected polling pattern: `ts` field is not returned by API — use total + top-5 IDs snapshot via `order=ts_desc` instead.

## [0.20.0] — 2026-06-02

### Added
- **deploy_miniapp MCP support** in `korfix-miniapp-dev`: when MCP tool `deploy_miniapp` is available, agent uses it instead of curl — required for cloud Claude Code where external HTTP is blocked by egress proxy. Agent reads files via `Read` tool and passes `[{path, content}]` array; ZIP and POST are handled by the MCP server backend.

### Changed
- **Instance URL examples** updated from `panel.korfix.info` to `vibe.korfix.app` across `agents/korfix-miniapp-dev.md`, `README.md`, and `docs/miniapps/js-api.md` — platform has fully migrated to `vibe.korfix.app`.

## [0.19.1] — 2026-05-22

### Changed
- **`docs/miniapps/backend-development.md`** — added six best-practice recommendations from peer review: HTTP method whitelist, header whitelist with CRLF-injection guard, request body and response size caps, IPv6 brackets in `CURLOPT_RESOLVE`, generic upstream error responses. Aligned with reference `n8n-monitor` v1.4.2.

## [0.19.0] — 2026-05-22

### Added
- **`docs/miniapps/backend-development.md`** (synced from korfix-docs) — backend (PHP) разработка миниапов: когда нужен, lifecycle (quarantine → review → approve), sandbox limits, security requirements F1-F11 (включая SSRF guard с DNS-resolve + CURLOPT_RESOLVE), best practices, эталон n8n-monitor, pre-deploy checklist. Доступ ограничен сертифицированными разработчиками — упомянуто в introduction. Bilingual (ru/en) на сайте docs.korfix.info, дефолтная русская копия в плагине.

## [0.18.1] — 2026-05-21

### Added
- **TODO.md / CHANGELOG.md practices** — `korfix-miniapp-dev` now creates and maintains `TODO.md` (ideas backlog) and `CHANGELOG.md` (version history) in every miniapp project; both files included in deploy zip
- **`korfix-tech-writer`** — extended scope: also creates/updates `CHANGELOG.md` and appends TODO ideas when passed by dev agent

## [0.18.0] — 2026-05-21

### Changed
- **Full English translation** — all agents, skills, CLAUDE.md, CONTRIBUTING.md, README.md translated to English. `docs/miniapps/` (read-on-demand, mirror of korfix-docs) kept in Russian.

### Added
- **`sync-docs.sh`** — script to sync `docs/miniapps/` from sibling `korfix-docs/` repo (`rsync --delete`)

## [0.17.0] — 2026-05-21

### Added
- **`CLAUDE.md`** (plugin root) — правила эскалации агентов/skills; «новый миниап → analyst first»; деплой через validator
- **`skills/korfix-pre-deploy`** — пошаговый деплой-чеклист (версия → README → validator → zip → curl → smoke-test)
- **`skills/korfix-test-guide`** — ручная проверка в браузере по типам фреймов (main, widget, install)
- **`skills/korfix-miniapp-config`** — триггер «если новое приложение — сначала korfix-analyst»
- **`skills/korfix-miniapp-checklist`** — триггеры на `korfix-pre-deploy` и `korfix-miniapp-validator`; добавлен в deploy-workflow агента

### Changed
- **`agents/korfix-miniapp-dev`** — deploy-секция: явно включает `korfix-miniapp-checklist` и `korfix-pre-deploy` перед validator; добавлены «Версионирование миниапа» и «Workflow: доработка существующего»
- **`docs/miniapps/index.md`** — удалена мёртвая ссылка на несуществующий `../backend/index.md`; добавлена ссылка на `codex-integration.md`

## [0.16.0] — 2026-05-21

### Changed
- **Домены** — все ссылки `korfix.ru` заменены на `korfix.info` во всех файлах плагина
- **`agents/korfix-miniapp-dev`** — добавлена секция «Версионирование миниапа» (PATCH/MINOR/MAJOR для config.json), секция «Workflow: доработка существующего приложения»
- **`docs/miniapps/js-api.md`** — `getRequestParams()` теперь включает `token` в сигнатуре; добавлены комментарии к `app_id` и `token`

### Added
- **`CLAUDE.md`** (plugin root) — правила эскалации: когда запускать агентов, когда skills; жёсткое правило «новый миниап → analyst first»; деплой всегда через validator
- **`skills/korfix-pre-deploy`** — новый skill: пошаговый чеклист деплоя (версия → README → validator → zip → curl → smoke-test)
- **`skills/korfix-test-guide`** — новый skill: процедура ручной проверки в браузере по типам фреймов (main, widget, install); дополняет статический validator
- **`docs/miniapps/storage-and-hooks.md`** — предупреждение: переустановка приложения уничтожает данные storage; рекомендация кастомного каталога для критичных данных
- **`docs/miniapps/codex-integration.md`** — как использовать skills и docs без Claude Code (Codex, Cursor, Gemini CLI и др.)
- **`docs/miniapps/index.md`** — ссылка на `codex-integration.md`
- **`skills/korfix-miniapp-config`** — триггер «если новое приложение — сначала korfix-analyst»
- **`skills/korfix-miniapp-checklist`** — триггеры на `korfix-pre-deploy` и `korfix-miniapp-validator`

## [0.15.0] — 2026-05-19

### Added

- **`skills/korfix-miniapp-config`** — раздел «Категория (обязательно)» с таблицей id↔название (1=AI-agents, 2=Business, 3=Games, 4=Tools, 5=Other). При вайбкоде агент ставит `category` в config.json — платформа подтягивает значение в БД при первом install (если поле пусто).
- **`skills/korfix-miniapp-config` чеклист** — пункт «`category` проставлен (int 1..5)».

## [0.14.0] — 2026-05-18

### Fixed

- **`skills/korfix-self-provisioning`** — исправлена двойная обёртка postMessage при доступе к данным через `App.fetch` из iframe. `checkCatalogExists`: теперь читает `resp.data.data` (не `resp.data`). `getCurrentUserId`: схема через `schemaResp.data.data ?? schemaResp.data`. `configureAccess`: аналогичный фикс для schema и `existing`.
- **`skills/korfix-self-provisioning`** — `createTable`/`createField` переписаны как идемпотентные хелперы: ответ "уже используется" (createTable) и "duplicate" (createField) корректно обрабатываются как успех. Физическая таблица шарится между аккаунтами в одном облаке — это штатная ситуация при повторной установке.
- **`docs/miniapps/data-api.md`** — исправлены примеры двойной обёртки: `resp.data.data` для массивов, `resp.data.status` / `resp?.data?.status ?? resp?.status` для проверки статуса, `resp.data.data ?? resp.data` для схем. Хелпер `appFetch` теперь корректно читает `status` и `message`.
- **`docs/miniapps/data-api.md`** — `asArray()`: проверка `resp.data.data` вынесена первой (iframe-путь, более частый случай). Добавлен паттерн для доступа к полям схемы.
- **`docs/miniapps/self-provisioning.md`** — аналогичные фиксы двойной обёртки в `checkCatalogExists`, `configureAccess` (обе копии). Добавлена секция «Идемпотентность установщика».

### Added

- **`docs/miniapps/checklist.md`** — раздел «Проектирование»: вопросы про мультиязычность, inline-формы, скачивание файлов из iframe.
- **`docs/miniapps/styling.md`** — раздел «UX-ограничения iframe-контекста»: inline vs popup формы, blob download альтернативы, i18n-архитектура.

## [0.13.0] — 2026-05-12

### Added

- **`skills/korfix-js-api`** — `App.done()`: новый метод-сигнал из install-фрейма. Описан паттерн авто-установки + `App.done()` в install.html, поведение в setup-экране и за его пределами.
- **`skills/korfix-self-provisioning`** — раздел «UI-шаблон install.html»: объяснение двух режимов (setup-экран headless vs ручной запуск), паттерн авто-запуска без кнопки + `App.done()`, минимальный вариант.
- **`docs/miniapps/js-api.md`** — `App.done()` в таблице методов и полная секция с примером и заметками о fallback-поведении.

## [0.12.0] — 2026-05-03

### Added

- **`skills/korfix-js-api`** — `App.prefetch(url)`: новый метод для фонового prefetch данных. Описаны механики кеширования `getUser()`/`getRequestParams()` (Promise-кеш в сессии iframe) и дедупликация параллельных `App.fetch()` с одинаковым URL.
- **`docs/miniapps/js-api.md`** — раздел `prefetch(url)` с примером паттерна init + prefetch, заметка про дедупликацию в разделе `fetch()`.

## [Unreleased]

### Changed

- **`docs/miniapps/data-api.md`** — документация параметра `free_cache=1`: игнорирует закешированные в сессии фильтры при чтении `/db/catalog.json`. Добавлена таблица чтение/запись кеша для `not_cache` и `free_cache`, пример полного байпаса.
- **`skills/korfix-crud-data`** — упоминание `free_cache=1` в описании ссылки на data-api.md

## [0.11.0] — 2026-04-22

### Added

- **Agent `korfix-gamedev`** — специализированный агент для разработки игровых миниапов (на модуле `korgames`): Korn-экономика, квесты, лидерборды, кросс-игровой профиль, in-game shop, avatar upload. Читает `docs.korfix.info/gamedev/*` и эталоны `etalon-apps/games-hub/`, `etalon-apps/coin-clicker/`.
- **Skill `korfix-gamedev`** — точка входа со справкой по API, конвенциям и эталонам для агента и разработчика.

### Changed

- **`korfix-analyst`** — раздел «Игровые миниапы»: direct'ит на `korfix-gamedev` если идея игровая; расширенный discovery для gamedev (earn/spend/social/повторяемость).
- **`korfix-architect`** — блок про gamedev в «документации»: концепты эмиссии, reward_mode, cross-game profile, package convention.
- **`korfix-miniapp-validator`** — дополнительная проверка gamedev-правил если config имеет секцию `korgames` или `package` начинается с `game-` (сравнение с checklist.md на docs.korfix.info/gamedev).
- **`korfix-miniapp-dev`** — отсылка на `korfix-gamedev` если задача про игру/гамификацию.

## [0.10.0] — 2026-04-21

### Added

- **`korfix-self-provisioning`** — новый раздел «MCP-доступ к кастомным каталогам»: паттерн `registerCatalogForMCP`, два пути (ручной UI + автоматика из install-фрейма)
- **`korfix-miniapp-validate`** — расширена Critical-проверка install-ответов: каждый мутирующий `App.fetch`, не только последний; новое Must-WARN для кастомных каталогов без MCP-регистрации
- **`korfix-token-audit`** — обновлена строка про MCP и кастомные каталоги: указывает на поле `custom_catalogs` и `registerCatalogForMCP`
- **`docs/miniapps/self-provisioning.md`** — раздел «MCP-доступ к кастомным каталогам после установки»
- **`docs/miniapps/checklist.md`** — пункт про регистрацию кастомного каталога для MCP

## [0.9.0] — 2026-04-20

### Added

- **`docs/miniapps/frames.md`** — новый документ: стандарты и соглашения для типов фреймов (`install`, `main`, `footer`, `widget`). Описывает роль каждого фрейма, обязательные требования, паттерн авто-установки виджета на первый дашборд при install, правило обязательной проверки статуса ответа `App.fetch` в мутирующих запросах.
- **Валидатор** (`korfix-miniapp-validate`) — новые правила:
  - Critical: `main.html` без `checkCatalogExists` / `App.navigate(frame=install)` при наличии `urls.install`
  - Critical: `install.html` с мутирующими `App.fetch` без проверки `resp.status`
  - Must-WARN: `urls.widget` есть + `urls.install` есть, но нет авто-установки виджета при install
  - Must-WARN: `urls.widget` без `permissions.catalogs.dashboard_widgets`
- **Чеклист** (`korfix-miniapp-checklist`) — новый раздел «Фреймы»: install-лог, авто-виджет, redirect main→install, permissions для widget
- **docs.korfix.info** — новая страница [Update plugins](https://docs.korfix.info/plugin-update/) (EN + RU): ручное обновление через `/plugin marketplace update korfixdev` + `/reload-plugins`, авто-обновление через `/plugin` → Marketplaces → Auto-update, env-флаги `DISABLE_AUTOUPDATER` / `FORCE_AUTOUPDATE_PLUGINS`.

### Changed

- **`docs/miniapps/index.md`** — добавлен раздел «Архитектура приложения» с ссылкой на `frames.md`; таблица «задача → файлы» дополнена строкой про фреймы

## [0.8.0] — 2026-04-19

### Changed

- **`docs/miniapps/deploy.md`** — исправлена рекомендация по деплою: `POST /api/db/marketplace/{ID}` — основной эндпоинт (уведомляет store через внутренний хук); `/api/marketplace/deploy/{ID}` переопределён как удобный алиас «update + refresh» без статуса «предпочтительного». CI/CD скрипт обновлён.
- **`docs/miniapps/data-api.md`** — добавлен раздел «Сессионный кеш фильтров»: когда кеш применяется (только при `ajax=1` + совпадение Referer-пути), поведение `not_cache=1` (только запись, не чтение), `/api/db/` и hidden-поля схемы (`from_group`/`from_auth` — через `select=`).
- **`skills/korfix-crud-data`** — удалён дублированный контент; секции про кеш фильтров и hidden-поля перенесены в `data-api.md`, скилл ссылается на docs.

## [0.7.4] — 2026-04-18

### Fixed

- **`korfix-js-api` skill + `docs/miniapps/js-api.md`** — исправлена структура `getUser()`: поля `group` и `id` переименованы в `from_group` и `alias` соответственно; добавлено `from_auth` (author_id для `form[from_auth]`), `avatar`. Убраны несуществующие поля `group`/`id`.
- **`docs/miniapps/deploy.md`** — добавлен полный флоу создания приложения с нуля: `POST /api/db/marketplace/add` с `name=AppName` + zip без `form[]` обёртки. Добавлены эндпоинты `/api/marketplace/deploy/{id}` (upload + auto-refresh) и `/api/marketplace/refresh/{id}` (только кеш). CI/CD скрипт обновлён на предпочтительный `deploy` эндпоинт.

## [0.7.3] — 2026-04-18

### Fixed

- **korfix-crud-data** skill description расширен: теперь явно покрывает не только iframe/миниапы, но и любые операции с каталогами Korfix — деплой, маркетплейс, серверные скрипты, прямые API-вызовы. Добавлено различие `/db/` (сессия) vs `/api/db/` (Bearer токен).

## [0.7.2] — 2026-04-17

### Fixed

- **plugin.json** — убран блок `mcpServers` из манифеста плагина. MCP для devkit опциональный, но Claude Code валидировал `KORFIX_MCP_URL` при каждой загрузке и выдавал ошибку «Missing environment variables» у пользователей без MCP. Теперь агенты работают через curl по умолчанию; MCP подключается вручную через `.mcp.json` при необходимости.
- **README.md** — Setup-секция: `KORFIX_MCP_URL` перенесён в «опционально» с инструкцией по ручному подключению через `.mcp.json`

## [0.7.1] — 2026-04-17

### Fixed

- **README.md** — установка переписана как три отдельных шага с отдельными блоками для копирования: шаг 1 (добавить маркетплейс), шаг 2 (установить плагин), шаг 3 (`/reload-plugins`). Было: два `/plugin`-команды в одном блоке, что создавало иллюзию что их можно запустить вместе

## [0.7.0] — 2026-04-17

### Added

- **`korfix-analyst` agent** — бизнес-аналитик: интервьюирует пользователя о задаче, проверяет доступы токена через `korfix-token-audit`, консультируется с `korfix-architect`, получает рекомендации по расширению доступов, пишет технический README.md (спек для разработчика и модератора платформы)
- **`korfix-architect` agent** — архитектор решений: анализирует бизнес-задачу и отвечает на технические вопросы от аналитика — рекомендует каталоги, точки встраивания, указывает trade-off между «использовать существующий каталог с расширением доступов» и «сделать кастомный без него»

## [0.6.0] — 2026-04-17

### Added

- **`korfix-js-api` skill** — поля `from_auth` и `from_group` в `App.getUser()` с явным пояснением что именно передавать в `form[from_auth]`/`form[from_group]` при создании записей
- **`korfix-js-api` skill** — паттерны `App.navigate()` для открытия других приложений: `/db/installed_apps/{alias}?frame=main&catalog=marketplace` и `/db/marketplace/{alias}`
- **`korfix-js-api` skill** — правило про абсолютные пути для ресурсов платформы (аватары, файлы каталогов, иконки приложений); относительные пути резолвятся к store-URL архива

### Changed

- **Docs** (`js-api.md`) — `getUser()` возвращает `from_auth`/`from_group` явно; новая секция «Абсолютные пути для ресурсов платформы»; navigate-паттерны для межаппной навигации
- **Docs** (`korfix-catalogs.md`) — подробное описание каталогов `marketplace` (поля: `doc`, `from_group`, `tags`, путь иконки) и `installed_apps` (поле `app_id` → связь с marketplace.alias, семантика «установлено у тенанта»); новый раздел «Жизненный цикл приложения: marketplace → installed_apps → dashboard_widgets»
- **Docs** (`config-json.md`) — явная пометка что `urls.main` обязателен для apps с меню/installer; уточнение блока `menu`
- **Docs** (`checklist.md`) — новые пункты: `urls.main` обязателен если нужен installer; абсолютные пути для ресурсов платформы

## [0.5.0] — 2026-04-15

### Changed

- **`korfix-self-provisioning` skill** — хелпер `configureAccess` теперь идемпотентный create-or-update (раньше ранний `return` если запись отсутствовала). Упомянут UNIQUE `(dbmodule, from_auth, from_group)`, клиенту теперь можно не передавать `form[from_auth]`/`form[from_group]` — сервер подставит из сессии/токена.
- **`korfix-miniapp-validate` / `korfix-miniapp-checklist` / `korfix-token-audit`** — синхронизированы с новой семантикой access_db и серверной подстановкой from_group/from_auth.
- **Bundled docs** (`docs/miniapps/self-provisioning.md`, `checklist.md`) — warning-callout про анти-паттерн `from_auth=0` в access_db, раздел про серверную подстановку от April 2026, правки `configureAccess`.

### Added

- **Анти-паттерн callout** про `from_auth=0` в `access_db`: в обычных каталогах это "запись общая для группы", но в access_db видимость для ролей кодируется колонками `acctype_*` — row-ownership через from_auth платформой там не применяется.

## [0.4.0] — 2026-04-14

### Added

- **`korfix-tech-writer` agent** (haiku model — дёшево) — поддерживает `README.md` в корне директории миниапа: описание, файловая структура, используемые каталоги (read/write/custom), архитектурные решения, история изменений. Вызывается автоматически из `korfix-miniapp-dev` после значимых правок и обязательно перед деплоем.
- **`README.md` идёт в zip** — переносит документацию вместе с миниапом (для git, для следующих сессий, для других разработчиков).

### Changed

- **`korfix-miniapp-dev` agent** — добавлена секция «После значимых правок — обновляй README через tech-writer», и шаг «5. Перед zip — обновить README» в deploy-flow. Пример zip-команды теперь включает `README.md`.
- **Validator** — новый WARN-check: `README.md` отсутствует или версия не совпадает с config.json. Не блокирует деплой, но рекомендует tech-writer.
- **Checklist** — пункт про `README.md` обновлён + явное правило не исключать из zip.

## [0.3.0] — 2026-04-14

### Added

- **`korfix-token-audit` skill** — проверка возможностей токена ПЕРЕД разработкой: какие каталоги доступны, какие методы. При недостатке доступа агент **обязан спросить** пользователя (расширить токен, выбрать альтернативный каталог, или сделать `custom_X`) — не молча игнорировать.
- **«SECOND STEP — token audit»** в системном промпте `korfix-miniapp-dev` — обязательный шаг после env-check.
- **Endpoint discipline в агенте** — явное правило `/db/` (внутри iframe) vs `/api/db/` (curl/тесты, с Bearer). Запрет молча конвертировать одно в другое.
- **«Не угадывать имена каталогов»** в агенте — при «клиенты» спросить какой именно (`crm_clients`, `ag_clients`, ...), не писать `/db/clients`.

### Changed

- **`korfix-miniapp-validate`** — добавлены два Critical-правила: endpoint mismatch (Bearer-токен в коде миниапа), generic-имя каталога без префикса (`/db/clients`, `/db/users`).
- **Bundled docs синхронизированы** из `korfixdev/docs` — включая обновлённые self-provisioning (раздел про access_db с разделением «auth vs visibility»), data-api (новый раздел про endpoint discipline), getting-started (блок про curl/api/db/).
- Убраны legacy-упоминания `vmcrm-apps/` относительных путей из bundled docs.

### Fixed

- Self-provisioning документация про `access_db` теперь явно различает: **сессия/токен — это аутентификация, access_db — это row-level видимость**. Раньше агент путался, утверждая что «у нас есть сессия, access_db не нужен» — это неверно, без access_db каталог возвращает пустой список даже залогиненному пользователю.

## [0.2.0] — 2026-04-14

### Added

- **`access_db` rights management** — раздел про права доступа для self-provisioned каталогов в skill `korfix-self-provisioning`. Хелпер `configureAccess(catalog, defaultValue)` автоматически применяет права ко всем ролям из схемы — без хардкода (переносимо между инстансами).
- **Best-default pattern «`self` всем ролям»** (`acctype_* = 2`) для типового case — персональные данные каждый видит только свои.
- **Check `custom_` префикс везде** в валидаторе и чеклисте — URLs, чтение полей, permissions, точки встраивания. Частая ошибка вайбкодинга зафиксирована как Must-fail в валидаторе.
- **Check `access_db` прав** в валидаторе с разделением PASS/WARN/FAIL: PASS — есть `configureAccess` или точечное обновление, WARN — хардкод `acctype_*` (не портируется), FAIL — никак не обновляет и нет инструкции в `about`.
- **`getUser()` tarif документация** — новые поля `tarif` и `tarif_name` в skill `korfix-js-api`, описание биллинг-endpoint'а `/api/user/tariff` (только по сессии).

### Changed

- **Canonical plugin layout** — `plugin.json` перенесён в `.claude-plugin/`, skills в подпапках с `SKILL.md` (требование Claude Code plugin spec).
- **Install instructions multi-variant** — UI-флоу `/plugin`, CLI-команды для старых версий, ручная установка как fallback, кросс-клиентская заметка для Codex/Cursor/Claude Desktop.
- **Agent `korfix-miniapp-dev` hardened** — обязательно проверяет env (`KORFIX_API_URL`, `KORFIX_TOKEN`, `KORFIX_MCP_URL`), спрашивает пользователя если что-то не задано, не использует дефолтный инстанс.
- **Deploy docs clarified** — явно: `/db/marketplace` для деплоя, `/db/installed_apps` — автозаполняемый реестр, не трогать руками.
- **`repository` field в plugin.json** — теперь строка (было объект), соответствует schema.
- **Bilingual READMEs** (EN сверху, RU снизу) для международной видимости.

### Fixed

- Правильный формат source в marketplace.json (`url` type с full https URL вместо `github` shorthand — избегает SSH clone fallback).

## [0.1.0] — 2026-04-13

### Added

- Initial release.
- 2 агента: `korfix-miniapp-dev` (разработка миниапов), `korfix-miniapp-validator` (беспристрастное ревью перед деплоем).
- 7 skills: `korfix-miniapp-validate`, `-checklist`, `-config`, `korfix-js-api`, `korfix-self-provisioning`, `korfix-catalog-schema`, `korfix-crud-data`.
- Bundled docs (`docs/miniapps/`) — 21 файл документации.
- MCP connection config для `mcp.korfix.info` (опционально, через `${KORFIX_MCP_URL}`).

---

## Рекомендации по обновлению

Плагины **не обновляются автоматически**. Чтобы получить свежую версию:

```
/plugin marketplace update korfixdev
/plugin update korfix-devkit
/reload-plugins
```

После этого агент и skills подхватят новые правила валидации, паттерны для access_db и рекомендации.
