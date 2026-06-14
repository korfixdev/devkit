---
name: korfix-miniapp-config
description: Use when writing or editing config.json for a Korfix miniapp. Covers required fields, about format, urls, permissions, and common mistakes. Prevents marketplace validation errors.
---

# korfix-miniapp-config

Rules for creating config.json for Korfix miniapps. Common pitfalls in vibe-coding.

> **Building a new app from scratch?** — run the `korfix-analyst` agent first.
> It clarifies requirements and designs the solution before you write the first line of config.json.

## Required structure

```json
{
    "name": "App Name",
    "version": "1.0.0",
    "description": "Brief description",
    "about": "## What it does\n...\n## Where it appears in CRM\n...\n## Features\n...\n## How to use\n...\n## Configuration\n...",
    "logo": "icon.svg",
    "urls": { "main": "index.html" },
    "urlsConf": { "main": { "method": "get" } },
    "menu": {
        "some_catalog": { "frame": "main", "name": "Menu item name" }
    }
}
```

## Critical rules (cause of most syntax errors and failures)

1. **`about` is required.** Without it — a warning; with poor content — a marketplace error.

2. **`about` is a string, not an object.** All markdown inside a single string with `\n`.
   Do not place markdown as a nested object — that is invalid JSON.

3. **Escaping in `about`:** only `\n` (newline) and `\"` (quotes). No `--`, `***`, or complex special characters.

4. **`urls` — always relative paths** for zip apps (`"main": "index.html"`).
   Absolute URLs — only for remote apps.

5. **`logo` — filename** from the zip archive. Must exist in the zip (otherwise an error at install time).

6. **`menu` key** = catalog alias **after** which the menu item appears.

7. **`permissions`** — if omitted, full access is granted (legacy, you'll get a warning). For security:
   ```json
   "permissions": {
       "catalogs": { "my_catalog": ["read", "write"] },
       "storage": true,
       "navigate": true,
       "modal": true
   }
   ```

## Category (required)

Set `"category": <int>` in `config.json` — a numeric id from the canonical table:

| id | category   | When to use                                                              |
|----|------------|--------------------------------------------------------------------------|
| 1  | AI-agents  | AI assistants, chatbots, generative tools, agents                        |
| 2  | Business   | CRM extensions, reports, dashboards, B2B integrations                    |
| 3  | Games      | Games, entertainment miniapps                                            |
| 4  | Tools      | Utilities, converters, widgets, dev tools                                |
| 5  | Other      | Everything else / doesn't fit anywhere                                   |

The platform automatically writes the category to the DB on first app install (if the field is still empty). Further edits go through the catalog UI at `/db/marketplace` and are NOT overwritten on re-deploy.

Example:

    {
      "name": "Coin Clicker",
      "category": 3,
      "package": "coin-clicker",
      ...
    }

## Embed points

```json
"catalogs": {
    "ag_clients": {
        "tabs": [{ "name": "Tab", "frame": "main" }],
        "itemsActions": [{ "name": "Action", "frame": "main" }],
        "catalog.item.view.footer": { "name": "Widget", "frame": "main" },
        "catalog.items.footer": { "name": "Below list", "frame": "main" },
        "afterSave": "remote"
    },
    "": { "itemsActions": [{ "name": "For all", "frame": "main" }] }
}
```

## Pre-deploy checklist

The full checklist is canonical in `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md` — don't keep a
second copy here. The config.json-specific items to confirm: `about` with all 5 sections · all `urls`
files + `logo` present in the zip · valid JSON (no trailing comma / unescaped `\`) · `urls` relative ·
`permissions` declared · `category` set (int 1..5).

## Documentation

- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/config-json.md` — all embed points and permissions
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/getting-started.md` — first app from scratch
- `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md` — deploy and update
