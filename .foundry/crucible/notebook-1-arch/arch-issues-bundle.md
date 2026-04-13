=== ISSUE #31 ===
FEATURE (War Room): Convergence — cross-domain reasoning engine over a bench of signal sources

# Convergence — Master FSD

**Status:** Exploratory. Nothing locked. POC ships when ready — no calendar.
**Version:** v3 (post Opus 30k reframe + cabinet briefing model)
**Last updated:** 2026-04-09
**Index:** #49

> This document is the master source of truth for Convergence. It consolidates all decisions from today's thinking and is designed to be uploaded to NotebookLM as a single document for further adversarial thinking.

---

## 1. Product Vision

Convergence is the **cabinet briefing product** — the first AI tool that treats the user as the Chief, not the decision-recipient.

Every other AI product today is racing to be the oracle. GPT answers. Perplexity summarizes. Claude synthesizes. They all collapse the stack into a single response — efficient, but it strips the user of the one thing that makes them the decision-maker: the synthesis authority.

Convergence inverts this. It keeps the stack visible, keeps the advisors distinct, keeps positions contradictory when they should be, and makes the user do the hardest and most valuable work: **deciding**.

### Positioning

> **'The AI that refuses to decide for you.'**

In a market of sycophantic answer engines, the tool that hands you the contradictions and makes you think is the premium product.

### The Target User: The Chief

Not analysts. Not executives looking for dashboards. **Chiefs making decisions.** People who are accountable for synthesis:

- CEOs making strategic calls
- Campaign managers making media decisions
- Policy directors making regulatory calls
- Fund managers making allocation decisions
- Senators / executives balancing contradictory intelligence
- Military commanders before operational decisions

Every Chief lives in a world of contradictory intelligence. Convergence serves that world.

### The Experience

The Chief opens Convergence with a question. 5 specialized ministers — each covering a domain — begin briefing in parallel. Each minister has a position, evidence, and self-reported confidence in their own data. The Chief can:

- Read the ministers' positions
- Drag 3-knob weighting mixers per minister to express 'what matters to me for THIS decision'
- Inject new documents mid-briefing
- Ask follow-up questions that trigger new briefing turns
- Hit 'Conclude' when ready, triggering a Foundry synthesis that produces a chief-facing decision brief

The brief surfaces what each minister would have the Chief do, where they contradict, and what the Chief must ultimately choose. It does not tell the Chief what to decide.

---

## Design Principles

### Design Principle 0: Information > No Information

By default, Convergence returns information rather than silence. The system never hides a signal because it's "not confident enough" or "doesn't meet thresholds." Instead:

- Single high-quality signals render as **"Single Signal" cards** with explicit yellow warnings
- Contradictory positions from ministers are SURFACED, not reconciled
- The stack is EXPOSED with full provenance — the Chief decides if enough

### Design Principle 1: Chief's Hidden Context (The Compensation Mechanism) 

**The Core Principle:**

The AI cannot and will not ever know everything. Not because of a technical limitation we can fix, but because context is inherently distributed. The Chief carries knowledge that cannot be easily articulated—a conversation last night, a relationship fact pattern, something they know won't happen even if the data suggests it will.

The **Weighting Mixer is the compensation mechanism** that bridges this gap:

- **Auto-weighted default:** Convergence outputs a balanced weighting (e.g., 38% Markets, 54% Knowledge, 8% News) based on all gathered signal
- **Chief reads the stack:** Across multiple turns, the Chief consumes reports from competing Ministers
- **Chief compensates:** Based on private context only they hold, the Chief adjusts the sliders to reweight the Ministers
- **No slider touch = still valid:** If the Chief doesn't adjust sliders, they get the full stack with conflicting advice—and they decide
- **The slider is optional UI, but the compensation mechanism is non-negotiable**

**Why This Matters:**

- It's not friction; it's honesty about how decisions actually get made
- It respects human judgment instead of replacing it
- It works for both $500K decisions AND $10M decisions (especially $10M)
- It persists across sessions — the Chief doesn't need a 4-hour sitting to make one decision

**Evidence from Crucible v3:**  
For $10M decisions, executives spend 20-30 hours on due diligence. They will absolutely spend 20-30 minutes adjusting sliders when that gives them synthesis authority. Research shows people spend 20 hours on YouTube before buying a car; they invest time in decisions that matter to them.

**Objections & Responses:**  
See GitHub Issue #73 for comprehensive objection handling arguments developed from the Crucible debates.

---

## 2. Strategic Differentiation


### Design Principle 2: Decision Liability — 'You Carry the Risk'

The Chief carries the real-world risk of any decision. The AI surfaces tensions, contradictions, and evidence — but never recommends a course of action. Every synthesis ends with a friction point: "This is what the ministers say. What do you decide?"

This principle is non-negotiable. If the system ever auto-resolves a contradiction without Chief input, it has failed. The friction is intentional. See #78 for full specification.

