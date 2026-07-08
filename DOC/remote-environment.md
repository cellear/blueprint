# Remote session environment quirks

Notes for Claude Code on the web sessions in this repo (Luke often drives
from iPhone; the session executes in a cloud container).

- **MCP approvals never render**: `add_repo` fails with "requires approval"
  instantly, and `AskUserQuestion` errors out. Ask questions as plain
  markdown in chat instead. To bring in outside code, vendor it into
  `INCOMING/` on the `ams-trio` branch from a real machine and let the
  session fetch it.
- **Stop hook** (`stop-hook-git-check.sh`) requires all changes committed
  and pushed before a turn ends. Don't leave untracked files.
- **GitHub scope** is cellear/blueprint only. Anything on imbue-ai/blueprint
  (the upstream PR, comments) must be done by Luke in a browser.
- **Ephemeral home directory**: Luke's personal skills (e.g. /handoff) exist
  only on his Mac. Project skills come from `.claude/skills/` on the checked-
  out branch — which is why the dev branch symlinks the blueprint skills.
- **Skills register at session start**; edits to already-registered skill
  files take effect immediately (references are read at invocation time).

Last updated: 2026-07-08 by claude
