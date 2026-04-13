# CRUCIBLE Quick Reference: Convergence Data Sources

**For NotebookLM Audio Debate** — Quick lookup during Crucible v3  
**Last Updated:** April 13, 2026

---

## Source Health Dashboard

| Source | Status | Latency | Auth | Confidence | Blocker |
|--------|--------|---------|------|------------|---------|
| Polymarket | ✅ Ready | <1s | None | 9.5/10 | None |
| Kalshi | ✅ Ready | <1s | None (read) | 9/10 | Centralization risk |
| FEC OpenFEC | ✅ Ready | 15 min | None | 9.5/10 | Entity linking complexity |
| GDELT | ✅ Ready | 15 min | BigQuery | 8/10 | Requires BigQuery (not CSV) |
| OpenSecrets | ⚠️ Degraded | 24h+ | None | 6/10 | Python client unmaintained |
| NewsAPI | ❌ Blocked | <5s | Yes ($449/mo) | 4/10 | Too expensive; use GDELT instead |
| Regulations.gov | ✅ Available | 24h+ | None | 7/10 | Deferred to v2 |

---

## Critical Findings (Stress-Test Reality)

### 1. The 24-48 Hour Lag is a Myth
- **Electronic filing data:** 15 minutes (real)
- **FEC summary rollups:** 24+ hours (what people cite)
- **PDF documents:** 1-48 hours (highly variable)
- **Action:** Can implement <30s SLA using raw FEC transaction data

### 2. Entity Resolution is Manual
- **Problem:** No API auto-links "FEC Candidate John Smith" to "Polymarket Smith4Senate"
- **Solution:** Build deterministic mapping; accept unmappable candidates
- **Design:** Don't guess — flag "Entity Linking Required" instead

### 3. Kalshi is a Single Point of Failure
- **Problem:** Unlike Polymarket (blockchain), Kalshi is centralized platform
- **Failure mode:** Kalshi down = no cross-validation signal
- **Mitigation:** Circuit breaker + "Markets Partially Unavailable" state

### 4. NewsAPI is Architecturally Blocked
- **Cost:** $449/month production tier (not feasible for Convergence)
- **Alternative:** GDELT + BigQuery instead
- **Status:** Design already assumes this (see Article 75 in FSD)

### 5. GDELT Requires BigQuery
- **Myth:** Can download CSV files for real-time analysis
- **Reality:** 2015 GKG alone = 2.5+ TB; impractical
- **Solution:** BigQuery SQL queries, ~$5-20 per query typical

---

## Rate Limits & Fan-Out Math

### Polymarket Bottleneck
```
/markets endpoint: 300 req/sec
Full fan-out window: 3-5 minutes = 180-300 seconds
Request budget: 300 req/sec × 180 sec = 54,000 requests available
Markets to check: ~50 (Senate-focused)
Requests per market: ~2-4 (details + orderbook)
Total needed: 50 × 3 = 150 requests
Headroom: 54,000 / 150 = 360x safety margin ✅
```

**Conclusion:** Rate limits are NOT a constraint for Convergence in v1.

### Kalshi (No Published Limits)
- Assume standard REST limits (similar to Polymarket)
- Add circuit breaker for unknown failure modes

### FEC (No Rate Limits Documented)
- Government API, assume 99.9% uptime
- No published rate limits but operational experience suggests high capacity

---

## Debate Questions for Crucible v3

### Question 1: Cross-Domain Reliability
**Framing:** "Can Convergence reliably link FEC filings to Polymarket markets to detect signals?"

**Ground Truth:** Entity resolution is manual; false negative rate depends on candidate name disambiguation. No standard approach.

**Hosts Should Address:**
- How to handle ambiguous matches (e.g., 3 candidates named "Smith")
- Acceptable false negative rate for v1
- When to escalate to Data Minister vs. showing "Ambiguous Match"

---

### Question 2: Market Divergence Interpretation
**Framing:** "If Polymarket and Kalshi show opposite odds, what does it mean?"

**Ground Truth:** 
- Could indicate informed trading on one platform
- Could indicate different trader demographics/belief distributions
- Could indicate liquidity differences (one market more liquid = tighter spreads)
- Cannot be interpreted as "truth" — only as differential signals

**Hosts Should Address:**
- Is divergence a BUY SIGNAL or a RESEARCH SIGNAL?
- How to avoid using prediction markets as insider info sources
- Whether regulatory risk (SDNY fraud prosecutions) affects interpretation

---

### Question 3: Latency Arbitrage Risk
**Framing:** "FEC data lags 15 minutes; Polymarket is real-time. Can traders exploit this?"

**Ground Truth:**
- FEC filing triggers market move with ~1-15 minute lag
- Savvy traders watch FEC API + Polymarket simultaneously
- This is not insider trading (public data), but front-running is possible
- Convergence should NOT be used as trading signal

