# korfix-devkit

Claude Code plugin для разработки маркетплейс-миниапов на платформе Korfix.

Пакет содержит AI-агентов, skills и опциональное MCP-подключение. После установки Claude Code может самостоятельно разрабатывать миниапы: создавать структуру, писать код, валидировать по чеклисту, упаковывать и деплоить.

---

## Установка

```
/plugin add github:korfixdev/devkit
```

## Настройка окружения

Плагин не содержит никаких хардкодов. **Инстанс, токен и MCP-URL** задаёшь ты — для своего Korfix.

### Минимум (без MCP)

```bash
export KORFIX_API_URL="https://panel.korfix.ru"    # адрес твоего инстанса
export KORFIX_TOKEN="your-token-from-db-api"        # токен с классами db_*_get/post, db_marketplace_post
```

Получить токен:
1. В Korfix панель → `/db/api` → Добавить
2. Выдай токен с нужными классами API
3. Скопируй и экспортируй в env

Агент будет ходить через `curl`/`App.fetch` в пределах выданных прав.

### С MCP (рекомендуется)

MCP-сервер упрощает работу агента: вместо `curl` команд — нативные инструменты `catalog_schema`, `db_read`, `db_insert`, `db_update`.

```bash
export KORFIX_API_URL="https://panel.korfix.ru"
export KORFIX_TOKEN="your-token"
export KORFIX_MCP_URL="https://mcp.korfix.ru/${KORFIX_TOKEN}/sse"
```

Для self-hosted Korfix укажи свой MCP-endpoint.

---

## Что внутри

### Агенты

| Агент | Роль |
|-------|------|
| `korfix-miniapp-dev` | Пишет миниап: архитектура, код, стили, пакеджинг |
| `korfix-miniapp-validator` | Беспристрастный ревью готового миниапа перед деплоем |

### Skills

| Skill | Когда срабатывает |
|-------|-------------------|
| `korfix-miniapp-validate` | Перед деплоем — структурированный отчёт PASS/WARN/FAIL |
| `korfix-miniapp-checklist` | Во время разработки — инструкция для автора |
| `korfix-miniapp-config` | Работа с `config.json` — поля, permissions, about |
| `korfix-js-api` | `VMCRMUserApp` внутри iframe |
| `korfix-self-provisioning` | Создание кастомных каталогов при установке |
| `korfix-catalog-schema` | Получение схемы каталога (типы полей, FK) |
| `korfix-crud-data` | CRUD через `App.fetch` внутри iframe |

### Документация

`docs/miniapps/` — синхронизированная копия [korfixdev/docs](https://github.com/korfixdev/docs). Агент читает её через `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/...`.

---

## Использование

После установки и настройки env:

```
Создай миниап, который показывает количество записей в каталоге под его таблицей
```

Что произойдёт:
1. `korfix-miniapp-dev` спросит, на какой инстанс работаем (если env не задан)
2. Прочитает документацию из плагина
3. Напишет код, упакует в zip
4. Запустит subagent `korfix-miniapp-validator` для ревью
5. При `READY` — задеплоит через API
6. При `NOT READY` — починит и перепроверит

**Агент никогда не деплоит без твоего инстанса и токена.** Если env не задан — спросит.

---

## Безопасность

- Токен держи в env, не в файлах. `KORFIX_TOKEN` не попадает в коммиты миниапа.
- Выдавай токену **минимум прав** — только нужные каталоги, только нужные методы.
- Для прода и теста — разные токены.

---

## Разработка плагина

- Правки агентов/skills → PR в этот репо
- Правки документации → PR в [korfixdev/docs](https://github.com/korfixdev/docs) (оттуда sync сюда)

## Лицензия

MIT — см. [LICENSE](LICENSE).

## Контакт

info@korfix.ru
