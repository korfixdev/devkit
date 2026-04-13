---
name: korfix-miniapp-config
description: Use when writing or editing config.json for a Korfix miniapp. Covers required fields, about format, urls, permissions, and common mistakes. Prevents marketplace validation errors.
---

# korfix-miniapp-config

Правила создания config.json для миниаппов Korfix. Основные грабли при вайб-кодинге.

## Обязательная структура

```json
{
    "name": "Название",
    "version": "1.0.0",
    "description": "Краткое описание",
    "about": "## Что делает\n...\n## Где появляется в CRM\n...\n## Возможности\n...\n## Как пользоваться\n...\n## Настройка\n...",
    "logo": "icon.svg",
    "urls": { "main": "index.html" },
    "urlsConf": { "main": { "method": "get" } },
    "menu": {
        "some_catalog": { "frame": "main", "name": "Название в меню" }
    }
}
```

## Критичные правила (причина большинства syntax error и ошибок)

1. **`about` обязателен.** Без него — предупреждение, с плохим содержимым — ошибка маркетплейса.

2. **`about` = строка, не объект.** Весь markdown внутри одной строки с `\n`.
   Не помещать markdown как вложенный объект — это невалидный JSON.

3. **Экранирование в `about`:** только `\n` (перенос) и `\"` (кавычки). Никаких `--`, `***`, сложных спецсимволов.

4. **`urls` — всегда относительные пути** для zip-приложений (`"main": "index.html"`).
   Абсолютные URL — только для remote-приложений.

5. **`logo` — имя файла** из zip-архива. Должен существовать в zip (иначе ошибка при установке).

6. **`menu` ключ** = алиас каталога, **после** которого появится пункт меню.

7. **`permissions`** — если не указать, полный доступ (legacy, получишь warning). Для безопасности:
   ```json
   "permissions": {
       "catalogs": { "my_catalog": ["read", "write"] },
       "storage": true,
       "navigate": true,
       "modal": true
   }
   ```

## Точки встраивания

```json
"catalogs": {
    "ag_clients": {
        "tabs": [{ "name": "Таб", "frame": "main" }],
        "itemsActions": [{ "name": "Действие", "frame": "main" }],
        "catalog.item.view.footer": { "name": "Виджет", "frame": "main" },
        "catalog.items.footer": { "name": "Под списком", "frame": "main" },
        "afterSave": "remote"
    },
    "": { "itemsActions": [{ "name": "Для всех", "frame": "main" }] }
}
```

## Чеклист перед деплоем

- [ ] `about` заполнен и содержит все 5 разделов
- [ ] Все файлы из `urls` существуют в zip
- [ ] `logo` файл существует в zip
- [ ] JSON валиден (нет trailing comma, нет необработанных `\`)
- [ ] `urls` используют относительные пути
- [ ] `permissions` явно объявлены

## Документация

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/config-json.md` — все точки встраивания и permissions
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/getting-started.md` — первое приложение с нуля
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md` — деплой и обновление
