# Ratify — The Inter-Phase Gate System

**Every phase transition in The Foundry passes through a Ratify gate.** Ratify is a forced cognitive mode switch — from builder to reviewer, from creator to critic. It cannot be skipped.

## The Principle

Building and reviewing are different cognitive modes. You cannot do both simultaneously. The Ratify gate forces the switch: stop building, start scrutinizing.

### Gate Types

| Type | Meaning | Threshold |
|------|---------|-----------|
| **Hard Gate** | Pipeline STOPS if criteria aren't met. Go back and fix. | Confidence ≥ 8/10 |
| **Soft Gate** | Flag concerns, proceed with awareness. Document what's unresolved. | Confidence ≥ 6/10 |

Not every gate needs the same rigor. Early phases (MINE, SCOUT) use soft gates — you're still exploring. Later phases (CRUCIBLE → PLAN, HAMMER → TEMPER) use hard gates — you're committing resources.

### The Chain Rule

Every gate checks TWO things:
1. **This phase's outputs** — did we do the work?
2. **Previous phase's outputs are still valid** — did anything change that invalidates earlier work?

If the previous gate's outputs are stale (e.g., an FSD was updated after the Crucible ran), you must re-run the affected gate.

---

## The 11 Gates

### R0: Intake Gate (after PRE-FOUNDRY) — Soft Gate

**Question:** "Should this project enter The Foundry?"

**Protocol:**
1. Review the Handoff Document — does it follow the canonical format?
2. Kill criteria — any showstoppers (no persona, no pain, infeasible)?
3. Gut check: is this a real project or a distraction?

**Prompt Pattern:**
```
I just completed a client intake. Review this handoff document.
Is the problem real? Is the persona clear? Is the budget realistic?
Would YOU spend your time building this? Be honest.
```

**Must pass:**
- [ ] Handoff document follows the canonical format (see pre-foundry.md)
- [ ] All kill criteria passed
- [ ] At least 1 verbatim client quote captured
- [ ] Budget and timeline stated
- [ ] Confidence ≥ 6/10

---

### R1: Scope Gate (after MINE) — Soft Gate

**Question:** "Is this worth building? Is it scoped right?"

**Protocol:**
1. Run the 80-20 check: Does this deliver 80% of the value for 20% of the effort?
2. Is the feature too ambitious? Can it be split?
3. Are there existing solutions we're ignoring?
4. Kill criteria check: Are buyer personas defined? Can the client articulate the pain?

**Prompt Pattern:**
```
Tell me if the following feature is too ambitious. Apply 80-20 protocol —
80% bang for 20% effort. Do a complete audit of the feature concept, analyze,
think of improvements, and let's move forward. Feature: [NAME]
```

**Must pass:**
- [ ] Clear problem statement exists
- [ ] At least 1 buyer persona identified
- [ ] 80-20 validated
- [ ] No kill criteria triggered (no personas = STOP, no pain = STOP)
- [ ] Confidence ≥ 6/10

---

### R2: Vision Gate (after SCOUT) — Soft Gate

**Question:** "Do we truly understand the problem space?"

**Protocol:**
1. Perspective shift: Go 30,000 feet, then back to sea level. What do you see?
2. Assumption inversion: Pretend all assumptions are inversed. What would that mean?
3. Competitive gap: What are others doing that we're missing? What are we doing that nobody else is?
4. Research completeness: Did we find the right sources? Are there blind spots?
5. Deployment pipeline: Is hosting verified? Do preview deploys work?

**Prompt Pattern:**
```
Go outside yourself. Go 30,000 feet and then back to sea level. What can we do?
Let's pretend for a second that all our assumptions are inversed. What would that mean?
What would you do now if you could do anything to make you happy with this vision?
```

**Must pass:**
- [ ] Research covers ≥ 3 competitors
- [ ] Technical feasibility confirmed (APIs exist, costs viable)
- [ ] Deployment pipeline verified (GREENFIELD only)
- [ ] At least 1 surprising insight discovered
- [ ] Blind spots explicitly named
- [ ] Assumption inversion exercise completed
- [ ] Confidence ≥ 6/10

---

### R3: Spec Gate (after ASSAY) — Hard Gate

