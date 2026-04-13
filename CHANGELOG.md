# Changelog

Все значимые изменения плагина будут здесь.

Формат — [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), версионирование — [SemVer](https://semver.org/).

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
