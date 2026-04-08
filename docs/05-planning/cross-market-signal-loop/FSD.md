# Functional Specification: Cross-Market Signal Loop (POC)

**Feature:** Cross-Market Signal Loop — extension of the War Room Intelligence area
**Source:** thinking-foundry#29 (methodology), #30 (Constitution), #31 (feature proposal)
**Build posture:** 🚨 STEALTH — parallel build on War Room worktree + separate infra, not Think Big's servers. Reveal as surprise killer feature.
**Target:** alpha-war-room worktree on Roderic's infrastructure (separate Neon + Render + Netlify)
**FSD author:** Chi (foundry-pipe-01-analyst), 2026-04-08
**Status:** Draft — awaiting Roderic approval before Scrum Master pipe
**Sizing:** POC = ~1 week focused build. MVP = ~3 weeks. This FSD covers POC (Phase 1) only; Phase 2+ is backlogged.

---

## 1. Summary

The Cross-Market Signal Loop is a reasoning engine that reads from a **bench of signal sources** (public APIs + per-tenant War Room first-party data) and uses Claude to detect cross-domain confluence patterns. When a registered loop's confluence rule matches, the engine fires an output — a drafted document in the Workspace Editor, a toast notification through the existing SWOT Socket.IO infrastructure, or both.

This FSD scopes a **one-week stealth POC** built on a worktree of the alpha-war-room repository deployed to isolated infrastructure. The POC exists to prove one thing: that cross-referencing public market signals (Polymarket + Kalshi) against War Room's existing per-tenant data model (Mentionlytics + SWOT + keywords) produces intelligence that no current tool delivers.

The POC is deliberately minimal. It ships exactly **two public connectors**, **one pre-configured loop**, **one new Insert pill group**, and **one new report type**. Everything else in #31 — auto-discovery, natural-language loop builder, chat-driven loop creation, the full 22-source bench, backtest gate, BYO ad accounts — is Phase 2 and explicitly excluded from this FSD.

## 2. Goals and Non-Goals

### Primary Goals (POC must deliver)

1. **Prove the divergence insight works.** Demonstrate that `Polymarket_prob(E) − Kalshi_prob(E)` for matched events is a cheap, unique, real-time signal that nothing else in War Room currently surfaces.
2. **Prove cross-domain confluence produces value.** Run at least one hardcoded loop end-to-end that combines a public signal with a per-tenant private signal (Mentionlytics or SWOT) and produces a visibly useful output in the Workspace Editor.
3. **Demonstrate reuse of existing War Room surfaces.** The POC must NOT introduce new top-level pages. It extends the Insert tab and adds one report type. The reveal to Think Big must read as "I built this inside your existing product" — not "I built a parallel product."
4. **Run on isolated infrastructure.** Zero touch to Think Big's prod database, staging environment, or deployment pipeline. Completely separate Neon database, separate Render/Netlify instances.

### Secondary Goals (nice-to-have in POC)

5. Seed a data model for saved loops that can scale to Phase 2 (multi-loop, user-created).
6. Instrument enough telemetry to measure loop latency and false-positive rate.
7. Keep the worktree cleanly rebasable against upstream War Room `main` — no structural refactors that would conflict with Think Big's ongoing work.

### Non-Goals (explicitly out of scope for POC)

