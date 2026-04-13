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
