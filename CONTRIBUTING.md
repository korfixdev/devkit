# Contributing to korfix-devkit

## Release workflow — versions and CHANGELOG

**Every push that changes agent/skill/documentation behavior must be accompanied by a version bump and a CHANGELOG entry.**

### 1. Bump version in `.claude-plugin/plugin.json`

Format — [SemVer](https://semver.org/). Rules for choosing the level:

| Level | When to apply | Examples |
|---|---|---|
| **PATCH** `0.2.0 → 0.2.1` | Bug fix, typo, wording clarification, minor example update | Fixed typo in skill, clarified checklist item, fixed broken code example |
| **MINOR** `0.2.0 → 0.3.0` | New feature, new validation rule, new skill, new pattern/helper, extension of an existing skill | Added `access_db` rules, added `custom_` check, new skill `korfix-X`, new helper |
| **MAJOR** `0.9.0 → 1.0.0` | Breaking change, removal/rename of an agent/skill, incompatible config format change | Removed `korfix-old-skill`, renamed an agent, changed a required env var |

If in doubt between levels — **take the higher one**. A "extra" MINOR is better than an overly conservative PATCH that users will miss.

**Do not bump if:**
- Change is only in CHANGELOG.md / README.md / CONTRIBUTING.md (meta-documents)
- Only formatting / whitespace in code
- Only comments with no change to instructions

### 2. Add an entry to CHANGELOG.md

New version goes **at the top**, under the `# Changelog` heading. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/):

```markdown
## [0.3.0] — YYYY-MM-DD

### Added
- New feature A — what it does, why

### Changed
- Rule Y now works differently — why

### Fixed
- Bug Z — what was broken

### Removed
- Removed outdated Q — migration guide (if applicable)
```

**Sections** (use only those needed): `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

**Write from the plugin user's perspective**, not the developer's: "added rule for access_db", not "commit with validator.md fix".

### 3. Commit message

Recommended prefixes:

- `release: vX.Y.Z` — if version is bumped (entry in CHANGELOG)
- `docs:` — documentation change with no functional impact
- `skill(<name>):` — change to a specific skill
- `agent(<name>):` — change to an agent
- `fix:` — bug fix

### 4. Push

```bash
git add -A
git commit -m "release: v0.3.0"
git push
```

After push, users will see "Update available" in the `/plugin` UI.

## For breaking changes (MAJOR)

In addition to CHANGELOG:

1. Create a GitHub Release with the tag `vX.0.0`
2. In release notes, explicitly write a **migration guide** — what the user needs to do to avoid breaking their workflow
3. Mention `BREAKING CHANGE:` in the PR/commit message so it's visible on GitHub

## When an agent makes these changes

An AI agent changing the plugin config (skill, agent, structure) **must**:

1. Before commit — determine the bump level using the table above
2. Update `version` in `.claude-plugin/plugin.json`
3. Add an entry to CHANGELOG.md **at the top**, with today's exact date and specific items
4. Use the correct prefix in the commit message
5. Push as one atomic commit (version + CHANGELOG + the actual changes together)

**Violation:** push without a bump = users won't see the update notification = they may miss important validation rules or bug fixes.

## Contact

info@korfix.info
