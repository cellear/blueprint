# AMS Trio

A lightweight, conversational interface for the **trio-pattern**: one chat panel
per avatar, each backed by its own Claude session — its own persona, its own
model, its own "office" — all working in a shared project directory.

| Avatar | Role | Model |
| ------ | ---- | ----- |
| **Lila** | Librarian (specs & docs) | `claude-opus-4-8` |
| **Cody** | Coder (implementation) | `claude-sonnet-4-6` |
| **Quinn** | QA / Tester (verification) | `claude-haiku-4-5` |

## How it works

Each panel is a [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/typescript)
`query()` session. The SDK uses your **local Claude Code login** (no API key
needed) and runs against the real filesystem. Per avatar we set:

- `cwd` → the shared project root (`config.projectRoot`) — every avatar's "home"
- `systemPrompt` → that avatar's `AMS-office/<id>/persona.md`
- `model` → from `config.json`
- `resume` → the stored session id, so conversations persist across restarts

The server streams replies to the browser over SSE. A thin `.sessions.json`
mirrors each avatar's session id + transcript so panels repopulate on reload.

## Run

```sh
npm install
npm start          # http://localhost:3000
```

Authentication uses your existing Claude Code login. If `ANTHROPIC_API_KEY` is
set in the environment it takes precedence.

## Configure

Edit `config.json`:

- **`projectRoot`** — the directory the trio works in. Defaults to `./workspace`
  (created on first run). ⚠️ With `permissionMode: "acceptEdits"`, the agents
  **create and modify real files here**. Point it at a real project only when
  you're ready for that.
- **`permissionMode`** — `acceptEdits` (default), `plan` (read-only), `default`,
  `bypassPermissions`, `dontAsk`, or `auto`.
- **`avatars`** — roster (id, name, role, model, accent). Model strings accept
  full IDs (above) or Claude Code aliases (`opus`, `sonnet`, `haiku`).

## Layout

```
ams-trio/
  server.js            Express: static hosting + SSE chat endpoint
  lib/sessions.js      per-avatar query() sessions, resume + transcript
  config.json          project root, port, permission mode, avatar roster
  AMS-office/<id>/      persona.md, avatar.png, artifacts/   (each avatar's office)
  public/              index.html, styles.css, app.js
```