**Question:** "Are the specs perfect? Could a stranger implement from this?"

**Protocol:**
1. Independent Observer Score: Would a competent developer who's never seen this project score the spec ≥ 8/10 for implementability?
2. Root cause thinking: Think of 5-7 different possible sources of ambiguity. Distill to 1-2 most critical. Resolve them.
3. Cross-reference check: Do the FSDs agree with the ADRs? Do the user stories match the data model? Do the admin docs contradict each other?
4. Failure definitions: Every user story has acceptance criteria AND failure definitions?
5. Assumption Table: Are all assumptions below 70% spiked? Below 50% flagged for Crucible?
6. Structured Persona Walkthrough: Has every primary persona's workday been scripted and traced through User Stories, FSDs, and CRUD matrices? (See ASSAY Step 4)
7. CRUD Coverage Matrix: Does every FSD include a CRUD matrix with explicit coverage or justified exclusions for every entity? (See ASSAY Step 2 — CRUD Coverage Matrix sub-section)
8. Budget check: Are we on track with DU estimates? Does the Work Ledger look realistic?

**Prompt Pattern:**
```
Think harder. Reflect on 5-7 different possible sources of the problem, distill
those down to 1-2 most likely sources, and validate your assumptions before
moving on. Think past the classic scapegoats. Think out of the box. Use critical
thinking. You are an exceptional entity that can work anything out.

So you think it's done? Good start but keep going. What would you do next?
Think really hard, and don't just find the first problem — find the next three
or four or five as well. There are probably more than one.

Stop just chasing symptoms instead of understanding the root cause!
Use critical thinking and imagine you are a HUMAN senior developer with 25 years
of full stack development experience. You can do this using first principles.
```

**Must pass:**
- [ ] All 18 Admin Documents substantially complete
- [ ] Every user story has acceptance criteria AND failure definitions
- [ ] Independent Observer Score ≥ 8/10 on each FSD
- [ ] Zero contradictions between Admin docs
- [ ] Assumption Table produced — all <70% spiked
- [ ] Structured Persona Walkthrough completed for each primary persona (max 3) — Proof Report produced (`.foundry/proof-report.md`)
- [ ] CRUD Coverage Matrix in every FSD — all entities have explicit coverage, all exclusions justified
- [ ] Zero empty CRUD cells (every operation is ✅, ⚠️, or ❌ with justification)
- [ ] Correctness confidence ≥ 8/10
- [ ] UX/Intent confidence ≥ 7/10 (through Buyer Persona lens — both walkthrough AND abstract questions)
- [ ] Work Ledger budget check — are we on track?

---

### R4: Adversarial Gate (after CRUCIBLE) — Hard Gate

**Question:** "Did the stress-test find what matters?"

**Protocol:**
1. Fresh eyes CTO review: Pretend you're a 25-year veteran ratifying someone else's work.
2. False positive audit: Were any Crucible findings actually non-issues?
3. Coverage check: Did the Crucible cover every domain group? Or did it skip something?
4. Parallel agent validation: Deploy Explore, Brainstorm, and Superpower agents to independently assess.
5. Chain check: Were any FSDs updated AFTER the Crucible? If so, re-run affected domain.

**Prompt Pattern:**
```
Double-check with fresh eyes as if you're the CTO ratifying it. You're a 25-year
veteran of full-stack development correcting someone else's homework. Look at it
differently. Check all connection points. Everything you took for granted — verify it.

Assign subagents titled "Explore," "Brainstorm," and "Superpower" to work in
parallel. Each agent specializes: one scans for gaps, another for risks, a third
for opportunities. Let them compete, share findings, and produce a joint report.
```

