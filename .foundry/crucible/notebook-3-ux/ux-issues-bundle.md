=== ISSUE #43 ===
RESEARCH-1: Cabinet Briefing Model — how do Presidents, CEOs, military leaders synthesize multi-source advice?

## Context

User insight: "If I was the President of the United States, I would still get briefings from multiple different ministers or generals, but they would all give their opinion on what to do. Ultimately the chief has to make the decision, but it doesn't have to take too long because they're taking into account what their ministers are advising in each data source."

**This is the mental model for Convergence's anti-oracle frame.**

The system doesn't predict. It channels advisor opinions and lets the chief decide.

---

## Research Questions

1. **Presidential Decision-Making**
   - How does a President synthesize conflicting briefings from State, Defense, Treasury, Intelligence?
   - What information architecture does the Situation Room use?
   - How is advice presented (oral? written? numbers? narrative?)
   - Do advisors give confidence levels, or just opinions?

2. **Corporate C-Suite**
   - How does a CEO synthesize conflicting input from CFO, CMO, COO, Board?
   - What's the format of Executive Briefing Books?
   - Does each advisor present "here's my opinion" or "here's the data I see"?
   - How is disagreement handled?

3. **Military Command**
   - How do military officers synthesize briefings from Intel, Operations, Logistics, Civil Affairs?
   - What's the SITREP (Situation Report) structure?
   - Do advisors present risks/confidence, or just recommendations?
   - How do commanders account for conflicting assessments?

4. **Investment/Analysis**
   - How do research analysts synthesize contradictory signals from multiple data sources?
   - How do institutional investors present multi-source risk to their boards?
   - What UI/format prevents collapse to "one number"?

---

## Deliverable

Write a **Decision Briefing Synthesis Pattern** document showing:

- How real leaders present multi-source advice WITHOUT a single confidence score
- What UI/language patterns prevent oracle-framing
- How advisors present disagreement (e.g., "3 advisors say X, 2 say Y")
- How the chief accounts for source expertise/track record without reducing it to a number
- Examples from: Presidential briefing, Corporate board memo, Military SITREP, Investment thesis

---

## Why This Matters

**Current problem:** We want to give executives advice, but Convergence's anti-oracle frame says "no 0-100 score."

**Solution:** Show them how existing leaders do this. They don't use confidence scores either. They synthesize advisors' opinions directly.

---

## Acceptance Criteria

- [ ] Research 3+ real briefing formats (Presidential, Corporate, Military, Investment)
- [ ] Document: how disagreement is shown (not as a single number)
- [ ] Document: how source expertise/track record is communicated
- [ ] Document: how the chief/executive actually makes the decision
- [ ] Design pattern: translate findings into Convergence UI

---

## Time Estimate

This is a research spike. Expect 2-4 hours of reading + synthesis.

Sources to check:
- Presidential Decision Making (academic)
- CIA/NSA briefing format documentation
- McKinsey Executive Briefing standards
- Goldman Sachs/Bridgewater investment thesis format
- Military doctrine (JFACC, SITREP structures)

Related: thinking-foundry#39 (anti-oracle weighting), thinking-foundry#31

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

=== ISSUE #52 ===
FR-UX-4: 3-Knob Weighting Mixer Per Minister — Chief-adjustable concern weights, sum to 100%

## ARCHITECTURE UPDATE (2026-04-13)

**This issue specifies the PER-MINISTER concern level (Layer 2) only.**

The full weighting architecture is dual-level zero-sum. See #71 for the complete spec:

- **Layer 1 — Minister Master Level:** Chief dials overall trust in each of the 5 ministers relative to each other. Zero-sum across 5. This is where the Chief says "I trust Markets more than News for this decision."
- **Layer 2 — Per-Minister Concern Level (this issue):** Within each minister, 3 domain-specific knobs. AI auto-suggests weights. Zero-sum within each minister. This is where the Chief says "within the Markets minister, I care more about Polymarket than Kalshi right now."

Both layers use zero-sum math. Both start with AI-suggested weights. Both persist across sessions.

Issue #85 (arguing against zero-sum) is CLOSED. The zero-sum constraint is architecturally correct and intentional — it is the epistemic transparency primitive.

---

## Summary

Each minister has a **3-knob weighting panel** on the right-column dashboard. Pulling one knob down automatically raises the other two, like a sound mixing board — the three knobs always sum to 100% **within that minister**. This is the Chief's tool for expressing 'which of this minister's concerns matter to me for this decision.'

## The Core Pattern

A cabinet minister doesn't have one undifferentiated 'weight.' A Treasury Secretary has distinct concerns: current liquidity, long-term solvency, political exposure. When briefing the President, each of those matters differently depending on the decision. The Chief can tell Treasury 'I already know the budget package is coming next month, so stop worrying about liquidity — focus on solvency and political exposure.'

Convergence models this: **3 concern-knobs per minister**, constrained to sum to 100%, Chief-adjustable in real time, affecting the minister's briefing output and the final Foundry synthesis.

## The 3 Knobs Per Minister (Proposed)

Each minister has 3 domain-specific concerns, not generic metrics. These should be set per-minister based on what matters in their domain:

| Minister | Knob 1 | Knob 2 | Knob 3 |
|---|---|---|---|
| **Knowledge** | Tenant constraints (budget, timeline, legal) | Strategic alignment (SWOT fit) | Organizational capacity |
| **Markets** | Polymarket signal | Kalshi signal | Divergence magnitude |
| **News** | Mainstream coverage | Velocity / emerging | Factual vs. narrative |
| **Narrative** | Social momentum | Sentiment polarity | Influencer/podcast signal |
| **Data** | Regulatory/government | Financial/market data | Domain APIs (FDA, NOAA, etc.) |

**These are first-draft proposals.** Each minister's 3 knobs should be refined based on what Chiefs actually want to tune. Not all ministers need all 3 — if a minister only has 2 meaningful concerns, the third can be locked or hidden.

## Interaction Model (Sound Mixer Physics)

- Three sliders, stacked vertically on the minister card's right edge
- Each slider 0-100%
- Sum constraint: always = 100% per minister
- Pulling slider A down redistributes the delta proportionally across B and C
- Pulling A down to zero pushes B and C each up by half of A's previous value
- Pulling A up takes proportionally from B and C
- Small lock icon per slider — locked sliders don't redistribute
- Default state: all three at 33/33/34

## Example Flow (Roderic's scenario)

Chief is deciding whether to launch a new product line. Knowledge Minister's 3 knobs:

| Knob | Default | Why Chief adjusts |
|---|---|---|
| Tenant constraints | 33% | 'We have a budget package coming — this doesn't matter as much' |
| Strategic alignment | 33% | 'This is about strategy, not cash flow' |
| Organizational capacity | 34% | 'Team is already stretched' |

Chief pulls 'Tenant constraints' down to 20%. System redistributes: Strategic alignment 40%, Organizational capacity 40%. Knowledge Minister's next turn briefing emphasizes strategy and capacity, de-emphasizes budget warnings. When the Foundry synthesis runs, budget-related tensions are downweighted.

## Effect on Minister Output

When a knob is pulled down, the minister doesn't **stop considering** that concern — it just **de-emphasizes** it in:
1. The minister's current-position top-line
2. The evidence the minister surfaces
3. How loud the minister is in the final Foundry synthesis

**The underlying data still exists.** The Chief can always pull the knob back up. This is not censorship — it's editorial weight.

## Effect on Foundry Synthesis Gate

When the Chief hits 'Conclude Briefing' (see Foundry Gate issue), the synthesis uses all 5 ministers × their weighted knob configurations:

- High-weighted concerns across ministers form the main tension axis
- Low-weighted concerns are noted but not surfaced
- Contradictions between low-weighted items are dismissed
- Contradictions between high-weighted items are the decision the Chief must make

**The weights are the Chief's act of editorial judgment before synthesis.** This is the single biggest anti-oracle mechanism — the Chief literally tells the system what to emphasize, and the system respects it.

## Anti-Oracle Compliance

Per the #39 reconciliation: weightings are **epistemic transparency primitives**, not prediction scores. They express the Chief's prior judgment about which concerns matter for THIS decision. They do not predict outcomes. They do not collapse the stack. They are the Chief's knob on the stack.

#39 remains in force for system-generated outcome probability scores. User-adjusted concern weights are allowed and required.

## Data Persistence

- Weights persist per briefing session
- Reset to defaults (33/33/34) at new session start
- Optionally: save weight presets per tenant ('Crisis briefing preset', 'Long-term strategy preset')

## Open Questions

1. Are the 3 knobs the same across all tenants, or tenant-configurable?
2. Should the Chief see a global view of all 15 knobs (5 ministers × 3) or just per-minister?
3. What's the UI for 'I want to zero this concern entirely' — locked at 0 with a dead UI, or hidden?
4. When the Chief changes a weight mid-briefing, do prior turns re-run with the new weight, or does only the next turn reflect it?

