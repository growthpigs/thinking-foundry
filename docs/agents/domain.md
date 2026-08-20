# Domain Docs

How the engineering skills should consume this repo's domain documentation when
exploring the codebase.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root, or
- **`CONTEXT-MAP.md`** at the repo root if it exists: it points at one
  `CONTEXT.md` per context. Read each one relevant to the topic.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in.

If any of these files don't exist, **proceed silently**. Don't flag their
absence; don't suggest creating them upfront. The `/domain-modeling` skill
(reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates
them lazily when terms or decisions actually get resolved.

## Layout: single-context

This repo is **single-context** — one `CONTEXT.md` at the root plus a single
`docs/adr/`. There is no `pnpm-workspace.yaml`, no `workspaces` field, and no
`packages/` directory.

```
/
├── CONTEXT.md          ← not yet created; /domain-modeling creates it lazily
├── docs/adr/           ← not yet created
└── src/
```

For reference, a multi-context repo (signalled by `CONTEXT-MAP.md` at the root)
would instead look like:

```
/
├── CONTEXT-MAP.md
├── docs/adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                  ← context-specific decisions
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

## GitHub stays the source of truth

Per `~/.claude/CLAUDE.md`, specs and decisions live in GitHub issues, not local
markdown. An ADR is the right home for a durable architectural decision with
trade-offs and consequences; the issue remains canonical for project state.
Cross-link them rather than duplicating. When a local file disagrees with
GitHub, update the issue first.

## Use the glossary's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal,
a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift
to synonyms the glossary explicitly avoids.

If the concept you need isn't in the glossary yet, that's a signal: either
you're inventing language the project doesn't use (reconsider) or there's a real
gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than
silently overriding:

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_
