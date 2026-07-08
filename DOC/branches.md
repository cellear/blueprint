# Branch map

This fork of imbue-ai/blueprint adds features while dogfooding them.

- `claude/repo-overview-kxx1m3` — dev/dogfooding branch. Carries everything:
  feature work, `.claude/skills/*` symlinks (live-loading the skills as
  project skills), `INCOMING/` reference repos, generated plans, and the
  handoff protocol files.
- `one-question-at-a-time` — clean PR branch: only the Q&A rework on top of
  `main`. Submitted upstream to imbue-ai/blueprint (2026-07-08). Reviewer
  changes go HERE (amend/force-push updates the PR); mirror them onto the
  dev branch manually.
- `ams-trio` — Luke's vendoring branch for `INCOMING/` reference copies
  (pushed from his Mac when remote sessions can't add repos).
- `main` — tracks upstream; keep clean.

## PR hygiene

Development-only files must never reach an upstream PR:
`.claude/skills/*` symlinks, `INCOMING/`, `blueprint/` plan output,
`AGENT.md`, `CLAUDE.md`, `HANDOFF/`, `DOC/`. The clean-branch +
cherry-pick pattern (as used for `one-question-at-a-time`) handles this.

Last updated: 2026-07-08 by claude