- Auto-discovery of unregistered confluences
- Natural-language loop builder / visual node editor
- Chat-driven loop creation via Chat Data Access function calling extension
- The full 22-source public data bench — POC ships Polymarket + Kalshi ONLY
- BYO ad accounts (#719 not shipped upstream yet)
- Scheduled recurring loop runs — POC runs loops on demand from the Workspace Editor only
- Multi-tenant loop isolation (POC runs on a single fabricated tenant)
- Backtest harness
- Production-grade error handling, rate limiting, or cost controls
- Mobile responsive UI for the new surfaces
- Documentation for end users

## 3. User Stories

**Story 1 — The Reveal Demo (primary)**
As Roderic demoing to Think Big, I want to open the War Room Workspace Editor, pick "Cross-Market Signal Loop" from the report types, click Generate, and watch a document materialize that contains: (a) a Polymarket contract price for a current real-world event, (b) the Kalshi contract price for the same event, (c) the divergence between them with an interpretation, (d) cross-referenced Mentionlytics mentions from the demo tenant's feed that relate to the same theme, so that I can point at the screen and say "nothing else you use produces this."

**Story 2 — The Insert Pill Demo**
As Roderic demoing to Think Big, I want to open any Workspace Editor document and click a new "Prediction Markets" pill in the Insert tab to pull the top 5 active Polymarket/Kalshi markets into my document with one click, so that I can show the pattern of "the Insert tab just got a new data source, same pattern, zero retraining."

**Story 3 — The Divergence Alert**
As Roderic testing the POC, I want a registered loop to fire a SWOT-style toast notification when Polymarket and Kalshi disagree by more than 10 percentage points on a matched event for more than 15 minutes, so that I can show the real-time alerting works through the existing War Room notification pipeline.

## 4. Functional Requirements

### FR-1: Polymarket connector
The system SHALL implement a read-only connector against Polymarket Gamma API (`gamma-api.polymarket.com`). It SHALL poll active markets on a configurable interval (default 60s) and persist market metadata, current prices (yes/no), and volume to the isolated Postgres instance. No authentication required. No write operations. Rate-limited to stay under Polymarket's public API limits.

### FR-2: Kalshi connector
The system SHALL implement a read-only connector against Kalshi public API (`api.elections.kalshi.com/trade-api/v2`). It SHALL poll active markets on a configurable interval (default 60s) and persist market metadata, current yes/no prices, and volume. No authentication required. REST only for POC (WebSocket ticker deferred to Phase 2).

### FR-3: Event-matching service
The system SHALL maintain a mapping table of "matched events" — pairs of (Polymarket market ID, Kalshi market ID) that refer to the same underlying real-world event. For POC, this table is **manually curated** (5-10 pairs seeded at POC start) — no automatic matching. Each matched pair SHALL compute `divergence = polymarket_yes_price - kalshi_yes_price` on every poll and persist the divergence time series.

### FR-4: Divergence trigger
The system SHALL fire a trigger event when a matched pair sustains `|divergence| > 0.10` for more than 15 consecutive minutes. The trigger SHALL carry: the matched pair ID, both prices, the divergence magnitude, duration of divergence, and a timestamp.

### FR-5: Insert tab — new pill group "Prediction Markets"
The Workspace Editor Insert tab SHALL surface a new pill group "Prediction Markets" containing three pills: "Top Polymarket markets," "Top Kalshi markets," "Current divergences." Clicking a pill SHALL insert a pre-formatted block into the currently active TipTap document showing the top 5 matching items from the connector cache. The existing `InsertTab.tsx` pattern SHALL be reused — no new component abstractions.

### FR-6: Report type — "Cross-Market Signal Loop"
The Workspace Editor Configure tab SHALL expose a new report type with id `cross-market-signal-loop`, in a new category `Signal Loops` (or under existing `Analysis`). Its wizard SHALL ask for: (a) time window (default: last 24h), (b) scope (default: all matched pairs), (c) include Mentionlytics cross-reference (default: true). Clicking Generate SHALL:
1. Fetch current divergences from the connector cache
2. Fetch relevant Mentionlytics mentions from the demo tenant for the same time window, filtered by keyword overlap with the divergent event themes
3. Call Claude to produce a structured document with: (i) executive summary, (ii) divergence table with interpretations, (iii) Mentionlytics cross-reference section, (iv) suggested actions ("information not advice" framing)
4. Render the document in the TipTap editor via the existing generation flow

### FR-7: Alert output via existing Socket.IO pipeline
The POC SHALL emit divergence trigger events as Socket.IO messages on the existing SWOT room pattern (`company:${companyId}`) using the existing `useSwotNotifications` infrastructure. A new event type `signalLoop:match` SHALL be added. The existing `SwotNotificationToast` component SHALL be extended (minimally) to render signal loop matches — not replaced.

### FR-8: Isolated infrastructure
The POC SHALL deploy to Roderic's personal infrastructure: a new Neon database (not Think Big's Supabase/Postgres), a new Render service (not `war-room-production`/`war-room-staging`), and a new Netlify site (not `war-room.netlify.app`). All env vars SHALL be fresh and distinct from Think Big's.

### FR-9: Demo tenant seeding
The POC SHALL ship a seed script that creates a single fabricated demo tenant with: (a) 5-10 Mentionlytics mentions hand-crafted to match the seeded event pairs, (b) 3-5 SWOT items, (c) a handful of keyword trackers, (d) one uploaded knowledge document. This seed MUST NOT copy real client data from Think Big's production database.

### FR-10: Worktree hygiene
The POC SHALL live on a git worktree of alpha-war-room named `wt-signal-loop` on a branch named `roderic/signal-loop-poc`. Commits SHALL be scoped to the new connector, new Insert pills, new report type, new seed script, and minimal schema migration. NO refactors of existing code outside these touch points.

## 5. Non-Functional Requirements

