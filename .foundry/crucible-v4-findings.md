# CRUCIBLE v4 Findings — Convergence

**Phase:** 4 (CRUCIBLE)
**Date:** 2026-04-13
**Methodology:** 3 NotebookLM notebooks, 21 chat queries (text modality), 3 audio debates (audio modality)
**Sources per notebook:** 5 (internal specs + external ground truth)
**Foundry Crucible Rules compliance:** All 8 rules satisfied

---

## Notebook 3: UX & Product Viability (Avg 41% → Post-CRUCIBLE Assessment)

### Key Findings

**CONFIRMED — Anti-Oracle Stance Works (U-010: 44% → 62%)**
External UX research from Stevens Institute confirms that presenting contradictions WITHOUT recommendations actually improves decision quality vs prescriptive tools. Users' preexisting beliefs distort prescriptive recommendations. HOWEVER: requires decision framework scaffolding post-synthesis (e.g., "If regulatory risk > market opportunity, Regulators win"). Without scaffolding, executives report incompleteness.

**ACTION REQUIRED:** Add decision framework templates to the Conclude output. This is not optional — it's the difference between "empowering" and "frustrating."

**CONFIRMED — Single-Turn Default (U-021: 35% → 25% — DESIGN REVISION TRIGGERED)**
NotebookLM hosts agreed unanimously: single-turn sessions will be the norm, not the exception. Research calls it a "near-certain behavior" that CEOs hit Conclude on Turn 1. The multi-turn architecture delivers value only if the product actively scaffolds follow-up questions.

**DESIGN REVISION:** Accept single-turn as the default path. Position Turn 1 as a "conflict detector." Multi-turn is the power-user path, not the expected path. Re-architect the value proposition around single-turn + optional depth.

**CONFIRMED — Slider Overload (U-005: 30% → 22% — DESIGN REVISION TRIGGERED)**
75% of BI tool users ignore controls beyond defaults. 15+ sliders exceeds working memory (4-7 items) by 3-4x. Physical slider interaction creates friction.

**DESIGN REVISION:** Progressive disclosure mandatory. Default to 3-5 master sliders only. Per-minister knobs behind "Advanced" toggle. Add preset profiles: "Balanced," "Market-Driven," "Regulatory-Heavy." The dual-level architecture stays in the backend but the UI hides complexity.

**CHALLENGED — Fast-Track Cannibalization (U-008: 35% → 40%)**
The debate found that Fast-Track + Flash Tension Banner is a viable mitigation. The inverted funnel (synthesis first, minister cards as audit trail) matches how executives actually consume consulting decks. The banner acts as a "pull back" mechanism for contradictions. Risk remains but is mitigated by design.

**SPLIT — Weight Adjustment Usage (U-014: 30% → 35%)**
Hosts agreed most users won't adjust weights. But the architectural argument holds: even on default weights, Convergence is structurally different from Perplexity because it exposes the stack. The moat is not just sliders — it's visible ministers + provenance + tension mapping. Sliders are an enhancement, not the foundation.

**CHALLENGED — Wait Tolerance (U-003: 38% → 45%)**
Progressive rendering (first card <20s) significantly mitigates the 3-5 min total. The "thread of communication" breaks at 4 seconds, but first-byte-to-value at <20s keeps the executive engaged. Key: the FIRST card must arrive fast. The last card can be slow.

### Design Revisions Required (from Notebook 3)

| # | Revision | Assumption | Confidence Delta |
|---|----------|-----------|-----------------|
| DR-1 | Accept single-turn as default path | U-021 | 35% → 25% (below threshold) |
| DR-2 | Progressive disclosure: hide per-minister knobs behind Advanced | U-005 | 30% → 22% (below threshold) |
| DR-3 | Add decision framework scaffolding to Conclude output | U-010 | 44% → 62% (improved but conditional) |
| DR-4 | Add preset weight profiles (Balanced, Market-Driven, etc.) | U-005 | Mitigation |

---

## Notebook 2: Data Sources & Entity Resolution (Avg 52% → Post-CRUCIBLE Assessment)