**Hosts Should Address:**
- Is Convergence a research tool or a trading system?
- Design Principle 0 says "information > prediction" — defend this
- How to avoid being a latency arbitrage enabler

---

### Question 4: What Breaks When Markets Go Down?
**Framing:** "Both Polymarket AND Kalshi unavailable. What does Convergence do?"

**Ground Truth:**
- No divergence detection possible
- Cannot infer market odds from other sources
- System must gracefully degrade to FEC + GDELT only

**Hosts Should Address:**
- Is "Markets Unavailable" an acceptable state for Convergence?
- Should system continue with stale market data or stop?
- How to warn users that signals are incomplete

---

### Question 5: Entity Linking as a Bottleneck
**Framing:** "If 30% of FEC filings can't be matched to markets, is Convergence useful?"

**Ground Truth:**
- Stanford DIME achieved ~95% match rate with manual review
- Full automation likely <80% match rate
- Convergence should accept this and show unmatched candidates

**Hosts Should Address:**
- Is partial coverage acceptable for v1?
- What's the minimum match rate for product viability?
- Should matching be rules-based (deterministic) or ML-based (probabilistic)?

---

## Approved Bench for v1 (Go-Live Checklist)

- [x] Polymarket Gamma API — validated, no blockers
- [x] Kalshi API — validated, circuit breaker implemented
- [x] FEC OpenFEC API — validated, 15-min SLA documented
- [x] GDELT BigQuery — validated, cost budgeted
- [x] Entity resolution framework — manual mapping with warnings
- [ ] NewsAPI — DEFERRED, use GDELT instead
- [ ] OpenSecrets API — OPTIONAL, use FEC directly
- [ ] Regulations.gov — DEFERRED to v2

---

## Upload Instructions for NotebookLM

1. Upload `CRUCIBLE-DATA-SOURCES-GROUND-TRUTH.md` (full document)
2. Add existing sources:
   - [Convergence FSD](../FSD.md)
   - [CRUCIBLE-V2-FINDINGS.md](../CRUCIBLE-V2-FINDINGS.md)
3. Run debate with 5-7 text queries first (establish facts)
4. Generate audio debate with neutral host instructions
5. Let hosts debate the 5 questions above

---

## Confidence Scorecard

| Component | Confidence | Notes |
|-----------|------------|-------|
| Polymarket reliability | 9.5/10 | Public API, live markets, Polygon blockchain |
| Kalshi reliability | 9/10 | Public API, live markets, centralization risk noted |
| FEC data freshness | 9.5/10 | 15-min SLA confirmed; entity resolution complexity |
| Entity linking accuracy | 5/10 | Manual approach; false negatives expected |
| Architectural soundness | 8/10 | Design Principle 0 holds; single market failure acceptable |
| **Overall Readiness** | **8.2/10** | Ready for v1 with documented constraints |

---

## What Changed from Crucible v2

- ✅ Confirmed NewsAPI is infeasible ($449/mo) — design already assumed this
- ✅ Confirmed entity linking is manual, not automatic
- ✅ Confirmed FEC latency is 15 min (not 24-48 hrs) for raw data
- ✅ Confirmed GDELT requires BigQuery (not CSV downloads)
- ✅ Confirmed Polymarket has 211 Senate markets as of April 12, 2026
- ✅ Confirmed Kalshi has full Senate coverage, no blockers for 2026 elections

---

## Hotkeys for Debate Moderation

When hosts ask about data sources, key points to emphasize:

**If Polymarket mentioned:** "Fully public, 211 Senate markets, no auth required, <1s latency"

**If Kalshi mentioned:** "Public read operations, live markets, but centralized (single point of failure)"

**If FEC mentioned:** "Ground truth for entities, 15-minute SLA, but entity linking is manual"

**If entity resolution mentioned:** "No standard API; Stanford DIME shows ~95% match possible with manual review; Convergence should accept unmappable candidates"

**If markets diverge:** "Not insider info, just differential signals; research tool, not trading system"

**If markets unavailable:** "Graceful degradation to FEC + GDELT; show 'Partial Data' warning"

---

## Appendix: Full Source URLs

- [Polymarket Rate Limits](https://docs.polymarket.com/api-reference/rate-limits)
- [Polymarket Gamma API Guide](https://agentbets.ai/guides/polymarket-gamma-api-guide/)
- [Kalshi API Docs](https://docs.kalshi.com/python-sdk/api/MarketsApi)
- [FEC OpenFEC](https://api.open.fec.gov/developers/)
- [GDELT Project](https://www.gdeltproject.org/data.html)
- [OpenSecrets API](https://www.opensecrets.org/api/)
- [Stanford DIME Database](https://data.stanford.edu/dime)
- [CFTC Prediction Markets Rulemaking](https://www.sidley.com/en/insights/newsupdates/2026/02/us-cftc-signals-imminent-rulemaking-on-prediction-markets)
