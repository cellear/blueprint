# Plan: Blueprint Web UI (avatar add-on)

## Overview

- Add a graphical web UI to Blueprint: a local Express server plus a Claude Agent SDK session, with a browser frontend — architecture modeled on ams-trio (reference: `INCOMING/ams-trio-main/`).
- One planning avatar in a chat panel, keeping Blueprint's neutral voice — no persona layer.
- The whole planning lifecycle happens in the browser with no mode switching: setup (template, feature description) → Q&A → generate → refine.
- Agent↔UI communication is fully structured: the server registers custom SDK tools the agent calls; the browser renders their JSON payloads. Chat text is conversational glue only.
- Workspace layout, not just chat: persistent UI elements own all state (progress, decisions, document); the chat never repeats state.
- Launched by a companion skill (`/blueprint-ui`) that starts the server for the current project and hands back the URL; manual launch (`node server.js`) kept as fallback.
- One in-progress planning session per project, auto-resumed across browser reloads and server restarts (ams-trio's `.sessions.json` pattern).

## Expected behavior

- User invokes `/blueprint-ui` in their agent; the skill installs dependencies if needed, starts the server with the current project as working directory, and replies with `http://localhost:<port>`.
- Opening the URL shows the planning workspace: avatar chat panel, question card, decisions list, completeness status, always-visible Finish button, and a live document pane.
- The avatar opens by asking setup questions in the panel — template choice (from `templates.json`, plus custom) and feature description if not already provided — then flows straight into Q&A.
- Questions arrive one at a time as structured cards: question text, context line, clickable lettered options, an "Other" free-text field, and Skip. Clicking an option answers it — no shorthand typing needed, though the chat input always works too.
- Each answer adds an entry to the decisions list; hovering or clicking a decision shows the full question, chosen answer, and context.
- The completeness status element replaces the chat detail-check line: it shows which template sections are solid and which are thin, updated after every answer.
- The document pane shows the evolving refined prompt during Q&A, then the actual plan file during generation and refinement — always current, never repeated in chat.
- The Finish button is always available; pressing it ends Q&A and starts generation, surfacing any still-open questions before the plan is written.
- Generation writes `blueprint/<slug>/plan-<slug>.md` into the project, exactly as the terminal skill does — output is interchangeable.
- Refinement continues in the same workspace: chat requests edit the plan, the document pane updates live, and "what are the open questions?" works as in the terminal flow.
- Closing the browser or restarting the server loses nothing: reopening the URL restores chat transcript, decisions, status, and document state; the SDK session resumes by session id.

## Implementation plan

- `skills/blueprint-ui/SKILL.md` — companion skill: locate the app, run `npm install` on first use, start the server in the background with `cwd` = current project, report the URL, and explain the Finish/resume basics.
- `skills/blueprint-ui/app/` — the web app, carried inside the skill directory so `install-skills.sh` and `npx skills add` distribute it unchanged:
  - `app/package.json` — `express` + `@anthropic-ai/claude-agent-sdk` (auth via local Claude Code login, as ams-trio).
  - `app/server.js` — Express: static hosting, `GET /api/state` (full workspace state for initial render/resume), `POST /api/message` (SSE stream of agent events), `POST /api/answer` (structured option-click answers, converted to user messages).
  - `app/lib/session.js` — one persistent SDK `query()` session per project: system prompt assembled from the blueprint skill instructions + UI-mode section; `resume` via stored session id; state mirrored to `<project>/blueprint/.ui-session.json` (transcript, decisions, status, document, phase).
  - `app/lib/tools.js` — custom SDK tools registered with the session (in-process MCP server): `present_question`, `record_decision`, `update_status`, `update_document`, `set_phase`. Each validates input and forwards a JSON event to the browser over SSE.
  - `app/lib/ui-mode.md` — the UI-mode instructions layered onto the blueprint skill content: use the tools instead of markdown question format, refined-prompt blockquotes, detail-check lines, and progress lines; keep chat text to brief conversational glue.
  - `app/public/index.html`, `app/public/styles.css`, `app/public/app.js` — the workspace frontend: chat panel with SSE streaming (ams-trio's `readSSE` pattern), question card renderer, decisions list with hover detail, status element, document pane (rendered markdown), Finish button.
- `skills/blueprint-ui/references/templates.json` — symlink or copy of the existing templates so all three skills stay in sync.
- `README.md` — new section documenting the UI add-on, launch via `/blueprint-ui`, manual launch fallback, and the shared plan-file format.

## Implementation phases

1. **Chat parity.** Standalone server + single SDK session loaded with the blueprint skill as system prompt; plain ams-trio-style chat panel; manual launch only. Planning works end-to-end as markdown in chat.
2. **Structured questions.** Register the custom tools; add UI-mode instructions; render question cards with clickable options, Other, and Skip; answers post back as structured messages.
3. **Workspace.** Decisions list, completeness status, document pane, Finish button; strip repeated state (refined prompt, detail check, progress line) out of chat in UI mode.
4. **Full lifecycle.** Setup questions in-panel, generation writing `blueprint/<slug>/plan-<slug>.md`, open-question surfacing on Finish, refinement with live document updates.
5. **Persistence + launch skill.** `.ui-session.json` mirror and SDK session resume; `skills/blueprint-ui/SKILL.md` background-launch flow; README documentation.

## Testing strategy

- Baseline (uncontested): unit tests for the deterministic layer — tool-input validation, tool-call → workspace-state mapping, persistence round-trip (write state, restart, resume), and endpoint behavior with a stubbed session.
- Manual dogfooding of the agent loop: plan a real feature with the UI at the end of each phase; phase 1's chat-parity mode doubles as the harness for comparing UI behavior against the terminal skill.
- The depth question — whether to add a scripted fake agent replaying canned tool calls through the browser (Playwright) — is unresolved; see Open questions.

## Open questions

- Testing depth (Q9, unanswered): deterministic unit tests only, or also a fake-agent + Playwright end-to-end suite? Decide by the end of phase 2, when the tool protocol is concrete.
- Permission mode for the SDK session: planning should be read-only (`plan`-like) during Q&A, but generation must write the plan file — one mode with guardrail instructions, or switch modes at generate time?
- Upcoming-questions pane (the "maybe" from Q6): should the agent expose its pending-topics list as a tool so the UI can preview what's coming, or is that noise?
- Port strategy and concurrent projects: fixed port with in-use detection, or per-project port assignment recorded in the session file?
- Finish-button semantics mid-stream: interrupt the in-flight agent turn, or queue until the current question resolves?
- Model/config: hardcode the session model or expose a small config (ams-trio's `config.json` pattern)?
- Distribution check: confirm `npx skills add` and symlinked installs handle a skill directory containing a `node_modules`-bearing app gracefully (may need `.skillsignore` or install-on-first-run only).
