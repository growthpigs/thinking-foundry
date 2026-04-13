# Data & API Assumptions Under Test — Convergence

30 assumptions about data source availability, API access, entity resolution, and latency. Each rated by confidence. Purpose: stress-test target for NotebookLM debate.

## Critical Red Flags (Below 40%)

### D-003: Active Prediction Market Contract (40%)
**Claim:** There is an active Polymarket or Kalshi contract for the 2026 NC Senate race at demo time.
**Counter-evidence:** Explicitly unverified. Prediction market contracts have expiry dates. If no active contract exists, Markets Minister is SILENT on demo day.

### D-004: Polygon.io Pricing (30%)
**Claim:** Polygon.io real-time equities + options pricing is within acceptable POC cost.
**Counter-evidence:** No quote obtained. Real-time options data can cost $500-1000+/month. Budget kill-switch unspecified.

### D-009: OpenSecrets API Status (45%)
**Claim:** OpenSecrets API provides RISIP codes, lobbying data, and PAC expenditure detail.
**Counter-evidence:** OpenSecrets may have sunset its API. Issues describe "free for basic, paid for bulk." RISIP code analysis depends on this.

### D-011: GDELT BigQuery Not Required (35%)
**Claim:** GDELT structured queries (Goldstein Scale, AvgTone) can be done via CSV download without BigQuery.
**Counter-evidence:** GDELT's primary structured query interface IS BigQuery. Raw CSVs are ~500MB per 15-min update. No issue addresses query method.

### D-015: Cross-Domain Entity Linkage (35%)
**Claim:** Polymarket condition IDs and Kalshi tickers can be deterministically linked to FEC committee IDs.
**Counter-evidence:** This is SPIKE-1 — explicitly identified as critical blocker, not started. The entire cross-domain demo depends on this.

### D-016: Regulations.gov Latency (40%)
**Claim:** Regulations.gov API responds within the Data Minister's 30s timeout.
**Counter-evidence:** Issue #34 states "even with aggressive asynchronous caching, regulations.gov and FEC databases alone would kill that SLA."

### D-022: Mentionlytics Political Tracking (40%)
**Claim:** Mentionlytics can track political candidates (not just corporate brands).
**Counter-evidence:** Mentionlytics is a brand monitoring tool. Political entity tracking is a different use case. Unverified.

### D-026: Podscan.fm API (45%)
**Claim:** Podscan.fm API exists and can track podcast mentions in near-real-time.
**Counter-evidence:** Listed as "Freemium, unique signal" but pricing and API access are "TBD." No API call made.

### D-028: NotebookLM Unofficial API (30%)
**Claim:** `teng-lin/notebooklm-py` unofficial API is stable enough for Audio Debate Generation.
**Counter-evidence:** 80% success rate in testing. Google may break this API without notice.

### D-029: Mentionlytics searchByQuery (40%)
**Claim:** `mentionlyticsApiService.ts` exports a usable query method for Convergence.
**Counter-evidence:** File is "inferred" from codebase audit, not confirmed. Methods not documented.

### D-030: Subsidiary Entity Resolution (30%)
**Claim:** Entity resolution handles parent/subsidiary corporate relationships correctly.
**Counter-evidence:** Entity map schema has no `parent_entity_id` field. The "Subsidiary Trap" from the investigative methodology is not addressed.

## High Risk (50-65%)

### D-001: Polymarket API Access (70%)
Open, no auth, no geoblock for data reads. Stated as fact but no live test documented.

### D-002: Kalshi API Access (65%)
Open, covers 2026 Senate. Regulated US exchange — auth and geo restrictions unverified.

### D-005: SEC EDGAR API (85%)
Free, 10 req/sec, Form 4 data available. Well-documented. Low risk.

### D-006: SEC Form 4 Transaction Codes (75%)
Expected field names and values match SEC regulations. API JSON format unverified.

### D-007: SEC Filing Deadlines (90%)
Statutory requirements. Highest confidence data assumption.

### D-008: FEC 24/48hr Data (75%)
Filing-to-API lag is regulatory but empirically unconfirmed.

### D-010: GDELT 15-min Refresh (80%)
Free, no auth, well-established. BigQuery dependency is the risk (see D-011).

### D-012: NewsAPI Cost (70%)
Known paid API. Developer tier rate limits may hit during demo.

### D-013: Mentionlytics API Methods (55%)
Existing War Room integration, but method signatures not confirmed for Convergence's use.

### D-014: FEC Candidate IDs (50%)
2026 pre-primary filings may not be live yet.

### D-017: FRED API (85%)
Well-documented, widely used, free. Low risk.

### D-020: Perplexity Sonar Cost (50%)
$0.02-0.05/query claimed but pricing has changed multiple times.

### D-021: Hand-Curated Entity Map (45%)
No rows seeded. Entity matching across 5+ domains has not been tested.

### D-023: Legal/Compliance for API Access (60%)
Reading prediction market data (not trading) from separate infrastructure.

### D-024: Full Fan-Out SLA (50%)
3-5 minutes for all 5 ministers. Promise.allSettled is correct but empirical P95 unmeasured.

### D-025: FEC 24E/24A Lag (60%)
The "capital repositioned before press noticed" story depends on this.

### D-027: Unusual Whales (55%)
Phase 2 only. Cost estimate may be stale.

## The Central Question

Can the bench of 15+ authoritative data sources actually be queried, linked via entity resolution, and returned within SLA — or is the architecture a theoretical framework that collapses on first contact with real API endpoints?
