# The Thinking Foundry — Complete System

**The Thinking Foundry is a structured thinking process for founders and decision-makers.** 8 phases plus AutoResearch loop. Outputs a bulletproof FSD (Functional Specification Document) ready for the Software Foundry to build.

---

## Structure at a Glance

```
PHASE 0: USER-STORIES
    ↓ Ratify Gate
PHASE 1: MINE — Raw firehose of ideas
    ↓ Ratify Gate
PHASE 2: SCOUT — Research & possibilities
    ↓ Ratify Gate
PHASE 3: ASSAY — Evaluate & spec
    ↓ Ratify Gate
PHASE 4: CRUCIBLE — Stress-test assumptions
    ↓ Ratify Gate
PHASE 5: AUDITOR — Quality check & confidence score
    ↓ Ratify Gate
PHASE 6: PLAN — Create clear action plan
    ↓ Ratify Gate
PHASE 7: VERIFY — Summarize & confirm
    ↓
[AUTORESPONSE LOOP — PLANNED] ← Validate thinking improvements (Karpathy pattern)
    ↓
FSD APPROVAL GATE ← User explicitly approves decision
    ↓
Ready for Software Foundry to build
```

---

## File Guide

| Phase | Duration | Input | Output |
|-------|----------|-------|--------|
| **00-user-stories** | 5-10 min | Raw problem statement | Structured user stories |
| **01-mine** | 30-60 min | User stories | Raw idea dump, firehose |
| **02-scout** | 1-4 hrs | Ideas | Research findings, competitive intel |
| **03-assay** | 2-10 days | Research + ideas | Evaluated options, spec draft |
| **04-crucible** | 1-3 days | Spec draft | Stress-tested, validated FSD |
| **05-auditor** | 30-60 min | FSD | Confidence score, quality check |
| **06-plan** | 1-2 hrs | Validated FSD | Action plan, next steps |
| **07-verify** | 15-30 min | Plan | Final summary, confirmation |

---

## Key Concepts

### Ratify Gates
Between every phase, a forced cognitive mode switch: stop thinking, start scrutinizing.
- **Hard Gate:** Confidence ≥ 8/10 to proceed. Below that = go back and rethink.
- **Soft Gate:** Confidence ≥ 6/10 to proceed. Flag concerns, document unresolved.

### CRUCIBLE (Phase 4)
Adversarial stress-test of your thinking via NotebookLM debate or live conversation.
- Your assumptions vs. critic's challenges
- What breaks? What holds?
- This is where weak thinking gets exposed early

### AUDITOR (Phase 5)
Quality check. "Did we actually think this through, or did we just feel productive?"
- Confidence score (1-10)
- What's still unknown?
- What should we validate before committing?

### AutoResearch (TBD)
**Planned:** After VERIFY, before FSD Approval Gate

Karpathy's experimental loop adapted for thinking:
- Run thought experiments
- Test assumptions
- Keep ideas that prove valuable
- Discard ones that don't
- Iterate for 1-3 days
- Then finalize FSD

---

## Frameworks in Thinking Foundry

The Thinking Foundry includes 8 deep thinking frameworks available throughout:

1. **Y Combinator** — Startup growth, PMF, founder advice
2. **Hormozi** — Monetization, acquisition, scaling
3. **IndyDev Dan** — Development methodology, AI patterns
4. **IDEO** — Design thinking, user empathy
5. **Lean** — MVP, validated learning, pivots
6. **Stoicism** — Decision-making, resilience, virtue
7. **McKinsey** — (data-driven strategy)
8. **Nate B. Jones** — (specialized expertise)

These are semantic-searchable in Supabase. During phases, relevant frameworks are injected based on your constraints (budget, timeline, pain points).

---

## Modes

The Thinking Foundry adapts to different thinking contexts:

| Mode | Duration | Example |
|------|----------|---------|
| **PRODUCT DECISION** | 2-4 days | "Should we build X feature?" |
| **STRATEGIC CHOICE** | 1-2 weeks | "Which market should we enter?" |
| **PERSONAL DECISION** | 1-3 days | "Should we move?" or "School choice?" |
| **BUSINESS PROBLEM** | 3-5 days | "How do we reduce churn?" |
| **QUICK DECISION** | 2-4 hours | "Go/no-go for this opportunity?" |

---

## Inputs & Outputs

### What You Bring
- A problem, decision, or opportunity
- Raw thoughts (messy is fine)
- Time commitment (varies by mode)
- Openness to challenge

### What You Get
- **Bulletproof FSD** — specification so clear that Software Foundry can build it mechanically
- **Assumption Table** — what you're confident about, what you're guessing
- **Decision Record** — documented rationale, alternatives considered, decisions made
- **Action Plan** — specific next steps with owners and timelines
- **Confidence Score** — how certain you are that this is the right move

---

## FSD Approval Gate

After VERIFY + AutoResearch completes:
- User reviews the final FSD
- Makes decision: **"YES, build this"** or **"No, rethink"**
- If YES → FSD goes to Software Foundry with explicit approval
- This is the handoff point between thinking and building

---

## IT Concierge Learnings (Integrated)

The Thinking Foundry was validated through early sessions. Improvements discovered are being integrated:
- Better constraint extraction for research dispatch
- Framework relevance validation (semantic search improving)
- Session persistence across phases
- Knowledge base integration timing

---

## Starting a Thinking Foundry Session

(Implementation in progress)

Currently: Manual phase progression through Gemini Live prompts
Future: Automated phase transitions with framework injection, constraint tracking, research dispatch

---

## Questions?

- Full phase details: Read individual phase files (01-mine.md, etc.)
- Framework details: See `/docs/04-technical/FRAMEWORKS.md`
- Knowledge base: See `/docs/05-planning/SUPABASE-SETUP.md`
- Implementation: See `poc/prompts/` for current prompts

---

**Status:** 7 phases complete, AutoResearch loop pending design
**Last Updated:** 2026-03-30
