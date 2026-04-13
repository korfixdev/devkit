# korfix-devkit

Claude Code plugin для разработки маркетплейс-миниапов на платформе Korfix.

Пакет содержит AI-агентов, skills и готовое MCP-подключение к Korfix API. После установки Claude Code может самостоятельно разрабатывать миниапы: создавать структуру, писать код, валидировать по чеклисту, упаковывать и деплоить через API.

## Установка

```
/plugin add github:korfixdev/devkit
```

## Настройка

Плагин требует токен доступа к Korfix API. Получить токен:
1. Зайди в свой инстанс Korfix (например, `panel.korfix.ru`)
2. Перейди в `/db/api` → Добавить токен
3. Выдай токен с классами: `db_*_get`, `db_*_post`, `db_marketplace_post`

Экспортируй токен в среду:
```bash
export KORFIX_TOKEN=your-token-here
```

Плагин использует токен для подключения MCP-сервера `mcp.korfix.ru/{token}/sse`, через который агенты читают каталоги и деплоят миниапы.

## Что внутри

### Агенты
- `korfix-miniapp-dev` — пишет миниапы с нуля, использует skills и документацию
- `korfix-miniapp-validator` — беспристрастно проверяет готовый миниап по чеклисту перед релизом

### Skills
- `korfix-miniapp-build` — процесс создания миниапа с нуля
- `korfix-miniapp-validate` — ревью перед деплоем
- `korfix-miniapp-config` — работа с config.json
- `korfix-js-api` — VMCRMUserApp и взаимодействие с платформой
- `korfix-self-provisioning` — создание кастомных каталогов и полей
- `korfix-catalog-schema` — получение схемы каталогов

### Документация

Вся документация — в `docs/miniapps/` (синхронизирована из [korfixdev/docs](https://github.com/korfixdev/docs)):
- `rules.md` — правила песочницы
- `getting-started.md` — первое приложение за 15 минут
- `config-json.md`, `js-api.md`, `data-api.md`, `storage-and-hooks.md` — API
- `styling.md`, `dashboards.md` — UI и стили
- `deploy.md`, `checklist.md` — релиз
- справочники каталогов: `korfix-catalogs.md`, `favorites-menu.md`, `bitrix24-sync.md` и другие

Онлайн-версия: [docs.korfix.ru](https://docs.korfix.ru).

## Использование

После `/plugin add` просто проси:

```
Создай миниап, который показывает количество записей в каталоге под его таблицей
```

Агент `korfix-miniapp-dev` прочитает документацию, напишет код, прогонит через `korfix-miniapp-validator` и задеплоит.

## Разработка плагина

Правки в агентов и skills — PR в этот репо. Правки документации — PR в [korfixdev/docs](https://github.com/korfixdev/docs), оттуда синкается автоматически.

## Лицензия

MIT — см. [LICENSE](LICENSE).

## Контакт

info@korfix.ru
