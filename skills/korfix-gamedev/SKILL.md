---
name: korfix-gamedev
description: Use when building or modifying game/gamification miniapps for the Korfix marketplace (apps using the korgames module — Korn balance, quests, leaderboards, in-game shop, cross-game profile). Describes the API contracts (request/response shapes), recipes for all typical mechanics (earn/spend/shop/leaderboard/profile/avatar-upload), required permissions, and styling rules. Read this before writing any game-related miniapp.
---

Экосистема gamedev-миниапов Korfix использует модуль ядра **korgames**: кошельки Korn/Платина, квесты, стрики, per-game лидерборды, магазин items, кросс-игровой профиль с аватаром.

## Источник правды

**Публичные доки** (читай сразу, https://docs.korfix.info/gamedev/):

| Документ | Когда читать |
|----------|--------------|
| [concepts.md](https://docs.korfix.info/gamedev/concepts) | Всегда первым — модель Korn, эмиссия, квесты, профили |
| [api-reference.md](https://docs.korfix.info/gamedev/api-reference) | Полный справочник `/api/korgames/*` с request/response |
| [config-korgames.md](https://docs.korfix.info/gamedev/config-korgames) | Секция `korgames` в config.json, `package: "game-*"` convention, items |
| [client-api.md](https://docs.korfix.info/gamedev/client-api) | JS-обёртка над `App.fetch`, распаковка, absUrl |
| [recipes.md](https://docs.korfix.info/gamedev/recipes) | Копируй-вставляй рецепты для всех механик |
| [styling.md](https://docs.korfix.info/gamedev/styling) | `body` прозрачный, `.game-frame`, Korfix CSS tokens, кнопки |
| [project-structure.md](https://docs.korfix.info/gamedev/project-structure) | Модульная структура frames/core/modules/locales/styles, i18n |
| [coin-clicker-walkthrough.md](https://docs.korfix.info/gamedev/coin-clicker-walkthrough) | Построчный разбор эталона |
| [checklist.md](https://docs.korfix.info/gamedev/checklist) | Перед деплоем |

**Эталонов в плагине нет.** Сорсы образцов — внешние (если пользователь поделится путём/URL) или реконструируй по документации:

- [coin-clicker-walkthrough.md](https://docs.korfix.info/gamedev/coin-clicker-walkthrough) — построчный разбор эталона
- [recipes.md](https://docs.korfix.info/gamedev/recipes) — готовые snippet'ы механик
- [project-structure.md](https://docs.korfix.info/gamedev/project-structure) — модульная структура проекта

Этого достаточно чтобы собрать миниап. Если пользователь хочет работать **поверх** готового эталона — пусть укажет, где локально лежат сорсы (например `/home/.../etalon-apps/coin-clicker/`) или public GitHub.

## Quick-start для нового проекта

1. Построй структуру (см. [project-structure.md](https://docs.korfix.info/gamedev/project-structure) и walkthrough):
   - `config.json` с секцией `korgames` и `package: "game-<alias>"`
   - `frames/main.html`, `core/{api,i18n}.js`, `modules/game.js`, `locales/{en,ru}.json`, `styles/style.css`
2. Поменяй в `config.json`:
   - `name`, `alias`, `package: "game-<alias>"` (обязательно префикс)
   - `version`, `about`, `tags`
   - `korgames.game_id` и `korgames.items[]` под свою игру
   - `permissions.catalogs` — минимум `sys_game_scores` и `sys_game_profiles` (если рендеришь топ/профиль)
3. В `modules/game.js` — свой геймплей.
4. В `locales/{en,ru}.json` — свои тексты.
5. Deploy через `POST /api/db/marketplace` → `POST /api/marketplace/deploy/{id}`.

## Ключевые правила (не игнорировать)

### Package
- **Игра** → `package: "game-<alias>"`
- **Системный** (Hub и т.п.) → `package: "games-<alias>"`
- Без префикса — не gamedev, обычный бизнес-миниап

### App.fetch (VMCRMUserApp)
- Body — **объект**, не `JSON.stringify`
- Второй аргумент не `undefined` (JSON.stringify теряет)
- Распаковка: `r?.data ?? r` (postMessage-обёртка)

### URLs
- `/reimg/`, `/data/` — абсолютизируй через `App.requestParams.domain` (iframe на store, ресурсы на CRM)

### HTML/CSS
- `body { background: transparent }` — тематика в `.game-frame`, не body
- Кнопки Korfix-style: `border-radius: 3px`, `border-bottom: 3px solid darker`
- Все кликабельное с `:hover` и `:active` feedback

### i18n
- Три канала: URL `?lang=X` → localStorage → App.storage (приоритет)
- После setLang: history.replaceState + localStorage + App.storage
- `data-i18n` атрибуты для DOM-сущностей, `i18n.applyToDom` после init

### SWR-кеш
- SessionStorage → stale render → fresh fetch → diff-check → re-render
- Обязательная инвалидация при claimQuest / buy (стейт меняется)

### sys_* таблицы (для /db/ чтения)
- `hidden tinyint DEFAULT 0` колонка обязательна
- `access_db` запись per-(dbmodule, from_group) — без неё /db/ вернёт пустой массив

## Эмиссия Korn — критично

**Игра НЕ может начислять Korn самостоятельно.** Только через:

1. **Квест completed → claimed** — юзер сам забирает через `POST /api/korgames/quest/claim`
2. **Milestone событий платформы** (login, streak, create_record, referral, deploy_app) — автомат

**Score в игре** (POST /api/korgames/game/score) **Korn не начисляет** в MVP (reward_mode=score_only). Только пишет в `sys_game_scores` для лидерборда.

Если нужна новая механика награды — создаёшь квест в `sys_quests` с уникальным `condition_type` и серверный триггер `Games::checkQuest('your_type', +value)` (правка модуля ядра — это уже архитектор).

## Permissions — пример для типичной игры

```json
"permissions": {
    "catalogs": {
        "sys_game_scores":    ["read"],
        "sys_game_profiles":  ["read"],
        "sys_game_items":     ["read"],
        "sys_game_purchases": ["read"]
    },
    "storage":  true,
    "navigate": false,
    "modal":    true
}
```

Для интеграции с Hub (навигация в него):
```json
"catalogs": {
    "marketplace":    ["read"],
    "installed_apps": ["read"],
    ...
}
```

## Что читать дальше

- [api-reference.md](https://docs.korfix.info/gamedev/api-reference) — все endpoints с примерами
- [recipes.md](https://docs.korfix.info/gamedev/recipes) — рецепты начисления, магазина, топа, профиля, аватара
- [coin-clicker-walkthrough.md](https://docs.korfix.info/gamedev/coin-clicker-walkthrough) — построчный разбор эталона

## Диалог по механике — стоит вести

Если игра нетривиальная — уточни у пользователя:

- Какие события триггерят награды? → нужен ли новый condition_type в sys_quests?
- Single/multiplayer? (score_only хватит для MVP)
- Как балансировать economy (Korn за день × cap = потолок расходов)?
- Social: показывать аватары/ники других? → нужен sys_game_profiles в permissions

Не кодь вслепую на нестандартных механиках — стоимость потом переделать больше.
