# Handoff — Q&A rework shipped, web UI planned

Date: 2026-07-08
Author: claude (remote session, with Luke driving from iPhone/Mac)

## What was attempted and the outcome

1. **Set up in-repo dogfooding.** Symlinked `.claude/skills/{blueprint,blueprint-generate}`
   → `skills/*` so sessions on this branch load the skills live. Worked
   immediately — the skills registered mid-session and were used for real.
2. **Reworked the blueprint skill's Q&A flow** (one question per message,
   sequential numbering, `skip`/`done` hint on every question, one-line
   detail check after each answer measuring coverage against template
   sections). Shipped upstream: Luke submitted the PR to imbue-ai/blueprint
   from the clean `one-question-at-a-time` branch.
3. **Planned the web UI ("avatar add-on")** by dogfooding the reworked skill
   end-to-end. Plan generated at `blueprint/blueprint-web-ui/plan-blueprint-web-ui.md`.

## What worked, what didn't

- Worked: symlinked project skills; dogfooding the new flow to plan the next
  feature; vendoring reference repos into `INCOMING/` via a side branch when
  `add_repo` was unavailable.
- Didn't: `add_repo` and interactive pickers (AskUserQuestion) fail in this
  remote session — see `DOC/remote-environment.md`.
- Deferred-question handling worked well in Q&A (Q3 deferred, revisited as
  Q7 when a later answer made it load-bearing) — possible future skill
  feature: first-class "defer" alongside skip/done.

## Current state and blockers

- Upstream PR submitted; review pending. Responses to reviewers must be made
  by Luke (repo out of session scope). PR edits go on `one-question-at-a-time`.
- Web UI unimplemented; plan is complete with open questions listed.
- No blockers.

## Open questions

- See "Open questions" in `blueprint/blueprint-web-ui/plan-blueprint-web-ui.md`
  (testing depth is the big unanswered one; decide by end of phase 2).

## Files created or modified

- `skills/blueprint/SKILL.md`, `skills/blueprint/references/questions.md`,
  `README.md` — Q&A rework (also on the PR branch)
- `.claude/skills/*` — dogfooding symlinks (dev branch only)
- `INCOMING/ams-trio-main/`, `INCOMING/agent-handoff-main/` — reference copies
- `blueprint/blueprint-web-ui/plan-blueprint-web-ui.md` — the UI plan
- `AGENT.md`, `CLAUDE.md`, `HANDOFF/`, `DOC/` — handoff protocol adoption

## Next step

Phase 1 of the web UI plan: ams-trio-style chat-parity server (Express +
Agent SDK session with the blueprint skill as system prompt), manual launch,
plain chat panel. Patterns in `INCOMING/ams-trio-main/`.

## References

- `DOC/branches.md` — branch map and PR hygiene
- `DOC/remote-environment.md` — remote session quirks
