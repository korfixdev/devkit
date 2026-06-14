---
name: korfix-gamedev
description: Use when building or modifying game/gamification miniapps for the Korfix marketplace (apps using the korgames module — Korn balance, quests, leaderboards, in-game shop, cross-game profile). Describes the API contracts (request/response shapes), recipes for all typical mechanics (earn/spend/shop/leaderboard/profile/avatar-upload), required permissions, and styling rules. Read this before writing any game-related miniapp.
---

The Korfix gamedev miniapp ecosystem uses the core **korgames** module: Korn/Platinum wallets, quests, streaks, per-game leaderboards, an item shop, and a cross-game profile with avatar.

## Source of truth

Documentation is **bundled locally** in `${CLAUDE_PLUGIN_ROOT}/docs/gamedev/` (synced from korfixdev/docs, English). Read on demand:

| Document | When to read |
|----------|--------------|
| `docs/gamedev/concepts.md` | Always first — Korn model, emission, quests, profiles |
| `docs/gamedev/api-reference.md` | Full `/api/korgames/*` reference with request/response |
| `docs/gamedev/config-korgames.md` | `korgames` section in config.json, `package: "game-*"` convention, items |
| `docs/gamedev/client-api.md` | JS wrapper over `App.fetch`, unwrapping, absUrl |
| `docs/gamedev/recipes.md` | Copy-paste recipes for every mechanic |
| `docs/gamedev/styling.md` | transparent `body`, `.game-frame`, Korfix CSS tokens, buttons |
| `docs/gamedev/project-structure.md` | Modular structure frames/core/modules/locales/styles, i18n |
| `docs/gamedev/coin-clicker-walkthrough.md` | Line-by-line walkthrough of the reference app |
| `docs/gamedev/checklist.md` | Before deploy |

**No reference apps are bundled in the plugin.** Reconstruct from the docs:

- `docs/gamedev/coin-clicker-walkthrough.md` — line-by-line walkthrough of the reference app
- `docs/gamedev/recipes.md` — ready-to-use mechanic snippets
- `docs/gamedev/project-structure.md` — modular project structure

This is enough to assemble a miniapp. If the user wants to build **on top of** an existing app, ask them to point to local sources (e.g. `/home/.../coin-clicker/`) or a public GitHub location.

## Quick-start for a new project

1. Build the structure (see `docs/gamedev/project-structure.md` and the walkthrough):
   - `config.json` with a `korgames` section and `package: "game-<alias>"`
   - `frames/main.html`, `core/{api,i18n}.js`, `modules/game.js`, `locales/{en,ru}.json`, `styles/style.css`
2. Edit in `config.json`:
   - `name`, `alias`, `package: "game-<alias>"` (prefix mandatory)
   - `version`, `about`, `tags`
   - `korgames.game_id` and `korgames.items[]` for your game
   - `permissions.catalogs` — minimum `sys_game_scores` and `sys_game_profiles` (if you render top/profile)
3. In `modules/game.js` — your gameplay.
4. In `locales/{en,ru}.json` — your texts.
5. Deploy → see the canonical decision table in `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md` (create via `POST /api/db/marketplace`, update via `POST /api/db/marketplace/{id}`).

## Key rules (don't skip)

### Package
- **Game** → `package: "game-<alias>"`
- **System** (Hub, etc.) → `package: "games-<alias>"`
- No prefix — not gamedev, a regular business miniapp

### App.fetch (VMCRMUserApp)
- Body — an **object**, not `JSON.stringify`
- 2nd argument never `undefined` (JSON.stringify drops it)
- Unwrap: `r?.data ?? r` (postMessage wrapper)

### URLs
- `/reimg/`, `/data/` — absolutize via `App.requestParams.domain` (iframe on store, resources on CRM)

### Profile strip — 3 systematic bugs (check all three!)
These bugs recurred in every game (snake, tetris, memory, space-invaders). Full recipe — `docs/gamedev/recipes.md` § "Header profile strip (canonical)".

