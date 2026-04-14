# korfix-devkit

**Claude Code plugin for developing marketplace miniapps on the [Korfix](https://korfix.ru) ERP platform.**

Provides AI agents, skills, and optional MCP connection. After installation, Claude Code can develop miniapps end-to-end: scaffold, write code, validate against the release checklist, package, and deploy.

**Platform:** [korfix.ru](https://korfix.ru) · **Docs:** [docs.korfix.info](https://docs.korfix.info) · **Related plugin:** [korfixdev/assistant](https://github.com/korfixdev/assistant)

## Install

The plugin is distributed via the [Korfix Marketplace](https://github.com/korfixdev/marketplace). Add the marketplace once, then install plugins from it.

**New Claude Code (interactive `/plugin` UI):**

1. Type `/plugin` in Claude Code
2. Choose **Add marketplace** → paste `korfixdev/marketplace`
3. Once added, find `korfix-devkit` in the list → **Install**

**Older Claude Code (commands):**

```
/plugin marketplace add korfixdev/marketplace
/plugin install korfix-devkit@korfixdev
```

**Manual install** (any version, fallback):

```bash
git clone https://github.com/korfixdev/devkit ~/.claude/plugins/korfix-devkit
```

Then enable in Claude Code settings.

### After install — activate in current session

After installing, the plugin is **not active in your current Claude session yet**. To use it immediately:

```
/reload-plugins
```

Or just restart Claude Code — plugins load automatically on the next start.

## Setup

```bash
export KORFIX_API_URL="https://panel.korfix.ru"                      # your Korfix instance
export KORFIX_TOKEN="your-token-from-db-api"                         # required
export KORFIX_MCP_URL="https://mcp.korfix.ru/${KORFIX_TOKEN}/sse"    # optional, enables MCP mode
```

Get a token in your Korfix panel → `/db/api` → Add.

## What's inside

| Component | Role |
|-----------|------|
| Agent `korfix-miniapp-dev` | Writes miniapps: architecture, code, styling, packaging |
| Agent `korfix-miniapp-validator` | Impartial review before deploy (fresh context, checklist-driven) |
| 8 skills | `korfix-miniapp-validate`, `-checklist`, `-config`, `korfix-js-api`, `korfix-self-provisioning`, `korfix-catalog-schema`, `korfix-crud-data`, `korfix-token-audit` |
| Bundled docs | `docs/miniapps/` — synced from [korfixdev/docs](https://github.com/korfixdev/docs) |

## Usage

```
Create a miniapp that shows record count under each catalog's table
```

The agent will:
1. Ask for instance and token if env isn't set
2. Read bundled platform docs
3. Write code, package as zip
4. Spawn `korfix-miniapp-validator` for impartial review
5. On `READY` — deploy via API
6. On `NOT READY` — fix issues and re-validate

The agent never deploys without your confirmed instance and token.

## Security

- Keep the token in env, not in files. `KORFIX_TOKEN` never goes into miniapp commits.
- Grant the token **minimum privileges** — only needed catalogs and methods.
- Use separate tokens for prod and staging.

## License

MIT — see [LICENSE](LICENSE).

## Contact

info@korfix.ru

---

# korfix-devkit — на русском

**Claude Code plugin для разработки маркетплейс-миниапов на платформе Korfix.**

Содержит AI-агентов, skills и опциональное MCP-подключение. После установки Claude Code может самостоятельно разрабатывать миниапы: создавать структуру, писать код, валидировать по чеклисту, упаковывать и деплоить.

## Установка

Плагин распространяется через [маркетплейс Korfix](https://github.com/korfixdev/marketplace). Добавь маркетплейс один раз — потом устанавливай плагины из него.

**Новый Claude Code (интерактивный `/plugin` UI):**

1. Набери `/plugin` в Claude Code
2. Выбери **Add marketplace** → вставь `korfixdev/marketplace`
3. После добавления найди `korfix-devkit` в списке → **Install**

**Старый Claude Code (командой):**

```
/plugin marketplace add korfixdev/marketplace
/plugin install korfix-devkit@korfixdev
```

**Ручная установка** (любая версия, fallback):

```bash
git clone https://github.com/korfixdev/devkit ~/.claude/plugins/korfix-devkit
```

Потом включи в настройках Claude Code.

### После установки — активация в текущей сессии

После установки плагин **ещё не активен в текущей сессии Claude**. Чтобы пользоваться сразу:

```
/reload-plugins
```

Либо просто перезапусти Claude Code — при следующем старте плагины подтянутся автоматически.

## Настройка

```bash
export KORFIX_API_URL="https://panel.korfix.ru"                      # адрес твоего инстанса
export KORFIX_TOKEN="your-token-from-db-api"                         # обязательно
export KORFIX_MCP_URL="https://mcp.korfix.ru/${KORFIX_TOKEN}/sse"    # опционально, для MCP-режима
```

Получить токен — в панели Korfix → `/db/api` → Добавить.

## Что внутри

| Компонент | Роль |
|-----------|------|
| Агент `korfix-miniapp-dev` | Пишет миниапы: архитектура, код, стили, пакеджинг |
| Агент `korfix-miniapp-validator` | Беспристрастное ревью перед деплоем (fresh context, по чеклисту) |
| 8 skills | `korfix-miniapp-validate`, `-checklist`, `-config`, `korfix-js-api`, `korfix-self-provisioning`, `korfix-catalog-schema`, `korfix-crud-data`, `korfix-token-audit` |
| Документация | `docs/miniapps/` — синхронизировано из [korfixdev/docs](https://github.com/korfixdev/docs) |

## Использование

```
Создай миниап, который показывает количество записей в каталоге под его таблицей
```

Агент:
1. Спросит инстанс и токен если env не задан
2. Прочитает документацию из плагина
3. Напишет код, упакует в zip
4. Запустит `korfix-miniapp-validator` для беспристрастного ревью
5. При `READY` — задеплоит через API
6. При `NOT READY` — починит и перепроверит

Агент никогда не деплоит без подтверждённого инстанса и токена.

## Безопасность

- Токен держи в env, не в файлах. `KORFIX_TOKEN` не попадает в коммиты миниапа.
- Выдавай токену **минимум прав** — только нужные каталоги, только нужные методы.
- Для прода и теста — разные токены.

## Лицензия

MIT — см. [LICENSE](LICENSE).

## Контакт

info@korfix.ru