### NFR-1: Confidentiality
The worktree branch SHALL NOT be pushed to `origin/alpha-war-room`. It SHALL be pushed to a separate remote (Roderic's personal GitHub org or a fork) or kept local-only for the POC duration.

### NFR-2: Rebase cleanliness
The POC branch SHALL remain cleanly rebasable against upstream `alpha-war-room/main`. New files are preferred to modifications of existing files. Where existing files must be touched (e.g., `InsertTab.tsx`, `reportTypeData.ts`), changes SHALL be additive only.

### NFR-3: Data isolation
Zero data from Think Big's production or staging environments SHALL be used, copied, or referenced by the POC. The demo tenant is entirely fabricated.

### NFR-4: Latency
Polymarket and Kalshi connector polls SHALL complete in under 5 seconds each. Loop match detection SHALL produce a Socket.IO notification within 30 seconds of a trigger condition being met.

### NFR-5: Cost containment
Claude API calls for report generation SHALL use Claude Haiku 4.5 as default (cheap). Sonnet-class model usage SHALL be opt-in only. No background auto-discovery jobs running Claude calls (deferred to Phase 2) — this is explicitly why auto-discovery is a non-goal.

### NFR-6: No regressions in upstream surfaces
The changes to `InsertTab.tsx`, `reportTypeData.ts`, and `SwotNotificationToast.tsx` SHALL be guarded by feature flags read from the POC's isolated env vars, so that when the worktree is eventually merged (or demoed), the changes can be toggled off without code changes.

## 6. Data Model (POC)

New tables in the isolated Neon database:

```
polymarket_markets     (id, slug, question, yes_price, no_price, volume, updated_at, raw_json)
kalshi_markets         (id, ticker, title, yes_price, no_price, volume, updated_at, raw_json)
matched_events         (id, polymarket_id, kalshi_id, label, created_at, notes)
divergence_history     (id, matched_event_id, polymarket_price, kalshi_price, divergence, observed_at)
signal_loops           (id, name, rule_json, last_run_at, last_match_at, created_at)
signal_loop_matches    (id, signal_loop_id, matched_event_id, divergence, mentionlytics_ref_ids, output_document_id, matched_at)
```

Existing tables touched (feature-flagged additive only):
- `workspace_documents` — no schema change; new report type id `cross-market-signal-loop` added to whitelist
- `tenant_campaigns` — no schema change; new demo tenant row inserted by seed script

## 7. Architecture Touch Points

| Existing War Room surface | File / service | POC extension |
|---|---|---|
| Workspace Editor Insert tab | `client/src/components/workspace/InsertTab.tsx` | Add "Prediction Markets" pill group (3 pills) behind feature flag |
| Workspace Editor Configure tab | `client/src/data/reportTypeData.ts` | Add `cross-market-signal-loop` report type entry |
| Workspace Editor report generation | `server/services/workspaceReportGenerator.ts` or route handler | Add handler for new report type that composes Polymarket + Kalshi + Mentionlytics into Claude prompt |
| SWOT Socket.IO pipeline | `server/websocket.ts`, `client/src/hooks/useSwotNotifications.ts` | Add `signalLoop:match` event type; extend toast component minimally |
| Unified data integration | `server/services/unifiedDataIntegrationService.ts` | Add Polymarket/Kalshi as new sources (additive) |
| NEW | `server/services/polymarketConnector.ts` | New file |
| NEW | `server/services/kalshiConnector.ts` | New file |
| NEW | `server/services/signalLoopEngine.ts` | New file — confluence detection + match firing |
| NEW | `server/jobs/signalLoopPollJob.ts` | New file — 60s poll job |
| NEW | `migrations/NNNN_signal_loop_poc.sql` | New migration with 6 tables above |
| NEW | `scripts/seed-signal-loop-demo-tenant.ts` | New seed script |

## 8. Phased Build Plan

### Phase 1 — POC (this FSD, ~1 week focused work)

| Day | Deliverable |
|---|---|
| 1 | Worktree created, isolated Neon provisioned, migrations applied, upstream `main` baseline confirmed running |
| 2 | Polymarket + Kalshi connectors with poll job; 5-10 matched events hand-seeded |
| 3 | Divergence history recording + simple CLI to verify data is flowing |
| 4 | Signal Loop engine: divergence trigger detection + Socket.IO emit wired to extended toast |
| 5 | Insert tab pill group + new report type in Configure tab (both feature-flagged) |
| 6 | Report generation handler: Claude call with Polymarket + Kalshi + Mentionlytics composition |
| 7 | Demo tenant seed script; end-to-end dry run; screen-record demo video for private review |

### Phase 2 — Backlog (explicitly out of scope for POC FSD)

- Auto-discovery of unregistered confluences
- Natural-language loop builder wizard
- Chat-driven loop creation via Chat Data Access
- Full Tier S public connectors (FEC, OpenSecrets, Regulations.gov, OpenStates)
- Multi-tenant loop isolation
- Scheduled recurring runs via existing Workspace Editor schedule pattern
- BYO ad accounts after #719 lands upstream
- Backtest harness over 6 months historical data
- Production rate limiting and cost controls
- End-user documentation

## 9. Success Metrics

The POC succeeds if, at the end of the week:

1. **SM-1:** At least one genuine Polymarket/Kalshi divergence >10pp is captured in the wild (not seeded) during POC testing
2. **SM-2:** Generating a Cross-Market Signal Loop report in the Workspace Editor produces a document that Roderic would personally want to read (subjective, self-rated ≥8/10)
3. **SM-3:** The feature can be demoed in under 3 minutes end-to-end without any manual data setup between steps
4. **SM-4:** Zero touches to Think Big's production or staging infrastructure
5. **SM-5:** The branch remains rebasable against upstream `alpha-war-room/main` with under 15 minutes of effort

## 10. Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| R-1 | Polymarket/Kalshi public APIs rate-limit or break mid-POC | Medium | 60s poll interval well under known limits; cache aggressively; have fallback to mock data for demo |
| R-2 | Event-matching between the two platforms is harder than expected (different resolution criteria, timing, scope) | Medium | POC uses hand-curated 5-10 pairs only, no automatic matching — defers this problem to Phase 2 |
| R-3 | Upstream War Room `main` refactors the Workspace Editor during the week, creating rebase pain | Medium | Keep changes additive; pull daily; worst case accept a full merge rather than rebase |
| R-4 | Claude generation output is bland or obvious, failing SM-2 | Low | Loop has concrete cross-reference data — the compose prompt is straightforward; worst case iterate on prompt |
| R-5 | Mentionlytics demo data feels fake in the output and hurts the reveal | Medium | Spend 30min crafting believable demo tenant data that obviously corresponds to seeded event pairs |
| R-6 | The whole POC ships and Think Big reacts with "that's not impressive" rather than "that's a killer feature" | High | Mitigation is the reveal strategy, not the build. Build the POC, get it working, then Roderic chooses timing and framing of the reveal. |

## 11. Open Questions

1. **Worktree remote:** Push to Roderic's personal GitHub org, or keep the worktree local-only for the POC week? (Recommendation: local-only, unless CI is needed.)
2. **Claude API key:** Reuse Roderic's existing key or provision a new one for isolation? (Recommendation: new key to keep telemetry clean.)
3. **Which 5-10 matched event pairs to seed:** Need a shortlist of currently-live events that exist on both Polymarket and Kalshi with known-interesting divergences. Research spike before Day 2.
4. **Demo tenant name:** "Demo Campaign" or something specific? Must not conflict with any real tenant in the isolated DB (trivially — DB is empty) and must look plausible on screen during reveal.
5. **What does Roderic show Think Big first — Insert pill demo or Report type demo?** (Recommendation: report type, because it produces the "wow document" and tells the story in one artifact.)

## 12. Dependencies

- **Blocks:** None for POC. This is the only item in this worktree.
- **Blocked by:** Nothing external. Polymarket and Kalshi APIs are public; War Room worktree is code Roderic has local; Neon is self-serve.
- **Related:** thinking-foundry#31 (parent proposal), alpha-war-room#717 (Polymarket/Kalshi promotion amendment, in review), alpha-war-room#719 (BYO ads — NOT needed for POC), alpha-war-room#540 (Workspace Editor — the surface this plugs into).

## 13. Reveal Strategy Note (not part of the build)

The POC build is one question. The reveal to Think Big is a separate question and out of FSD scope. Key framing for whenever Roderic decides to reveal:

- Frame as "I built this on my own time to show you what's possible" — not as "I went rogue and built something without asking"
- Emphasize that the extension pattern (new pills + new report type) is how Think Big would ship this themselves — it's not a fork, it's a proposal for a feature
- Have the generated demo document ready as a one-pager hand-out
- Don't reveal until the Polymarket/Kalshi promotion in #717 has been accepted — that signals Think Big is already aligned on the data substrate

---

**Independent Observer Verification:** An outside reviewer reading this FSD can answer: what is being built (10 FRs), why (Section 1 + Section 9), by when (Section 8 day-by-day), with what data (Section 6), touching which existing files (Section 7), at what risk (Section 10). No interview required.

**Word count:** ~2,400 words. Satisfies No-Thin-Records Mandate.