1. **Name** — `p.display_name` only. There are no `name`/`username` fields in the `/api/korgames/profile` response → a fallback to them yields an eternal "Anonymous".
2. **Avatar** — `avatar_url` comes as `/reimg/...` relative to the store domain → **`absUrl()` is mandatory**, otherwise 404. And `absUrl` must produce `https://` + domain (not a bare domain, not `window.location.origin`).
3. **Edit link** — only `/db/installed_apps/{alias}?frame=main&tab=profile`. The alias comes from `installed_apps` by `form[app_id]={hub.id}` (NOT `marketplace_id`). Wrong variants `/app/{alias}/profile`, `/{alias}?tab=profile`, `/{alias}#profile` → 404.

### Unwrapping `/db/*.json` lists
`kg()` strips the postMessage wrapper (`r?.data ?? r`), but a catalog list is `{total, data:[...]}`. So rows are in `r.data.data`. Check order: `const rows = r?.data?.data || r?.data || []` (NOT the other way — `r?.data` is a truthy object and always wins, the array is never reached).

### HTML/CSS
- `body { background: transparent }` — atmosphere in `.game-frame`, not body
- Korfix-style buttons: `border-radius: 3px`, `border-bottom: 3px solid darker`
- Everything clickable has `:hover` and `:active` feedback

### Canvas-game layout (common mistake)
The iframe **auto-resizes to content** (ResizeObserver reports body height to the host). Hence:
- **Don't do `#app { height:100% }` + `.canvas-wrap { flex:1 }`.** The container stretches to the full iframe height while the canvas/overlays stay a fixed height → the game-over overlay (`position:absolute; inset:0`) ends up TALLER than the canvas (overlay 980px, canvas 640px).
- **Wrap everything in a centered column** (coin-clicker pattern): `#app { max-width: 380px; margin: 0 auto }`. Then header, canvas and overlays share one width — a portrait field, not 320px lost in a 1000px row.
- **Canvas fills the column width**, height by aspect (`ch = cw * ratio`); the canvas container is as tall as the canvas (not `flex:1`). The iframe pulls its own height to the content.
- A full-width desktop layout makes a portrait aspect (e.g. 1.69) absurdly tall (half off-screen) — the narrow column fixes that too.

### i18n
- Three channels: URL `?lang=X` → localStorage → App.storage (priority)
- After setLang: history.replaceState + localStorage + App.storage
- `data-i18n` attributes for DOM entities, `i18n.applyToDom` after init

### SWR cache
- SessionStorage → stale render → fresh fetch → diff-check → re-render
- Mandatory invalidation on claimQuest / buy (state changes)

### sys_* tables (for /db/ reads)
- `hidden tinyint DEFAULT 0` column is mandatory
- `access_db` record per-(dbmodule, from_group) — without it /db/ returns an empty array

## Korn emission — critical

**A game CANNOT mint Korn on its own.** Only via:

1. **Quest completed → claimed** — the user claims it via `POST /api/korgames/quest/claim`
2. **Platform event milestones** (login, streak, create_record, referral, deploy_app) — automatic

**Game score** (POST /api/korgames/game/score) **does not award Korn** in the MVP (reward_mode=score_only). It only writes to `sys_game_scores` for the leaderboard.

If a new reward mechanic is needed — create a quest in `sys_quests` with a unique `condition_type` and a server-side trigger `Games::checkQuest('your_type', +value)` (a core module change — that's the architect).

## Permissions — example for a typical game

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

For Hub integration (navigating into it):
```json
"catalogs": {
    "marketplace":    ["read"],
    "installed_apps": ["read"],
    ...
}
```

## What to read next

- `docs/gamedev/api-reference.md` — all endpoints with examples
- `docs/gamedev/recipes.md` — recipes for earning, shop, leaderboard, profile, avatar
- `docs/gamedev/coin-clicker-walkthrough.md` — line-by-line walkthrough of the reference app

## Dialogue on mechanics — worth doing

If the game is non-trivial — clarify with the user:

- Which events trigger rewards? → is a new `condition_type` in `sys_quests` needed?
- Single/multiplayer? (score_only is enough for MVP)
- How to balance the economy (Korn per day × cap = spending ceiling)?
- Social: show other players' avatars/names? → `sys_game_profiles` needed in permissions

Don't code blindly on non-standard mechanics — the cost to redo later is higher.
