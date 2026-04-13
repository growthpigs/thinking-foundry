# Proof Report — Convergence Buyer Persona Pressure Test

**Phase:** 3b (ASSAY Gap-Fill)
**Date:** 2026-04-13
**Methodology:** Structured workday walkthrough per Foundry ASSAY Phase 3, Step 4

---

## Primary Persona: The Chief (War Room Power User)

**Profile:** Political campaign manager or corporate comms director. Uses War Room daily for SWOT monitoring and intelligence hub. Time-pressed. Makes 5-15 decisions per week that benefit from cross-domain intelligence. Not technical. Wants answers, not dashboards. Skeptical of AI — burned by hallucinated "insights" from other tools.

**Key behavioral traits:**
- Opens War Room first thing in morning (8:00 AM)
- Checks Intelligence Hub for overnight alerts
- Reviews SWOT at least once daily
- Asks 2-3 ad-hoc "is this a good idea?" questions per week
- Makes decisions under time pressure (30-min windows between meetings)
- Shares decision briefs with team (needs exportable artifacts)

---

## Workday Walkthrough: Tuesday, 9:00 AM — 5:00 PM

### 9:00 AM — Morning Check-In (Proactive Convergence)

**Action:** Chief opens War Room. Navigates to Convergence page (4th item in top nav).

| Step | Action | US Ref | FSD Ref | CRUD | Status |
|------|--------|--------|---------|------|--------|
| 1 | Open Convergence page | — | #42 (standalone page) | READ sessions history | ✅ Specified |
| 2 | See 0 active sessions, history of past sessions | — | #47 (three-column layout) | READ session list | ✅ Specified |
| 3 | Check if any overnight proactive alerts exist | — | — | — | ❌ **NOT SPECIFIED** |

**GAP FOUND:** There is no proactive notification system for Convergence. The existing War Room has SWOT toast notifications, but Convergence has no equivalent "overnight, something interesting happened" alert. The FSD mentions a `ConvergenceNotificationToast.tsx` but no background scanning/cron that would trigger it.

**Severity:** P1 — Without proactive alerts, the Chief must manually check Convergence. This reduces stickiness. However, for V1 POC this is acceptable — proactive scanning is a Phase 2 feature.

---

### 9:15 AM — Ad-Hoc Decision Question (Reactive Convergence)

**Action:** Chief has a meeting at 10:00 AM about whether to allocate $50K to digital ads in North Carolina. Needs cross-domain intelligence fast.

| Step | Action | US Ref | FSD Ref | CRUD | Status |
|------|--------|--------|---------|------|--------|
| 4 | Click "New Briefing" button | — | #96 routes: POST /initiate | CREATE session | ✅ Specified |
| 5 | Type decision statement: "Should we allocate $50K to digital ads in NC Senate race?" | — | #31 FSD | — | ✅ Specified |
| 6 | System classifies as decision-statement | — | #96 chat hook | — | ✅ Specified |
| 7 | See "Starting briefing..." loading state | — | — | — | ⚠️ **AMBIGUOUS** — no loading state spec |
| 8 | Ministers begin appearing progressively | — | #96 fan-out, Socket.IO events | READ via WebSocket | ✅ Specified |
| 9 | Markets Minister appears first (<5s): Polymarket odds, Kalshi contracts | — | #62, #99, #100 | CREATE minister_response | ✅ Specified |
| 10 | News Minister appears (~5s): Recent NC Senate coverage | — | newsApiService | CREATE minister_response | ✅ Specified |
| 11 | Knowledge Minister appears (~15s): Internal docs on NC strategy | — | geminiFileSearchService | CREATE minister_response | ✅ Specified |
| 12 | Narrative Minister appears (~10s): Social sentiment on NC race | — | — | CREATE minister_response | 🔴 **BLOCKED** — Mentionlytics has no public API |
| 13 | Data Minister appears (~5s cached): FEC contributions, polling data | — | #97 (deterministic), #84 | CREATE minister_response | ✅ Specified |
| 14 | All 5 cards visible. Chief scans headlines. | — | #53 (current position top-line) | — | ✅ Specified |
| 15 | Flash Tension Banner appears: "Markets and Narrative disagree on NC trajectory" | — | #87 (Flash Tension Banner) | — | ✅ Specified |

**TIME CHECK:** ~20 seconds for first card, ~30 seconds for all 5. Chief has 45 minutes before meeting. ✅ Acceptable.

---

### 9:16 AM — Drilling Down

