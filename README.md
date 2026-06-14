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
| Agent `korfix-analyst` | Clarifies requirements, designs the solution, writes `SPEC.md`, hands off to the dev agent |
| Agent `korfix-architect` | Technical feasibility: which catalogs, entry points, custom catalogs (consulted by the analyst) |
| Agent `korfix-miniapp-dev` | Writes miniapps: architecture, code, styling, packaging, deploy |
| Agent `korfix-gamedev` | Specialized variant for game/gamification miniapps (korgames module) |
| Agent `korfix-miniapp-validator` | Impartial review before deploy (fresh context, checklist-driven) |
| Agent `korfix-tech-writer` (haiku) | Maintains `README.md` in the miniapp directory — auto-called after edits and before deploy |
| 11 skills | `korfix-miniapp-validate`, `-checklist`, `-config`, `korfix-pre-deploy`, `korfix-test-guide`, `korfix-js-api`, `korfix-self-provisioning`, `korfix-catalog-schema`, `korfix-crud-data`, `korfix-token-audit`, `korfix-gamedev` |
| Local gate | `scripts/validate-bundle.js` + `schemas/config.schema.json` + a PreToolUse hook — structural pre-flight before zipping (no API) |
| Bundled docs | `docs/miniapps/` + `docs/gamedev/` — synced from [korfixdev/docs](https://github.com/korfixdev/docs) (English) via `sync-docs.sh` |

## Usage

```
Create a miniapp that shows record count under each catalog's table
```

Routing (for a brand-new app):
1. `korfix-analyst` clarifies requirements, consults `korfix-architect`, and writes a `SPEC.md`, then hands off to development
2. `korfix-miniapp-dev` (or `korfix-gamedev` for games) confirms instance + token, reads the bundled docs, writes code
3. Local structural gate (`scripts/validate-bundle.js`) runs before packaging
4. `korfix-miniapp-validator` does an impartial checklist review in a fresh context
5. On `READY` — deploy via API (`POST /api/db/marketplace/{ID}`); on `NOT READY` — fix and re-validate

For a small change to an existing app you can address `korfix-miniapp-dev` directly. The agent never
deploys without your confirmed instance and token. (Full routing rules: `CLAUDE.md`.)

## Security

- Keep the token in env, not in files. `KORFIX_TOKEN` never goes into miniapp commits.
- Grant the token **minimum privileges** — only needed catalogs and methods.
- Use separate tokens for prod and staging.

## License

MIT — see [LICENSE](LICENSE).

## Contact

info@korfix.info
