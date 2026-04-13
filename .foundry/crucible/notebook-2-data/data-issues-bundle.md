=== ISSUE #29 ===
Foundry Session: AI Arbitrage Thesis → Cross-Market Signal Loop (War Room feature)

# Foundry Session: AI Arbitrage Thesis → Cross-Market Signal Loop

**Status:** Mechanism landed. Pivoting to productization as a War Room feature.
**Started:** 2026-04-08
**Source material:** Nate B. Jones — \"AI is Collapsing Arbitrage\" (~29 min YouTube)
**Constitution:** #30
**Productization:** see new issue (TBD — created at end of this session)

---

## Origin

Roderic flagged Nate B. Jones's AI-arbitrage video as one of the most important pieces of 2026 thinking. Wanted to run it through the Thinking Foundry to extract a personal play: how to use Roderic + Chi together to capture some of the temporary AI productivity advantage before the window closes (~18 month horizon per Nate, accelerating as Mythos and equivalent models ship).

Original framing: personal $500 experiment. Final framing: a War Room product feature. The pivot happened naturally as the mechanism revealed itself.

---

## Nate's Core Thesis (distilled)

1. Markets have always run on arbitrage — gaps between cost-to-produce and price-to-pay. AI is now collapsing those gaps on the timescale of model releases (months/weeks), not decades.
2. Five gap types: **Speed**, **Reasoning**, **Fragmentation**, **Discipline**, **Knowledge asymmetry / Intelligence arbitrage**.
3. CNC lathe parallel (1980s): hidden machine = fat margins for ~2 years, then collapse 60-80%. AI service businesses are in the \"hidden machine\" phase.
4. Durable gaps that AI does NOT close fast: regulatory moats, relationship-dependent trust, physical-world logistics, creative taste, hard-won judgment.
5. **Migration rule:** the new gap is always upstream of the old one (closer to judgment, taste, systems thinking).
6. Polymarket case study: $313 → ~$438K in ~30 days, 98% win rate, 6,615 trades, exploited propagation lag between Binance spot and Polymarket 15-min crypto contracts.
7. **The losing move is to assume your current position is steady state.**

---

## The Narrowing Journey (for the record)

The session went through several false starts before landing on the right shape. Captured here so we don't repeat them.

| Round | What we tried | Why it was wrong |
|---|---|---|
| 1 | Roderic's personal services (Google Ads audits, French DTC creative mining) | Required outreach + marketing — ruled out by Roderic |
| 2 | 100 \"limbo information\" capital plays (collectibles, marketplaces, etc.) | 80% were expertise arb, not AI arb. Edge was Roderic's knowledge, not AI compute. Failed Nate's mechanism. |
| 3 | Trading on Polymarket / Kalshi | Polymarket hard-blocked in France (ANJ enforcement, IP+fingerprint, VPN = permanent fund loss). Kalshi unverified for FR residents. |
| 4 | **Cross-Market Signal Loop** — read prediction markets via free public API, act in regulated FR-legal venues | ✅ This is the mechanism. |

The third round was the key insight from Roderic: \"I wasn't talking about actually betting on Polymarket. I was talking about using the API just to get the information.\" That reframe broke the session open.

---

## The Mechanism We Landed On