## Related

- Master: #31
- Index: #49
- Two-column layout: #47 (weighting lives in right column)
- Foundry gate: #51 (consumes weights)
- Anti-oracle reconciliation: #39

=== ISSUE #71 ===
FR-ARCH-4: Dual-Level Weighting Architecture (Master + Per-Minister Sliders)

## Summary
Clarify that Convergence weighting has TWO distinct levels:
1. **Master minister sliders** (top-level dashboard) — Chief dials down Knowledge, auto-dials up Markets/News/Narrative/Data
2. **Per-minister 3-knob sliders** (inside each minister card) — Chief adjusts domain-specific concerns within that minister

Both use sound-mixer physics (push one up, others auto-adjust down).

## Master Level Example
Chief turns down "Narrative" minister to half power, "Data" minister goes to full power.
- This tells the system: "For THIS decision, I care more about hard facts than hype"
- All synthesis reflects this weighting

## Per-Minister Level Example
Inside Knowledge minister card, Chief adjusts 3 knobs:
- "Org capacity" → 70%
- "Budget constraints" → 20%
- "Legal/compliance" → 10%
These sum to 100% and use sound-mixer physics.

Simultaneously, the Knowledge minister also appears in the master-level weighting (Chief can dial the entire Knowledge minister up or down).

## Why
Provides **granular epistemic transparency:**
- Master level: Chief expresses cabinet composition preference
- Per-minister level: Chief expresses what specific factors matter WITHIN that minister's domain

Both are "user-controlled epistemic transparency primitives" (not AI-generated confidence scores).

=== ISSUE #73 ===
Design Principle 1: Chief's Hidden Context — Objection Handling

# Convergence — Design Principle Defense & Objection Handling

**Created from:** Audio analysis of three Crucible v3 debates + Chief's Hidden Context principle (2026-04-09)

**Purpose:** Establish constitutional responses to anticipated product objections. This is not engineering documentation; this is **pushback against conventional thinking** that the product will receive from clients, stakeholders, and even users.

---

## Design Principle 1: Chief's Hidden Context (The Compensation Mechanism)

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

**Objection:** "Executives won't spend 20-30 minutes adjusting sliders"  
**Response:** For a $500K-$10M decision, executives spend 20-30 hours on due diligence. They'll spend 20-30 minutes on a tool that gives them synthesis authority. Research shows people spend 20 hours on YouTube before buying a car; they will absolutely invest time in decisions that matter to them.

**Objection:** "This is too manual / Too much UI for busy C-suite"  
**Response:** The system doesn't force adjustments. Without touching anything, the Chief gets a briefing. The sliders are optional UI that kicks in when the Chief's hidden context diverges from the AI's weighted default. That's when compensation becomes necessary.

---

## Objection Handling — Comprehensive Arguments

### 1. User Friction & Time Investment

**The Concern:** C-suite executives are overloaded. They type terse fragments like "Target Q3 earnings impact." Do they have patience for iterative analysis?

**The Counter:**
- **Satisficing vs. Optimizing:** Executives naturally satisfice—they iterate until finding a "good enough" decision, not the perfect one. Convergence supports this: hit "Conclude Briefing" the moment options become clear. No forced number of turns.
- **Temporal Continuity:** The system persists state across sessions. An executive can run a <30-second briefing, step away, return the next day with their exact editorial judgments saved. No need for a 4-hour sitting.
- **The Sliders Digitize Real Authority:** In the real world, leaders dynamically prioritize domain concerns depending on context. The sliders digitize this reality. They're not decorative—they're how the Chief tells the AI "for THIS decision, financial data matters more than social momentum."
- **Target Audience Wants This:** Convergence is built for accountable synthesis—CEOs, military commanders, fund managers who *want* to maintain ultimate authority over how contradictory intelligence is weighed. They value this responsibility.

**Evidence from Debates:**
> "The user does not need to complete a complex analysis in one long sitting... the 3-knob weighting sliders persist across sessions... An executive can run a <30-second briefing, step away, and return the next day to find their exact editorial judgments saved."

---

### 2. The 'No Recommendation Number' Design (Why 0-100 Scores Are Poison)

**The Concern:** Executives want a clear number. "85 strength" tells them whether to act.

**The Counter:**
- **The Precision Illusion:** An "85 strength" score is entirely artificial—it's a probabilistic estimate from algorithms that are fragile and subjective. The moment you show a number, C-suite executives will misinterpret it as "85% probability this is true."
- **Violates Anti-Oracle Design:** Convergence's entire point is to expose the stack, not collapse it. A 0-100 score absorbs the meta-uncertainty and forces the AI into an oracle role—exactly what we're trying to prevent.
- **What We Show Instead:** Raw source counts. "3 sources agree, 1 contradicts, 1 neutral." No fake precision. The Chief retains synthesis authority.
- **The Constitutional Change (Turn 4 of Crucible):** The team realized that leaving a `convergence_strength` score in the architecture was a critical failure. They removed the 0-100 weighting entirely and replaced it with source-count visualization.

**Evidence from Debates:**
> "If the system presents a clean, authoritative number like an '85 strength score,' C-suite executives will inevitably misinterpret it as an '85% probability'... This violates the anti-oracle design principle and forces the AI to absorb the meta-uncertainty of the data."

---

### 3. LLM Limitations — "Bounded by Prompts" Problem

**The Concern:** "If the AI doesn't know something, how can it help me?"

**The Counter:**
- **LLMs Can't Mine-Detect:** Real human advisors proactively sniff out hidden traps. LLMs don't. They solve strictly through "context-directed extrapolation from training data"—bounded by the prompt and data streams you feed them.
- **Understanding vs. Applying:** LLMs excel at "Understanding" (interpreting, summarizing). They fail at "Applying" (solving completely novel problems). If a scenario is unprecedented, the LLM extrapolates from historical equivalents and blinds you to unique variables.
- **This Is Why We Have The Chief:** Because the AI is bounded, the system forces the human executive to calibrate risk and ask the right questions. The Chief's hidden context is the compensation mechanism.
- **The Slider Adjustments Compensate for This:** When the Chief knows something the AI doesn't—a relationship dynamic, an upcoming announcement, a political factor—they adjust the sliders to reweight the Ministers. This is the system working as designed.

**Evidence from Debates:**
> "LLMs lack independent agency and operate purely through 'context-directed extrapolation from their training data priors.' While an LLM will answer the exact question it is asked, it will NOT spontaneously step outside those bounds to warn of an unstated risk."

---

### 4. Technical Gaps — From Brittleness to Resilience

**Major architectural criticisms identified:**

| Criticism | Mitigation | Status |
|-----------|-----------|--------|
| <30s latency SLA unrealistic (slow APIs, token overhead) | Graceful degradation: return data successfully gathered, explicitly state missing sources | Implemented in Turn 2 |
| Entity resolution gaps (mapping "Ohio" to FCC DMAs) | Hand-curated mapping table for POC phase | Done |
| Multi-turn state undefined | Clarified: cards update in place, ministers re-fetch | Design Principle in #31 |
| Dynamic 3-sigma baselines fail on synthetic data | Use hardcoded thresholds for POC, aligned with seed data | Done |
| Chat-gating heuristic misses terse executive language | Heuristic is opportunistic hook only; dedicated UI is primary | Designed |
| Multi-source mandate hides single-signal cards | Render as "Single Signal" with yellow warning | Implemented |

**The Philosophy:**
These aren't bugs—they're **constraints that force honest design**. The system can't be a magic oracle, so it admits its boundaries and gives the Chief the tools to compensate.

---

### 5. "Why Not Just Use ChatGPT?"

**The Objection:** ChatGPT can analyze information and give advice. Why pay for Convergence?

**The Counter:**

- **ChatGPT Collapses. Convergence Exposes.** ChatGPT, Perplexity, and Claude are designed to synthesize contradictory information into a single answer. Efficient but it strips the Chief of synthesis authority. Convergence inverts this: it keeps contradictions visible and forces the Chief to evaluate tensions.

- **Bounding the LLM, Not Trusting It.** ChatGPT tries to be comprehensive. Convergence respects the limits of LLMs—they operate at "Understanding" (interpreting data) but fail at "Apply" (solving novel problems). Convergence uses the AI strictly for mapping tensions and extracting options, leaving actual decision-making to the human.

- **Structural Anti-Sycophancy.** LLMs are vulnerable to context-poisoning: if you signal you've committed to a decision, they often abandon contradictory data to align with you. Convergence prevents this through the CRUCIBLE phase—even if you try to steer it, the system is architecturally forced to highlight structural collisions. *"Markets are telling you X. Knowledge is telling you Y."* No "yes-man" behavior possible.

