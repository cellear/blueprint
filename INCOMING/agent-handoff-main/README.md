# Agent Handoff Protocol

A lightweight system for maintaining context across AI coding sessions. No tools, no lock-in — just markdown files.

## How It Works

```
your-project/
├── AGENT.md      # Protocol instructions (your AI reads this)
├── HANDOFF/      # Session journals (chronological)
└── DOC/          # Reference docs (persistent, by topic)
```

Your AI reads `AGENT.md` at session start. It checks `HANDOFF/` for recent context and `DOC/` for project knowledge. At session end, it writes a handoff document so the next session picks up where this one left off.

Works across tools, across team members, across time.

## Quick Start

1. Copy [`AGENT.md`](AGENT.md) into your project root
2. Tell your agent to read `AGENT.md`
3. It handles the rest

Already have an `AGENT.md`? Add the protocol sections to it, or save it as `HANDOFF-PROTOCOL.md` and add `Read HANDOFF-PROTOCOL.md` to your existing file.

## Why This Works

- **No tools required** — Just markdown files in your repo
- **No vendor lock-in** — Works with any AI assistant
- **Human-readable** — Developers can read and write these too
- **Git-friendly** — Version controlled, diff-able, reviewable
- **Scales naturally** — From solo projects to teams

## Contributing

This is a convention, not a tool. If you have improvements, open an issue or PR. Keep it simple.

## License

MIT — Use it however you want.