**Cross-Market Signal Loop** (formal definition in #30)

> Read N public real-time signals — including prediction market contract prices via free public API — to estimate the probability of a real-world event. When that probability differs from how a *separate, legally-tradeable* market has priced the *implication* of the event, take a position in the legally-tradeable market.

**Key insight:** Polymarket Gamma API (gamma-api.polymarket.com) and Kalshi public API (api.elections.kalshi.com/trade-api/v2) are **fully open, no auth, no geoblock on the data layer** — only the trading frontends are geoblocked. From France we can read all of it for free.

**The edge:** Cross-domain translation. Prediction markets are good at pricing event probabilities. Equity/commodity markets are good at pricing assets. Neither is good at translating between the other. AI does the translation at scale; humans do not.

**Roderic's framing:** \"Legal insider trading.\" The information is public; the cross-reference work is what we provide.

---

## Eight Example Cross-Market Chains (full SCOUT)

1. **Hurricane track** → Polymarket landfall contracts + NOAA NHC cone → buy OJ futures / Generac calls / Home Depot calls
2. **Fed rate decisions** → Kalshi vs CME FedWatch divergence → buy TLT / IEF
3. **M&A rumors** → Polymarket acquisition contracts + EDGAR Form 4 + unusual options activity → buy target stock or calls
4. **Election shifts** → Polymarket presidential odds + poll aggregators → sector rotation (defense/energy/green/healthcare)
5. **Geopolitical tension** → Polymarket conflict contracts + AIS naval tracking + satellite imagery → defense ETFs / oil / gold
6. **FDA approvals** → Polymarket drug contracts + FDA AdCom calendar + ClinicalTrials.gov → biotech stock with hedged downside
7. **AI launches** → Polymarket model release contracts + datacenter satellite imagery + job postings → NVDA / MSFT / ASML
8. **Weather contracts** → Kalshi temperature/precip + NOAA + ECMWF + GFS multi-model → natural gas (UNG) / agricultural futures

Each chain is a recipe: SIGNAL set → corroboration → real-world action venue.

---

## Constitution Compliance (Six Criteria)

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Pipe A exists with real, free/cheap, real-time API | ✅ Polymarket Gamma + Kalshi public + NOAA + FRED + EDGAR + many more |
| 2 | Pipe B exists with programmatically-tradeable API | ✅ IBKR France, Trade Republic, Saxo, Kraken EU |
| 3 | Lag between A and B is ≥1 minute and ≤24 hours | ✅ Cross-domain translation lag is hours-to-days for most pairs |
| 4 | Repeatable many times per period | ✅ Thousands of open contracts at any time |
| 5 | $500 testable (relaxed for current SCOUT) | n/a — pivoted to product feature |
| 6 | Legal for FR resident | ✅ Reading prediction markets is unregulated; trading happens in regulated EU venues |

All criteria pass. Mechanism is real and accessible.

---

## The Pivot to War Room

Mid-SCOUT, Roderic recognized that the Cross-Market Signal Loop is bigger than a personal experiment. It's a tool that belongs inside **War Room** (political and business intelligence with read-and-write layer; thewarroom.ai). The natural fit: surface daily \"signal briefs\" showing which prediction market contracts have moved, what corroborates them, what the implication is for related real-world markets, and what an intel buyer (campaign, lobbyist, journalist, trader) should know.

**This session ends here.** A new issue captures the productization track. The mechanism is now part of the canonical Constitution (#30) and available for any future hunt.

---

## Phase Log

- [x] Phase 0 — User Stories
- [x] Phase 1 — MINE — root cause: Two-Pipe Latency Loop (then extended to Cross-Market Signal Loop in Constitution Amendment 1)
- [x] Phase 2 — SCOUT — 8 cross-market chains documented above
- [SKIP] Phase 3 — ASSAY — superseded by productization pivot
- [SKIP] Phase 4 — CRUCIBLE — will be done inside the War Room productization session
- [SKIP] Phase 5 — AUDITOR — ditto
- [SKIP] Phase 6 — PLAN — ditto
- [x] Phase 7 — VERIFY — captured in this issue + #30 + (new productization issue)

---

## Outputs

1. **#30 Constitution** — Two-Pipe Latency Loop + Cross-Market Signal Loop, the canonical hunting framework
2. **(new issue)** — War Room productization Foundry session
3. **This issue** — closed as the canonical record of the thinking journey

=== ISSUE #34 ===
RESEARCH SPIKE: Reactive Convergence latency budget validation (FR-15 + FR-1.1)

## Context

Spawned from Crucible v2 review of [#31](https://github.com/growthpigs/thinking-foundry/issues/31). Crucible v2 Turn 3 surfaced specific latency failure modes for FR-15 (Reactive Convergence) that need empirical validation BEFORE Day 1 of the POC build.

## The claim under test

A C-suite user types "Should we move ad spend from Ohio to Pennsylvania next week?" into the Convergence page input. The system fans out to 5+ bench sources in parallel and Claude composes a Convergence item in **<30s**.

## Steps that need empirical numbers

1. **Topic profile extraction** (Claude Haiku 4.5 parse) — measure actual P50/P95 latency on representative C-suite queries
2. **Entity resolution** (Ohio → FCC DMA codes, FEC candidate IDs, Regulations.gov dockets) — does the FR-2.1 cross-domain entity table actually cover this kind of geographic query? Test with 5 real C-suite scenarios.
3. **5-way parallel fan-out** — measure P50/P95 against:
   - Polymarket Gamma API
   - Kalshi public API
   - FEC 24/48hr feed
   - Regulations.gov API
   - NewsAPI / Perplexity
4. **Straggler timeout strategy** — what's the cutoff for dropping a slow source? Validate it doesn't push the responding-sources count below FR-0.1 minimum (≥2 for proactive, ≥1 for reactive after v2.1 softening).
5. **Claude Haiku 4.5 token budget** — how many tokens does a 5-source payload actually consume? At what point does Haiku start hallucinating provenance chains under context pressure?

## Acceptance criteria

- [ ] P95 reactive latency for 5-source fan-out documented for at least 3 representative queries
- [ ] Government API straggler scenarios identified (which APIs > 10s P95?)
- [ ] Hard timeout strategy spec'd (e.g., 12s per source, drop and degrade after that)
- [ ] Claude Haiku 4.5 token budget documented for representative payloads
- [ ] Cache hit rate validated against \`(tenant, topic profile, 5-min window)\` keying

## Why this is a Day 0 gate

If the <30s SLA is unrealistic, the entire FR-15 reactive mode UX collapses. The C-suite user types a query, watches a spinner for 45 seconds, and concludes the product is broken. Better to discover this on Day 0 and adjust the SLA than to discover it on demo day.

## Related

- FSD: thinking-foundry#31
- Crucible v2 findings: docs/04-technical/CRUCIBLE-V2-FINDINGS.md (Turn 3)
- FR-15, FR-0.2, FR-1.1, FR-2.1

=== ISSUE #38 ===
FR-SRC-1: Source Tiering & Per-Tenant Configuration — not all clients need FEC/FCC

## Context

Current assumption: all War Room clients care about FEC and FCC filings.

**Reality:** FEC/FCC matter only for lobbying, political, and regulatory clients. A corporate strategic client cares about:
- Competitor funding (Crunchbase)
- Executive trading (SEC Form 4)
- Geopolitical events (GDELT)
- Market sentiment (Polymarket)

A non-profit cares about:
- Policy changes (OpenStates)
- Congressional activity (Quiver)
- Public opinion (Podscan, news)

---

## Source Tiers (for Phase 1/2 Rollout)

### Tier 0 — Universal (all tenants)
- **Polymarket + Kalshi** (prediction markets)
- **NewsAPI** (baseline news)
- **GDELT** (global events, free, real-time)

### Tier 1 — Political/Regulatory Clients
- **FEC** (lobbying spend, independent expenditures)
- **FCC** (broadcast/telecom rules, ad buys)
- **Regulations.gov** (agency rule proposals)
- **OpenStates** (state legislation)

### Tier 2 — Corporate/Competitive Intelligence
- **Crunchbase** (funding, M&A, layoffs)
- **SEC Form 4** (insider trading)
- **Unusual Whales** (options flow, institutional positioning)

### Tier 3 — Deep Narrative (all tiers, optional)
- **Podscan.fm** (podcast interviews, policy wonks)
- **Quiver Quantitative** (congressional trading)

---

## Implementation Strategy

### Phase 1 (current POC)
- Hardcode Tier 0 + Tier 1 for demo tenant
- Entity map includes columns for all tiers (populated selectively)

### Phase 2
- Admin dashboard: per-tenant **source tier toggle**
- Each client selects which tiers to enable
- FR-4.2 trigger logic: only fire on enabled sources
- Polling jobs: only run for enabled sources (cost savings)

### Caching Strategy

**Cached sources** (update on schedule, not per-query):
- FEC (5-minute poll)
- FCC (5-minute poll) 
- Regulations.gov (30-minute poll)
- News (real-time, cached for 15-min)
- Crunchbase (daily refresh)
- OpenStates (6-hour refresh)

**Real-time sources** (queried per request):
- Polymarket/Kalshi (live market APIs)
- GDELT (15-min updates, still fresh)
- SEC Form 4 (webhook, <300ms)
- Podscan (firehose subscription)
- Quiver (daily, often same-day)

---

## FR-1.1 Expansion

Current FR-1.1 mandates 5 live bench sources for SM-1. Update to:

> FR-1.1 (Tier 0 + Tier 1 Bench): POC mandates Tier 0 (Polymarket, Kalshi, GDELT, News) + Tier 1 selected by tenant. Tier 2+ are Phase 2 additions and must be explicitly enabled at the account level.

---

## Database Schema Implications

Entity map needs a **source_tier_map** to avoid duplicating config:



---

## Acceptance Criteria

- [ ] Tier 0 sources fire for all tenants
- [ ] Tier 1+ sources only fire if explicitly enabled in tenant config
- [ ] Polling jobs respect enabled tiers (cost savings)
- [ ] Admin dashboard shows source tier toggle (Phase 2)
- [ ] Documentation clarifies which clients should use which tiers

Related: thinking-foundry#31, thinking-foundry#36 (entity map)

=== ISSUE #54 ===
📚 Future Sources Registry — free/paid watchlist for Convergence bench expansion

## Summary

A living registry of signal sources to consider for Convergence bench expansion. Free and paid. Not currently wired in. This issue exists so we don't lose track of promising sources as the roadmap evolves.

Per Roderic: 'we found that thing called GDELT, there were a whole bunch of other things there, even if they were paid. I need them to be in a list somewhere.'

**This list is not a commitment to integrate any of these.** It's a watchlist. Each source needs its own integration spec before we touch it.

## How Sources Get Added

Any time a new source comes up in conversation, issues, or research — add it here. When a source graduates to integration work, it gets its own FR-SRC issue and can be removed from this list (or marked as 'promoted').

---

## Free / Freemium Watchlist

### Event & Narrative (News Minister / Narrative Minister)

| Source | Signal | Status | Notes |
|---|---|---|---|
| **GDELT** | Global events, 15-min refresh, real-time | Phase 2 (in #38 Tier 0) | Free, massive coverage, noisy |
| **Podscan.fm** | Podcast interview transcripts, real-time | Phase 2 (in #38 Tier 3) | Freemium, unique signal — opinions that don't appear in news |
| **Hacker News** | Tech community sentiment, breaking stories | Watchlist | Free via API, niche |
| **Reddit Pushshift / Pullpush** | Subreddit sentiment, early signals | Watchlist | Free, high noise |
| **4chan /pol/ archives** | Extremist signal detection (use carefully) | Watchlist | Free, requires heavy filtering |
| **Wayback Machine** | Deleted content, historical changes | Watchlist | Free, good for 'what was removed' |

### Political & Regulatory (Data Minister)

| Source | Signal | Status | Notes |
|---|---|---|---|
| **FEC** | Federal Election Commission filings | Phase 1 (in #38) | Free, rate-limited, critical for campaign clients |
| **OpenSecrets** | Lobbying, campaign finance | Phase 2 | Free for basic, paid for bulk |
| **OpenStates** | State legislation tracker | Phase 2 (in #38 Tier 1) | Free API, patchy coverage |
| **Regulations.gov** | Federal rule proposals + comments | Phase 1 | Free, slow P99 |
| **Congress.gov** | Federal bills, votes, committee | Watchlist | Free, good for legislative intelligence |
| **GovTrack** | Legislative tracking, scoring | Watchlist | Free, structured data |
| **FCC** | Broadcast/telecom filings, ad buys | Phase 2 | Free, campaign-relevant |

### Financial & Market (Markets Minister / Data Minister)

| Source | Signal | Status | Notes |
|---|---|---|---|
| **Polymarket** | Prediction markets | Phase 1 (POC core) | Free API |
| **Kalshi** | Prediction markets, regulated | Phase 1 (POC core) | Free API |
| **Metaculus** | Long-horizon forecasting | Watchlist | Free, analyst-grade |
| **Manifold Markets** | Community prediction markets | Watchlist | Free, smaller liquidity |
| **SEC EDGAR** | Public filings | Watchlist | Free, structured |
| **SEC Form 4** | Insider trading | Phase 2 (in #38 Tier 2) | Free, webhook-able |
| **Quiver Quantitative** | Alternative data aggregator | Phase 2 (in #38 Tier 3) | Freemium |
| **FRED (St. Louis Fed)** | Economic indicators | Watchlist | Free, authoritative |
| **Treasury.gov Fiscal Data** | Federal budget/debt | Watchlist | Free |

### Corporate & Competitive (Knowledge/Data Minister)

| Source | Signal | Status | Notes |
|---|---|---|---|
| **Crunchbase** | Funding, M&A, layoffs | Phase 2 (in #38 Tier 2) | Freemium |
| **PitchBook** | Private company intelligence | Watchlist | Paid — check pricing |
| **ZoomInfo** | Company/contact data | Watchlist | Paid |
| **Clearbit** | Company enrichment | Watchlist | Freemium |

### Government Science & Health (Data Minister)

| Source | Signal | Status | Notes |
|---|---|---|---|
| **openFDA** | FDA filings, drug/device approvals | Watchlist | Free, 120k req/day key |
| **NOAA** | Weather, climate, disasters | Watchlist | Free, authoritative |
| **USGS** | Earthquakes, geological events | Watchlist | Free, real-time |
| **EPA Envirofacts** | Environmental data | Watchlist | Free |
| **USDA** | Agricultural data | Watchlist | Free |
| **CDC Data.gov** | Public health data | Watchlist | Free |
| **WHO GHO** | Global health indicators | Watchlist | Free, international |

### International & Geopolitical

| Source | Signal | Status | Notes |
|---|---|---|---|
| **ACLED** | Armed conflict events | Watchlist | Free academic, paid commercial |
| **Our World in Data** | Global dev indicators | Watchlist | Free, curated |
| **World Bank Open Data** | International econ data | Watchlist | Free |
| **UN Comtrade** | International trade flows | Watchlist | Free |

---

## Paid / Enterprise Watchlist

These are premium enterprise sources that may justify cost for specific high-value Convergence tenants. **Not for POC.** Listed so we don't lose track.

| Source | Domain | Ballpark Cost | Why It Matters |
|---|---|---|---|
| **Bloomberg Terminal** | Financial, market data, news | ~$25k/user/yr | Gold standard for markets |
| **Refinitiv / LSEG Eikon** | Financial, M&A, filings | ~$20k/user/yr | Bloomberg competitor |
| **FactSet** | Financial analytics | ~$12k/user/yr | Institutional |
| **S&P Capital IQ** | Credit, market, financial | Enterprise | Institutional |
| **Moody's Analytics** | Credit risk, economic forecasts | Enterprise | Credit-focused |
| **Dataminr** | Real-time breaking events from public data | Enterprise | Military/intelligence-grade alerting |
| **Palantir Foundry** | Data fusion platform | Enterprise | Massive — overkill for most |
| **Kensho (S&P)** | NLP over financial data | Enterprise | AI-native |
| **Primer** | NLP threat intelligence | Enterprise | Defense/intel |
| **Recorded Future** | Threat intelligence, geopolitical | Enterprise | Cyber + geopol |
| **RepRisk** | ESG risk, reputational | Enterprise | ESG-focused |
| **Sayari** | Corporate network / beneficial ownership | Enterprise | AML/compliance |
| **Sigma Ratings** | AML risk | Enterprise | Compliance |
| **Exiger** | Third-party risk / sanctions | Enterprise | Compliance |
| **Verisk** | Insurance / catastrophe risk | Enterprise | Actuarial |
| **Chainalysis** | Crypto tracing | Enterprise | Crypto-native |

**Note:** Many of these overlap with what a Data Minister would aggregate. For Convergence, integrating any of them requires enterprise client willing to pay-through. They are not candidates for baseline bench.

---

## Promotion Process

When a source graduates from watchlist to active integration:

1. Open a dedicated `FR-SRC-N` issue for that source
2. Include: API docs, auth model, rate limits, cost, which Minister consumes it, how it affects entity mapping (#36)
3. Crucible-test the integration before shipping
4. Mark source as 'promoted' in this list, link to its FR-SRC issue

## Open Questions

1. Do we need a budget cap per tenant for paid sources? (Probably yes — see cost containment P1 stub)
2. Does Perplexity (#40) cover most of the freemium sources as a fallback? If yes, prioritize direct integration only for high-value ministers.
3. Which sources are War Room's existing `unifiedDataIntegrationService` already touching? (Reduces new integration work)
4. Are there international / non-US sources we should be adding? Roderic's tenant mix may expand beyond US politics.

## Related

- Master: #31
- Index: #49
- Source tiering: #38
- Perplexity fallback: #40
- Entity mapping: #36

=== ISSUE #59 ===
P1 STUB — FR-COST-1: Cost Containment & Budget Per Briefing Session

## Stub — needs full spec

Convergence is expensive at scale. 5 ministers × N briefing turns × Claude calls × 10+ live APIs × per-tenant caching. No issue currently addresses budget ceiling.

## Open Questions

1. **Per-briefing budget ceiling.** What is the max Claude spend allowed for a single briefing session? $5? $20? Per turn?

2. **Cost-kill switch.** When a briefing hits ceiling, what happens? Hard stop? Soft warning? Degrade to cached/fixture data?

3. **Haiku vs. Sonnet vs. Opus per role.** Which model runs each minister? Which runs Foundry synthesis? Roderic's note in #51: 'Consider using Claude Opus for [Foundry] step even if ministers use Haiku.'

4. **Caching strategy.** FR-15 already mandates 5-min windowed cache. Is that enough? Per-minister per-tenant LRU? Shared tenant cache?

5. **API cost per source.** Which bench sources have per-query costs (NewsAPI, Perplexity)? Which are free (GDELT, Polymarket, FEC)? Needs per-source budget allocation.

6. **Per-tenant ceiling.** Monthly budget per tenant? Alerts when approaching limit?

7. **Stealth infra cost model.** Since Convergence runs on separate infra (not Think Big's), Roderic eats the cost until reveal. Need ballpark for demo month.

## Deliverables (for full spec)
- [ ] Budget model per briefing
- [ ] Model assignment per role (minister / synthesis)
- [ ] Caching architecture beyond 5-min window
- [ ] Cost telemetry in admin dashboard
- [ ] Hard stop rules
- [ ] Stealth infra cost estimate for POC + demo period

Master: #31 | Index: #49 | Related: #15 (FR-15 caching)

=== ISSUE #62 ===
FR-MARKETS-2: Financial Markets Data Integration (Polygon.io / IEX Cloud)

# FR-MARKETS-2: Financial Markets Data Integration

## Decision (2026-04-13)
**Vendor: Polygon.io** — broad coverage, real-time, used by serious financial platforms.

Cost must be verified before build starts. Convergence is a premium product — do not shy away from paying for quality data. Check polygon.io/pricing for the relevant tier (real-time equities + options).

---

## Minister Assignment

Financial markets data stays in the **Markets minister** — it IS a market. Prediction markets (Polymarket, Kalshi) and financial markets (equities, options, futures) are two different market signals that the same minister synthesizes.

The Markets minister brief = 'What is capital saying? Both where money is literally bet (prediction markets) and where it is literally invested (equities, options, short interest).'

These are complementary signals:
- Prediction markets: crowd wisdom on outcomes (political, regulatory, event-driven)
- Financial markets: institutional capital movement on the same outcomes

When they diverge — that is a Convergence alert.

---

## Data Points to Pull (Polygon.io)

| Signal | Polygon endpoint | Analytical meaning |
|--------|----------------|-------------------|
| **Insider buy signal** | Already in Data minister (SEC Form 4) | CEO buys own stock = confidence |
| **Short interest** | /v2/aggs + short float data | High short = institutional skepticism |
| **Options flow** | Unusual options activity | Smart money directional bets |
| **Price + volume** | /v2/aggs/ticker | Baseline momentum |
| **After-hours movement** | Extended hours data | First mover reaction to news |

**Key principle (from Crucible debates):** A P-code on Form 4 (insider buy) crossed with unusual call option flow in the same week = STRONG confluence signal. One source alone is noise. Together they are signal.

---

## Integration Note

Polygon.io also covers ETFs and sector indices. For political/regulatory decisions, sector movement (e.g., defense ETF up after Armed Services Committee vote) is meaningful Markets minister signal.

---

## Phase

Phase 1 POC: Polygon.io equities data for the demo entity (NC Senate race industry beneficiaries or the relevant sector). Full options flow analysis Phase 1+.

## Cost Gate
Before provisioning: verify Polygon.io pricing for the tier needed. Flag cost to Roderic before signing up. This is a premium data vendor — budget accordingly.

## Related
- Markets minister sources: #31 (FSD)
- Prediction markets (Polymarket/Kalshi): already specced in FSD
- Entity mapping: #36 (same entity must resolve across FEC + Polygon)
- POC demo entity: #95

=== ISSUE #70 ===
RESEARCH: Paid Data APIs Inventory (User mentioned earlier list)

# Paid APIs Inventory (Pre-Compaction Findings)

**FOUND AND VERIFIED FROM SESSION #31 PRE-COMPACTION TRANSCRIPT**

## Free Sources (No Cost)
- **GDELT** — Global event detection, Goldstein systemic impact scoring (-10 to +10), mention trajectories
- **SEC EDGAR (Form 4)** — Insider buy/sell activity via SEC public database
- **CourtListener (RECAP)** — Federal court filings, litigation risk, regulatory enforcement patterns
- **Hacker News Algolia** — Tech community sentiment, regulatory/competitive framing signals
- **Metaculus + Manifold Markets** — Prediction markets with expert forecasters

## Paid Sources (-500/month)

| API | Cost | Use Case |
|-----|------|----------|
| **Unusual Whales** | ~$500/mo | Institutional options flow + dark pool; capital repositioning 1-2 weeks ahead of announcements |
| **OpenSecrets enrichment** | ~$50-100/mo | Enhanced FEC + congressional intelligence beyond raw Form 3/4 |
| **Podscan.fm** | Paid (tier TBD) | Podcast transcripts; early signal from policy wonks/CEOs before press release |
| **Quiver Quantitative** | Paid (tier TBD) | Political insider trading patterns + congressional fundraising intelligence |
| **Crunchbase** | Enterprise (likely $300-600/mo) | Competitive threat signals — funding rounds, acquisitions, layoff patterns |
| **Polygon.io / IEX Cloud** | $200-400/mo | Financial markets (DOW, NASDAQ, yields, VIX) — capital markets institutional activity |

## Key Insights
- **Unusual Whales** is the highest-cost intelligence source (~$500/mo) but captures dark pool activity 1-2 weeks ahead of events
- **Podscan + Quiver** are the "cheap-talk detectors" — capture insider positioning before public markets react
- **Form 4 insider trading** (free via SEC EDGAR) is the ultimate cross-domain signal validation (insiders voting with real capital)
- **Financial markets** sources bridge prediction markets and real economy; essential for Convergence's Markets minister

## Phase 2 Integration Order (Post-POC)
1. Podscan (high lead time value)
2. Quiver (congressional intelligence loop closer)
3. Unusual Whales (options market intelligence)
4. Crunchbase (competitive positioning)
5. Financial markets aggregator (Polygon/IEX)

=== ISSUE #95 ===
POC Demo Entity: NC Senate Race — Cross-Domain Signal Test

## Why This Entity

For a POC demo to a client, we need a real entity with active signal across all 5 ministers. The NC Senate race (or a comparable high-profile US political race) is the ideal demo target:

- **NOT Kalshi** — the Kalshi account in War Room is a fake sales-demo, not a real client. Using it would be circular.
- **NOT a generic public company** — need something with meaningful political + financial + narrative + regulatory cross-domain signal.

A competitive US Senate race has:

| Minister | Signal available |
|---------|----------------|
| **Knowledge** | Briefing docs uploaded by Chief, candidate position papers |
| **Markets** | Polymarket and Kalshi both have active contracts on Senate races |
| **News** | NewsAPI + GDELT both cover Senate races extensively |
| **Narrative** | PodScan.fm podcast mentions, Mentionlytics social tracking |
| **Data** | FEC campaign finance (RISIP codes, PAC 24E/24A expenditures), OpenSecrets |

All 5 ministers have real, live, fetchable data. This is the cross-domain confluence story in action.

---

## The Demo Scenario

**Setup:** Chief of a PAC or a strategic advisory firm is monitoring the NC Senate race. They want to understand:
- Where is money flowing and what does it signal about insider confidence?
- What are prediction markets saying vs what is the press narrative?
- Are there early warning signals in PAC expenditure patterns?

**What Convergence surfaces:**
- Markets minister: Polymarket contract probability + Kalshi odds on the race
- News minister: GDELT event coverage + NewsAPI headlines
- Narrative minister: Social momentum, podcast mentions of candidates
- Data minister: FEC filings (24E expenditures FOR candidate X, 24A AGAINST candidate Y — maps threat matrix), OpenSecrets RISIP code cluster
- Knowledge minister: Whatever the Chief uploaded (position papers, internal strategy docs)

**The confluence alert the demo shows:**
Data minister flags a spike in 24A independent expenditures against one candidate. Markets minister shows a corresponding probability drop on that candidate in Polymarket. News minister has nothing yet — the press hasn't caught up. Narrative is quiet.

**The story:** 'Capital repositioned before the press noticed. Convergence caught it because it reads FEC filings and prediction markets simultaneously.'

This is the product's thesis in a live demo.

---

## POC Constraints

### What the POC must do
- All 5 ministers return real data on this entity
- Cross-domain entity mapping table (#36) must resolve 'NC Senate Race / [Candidate Name]' across FEC, Polymarket, GDELT
- Confluence alert must fire with real data (not mocked)
- Chief of Staff can be invoked and returns a real synthesis

### What the POC does NOT need to do
- Handle every US Senate race (just one is fine for demo)
- Persist sessions across restarts (nice to have, not required)
- Audio debate generation (Phase 2)
- Full 3-5 min production latency — POC can be slower if data is real

### The Stealth Constraint
POC lives in a separate worktree of alpha-war-room. Does NOT touch main War Room code. Does NOT get deployed to Think Big's servers. Demo is on separate infra.

---

## Alternative Demo Entities (If NC Race Doesn't Have Live Contracts)

Check in this order for active Polymarket/Kalshi contracts:
1. 2026 NC Senate race (Tillis seat)
2. Another competitive 2026 Senate race with active prediction market
3. A major ballot initiative with cross-domain signal
4. Fall back to a large public company with active options market + FEC lobbying activity + news cycle

The entity must have ACTIVE prediction market contracts. Without Markets minister signal, the demo loses its most differentiated data layer.

---

## Spike Required
Before POC build starts, someone needs to verify:
1. Is there an active Polymarket/Kalshi contract on the 2026 NC Senate race (or similar)?
2. Is the candidate name in that contract resolvable to their FEC candidate ID? (Entity mapping spike — #36)
3. What is the FEC data availability? Are 2026 pre-primary filings live?

This spike can be done in <2 hours with direct API queries.

## Related
- Entity Mapping Spike: #36 (this blocks the demo)
- FSD: #31
- POC Scope: #50
- Stealth integration: #57

=== ISSUE #97 ===
ARCH: Data Minister Must Be Deterministic (Matrix-OS Pattern)

## Source
NotebookLM V3 Convergence audit (2026-04-13) — LLM Epistemics artifact + Investigative Methodology artifact

## Finding
The Data Minister should NOT use an LLM for its core function. It should use **structured semantic retrieval** — deterministic queries against cached API data (FRED, NOAA, Census, BLS).

The NotebookLM epistemics analysis validates this: LLM outputs for structured data are "context-directed extrapolation" governed by "hard-coded temporal priors." When the input is already structured (JSON from FRED, CSV from BLS), running it through an LLM adds latency and hallucination risk with zero analytical gain.

## Architecture Decision
- **Data Minister = deterministic retrieval + structured formatting** (no LLM)
- Use Haiku 4.5 ONLY for the final natural-language summary (2-3 sentences from structured data)
- Cache layer with 15-min sliding window (FR-4.1)
- Returns: structured JSON with source attribution, then Haiku formats the minister card text

## Contrast With Other Ministers
| Minister | LLM Role | Why |
|----------|----------|-----|
| Data | Formatting only | Input is already structured numbers |
| Markets | Comparison only | Polymarket/Kalshi return structured odds |
| News | Summarization | Unstructured text needs synthesis |
| Knowledge | Semantic search | Gemini File Search already handles this |
| Narrative | Analysis | Sentiment requires language understanding |

## Implications
- Fastest minister in the fan-out (<5s cached, <30s cold)
- Most reliable (deterministic = reproducible)
- Cheapest (minimal token usage)
- Model routing: Haiku 4.5 for formatting pass only

## Ref
- #96 (MinisterService Blueprint — ratification addendum adds model routing)
- #82 (Model Selection)
- Design Principle 0: Information > No Information

=== ISSUE #99 ===
TECHNIQUE: The Fusion Point — SEC Hedging × Lobbying Cross-Reference

## Source
NotebookLM V3 Convergence audit (2026-04-13) — Investigative Methodology artifact, Section 5

## Finding
The most powerful analytical technique identified in the NotebookLM research is the **Fusion Point**: cross-referencing SEC Form 4 "K" codes (equity swaps/hedging) with specific IssueID fields in lobbying tables.

**The Signal:** If an insider is hedging their stock (protecting against a price drop) while their company is lobbying heavily on a specific bill, the investigator has identified a target "betting against" their own public influence campaign.

This is exactly the kind of cross-domain confluence that Convergence is built to surface.

## How This Maps to Convergence Ministers

| Data Point | Source | Minister |
|-----------|--------|----------|
| Form 4 Code K (hedging) | SEC EDGAR | Markets Minister |
| Lobbying expenditures + Bill_Name | OpenSecrets / FEC | Knowledge Minister |
| Company public statements | News/PR | Narrative Minister |
| Related prediction markets | Polymarket/Kalshi | Markets Minister |

**Convergence value:** When Markets Minister detects Code K hedging AND Knowledge Minister detects heavy lobbying on the same entity + bill, the Chief should flag this as a **HIGH TENSION** signal with WEP "LIKELY" conflict indicator.

## Implementation Notes
- Requires entity mapping (SPIKE-1, #36) to link SEC filer → lobbying registrant → Polymarket contract
- Form 4 data available via SEC EDGAR API (free, 10 req/sec)
- This is a **showcase example** for the POC demo (#95 NC Senate Race)

## Transaction Code Reference (from NotebookLM artifact)
| Code | Type | Signal Value |
|------|------|-------------|
| K | Equity Swaps/Hedging | **CRITICAL LEADING** — insider mitigating risk |
| P | Market Purchase | Positive — insider confidence |
| S | Market Sale | Negative — may indicate lack of confidence |
| J | Other (requires footnote) | **HIGH RISK** — complex non-standard maneuvers hidden here |

## Ref
- #36 (Entity Mapping SPIKE-1)
- #95 (POC Demo Entity)
- #84 (OSINT/All-Source framework validation)
- #64 (Capital vs Narrative Axis)

=== ISSUE #100 ===
ARCH: SEC Temporal Priors as Data Freshness Constraints

## Source
NotebookLM V3 Convergence audit (2026-04-13) — LLM Epistemics artifact, Section 3

## Finding
SEC filing deadlines create **hard temporal constraints** on data freshness that the Markets Minister must account for:

| Filing | Deadline | Implication |
|--------|----------|-------------|
| Form 4 (changes) | 2 business days after transaction | Most recent insider activity is AT LEAST 2 days old |
| Form 3 (initial) | 10 days after becoming insider | New insider positions lag by up to 10 days |
| Form 5 (annual) | 45 days after fiscal year end | Exempt transactions may be invisible for up to 410 days |

## Design Implication
The Markets Minister must display **data age** alongside every SEC-sourced data point. Not as a bug — as a feature. This is Design Principle 0 in action: expose the stack.

**Example minister card text:**
> "CEO Jane Smith filed Form 4 on Apr 11 (trade date: Apr 9) — sold 50,000 shares. This is the most recent filing; any trades since Apr 9 are not yet visible."

## Rules for Markets Minister
1. Always show trade date AND filing date (they differ)
2. Flag Form 5 data as "annual disclosure — may be up to 12 months old"
3. Code K (hedging) transactions get priority display regardless of age
4. If no Form 4 filings in >30 days, note absence explicitly: "No insider transactions filed in [N] days"

## Anti-Hallucination
The LLM Epistemics artifact warns: "The model lacks the agency to 'know' a trade before it is filed in the EDGAR database; it is simply mapping the latency of the regulatory framework."

The Markets Minister must NEVER speculate about unfiled transactions. Only surface what EDGAR contains, with temporal context.

## Ref
- #96 (MinisterService Blueprint)
- #58 (Data Sufficiency Meter)
- Design Principle 0: Information > No Information

=== ISSUE #30 ===
CONSTITUTION: The Arbitrage Hunting Framework (Two-Pipe Latency Loop + Cross-Market Signal Loop)

# The Constitution: The Arbitrage Hunting Framework

**Status:** CANONICAL — governs all arbitrage hunts on this repo and its descendants
**Origin:** Foundry session #29 (Nate B. Jones \"AI Arbitrage\" video → Cross-Market Signal Loop discovery)
**Ratified:** 2026-04-08
**Version:** 1.2 (jurisdiction-agnostic; FEC/FCC and lobbying data added to bench)

This document defines the ONLY type of arbitrage mechanism we pursue. Any candidate that does not fit one of the two valid shapes is out of scope.

---

## 1. The Core Thesis

Markets have always run on arbitrage — gaps between cost-to-produce and price-to-pay. AI is collapsing those gaps on the timescale of model releases. The Polymarket bot ($313 → ~$438K in ~30 days) is the canonical public example, but it didn't \"predict\" anything — it exploited the fact that Polymarket's 15-minute crypto contracts repriced slower than Binance's spot price. **It was a loop, not a search.**

Our job is to find where that same loop shape exists in other domains and run our own version of it.

---

## 2. The Mechanism: Two Valid Shapes

### Shape A — Two-Pipe Latency Loop (the original)

Pipe A and Pipe B are markets for the *same* asset. Pipe A reprices faster (the truth source). Pipe B reprices slower (the betting venue). The bot reads both, computes the implied correct price for B based on A, and trades B inside the lag window.

**Edge:** Propagation lag.
**Decay:** HFT colocation. Lag windows compress over time.
**Canonical case:** Polymarket / Binance crypto contracts.

### Shape B — Cross-Market Signal Loop (the generalization)

Pipe A is a SET of N read-only public data sources — including prediction market contracts used as signal-only — that together estimate the probability of a real-world event. Pipe B is a SEPARATE market that prices the *implication* of the event but has not yet repriced because no human is performing the cross-reference.

**Edge:** Cross-domain translation. Humans don't watch both markets at once.
**Decay:** Someone else builds the cross-reference pipeline.
**Tailwind:** Better reasoning models (Mythos and beyond) make the translation more reliable.
**Canonical case:** Read Polymarket/Kalshi via free public APIs + FEC/FCC + government data, act in regulated trading venues.

### How the Loop Runs (both shapes)

```
1. Read Pipe A (poll, webhook, WebSocket)
2. Reason about the implication for Pipe B
3. If Pipe B's current price differs materially from the implied correct price → place position
4. Wait for Pipe B to catch up
5. Exit
6. Repeat
```

**The edge in plain English:** *not* prediction. *not* expertise. **Just propagation lag (Shape A) or cross-domain translation (Shape B).**

---

## 3. The Six Criteria — every candidate must pass all six

| # | Criterion | Failure mode |
|---|-----------|--------------|
| 1 | **Pipe A exists with a real, free/cheap, real-time API** | No truth source → nothing to read |
| 2 | **Pipe B exists with a programmatically-tradeable API** | Can't place positions → manual → not a loop |
| 3 | **Measured lag between A and B is ≥1 minute and ≤24 hours** | <1 min = HFT zone (we lose). >24 hr = expertise play (not a loop) |
| 4 | **The lag is repeatable many times per period** | One-shot lags are bets, not systems |
| 5 | **Capital-feasible at the operator's tier** | Tier is set by the operator (personal experiment vs product feature) |
| 6 | **Legal in the operator's jurisdiction with no regulated-broker hurdles** | Jurisdiction is a parameter; the framework works in US (SEC/CFTC/FINRA), EU, UK with appropriate venue selection |

**Any candidate failing any one of these is rejected before SCOUT.**

---

## 4. What This Framework Rejects

These are NOT valid hunts under this Constitution, even if they look like arbitrage:

- **Expertise arbitrage** (vintage watches, first-edition books, undervalued collectibles). Edge is human knowledge, not API lag. Scales with attention, not capital.
- **Physical resale arbitrage** (Leboncoin → 1stDibs, Yahoo Japan → Chrono24). Manual fulfillment, no loop.
- **Services / consulting / newsletters / content**. Requires labor and outreach.
- **Sub-second latency plays** (MEV, CEX-DEX, HFT). Cannot compete at retail-grade infrastructure.
- **One-shot bets** (IPO allocations, single-event predictions). No loop, no repeatability.
- **Pure prediction / forecasting**. If we have to be right about the future, we're not arbitraging — we're gambling.

---

## 5. The Diagnostic — Nate's Three Questions

Before any candidate enters SCOUT, answer these:

1. **What inefficiency is this built on?** Name the lag precisely. (\"Pipe A publishes X every Y. Pipe B reprices every Z. The delta is Z - Y.\")
2. **How fast can AI close that gap?** Quarters? Months? Weeks? That's the time window.
3. **What new gap does the closure create?** When this loop dies, what upstream skill do we now own?

If you can't answer all three with specifics, the candidate isn't ready.

---

## 6. The Pipe A Bench (signal sources, all read-only and public)

### Prediction markets (signal-only — read, do not trade)
- Polymarket Gamma API (gamma-api.polymarket.com) — open, no auth, no geoblock on data
- Kalshi public API (api.elections.kalshi.com) — open, no auth, covers ALL markets
- Manifold Markets API — community probabilities (free)
- Metaculus API — expert forecasting (free)

### Government data (US-focused, free, real-time)
- **SEC EDGAR RSS** — all corporate filings, real-time
- **FEC OpenFEC API** (api.open.fec.gov) — campaign finance, 24/48-hour Independent Expenditure reports, donor data
- **FCC Public Inspection Files API** (publicfiles.fcc.gov) — political ad public files, broadcast filings, transfers of control
- **FRED (St. Louis Fed)** — every US economic data series
- **NOAA / NWS** — weather, hurricanes, forecasts
- **FDA AdCom calendar + ClinicalTrials.gov** — drug approvals + trial readouts
- **EIA energy data** — oil/gas/electricity stocks + flows
- **TSA checkpoint data** — daily US air travel volume
- **CME FedWatch** — implied Fed rate moves
- **Senate LDA / House LD-1** — lobbying registrations
- **OpenFEC + OpenSecrets** — donor and influence flows

### Real-time tracking
- **OpenSky Network** — aircraft positions
- **MarineTraffic / VesselFinder** — AIS ship positions
- **Sentinel / Copernicus** — satellite imagery (free)

### Sentiment + attention
- **Google Trends API** — search volume spikes
- **Wikipedia pageview API** — article view spikes
- **Reddit API** — subreddit post velocity
- **Sport stats APIs** (Football-Data.org, ESPN endpoints)

---

## 7. The Pipe B Bench (action venues — set per operator's jurisdiction)

### US operator (default for War Room productization)
- **Equities + ETFs:** IBKR US, Schwab, Fidelity — full NYSE/Nasdaq access
- **Commodity futures:** IBKR / NinjaTrader for CME, ICE
- **Options:** IBKR with options-trading approval
- **Crypto (regulated):** Coinbase, Kraken, Gemini
- **Forex:** OANDA, IBKR
- **Domain names:** GoDaddy, Sedo, Dynadot

### Other jurisdictions (set per session)
- EU: IBKR Ireland, Trade Republic, Saxo, Bitstamp/Kraken EU
- UK: IBKR UK, Hargreaves Lansdown, Smarkets, Betfair Exchange
- Asia: per-country regulated brokers

---

## 8. Reference Case A — Polymarket / Binance (Two-Pipe Latency Loop)

- **Pipe A:** Binance BTC/USDT spot price (WebSocket, real-time)
- **Pipe B:** Polymarket 15-minute BTC up/down contracts (REST)
- **Lag observed:** 2.7-12.3 seconds in 2026 (compressing)
- **Loop:** Subscribe to Binance ticks → compute implied probability of 15-min close → compare to Polymarket price → if delta > threshold, place Polymarket position → exit at resolution
- **Result:** 98% win rate across 6,615 trades, $313 → ~$438K in ~30 days for one wallet
- **Why it's closed to retail:** Sub-second lag, 73% of profits captured by sub-100ms HFT, min viable capital $5-10K, $3-10K/year API costs

This is our template for Shape A.

## 9. Reference Case B — Cross-Market Signal Loop (the productizable shape)

- **Pipe A set:** Polymarket Gamma API + Kalshi public API + FEC OpenFEC + FCC OPIF + NOAA + FRED + EDGAR + sport stats + news APIs + others (full bench in Section 6)
- **Pipe B:** Operator-jurisdiction-appropriate regulated venue
- **Loop:** Read N signals → Claude estimates event probability → compute implied price impact on related Pipe B instrument → if Pipe B hasn't moved, place position → exit when Pipe B prices in
- **Why this works:** Cross-domain translation is hard for humans, easy for AI. Prediction markets price events; equity markets price assets; regulators publish filings; nobody connects them at scale.
- **Roderic's framing:** \"Legal insider trading\" — the information is public; the cross-reference is the value-add.

This is our template for Shape B.

### Fourteen worked example chains (recorded in #29 + amended in #31)

**Original 8:** Hurricane→OJ; Fed rate→bonds; M&A→target stock; Election→sector rotation; Geopolitics→defense+oil; FDA→biotech; AI launches→suppliers; Weather→nat gas

**FEC/FCC additions (6):** 24/48-hr Independent Expenditure→race odds + broadcasters; Super-PAC formation→sector policy expectation; FCC political ad volume→local broadcaster earnings; Lobbying registration surge→affected sector; FCC merger filings→broadcast M&A; Cross-pipe political confluence→narrative call

---

## 10. Session Log

- **Session #29** (this Constitution's origin) — closed; canonical record of the discovery journey
- **#31 War Room productization** — active feature track for productizing this as War Room's intelligence layer

=== ISSUE #36 ===
SPIKE-1 (Convergence): Cross-Domain Entity Mapping Table — foundational plumbing before any AI logic

## Context

> **Blocks:** Every other Convergence issue. No trigger logic, no confluence engine, no UI work starts until this is done.
> **Stealth build** — lives in thinking-foundry, implements in alpha-war-room worktree on separate infra.

Government APIs (FEC, FCC, Regulations.gov) and blockchain prediction markets (Polymarket, Kalshi) share **zero taxonomies or common IDs**. Without an explicit mapping table in the database, the AI will silently fail or hallucinate connections between similarly named but distinctly different entities.

This was identified as a critical gap in Crucible v2 (Turn 2, Gap 2) and promoted to **FR-2.1** in the FSD:

> **FR-2.1 (Cross-Domain Entity Curation):** For the POC, the hand-curated mapping table MUST be expanded beyond Polymarket/Kalshi IDs. Each of the 5-10 curated rows must include the explicit `fec_committee_id` and the exact `mentionlytics_keyword_tag` to guarantee deterministic entity resolution during the demo week.

---

## What This Spike Proves

That **an FEC financial filing drop can deterministically trigger a Polymarket/Kalshi query** — not by string-matching candidate names, but by looking up a pre-seeded entity row that binds:

```
"John Smith for Senate"  →  FEC committee ID: C00123456
                         →  Kalshi market slug: SMITH-SENATE-2026
                         →  Polymarket condition ID: 0xabc...
                         →  Mentionlytics keyword tag: "john-smith-senate"
                         →  Regulations.gov docket prefix: "EPA-HQ-OPP"
                         →  FCC DMA code: 505
```

Without this row, the engine receives an FEC filing for "John Smith for Senate Committee" and has no deterministic path to the prediction market for the same entity.

---

## Schema (Neon — stealth DB)

```sql
CREATE TABLE convergence_entity_map (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  display_name    text NOT NULL,
  domain_tags     text[] NOT NULL,

  -- Prediction markets
  polymarket_condition_id  text,
  kalshi_market_ticker     text,

  -- Government APIs
  fec_committee_id         text,
  fec_candidate_id         text,
  fcc_dma_code             text,
  regulations_docket_id    text,

  -- Private tenant signals
  mentionlytics_keyword    text,
  swot_topic_tag           text,

  -- Temporal scope
  event_start_date         date,
  event_end_date           date,

  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

CREATE INDEX ON convergence_entity_map (tenant_id);
CREATE INDEX ON convergence_entity_map (fec_committee_id);
CREATE INDEX ON convergence_entity_map (polymarket_condition_id);
```

---

## Deliverables

### 1. Database migration
- [ ] Create `convergence_entity_map` table in stealth Neon DB
- [ ] Add indexes on `tenant_id`, `fec_committee_id`, `polymarket_condition_id`

### 2. Seed script — 5-10 hand-curated rows
- [ ] Research and fill real FEC committee IDs for 5-10 current political events
- [ ] Find matching Kalshi market tickers + Polymarket condition IDs for same events
- [ ] Add matching Mentionlytics keyword tags (aligned with demo tenant config)
- [ ] Populate `seed-convergence-demo-tenant.ts` with these rows

### 3. Lookup API
- [ ] `GET /api/convergence/entity-map?tenant_id=X&fec_committee_id=Y` → returns full row
- [ ] `GET /api/convergence/entity-map?tenant_id=X&domain_tags[]=politics` → returns matching rows
- [ ] Used by `signalLoopEngine.ts` to resolve entity before any API fan-out

### 4. Proof-of-concept test
- [ ] Receives a mock FEC filing payload for one of the seeded committee IDs
- [ ] Looks up entity map row
- [ ] Constructs a valid Polymarket API query using `polymarket_condition_id`
- [ ] Asserts the query returns a real market

This test = spike is complete.

---

## Why Hand-Curation Is Correct for Phase 1

Automatic entity resolution (NLP → FEC API → disambiguation → match) is a 3-week build. For the POC, we hand-curate the mapping for exactly the events we will demo. The AI proves the reasoning stack; the mapping proves the plumbing is deterministic.

Auto-resolution is Phase 2 scope.

---

## Acceptance Criteria

- [ ] `convergence_entity_map` table exists in stealth Neon DB
- [ ] ≥5 rows seeded with real FEC committee IDs + matching prediction market IDs
- [ ] Lookup API returns deterministic results for all seeded rows
- [ ] POC test passes: FEC filing → entity lookup → Polymarket query constructs correctly
- [ ] All seeded rows have at least one `mentionlytics_keyword` aligned with demo tenant config

## Blocks

- SPIKE-2: `signalLoopEngine.ts` trigger logic
- FR-4.2: Any-source trigger (FEC, FCC)
- FR-15: Reactive mode fan-out
- FR-1.2: Per-tenant watch list

## Related

- thinking-foundry#31 — Convergence FSD (FR-2.1, Spike-1 definition, Crucible v2 findings)
- thinking-foundry#34 — FR-15 latency spike (depends on this)

=== ISSUE #40 ===
FR-SRC-2: Perplexity Search Layer — filling gaps between direct APIs and relevant intelligence

## Context

Sources with no direct API or poor rate limits can be covered via Perplexity real-time search instead of building integrations.

**Trade-off:** Speed/simplicity vs determinism/caching.

---

## When to Use Perplexity (not direct API)

**Sources that have Perplexity APIs:**
- Court filings (CourtListener exists but slow)
- State AG enforcement actions
- International regulatory changes
- Niche industry reports
- Academic/research papers on policy

**Perplexity cost:** ~/bin/zsh.02-0.05 per query. At 100 queries/day = -5/day = -150/month.

**Rate limits:** Request throttling per account (exact limits are enterprise-only).

---

## Sources that DO have direct APIs (use those instead)

- FDA: [openFDA API](https://open.fda.gov/) (free, 120k req/day with key)
- EPA: [EPA Data APIs](https://www.epa.gov/webservices) (free)
- USDA: Various USDA data APIs (free)
- SEC: SEC EDGAR API (free)
- NOAA: NOAA APIs (free)

Don't use Perplexity for these — they have APIs.

---

## Hybrid Approach: Phase 2+

### Tier 0 + 1 (Phase 1): Direct APIs only
- Polymarket, Kalshi (prediction markets)
- FEC, FCC, Regulations.gov (government)
- NewsAPI (news)
- GDELT (events)
- Crunchbase, SEC Form 4 (public markets)

### Tier 2 (Phase 2): Mix of direct API + Perplexity

**Direct APIs:**
- Podscan.fm (podcast transcripts)
- Quiver Quantitative (congressional trading)

**Perplexity supplemental:**
- "What are the latest state AG investigations into [entity]?"
- "Recent court filings against [company]"
- "International regulatory developments for [industry]"

---

## Implementation

### API Choice
Perplexity's [Sonar API](https://docs.perplexity.ai/guides/usage-tiers) supports real-time search. Cost is pay-as-you-go credits (~/bin/zsh.02-0.05 per query depending on model depth).

### When to Call It
Not in the main signalLoopEngine.ts trigger loop (too slow, non-deterministic). Instead:

**Pattern 1: User-initiated (FR-15 reactive)**
- User asks a Convergence question
- If Tier 2 sources enabled: "[Would you like me to search for recent court filings / state actions / international developments?]"
- Async call to Perplexity if user confirms

**Pattern 2: Background enrichment (Phase 3)**
- After initial Convergence result is rendered
- Background job calls Perplexity to fill gaps
- Adds as a collapsible "Additional Intelligence" section (optional, not core)

---

## Not a Replacement for Direct APIs

**Why Perplexity can't replace FEC/FCC:**
- Non-deterministic (same query returns different results)
- Can't cache (search results expire)
- Slower (needs web search time)
- Not guaranteed to catch all filings (depends on web indexing)

**Why it's good for supplemental:**
- Free coverage of sources without APIs
- User can opt-in (not forced)
- No integration cost
- Fast for ad-hoc queries ("tell me about recent X")

---

## Acceptance Criteria

- [ ] Research: which Phase 2 sources lack direct APIs?
- [ ] Document: cost/latency comparison (direct API vs Perplexity) for each gap
- [ ] Implement: Perplexity integration in FR-15 reactive mode (optional)
- [ ] UX: "Would you like me to search for...?" inline prompt
- [ ] Monitoring: track Perplexity query costs, hallucination rate

Related: thinking-foundry#31 (bench expansion), thinking-foundry#38 (source tiering)

=== ISSUE #84 ===
Constitutional Reference: OSINT & All-Source Intelligence Framework Validates 5-Minister Model

## Source
Crucible debate audio: 'Track power with military intelligence tactics'

## The Core Validation

This debate is not about Convergence directly — it's a deep dive into military intelligence methodology applied to public financial/political data. It validates Convergence's entire architecture from first principles.

### Why Intelligence Agencies Failed (Pre-9/11)

> 'For decades they relied on a strictly siloed system of single-INT producers. The CIA had a piece, the FBI had another piece, the NSA had a third. Because no one was putting them all on the same table, they couldn't see the impending threat.'

This is exactly the failure mode of a single AI chatbot. One model, one context window, one data stream → misses the cross-domain signal. Convergence's 5-minister architecture IS the intelligence reform: Knowledge (HUMINT), Markets (SIGINT), News (OSINT-media), Narrative (social/cultural signal), Data (FEC/SEC/regulatory filings).

### The All-Source Mandate

The military response was collaboration platforms (Intellipedia, ACEbase) that forced analysts to synthesize across disciplines. Convergence's Foundry Synthesis Gate is the same structural answer: no minister briefs in isolation, all tensions are cross-mapped.

---

## Data Minister: Specific Signal Types Confirmed

### SEC Form 4 — Insider Trading Filings
The debate provides the exact mechanics of what the Data Minister reads from EDGAR:

| Code | Meaning | Analytical Weight |
|------|---------|------------------|
| **P** | Open-market purchase (own cash) | **STRONG signal** — only one reason: insider believes price rises |
| **S** | Sale | **WEAK signal** — dozens of mundane reasons (tax liability, diversification, divorce) |
| **A** | Grant/Award | **NOISE** — routine compensation, not predictive |

Critical nuance for Convergence: A Form 4 S-code alone should NOT trigger a Convergence alert. A Form 4 P-code absolutely should — especially when crossed with other ministers.

**Timeline:** Form 3 (initial disclosure, within 10 days of becoming insider) → Form 4 (transactions, within 2 business days of each trade) → Form 5 (annual wrap-up, within 45 days of fiscal year end)

**Insider definition:** Officer, director, or >10% shareholder. Not mid-level managers. The Data Minister tracks this tier specifically.

### OpenSecrets — RISIP Codes (Political Strategy Cipher)
Two-character code revealing donor's entire political strategy:
- First char: **D**emocrat, **R**epublican, **T**hird party, **U**nknown
- Second char: **W**inner, **L**oser, **I**ncumbent, **C**hallenger, **O**pen seat

Reading clusters: A corporation flooding **DW** codes = preserving access to Democratic incumbents. **RC** codes = disrupting a Republican committee by funding challengers. The pattern reveals threat matrix.

### PAC Expenditure Codes (Power Moves)
| Code | Type | Meaning |
|------|------|---------|
| **24E** | Independent expenditure **for** | Supports candidate, bypasses contribution limits |
| **24A** | Independent expenditure **against** | Attack ads — corporation views candidate as existential regulatory threat |

'By parsing this data, you aren't just seeing who a corporation likes. You are identifying who they view as a direct existential threat to their business model.'

This is the Data Minister's exact brief: reveal threat matrices, not just headlines.

---

## The Cross-Domain Synthesis Example (From the Debate)

> 'Take a Form 4P code from SEC EDGAR showing a defense contractor CEO just purchased M of their own stock. Cross-reference with OpenSecrets and find a massive spike in type 24E independent expenditures targeting DW recipients on the Armed Services Committee. Suddenly you've connected corporate confidence directly to targeted political influence.'

This is the Convergence confluence reasoning engine in a single sentence. This exact pattern should be in the FSD as a worked example.

---

## Data Traps: Why Provenance Matters

The debate outlines traps that directly justify Convergence's source-count display and explicit data sufficiency meters:

### 1. Double-Counting Trap
Executive donates k to PAC → PAC donates same k to candidate. Naïve total shows k. Reality: k moved twice. Must filter internal transfers. Convergence must surface this — a minister citing two 'sources' that are actually the same money is not multi-source confirmation.

### 2. Subsidiary Trap
Parent company files comprehensive lobbying report that includes all subsidiaries. An analyst pulling the subsidiary separately double-counts influence across multiple committees. The cross-domain entity mapping table in Convergence must handle subsidiary relationships.

### 3. Net Worth Illusion
Politicians file using asset value ranges (e.g., 'k–k' or 'over M'). OpenSecrets averages min and max to get a midpoint. The press reports the midpoint as precise net worth. This is the **same problem as Convergence's 0-100 strength score** — a computed midpoint absorbs the uncertainty and is reported as truth.

The debate's conclusion: 'A true analyst reads the footnotes. They look for the attachments. They question the methodology behind the data collection itself. If you aren't critically examining the underlying assumptions of your sources, you aren't really an intelligence analyst — you are just doing data entry.'

Convergence's answer: show raw source counts, show sufficiency meters, surface the footnotes.

---

## The OSINT Democratization Thesis = Convergence's Value Proposition

> 'The tools of a master analyst are literally just a few clicks away. So if anyone can download this information right now, are the world's most vital secrets hidden in classified vaults? Or are the real secrets hiding in plain sight, buried in a massive, incredibly boring spreadsheet, waiting for someone curious enough to connect the dots?'

This IS Convergence's pitch to the Chief. The Data Minister doesn't require a security clearance. It reads EDGAR, SEC EDGAR, FEC, OpenSecrets, FRED, NOAA — all public, all boring, all available. The competitive advantage is synthesis, not access.

---

## FSD Impact

1. **Add this worked example to FSD**: Form 4P + 24E/24A PAC codes + RISIP clustering = confluence alert
2. **Data Minister source list refined**: Distinguish P-code signals (high weight) from S-code signals (low weight, require corroboration)
3. **Cross-domain entity mapping table**: Must handle subsidiary relationships and transfer chains (not just name matching)
4. **The 'boring spreadsheet' framing**: Consider using this as customer-facing copy — Convergence makes the boring visible

## Related
- FSD: #31
- Data Minister bench of sources: already includes EDGAR, FEC, OpenSecrets, FRED
- Confluence reasoning engine: #31 FR-5

