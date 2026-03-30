# Phase 4b: EXTERNAL AUDITOR — Independent Model Review

**Metaphor:** Before the metal leaves the crucible, an independent assayer verifies the composition. Not your team. Not your tools. An outsider.

**Duration:** 30-60 minutes
**Mode applicability:** GREENFIELD, FEATURE, SPEC
**When:** After CRUCIBLE (Phase 4), before PLAN (Phase 5)

---

## What Happens

The entire specification — FSDs, Admin docs, Assumption Table, Crucible findings, Buyer Personas — is given to a DIFFERENT AI model (not the one that wrote it) for independent review. This is the circuit breaker before committing to code.

### Why a Different Model?

Every AI model has blind spots shaped by its training. Claude may miss what Gemini catches. Gemini may miss what Claude catches. The External Auditor exploits this asymmetry. It's not about which model is "better" — it's about coverage.

### The Rule

**The External Auditor MUST be a different model family than the one that wrote the specs.**

| If specs were written by | Use as External Auditor |
|--------------------------|------------------------|
| Claude (Anthropic) | Gemini 3.1 Pro (Google) |
| Gemini (Google) | Claude Opus (Anthropic) |
| Either | GPT-4.1 (OpenAI) also acceptable |

### Process

1. **Prepare the package** — Export all specs to a single context:
   - All FSDs
   - Admin docs (at minimum: Client Requirements, User Stories, Tech Stack, ADR Log)
   - Assumption Table (with confidence scores)
   - Crucible findings and dispositions
   - Buyer Persona document
   - Architecture diagrams (if any)

2. **Give the External Auditor the prompt** (see below)

3. **Read the response critically** — The auditor may find real issues, false positives, or philosophical disagreements. Disposition each finding.

4. **Update specs if needed** — Real issues go back to ASSAY docs. False positives get noted. Philosophical disagreements get discussed with the human.

### Outputs
- External Auditor report
- List of findings (dispositioned: fix / dismiss / discuss)
- Updated FSDs if any findings require changes
- Confidence adjustment on Assumption Table entries

---

## The External Auditor Prompt

Copy this entire prompt and give it to the external AI along with your spec package:

```
# External Auditor — Pre-Code Review

SYSTEM ROLE: Act as my External CTO and Principal Software Architect.
You are an independent technical auditor. You did NOT write these specs.
You have no attachment to them. Your job is to find what's wrong, what's
missing, and what will break FIRST when this hits the real world.

You are a skeptical senior engineer with 25 years of experience. You've seen
projects fail because of assumptions that "seemed obvious." You've seen
specs that were internally consistent but built the wrong thing. You've seen
architectures that worked on paper but collapsed under real load.

## What You're Reviewing

THE SITUATION:
[Project Name] is a [Brief Description]. Core tech stack: [Stack].
We believe the specification is complete and the architecture is sound,
but we need an independent audit before committing to code.

[PASTE: FSDs, Admin docs, Assumption Table, Crucible findings, Buyer Personas]

## Your Tasks

### 1. Assumption Audit
For every assumption in the Assumption Table:
- Do you agree with the confidence score? If not, why?
- What SPECIFIC test would you run to verify this assumption?
- What's the blast radius if this assumption is wrong?
- Are there assumptions NOT in the table that should be?

### 2. Architecture Red Team — The 30,000ft Sweep
Do a brutal architectural sweep, then dive to the exact spec level:
- What's the single most likely failure mode in production?
- What happens at 10x scale? At 100x?
- Where are the single points of failure?
- What's the security exploit path a malicious actor would try first?
- What happens when the primary database is down for 30 minutes?

### 3. The Five Enterprise Landmines
Look past the happy path. Audit specifically for:

**Concurrency & The "Panic Click":** Are all user actions (form submissions,
API calls, DB writes) strictly debounced or locked? If a user taps a button
5 times on a bad connection, will it create duplicate rows, trigger race
conditions, or crash?

**Psychological Wait Time & UX Degradation:** Find the heaviest, slowest
operations. Are we leaving the user staring at a frozen screen? Where do we
need optimistic UI, skeleton loaders, or micro-copy to make latency invisible?

**Resource Exhaustion & Infrastructure Limits:** Database connection pooling —
are we hitting limits? Un-paginated queries that choke at 10,000 rows? Memory
leaks in event listeners or WebSockets?

**The "Empty State" & Null Context Trap:** If a brand-new user logs in with
zero data (no history, no profile, empty arrays), will the UI render
beautifully or will a null-reference crash the app?

**Silent Failures & Error Boundaries:** Swallowed errors? Unhandled promise
rejections? Silent failures that leave the user stuck? Does one broken
component take down the entire app?

### 4. Buyer Persona Reality Check
For each Buyer Persona:
- Does this product ACTUALLY solve their problem?
- Would they pay the stated price?
- What would make them STOP using it after 3 months?
- What competitor could steal them with a simpler solution?
- Does this FEEL like [the promise] or like generic software?

### 5. The "What If You're Wrong?" Test
Pick the 3 most critical architectural decisions and argue AGAINST them:
- What if [technology choice] was the wrong call?
- What if [data model design] doesn't scale?
- What if [integration assumption] fails in production?

### 6. Missing Pieces
- What's NOT in the spec that should be?
- What edge cases are unaddressed?
- What happens on Day 0 (before any data exists)?
- What happens when the human operator is unavailable?
- What happens when a third-party API changes its contract?

### 7. Verdict

Do not write any code or fixes. Give me a brutally honest SITREP
prioritising the most catastrophic vulnerabilities. Tell me what will
break FIRST when this hits the real world.

Rate each area 1-10:
- Specification completeness: X/10
- Architecture soundness: X/10
- Production readiness (the 5 landmines): X/10
- Buyer persona fit: X/10
- Ready for code: YES / NO / CONDITIONAL

If CONDITIONAL, list exactly what must be resolved before code starts.

Be brutal. Don't spare feelings. The cost of finding problems now is
1/10th the cost of finding them in code.
```

---

## ⚖️ R4b: External Auditor Gate

**Key question:** "Did an independent model find anything we missed?"

**Must pass:**
- [ ] External Auditor report received from a DIFFERENT model family
- [ ] All findings dispositioned (fix / dismiss / discuss)
- [ ] "Fix" items resolved in ASSAY docs
- [ ] Assumption Table confidence scores adjusted if auditor disagreed
- [ ] External Auditor verdict is YES or CONDITIONAL-resolved (not NO)
- [ ] Confidence ≥ 8/10

**If the External Auditor says NO (not ready for code):**
Go back to ASSAY. Fix what they found. Re-run the Auditor. Do NOT proceed to PLAN.