### Key Findings

**MAJOR CORRECTION — FEC Filing Lag (D-008: 75% → 88%)**
External ground truth revealed FEC electronic filing data appears in OpenFEC API within **15 minutes**, not 24-48 hours as assumed. The 24-hour figure applies to summary rollups, not raw transaction data. This dramatically strengthens the "caught before press noticed" narrative and makes the Data Minister more viable.

**CONFIRMED — GDELT Requires BigQuery (D-011: 35% → 15% — ARCHITECTURE REVISION)**
NotebookLM hosts confirmed definitively: GDELT structured queries (Goldstein Scale, AvgTone) require Google BigQuery. Raw CSV downloads are ~500MB per 15-min update — impractical for real-time. This adds a Google Cloud dependency to the stealth infrastructure.

**ARCHITECTURE REVISION:** Add BigQuery to the stealth infra stack. Estimated cost: ~$5-20/query. Alternatively, consider using GDELT via GKG 2.0 API if it supports the required fields (needs verification).

**CONFIRMED — Entity Resolution is the SPOF (D-015: 35% → 30%)**
No automated API exists for cross-domain entity resolution. FEC, SEC, Polymarket, and Kalshi share zero common taxonomies. Hand-curation is the only viable Phase 1 approach. Stanford DIME achieved ~95% accuracy with human review — Convergence should accept 5-20% false negatives.

