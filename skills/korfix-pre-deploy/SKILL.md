---
name: korfix-pre-deploy
description: Use immediately before deploying a Korfix miniapp. Step-by-step pre-deploy checklist for the developer agent — version bumped, validator passed, zip built correctly. Run this BEFORE calling korfix-miniapp-validator.
---

# korfix-pre-deploy

Пошаговый чеклист перед деплоем миниапа. Выполняй последовательно — не пропускать шаги.

## Шаг 1 — Версия бамплена?

Открой `config.json`. Проверь `version`. Определи уровень изменений:

| Что изменилось | Bump |
|----------------|------|
| Только багфиксы, правки текста | PATCH `x.y.Z+1` |
| Новая функция, новый фрейм, новый каталог | MINOR `x.Y+1.0` |
| Кардинальные изменения UX/архитектуры | MAJOR `X+1.0.0` |

Если версия не изменена со времени последнего деплоя — **обновить обязательно**.

## Шаг 2 — README актуален?

Запусти `korfix-tech-writer` (subagent, haiku):
- Передай путь к директории миниапа
- Передай «что изменилось» в 1-2 предложениях
- Дождись обновления README.md

README.md идёт в zip — он должен отражать текущее состояние.

## Шаг 3 — Независимая валидация

Запусти `korfix-miniapp-validator` в **fresh subagent**:
- Передай только путь к директории и версию
- Не передавай историю разработки
- Получи `STATUS: READY` или `NOT READY`

Если `NOT READY` — исправь все Critical и Must пункты, повтори валидацию.

## Шаг 4 — Собери zip

```bash
cd /path/to/app-dir
zip -r /tmp/app.zip config.json *.html *.js *.css *.svg README.md
```

Проверь что в zip:
- [ ] `config.json` в корне (не в папке)
- [ ] все фреймы из `urls` присутствуют
- [ ] `logo` файл присутствует
- [ ] `README.md` присутствует

## Шаг 5 — Деплой

**Update existing** (есть ID):
```bash
curl -X POST "${KORFIX_API_URL}/api/marketplace/deploy/${APP_ID}" \
  -H "Authorization: Bearer ${KORFIX_TOKEN}" \
  -F "doc1=@/tmp/app.zip;type=application/zip"
```

**Новое приложение** (нет ID):
```bash
curl -X POST "${KORFIX_API_URL}/api/db/marketplace" \
  -H "Authorization: Bearer ${KORFIX_TOKEN}" \
  -F 'name=App Name' \
  -F "doc1=@/tmp/app.zip;type=application/zip"
```

Проверь ответ: `"status": "ok"`. Если ошибка — не повторяй слепо, разберись с причиной.

## Шаг 6 — Smoke-test после деплоя

Открой приложение на инстансе:
1. Убедись что версия в маркетплейсе обновилась
2. Открой главный фрейм — нет ли 404, белого экрана, ошибок в консоли
3. Если есть widget — проверь что он грузится
