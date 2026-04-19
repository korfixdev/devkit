# Changelog

Все значимые изменения плагина будут здесь.

Формат — [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), версионирование — [SemVer](https://semver.org/).

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
- MCP connection config для `mcp.korfix.ru` (опционально, через `${KORFIX_MCP_URL}`).

---

## Рекомендации по обновлению

Плагины **не обновляются автоматически**. Чтобы получить свежую версию:

```
/plugin marketplace update korfixdev
/plugin update korfix-devkit
/reload-plugins
```

После этого агент и skills подхватят новые правила валидации, паттерны для access_db и рекомендации.
