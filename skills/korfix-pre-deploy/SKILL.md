---
name: korfix-pre-deploy
description: Use immediately before deploying a Korfix miniapp. Step-by-step pre-deploy checklist for the developer agent — version bumped, validator passed, zip built correctly. Run this BEFORE calling korfix-miniapp-validator.
---

# korfix-pre-deploy

Step-by-step procedure before deploying a miniapp. Follow sequentially — do not skip steps.

> **Checklist source of truth:** the item list lives in `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/checklist.md`.
> The `korfix-miniapp-checklist` skill (developer self-check) and `korfix-miniapp-validate` (reviewer)
> both reference it. This skill is the *deploy procedure*, not a second copy of the checklist.
>
> **Deploy endpoints source of truth:** `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md` (decision table).

## Step 1 — Is the version bumped?

Open `config.json`. Check `version`. Determine the level of changes:

| What changed | Bump |
|--------------|------|
| Bug fixes only, text corrections | PATCH `x.y.Z+1` |
| New feature, new frame, new catalog | MINOR `x.Y+1.0` |
| Major UX/architecture changes | MAJOR `X+1.0.0` |

If the version hasn't changed since the last deploy — **update it, required**.

## Step 2 — Is the README up to date?

Run `korfix-tech-writer` (subagent, haiku):
- Pass the path to the miniapp directory
- Pass "what changed" in 1-2 sentences
- Wait for README.md to be updated

README.md goes into the zip — it must reflect the current state.

## Step 3 — Independent validation

Run `korfix-miniapp-validator` in a **fresh subagent**:
- Pass only the directory path and version
- Do not pass the development history
- Receive `STATUS: READY` or `NOT READY`

If `NOT READY` — fix all Critical and Must items, repeat validation.

## Step 4 — Local bundle gate (before zipping)

Run the bundled structural validator — it checks config.json JSON validity, that every file in
`urls.*` and `logo` exists, that `config.json` is at the root, and that `dashboard_widgets`
permission is present when `urls.widget` is declared. It hits **no API** — pure local pre-flight.

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-bundle.js /path/to/app-dir
```

Fix every `FAIL` it reports before continuing. (The platform repeats these checks server-side on
deploy and will reject the zip with `422` — catching them locally saves a round-trip.)

## Step 5 — Build the zip

```bash
cd /path/to/app-dir
zip -r /tmp/app.zip config.json *.html *.js *.css *.svg README.md
```

Verify the zip contains:
- [ ] `config.json` in the root (not inside a folder)
- [ ] all frames from `urls` are present
- [ ] `logo` file is present
- [ ] `README.md` is present

## Step 6 — Deploy

> Full endpoint reference → `${CLAUDE_PLUGIN_ROOT}/docs/miniapps/deploy.md` (decision table).

**Update existing** (ID exists) — canonical default:
```bash
curl -X POST "${KORFIX_API_URL}/api/db/marketplace/${APP_ID}" \
  -H "Authorization: Bearer ${KORFIX_TOKEN}" \
  -F "doc1=@/tmp/app.zip;type=application/zip"
```
> Use `POST /api/marketplace/deploy/${APP_ID}` instead only when you need to force an `appconfig`
> cache refresh in the same call.

**New app** (no ID):
```bash
curl -X POST "${KORFIX_API_URL}/api/db/marketplace" \
  -H "Authorization: Bearer ${KORFIX_TOKEN}" \
  -F 'name=App Name' \
  -F "doc1=@/tmp/app.zip;type=application/zip"
```

Check the response: `"status": "success"`/`"ok"`. On `"status":"error"` the `message` lists every
manifest problem — fix and re-deploy, don't retry blindly.

## Step 7 — Smoke test after deploy

Open the app on the instance:
1. Verify the version in the marketplace has updated
2. Open the main frame — check for 404, white screen, console errors
3. If there's a widget — verify it loads