| Step | Action | US Ref | FSD Ref | CRUD | Status |
|------|--------|--------|---------|------|--------|
| 16 | Chief clicks on Markets Minister card to expand | — | #44 (source summary layer) | — | ✅ Specified |
| 17 | See 1-3 bullet summary + collapsible full provenance | — | #44 | — | ✅ Specified |
| 18 | See WEP label: "LIKELY — based on 3 sources" | — | #90 (WEP), #58 (data sufficiency) | — | ✅ Specified |
| 19 | See signal hardness visual: hard intelligence (sharp/tabular) | — | #86 (signal hardness) | — | ✅ Specified |
| 20 | See data age: "Polymarket odds as of 9:14 AM, Kalshi as of 9:12 AM" | — | #100 (temporal priors) | — | ✅ Specified |
| 21 | Chief clicks on Narrative card — sees "Single Signal" warning | — | Multi-source mandate | — | ⚠️ **AMBIGUOUS** — what happens when Mentionlytics is unavailable? Does Narrative Minister fall back to GDELT? |

**GAP FOUND:** Narrative Minister fallback chain when Mentionlytics is unavailable is not specified. If there's no fallback, Narrative always shows SILENT for non-WR-tenant use cases.

**Severity:** P0 for general availability, P2 for POC (POC can demo with WR tenant that HAS Mentionlytics).

---

### 9:20 AM — Adjusting Weights

| Step | Action | US Ref | FSD Ref | CRUD | Status |
|------|--------|--------|---------|------|--------|
| 22 | Chief adjusts Markets weight from 20% to 35% (trusts financial signals more) | — | #71 (dual-level weighting), #52 | UPDATE session weights | ✅ Specified |
| 23 | Other ministers auto-rebalance to sum to 100% | — | #71 (zero-sum) | — | ✅ Specified |
| 24 | Chief sees minister cards reorder/resize based on new weights | — | — | — | ⚠️ **AMBIGUOUS** — do cards physically resize? Reorder? Just change emphasis? |
| 25 | Chief adjusts per-minister sub-weights within Markets (e.g., Polymarket 60%, Kalshi 40%) | — | #71 (per-minister sub-weights) | — | ✅ Specified |

**GAP FOUND:** Visual feedback when weights change is not specified. Does the layout shift? Do cards reorder? Do they just change a border/size? This is a UX decision that needs to be made before build.

**Severity:** P2 — cosmetic, but matters for usability.

---

### 9:25 AM — Follow-Up Question (Multi-Turn)

| Step | Action | US Ref | FSD Ref | CRUD | Status |
|------|--------|--------|---------|------|--------|
| 26 | Chief types follow-up: "What about the FEC filings from last quarter?" | — | #55 (turn-state mechanics) | CREATE new turn | ✅ Specified |
| 27 | Only affected ministers re-brief (Data + Knowledge) | — | #55 (partial re-brief on >10% weight delta) | CREATE 2 new minister_responses | ✅ Specified |
| 28 | New responses appear alongside previous turn (not replacing) | — | #45 (multi-turn) | — | ✅ Specified |
| 29 | Chief sees turn history in sidebar | — | #47 (three-column layout) | — | ✅ Specified |

---

### 9:30 AM — Fast-Track Conclude (Time Pressure)

| Step | Action | US Ref | FSD Ref | CRUD | Status |
|------|--------|--------|---------|------|--------|
| 30 | Chief clicks "Conclude" (or Fast-Track Conclude) | — | #88 (fast-track), #51 (synthesis gate) | UPDATE session status → concluded | ✅ Specified |
| 31 | Synthesis Gate runs: MINE extracts decision, maps tensions | — | #51 | CREATE conclusion | ✅ Specified |
| 32 | Chief sees synthesis narrative with tensions highlighted | — | #51, #87 | READ conclusion | ✅ Specified |
| 33 | Chief optionally requests Chief of Staff meta-synthesis | — | #94 | UPDATE conclusion (chiefOfStaffSummary) | ✅ Specified |
| 34 | Chief sees: "Based on 5 ministers (3 turns), 12 sources consulted. 2 tensions identified. You decide." | — | Design Principle 2 | — | ✅ Specified |
| 35 | Chief exports brief (copy to clipboard? PDF? Share link?) | — | — | — | ❌ **NOT SPECIFIED** |

**GAP FOUND:** Export/sharing mechanism for concluded briefs is not specified. A campaign manager needs to share this with their team before the 10:00 AM meeting. Copy-to-clipboard? PDF? Share link? Email?

**Severity:** P1 — Without export, the product's value is trapped in the UI. This is critical for the "share with team" use case.

---

### 2:00 PM — Reviewing Past Briefings

| Step | Action | US Ref | FSD Ref | CRUD | Status |
|------|--------|--------|---------|------|--------|
| 36 | Chief opens Convergence page, clicks session from history sidebar | — | #47 | READ session list | ✅ Specified |
| 37 | Sees full session with all turns, weights, minister responses | — | #47 | READ session + responses | ✅ Specified |
| 38 | Sees conclusion if session was concluded | — | — | READ conclusion | ✅ Specified |
| 39 | Can Chief reopen a concluded session and add new turns? | — | — | — | ❌ **NOT SPECIFIED** |

**GAP FOUND:** Can concluded sessions be reopened? The state machine says `concluded → (terminal)`. But what if the Chief gets new information after the meeting and wants to add context to the same briefing? This needs a design decision.

