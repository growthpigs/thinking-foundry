# Assumption Table — Convergence

**Phase:** 3b (ASSAY Gap-Fill)
**Date:** 2026-04-13
**Methodology:** 3-domain parallel mining across 100 GitHub issues (287KB)
**Domains:** Architecture (15), UX/Product (22), Data/API (30) = **67 total assumptions**

---

## Executive Summary

| Band | Count | Meaning |
|------|-------|---------|
| **RED (<40%)** | 18 | Speculative — needs CRUCIBLE or SPIKE before build |
| **AMBER (40-59%)** | 30 | Reasonable rationale, unverified — needs prototype/test |
| **GREEN (60-79%)** | 15 | Strong evidence, not runtime-tested |
| **SOLID (80%+)** | 4 | Well-established, spot-check only |

**Build-blocking assumptions (must resolve before CRUCIBLE):**
1. **D-015 (35%)** — Cross-domain entity ID linkage (SPIKE-1 #36) — not started, blocks everything
2. **A-013 (35%)** — Stealth worktree integration (#57) — entirely undocumented
3. **D-003 (40%)** — Active Polymarket/Kalshi contract for NC Senate — unverified
4. **A-014 (40%)** — Demo entity existence at demo time — depends on D-003
5. **A-004 (45%)** — Fan-out latency SLA — subject of SPIKE #34, not completed

**UX existential risks (CRUCIBLE domain: "Does the product actually work for users?"):**
1. **U-009 (28%)** — Fresh Eyes Reset will never be used
2. **U-005 (30%)** — Dual-level weighting (15+ sliders) may be invisible noise
3. **U-014 (30%)** — Users may never adjust weights — core moat never activated
4. **U-008 (35%)** — Fast-Track cannibalization destroys the multi-turn moat
5. **U-021 (35%)** — Executives conclude at Turn 1, skipping the briefing architecture

---

## Domain 1: Architecture Assumptions

| ID | Assumption | Source | Conf. | Risk If Wrong |
|----|-----------|--------|-------|---------------|
| A-001 | `emitToCompany()` accepts arbitrary event names for Convergence WebSocket events | #96 | 62% | Progressive rendering collapses; minister cards never update in real time |
| A-002 | Appending 3 tables to `shared/schema.ts` + Drizzle migration won't break War Room | #96 | 68% | Migration fails at build step 1, blocking all subsequent work |
| A-003 | `geminiFileSearchService.ts` (not `knowledgeBaseService.ts`) is the correct runtime service for Knowledge Minister | #96, #97 | 55% | Knowledge Minister returns empty results or triggers double-ingestion |
| A-004 | `Promise.allSettled` with 5 ministers completes within per-minister SLA targets | #31, #96, #75 | **45%** | Data Minister stalls fan-out; first-byte-to-value exceeds 20s; demo fails |
| A-005 | `newsApiService.ts` can accept a `searchByQuery()` method addition trivially | #96 | 52% | News Minister dead or causes regression in existing War Room news features |
| A-006 | `mentionlyticsApiService.ts` exists and exposes entity-level social queries | #96 | 55% | Narrative Minister unimplementable without building new integration (+2-3 days) |
| A-007 | Inserting convergence-eligible guard into `enhancedPerplexityChatService.ts` won't break chat | #96 | 58% | Chat hook is functionally invisible; convergence never fires from chat |
| A-008 | Polymarket/Kalshi APIs are freely accessible and not geoblocked from Railway | #29, #30, #38 | 65% | Markets Minister returns no data; core differentiation fails |
| A-009 | JWT `companyId` middleware prevents cross-tenant access to Convergence sessions | #96, #61 | 72% | Multi-tenant isolation breach — catastrophic if discovered during demo |
| A-010 | Opus 4.6 handles full minister stack payload within context window + <30s SLA | #31, #82, #94 | 52% | Synthesis gate truncates context or exceeds SLA; Decision Brief is incomplete |
| A-011 | Haiku 4.5 produces zero hallucinated provenance from structured data under context pressure | #44, #97 | **48%** | Data Minister presents fabricated source citations — most dangerous failure mode |
| A-012 | 15-min sliding window cache achieves meaningful hit rate in multi-turn sessions | #38, #59, #31 | **42%** | Each turn costs full API fees; 3-turn session costs 3× budget model |
| A-013 | Stealth worktree can consume War Room services without changes to main repo | #57, #95, #96 | **35%** | POC build cannot start; or accidentally visible to Think Big |
| A-014 | Demo entity has active prediction market contracts at demo time | #36, #95 | **40%** | Markets Minister SILENT on demo day; core thesis undemonstrable |
| A-015 | Decision-statement heuristic correctly classifies terse executive language | #31, #96 | **38%** | High false-positive rate trains users to dismiss; or feature invisible |

## Domain 2: UX & Product Assumptions

| ID | Assumption | Source | Conf. | Risk If Wrong |
|----|-----------|--------|-------|---------------|
| U-001 | Users understand "cabinet briefing" metaphor without training | #43, #45, #47 | 42% | Metaphor confuses; users treat it as generic chatbot |
| U-002 | WEP labels interpreted correctly by non-IC executives | #90, #77, #93 | 45% | Users treat labels as probabilities — recreates the oracle problem |
| U-003 | 3-5 minute fan-out wait is acceptable to time-pressed executives | #75, #88, #73 | **38%** | Executives abandon or hit Conclude on empty ministers |
| U-004 | Progressive rendering feels like "advisors arriving" not janky load | #47, #75, #77 | 55% | First-minister fixation bias; comparison anxiety |
| U-005 | Dual-level weighting (15+ sliders) won't overwhelm users | #71, #52, #85 | **30%** | Per-minister knobs invisible; wasted engineering |
| U-006 | "Single Signal" warning cards reduce over-reliance on thin intelligence | #73, #77, #58 | 40% | Warning dismissed as boilerplate; thin intel drives decisions |
| U-007 | Flash Tension Banner drives users to read conflicting ministers | #87, #88, #77 | 48% | Users click "Proceed anyway"; banner becomes trained-away noise |
| U-008 | Fast-Track Conclude won't cannibalize full multi-turn experience | #88, #87, #73 | **35%** | Product degrades to single-shot summarizer; moat lost |
| U-009 | Fresh Eyes Reset used proactively to counter confirmation bias | #89, #73, #81 | **28%** | Sycophancy drift occurs silently; users never discover the feature |
| U-010 | Anti-oracle stance experienced as empowering, not frustrating | #78, #73, #60 | 44% | Executives report product as "deliberately unhelpful" |
| U-011 | Chief of Staff adds value without confusing the two-layer system | #94, #88, #77 | 42% | Users can't distinguish CoS from Conclude; bypass safeguards |
| U-012 | Source counts + WEP labels give sufficient epistemic calibration | #90, #77, #73 | 58% | Users can't calibrate; signal hardness tier invisible |
| U-013 | Three-column layout appropriate for executive cognitive load | #47, #86, #52 | 52% | Col 4 dashboard ignored entirely; information density too high |
| U-014 | Users will actually adjust minister weights | #71, #52, #73 | **30%** | Compensation mechanism (core moat per DP1) never activated |
| U-015 | Signal hardness visual coding understood subconsciously | #86, #77 | 48% | All minister cards treated as equal weight regardless of tier |
| U-016 | Decision statement input elicits decision-framed queries | #77, #68, #45 | 55% | Search-style queries cause false MINE extraction |
| U-017 | Accountability language at conclusion gate is read and internalized | #77, #78, #51 | **35%** | Copy blindness; users interpret brief as recommendation |
| U-018 | Wait time with status copy feels like due diligence, not broken software | #75, #77, #88 | 50% | "Slow" reports vs Perplexity/ChatGPT baseline expectations |
| U-019 | SILENT ministers recognized as meaningful signal, not product failure | #77, #58, #60 | 52% | Support tickets filed; sessions abandoned |
| U-020 | Type A/B decision classification modulates user sufficiency demands | #68, #81, #51 | 40% | Classification adds overhead without behavioral change |
| U-021 | Executives run multi-turn sessions (3+) rather than concluding at Turn 1 | #88, #73, #81 | **35%** | Briefing architecture subverted; value never delivered |
| U-022 | Session history provides meaningful retrospective value | #81, #61, #47 | 48% | Persistence infrastructure wasted; never accessed post-decision |

## Domain 3: Data & API Assumptions

| ID | Assumption | Source | Conf. | Risk If Wrong |
|----|-----------|--------|-------|---------------|
| D-001 | Polymarket Gamma API open, no auth, no geoblock | #29, #30, #38 | 70% | Markets Minister returns no data |
| D-002 | Kalshi public API open, covers 2026 Senate races | #29, #30, #95 | 65% | Markets Minister silent on Kalshi signal |
| D-003 | Active Polymarket/Kalshi contract exists for NC Senate 2026 | #95 | **40%** | POC demo entity has no Markets signal — demo collapses |
| D-004 | Polygon.io pricing within acceptable POC cost | #62 | **30%** | $500-1000+/month kills budget; Markets loses financial data |
| D-005 | SEC EDGAR API free, 10 req/sec, provides Form 4 data | #84, #96 | 85% | Low risk — well-documented public API |
| D-006 | SEC Form 4 responses include expected `transactionCode` field | #84, #99 | 75% | Data Minister builds wrong parser; wrong signals |
| D-007 | SEC Form 4 temporal delays match statutory deadlines | #100, #84 | 90% | Data Minister shows stale data without warning |
| D-008 | FEC OpenFEC API provides 24/48hr independent expenditure data | #30, #34, #38 | 75% | FEC lag is 3-5 days; "caught before press" narrative fails |
| D-009 | OpenSecrets API available for RISIP codes and lobbying data | #84, #95 | **45%** | RISIP clustering unavailable; requires bulk CSV instead |
| D-010 | GDELT provides 15-min refresh free, no auth | #38, #54, #66 | 80% | Low risk for raw data; BigQuery dependency is the real risk |
| D-011 | GDELT BigQuery NOT required for Convergence queries | #54 | **35%** | GDELT integration complexity triples; News Minister latency spikes |
| D-012 | NewsAPI coverage and cost appropriate for POC | #38, #40, #59 | 70% | Rate limits hit during demo; News Minister degrades to cached data |
| D-013 | Mentionlytics API methods match Convergence needs | #96 | 55% | Narrative Minister requires new code, not just wrapper calls |
| D-014 | FEC candidate IDs resolvable for 2026 NC Senate pre-primary | #95, #36 | 50% | Entity map cannot be seeded for demo entity |
| D-015 | Polymarket/Kalshi IDs linkable to FEC IDs in entity map | #36, #95 | **35%** | SPIKE-1 fails; no cross-domain correlation possible; POC non-functional |
| D-016 | Regulations.gov API responds within fan-out SLA | #34, #75 | **40%** | Straggler blows 3-5 min SLA; Data Minister degrades every request |
| D-017 | FRED API free with acceptable rate limits | #30, #38 | 85% | Low risk — well-documented public API |
| D-018 | NOAA/NWS APIs accessible for Data Minister | #30, #38 | 85% | Phase 2+ only — no demo impact |
| D-019 | openFDA API accessible for Data Minister | #38, #40 | 85% | Phase 2+ only — no demo impact |
| D-020 | Perplexity Sonar API cost $0.02-0.05/query | #40 | 50% | Cost higher or rate limits kill multi-minister fan-out |
| D-021 | Hand-curated entity map resolves across SEC/FEC/Polymarket/GDELT | #36, #95 | **45%** | Silent failures; wrong entity or zero signal |
| D-022 | Mentionlytics tracks political candidates (not just brands) | #95, #50 | **40%** | Narrative Minister can't track NC Senate candidate |
| D-023 | Kalshi/Polymarket API access has no legal/compliance issues from stealth infra | #29, #57 | 60% | Legal review required before production |
| D-024 | All 5 ministers complete within 3-5 min fan-out SLA | #96, #75 | 50% | SLA not achievable; sources consistently time out |
| D-025 | FEC API returns 24E/24A data within 24-48hrs of filing | #84, #95 | 60% | "Before press noticed" narrative fails |
| D-026 | Podscan.fm API accessible for podcast mention tracking | #38, #54 | **45%** | Narrative Minister has no podcast signal |
| D-027 | Unusual Whales API provides dark pool data at $500/month | #70 | 55% | Phase 2 — not demo-critical |
| D-028 | NotebookLM unofficial API stable enough for Audio Debate | #74, #76, #32 | **30%** | Audio Debate Generation non-functional; Phase 2 risk |
| D-029 | `mentionlyticsApiService.ts` exports usable `searchByQuery()` equivalent | #96 | **40%** | Narrative Minister requires significant new code |
| D-030 | Entity resolution handles subsidiary/parent corporate relationships | #84 | **30%** | Double-counting in PAC analysis; wrong confluence alerts |

---

## CRUCIBLE Domain Mapping

Based on confidence bands, these are the 3 CRUCIBLE notebooks to run:

### Notebook 1: Minister Architecture & Fan-Out (14 assumptions, avg 50%)
A-001, A-002, A-003, A-004, A-005, A-006, A-007, A-010, A-011, A-012, A-013, D-024, D-016, A-015

**Core question:** Can 5 ministers actually brief in parallel within SLA, with correct service targets, without breaking War Room?

### Notebook 2: Data Sources & Entity Resolution (16 assumptions, avg 52%)
D-001–D-006, D-008, D-009, D-011, D-013–D-015, D-021, D-022, D-029, D-030

**Core question:** Do the bench sources actually exist, respond, and link to a real demo entity?

### Notebook 3: UX & Product Viability (22 assumptions, avg 41%)
U-001–U-022

**Core question:** Will executives actually use the product as designed, or does the architecture's value require behavior that time-pressed users won't exhibit?

---

## Technical Spikes Required Before Build

| Spike | Issue | Blocks | Assumptions Resolved |
|-------|-------|--------|---------------------|
| **SPIKE-1: Entity Resolution** | #36 | Everything | D-003, D-014, D-015, D-021, A-014 |
| **SPIKE-2: Stealth Worktree** | #57 | Build start | A-013 |
| **SPIKE-3: Fan-Out Latency** | #34 | SLA validation | A-004, A-011, D-016, D-024 |
| **SPIKE-4: Polygon.io Pricing** | #62 | Budget | D-004 |
| **SPIKE-5: OpenSecrets Status** | new issue needed | RISIP clustering | D-009 |
| **SPIKE-6: GDELT Query Method** | new issue needed | News Minister design | D-011 |