**ACTION REQUIRED:** SPIKE-1 (#36) remains the Day 0 gate. Seed entity map with 5+ real rows before ANY build starts.

**CONFIRMED — Subsidiary Trap Unaddressed (D-030: 30% → 25% — SCHEMA REVISION)**
Entity map schema lacks `parent_entity_id`. The IncludeNSFS hierarchy (Y/N/S) from the investigative methodology is not implemented. This causes silent double-counting in PAC expenditure analysis.

**SCHEMA REVISION:** Add `parent_entity_id` and `include_nsfs` fields to `convergence_entity_map` before seeding.

**CONFIRMED — OpenSecrets Python Client Unmaintained (D-009: 45% → 35%)**
OpenSecrets API itself is still active, but the official Python client is abandoned. Rate limit: 200 calls/day. For POC, use FEC API directly instead.

**CONFIRMED — Polymarket/Kalshi Have Active Markets (D-003: 40% → 75%)**
External verification confirmed: Polymarket has 211 active Senate markets, Kalshi covers all 35 2026 Senate races. Demo entity contracts very likely to exist. This was the single biggest confidence jump.

### Data Source Confidence Updates

| Source | Pre-CRUCIBLE | Post-CRUCIBLE | Notes |
|--------|-------------|---------------|-------|
| Polymarket | 70% | 85% | Confirmed open, 211 Senate markets |
| Kalshi | 65% | 80% | Confirmed public read, all 35 races |
| FEC OpenFEC | 75% | 90% | 15-min electronic filing lag (not 24hr) |
| GDELT | 35% (no BQ) | 15% (no BQ) / 80% (with BQ) | BigQuery required for structured queries |
| OpenSecrets | 45% | 35% | Python client unmaintained, use FEC directly |
| Mentionlytics | 55% | 40% | Political tracking unverified |
| NewsAPI | 70% | 50% | $449/mo production cost |
| FRED | 85% | 85% | No change — solid |
| SEC EDGAR | 85% | 88% | No change — well-documented |

---

## Notebook 1: Minister Architecture & Fan-Out (Avg 50% → Post-CRUCIBLE Assessment)

### Key Findings

**CONFIRMED — Stealth Worktree is the Top Risk (A-013: 35% → 30%)**
NotebookLM identified this as the most likely demo-day failure mode alongside expired contracts. The "zero changes to main repo" claim contradicts the blueprint's requirement to modify `shared/schema.ts` and `server/routes.ts`. Issue #57 has 7 unanswered questions.

**ACTION REQUIRED:** Complete #57 before build starts. Resolve: worktree consumption model, database query path, auth model, deployment separation, observability isolation, demo hygiene.

**CONFIRMED — Haiku Provenance Risk is Real but Mitigated (A-011: 48% → 55%)**
The deterministic retrieval architecture (Data Minister fetches structured JSON before Haiku touches it) is a genuine safeguard. Haiku only formats, not retrieves. But the 48% → 55% is modest because "provenance hallucination under context pressure" remains a documented unknown that can only be resolved by SPIKE-3 (#34).

**CONFIRMED — Honest SLA Approach is Correct (A-004: 45% → 55%)**
The pivot from aspirational <30s to honest 3-5 min was validated. Promise.allSettled + progressive rendering + per-minister timeouts is architecturally sound. First-byte-to-value at <20s is the metric that matters, not total fan-out time.

**CONFIRMED — Synthesis Gate Has Genuine Integrity (A-010: 52% → 58%)**
The AUDITOR phase within the synthesis pipeline, combined with Design Principle 0 (exposed provenance), sufficient citation requirements, and the "no auto-resolution" rule, creates real differentiation from a generic summarizer. The Attribution Problem from LLM epistemics is addressed architecturally, not just in prompts.

---

## Cross-Notebook Synthesis: Updated Assumption Confidence

### Assumptions That Improved
| ID | Pre | Post | Reason |
|----|-----|------|--------|
| D-003 | 40% | **75%** | External verification: active Polymarket/Kalshi contracts confirmed |
| D-008 | 75% | **88%** | FEC electronic filing lag is 15min, not 24hr |
| U-010 | 44% | **62%** | External research supports anti-oracle with scaffolding |
| A-004 | 45% | **55%** | Honest SLA + progressive rendering validated |
| A-011 | 48% | **55%** | Deterministic retrieval architecture is genuine safeguard |

### Assumptions That Worsened (Design Revisions Required)
| ID | Pre | Post | Reason |
|----|-----|------|--------|
| U-021 | 35% | **25%** | Single-turn is the norm; multi-turn requires active scaffolding |
| U-005 | 30% | **22%** | 15+ sliders exceeds cognitive capacity by 3-4x |
| D-011 | 35% | **15%** | GDELT definitively requires BigQuery for structured queries |
| D-030 | 30% | **25%** | Entity map schema confirmed missing parent_entity_id |

### Build-Blocking Spikes (Updated Priority)
| Spike | Pre-CRUCIBLE Priority | Post-CRUCIBLE Priority | Reason |
|-------|----------------------|----------------------|--------|
| SPIKE-1: Entity Resolution (#36) | P0 | **P0** | Still the Day 0 gate, but D-003 improvement reduces risk |
| SPIKE-2: Stealth Worktree (#57) | P0 | **P0** | Confirmed as top demo-day failure mode |
| SPIKE-3: Fan-Out Latency (#34) | P1 | **P1** | Honest SLA validated but empirical measurement still needed |
| SPIKE-4: Polygon.io Pricing (#62) | P1 | **P2** | Not needed for POC if Markets Minister uses only Polymarket+Kalshi |
| SPIKE-5: OpenSecrets Status | P2 | **P2** | Use FEC directly instead |
| SPIKE-6: GDELT Query Method | P1 | **P0** | BigQuery dependency confirmed — must add to infra plan |

---

## R4 Gate Assessment (Post-CRUCIBLE)

| Criterion | Status |
|-----------|--------|
| 3 CRUCIBLE notebooks executed | ✅ 3/3 |
| Min 3 sources per notebook | ✅ 5/5/5 |
| External ground truth in each | ✅ UX research, API docs, methodology manual |
| Both chat AND audio modalities | ✅ 21 chat queries + 3 audio debates |
| Assumptions updated with evidence | ✅ 67 → 67 (9 moved, 4 design revisions) |
| Design revisions documented | ✅ 4 UX revisions, 1 schema revision, 1 infra revision |
| No assumption below 25% without revision | ✅ All sub-25% have revisions |

**R4 VERDICT: PASS.** CRUCIBLE v4 complete. Ready for External Auditor (Phase 4b).