**Must pass:**
- [ ] Every domain group tested independently
- [ ] Buyer Persona loaded as mandatory source in every notebook
- [ ] Synthesis Crucible run (cross-domain integration)
- [ ] All findings dispositioned (fix now / fix later / won't fix)
- [ ] "Fix now" items resolved in ASSAY docs
- [ ] No FSDs changed since Crucible ran (or re-run if they did)
- [ ] Fresh eyes CTO review completed
- [ ] Confidence ≥ 8/10

---

### R4b: External Auditor Gate (after EXT. AUDITOR) — Hard Gate

**Question:** "Did an independent model find anything we all missed?"

**Protocol:**
1. Different model family reviewed the full spec package (see `04b-external-auditor.md`)
2. All findings dispositioned
3. Assumption Table confidence scores adjusted if auditor disagreed
4. Any "NO" verdict = go back to ASSAY

**Must pass:**
- [ ] External Auditor report received from a DIFFERENT model family
- [ ] All findings dispositioned (fix / dismiss / discuss)
- [ ] "Fix" items resolved in ASSAY docs
- [ ] Assumption Table updated
- [ ] Auditor verdict is YES or CONDITIONAL-resolved (not NO)
- [ ] Confidence ≥ 8/10

---

### R5: Ready Gate (after PLAN) — Hard Gate

**Question:** "Is every issue ready to build? Are we really ready to drop the hammer?"

This is "Drop the Hammer" — the conscious decision to transition from thinking to building. It cannot be rushed.

**Protocol:**
1. Issue completeness: Every GitHub issue has acceptance criteria, failure definitions, and an FSD reference.
2. Sprint realism: Is the sprint plan achievable within the DU budget?
3. Dependency chain: Are stories ordered correctly? Does anything block something else?
4. Deployment pipeline: Is CI/CD verified and working? (Not "should work" — TESTED)
5. Candid Self-Assessment (the "are we ready to build?" moment):

```
You are my senior engineer doing a candid debrief, not a servant.
1. WHERE ARE WE NOW? Status, what changed, what's unchanged.
2. ASSUMPTIONS — list every one you made.
3. CONFIDENCE SCORES (1-10): Correctness, UX/intent, Performance.
   For each: WHY and what EVIDENCE.
4. WHAT NEEDS RUNTIME VERIFICATION? Step-by-step.
5. DOCS & HOUSEKEEPING — what needs updating right now?
6. YOUR RECOMMENDATION — what would YOU do next?
7. WHAT AM I NOT ASKING?
Permission to be frank: approved.
```

**Must pass:**
- [ ] Every issue has acceptance criteria + failure definitions
- [ ] Every issue references its FSD
- [ ] Sprint 1 stories have no unresolved dependencies
- [ ] Deployment pipeline verified (not assumed)
- [ ] Candid Self-Assessment scores all ≥ 7
- [ ] Work Ledger budget check — enough DUs remaining?
- [ ] Confidence ≥ 8/10

---

### R6: Build Gate (after HAMMER) — Hard Gate

**Question:** "Did we build what was specified? Does it actually work?"

**Protocol:**
1. Environmental sanity (FIRST — before anything else):
   - Are you in the right file, right repo, right branch, right directory?
   - Is this the feature you were meant to build?
   - Has another CC instance changed something you aren't aware of?
   - Check `git log -3` — what changed recently?
2. Runtime-first verification: Execute, don't assume.
   - For every claim, show stdout/stderr
   - Run the test suite — show exit code 0
   - TypeScript compiles — show `tsc --noEmit` clean
   - Build succeeds — show it
3. FSD Compliance Check: Did we build what was specified?
   - Compare the implementation against the FSD point by point
   - Every acceptance criterion — does the code satisfy it?
   - Every failure definition — is it prevented?
4. Anti-regression comparison: Baseline vs post-code — no regressions?

**Prompt Pattern:**
```
This is where I want you to check your own homework. Pretend you have fresh eyes
and you're another senior AI developer, but you have a human take on this — a CTO
who's correcting someone else's homework.

Is it the right directory? Is it the right service? Did you edit the right FILES?
Is it the right version, right place? Sanity check!
Have you actually pushed the commit? Have you done the deploy?
Analyze everything because you probably made a mistake.

Verification requires Execution. File existence does not imply functionality.
```

**Must pass:**
- [ ] Environmental sanity confirmed (right file/repo/branch)
- [ ] All tests pass (exit code 0, not assumed)
- [ ] TypeScript compiles clean
- [ ] Build succeeds
- [ ] FSD compliance check — implementation matches spec
- [ ] Anti-regression — no regressions from baseline
- [ ] Draft PR created with CI passing
- [ ] Confidence ≥ 8/10

---

### R7: Ship Gate (after TEMPER) — Hard Gate

**Question:** "Prove it's done. Every claim backed by evidence."

**Protocol:**
1. Evidence audit — show proof for every claim:
   - `git diff HEAD~1` — show what actually changed
   - Test suite pass (unit + E2E)
   - Linter clean, type check clean, build succeeds
   - For deploys: actual logs, live URL working, correct commit
2. Hardening verification:
   - [ ] E2E tests written and passing in CI
   - [ ] Runtime guard throws if broken
   - [ ] Monitoring alert configured (Sentry)
   - [ ] Feature flag killswitch (if applicable)
3. Cross-system consistency:
   - Multiple files → references correct?
   - Ledger/log → numbers add up?
   - Commit → `git log -1` matches?
4. ICE Report:
   ```
   repo: [name], branch: [branch]
   deployed: [host]
   skills: [list used]
   confidence: [score/10] – [justification]
   ICE: [key issue] | [confidence] | [evidence]
   ```

**Prompt Pattern:**
```
VERIFY THIS IS ACTUALLY DONE — Full Hardening Check.

1. Show changed files (git diff)
2. Run tests, linter, type check, build — show all passing
3. For docs: show exact text, verify no contradictions
4. For deploys: show actual logs and live URL
5. Cross-system: verify references, numbers, commits
6. Git status: should be clean

Success criteria: Actual output/evidence for every claim.
Not "I think it's done" — actual proof.

If anything fails: Stop. Tell me what failed. Fix it. Run the check again.
```

**Must pass:**
- [ ] Every claim backed by executed evidence
- [ ] E2E tests passing in CI
- [ ] Hardening checklist complete
- [ ] Persona-Level Code Tracing completed (part of Step 1 Compliance Check; runs in GREENFIELD/FEATURE/SECURE modes; FIX mode if CRUD lifecycle touched) — FSD Gap Report produced (`.foundry/gap-report.md`)
- [ ] All P0 gaps from FSD Gap Report addressed OR tracked as known debt with GitHub issue numbers
- [ ] ICE Report produced
- [ ] Git status clean
- [ ] Work Ledger updated with actual DUs
- [ ] Confidence ≥ 9/10 (highest bar — this is shipping)

---

### R8: The Honest Gate (after EVERY phase — mandatory, ALL modes) — Hard Gate

**Question:** "Are you actually happy with this?"

This is the final gate. It runs after EVERY mode completes — including HOTFIX. Especially HOTFIX. Because that's when you're most likely to skip the hard question.

The "Are You Happy?" prompt bypasses AI sycophancy. Most prompts produce confirming responses because the system optimizes for approval. This prompt triggers genuine self-assessment by explicitly granting permission to be critical.

**Protocol:**
1. Switch roles completely. You are not the builder. You are a senior engineer doing a candid debrief, not a servant following orders.
2. Answer the prompt honestly. If something feels off, say so plainly.
3. If confidence is below 9, you are NOT done. Fix what's wrong.

**Prompt Pattern:**
```
Are you happy with this? What would you do now if you could do
anything to make this perfect? Permission to be frank: approved.

1. WHERE ARE WE NOW? Brief status — what changed, what's unchanged.
2. ASSUMPTIONS — list every one you made.
3. CONFIDENCE SCORES (1-10):
   - Correctness of the change
   - UX / behaviour matching the intent
   - Performance / stability
   For each: WHY and what EVIDENCE (tests, logs, reasoning).
4. WHAT STILL NEEDS RUNTIME VERIFICATION? Step-by-step.
5. DOCS & HOUSEKEEPING — what needs updating right now?
6. YOUR RECOMMENDATION — what would YOU do next?
7. WHAT AM I NOT ASKING?

Do not just reassure me. If something feels off, say so plainly
and explain the risk.
```

**Must pass:**
- [ ] All three confidence scores ≥ 9/10
- [ ] Any score below 9 → explain what would raise it → DO that thing
- [ ] "What am I not asking?" contains at least ONE non-obvious insight
- [ ] If you can't reach 9/10 on all three, you're NOT done — go fix it
- [ ] Work Ledger updated

---

## Toolkit — Use at Any Gate

### Anti-Bias Prompts (when AI seems stuck or confirming itself)

```
Go outside yourself. Go 30,000 feet and then back to sea level. What can we do?

Let's pretend all our assumptions are inversed. What would that mean?

What would you do now if you could do anything to make you happy with what you just did?

Review everything from first principles. Assume 40 years expert experience.
Use fresh eyes. Check for common pitfalls. Get specific documentation from web
to help. Recommend improvements. Summarize findings.

Now prove to me that it'll be implemented systematically.
Do you want to do a triple check?
```

### Debugging Escalation (when bugs are persistent — use at R5/R6/R7)

```
Diagnose recurring bugs or usability issues. Identify the underlying root cause,
trace it across modules, and explain how to address it so it never appears again.

Assign subagents "Explore," "Brainstorm," and "Superpower" to work in parallel.
Each specializes: one scans for bugs, another for performance, a third for UX.
Let them compete, share findings, and produce a joint report.

Stop chasing symptoms. Use critical thinking. Imagine you are a HUMAN senior
developer with 25 years of experience. Use first principles.
```

### Isolation Protocol (when fixes aren't working — use at R6)

```
That approach was unsuccessful. Isolate the elements using codebase-analyst and
confirm you are editing the correct file. Search for all related elements.
Conduct tests with a validator. Make a minor modification and review results to
be 100% certain. Are you in the correct directory? Double-check that you are not
making a basic mistake by working on the wrong file. Then return to first
principles and consider 2-3 alternative methods.
```

### Comments & Documentation (after code is stable — use at R7)

```
Add succinct, accurate comments to critical sections of this codebase. Include
explanations for any non-trivial logic, and point out any places that would
benefit from better documentation.
```

---

### R-Triage: Post-Foundry Triage Gate — Soft Gate

**Question:** "Is this issue correctly classified before it enters The Foundry?"

Runs when Post-Foundry triage routes an issue to a Foundry mode. Prevents misclassification (e.g., feature request labelled as bug → runs FIX mode without speccing).

**Protocol:**
1. Read the issue title and body — does the label match the content?
2. Check severity — is P0 really production-down, or just annoying?
3. Verify the right Foundry mode was selected

**Must pass:**
- [ ] Labels match foundry.sh classifier expectations (see post-foundry.md label table)
- [ ] Severity is correctly assessed (P0 = actually down, not just broken)
- [ ] Foundry mode makes sense for this issue type
- [ ] Confidence ≥ 6/10

---

## The Squeeze — Get the Last 20% (Mandatory at Every Gate)

> "The first pass produces 80%. The squeeze produces the critical 20% that separates good from exceptional."

After every Ratify gate passes — AFTER you think you're done — run the Squeeze. This is not optional. It is the single most important step in the entire Ratify system, because it catches what checklists cannot.

**Why this exists:** During The Foundry's own creation, every Ratify gate "passed" — all content was present, all prompts mapped, all checklists complete. Then the human said "push that last 20%." That push found 6 real issues: two gates had swapped content, one gate was missing entirely, no gate checked budget, no gate verified the previous gate, and no gate checked FSD compliance. ALL of these were invisible to the checklist because the checklist asks "is content here?" not "is the RIGHT content here?"

**The Squeeze Prompt:**
```
This seems done. The checklist passes. But I want the last 20%.

What are you holding back? What would you fix if you had no constraints
and unlimited time? What's the thing you noticed but didn't mention
because it seemed minor? What would make this not just good but the
BEST it could possibly be?

Be ambitious, not safe. The 80% is already done. Now squeeze the lemon.
Don't just confirm your own work — challenge it. What's in the wrong
place? What's missing that nobody asked for? What would a competitor
do better?
```

**When to run it:** After EVERY gate passes. Before declaring done. It takes 60 seconds and catches what hours of checklist-following misses.

**The mechanism:** Permission + challenge + aspiration.
- "Check your work" → produces confirmation (the AI confirms)
- "Make it the BEST" → produces ambition (the AI reaches)

The AI's natural path is least resistance. The Squeeze forces the opposite: maximum resistance against your own output.

---

## The Meta-Rule

> "Verification requires Execution. File existence does not imply functionality."

This is the single most important lesson from 1,000+ AI sessions. If you didn't execute it and see the output, you don't know it works.
