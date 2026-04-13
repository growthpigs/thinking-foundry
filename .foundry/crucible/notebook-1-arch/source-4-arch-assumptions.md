# Architecture Assumptions Under Test — Convergence

15 assumptions about the minister fan-out architecture, service targets, model routing, and deployment. Each rated by confidence.

## Critical (Below 45%)

### A-004: Fan-Out Latency SLA (45%)
**Claim:** Promise.allSettled with 5 concurrent minister calls completes within per-minister SLA targets (Markets <5s, News <5s, Narrative <10s, Knowledge <15s, Data cold <30s).
**Counter-evidence:** No empirical measurement. Issue #34 exists because this was flagged as unverified. FEC and Regulations.gov documented as slow P99. Issue #75 killed the original <30s SLA because it was never tested.

### A-011: Haiku Provenance Hallucination (48%)
**Claim:** Haiku 4.5 produces zero hallucinated provenance chains from structured data under context pressure.
**Counter-evidence:** Issue #34 explicitly flags "At what point does Haiku start hallucinating provenance chains under context pressure?" as an open question. This is a documented unknown. Provenance hallucination under load is a known LLM failure mode.

### A-012: Cache Hit Rate (42%)
**Claim:** 15-minute sliding window cache achieves meaningful hit rate in multi-turn sessions.
**Counter-evidence:** 5-min vs 15-min window conflict across issues. Cache hit rate depends on semantic hash stability between turns. Never measured.

### A-013: Stealth Worktree Integration (35%)
**Claim:** Stealth worktree of alpha-war-room can consume existing services without changes to the main repo.
**Counter-evidence:** Issue #57 is entirely unanswered questions. No decision made on worktree strategy, deployment, or observability. Most speculative architecture assumption.

### A-014: Demo Entity Active Contracts (40%)
**Claim:** NC Senate race demo entity has active Polymarket/Kalshi contracts at demo time.
**Counter-evidence:** Issue #95 states "Check in this order..." with no confirmation of contract existence. Contracts expire.

### A-015: Chat Heuristic Accuracy (38%)
**Claim:** Decision-statement heuristic correctly classifies terse executive language.
**Counter-evidence:** Issue #34 lists "Chat-gating heuristic misses terse executive language" as known gap. No classification data.

## Moderate (50-65%)

### A-001: WebSocket Event Names (62%)
emitToCompany() accepts arbitrary event names. Confirmed in codebase audit but not runtime-tested.

### A-003: Correct Service Target (55%)
geminiFileSearchService (not knowledgeBaseService) is the correct runtime service for Knowledge Minister. Documented but not tested.

### A-005: newsApiService Extension (52%)
searchByQuery() can be added trivially to existing service. Service not read in this session.

### A-006: mentionlyticsApiService Existence (55%)
Labeled as "inferred" in codebase audit. May not exist or may have different interface.

### A-007: Chat Pipeline Integration (58%)
Inserting convergence guard into enhancedPerplexityChatService won't break chat. chatPipeline.ts confirmed dead code but not exhaustively verified.

### A-010: Opus Synthesis Capacity (52%)
Opus 4.6 handles full 5-minister payload + turn history within context and <30s. Token budget never measured.

## Strong (65%+)

### A-002: Drizzle Migration Safety (68%)
Appending 3 tables to shared/schema.ts. Standard practice but untested against live DB.

### A-008: API Geoaccess (65%)
Polymarket/Kalshi APIs accessible from Railway deployment region. Stated as fact for France access.

### A-009: Multi-Tenant Isolation (72%)
JWT companyId middleware prevents cross-tenant access. Proven pattern in production. Highest confidence architecture assumption.

## The Central Question

Is the minister architecture a sound parallel fan-out system that will produce reliable, non-hallucinated intelligence within SLA — or is it a theoretical design that will hit unresolvable walls when it contacts real APIs, real model behavior, and a real production TypeScript monolith?