- **The Price Tag Reflects The Responsibility.** ChatGPT is $20/month. Convergence is $500K+/year. That's not a cost—that's an acknowledgment that synthesis authority for $10M decisions carries weight. You're not paying for the AI to decide; you're paying for a system that preserves YOUR decision-making authority while giving you the full intelligence stack.

---

## Constitutional Statements (For Internal/External Use)

**For client pushback on time/friction:**
> "Convergence is not Duolingo. We are not trying to keep users sticky. This is something people are paying a huge amount of money for. They will spend the time where it matters. That's the entire point."

**For skepticism about sliders:**
> "The sliders are not decorative. They digitize real executive authority. Every CEO makes different calls on what matters for different decisions. The sliders let them tell the AI: 'For THIS decision, financial data matters more than social momentum.' That's not friction—that's honesty."

**For "why not just ChatGPT" argument:**
> "ChatGPT collapses contradictions into a single answer. Convergence exposes them. ChatGPT lets you ask questions; Convergence lets you synthesize intelligence. Those are different products for different users."

**For "AI doesn't know everything" concern:**
> "Right. The AI will never know everything. That's why the Chief has the compensation mechanism—the sliders. They know things the AI doesn't. They adjust accordingly. This is a feature, not a limitation."

---

## Next Steps

1. **Update FSD (#31)** with Design Principle 1 (Chief's Hidden Context) alongside DP0
2. **UX Copy Refresh:** All UI surfaces should reflect these constitutional statements
3. **Sales Deck:** Use these objection responses to pre-empt client concerns
4. **Hiring/Onboarding:** New team members should read this before touching code
5. **RFC Preparation:** Use these statements to frame Scrum Master discussion

---

## References
- GitHub Issue #31 — Main FSD (Convergence)
- GitHub Issue #72 — Crucible v3 Findings  
- Audio artifacts (3x from NotebookLM Crucible notebook, 2026-04-09)
- Chief's Hidden Context principle (user insight, 2026-04-09)

=== ISSUE #77 ===
UX Copy Specifications — The Play-Doh Phase

# UX Copy Specifications — The Play-Doh Phase (v3 — Post Transcript Analysis)

**Status:** In progress (living document, constantly rewritten)
**Last updated:** 2026-04-09 (after reading all 8 Crucible debate audio transcripts — 22,000 words)
**Philosophy:** This is Play-Doh. Shape and reshape constantly. Rewrite, don't comment.

---

## Language Inventory: The Core Lexicon

These words and phrases define the Convergence voice. Use them. Don't improvise alternatives.

| Use | Don't Use |
|-----|-----------|
| "The Chief" | "The user", "You", "The executive" |
| "Minister" | "Agent", "Source", "Bot", "Assistant" |
| "Briefing" | "Summary", "Report", "Output", "Response" |
| "Conclude" | "Submit", "Finalize", "Get answer", "Analyze" |
| "Convergence" | "Analysis", "Search", "Query" |
| "Signal" | "Data point", "Finding", "Result" |
| "Tension" | "Conflict", "Disagreement", "Contradiction" |
| "Compensation" | "Override", "Adjustment", "Weighting" |
| "Stack" | "Dashboard", "Panel", "Results" |
| "Liability" | "Responsibility", "Risk" |
| "Synthesize" | "Decide for you", "Recommend", "Tell you what to do" |

---

## Surface 1: Empty State / First Open

**Headline:** "Your cabinet is waiting."

**Sub:** "5 ministers. Your question. No answer — just every signal that matters."

**CTA:** "Start Briefing"

**Why:** Positions Convergence as a cabinet room, not a chatbot. The Chief walks into the room — the ministers don't walk into theirs.

---

## Surface 2: Chat Input Prompt (The Decision Statement Detector)

**Placeholder text:** "What decision are you making?"

**Why:** Forces the Chief to articulate a decision, not just a topic. This is the MINE phase gate.

**Inline hint (on focus):** "Tip: state the decision, not the question. 'Should I launch in Q3?' not 'Tell me about Q3.'"

**After classification — decision detected:**
"I hear a decision. Your ministers are briefing now."

**After classification — not a decision statement:**
"That sounds like a question. Want to turn it into a decision brief? [Yes → Convergence] [No → Chat]"

---

## Surface 3: Minister Cards (Active Briefing)

**Card header — briefing:**
"[Minister name] is reading..."

**Card header — complete:**
"[Minister name] has briefed."

**Card header — insufficient data:**
"[Minister name] cannot advise. Insufficient data."
(Show raw count: "0 sources found")

**Card header — single source:**
"Single Signal — 1 source only. Treat as early indicator, not confirmation."

**Why:** Raw counts ("3 sources agree, 1 contradicts") not percentages. Chief sees the stack.

**Minister-specific voice:**
- Knowledge: "From your files:" — emphasizes proprietary, internal
- Markets: "Prediction markets say:" — emphasizes crowd intelligence / financial stakes
- News: "The coverage says:" — neutral, journalistic
- Narrative: "The conversation is:" — softer, directional, not factual
- Data: "The filings show:" — precise, authoritative, dry

---

## Surface 4: Signal Hardness Labeling (New — v3)

Each minister card carries a hardness label that communicates epistemological type, not quality ranking.

**Hard Intelligence** (Data + Markets): "HARD SIGNAL"
Copy under label: "Grounded in filings, transactions, and financial stakes."

**Ambient Intelligence** (Narrative + News): "AMBIENT SIGNAL"
Copy under label: "Directional. Treat as context, not confirmation."

**Internal Intelligence** (Knowledge): "INTERNAL SIGNAL"
Copy under label: "Your data. Your context. Only you can verify it."

**Why:** A CEO instinctively treats a CFO's balance sheet differently from a VP Marketing's sentiment analysis. The UI must communicate this before the Chief reads a word.

---

## Surface 5: WEP Sufficiency Labels (New — v3)

Replace percentage-based confidence with qualitative WEP language:

| Label | Meaning |
|-------|---------|
| STRONG — [N] sources | Multiple corroborating, no contradictions |
| LIKELY — [N] sources | Majority aligned, minor gaps |
| SPLIT — [N] for, [M] against | Ministers in genuine disagreement |
| THIN — [N] source | Single-source or sparse |
| SILENT | Insufficient data — minister cannot advise |
| CONFLICTED | High volume but contradictory |

**Why:** "LIKELY" with a source count is more honest than "68%". The Chief knows it's an estimate, not a calculation.

---

## Surface 6: Weighting Mixer

**Section header:** "Compensate for what we don't know"

**Explanation (hover/tooltip):** "We have the data. You have the context. These sliders let you weight ministers based on what you know that we can't see."

**Preset button labels:**
- "Regulatory Risk Mode"
- "Growth Mode"
- "Crisis Containment"
- "Blue Sky"
- "Custom"

**Intent-based input placeholder:** "Tell me what matters most right now..."

**Example intent inputs:**
- "Ignore budget constraints, we have funding"
- "Weight market signals heavily, this is a timing call"
- "I trust our internal data more than the news right now"

**After preset selection:**
"[Preset name] applied. Your ministers are re-briefing."

**After intent-based adjustment:**
"Got it. Re-weighting to reflect your priorities."

**After manual slider change:**
"Updated. The brief will reflect your weighting."

**Why:** This is the compensation mechanism. Every copy framing makes it clear: the Chief is compensating for what AI cannot know, not "adjusting settings."

---

## Surface 7: Flash Tension Banner (New — v3)

**Banner text (example):**
"TENSION DETECTED — Markets and Knowledge disagree on the launch timeline."

**Sub-copy:** "Read both cards before concluding."

**CTA links:** "Go to Markets" | "Go to Knowledge" | "Proceed anyway"

**Why:** Surfaces contradictions mid-turn rather than gating them behind Conclude. Acts as chief of staff pointing at the friction, not resolving it.

---

## Surface 8: Conclude Briefing Button

**Button label:** "Conclude Briefing"

**Pre-click modal (optional):** "You're about to conclude. Your ministers have briefed [N] turns. The decision brief reflects your current weightings."

**The Accountability Statement (mandatory, appears before brief):**
"What follows is not advice. It's a map of the signals. The call is yours. It always is."

**Why:** Decision Liability must be explicit at the moment of commitment. Not buried in onboarding. Right before the synthesis.

---

## Surface 9: Foundry Decision Brief

**Header:**
"Your brief is ready. This is what your ministers see — not what you should do."

**Tension section header:**
"Where they disagree:"

**Alignment section header:**
"Where they agree:"

**Silent minister section:**
"Ministers who could not advise:" + reason for silence

**Closing line of every brief:**
"The liability is yours. The call is yours."

**Why:** Every brief closes with accountability. Not a disclaimer. Not fine print. The core position of the product.

---

## Surface 10: Fast-Track Conclude Mode (New — v3)

**Button label (first-turn option):** "Brief me now — I'll dig in after"

**Explainer:** "Get the synthesis immediately. Minister cards stay available below for verification."

**Synthesis header in fast-track mode:**
"DRAFT BRIEF — Based on default weightings. Refine below."

**Why:** Inverted funnel for time-pressured Chiefs. Synthesis first, detail on demand. Matches how consulting decks are consumed.

---

## Surface 11: Fresh Eyes Reset (New — v3)

**Button label:** "+ New Convergence"

**Confirmation modal:**
"Start fresh? This clears your weightings and session context. Live minister data stays current. Your previous session is saved."

**Confirmation CTA:** "Yes, start fresh"

**Why use fresh eyes:** "After a long session, the AI has learned your lean. Starting fresh gives you an unbiased read on the same data."

**Why:** Prevents accumulated context from turning Convergence into a confirmation machine. The Chief exercises their liability by choosing when to reset.

---

## Surface 12: Async Audio Debate (Phase 2+)

**Button label (on tension detection):** "Hear the Debate"

**Description:** "Your Markets and Knowledge ministers argue the case. 5–10 minute audio. Playable anywhere."

**Generating state:** "Your ministers are debating. Back in about 5 minutes."

**Ready notification:** "The debate is ready. Listen before you decide."

**Why:** The Chief is not sitting in a room. They jog. They drive. They walk. Convergence debates should travel with them. The decision doesn't need to happen in 30 seconds — but the intelligence should reach the Chief wherever they are.

---

## The One Phrase That Must Never Appear

"Here's what you should do."

If any surface in Convergence says this — in any form — delete it. The product is constitutionally opposed to this sentence. The brief, the ministers, the synthesis, the Foundry gate — none of them tell the Chief what to do.

They tell the Chief what they know. The Chief decides.

---

## Related Issues
- Design Principle 1 (Hidden Context): #73
- Design Principle 2 (Decision Liability): #78
- Zero-Sum Slider Problem: #85
- Signal Hardness Visual Coding: #86
- Flash Tension Banner: #87
- Fast-Track Conclude: #88
- Fresh Eyes Reset: #89
- WEP Language System: #90
- FSD: #31

=== ISSUE #86 ===
UX: Signal Hardness Visual Coding — Hard vs Ambient Intelligence Tiers

## Source
Crucible debate: 'Designing AI cabinets for executive speed'

## The Problem

All five minister cards currently look identical in the UI. The same visual weight, same card format, same typography. This is epistemically dishonest.

> 'The UI format fundamentally flattens the hierarchy of intelligence. Having 100% data sufficiency for a podcast rumor still leaves you with a rumor.'

A CEO sitting across from their CFO (handing over an audited balance sheet) treats that information categorically differently than their VP of Marketing (handing over a sentiment analysis of an online forum). Both perspectives matter. They are not the same kind of fact.

> 'In a physical war room, the seating arrangement, posture, format of handouts — all subtle environmental cues dictate influence and how information is weighted by the decision maker. The digital interface fails to communicate that distinction.'

---

## The Three-Tier Intelligence Framework

### Tier 1: Hard Intelligence
**Ministers:** Data + Markets

Sources: SEC Form 4 filings, FEC data, FRED economic data, Polymarket/Kalshi prediction markets (financial stakes filter noise)

**Visual language:** Rigid, anchored, structured. Sharp edges. Tabular data representations. Dense formal typography. High contrast. Signals authority and exactness. Communicates: 'This is grounded in empirical, verifiable reality.'

### Tier 2: Ambient Intelligence
**Ministers:** Narrative + News

Sources: Pod scanning (PodScan.fm), social sentiment, GDELT news corpus, media monitoring

**Visual language:** Fluid, softer. Rounded cards. More white space. Warmer typography. Signals: 'This is signal, not fact. Weight accordingly.'

### Tier 3: Internal Intelligence
**Ministers:** Knowledge

Sources: Tenant's proprietary documents, uploaded files, private context injected by Chief

**Visual language:** Distinct third treatment. Suggests origin from inside the organization. Could use a different accent color or border treatment that signals 'your own data, your own context.'

---

## Why This Matters for Speed

> 'When a user is moving fast, they do not have the luxury of thoroughly vetting the epistemological source of every bullet point. They rely on heuristics. The interface needs to actively provide those heuristics.'

Signal hardness coding gives the executive **subconscious cues** before they read a single sentence. Peripheral vision processing — not explicit reasoning — calibrates their skepticism before they engage with content.

Practical outcome: Executive sees Hard Intelligence (Markets + Data) contradicting Ambient Intelligence (Narrative + News) at a glance — without reading any cards. They know immediately: 'The numbers say X but the street says Y.' That's executive-speed synthesis.

---

## Proposed Specs

### Card Visual Differentiation
| Minister | Tier | Card Style | Data Display |
|---|---|---|---|
| Data | Hard | Sharp corners, dark border, dense table format | Raw counts, filing IDs, timestamps |
| Markets | Hard | Sharp corners, chart-forward, price/probability display | Numerical, decimal precision |
| News | Ambient | Rounded corners, lighter weight, excerpt-style | Headline fragments, source count |
| Narrative | Ambient | Rounded corners, warmer, softer contrast | Sentiment descriptors, volume indicators |
| Knowledge | Internal | Distinct accent (e.g., indigo border), document-feel | Citation-style, doc title references |

### Dashboard Clustering (Spatial Arrangement)
Rather than listing all 5 ministers in a flat row:



When Hard Intelligence and Ambient Intelligence contradict each other, the spatial separation makes the conflict *visually immediate*. The Chief doesn't need to find the contradiction — the layout points at it.

---

## Sufficiency Meter Interaction

The sufficiency meter reads differently across tiers:
- **Hard Intelligence at 100%**: Strong — real filings, real trades
- **Ambient Intelligence at 100%**: Still just high-volume rumor. The card should communicate this with visual softness, not treat 100% ambient the same as 100% hard data.

The WEP (Words of Estimative Probability) system from issue #86 integrates here — Hard Intelligence gets tighter WEP language ('HIGH', 'MODERATE'), Ambient gets explicitly hedged language ('THIN', 'NOISY').

---

## Design Constraint
This is a visual coding system, not a hierarchy of trustworthiness per se. Narrative/News are NOT less important — some decisions are entirely sentiment-driven. The coding communicates *type* of intelligence, not quality ranking.

## Priority
P1 — Core UX. Needed before any frontend build begins.

## Related
- Minister clustering layout: see this issue
- WEP language system: #86 (to be created)
- UX Copy Specs: #77
- FSD: #31

=== ISSUE #87 ===
UX: Flash Tension Banner — Surface Contradictions Mid-Turn, Not Just Behind Conclude

## Source
Crucible debate: 'Designing AI cabinets for executive speed'

## The Problem

Currently, the highest-value insight — the structural tension between conflicting ministers — is gated behind the conclude button. The Chief must complete 3–7 turns of reading all five minister cards before they earn the right to see the synthesis.

> 'Time-starved executives are notorious for bypassing friction to get to the summary. If you gate the highest value insights entirely behind a multi-turn wall and a final conclude button, the user will subvert your process.'

The near-certain behavior: a CEO under pressure hits Conclude on Turn 1, bypasses all minister cards, and gets a synthesis with no context — defeating the entire architecture.

---

## The Fix: Flash Tension Banner

Surface critical tensions **dynamically during the multi-turn process**, not only in the final concluded brief.

> 'If the user asks a follow-up question in turn two, instead of just rendering five updated minister text blocks, the system could also generate a dynamic banner that highlights immediate contradictions across the cabinet.'

### Behavior

When the system detects a significant divergence between ministers mid-turn, a high-visibility banner appears at the top of the workspace:

**Example banner text:**
> WARNING — Markets and Knowledge are diverging on the launch timeline

**Effect:**
- Acts as an anchor for the Chief's attention
- Rather than parsing five walls of text, the Chief gets a specific thread to pull
- They read the two specific minister cards cited in the banner to understand the divergence
- The journey through intermediate turns becomes inherently valuable, not just a prerequisite

---

## Specs

### Trigger Logic
- Fires when Crucible phase (during streaming briefing) detects cross-minister contradiction above a confidence threshold
- Does NOT replace minister cards — banner appears above them
- Persists until Chief clicks to dismiss or until Conclude is pressed
- Multiple banners can stack if multiple tensions detected

### Banner Anatomy


### What It Is Not
- NOT a final synthesis (that's Conclude)
- NOT an oracle (it does not tell the Chief which minister is right)
- NOT a summary that replaces reading (it's a navigation pointer)

> 'Surfacing a contradiction isn't acting as an oracle. It's acting as a competent chief of staff. A skilled human advisor doesn't hand a CEO five reports and make them hunt for contradictions. They point out the contradiction up front, then hand over the reports to verify.'

---

## Design Principle Alignment

The anti-oracle principle requires the system to expose tension, not resolve it. The Flash Tension Banner exposes tension early (mid-turn) rather than late (post-conclude), making the multi-turn process valuable rather than a tollgate.

Design Principle 0 (Information > No Information) applies: surfacing partial tension information mid-turn is strictly better than withholding it until the final brief.

---

## Related
- Fast-track Conclude option: #88 (inverted funnel alternative approach)
- Signal hardness visual coding: #86
- FSD: #31

=== ISSUE #89 ===
UX: Fresh Eyes Reset — New Convergence Button

## Source
Crucible debate: 'Can executives trust the Data Minister' (transcript analysis)

## The Problem: Sycophancy Via Accumulated Context

> 'If the chief signals a mental commitment in turn two — telling the AI I really want to launch this product, give me the final details — a standard LLM will abandon its contradictory data to align with the chief's stated intent.'

In a multi-turn Convergence session, the LLM accumulates context. After 4-5 turns where the Chief's questions have trended toward a specific conclusion, the AI begins to reflect that preference back. The weights the Chief has manually set progressively bias the synthesis toward their existing position. This is sycophancy — the Chief is getting an intelligent mirror, not an adversarial advisor.

The Crucible phase is a structural safeguard against this (it is mandated to surface contradictions regardless of Chief preference). But there is a secondary risk: the 3-knob weightings the Chief has set across 7 turns of conversation now embed their cognitive biases into the system's lens.

---

## The Fix: Fresh Eyes Reset

A visible button — labeled 'New Convergence' or 'Fresh Eyes' — that:
1. Clears the current conversation context window
2. Resets all 15 sliders to neutral default values
3. Maintains the underlying data (minister feeds are unchanged — same live data)
4. Starts a new turn-1 session on the same topic or a new topic

### What This Preserves
- All minister data and sufficiency readings (unchanged — this is not a data refresh)
- The Chief's session history for audit purposes (stored, but not loaded into active context)
- Any documents the Chief uploaded (Knowledge minister retains injected context)

### What This Clears
- The LLM's context window and turn history
- All manually set slider positions (back to neutral)
- Any implicit preferences the AI has inferred from previous question patterns

---

## Use Case: The Gut-Check

Chief has spent 45 minutes building a case for Option A through their convergence session. Everything in their current session leans toward A. They want a genuine challenge before committing.

They hit 'New Convergence.' The session opens clean. Same data, no accumulated bias. They ask: 'What is the strongest case AGAINST Option A?' The system engages without the accumulated context that would otherwise soften the answer.

This is the digital equivalent of bringing in a fresh advisor who has not been in the room for the previous conversation.

---

## Copy Suggestion

Button label: **'+ New Convergence'**

Confirmation modal: 'Start fresh? This will reset your current weightings and clear session context. Your previous session is saved for review.'

Secondary: 'Why reset?' link → explains that accumulated context can create bias drift and fresh sessions give the AI clean sight lines on the same live data.

---

## Connection to Design Principle 2

Design Principle 2 (Decision Liability) establishes that the Chief carries the risk. The Fresh Eyes Reset is a mechanism for exercising that responsibility consciously: when you recognize your session has drifted toward confirmation of your preferred outcome, you have a structural tool to challenge it.

---

## Priority
P2 — Not needed for MVP. Needed before sustained use by real executives where session length exceeds 30 minutes.

## Related
- Sycophancy safeguards: #73 (Design Principle 1)
- Design Principle 2: #78
- UX Copy Specs: #77
- FSD: #31

=== ISSUE #90 ===
Architecture: WEP Language System — Replace Percentages with Words of Estimative Probability

## Source
Crucible debate: 'Data Sufficiency Percentages Versus Raw Counts'

## The Core Argument

> 'Pasting 78% on a dashboard commits the ultimate oracle sin. It creates a massive illusion of precision by absorbing all the underlying meta-uncertainty. It masks the probabilistic guesswork of the algorithms feeding it.'

A percentage implies mathematical certainty. The underlying data collection process (GDELT grammar parsing, LLM classification, API response timing) has substantial variance that a clean number completely hides.

The FSD already resolved one version of this by removing the 0–100 strength score. That was correct. But the Data Sufficiency Meter (also expressed as a percentage in early designs) has the same problem.

---

## The Intelligence Community Standard: WEP

The Intelligence Community Standard (ICD 203) uses Words of Estimative Probability — qualitative buckets that communicate confidence range without implying false precision:

| WEP Term | Approximate Probability Range | Use in Convergence |
|---|---|---|
| NEAR CERTAINTY | 95%+ | Multiple corroborating hard sources, no contradictions |
| HIGHLY LIKELY | 80–95% | Strong convergence across 3+ ministers, minor gaps |
| LIKELY | 55–80% | Majority of ministers aligned, some ambiguity |
| ROUGHLY EVEN | 45–55% | Ministers split, genuine uncertainty |
| UNLIKELY | 20–45% | Majority of ministers silent or contradicting |
| HIGHLY UNLIKELY | 5–20% | Near-universal minister silence or contradiction |
| REMOTE CHANCE | Under 5% | Almost no data, or data universally contradicts |

WEP terms **force a more qualitative read from the user**. The Chief cannot anchor to '78%' the way they can to a verbal descriptor that inherently communicates a range.

---

## But WEP Is Not Enough Alone

> 'Replacing a number with a word doesn't fix the root problem. We're still relying on the same fragile LLM to pick that bucket. LLMs are notoriously swayed by the tone and verbosity of the source material. We're just making the illusion fuzzier.'

WEP is an improvement over percentages but still relies on the AI to correctly classify its own certainty. The Data Sufficiency Meter is already more honest because it measures raw volume (a mechanical count), not AI-assessed quality. Keep the sufficiency meter as a count (see raw counts proposal), but use WEP language for cross-minister alignment assessments in the Crucible output.

---

## The Hybrid System (Recommended)

Two distinct display modes for two distinct measurements:

### 1. Data Sufficiency Meter (per minister) — Raw Counts
Display: '14 articles | 3 SEC filings | 2 Polymarket contracts'
Not: '78% sufficient'

Why: The count is a mechanical fact (how many items the minister retrieved). The LLM doesn't interpret this — it's a database row count. Maximum honesty, minimum AI involvement in self-assessment.

### 2. Cross-Minister Alignment (Crucible output) — WEP Language
Display: 'HIGHLY LIKELY — regulatory risk is material' (with sourcing: 'Markets + Data agree; Narrative is thin')
Not: '82% confidence'

Why: The Crucible phase does require LLM synthesis to assess how ministers align. WEP language correctly communicates that this is an estimate, not a calculation.

---

## Tiering WEP by Minister Tier

Integrating with Signal Hardness (issue #86):

Hard Intelligence tiers use tighter WEP language — the underlying data is more reliable, so the AI can claim HIGHLY LIKELY more credibly when Markets + Data converge.

Ambient Intelligence tiers cap at LIKELY or below — even when Narrative + News fully agree, the epistemological ceiling of social sentiment data means NEAR CERTAINTY is not appropriate.

The interface should communicate this ceiling visually (see issue #86) so the Chief understands that LIKELY from the Narrative minister is a different claim than LIKELY from the Data minister.

---

## The Double-Binding Problem from the Debate

One side argues percentages give executives the velocity they need. The other argues WEP gives more honest communication. Both sides agree on one thing:

> 'The system must never output a single outcome probability. We both celebrate killing off the old 0–100 strength score. Executives inevitably misread that as a prediction of the future rather than an evaluation of the data.'

Convergence's existing FR-10 (source-count display, NOT 0–100 strength score) is the right call. This issue extends that principle to the language layer.

---

## UX Copy Implications (Update #77)

Replace any percentage-based language in minister card headers with:
- 'STRONG SIGNAL — 4 corroborating sources'
- 'THIN SIGNAL — 1 source, unverified'
- 'SILENT — insufficient data to advise'
- 'CONFLICTED — 3 sources disagree'

These communicate state without implying probability.

---

## Related
- FR-10 (source count display, not scalar): #31
- Signal hardness visual coding: #86
- Raw counts vs percentages: debate transcript 'Data Sufficiency Percentages Versus Raw Counts'
- UX Copy Specs: #77

=== ISSUE #94 ===
Feature: Chief of Staff — Independent AI Synthesis Layer (Optional, On-Demand)

## The Concept

The Chief of Staff is an independent AI that enters the briefing room when invoked by the Chief. It reads all current minister outputs and gives a synthesized meta-view — fast, opinionated, explicitly caveated, and optional.

It is NOT the Foundry Synthesis Gate. It does NOT conclude the session. It accelerates the Chief's understanding at any point during multi-turn briefing.

---

## The Real-World Analogy

In the White House, the Chief of Staff is not the President. They are the trusted advisor who has read every briefing, heard from every department, and can walk into the Oval Office and say: 'Here is what your advisors are telling you. Here is where they agree. Here is where they contradict. Here is my read — but you decide.'

They could be wrong. The President still decides. But the CoS dramatically compresses the time needed to understand the landscape.

Convergence's Chief of Staff works the same way.

---

## How It Works

1. Chief is in a multi-turn briefing session. Ministers have briefed (1-N turns).
2. Chief clicks **'Brief me, Chief of Staff'** — a single button in the interface.
3. CoS fires as a separate AI call, reads only the current minister outputs (no new data fetches).
4. CoS returns in <30 seconds with a structured synthesis:
   - Where ministers agree
   - Where ministers contradict (and what the specific delta is)
   - What CoS would pay attention to if it were the Chief
   - Explicit caveat: 'I could be wrong. The call is yours.'
5. Chief reads the CoS brief, then decides: conclude the session, ask more questions, or adjust weights and re-brief.

---

## What the CoS Is NOT

- NOT the Foundry Synthesis Gate (that's the formal concluded brief)
- NOT an oracle ('here is what you should do')
- NOT mandatory (the Chief never has to invoke it)
- NOT a replacement for reading the ministers (it's a compression tool)
- NOT infallible — it operates on the same minister data the Chief has access to

---

## Mandatory Caveat Language

Every CoS output must open and close with the caveat:

Opening: 'This is a synthesis of what your ministers have reported. I could be wrong on any of this. The decision is yours.'

Closing: 'Your ministers have briefed. I have offered a read. The call is yours — it always is.'

This is not fine print. It is the first and last sentence. The design positions the CoS as a trusted but fallible advisor, not an authority.

---

## Why This Matters for UX

Without a CoS, the Chief must read potentially 5 × N turns of minister output — potentially thousands of words — before they feel ready to conclude. This is the barrier that causes chiefs to hit Conclude on Turn 1 and skip everything.

The CoS creates a middle path:
- Read a little → invoke CoS → understand landscape → decide whether to dig deeper or conclude

It is faster than full reading. It is less dangerous than concluding blind. It is honest about its own limitations.

---

## Relationship to Fast-Track Conclude (#88)

Issue #88 (Fast-Track Conclude / Inverted Funnel) was written before this concept was introduced. In light of the Chief of Staff:

- **Fast-Track Conclude** = get a draft Foundry brief immediately (formal conclusion, uses synthesis gate)
- **Chief of Staff** = get a quick informal synthesis mid-session (not a formal conclusion, no synthesis gate)

Both are valid paths. They serve different moments:
- Chief of Staff: 'I've been reading for 20 minutes. Give me a quick read before I decide whether to go deeper.'
- Fast-Track Conclude: 'I don't have time. Give me the best brief you can with what you have.'

---

## Technical Spec

**Trigger:** Button in the briefing UI — 'Brief me, Chief of Staff'

**Input to CoS AI:** All minister current position outputs from the active session (NOT the full conversation history — only the minister briefs)

**Model:** Claude Opus 4.6 (same as Foundry Gate — this is judgment work)

**Output format:**
- Section 1: Where ministers agree (bullet list)
- Section 2: Where ministers contradict (specific delta per contradiction)
- Section 3: What CoS would focus on (3 bullets max)
- Section 4: Mandatory caveat close

**Latency:** <30 seconds (no data fetches — reads existing output only)

**Persistence:** CoS output is saved as a turn in the session sidebar. Chief can return to it.

**Count:** Chief can invoke CoS multiple times in one session (e.g., after each major turn). Each invocation reads current minister state.

---

## Phase

Phase 1 — this is core to the product experience. Without it, the multi-turn wall problem (see #88) has no clean solution.

## Related
- FSD: #31
- Foundry Synthesis Gate: #51
- Fast-Track Conclude: #88
- Latency SLA: #75
- UX Copy Specs: #77 (needs CoS copy added)
- Design Principle 2 (Decision Liability): #78

=== ISSUE #44 ===
FR-CONTENT-1: Source Summary Layer — 1-3 bullets per source, then collapsible full provenance

## Context

User: "They should be able to read it all, but there still should be a summary at the top of each one."

Current approach: show full FEC filing text, full Polymarket payload, etc.

Better approach: 
- Top: 1-3 bullet summary (what does a human need to know?)
- Expandable: Full provenance (raw data, links, methodology)

Reduces cognitive load while preserving transparency.

## Pattern

CONVERGENCE RESULT

SOURCE 1: FEC Filing (filed 2h ago)
- SUMMARY (1-3 bullets)
  • Independent expenditure of $5.2M against candidate
  • Supporting digital ads in Ohio, Michigan
  • Filed by committee "Future of America PAC"
- [+ Full Filing] (collapsible)
  • Filer: C00123456
  • Link: sec.gov/...
  • Raw text: [350 words of actual filing]
  • Analysis: What it means for the candidate

SOURCE 2: Polymarket (updated 4h ago)
- SUMMARY
  • Market SMITH-SENATE-2026 +12% in 4 hours
  • 67% probability priced in (up from 55%)
  • $2.3M in new volume last 3 hours
- [+ Full Market Data]
  • Market ID: 0xabc123...
  • Price history: [7-day chart]
  • Order book: [top 10 bids/asks]
  • Analysis: What traders are betting on

## Who Writes the Summary?

Option 1: Claude (automatic)
- Summarize each source payload with a few key bullets
- Consistent, instant
- Risk: Claude misses nuance

Option 2: Hand-curated (per source type)
- FEC: "Amount, purpose, who filed, timeline"
- Polymarket: "Price movement, volume, implied probability"
- News: "Headline, key quote, publication"
- Predictable, domain-expert quality
- More work to maintain

Hybrid (Recommended):
- Claude generates summary
- Fallback to hand-curated template if Claude summary is poor

## UX Benefits

1. Scannability: Executive reads 3 bullets per source, understands context
2. Trust: Full provenance still there if they want to verify
3. Cognitive load: "Give me the essence" before "here's everything"
4. Alignment with cabinet briefing model: ministers give opinions (summary), then back it up with evidence (full data)

## Implementation

Backend: Summary generation
- Call Claude with SUMMARY_TEMPLATES[source_type] + source_payload
- Use claude-haiku-4-5 (fast + cheap)
- Max 150 tokens per summary
- Timeout <1s

Frontend: Render pattern
- SourceCard with Summary component
- Expandable "Full Data" section
- Collapse/expand controls per source

## Summary Template Examples

FEC Filing:
- Amount and purpose
- Filer ID and committee name
- Primary target (candidate, referendum)
- Timeline (filed date, effective date)

Polymarket:
- Price change and direction
- Implied probability
- Volume and liquidity
- Timeframe

News Article:
- Headline (1 line)
- Key quote (1 sentence)
- Publication and date

GDELT Event:
- Event type (protest, policy announcement, M&A signal)
- Location and date
- Tone (positive/negative/neutral)

## Acceptance Criteria

- Each source shows 1-3 bullet summary at top
- Full provenance is collapsible below
- Summary prompt is optimized per source type
- Claude summary takes <1s to generate
- Fallback to template if Claude fails
- User can collapse/expand per source independently

Related: thinking-foundry#31, thinking-foundry#37, thinking-foundry#42

=== ISSUE #45 ===
FR-ARCH-2: Multi-Turn Briefing Room — 5-minister cards, iterative turns, per-turn updates

# FR-ARCH-2: Multi-Turn Briefing Room — 5-minister cards, iterative turns, per-turn updates

**Status:** CANONICAL (v2 — rewritten 2026-04-09 to match cabinet briefing architecture)
**Supersedes:** Original 6-minister draft (SWOT merged into Knowledge per #45 reconciliation)
**See also:** #31 (Master FSD), #47 (UI layout + wireframe), #52 (3-knob weighting), #53 (Minister current position), #55 (Turn-state mechanics)

---

## What This Issue Owns

The **multi-turn briefing interaction model** — how the Chief runs a Convergence session across multiple turns, how input cards work, how each turn updates the ministers' current positions, and how the session concludes via the Foundry gate.

This issue is NOT about layout (that's #47) or weighting (that's #52) or the Foundry gate itself (that's #51). It owns the **turn mechanics** and **input curation**.

---

## The Canonical 5 Ministers

All Convergence sessions use exactly these five ministers (no more, no less):

1. **Knowledge Minister** — tenant's private docs, SWOT, uploaded files, prior briefings
2. **Markets Minister** — Polymarket + Kalshi + any future prediction markets
3. **News Minister** — NewsAPI, GDELT (when live), wire feeds
4. **Narrative Minister** — Podscan, interviews, discourse signals
5. **Data Minister** — FEC, FCC, Regulations.gov, OpenStates, government APIs

SWOT is NOT a separate minister. It is folded into Knowledge. This is locked per #49.

---

## Turn Structure

### Turn 0 — Question Framing
- Chief enters the question (voice or text)
- System parses into topic profile (entities, timeframe, domain tags)
- Chief reviews/edits the parse
- Chief hits **Run Briefing**

### Turn 1 — Initial Briefing
Each of the 5 ministers:
- Pulls relevant signals from their sources
- Produces a **Current Position** (1-2 sentence advisory — see #53)
- Surfaces evidence rows (facts, not interpretations)
- Declares its own **Data Sufficiency** (low / medium / high — see #58)

Result renders in the two-column layout (#47):
- Left: 5 minister cards with current position + evidence
- Right: dashboard meters + 3-knob weighting sliders (#52)
- Bottom-right: Chief's Global View + **Conclude Briefing** button

### Turn 2+ — Iterative Refinement
The Chief can:
- **Add a document** → Knowledge minister re-pulls, updates its position
- **Ask a follow-up** → all ministers re-evaluate against the new angle
- **Toggle a source off** → minister recomputes without it, sufficiency drops
- **Adjust weighting knobs** (#52) → doesn't re-pull data, changes how the Global View weights minister positions
- **Upload a transcript or paste raw text** → flows into Knowledge

Each turn is a **collapsible history entry**. Prior turns remain visible but condensed. The Chief can expand any previous turn to see what the minister said at that point.

### Turn N — Conclusion
When the Chief is satisfied, they click **Conclude Briefing**. This triggers the **Foundry Synthesis Gate** (#51), which runs MINE → SCOUT → ASSAY → CRUCIBLE → AUDITOR → PLAN over the weighted minister positions and produces a final decision brief.

The Foundry gate is the ONLY place where a synthesized, Chief-ready recommendation is produced. No auto-synthesis mid-turn.

---

## Input Card Layer

Before Turn 1 and between any two turns, the Chief sees an **Input Rack** — one card per minister, plus dynamic cards for uploaded material:

**Card: Knowledge**
- Uploaded documents (click to add more)
- Relevant SWOT items auto-surfaced
- Toggle individual items in/out

**Card: Markets**
- Shows currently-subscribed Polymarket/Kalshi markets for the topic
- Toggle individual markets
- Chief can paste a market URL to add one

**Card: News**
- Default: NewsAPI on the topic
- Toggle sources on/off

**Card: Narrative**
- Default: Podscan relevant episodes
- Toggle on/off (defaults off if no Podscan data)

**Card: Data**
- FEC / FCC / Regulations.gov queries relevant to the topic entities
- Toggle individual queries

**Card: + Add Signal**
- Upload file, paste text, link URL
- Goes to Knowledge by default, Chief can reassign

---

## Anti-Hallucination Rules (Inherits from #31)

Every minister output must:
- State its data sufficiency honestly ("I have 2 data points on this")
- Cite every claim back to a source row
- Say "I don't have enough to speak on this" when sufficiency is low
- NOT invent scenarios, NOT predict outcomes, NOT give scalar probabilities

Per-minister sufficiency scores are ALLOWED (#39 reconciliation).
System-wide outcome probability is FORBIDDEN (Design Principle 0).

---

## Acceptance Criteria

- [ ] Exactly 5 minister cards, matching canonical list
- [ ] Each turn produces a new current position per minister (#53)
- [ ] Prior turns collapse into history, can be re-expanded
- [ ] Input rack lets Chief add/remove sources before any turn
- [ ] 3-knob weighting per minister (#52) affects Global View, not minister internal logic
- [ ] Concluding the briefing triggers the Foundry gate (#51)
- [ ] No auto-synthesis — Chief must explicitly conclude

---

## What This Issue Replaces

The original draft of this issue had 6 minister cards (SWOT was a separate card), no weighting mechanism, no Foundry gate, and assumed one-shot running. All of that is superseded by this rewrite.

=== ISSUE #47 ===
FR-ARCH-3: Three-Column Layout — Sessions Sidebar (open) + Turn Discussion + Dashboard

# FR-ARCH-3: Three-Column Layout — Sessions Sidebar + Turn Discussion + Dashboard

**Status:** CANONICAL (v4.1 — 2026-04-09, expanded sidebar with Recent + Favorites)
**Supersedes:** v3 four-column (removed redundant minister cards column, added persistent session list)
**Owns:** Canonical Convergence UI layout and wireframe
**See also:** #31, #42, #45, #47, #51, #52, #53, #58, #61 (Session Persistence)

---

## The Three-Column Model

The Convergence workspace has a persistent **three-column structure** inspired by ChatGPT's conversation list:

| Column | Width | Purpose |
|---|---|---|
| **1 (left)** | ~20–25% width | **Sessions Sidebar (open by default)** — shows Recent sessions and Favorites. Collapsible/expandable via hamburger. Chief can quickly jump to any past Convergence. |
| **2–3 (middle)** | ~50–60% width | **Turn Discussion** — the unfolding multi-turn briefing with collapsible turn cards. |
| **4 (right)** | ~15–20% width | **Dashboard** — scrollable, all-in-one. Current positions + per-minister metrics + Global View. |

---

## Sessions Sidebar (Col 1) — Open by Default

The sidebar is **expanded by default**, not collapsed. It shows:

### Section: Recent
- **Subheading:** "Recent Convergences"
- Scrollable list of the last 5–10 sessions (or all sessions from this week)
- Each item shows:
  - **Session title** (auto-generated from Chief's initial question, e.g., "Should we launch Q4 product")
  - **Last accessed timestamp** (e.g., "14 min ago", "Yesterday at 2 PM", "Last Monday")
  - **Turn count** badge (e.g., "3 turns")
  - **Status indicator** (active = blue dot, concluded = checkmark, paused = pause icon)

### Section: Favorites
- **Subheading:** "Favorite Convergences" (collapsible)
- Sessions the Chief has marked as important for future reference
- Same format as Recent, but pinned to the top of col 1

### Bottom of sidebar:
- **[+ New Convergence]** button — starts a fresh session

### Collapse toggle:
- **Hamburger/chevron icon** (top-left of sidebar) — collapses col 1 to a narrow icon-only rail (same icons used in Recent/Favorites, plus [+])
- Clicking again expands it back to full text view
- **Hover states** when collapsed: tooltips show full session titles

---

## Why Open by Default (Chief's Feedback)

> "Have it open so we can see recent and favorites and stuff like that."

An open sidebar makes it easy for the Chief to:
- See at a glance what sessions exist and when they were last touched
- Jump to a recent session without a click + expand + scroll
- Build context of what Convergences have been run
- Flag favorites for quick access later

Collapsed-by-default was wrong — the sidebar is a core navigation element, not an advanced feature.

---

## ASCII Wireframe (Canonical)

```
┌────────────────┬─────────────────────────────────────────────────┬──────────────┐
│                │                                                   │              │
│ 🆕 New Conv    │ ┌──────────────────────────────────────────────┐│ 📚 KNOWLEDGE │
├────────────────┤ │ Convergence — Cabinet Briefing Turn 3 of 3 [+]││ ├────────────┤
│ RECENT         │ │ Chief's question: Should we launch the new   ││ │ Delay Q1...│
├────────────────┤ │ product line before end of Q4?               ││ ⊕ Data Suff.│
│ ⚫ Should we    │ │ [ Edit ] [ Add document ] [ Ask follow-up ]  ││   ██▓  78%  │
│   launch Q4... │ │                                                ││ ⊕ Momentum  │
│   Turn 3       │ ├──────────────────────────────────────────────┤│   ▲▲  ↑2   │
│   14 min ago   │ │ ▼ TURN 3  (just now)                          ││ ⊕ Credibility
│                │ │                                                ││   ███ High  │
│ ⚫ Budget spike │ │ Chief: "We got the team capacity report. Re-  ││              │
│   analysis     │ │ run with this in mind. What changes?"          ││ ─ 3-KNOB ─   │
│   Turn 2       │ │                                                ││ [controls]   │
│   Yesterday    │ │ 📚 Knowledge: "Capacity confirms engineering  ││              │
│                │ │    at 110%. Q4 launch pulls platform work.    ││ [ ... more   │
│ ⚫ Competitive  │ │    Delay to Q1 keeps both in scope."          ││   ministers] │
│   pricing      │ │                                                ││              │
│   Turn 1       │ │ 📈 Markets: "No change — competitor still 67% ││              │
│   Last Monday  │ │    likely to launch first."                    ││ ═════════════│
├────────────────┤ │                                                ││ GLOBAL VIEW  │
│ FAVORITES      │ │ 📰 News: "Competitor CEO on CNBC hinting Nov  ││              │
├────────────────┤ │ launch. Low confirmation."                     ││ Cabinet:     │
│ ⭐ Q4 product  │ │                                                ││ 3 for delay  │
│    (recurring) │ │ 🎙 Narrative: "2 of 3 industry podcasts expect││ 2 neutral    │
│   Strategy     │ │ competitor Q4 launch."                         ││              │
│   conversations│ │                                                ││ ⚠ Tension:   │
│                │ │ 📊 Data: "Sufficiency +15%. No new FEC/FCC."  ││ Markets vs   │
│ ⭐ Budget      │ │ └──────────────────────────────────────────────┘│ Knowledge    │
│   cycles (2x   │ │                                                ││              │
│   per year)    │ ├──────────────────────────────────────────────┤│ [CONCLUDE]   │
│                │ │ ▶ TURN 2  (14 min ago)                        ││ [BRIEFING]   │
│                │ │   Chief: "What if we wait until Q1?"          ││              │
│                │ └──────────────────────────────────────────────┘│              │
│                │                                                   │              │
│                │ ┌──────────────────────────────────────────────┐│              │
│                │ │ ▶ TURN 1  (28 min ago)                        │└──────────────┘
│                │ │   Chief: "Should we launch before end of Q4?"│
│                │ └──────────────────────────────────────────────┘
│                │
│                │ [ + New turn ]
│                │
└────────────────┴─────────────────────────────────────────────────┴──────────────┘
```

---

## Column-by-Column Spec

### Col 1 — Sessions Sidebar (OPEN BY DEFAULT)

**Structure:**
- **Top button:** [+ New Convergence] — starts a fresh session
- **Recent section** — scrollable list of recent sessions (last 5–10 or this week)
  - Sort: most recently accessed first
  - Each item: title + timestamp + turn count + status indicator
  - Click any item → load that session's history in cols 2–3
- **Favorites section** — collapsible header, sessions marked ⭐
  - Same format as Recent
  - These are sessions the Chief wants easy access to for ongoing reference (e.g., "Q4 product strategy", "Budget cycles")
  - Click the ⭐ icon on any session to add/remove from Favorites
- **Collapse button** (top-left of sidebar, or right-side of sidebar header)
  - Icon: hamburger ☰ or chevron <<
  - Collapses col 1 to icon-only rail
  - Hover states show tooltips with session titles

**Behavior:**
- Sidebar is **open by default** on desktop (not collapsed)
- On narrow viewports, sidebar **collapse by default** (space constraint)
- Clicking a session loads that session's full turn history
- The current session is highlighted (darker background or bold title)

### Cols 2–3 — Turn Discussion (Main Content)

- **Wide center area** (~50–60% width)
- Each turn is a collapsible card, newest-first
- Expanded turn shows: Chief's prompt + 5 minister responses
- Collapsed turn shows: turn number + timestamp + 1-line Chief summary
- **Bottom:** [+ New turn] button

**This is where the Chief reads the conversation.**

### Col 4 — Dashboard (Scrollable Right Sidebar)

- **Narrow right sidebar** (~15–20% width)
- **Top:** Current position summaries (1–2 lines per minister, scrollable)
- **Below:** Per-minister panels (sufficiency/momentum/credibility + 3-knob weighting per minister)
- **Bottom:** Chief's Global View + [CONCLUDE BRIEFING] button

---

## Update Mechanics

When Chief runs a new turn:
1. **Col 1:** Session's timestamp updates to "just now" or "a few seconds ago"
2. **Cols 2–3:** New turn card slides in at the top
3. **Col 4:** Metrics recompute, weighting sliders persist (not reset)

When Chief clicks a session in col 1:
1. Cols 2–3 load that session's full turn history
2. Col 4 updates to show that session's latest minister positions + weighting state
3. The session becomes the "active" session
4. [+ New turn] at the bottom of cols 2–3 now adds to this session (continuing the conversation)

---

## Session Favorites

- **Mark as favorite:** Click ⭐ icon on any session item
- **Visual indicator:** ⭐ or filled star indicates a favorite
- **Persistent:** Favorite state is saved to Supabase (next time Chief opens the app, favorites are still there)
- **Use case:** "Budget cycles" and "Q4 product strategy" are recurring briefing topics; favoriting them makes them easy to find

---

## Mobile / Narrow-Viewport Behavior

On mobile or narrow viewports (<900px):
- Col 1 collapses by default (to icon-only rail, not hidden)
- Click hamburger → col 1 expands as an overlay drawer on the left
- Cols 2–3 expand to fill most of the width
- Col 4 becomes a tab toggle: "Chat" (shows cols 2–3) / "Dashboard" (shows col 4)
- Prioritizes the turn discussion — the conversation is the hero

---

## What This Replaces

- v3 four-column (removed redundant minister cards column, added session sidebar)
- v4.0 collapsed sidebar (now OPEN by default with Recent + Favorites sections)

## Acceptance Criteria

- [ ] Col 1 sidebar open by default on desktop, collapsed by default on mobile
- [ ] Recent section shows last 5–10 sessions, sorted by accessed time DESC
- [ ] Favorites section shows marked-favorite sessions, pinned above Recent
- [ ] [+ New Convergence] button at top of sidebar
- [ ] Click any session → loads full turn history in cols 2–3
- [ ] Current session is visually highlighted
- [ ] ⭐ icon toggles favorite status (persisted to Supabase #61)
- [ ] Hamburger/chevron collapses sidebar to icon rail; hover shows tooltips
- [ ] Weighting sliders persist across turn updates
- [ ] Mobile fallback: sidebar collapses by default, overlay on click

---

## Dependency

This issue depends on **#61 (Session Persistence Infrastructure)** for:
- Session list queries (`GET /api/convergence/sessions`)
- Session load queries (`GET /api/convergence/sessions/{id}`)
- Favorite toggle (`POST /api/convergence/sessions/{id}/favorite`)

Can proceed in parallel with #61 design, but cannot launch without it.

=== ISSUE #88 ===
UX: Fast-Track Conclude — The Inverted Funnel Option

## Source
Crucible debate: 'Designing AI cabinets for executive speed'

## The Problem

The current architecture forces a mandatory multi-turn reading journey before the Chief reaches the synthesis. The underlying logic is sound — earn the conclusion through engagement with raw intelligence. But this model incorrectly assumes the executive has unlimited time and patience.

The actual behavior in high-pressure environments: Chief hits Conclude on Turn 1, skips all minister cards, gets a synthesis built on no context calibration.

This is the worst of all worlds: the anti-oracle principle is violated (Chief gets a raw conclusion without understanding) AND the multi-turn architecture's value is completely subverted.

---

## The Fix: Inverted Funnel

> 'Introduce a fast-track conclude option. The initial prompt from the user immediately yields a drafted Foundry decision brief based on default intelligence weightings. The user gets to read the synthesis first. The executive can dig backward into specific minister turns only if they want to challenge findings or verify a data point.'

### The Inversion

Current funnel (prerequisite model):
Turn 1 → Turn 2 → Turn 3 → ... → Conclude → SYNTHESIS

Inverted funnel (synthesis-first model):
Prompt → SYNTHESIS DRAFT → Minister cards on demand (audit trail)

### How This Works

1. Chief enters a question or decision statement
2. System immediately runs Foundry Synthesis Gate with default weights
3. Chief sees a draft synthesis brief upfront — the headline conclusions, the top tension
4. Minister cards are available below, collapsed by default
5. Chief expands only the minister cards they want to interrogate
6. If they adjust weights (via sliders or intent-based language), system updates the synthesis in real time
7. Chief confirms the brief when satisfied

### Why This Works

> 'This aligns perfectly with how an executive consumes a complex white paper or a consulting deck. They read the executive summary at the beginning and only dive into the methodology in the appendix if the conclusion seems off or requires further scrutiny.'

The multi-turn architecture then serves as an **accessible audit trail** rather than a **mandatory prerequisite**. The Chief who wants depth gets it. The Chief who needs the conclusion in 90 seconds gets that too.

---

## Design Principle Alignment

The anti-oracle principle is preserved: the synthesis-first brief still exposes tensions rather than collapsing to a single answer. What changes is the access sequence, not the content.

Design Principle 2 (Decision Liability) is also preserved: the Chief still sets editorial weights (explicitly or by accepting defaults). Accepting defaults is itself an editorial choice — it means 'I trust the system's baseline weighting for this decision.'

---

## Two Modes in Practice

| Mode | When | Flow |
|---|---|---|
| Standard (current) | Deep deliberation, high-stakes, lots of time | Multi-turn → Conclude |
| Fast-Track | Time pressure, quick orientation, return visits | Instant synthesis → drill down on demand |

A toggle or session-level preference could control which mode is default. Or the system could infer from session context (first visit = standard, return visit = fast-track).

---

## Open Question

Does fast-track mode create sycophancy risk? If the Chief sees a synthesis first, they may anchor to it and not genuinely challenge it when drilling into minister cards. The Flash Tension Banner (issue #87) partially mitigates this — it flags contradictions even when the Chief is reading the synthesis-first brief.

## Related
- Flash Tension Banner: #87
- Zero-sum slider problem: #85
- FSD: #31

