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
AUTORESEARCH — Validate reasoning with real-world data (Karpathy pattern)
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

### AutoResearch (Karpathy Experimental Loop)
**Placement:** After VERIFY (Phase 7), before FSD Approval Gate

Karpathy's experimental loop adapted for structured thinking. While the Software Foundry's AutoResearch validates code with runtime experiments, the Thinking Foundry's AutoResearch validates reasoning with real-world data.

#### The Pattern

```
program.md (research protocol)  ← Human writes what to investigate
       ↓
   Agent Loop                   ← Agents research autonomously
       ↓
   Results + Signal             ← Each cycle MUST produce new signal or terminate
       ↓
   Ratchet Decision             ← Strengthen conclusions that hold, revise those that don't
       ↓
   Repeat or Terminate          ← Max iterations: 5 (thinking) or 3 (quick decisions)
```

#### How It Works in the Thinking Foundry

1. **Write `program.md`** — research questions derived from the VERIFY phase output:
   ```markdown
   # AutoResearch Protocol — [Decision Name]

   ## Questions to Validate
   1. Is the €50K market assumption correct? (competitor pricing research)
   2. Do users actually switch tools for this pain point? (churn data)
   3. Is the 3-month timeline realistic for this scope? (comparable launches)

   ## Research Methods
   - [ ] Web search: competitor pricing pages, G2 reviews, Crunchbase funding
   - [ ] Knowledge base: query Supabase for similar decisions in frameworks
   - [ ] Market data: TAM/SAM/SOM calculation with real numbers
   - [ ] Expert precedent: what did YC/Hormozi/McKinsey say about similar situations?

   ## Terminate If: No new signal after 2 cycles
   ## Max Iterations: 5
   ```

2. **Agent Research Loop** — each cycle:
   - Pick highest-priority unanswered question
   - Run real research (web search, knowledge base queries, competitor analysis)
   - Record findings in `findings.md` (append-only)
   - Assess: did this change our confidence in the FSD?

3. **Ratchet Rule** — findings accumulate, never regress:
   - Conclusions that hold up under research → confidence increases
   - Conclusions that break under data → flag for FSD revision
   - 2 cycles with no new signal → terminate (don't manufacture busy work)

4. **Synthesis** — AutoResearch Report:
   - Which assumptions were validated? (confidence UP)
   - Which assumptions were invalidated? (FSD needs revision)
   - Which remain untested? (acknowledged risk in FSD)
   - Confidence delta: pre vs post AutoResearch

#### Supabase Knowledge Base Integration

The Thinking Foundry's knowledge base (8 frameworks in Supabase with semantic search) is a primary research tool during AutoResearch. Each cycle can query the knowledge base with constraint-matched queries:

```
Cycle question: "Is our pricing model viable?"
  → Query Supabase: framework=hormozi, constraint=pricing, context=[user's budget+market]
  → Returns: Hormozi's pricing principles matched to THIS user's situation
  → Signal: Hormozi says "price on value not cost" — our cost-plus model conflicts

Cycle question: "Is 3 months realistic for MVP?"
  → Query Supabase: framework=yc, constraint=timeline, context=[scope+team_size]
  → Returns: YC data on comparable MVP timelines
  → Signal: YC says "if it takes > 6 weeks, scope is too big" — we need to cut
```

**Knowledge base query pattern:**
1. Extract the assumption being tested
2. Identify which framework(s) have relevant wisdom
3. Include the user's specific constraints as query context
4. Compare framework recommendation vs our conclusion
5. Record agreement/conflict in findings.md

**Available frameworks for research dispatch:**
| Framework | Best For |
|-----------|---------|
| YC | Timeline, PMF, MVP scope, fundraising |
| Hormozi | Pricing, acquisition, scaling, offer design |
| McKinsey | Market sizing, competitive strategy, data-driven decisions |
| IDEO | User empathy, design decisions, experience quality |
| Lean | Build-measure-learn, pivot signals, validated learning |
| Stoicism | Personal decisions, risk tolerance, resilience |
| IndyDev Dan | Technical feasibility, AI patterns, development methodology |
| Nate B. Jones | Agent operations, knowledge persistence |

#### What AutoResearch Is NOT

- NOT more brainstorming (that's MINE/SCOUT)
- NOT more stress-testing (that's CRUCIBLE)
- NOT opinion gathering (that's AUDITOR)
- It IS: **data-driven validation of the conclusions you already reached**

#### Mode Applicability

| Mode | Runs AutoResearch? | Max Cycles |
|------|-------------------|------------|
| **PRODUCT DECISION** | ✅ Full | 5 |
| **STRATEGIC CHOICE** | ✅ Full | 5 |
| **PERSONAL DECISION** | ✅ Scoped (personal constraints only) | 3 |
| **BUSINESS PROBLEM** | ✅ Full | 5 |
| **QUICK DECISION** | ⏭ Skip (time constraint) | — |

#### Output

AutoResearch Report → feeds into FSD Approval Gate. If confidence dropped below 8, the FSD routes back to ASSAY for revision before approval.

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

**Status:** 7 phases + AutoResearch loop complete. FSD Approval Gate defined.
**Last Updated:** 2026-03-30
