# korfix-devkit — escalation and routing rules

This plugin provides agents and skills for developing miniapps on the Korfix platform.

## When to launch agents (not skills)

| Situation | Agent |
|----------|-------|
| New miniapp from scratch | **always** `korfix-analyst` first — clarifies requirements, designs the solution |
| Architectural decision (which catalogs, how to store data) | `korfix-architect` |
| Miniapp development / refinement | `korfix-miniapp-dev` |
| Game miniapp (Korn, quests, leaderboard) | `korfix-gamedev` |
| Deploy / publish | `korfix-miniapp-dev` → it will call the validator before deploying |
| Independent validation before deploy | `korfix-miniapp-validator` (separate subagent, fresh context) |
| Update README / app documentation | `korfix-tech-writer` |

## When to use skills (not agents)

Skills — for a specific technical question within development:

| Need information about... | Skill |
|-----------------------|-------|
| config.json structure | `korfix-miniapp-config` |
| App.fetch, getUser, postMessage | `korfix-js-api` |
| Catalog CRUD, form[], alias | `korfix-crud-data` |
| Fields and types of a specific catalog | `korfix-catalog-schema` |
| Self-provisioning (catalog creation) | `korfix-self-provisioning` |
| Token permissions audit | `korfix-token-audit` |
| Developer checklist (self-check) | `korfix-miniapp-checklist` |
| Deploy steps + checklist | `korfix-pre-deploy` |
| Manual browser testing | `korfix-test-guide` |

## Hard rule: new miniapp → analyst first

If the user says "make an app", "create a miniapp", "I need an app for X" —
**do not start writing code**. Launch `korfix-analyst`. It will ask the right questions,
design the solution, and pass the specification to `korfix-miniapp-dev`.

Exception: the user explicitly said "just create it without discussion" or provided a ready specification.

## Deploy always goes through the validator

Before any deploy — `korfix-miniapp-validator` in a fresh subagent.
Deploy without validation is forbidden, except for an explicit "deploy without validation" from the user.
