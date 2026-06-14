---
name: korfix-js-api
description: Use when writing JS inside a Korfix miniapp iframe that needs to interact with the platform — read/write catalogs, storage, modals, navigation, events. Covers VMCRMUserApp methods and CORS rules.
---

# korfix-js-api

VMCRMUserApp — JS class for miniapp interaction with the CRM via postMessage.

## Connecting

```html
<script type="module">
import VMCRMUserApp from '/templates/def/db/marketplace/vmcrm-user-app.js';
const App = new VMCRMUserApp();
</script>
```

The path is absolute — always use it as-is, do not change.

## Key methods

```js
// Frame context
const { app_id, domain, catalog, itemId, items, user } = (await App.getRequestParams()).data

// Current user (including plan)
const { name, from_auth, from_group, alias, role, avatar, tarif, tarif_name } = (await App.getUser()).data
// from_auth   = user's author_id — pass in form[from_auth] when creating records
// from_group  = tenant ID — pass in form[from_group] when creating records
// alias       = md5(login) — user identifier in the app system
// name        = full name (author_comment)
// role        = account type (account_type, numeric)
// avatar      = avatar filename → /reimg/data/auth/{avatar}?80x80
// tarif       = plan ID (string with number, "7")
// tarif_name  = plan name ("Premium")
// Use for feature gating: if (tarif === '7') showProFeatures()

// Full billing info (balance, discounts, dates, prices):
const billing = await App.fetch('/api/user/tariff')
// data: { tarif, tarif_name, balance, discount, discount_date, payment_date, price, discount_3months, discount_12months }

// Fetch (always via App, not window.fetch — CORS)
App.fetch('/db/catalog.json')        // → {status, ok, data, total} (ok always present)
App.fetchAll('/db/catalog.json')     // all pages automatically
App.fetchV2('/db/catalog.json')      // → {ok, status, data, error?, total} — same shape from iframe AND root window (recommended for new code)

// Prefetch — start in background early so App.fetch() returns immediately
App.prefetch('/db/marketplace.json?limit=200&free_cache=1')
App.prefetch('/db/installed_apps.json?limit=200&free_cache=1')
// ... later in the same init:
const resp = await App.fetch('/db/marketplace.json?limit=200&free_cache=1') // instant

// UI
App.alert('Done', 'Title')
App.modal('/db/todo', { title: 'ToDo' })
App.closeModal()
App.done()                                           // "install complete" signal from install frame
App.navigate('/db/projects')                         // navigate to catalog
App.navigate('/db/installed_apps/ALIAS?frame=main&catalog=marketplace')  // open installed app
App.navigate('/db/marketplace/ALIAS')               // open marketplace card
App.reload()
App.setFrameSize(null, 600)        // height only

// KV storage
App.storage.getValue('key', defaultVal)  // bare value + default (recommended)
App.storage.get('key')                   // full record {name,value,alias,...} — read .value
App.storage.getRow('key')                // explicit alias of get()
App.storage.set('key', value)
App.storage.unset('key')

// Events — data.url is the URL of the modal that closed
App.on('page.navigated', (data) => { /* data.url, data.title */ })
App.on('modal.closed', (data) => { /* data.url */ })
App.on('catalog.selected', (data) => { /* data.catalog, data.ids */ })
App.on('*', ({event, data}) => { /* wildcard */ })
App.off('page.navigated')           // unsubscribe all
```

### Pattern: reload list after editing a specific catalog

`modal.closed` fires when the user closes a modal opened via `App.modal()`.
`data.url` is the same URL passed to `App.modal()` — use it to filter.
**Debounce 50 ms** required: multiple host instances relay the same event, causing double-fire.

```js
// Open edit modal for a record
App.modal('/db/tt_projects/' + alias + '?edit', { title: 'Edit' });

// React to close — data.url matches the URL from App.modal()
let _reloadTimer = 0;
App.on('modal.closed', (data) => {
    if (data?.url?.includes('/tt_projects/')) {
        clearTimeout(_reloadTimer);
        _reloadTimer = setTimeout(() => loadRecords(), 50);
    }
});
```

### Pattern: background polling for external changes

**`ts` is NOT returned by the API** (hidden schema field). Track a snapshot: total count +
top-5 record IDs by `ts_desc`. Any edit moves the record to the top, changing the signature.
Seed after first load so the first tick never fires a spurious reload.

```js
let _pollSnap = { total: -1, topIds: '' };

async function loadRecords() {
    const resp = await App.fetchV2('/db/MY_CATALOG.json?...');
    allRecords = resp.data ?? [];
    _pollSnap = { total: allRecords.length, topIds: allRecords.slice(0,5).map(r=>r.id).join(',') };
    render();
}

setInterval(async () => {
    try {
        const r = await App.fetchV2('/db/MY_CATALOG.json?limit=5&order=ts_desc&not_cache=1');
        const rows = r.data ?? [];
        const total = Number(r.total ?? rows.length);
        const topIds = rows.map(r => r.id).join(',');
        if (_pollSnap.total >= 0 && (total !== _pollSnap.total || topIds !== _pollSnap.topIds)) {
            loadRecords();
        }
        _pollSnap = { total, topIds };
    } catch (_) {}
}, 60000);
```

Use both together: `modal.closed` reacts instantly to user's own edits; polling catches
changes made by another user or outside the miniapp.

## Caching and deduplication (built into VMCRMUserApp)

- `getUser()` and `getRequestParams()` — result is cached as a Promise. The first call goes through postMessage; subsequent calls in the same iframe session return instantly.
- `App.fetch(url)` — deduplication: two parallel calls with the same URL share the same Promise (useful with `Promise.all`). Disable: add `not_cache=1`.
- `App.prefetch(url)` → `App.fetch(url)` — if prefetch completes before fetch is called, data is returned without postMessage.

## App.done() — install frame completion signal

Called from `install.html` after self-provisioning. Tells the platform setup screen that this install frame is done — the platform immediately moves to the next app without waiting for a timeout.

```js
async function init() {
    const user = await App.getUser();
    if (!(await checkCatalogExists('custom_myapp'))) {
        await runInstall(user.data.from_auth, user.data.from_group);
    }
    App.done();  // always — both after install and if already installed
}
init();
```

- Call in both branches: install completed / catalog already existed.
- Outside the setup screen — no-op, safe to call.
- If not called — fallback: 4 seconds after the iframe loads.

## Critical

- **Never use `fetch()` directly** — CORS. Only `App.fetch()`.
- URLs in `App.fetch()` — relative only (no domain).
- Body is passed as an object, converted to URLSearchParams.
- **Never pass `undefined`/`null` as the 2nd arg.** A GET wrapper like
  `const r = await App.fetch(url, opts)` where `opts` is `undefined` is a trap:
  `undefined` serializes to `null` over postMessage, the host-side fetch hits
  `typeof null === 'object'` → reads `null.body` → throws, and the request **hangs
  until the 60s timeout** (silent: no profile/data loads, no obvious error). For a
  wrapper, branch on opts:
  ```js
  async function apiFetch(url, opts) {
      const r = opts ? await App.fetch(url, opts) : await App.fetch(url);
      return r?.data ?? r;
  }
  ```
- **Platform resources — absolute paths**: avatars `/reimg/data/auth/{doc}?80x80`, catalog files `/data/db/f_{catalog}/{doc}`, app icons `/data/db/f_marketplace/{doc}`. Relative paths inside the iframe resolve to the app archive store URL, not the CRM domain.

## Documentation

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/js-api.md` — full method and event reference
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/storage-and-hooks.md` — App.storage and webhooks
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/data-api.md` — request formats and filters
