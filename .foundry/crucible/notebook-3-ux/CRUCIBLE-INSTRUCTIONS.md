# CRUCIBLE — Notebook 3: UX & Product Viability

**Domain:** Does the product actually work for its target user?
**Avg Assumption Confidence:** 41% (lowest of 3 notebooks)
**Risk Level:** EXISTENTIAL — if the UX doesn't work, the architecture is irrelevant

---

## Sources to Upload (Min 3 Required — We Have 5)

1. `source-1-fsd.md` — The full FSD (our product claims)
2. `source-2-proof-report.md` — 37-step persona walkthrough with 7 gaps found
3. `source-3-ux-assumptions.md` — 22 UX assumptions with confidence scores and counter-evidence
4. `ux-issues-bundle.md` — 15 UX-related GitHub issues (the detailed spec work)
5. `source-4-external-ground-truth.md` — (awaiting agent) External UX research on executive decision-support tools

---

## Phase 1: Chat Queries (Run 5-7 Before Audio)

**Rule:** Neutral framing. Do NOT assign positions to the hosts. Let the sources drive the debate.

### Query 1 (Anchoring)
"What is Convergence and who is it designed for? Summarize the product's core value proposition and target user."

### Query 2 (Slider Fatigue)
"The product has 15+ slider controls (5 master minister weights plus 3 per-minister concern knobs). What does the UX research suggest about executive tolerance for this level of control complexity in decision-support tools?"

### Query 3 (Wait Tolerance)
"Convergence requires a 3-5 minute wait for full intelligence fan-out. How does this compare to user expectations set by tools like Perplexity (30 seconds) and ChatGPT (near-instant)? What does the assumption table say about this?"

### Query 4 (Anti-Oracle Tension)
"The product deliberately refuses to recommend. It exposes contradictions and makes the executive decide. The assumption table rates this at 44% confidence. What evidence exists that executives will find this empowering rather than frustrating?"

### Query 5 (Fast-Track Cannibalization)
"Fast-Track Conclude lets users skip to the synthesis without engaging with individual ministers. The proof report shows this is a P1 feature. But assumption U-008 says it may destroy the multi-turn moat. Walk me through both sides of this tension."

### Query 6 (First-Turn Abandon)
"Assumption U-021 claims executives will run 3+ turns per session. But the Conclude button is available from Turn 1. Given the target persona's time pressure (30-min windows between meetings), what percentage of sessions would you expect to be single-turn?"

### Query 7 (Weight Adjustment Reality)
"Design Principle 1 says the Chief's Hidden Context (expressed through weight adjustments) is the core moat. But assumption U-014 rates this at 30% confidence — users may never touch the sliders. If the compensation mechanism is never activated, is Convergence architecturally different from Perplexity?"

---

## Phase 2: Audio Debate Generation

**Instructions for NotebookLM audio generation (NEUTRAL — do not assign positions):**

"Generate an audio discussion between two hosts about whether the Convergence product's UX design will actually work for time-pressed executives. The sources include a product specification, a persona walkthrough, 22 UX assumptions with confidence ratings, and UX research. Focus on: (1) whether 15+ sliders is too many controls, (2) whether 3-5 minute waits are acceptable, (3) whether the anti-oracle stance will frustrate or empower, (4) whether Fast-Track Conclude will cannibalize the multi-turn experience, and (5) whether the accountability language will be read or become invisible boilerplate. Let the evidence from the sources drive the discussion."

---

## Phase 3: Transcribe + Extract Findings

After audio debate:
1. Transcribe the full audio
2. Extract every specific claim the hosts make
3. Cross-reference against the 22 assumptions
4. For each assumption: did the debate CONFIRM, CHALLENGE, or SPLIT?
5. Update confidence scores based on debate evidence
6. Document any NEW concerns the hosts raised that aren't in the assumption table

---

## Success Criteria

The CRUCIBLE passes when:
- [ ] All 7 chat queries return substantive responses (not generic)
- [ ] Audio debate covers all 5 focus areas
- [ ] Each of the 6 critical assumptions (U-005, U-008, U-009, U-014, U-017, U-021) has a clear CONFIRM/CHALLENGE/SPLIT verdict
- [ ] Any assumption that DROPS below 25% after debate triggers a design revision
- [ ] Any NEW existential concern is captured as a GitHub issue
