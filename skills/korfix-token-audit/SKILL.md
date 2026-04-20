---
name: korfix-token-audit
description: Use BEFORE starting Korfix miniapp development to verify what catalogs and operations the user's KORFIX_TOKEN actually has access to. Prevents wasted work building against catalogs the token can't read or write. If access is missing, the agent must ask the user to extend the token or pick an alternative catalog — never silently fail later.
---

# korfix-token-audit

Перед началом разработки миниапа — **проверить что токен реально может**, чтобы не строить против каталогов к которым нет доступа.

## Когда срабатывает

- Перед первым обращением к любому конкретному каталогу для разработки/тестирования
- При новой задаче — «нужно работать с каталогом X»
- Когда видишь HTTP 403/404 на `/api/db/{catalog}` — надо разобраться, проблема в токене или в имени

## Процесс

### Шаг 1. Получить список доступных токену каталогов

```bash
curl -s "${KORFIX_API_URL}/api/db/getcatalogs" \
  -H "Authorization: Bearer ${KORFIX_TOKEN}" | head -c 2000
```

Возвращает JSON со списком каталогов и доступных методов (`get`/`post`/`put`/`delete`). Это **реальный набор**, заданный при создании токена в `/db/api`.

### Шаг 2. Проверить нужный каталог точечно

```bash
# Чтение
curl -sI "${KORFIX_API_URL}/api/db/{catalog}?limit=1" \
  -H "Authorization: Bearer ${KORFIX_TOKEN}"

# Возможные ответы:
# HTTP/2 200 — доступ есть
# HTTP/2 403 — токен НЕ имеет класса db_{catalog}_get
# HTTP/2 404 — каталога не существует
# HTTP/2 401 — токен невалиден или истёк
```

### Шаг 3. Если доступа нет — ОБЯЗАТЕЛЬНО спроси пользователя

**Не молчи. Не пробуй обходить. Не используй другой каталог без подтверждения.**

Возможные варианты:

**A. Попросить расширить токен:**
> «Для работы с каталогом `{catalog}` токену не хватает класса `db_{catalog}_{method}`. Можешь ли ты добавить его? В `/db/api` найди свой токен → раздел "Классы API" → отметь нужное → сохрани.»

**B. Предложить альтернативу** если знаешь:
> «Каталог `{catalog}` недоступен, но похожую функциональность даёт `{alternative}` (он у токена есть). Использовать его?»

**C. Если задача требует структуру которой нет в токене:**
> «Альтернатив в текущем токене нет. Создать кастомный каталог через self-provisioning (`custom_{name}`)? Или расширить токен?»

## Типовые случаи

| Случай | Что делать |
|---|---|
| Нужен `crm_clients`, у токена нет | Попросить добавить класс `db_crm_clients_get` и `db_crm_clients_post` |
| Нужен «clients» (без префикса) — нет такого | Уточни — скорее всего имеется в виду `crm_clients` (дефолтный) или `ag_clients` (AG-модуль). Спроси пользователя «какой именно?» — не угадывай |
| Кастомный каталог создан, но не виден в MCP (`/api/db/getcatalogs`) | Для кастомных каталогов MCP читает поле `custom_catalogs` токена. Добавить: `/db/api` → токен → «Доступ к кастомным каталогам» → выбрать каталог → сохранить. Или автоматически из install-фрейма через `registerCatalogForMCP` (см. `korfix-self-provisioning` skill) |
| Создаёшь `custom_X` через self-provisioning | Токен должен иметь: `db_custom_dbtables_get`, `db_custom_dbtables_post`, `db_custom_dbfields_post`, `db_access_db_get`, `db_access_db_post` (для настройки прав ролей). Без них self-provisioning зависнет на первом же запросе. |
| Программный deploy через API | Токен должен иметь: `marketplace_deploy_post` (атомарный endpoint) или `db_marketplace_post` + `marketplace_refresh_post` (два отдельных вызова). См. [docs](../../docs/miniapps/deploy.md). |

## Интеграция с workflow

1. **`korfix-miniapp-dev` агент** должен запускать этот skill при старте сессии разработки или при первом обращении к каталогу.
2. **Не использовать каталог, доступ к которому не подтверждён** — иначе ошибки выползут на этапе деплоя/использования, а не сразу.
3. **При создании self-provisioned каталога** — сразу проверить что у токена есть `db_custom_*` и `db_access_db_post` (для настройки прав).

## Документация

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — раздел «Ключевое правило: какой endpoint откуда»
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/self-provisioning.md` — про access_db
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/korfix-catalogs.md` — каталоги Korfix ERP