**Implications:**
- No "recommended action" button. No default choice. No AI-generated conclusion.
- The conclude action is always Chief-initiated (#51).
- WEP labels describe the ministers' agreement level, not a recommendation strength.

### Why This Matters

Everyone else in AI is collapsing the stack. Convergence preserves it. This is a *category creation* move, not a feature.

### Defensible Moat

1. **Chief-centric framing** — branding and UX positioning that competitors cannot copy without abandoning their current 'helpful assistant' posture
2. **Foundry synthesis gate** — uses an adapted version of The Thinking Foundry's battle-tested phase pipeline for final synthesis. This is pre-validated IP that competitors cannot reproduce without the Foundry itself
3. **Bench breadth + entity mapping** — the cross-domain entity resolution layer (#36) is the quiet plumbing that makes multi-source correlation work, and it is the hardest piece to build from scratch
4. **War Room data substrate** — per-tenant Mentionlytics, SWOT, and uploaded knowledge docs that live behind enterprise auth and cannot be bulk-accessed by competitors

### Market Positioning

Convergence is not a feature of War Room. It is a new product category that happens to be born inside War Room as its first stealth host. Phase 3+ may spin it out as its own brand.

---


## 2.5 Model Selection: Claude Opus 4.6

**Primary reasoning model:** Claude Opus 4.6 (via Anthropic API)  
**Why Opus 4.6:**
- Significantly more capable than GPT-4/3.5 (baseline for early Crucible debates)
- Better synthesis reasoning for multi-minister contradiction mapping
- Superior ability to handle large token payloads (knowledge docs + filings + news feeds)
- Enables richer Foundry synthesis without hallucination risk

**Model usage:**
- **Ministers synthesis:** Opus 4.6 for initial intelligence extraction and Minister position articulation
- **Foundry gate:** Opus 4.6 for final decision brief synthesis (the MINE + tension mapping)
- **Audio script generation:** Can use Opus 4.6 or Haiku 4.5 (cost optimization)
- **Debate audio (Phase 2):** Opus 4.6 for Minister-to-Minister script generation before NotebookLM audio

**Cost implications:**  
Phase 1 POC: Opus 4.6 for all synthesis  
Phase 2+: Consider Haiku 4.5 for lightweight operations (asset generation, copy refinement)

---

## 3. Core Architecture

### Data Flow

```
Intelligence Hub → SWOT (Knowledge) → Convergence Page → Workspace Editor
                                            ↓
               Chief types question / loads scenario
                                            ↓
             5 Ministers brief in parallel, multi-turn
                                            ↓
                  Chief weights via 3-knob mixers
                                            ↓
               Chief hits 'Conclude' → Foundry Gate
                                            ↓
                    Chief-facing decision brief
                                            ↓
                         Chief decides
```

### The 5 Authoritative Ministers

Each minister is a specialized advisor with its own sources, voice, and output format.

| # | Minister | Sources | Role |
|---|---|---|---|
| 1 | **Knowledge** | Tenant docs + SWOT + uploaded files | What this tenant knows about themselves |
| 2 | **Markets** | Polymarket, Kalshi | Crowd intelligence layer |
| 3 | **News** | NewsAPI, GDELT, Podscan.fm | Event & narrative stream |
| 4 | **Narrative** | Mentionlytics, social anomalies, podcast extracts | Sentiment & momentum |
| 5 | **Data** | FEC, FCC, SEC, openFDA, EPA, NOAA, FRED

---

## 🔄 CRUCIBLE V3 FINDINGS (2026-04-09)

**Crucible Debate Notebook:** bd8bbdbf-4c33-42cb-bef5-ee452a36d7ba  
**Findings Issue:** ~~#72~~ (CLOSED — integrated here)

The Crucible debate surfaced six architectural refinements that should be incorporated into this FSD:

1. **Type A vs Type B Decision Framing** — System must ask Chief upfront: "Is this reversible or irreversible?" Type B decisions demand higher evidence standards.
2. **Data Sufficiency as Objective Baseline** — Replace "78% confidence" with raw counts ("3 data points"). Chief decides if enough.
3. **3-Knob Weighting Mixer Persistence** — Chief's per-minister domain-specific knobs stay saved across sessions.
4. **Foundry MINE Gate** — When Chief hits "Conclude," MINE phase extracts the actual decision before synthesis runs.
5. **Human Advisor Complement** — Convergence surfaces stack so advisors add judgment, not compete for authority.
6. **Session Persistence** — Sidebar + persistent knob state gives Chief control over timing ("sleep on it").

**Status:** #72 is CLOSED (2026-04-13). All findings integrated into this FSD in the 'CRUCIBLE V3 FINDINGS — INTEGRATED' section below.

---


---

## Constitutional References (From Crucible Debates)

All design decisions anchor to 10 core debates articulated in the V3 Convergence NotebookLM notebook:

See **GitHub Issue #81** for the complete mapping of:
- Type A vs Type B risk framing
- Risk calibration authority (who decides?)
- Intelligence drift visualization
- Iteration vs sunk-cost bias
- Decision lock vs temporal continuity
- Automating dissent vs structural exposure
- Reflection vs executive velocity
- AI as baseline, not replacement
- Accountability & AI limits
- Decision fatigue & satisficing

Each of these 10 themes has a debate audio, a key decision, and an implementation pattern.

---

## Supporting Issues (This Session - 2026-04-09)

| # | Title | Purpose |
|---|-------|---------|
| 73 | Design Principle 1: Chief's Hidden Context | Objection handling + compensation mechanism |
| 74 | Audio Debate Generation (Phase 2+) | Ministers argue positions, Chief listens async |
| 75 | Latency Reframe | Kill <30s obsession, honest timing (3-5 min) |
| 76 | NotebookLM Research | What can we learn/reuse from NotebookLM? |
| 77 | UX Copy Specs (Play-Doh) | Living document, rewritten from debate analysis |
| 78 | Design Principle 2: Decision Liability | You carry risk, you decide, friction is intentional |
| 79 | Crucible Debate Audios | 10 audio artifacts (8/10 downloaded, 294 MB) |
| 80 | Session Summary | Recap of work completed |
| 81 | Constitutional Reference (10 Debates) | Debate themes → design decisions mapping |
| 82 | Model Selection: Claude Opus 4.6 | Update from GPT-4/3.5 references |

---

---

## SESSION 2 FINDINGS — TRANSCRIPT ANALYSIS (2026-04-09)

**Source:** 8 Crucible audio debates transcribed via local Whisper (22,000 words of spoken debate content)

### Architectural Decisions from Transcripts

**1. Weighting Mixer UX — RESOLVED (2026-04-13)**
~~Zero-sum math was flagged as a problem in #85.~~ After design review, zero-sum IS architecturally correct. Resolved as dual-level zero-sum (see below, Section D of Crucible V3 Integrated findings, and #71). Independent knobs are NOT the answer — they remove the transparency primitive. The AI suggests starting weights at both layers; the Chief only adjusts where hidden context differs.
See: Issue #71 (Dual-Level Architecture, canonical spec)

**2. Signal Hardness Visual Coding**
Three-tier minister framework: Hard Intelligence (Data + Markets) = sharp/tabular; Ambient Intelligence (Narrative + News) = soft/rounded; Internal Intelligence (Knowledge) = distinct accent. A 100% sufficiency score for a podcast rumor is still a rumor — design must communicate this.
See: Issue #86

**3. Flash Tension Banner**
Dynamic high-visibility banner during multi-turn briefing when cross-minister divergence detected. Acts as navigation pointer not synthesis: "Markets and Knowledge are diverging on launch timeline." Prevents executives from bypassing the multi-turn journey to hit Conclude immediately.
See: Issue #87

**4. Fast-Track Conclude — Inverted Funnel**
Alternative mode: synthesis-first, minister detail on demand. Prompt → Synthesis Draft → Minister cards as audit trail (collapsed by default). Aligns with how executives consume consulting decks: executive summary first, methodology on demand.
See: Issue #88

**5. Fresh Eyes Reset**
"New Convergence" button clears context window + resets sliders to neutral (keeps live minister data). Prevents accumulated session context from creating sycophancy drift. Digital equivalent of bringing in a fresh advisor who was not in the room.
See: Issue #89

**6. WEP Language System**
Replace percentage-based sufficiency scores with Words of Estimative Probability (IC standard): HIGHLY LIKELY, LIKELY, ROUGHLY EVEN, THIN, SILENT. Two systems: raw counts per minister (mechanical fact) + WEP language in Crucible synthesis (qualitative estimate).
See: Issue #90

**7. Data Minister — OSINT Intelligence Framework**
SEC Form 4 P-code (own cash purchase) = STRONG signal. S-code (sale) = WEAK signal alone. RISIP codes = 2-char political strategy cipher. PAC 24A expenditures = corporate identifies candidate as existential regulatory threat. Cross-domain example: Form 4P + 24E spike targeting Armed Services Committee = confluence alert.
See: Issue #84

### Full Supporting Issues Index (Sessions 1+2)

~~Issue #72 — Crucible V3 Findings~~ CLOSED (all findings integrated into FSD above)
Issue #73 — Design Principle 1: Chief Hidden Context
Issue #74 — Audio Debate Generation (Phase 2+)
Issue #75 — Latency Reframe
Issue #76 — NotebookLM Research
Issue #77 — UX Copy Specs
Issue #78 — Design Principle 2: Decision Liability
Issue #79 — Crucible Debate Audios
Issue #80 — Session 1 Summary
Issue #81 — Constitutional Reference (10 Debates)
Issue #82 — Model Selection: Claude Opus 4.6
Issue #83 — Session 2 Summary
Issue #84 — OSINT Framework + Data Minister Signals
~~Issue #85 — Zero-Sum Slider Problem~~ CLOSED (resolved: dual-level zero-sum confirmed, see #71)
Issue #86 — Signal Hardness Visual Coding
Issue #87 — Flash Tension Banner
Issue #88 — Fast-Track Conclude / Inverted Funnel
Issue #89 — Fresh Eyes Reset
Issue #90 — WEP Language System

---

## CRUCIBLE V3 FINDINGS — INTEGRATED (2026-04-09, locked 2026-04-13)

These findings were produced by the V3 Crucible debate and are now canonical architecture decisions. They were previously in #72 (now closed as integrated here).

### A. Type A vs Type B Decision Framing

**MINE phase must classify every decision before synthesis runs.**

When Chief hits "Conclude Briefing," MINE phase extracts the actual decision from conversation history, then classifies:

- **Type A (Reversible / 2-way door):** Lower evidence standard. Faster synthesis acceptable. Chief can make a call and correct later.
- **Type B (Irreversible / 1-way door):** Higher evidence standard. Type B forces skepticism — if two ministers have insufficient data, the Foundry gate flags this explicitly before proceeding.

MINE phase output: "You are deciding: [decision statement]. This is Type [A/B] because [reversibility rationale]. Evidence standard applied: [high/moderate]."

The Bezos reference: Type A decisions can be made fast and reversed. Type B require deliberation. Convergence makes this explicit instead of leaving it implicit.

### B. Data Sufficiency = Raw Counts, Not Algorithmic Grades

Data Sufficiency Meter shows literal counts: "3 SEC filings | 2 Polymarket contracts | 0 news articles."

The Chief decides if the count is enough. The system does not grade sufficiency with a percentage. This prevents uncertainty absorption — a clean number absorbs the messiness of the underlying collection process and becomes misread as confidence.

Two separate objective metrics:
- **Sufficiency Meter:** raw count of items retrieved (mechanical, no AI judgment)
- **Signal Momentum:** GDELT/Polymarket trajectory charts (directional, not probabilistic)

### C. MINE Phase as Formal Decision Extractor

The MINE phase is not just "start the synthesis." It explicitly extracts and frames the decision before ministers re-synthesize for the final brief.

When "Conclude Briefing" is clicked:
1. MINE extracts the decision from conversation history
2. MINE classifies Type A or Type B
3. MINE sets evidence standard
4. Then: full 5-minister synthesis runs with that framing as context anchor

This closes the "implicit decision" gap — where chiefs ask about a topic but the synthesis runs on the topic, not on the decision the chief actually faces.

### D. 3-Knob Weighting: Dual-Level Zero-Sum (Architecture Locked 2026-04-13)

Two zero-sum layers, not one:

**Layer 1 — Minister Master Level** (across 5 ministers):
Chief dials relative trust in each minister. Zero-sum across 5. Pull Markets up → other 4 auto-compensate. This expresses: "I trust this minister more than the others for this decision."

**Layer 2 — Per-Minister Concern Level** (within each minister):
Each minister has 3 domain-specific knobs. AI auto-sets suggested weights based on decision context (e.g., 28% + 39% + 33%). Chief adjusts what they disagree with. Zero-sum within each minister.

**Key:** AI suggests weights at both levels. Chief only adjusts where their hidden context differs from the AI's read. No blank slate.

**All knob positions persist across sessions.** When Chief returns the next day, sliders are where they left them.

### E. Session Persistence (Chief Controls Timing)

"Sleep on it" is a legitimate decision strategy. The system does not expire sessions or force conclusions.

- Sessions Sidebar: full history with timestamps ("Yesterday 11 PM," "Last Monday")
- Chief's 3-knob positions persist across days and sessions
- Conclude Button is temporal gate — Chief runs the Foundry Synthesis Gate when they are ready, not on every question

### F. Human Advisor Complement (Boundaries)

Convergence surfaces the stack so human advisors ADD judgment, not compete for authority.

- System handles: data gathering, stack synthesis, provenance, contradiction mapping
- Humans add: political/operational context, relationship leverage, judgment beyond the data
- The Chief of Staff (see #94) is the bridge: an AI that reads the minister stack and synthesizes a meta-view, while explicitly saying "I could be wrong" and handing final judgment to the Chief

---

## Latency SLA (Ratified 2026-04-13)

Latency is per-minister, not a single number. See #75 for full reframe.

| Target | SLA |
|--------|-----|
| Markets/News Ministers | <5s |
| Narrative Minister | <10s |
| Knowledge Minister | <15s |
| Data Minister (cached) | <5s |
| Data Minister (cold) | <30s |
| Full fan-out (all 5 ministers) | 3-5 min |
| Chief of Staff reactive (#94) | <30s |
| First-byte-to-value (UX metric) | <20s |

Progressive rendering: each minister card appears as it completes. The Chief waits for all.

=== ISSUE #55 ===
P1 STUB — FR-MECH-1: Turn-State Mechanics for Multi-Turn Briefing

## Stub — needs full spec

Multi-turn briefing (#45) is defined, but the turn-state mechanics are not. Open questions:

- When the Chief adds a document on turn 3, do ministers 1-2 **re-run** with the new context, or only minister 3 sees it?
- Do the Chief see **new cards** on turn 3, or do previous cards **update in place**?
- If a minister's data is stale (from turn 1), does it **re-fetch** on turn 3, or keep original findings?
- How long is a session? Does it persist across page reloads? How is it serialized?
- When the Chief changes a 3-knob weight mid-briefing, does the affected minister re-generate its position for prior turns or only going forward?
- What's the state diagram for a briefing session (active / paused / concluded / archived)?

## Dependencies
- #45 (iterative briefing) — this spec gives #45 its mechanics
- #52 (weighting) — weight changes interact with turn state
- #53 (current position) — position updates depend on turn state
- #51 (Foundry gate) — synthesis consumes the final turn state

## Deliverables (for full spec)
- [ ] State diagram (entities: Session, Turn, Minister Position, Weight Config)
- [ ] Persistence model (DB schema for turn state)
- [ ] Re-run vs. incremental rules per event type
- [ ] Serialization format for session resume

Master: #31 | Index: #49

=== ISSUE #56 ===
P1 STUB — FR-EDGE-1: Edge Cases & Failure Modes

## Stub — needs full spec

Failure modes not yet addressed by any issue. Convergence must handle these gracefully without silent failures.

## Known Edge Cases

1. **All 5 ministers lack data.** The Chief's question is outside the bench's coverage entirely. Does Convergence return empty? Explain why? Suggest what to do?

2. **Two ministers substantively contradict.** Markets says up, News says down. Is this surfaced as a feature (tension map) or a bug (one must be wrong)? How is it rendered on the cards?

3. **Vague Chief queries.** Chief types 'what should I do?' with no context. Does Convergence refuse, ask a clarifying question, or fan out anyway?

4. **Minister error / timeout mid-briefing.** Data Minister's API times out on turn 3. Does the card show an error state, drop out, retry, or fall back to fixture?

5. **Stale data on turn 3.** Markets Minister's Polymarket signal was fetched on turn 1, is now 10 minutes old. Re-fetch automatically? Flag as stale? Ignore?

6. **Conflicting injected documents.** Chief injects Doc A on turn 2, contradictory Doc B on turn 3. Which does Knowledge Minister weight?

7. **Weight knob lock conflicts.** Chief locks knob A at 80%, then tries to pull knob B up from 10% — impossible without violating A. How does the UI respond?

8. **Foundry gate run on thin data.** Chief hits 'Conclude' after turn 1, before any minister has real data. Does synthesis run or refuse?

9. **Session recovery after crash.** Chief's browser crashes mid-briefing. On reconnect, can they resume? From what turn?

10. **Abusive query patterns.** Chief hammers 'Conclude' repeatedly or re-runs the same query. Rate limiting?

## Deliverables (for full spec)
- [ ] Decision for each edge case above
- [ ] Error state designs (UI copy + behavior)
- [ ] Fallback matrix (minister failure → what Chief sees)
- [ ] Non-silent failure rule (every failure explains itself to the Chief)

Master: #31 | Index: #49

=== ISSUE #57 ===
P1 STUB — FR-INTEG-1: War Room Stealth Integration Specifics

## Stub — needs full spec

Convergence is a **stealth build** implemented in a worktree of alpha-war-room on separate infrastructure. The integration specifics are not documented anywhere.

## Open Questions

1. **Worktree strategy.** How does the Convergence worktree consume War Room's existing `unifiedDataIntegrationService` without touching the main repo? Shared git submodule? Copy of the service? Symlinked packages?

2. **Per-tenant data flow.** How do per-tenant Mentionlytics/SWOT feeds reach the stealth Convergence instance? Does Convergence query War Room's DB directly, or consume via API?

3. **Auth.** Same tenant JWT as main War Room? Separate auth domain? How does the Chief log in to the stealth Convergence page?

4. **Deployment.** Separate Render/Railway instance on stealth URL? Separate subdomain? How is it deployed without appearing in War Room's ops dashboards?

5. **Observability.** How do we monitor Convergence without polluting War Room's Sentry/logs? Separate project?

6. **Demo hygiene.** When demoing to Think Big, how do we ensure no Convergence UI leaks into the main War Room surface until we're ready to reveal?

7. **Reveal strategy.** When Convergence is ready to leave stealth, what's the merge path? Does it fold into main War Room, stay separate, become its own product?

## Constraints
- Stealth: no references in main alpha-war-room repo
- Stays in thinking-foundry methodology layer until ready to reveal
- Cannot touch Think Big's production infra

## Deliverables (for full spec)
- [ ] Architecture diagram: Convergence worktree + shared services
- [ ] Auth flow
- [ ] Deployment runbook
- [ ] Observability plan
- [ ] Reveal strategy (Phase 3+)

Master: #31 | Index: #49

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

=== ISSUE #61 ===
INFRA-1: Session Persistence Infrastructure — Supabase schema + API for multi-session support

# INFRA-1: Session Persistence Infrastructure — Supabase schema + API for multi-session support

**Status:** BLOCKED BY (none — but blocks #45, #47, #55)
**Tier:** P1 — Architectural foundation for the entire UI
**See also:** #47 (three-column layout assumes this exists), #45 (turn mechanics), #51 (Foundry gate)

---

## Context

The Convergence three-column layout (#47) features a persistent **left sidebar with past Convergence sessions**. The Chief can:
- Start a new Convergence
- Run it across multiple turns
- Come back to it a week later
- Pick up where they left off or review the history
- Switch between active sessions without losing state

This requires **Supabase session persistence**. All session data, turn history, weighting knob positions, and metrics must be stored, queryable, and restorable.

---

## Data Model

### Table: `convergence_sessions`

```sql
CREATE TABLE convergence_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  chief_id UUID NOT NULL,
  question TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, paused, concluded
  
  -- Weighting state (the 3-knob positions for each minister, persisted per session)
  weighting_state JSONB DEFAULT '{
    "knowledge": {"knob_1": 33, "knob_2": 33, "knob_3": 34},
    "markets": {"knob_1": 33, "knob_2": 33, "knob_3": 34},
    "news": {"knob_1": 33, "knob_2": 33, "knob_3": 34},
    "narrative": {"knob_1": 33, "knob_2": 33, "knob_3": 34},
    "data": {"knob_1": 33, "knob_2": 33, "knob_3": 34}
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  concluded_at TIMESTAMPTZ,
  
  INDEX (tenant_id, chief_id, created_at DESC),
  INDEX (status)
);
```

### Table: `convergence_turns`

```sql
CREATE TABLE convergence_turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES convergence_sessions(id) ON DELETE CASCADE,
  turn_num INT NOT NULL,
  
  -- Chief's input for this turn
  chief_input TEXT NOT NULL, -- the question/prompt/follow-up
  
  -- Minister responses (JSON array, 5 items in order: knowledge, markets, news, narrative, data)
  minister_responses JSONB NOT NULL,
  -- Format:
  -- [
  --   {
  --     "minister": "knowledge",
  --     "current_position": "Delay launch to Q1...",
  --     "evidence": ["doc1", "SWOT W2", "report"],
  --     "sufficiency": 78,
  --     "momentum": 2,
  --     "credibility": "high"
  --   },
  --   ... (4 more for markets, news, narrative, data)
  -- ]
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE (session_id, turn_num),
  INDEX (session_id, turn_num)
);
```

### Table: `convergence_documents`

```sql
CREATE TABLE convergence_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES convergence_sessions(id) ON DELETE CASCADE,
  document_type TEXT, -- pdf, transcript, text_paste, url
  document_name TEXT,
  document_url TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX (session_id)
);
```

---

## API Surface (Endpoints or Functions)

### Create Session
```
POST /api/convergence/sessions
{
  "question": "Should we launch the new product line before end of Q4?",
  "documents": [...]  // optional
}
→ { session_id, created_at }
```

### List Sessions (for sidebar)
```
GET /api/convergence/sessions?tenant_id=X
→ [
    {
      "id": "...",
      "question": "Should we launch...",
      "turn_count": 3,
      "status": "active",
      "last_updated": "14 min ago",
      "latest_alignment": "3 for delay, 2 neutral"
    },
    ...
  ]
```

### Get Session (full history)
```
GET /api/convergence/sessions/{session_id}
→ {
    "id": "...",
    "question": "...",
    "status": "active",
    "weighting_state": { ... },
    "turns": [
      {
        "turn_num": 1,
        "chief_input": "...",
        "minister_responses": [ ... ],
        "created_at": "..."
      },
      ...
    ],
    "documents": [ ... ]
  }
```

### Add Turn
```
POST /api/convergence/sessions/{session_id}/turns
{
  "chief_input": "We got the capacity report. Re-run.",
  "minister_responses": [ ... ]  // computed by backend (Gemini + minister logic)
}
→ { turn_num: 3, created_at }
```

### Update Weighting
```
POST /api/convergence/sessions/{session_id}/weighting
{
  "minister": "knowledge",
  "knob_1": 20,
  "knob_2": 40,
  "knob_3": 40
}
→ { updated_at, weighting_state }
```

### Conclude Session
```
POST /api/convergence/sessions/{session_id}/conclude
{
  "foundry_result": { ... }  // from #51 Foundry Synthesis Gate
}
→ { concluded_at, status: "concluded" }
```

---

## Real-Time Considerations (Future)

For now (POC): polling is fine. The Chief opens a session, reads the turns, modifies weighting, runs a new turn. No live collab.

Future (if multi-user cabinet on same session): Supabase real-time subscriptions on the session + turn tables. Each user sees updates as other users add turns or adjust weighting.

---

## Acceptance Criteria

- [ ] `convergence_sessions` table created with weighting_state JSONB
- [ ] `convergence_turns` table created with minister_responses JSONB
- [ ] `convergence_documents` table created for uploaded files
- [ ] List Sessions endpoint returns recent sessions for the sidebar
- [ ] Get Session endpoint returns full turn history + current weighting
- [ ] Add Turn endpoint inserts a new turn and increments turn_num
- [ ] Update Weighting endpoint modifies weighting_state JSONB
- [ ] Conclude Session endpoint marks session as concluded and stores Foundry result
- [ ] All queries include tenant_id filtering (multi-tenant safety)
- [ ] Indexes created for common queries (list sessions, get session history)

---

## Timeline Dependency

This issue is **P1 blocker** for:
- **#55 (Turn-State Mechanics)** — needs the Add Turn endpoint
- **#45 (Multi-Turn Briefing)** — needs session switching in col 1
- **#47 (Three-Column Layout)** — needs session list rendering

All three can proceed in parallel with schema design, but can't launch without this data model.

---

## Questions for Implementation

1. Should `weighting_state` be per-session (one state, evolves as Chief adjusts knobs) or per-turn (a snapshot of the weighting as of that turn)? **Answer: Per-session.** The weighting knobs persist across turns until the Chief explicitly adjusts them. But we probably want to snapshot the weighting in each turn record too, for historical accuracy ("what was the weighting when this turn was calculated?").

2. Should `minister_responses` be fully JSON (entire response object) or just the text + a reference to a separate metrics table? **Answer: Full JSON.** It's simpler, faster to query, and the data is not huge. Each turn is ~1KB of JSON.

3. Do we need to store the documents themselves in Supabase, or just metadata + links? **Answer: Just metadata for MVP.** Documents can stay in Drive / uploaded storage. We store the URL/path in convergence_documents.

4. When the Chief adjusts weighting knobs, do we log that change somewhere, or just update the current state? **Answer: Just update current state for MVP.** Logging every knob tweak is nice-to-have but not required. The weighting state is the latest position.

---

## Out of Scope (Phase 2+)

- Real-time collaboration (multiple Chiefs on same session)
- Document version history (docs are uploaded once, used as-is)
- Audit logging (who changed what, when — nice-to-have)
- Export/sharing (download session as PDF or markdown)

=== ISSUE #75 ===
Latency & Timing Reframe — Kill the <30s Obsession

# Latency & Timing Reframe — Honest SLA (Confirmed 2026-04-13)

**Decision:** Kill the <30s reactive latency SLA. Replace with honest 3-5 minute timing.

---

## The Old Claim
The original FSD specified a P99 SLA of <30 seconds for reactive mode. This was technically aspirational and commercially misleading.

## Why It Was Wrong

> 'In those 30 seconds, the system has to hit Polymarket, Kalshi, the FEC, wait for the slowest government server to respond, feed thousands of tokens into an LLM, run conflict mapping, and stream it back.'

Even with aggressive asynchronous caching, regulations.gov and FEC databases alone would kill that SLA on a normal afternoon. The <30s claim would require:
- Sacrificing data freshness (stale cache everywhere)
- Excluding slow-but-important sources
- Making the anti-oracle a fast-oracle (same failure mode, different speed)

## The New Position: 3-5 Minutes Is the Feature

Not 30 seconds. Not instant. 3-5 minutes. And that is stated upfront, honestly, in the UI.

> "Come back in a few minutes. Your ministers are reading."

Precedent: NotebookLM audio generation (5-10 min), Gemini Deep Research (minutes), Perplexity Pro search (30-60s for depth). Users accept async for depth. They expect instant for shallow. Convergence is deep.

**The chief of staff in the White House does not get a 30-second briefing.** The briefing takes as long as the briefing takes.

## Confirmed SLA Targets (2026-04-13)

| Mode | SLA | Notes |
|------|-----|-------|
| **Reactive (full fan-out)** | 3-5 minutes | All 5 ministers, all sources, full Foundry gate |
| **Partial (cached ministers)** | <60 seconds | When minister data is fresh from prior turn |
| **Chief of Staff synthesis** | <30 seconds | Reads existing minister output only, no new fetches |
| **Audio Debate (Phase 2)** | 5-10 minutes | NotebookLM-style generation, async |

## UX Copy (from #77)
Loading state: "Gathering intelligence. Take a break. Back in 3-5 minutes."
Async update: "Markets data in. Waiting on FEC. Back in 2 min."
Partial: "Got what we could. Some sources timed out. Here is the stack anyway."

## Related
- FSD: #31
- UX Copy: #77
- Chief of Staff concept: #94 (~~#92 was misref — closed as POC-era housekeeping~~)

=== ISSUE #96 ===
MinisterService Implementation Blueprint (Convergence Build)

# Convergence — MinisterService Implementation Blueprint

**Status:** Architecture locked. Awaiting final pre-conditions before build.
**Worktree:** `feature/convergence` on alpha-war-room — **NOT YET CREATED** (will be created at build start)
**Deploy target:** Separate Railway instance (stealth — not Think Big's servers)
**Milestone:** B — Build (Phase 1 POC)

This issue is the authoritative build reference for the MinisterService layer. Read alongside #31 (FSD) and #49 (Master Index).

---

## Pre-Conditions (Gate Before Build Starts)

| # | Gate | Status | Blocks |
|---|------|--------|--------|
| 1 | POC Demo entity confirmed (active Polymarket/Kalshi contracts) | ⏳ Spike #95 | Markets minister |
| 2 | Polygon.io pricing tier verified | ⏳ Cost check | Markets minister |
| 3 | #88 (Fast-Track Conclude) vs #94 (Chief of Staff) — Phase 1 scope decision | ✅ Both ship Phase 1 (confirmed 2026-04-13) | Synthesis gate |

---

## What Is NOT Being Built Here

- **4 existing files require changes** (see Ratification Addendum comment):
  - `shared/schema.ts` — append 3 new tables
  - `server/services/newsApiService.ts` — add `searchByQuery()` method
  - `server/routes.ts` — register convergenceRoutes
  - `server/services/enhancedPerplexityChatService.ts` — add Convergence chat hook
- All other existing files remain untouched
- Hidden behind a feature flag — only visible on the stealth Railway instance

---

## Architecture: Three New Files

```
server/
├── routes/
│   └── convergenceRoutes.ts     ← HTTP endpoints for Convergence sessions
├── services/
│   ├── ministerService.ts       ← Minister orchestration + parallel fan-out
│   └── convergenceStorage.ts   ← DB read/write for the 3 new tables
shared/
└── schema.ts                    ← +3 new tables appended at end
```

---

## 1. Database Schema (append to `shared/schema.ts`)

### `convergence_sessions`
```typescript
export const convergenceSessions = pgTable("convergence_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id),
  decisionStatement: text("decision_statement").notNull(),
  decisionType: varchar("decision_type", { length: 10 }),       // 'A' | 'B' — set by MINE phase
  evidenceStandard: varchar("evidence_standard", { length: 20 }), // 'high' | 'moderate'
  status: varchar("status", { length: 20 }).notNull().default("active"),
  weightsSnapshot: jsonb("weights_snapshot"), // {ministers:{knowledge:0.2,...}, perMinister:{...}}
  createdAt: timestamp("created_at").defaultNow().notNull(),
  concludedAt: timestamp("concluded_at"),
}, (table) => [
  index("idx_convergence_sessions_company").on(table.companyId),
  index("idx_convergence_sessions_status").on(table.status),
]);
```

### `convergence_minister_responses`
```typescript
export const convergenceMinisterResponses = pgTable("convergence_minister_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => convergenceSessions.id, { onDelete: "cascade" }),
  minister: varchar("minister", { length: 20 }).notNull(), // knowledge|markets|news|narrative|data
  turnNumber: integer("turn_number").notNull().default(1),
  briefContent: text("brief_content").notNull(),
  wepAssessment: varchar("wep_assessment", { length: 20 }), // HIGHLY_LIKELY|LIKELY|ROUGHLY_EVEN|THIN|SILENT
  sourcesUsed: jsonb("sources_used"),   // [{name, type, count}]
  sourceCount: integer("source_count").notNull().default(0),
  fetchDurationMs: integer("fetch_duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_conv_minister_session").on(table.sessionId),
  index("idx_conv_minister_turn").on(table.sessionId, table.turnNumber),
]);
```

### `convergence_conclusions`
```typescript
export const convergenceConclusions = pgTable("convergence_conclusions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => convergenceSessions.id, { onDelete: "cascade" }).unique(),
  mineOutput: text("mine_output").notNull(),          // MINE phase decision extraction
  decisionType: varchar("decision_type", { length: 10 }).notNull(), // A | B
  synthesisNarrative: text("synthesis_narrative").notNull(), // Chief-facing decision brief
  tensionsIdentified: jsonb("tensions_identified"),   // [{ministerA, ministerB, description}]
  chiefOfStaffSummary: text("chief_of_staff_summary"), // #94 — meta-synthesis with caveats
  weightsAtConclusion: jsonb("weights_at_conclusion"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_convergence_conclusions_session").on(table.sessionId),
]);
```

---

## 2. MinisterService (`server/services/ministerService.ts`)

### Minister Registry

```typescript
export const MINISTERS = ['knowledge', 'markets', 'news', 'narrative', 'data'] as const;
export type MinisterName = typeof MINISTERS[number];

// Signal hardness determines WEP ceiling (#90)
const MINISTER_HARDNESS: Record<MinisterName, 'hard' | 'ambient' | 'internal'> = {
  knowledge: 'internal',
  markets: 'hard',
  news: 'ambient',
  narrative: 'ambient',
  data: 'hard',
};
```

### Parallel Fan-Out (core architecture)

```typescript
async function runMinisterFanOut(ctx: MinisterContext): Promise<MinisterResult[]> {
  const results = await Promise.allSettled([
    runKnowledgeMinister(ctx),   // wraps geminiFileSearchService (NOT knowledgeBaseService — that's ingestion-only)
    runMarketsMinister(ctx),     // NEW — Polymarket + Kalshi + Polygon.io
    runNewsMinister(ctx),        // wraps newsApiService.ts (exists) + GDELT
    runNarrativeMinister(ctx),   // wraps mentionlyticsApiService (exists)
    runDataMinister(ctx),        // NEW — FEC + SEC EDGAR + FRED + openFDA
  ]);

  // SILENT is not an error — no signal IS the answer
  return results.map((r, i) =>
    r.status === 'fulfilled' ? r.value : silentMinister(MINISTERS[i])
  );
}
```

### WEP Ceiling Enforcement

```typescript
// Ambient Intelligence caps at LIKELY — never HIGHLY_LIKELY (#90)
function capWEPByHardness(wep: WEPAssessment, minister: MinisterName): WEPAssessment {
  if (MINISTER_HARDNESS[minister] === 'ambient' && wep === 'HIGHLY_LIKELY') return 'LIKELY';
  return wep;
}
```

---

## 3. Convergence Routes (`server/routes/convergenceRoutes.ts`)

```
POST   /api/v1/convergence/initiate                      ← Start new briefing session
GET    /api/v1/convergence/session/:sessionId            ← Get session + minister responses
POST   /api/v1/convergence/session/:sessionId/turn       ← New question → new minister round
POST   /api/v1/convergence/session/:sessionId/conclude   ← Trigger MINE → synthesis gate
GET    /api/v1/convergence/session/:sessionId/conclusion ← Get final decision brief
GET    /api/v1/convergence/history                       ← Paginated session history
POST   /api/v1/convergence/session/:sessionId/chief-of-staff ← Chief of Staff meta-synthesis (#94)
```

Auth: Same JWT middleware as existing routes. `companyId` from JWT only — never from request body.

---

## 4. Socket.IO Events (zero changes to `websocket.ts`)

Uses existing `emitToCompany(companyId, event, payload)` helper:

```
convergence:minister-responding  → { minister, status: 'fetching' }
convergence:minister-ready       → { minister, brief, wep, sourceCount }
convergence:synthesis-running    → { sessionId }
convergence:concluded            → { sessionId, decisionBrief }
```

---

## 5. Chat Pipeline Hook

New step inserted in `enhancedPerplexityChatService.ts` (the actual routing god object — chatPipeline.ts is dead code):

```typescript
{
  name: 'convergence-eligible',
  guard: (ctx) => isConvergenceEligible(ctx.userMessage),
  handler: async (ctx) => ({
    handled: true,
    response: buildConvergenceConfirmCard(ctx.userMessage), // inline confirm button only
  })
}
// Decision-statement heuristics: "Should we...", "Is X a good idea", "What do you think about..."
```

Convergence is NOT auto-run on every message. Inline confirm only (gating decision from #31 FSD).

---

## 6. Build Sequence

| Step | Task | Blocks |
|------|------|--------|
| 1 | Append 3 tables to schema.ts → run Drizzle migration | Everything |
| 2 | `convergenceStorage.ts` — CRUD wrappers for 3 tables | Steps 3-5 |
| 3 | `ministerService.ts` — fan-out shell (all ministers return mock) | Step 4 |
| 4 | Wire Knowledge + News + Narrative (existing services) | Step 5 |
| 5 | `convergenceRoutes.ts` — POST /initiate + GET /session | Step 6 |
| 6 | Socket.IO events via emitToCompany() | Step 7 |
| 7 | Markets minister — Polymarket + Kalshi + Polygon.io (gate: #95) | Step 8 |
| 8 | Data minister — FEC + SEC EDGAR + FRED connectors | Step 9 |
| 9 | MINE phase — decision extraction + Type A/B classification | Step 10 |
| 10 | Synthesis gate — MINE → CRUCIBLE phases with weights applied | Step 11 |
| 11 | Chief of Staff endpoint (#94) | Step 12 |
| 12 | Frontend: Convergence page + Minister cards + Weighting Mixer | Ship |

---

## Codebase Integration Map (from audit — alpha-war-room#874)

| Existing File | Role in Convergence |
|---------------|---------------------|
| `shared/schema.ts` | Append 3 new tables at end |
| `server/services/geminiFileSearchService.ts` | Knowledge Minister (⚠️ NOT knowledgeBaseService — that's ingestion-only) |
| `server/services/newsApiService.ts` | News Minister (NewsAPI + GDELT) |
| `server/services/mentionlyticsApiService.ts` (inferred) | Narrative Minister (social) |
| `server/websocket.ts` | Use existing `emitToCompany()` — no changes |
| `server/services/enhancedPerplexityChatService.ts` | Add convergence-eligible step (⚠️ NOT chatPipeline.ts — that's dead code) |
| `server/services/aggregatedIntelligence.ts` | The God Component this replaces (NOT touched in Phase 1) |

---

## References

| Issue | What |
|-------|------|
| [#31](https://github.com/growthpigs/thinking-foundry/issues/31) | Master FSD |
| [#49](https://github.com/growthpigs/thinking-foundry/issues/49) | Master Index |
| [#71](https://github.com/growthpigs/thinking-foundry/issues/71) | Dual-Level Weighting Architecture |
| [#84](https://github.com/growthpigs/thinking-foundry/issues/84) | OSINT Framework — Data Minister signals |
| [#90](https://github.com/growthpigs/thinking-foundry/issues/90) | WEP Language System |
| [#94](https://github.com/growthpigs/thinking-foundry/issues/94) | Chief of Staff |
| [#95](https://github.com/growthpigs/thinking-foundry/issues/95) | POC Demo Entity spike |
| alpha-war-room#874 | War Room codebase audit findings |

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

=== ISSUE #51 ===
FR-ARCH-4: Foundry Synthesis Gate — Chief-triggered final brief via adapted Foundry pipeline

## Summary

When the Chief has heard enough from the 5 ministers and is ready to decide, they hit **'Conclude Briefing'**. This triggers a **Foundry synthesis pass** — an adapted version of The Thinking Foundry's phase pipeline, run over the weighted minister positions, that produces a chief-facing synthesis brief.

This is the keystone architectural piece for Convergence. It is what makes the synthesis step defensible and product-category-creating, not just another multi-source summarizer.

## Why This Matters (Strategic)

Everyone else in AI is racing to be the oracle — collapse the stack, give the answer. Convergence inverts this by keeping the stack visible through the briefing, then closing with a chief-centric synthesis that *surfaces the decision* rather than *making it*.

The Thinking Foundry is Roderic's proven synthesis method. It has already been through Crucible, Audit, and live voice sessions. It is battle-tested IP.

**Competitors can build multi-source cards. They cannot reproduce the Foundry synthesis step without the Foundry itself.** This is the moat.

## Conceptual Model

The existing Thinking Foundry runs 8 phases for self-directed thinking:
`PHASE 0 User Stories → MINE → SCOUT → ASSAY → CRUCIBLE → AUDITOR → PLAN → VERIFY`

Convergence uses an **adapted** version — a Foundry-for-Convergence pass that operates on the 5 ministers' accumulated positions, not on the user's raw question.

### The Adapted Pipeline

| Phase | Input | Operation | Output |
|---|---|---|---|
| **MINE** | Chief's question + turn history | Extract the actual decision the Chief is making (often different from the literal question) | Decision statement |
| **SCOUT** | All 5 ministers' positions across all turns | Enumerate every distinct option surfaced by any minister | Option list |
| **ASSAY** | Options + tenant constraints (budget, timeline, risk tolerance from Knowledge Minister) | Filter options to what's viable for THIS chief | Viable options |
| **CRUCIBLE** | Viable options + minister positions | Find the contradictions. Where do Markets disagree with News? Where does Narrative contradict Data? | Tension map |
| **AUDITOR** | Tension map + per-minister data sufficiency | Confidence check. Which tensions are real vs. data quality artifacts? Is any minister too thin to rely on? | Audited tensions |
| **PLAN** | Audited tensions + chief's 3-knob weightings | Produce the chief brief: 'here's what Markets would have you do, here's what Knowledge would have you do, here's where they collide, here's what you must choose' | Final chief brief |

**Note:** VERIFY phase (GitHub/Drive export) is optional for Convergence — fires only if the chief explicitly requests a record of the briefing.

## Critical Distinction from Oracle Mode

The PLAN phase output must NOT say 'you should do X.' It must say:

> 'Markets are telling you X. Knowledge is telling you Y. They contradict on Z. You weighted Narrative down to 15% because you know the budget issue is resolving. Given those weights, X and Y are roughly balanced — the decision hinges on which risk you're more willing to carry: [risk of X] or [risk of Y]. You are the chief. This is what the stack looks like. Decide.'

The Foundry gate *surfaces* the decision. The chief *makes* it.

## Weighting Integration

The 3-knob mixer weightings per minister (see weighting issue) are an input to the PLAN phase. They affect how the final brief is structured:

- High-weighted ministers get more prominent positioning in the brief
- Low-weighted minister positions are noted but not emphasized
- Contradictions between high-weighted ministers are the main tension surfaced
- Contradictions between a high and a low weighted minister are dismissed (chief has already decided the low one doesn't matter for this decision)

## Turn Mechanics

Foundry gate runs **only on explicit Chief request** (button click), not automatically.

- Runs once per briefing session unless Chief re-opens
- Can be re-run if Chief adjusts weights or adds new info — produces updated brief
- Each run creates a versioned brief the Chief can compare

## Cost & Latency

The Foundry synthesis is expensive — 6 Claude passes over accumulated context. This is acceptable because:

- It runs only on explicit user action
- The Chief expects this step to take longer than individual minister briefings
- Latency target: <60 seconds (vs. <30s for reactive fan-out)
- Budget per synthesis: roughly equivalent to 1 full reactive mode fan-out

Consider using Claude Opus for this step even if ministers use Haiku — the synthesis quality is what sells the product.

## What This Kills / Replaces

- Kills the need for a 'final answer' card — the Foundry brief IS the answer format
- Replaces the ambiguous 'how do ministers combine?' question with a concrete protocol
- Removes pressure on individual minister cards to be conclusive — they can stay in their lane

## Open Questions

1. Does the Foundry gate live on the Convergence page, or does it take over the full screen when triggered?
2. Should the Chief see each phase run (progress indicator showing MINE → SCOUT → ASSAY → ...)?
3. How does the Chief export a briefing? (GitHub issue? PDF? Just in-app history?)
4. Is there a 'second opinion' flow — run the Foundry gate twice with different weightings to compare?
5. Does the Foundry gate get its own Crucible pass before we ship? (Probably yes — it's the most novel piece.)

## Related

- Master: #31 (Opus 30k ft comment)
- Index: #49
- Architecture: #45, #47
- Weighting: [weighting issue]
- Cabinet research: #43
- Foundry research: #48 — this is the answer to what #48 was asking

=== ISSUE #82 ===
Model Selection: Claude Opus 4.6 (Not GPT-4/3.5)

# Model Selection: Claude Opus 4.6 (Not GPT-4/3.5)

**Status:** Critical update  
**Created:** 2026-04-09  
**Note:** Crucible debates reference GPT-4/3.5. All references must be updated to Claude Opus 4.6.

## The Update

All FSD and design discussions should reference:
- **Primary model:** Claude Opus 4.6 (synthesis, reasoning, final briefing)
- **Previous references to "GPT-4" or "3.5":** Delete and replace with Opus 4.6

## Why This Matters

- Claude Opus 4.6 is significantly more capable than GPT-4/3.5
- Affects token budgets, latency estimates, reasoning quality
- Changes what's possible in the Foundry synthesis gate
- May allow features we thought impossible with older models

## Implementation

1. Update FSD #31 — replace all model references
2. Update all technical specs referencing model capabilities
3. Reconsider any "not possible" decisions based on old model limits

## Files to Update

- FSD #31 (main spec)
- All technical design docs
- UX specs that reference AI capabilities

