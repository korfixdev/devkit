# korfix-devkit

**Claude Code plugin for developing marketplace miniapps on the [Korfix](https://korfix.info) ERP platform.**

Provides AI agents, skills, and optional MCP connection. After installation, Claude Code can develop miniapps end-to-end: scaffold, write code, validate against the release checklist, package, and deploy.

**Platform:** [korfix.info](https://korfix.info) · **Docs:** [docs.korfix.info](https://docs.korfix.info) · **Related plugin:** [korfixdev/assistant](https://github.com/korfixdev/assistant)

## Install

The plugin is distributed via the [Korfix Marketplace](https://github.com/korfixdev/marketplace).

**Step 1 — Add Korfix marketplace** (once, before installing any plugin)

In Claude Code, type `/plugin` → **Add marketplace** → paste:

```
korfixdev/marketplace
```

**Step 2 — Install korfix-devkit**

```
/plugin install korfix-devkit@korfixdev
```

**Step 3 — Activate in current session**

```
/reload-plugins
```

Or just restart Claude Code — plugins load automatically on the next start.

**Manual install** (any version, fallback):

```bash
git clone https://github.com/korfixdev/devkit ~/.claude/plugins/korfix-devkit
```

Then enable in Claude Code settings → reload.

## Setup

```bash
export KORFIX_API_URL="https://vibe.korfix.app"     # your Korfix instance
export KORFIX_TOKEN="your-token-from-db-api"       # required
```

Get a token in your Korfix panel → `/db/api` → Add.

**Optional: MCP mode** — agents work via `curl` by default. To enable MCP, get your personal MCP URL from your Korfix panel (available after login), then add it to `.mcp.json`:

```json
{
  "mcpServers": {
    "korfix": {
      "type": "sse",
      "url": "YOUR_MCP_URL_FROM_KORFIX_PANEL"
    }
  }
}
```

When MCP is connected, agents automatically use `catalog_schema` / `db_read` / `db_insert` / `db_update` tools instead of curl.

## What's inside

| Component | Role |
|-----------|------|
| Agent `korfix-miniapp-dev` | Writes miniapps: architecture, code, styling, packaging |
| Agent `korfix-miniapp-validator` | Impartial review before deploy (fresh context, checklist-driven) |
| Agent `korfix-tech-writer` (haiku) | Maintains `README.md` in miniapp directory — auto-called after edits and before deploy |
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

info@korfix.info
