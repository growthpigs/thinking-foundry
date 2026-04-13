# CRUCIBLE — Notebook 2: Data Sources & Entity Resolution

**Domain:** Do the bench sources actually exist, respond, and link to a real demo entity?
**Avg Assumption Confidence:** 52%
**Risk Level:** DEMO-DAY — if the data pipeline doesn't work, the demo collapses

---

## Sources to Upload (Min 3 Required — We Have 5)

1. `source-1-fsd.md` — The full FSD (bench source architecture)
2. `data-issues-bundle.md` — 15 data/API GitHub issues (D-001 to D-030 source material)
3. `source-3-investigative-methodology.md` — External ground truth: intelligence fusion methodology (SEC + FEC + OSINT integration manual)
4. `source-4-data-assumptions.md` — (to be created) 30 data assumptions with confidence scores
5. `source-5-external-ground-truth.md` — (awaiting agent) API documentation verification

---

## Phase 1: Chat Queries (Run 5-7 Before Audio)

### Query 1 (Anchoring)
"What data sources does Convergence use and how does it organize them across the 5 ministers? Summarize the bench-of-sources model."

### Query 2 (Entity Resolution)
"The cross-domain entity resolution maps political candidates across FEC, SEC, Polymarket, Kalshi, and GDELT using a hand-curated table. What does the investigative methodology source say about the challenges of linking entities across these domains? How does the 'Ultorg' concept apply?"

### Query 3 (API Reality Check)
"Several bench sources have unverified API access assumptions. Walk me through which APIs have been tested with live calls and which are assumed to work. What's the biggest single-point-of-failure?"

### Query 4 (Temporal Priors)
"The LLM epistemics source discusses 'hard-coded temporal priors' — filing delays that constrain when data becomes available. How do SEC Form 4 filing deadlines (2 business days), FEC filing lag, and GDELT 15-minute refresh cycles create blind spots in the Convergence intelligence picture?"

### Query 5 (Double-Counting Trap)
"The investigative methodology warns about the 'Subsidiary Trap' — double-counting when parent companies and subsidiaries file separately. How does Convergence's entity map handle parent/subsidiary relationships? Does the schema address this?"

### Query 6 (Mentionlytics Blocker)
"The assumption table rates Mentionlytics API availability at 40-55% confidence across multiple assumptions. What's the fallback if Mentionlytics is unavailable? Does the Narrative Minister have an alternative data source?"

### Query 7 (GDELT BigQuery Dependency)
"Assumption D-011 rates at 35% the claim that GDELT structured queries DON'T require BigQuery. The investigative methodology source discusses Goldstein Scale analysis. Can Goldstein Scale data be extracted from GDELT CSV downloads, or does this require BigQuery?"

---

## Phase 2: Audio Debate Generation

"Generate an audio discussion about whether Convergence's data source architecture will work in practice for a live demo. The sources include a product specification, 15 data/API issue documents, an intelligence methodology manual, and an API verification document. Focus on: (1) whether the Polymarket/Kalshi/FEC entity resolution can be deterministic, (2) whether the 3-5 minute fan-out SLA is achievable given API latency, (3) whether the 'caught before press noticed' narrative holds given FEC filing lag, (4) whether the double-counting trap from parent/subsidiary filings is addressed, and (5) whether GDELT requires BigQuery for structured queries. Let the evidence drive the discussion."

---

## Phase 3: Transcribe + Extract Findings

Same process as Notebook 3. Focus on:
- Which APIs have confirmed access vs assumed?
- Is SPIKE-1 (#36) validated or invalidated by external evidence?
- Does the investigative methodology support or challenge the entity map approach?
- Are there data sources the methodology recommends that we're missing?

## Success Criteria

- [ ] All 7 chat queries return substantive responses
- [ ] Audio debate covers all 5 focus areas
- [ ] D-003 (active contract), D-015 (entity linkage), D-011 (BigQuery) get clear verdicts
- [ ] Any assumption dropping below 25% triggers a design revision
- [ ] Any missing data source identified by the methodology is captured as a gap
