# Knowledge Index

Connected-Markdown knowledge base for the Thinking Foundry (issue #169).
Read [hot.md](hot.md) first — it holds recent-session memory. Then follow
links below for the frameworks/mentors relevant to the current phase.

<!-- Maintained alongside index.json (the machine registry). When adding a
     knowledge file: add it to index.json AND link it here. -->

## Recent memory

- [hot.md](hot.md) — last 3 session summaries, auto-maintained by the server

## Frameworks

| File | What it's for | Strongest phases |
|------|---------------|------------------|
| [stoicism](mentors/stoicism.md) | Control what you can control; fear-setting; emotional clarity | MINE, ASSAY, CRUCIBLE |
| [ideo](mentors/ideo.md) | Human-centered: empathize → ideate → prototype → test | All phases |
| [mckinsey](mentors/mckinsey.md) | MECE decomposition, issue trees, hypothesis-driven | MINE, SCOUT, ASSAY |
| [yc](mentors/yc.md) | Talk to users, launch fast, intellectual honesty | SCOUT, ASSAY, PLAN |
| [lean](mentors/lean.md) | Build-measure-learn, MVP, pivot-or-persevere | SCOUT, CRUCIBLE, PLAN |

## Mentors

| File | Voice | Strongest phases |
|------|-------|------------------|
| [hormozi](mentors/hormozi.md) | Offers, pricing, value equation — revenue lens | ASSAY, PLAN |
| [nate-b-jones](mentors/nate-b-jones.md) | Mental models, inversion, decision quality | MINE, AUDITOR |
| [indydev-dan](mentors/indydev-dan.md) | AI-assisted work reliability, prompt architecture | PLAN, VERIFY |

## How the loader uses this

1. `poc/server/hot-memory.js` injects hot.md into every session's system prompt (cheap, no vector search)
2. `poc/context/loader.js` loads phase-relevant framework excerpts from the files above
3. Supabase pgvector remains for semantic search (`search_knowledge` tool) — hot.md complements it, and is the path to a zero-infrastructure giveaway build