**Severity:** P2 — For V1, "start a new session referencing the old one" is acceptable. Reopening is a P2 enhancement.

---

### 4:30 PM — Chat-Triggered Convergence

| Step | Action | US Ref | FSD Ref | CRUD | Status |
|------|--------|--------|---------|------|--------|
| 40 | Chief is in War Room Chat, types: "Should we respond to the opponent's new ad?" | — | #96 chat hook | — | ✅ Specified |
| 41 | Chat recognizes decision-statement, shows inline "Run Convergence Briefing?" button | — | #96 | — | ✅ Specified |
| 42 | Chief clicks button, redirected to Convergence page with pre-filled decision statement | — | — | — | ⚠️ **AMBIGUOUS** — redirect or inline? In-chat or new page? |

**GAP FOUND:** The transition from Chat to Convergence is ambiguous. Does clicking the button redirect to the Convergence page? Or does it show an inline mini-briefing in chat? The FSD says "inline confirm button" but doesn't specify what happens AFTER the confirm.

**Severity:** P1 — This is a core interaction pattern. Must be decided before build.

---

## Walkthrough Summary

### Coverage Score

| Category | Count |
|----------|-------|
| ✅ Specified | 28 steps |
| ⚠️ Ambiguous | 4 steps |
| ❌ NOT SPECIFIED | 4 steps |
| 🔴 BLOCKED | 1 step (Mentionlytics) |
| **Total steps** | **37** |

**Coverage: 75.7%** (28/37 specified). Below the 80% threshold for R3 gate.

### Gaps Found (Prioritized)

| # | Gap | Severity | Resolution Path |
|---|-----|----------|----------------|
| G-1 | **Export/sharing mechanism for concluded briefs** | P1 | Create new FR issue. Copy-to-clipboard + share link for V1. PDF for V2. |
| G-2 | **Chat → Convergence transition unclear** | P1 | Add to #57 (War Room Integration). Decision: redirect to Convergence page with pre-filled statement. |
| G-3 | **No proactive Convergence alerts** | P1 (V2) | Phase 2 feature. Document in #60 (Non-Goals) for V1. Background cron scans bench, triggers toast. |
| G-4 | **Narrative Minister fallback when Mentionlytics unavailable** | P0 (GA) / P2 (POC) | For POC: demo with WR tenant. For GA: GDELT + Reddit + Google Trends fallback chain. |
| G-5 | **Visual feedback on weight changes** | P2 | Add to #77 (UX Copy). Cards fade/highlight proportionally to weight. No reorder (spatial stability). |
| G-6 | **Loading/progress state during fan-out** | P2 | Add skeleton cards per minister with shimmer animation. Progressive fill. |
| G-7 | **Concluded session reopening** | P2 | V1: terminal state. V2: "Continue from this briefing" creates new session with context carry-forward. |

### Abstract Questions

**1. "How does the Chief experience this?"**
The Chief experiences a structured intelligence gathering process that respects their time. The 20-second first-card-to-screen feels fast. The progressive rendering feels like "advisors arriving one by one." The tension banner is genuinely useful — it surfaces the thing that matters most (where experts disagree). The conclude mechanism is satisfying — it produces a tangible artifact.

**2. "Does this feel like 'the AI that refuses to decide for you' or generic software?"**
It DOES feel differentiated at the minister-card level (each card has a distinct voice, signal hardness, WEP label). But the conclude experience needs work — the synthesis narrative is the moment of truth, and if it reads like a chatbot summary, the whole product feels generic. The Chief of Staff optional layer is the key differentiator but it's optional, so some users will never see it.

**3. "What would the Chief complain about?"**
- "I can't share this brief with my team" (G-1)
- "Where's the notification when something changes overnight?" (G-3)
- "I adjusted the weights but nothing visually changed" (G-5)
- "I asked a question in chat and it sent me to a different page" (G-2)
- "Can I pick up where I left off?" (G-7)

---

## R3 Readiness Assessment

| R3 Criterion | Status |
|-------------|--------|
| All 18 Admin Documents substantially complete | ❌ Only FSD + partial Admin docs |
| Independent Observer Score ≥ 8/10 on each FSD | ✅ FSD is strong (8/10) |
| Zero contradictions | ✅ Fixed in CTO Ratification |
| Assumption Table complete | ⏳ In progress (3 miners running) |
| Structured Persona Walkthrough → Proof Report | ✅ This document |
| CRUD Coverage Matrix in every FSD | ✅ crud-coverage-matrix.md |
| Correctness confidence ≥ 8/10 | ✅ 8/10 (would be 9 after gaps filled) |
| UX/Intent confidence ≥ 7/10 | ⚠️ 7/10 (export and chat-transition gaps lower it) |

**Verdict:** R3 is passable AFTER the 7 gaps are addressed as GitHub issues. The P1 gaps (export, chat transition) must be resolved before CRUCIBLE.
