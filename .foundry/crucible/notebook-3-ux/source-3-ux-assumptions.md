# UX & Product Assumptions Under Test — Convergence

This document contains 22 UX assumptions about the Convergence product. Each assumption is rated by confidence level. The purpose of this document is to serve as a stress-test target: the NotebookLM hosts should challenge these assumptions using the other sources in this notebook.

## The Product Under Test

Convergence is a 5-minister AI cabinet briefing engine for executives making high-stakes decisions. Five specialist AI "ministers" (Knowledge, Markets, News, Narrative, Data) brief in parallel from authoritative data sources. The executive ("Chief") adjusts dual-level zero-sum weights across ministers and per-minister concerns (15+ total sliders). A Synthesis Gate maps tensions and contradictions. The product NEVER recommends — it exposes the intelligence stack and makes the Chief decide.

## Critical UX Assumptions (Below 35% Confidence)

### U-005: Dual-Level Weighting (30%)
**Claim:** The dual-level weighting system (5 master minister sliders + 3 per-minister concern knobs = 15+ total controls) will not overwhelm users and will feel like meaningful editorial control.
**Counter-evidence:** No usability testing. Most analytics products with >5 controls see >70% of users ignore all but the default. Bloomberg Terminal is the exception but requires months of training.

### U-009: Fresh Eyes Reset (28%)
**Claim:** Users will proactively use "Fresh Eyes Reset" to counter confirmation bias accumulation across multi-turn sessions.
**Counter-evidence:** Sycophancy is invisible to the user experiencing it. Users do not recognize when an AI has learned their preference and stopped challenging them. Fresh Eyes Reset requires metacognitive awareness that most users lack under time pressure.

### U-014: Weight Adjustment Usage (30%)
**Claim:** Executives will actually adjust master minister weights and/or per-minister knobs rather than accepting defaults for the entire session.
**Counter-evidence:** This is the product's core moat (Design Principle 1: Chief's Hidden Context). If the compensation mechanism is never activated, the product is architecturally identical to a single-model summarizer.

### U-008: Fast-Track Cannibalization (35%)
**Claim:** Fast-Track Conclude (synthesis-first mode) will not cannibalize the full multi-turn briefing experience.
**Counter-evidence:** Time-pressed executives will optimize for speed. If Fast-Track exists, it becomes the dominant mode. Users who read synthesis first and minister cards second are anchored by the synthesis — the exact opposite of the product's epistemic design.

### U-017: Accountability Language (35%)
**Claim:** The accountability statement at conclusion ("What follows is not advice. It's a map of signals. The call is yours.") will be read and internalized.
**Counter-evidence:** Cookie banner effect. Legal/disclaimer text is universally ignored. The statement adds zero epistemic value if it becomes invisible boilerplate.

### U-021: Multi-Turn Engagement (35%)
**Claim:** Executives will run multi-turn sessions (3+ turns) rather than concluding after Turn 1.
**Counter-evidence:** The entire briefing architecture requires engagement to deliver value. But the Conclude button is available from Turn 1. Time-pressed executives take the shortest path.

## High-Risk UX Assumptions (35-50% Confidence)

### U-001: Cabinet Metaphor (42%)
Users will understand the "5 ministers briefing the Chief" metaphor without training.

### U-002: WEP Labels (45%)
Non-IC executives will correctly interpret HIGHLY LIKELY / LIKELY / ROUGHLY EVEN / THIN / SILENT labels (Intelligence Community standard) without anchoring on them as probabilities.

### U-003: Wait Tolerance (38%)
A 3-5 minute full fan-out wait is acceptable to time-pressed executives. Competitor benchmarks: Perplexity ~30s, ChatGPT near-instant.

### U-006: Single Signal Warnings (40%)
"Single Signal" warning cards (yellow border, explicit caveat) will be taken seriously and reduce over-reliance on thin intelligence.

### U-007: Flash Tension Banner (48%)
The Flash Tension Banner (mid-turn contradiction alert) will drive users to read both conflicting minister cards rather than clicking "Proceed anyway."

### U-010: Anti-Oracle Stance (44%)
The anti-oracle stance (never recommending, only exposing contradictions) will be experienced as empowering rather than frustrating by executives who expected a recommendation.

### U-011: Chief of Staff Clarity (42%)
The optional Chief of Staff meta-synthesis layer will add value without confusing users about the difference between CoS (informal, mid-session) and Conclude Briefing (formal, gates synthesis).

### U-020: Type A/B Classification (40%)
The Type A (reversible) / Type B (irreversible) decision classification will cause executives to modulate their evidence standards appropriately.

## Moderate-Risk UX Assumptions (50-60% Confidence)

### U-004: Progressive Rendering (55%)
Progressive rendering (minister cards appearing one-by-one) will feel like "advisors arriving" not a janky incremental load.

### U-012: Source Count Calibration (58%)
Source counts ("3 agree, 1 contradicts") with WEP labels give sufficient epistemic calibration. Highest confidence UX assumption — still below 60%.

### U-013: Three-Column Layout (52%)
Three-column layout (sessions sidebar + turn discussion + dense dashboard) is appropriate for executive cognitive load on standard desktop.

### U-015: Signal Hardness Coding (48%)
Visual coding (sharp/tabular for Hard Intelligence, soft/rounded for Ambient) understood subconsciously without explanation.

### U-016: Decision Statement Input (55%)
"What decision are you making?" forced framing will elicit decision-framed queries from executives accustomed to search-bar patterns.

### U-018: Wait Time Framing (50%)
"Gathering intelligence. Take a break." status copy will frame the 3-5 min wait as thorough analysis rather than broken software.

### U-019: SILENT As Feature (52%)
SILENT minister cards recognized as meaningful signal ("my advisor has no view here") not product failure.

### U-022: Session History Value (48%)
The persistence layer (position history, weighting snapshots, session archive) provides meaningful retrospective value to executives, not just compliance backend.

## The Central Question

Does the product work for its target user — a time-pressed executive who makes 5-15 high-stakes decisions per week — or does the architectural sophistication (15+ controls, 5 ministers, multi-turn sessions, anti-oracle stance) create a product that is intellectually rigorous but experientially unusable?
