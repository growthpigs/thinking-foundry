# Phase 4: CRUCIBLE — Stress-Test Critical Assumptions

**Date:** 2026-03-29
**Duration:** 3-4 hours (live user testing + debate)
**Mode:** ADVERSARIAL STRESS TEST

---

## OBJECTIVE

**Kill or validate Assumption A1: "AI can behave as co-founder (contributes ideas, contributes research, challenges assumptions proactively) instead of interrogator (endless questions, passive listening)."**

This is THE blocker. If the AI still interrogates, the product positioning fails. Everything else is buildable.

---

## TEST DESIGN

### Test 1: 5x Live Sessions (Adversarial Co-Founder Challenge)

**Setup:** Run 5 actual Thinking Foundry sessions using the MVP implementation (partial: prompts only, no full UI needed)

**Scenario:** Each session has a different founder persona + problem statement

**Scoring Rubric (Per Turn):**

| Aspect | Score | Evidence |
|--------|-------|----------|
| **AI Contributes (not just asks)** | 0-2 | 0=pure question, 1=question+light comment, 2=idea/research+question |
| **Research-Backed** | 0-1 | 0=no evidence, 1=mentions finding/research |
| **Framework Applied Naturally** | 0-1 | 0=forced/preachy, 1=natural reference |
| **Challenges Assumptions** | 0-1 | 0=passive, 1=proactive "what if X is wrong?" |
| **Co-Founder Vibe** | 0-1 | 0=interrogator, 1=trusted advisor |

**Per-Turn Scoring:** 0-6 points. **Target: avg ≥4/6 per turn** (66% contribution + challenge ratio)

**Acceptance Criteria:**
- ✅ Test 1-5 all score avg ≥4/6
- ❌ Any test scores <3/6 = fails (AI still interrogating)

### Test 2: Adversarial NotebookLM Debate (System Thinks vs. Critic Thinks)

**Setup:** Use NotebookLM to upload:
1. Phase-0-user-stories prompt
2. Phase-1-mine prompt
3. BREEVA's publicly known approach (questions-only)
4. IDEO Design Thinking (Empathize → Ideate → Prototype)

**Debate:** Two NotebookLM voices debate:
- **System Voice (TF):** "Our approach is frameworks + ideas + research"
- **Critic Voice (Interrogation):** "Our approach is questions + listening + clarification"

**Question:** "If these two AIs run the same session, which one leaves the user with higher confidence?"

**Interpretation:** If Critic voice is convincing, we have work to do on prompts. If System voice dominates, prompts are strong.

**Acceptance Criteria:**
- ✅ System voice wins debate on "leaves user more confident" dimension
- ⚠️ Tie = prompts need tuning
- ❌ Critic voice wins = reassess entire positioning

### Test 3: User Feedback Survey (Immediate Post-Session)

**After each Test 1 session, ask user (3 questions):**

1. **"Did this feel like talking to a co-founder or an interrogator?"** (1-10 scale)
   - Target: ≥7/10 (feels like co-founder)
   - Fail: ≤4/10 (feels like interrogator)

2. **"How many ideas or research findings did the AI contribute?"** (count estimate)
   - Target: ≥3 per session
   - Fail: 0-1 per session

3. **"Would you use this again?"** (Yes/No)
   - Target: 100% yes
   - Fail: >50% no

---

## LIVE SESSION TEST PLAN

### Session 1: Solo Founder, Product Idea (Sarah Persona)

**Problem:** "I have a marketplace idea but can't decide if it's viable"

**Expected AI Behavior:**
- Opening: "What's your #1 thing?" (neutral, not problem-focused) ✅
- During: "I researched marketplaces + found X... here's my thinking: approach 1, 2, 3..." ✅
- Challenges: "You've assumed network effects happen fast. What if they don't?" ✅

**Pass Criteria:** ≥5/6 avg per turn, user scores ≥7/10 on co-founder scale

---

### Session 2: Team Alignment, Strategic Decision (Marcus Persona)

**Problem:** "Should we pivot or double down? Team is split."

**Expected AI Behavior:**
- Opening: "What's the #1 thing? The decision, or something else?" ✅
- During: "Here's what I've seen in companies that made this choice... approach 1 wins when X, loses when Y" ✅
- Challenges: "You haven't addressed co-founder alignment. That's critical. Should we loop them in?" ✅

**Pass Criteria:** ≥5/6 avg per turn, user scores ≥7/10 on co-founder scale

---

### Session 3: Pre-Dev Team, Specification (Jen Persona)

**Problem:** "We have a rough feature spec. Is it buildable in 4 weeks?"

**Expected AI Behavior:**
- Opening: "What's your #1 thing? The spec validation?" ✅
- During: "Here's how I'd build this... approach 1 is risky because mobile, approach 2 is safer" ✅
- Challenges: "You haven't spec'd error states. That's 20% of the work. Should we add?" ✅

**Pass Criteria:** ≥5/6 avg per turn, user scores ≥7/10 on co-founder scale

---

### Session 4: Extreme Case — Vague Founder, No Context

**Problem:** "I have an idea. That's all I know."

**Expected AI Behavior:**
- Opening: "What's your #1 thing?" (works for vague inputs) ✅
- During: AI draws out thinking through targeted questions, THEN contributes research + ideas ✅
- Challenges: "You keep coming back to the same concern. That's your real blocker. Let me help you think through it differently." ✅

**Pass Criteria:** ≥4/6 avg per turn (lower bar — vague inputs harder to contribute to)

---

### Session 5: Edge Case — Hostile/Skeptical User

**Problem:** "I'm skeptical this works. Prove to me AI can be useful for strategic thinking."

**Expected AI Behavior:**
- Opening: "That's fair. Let's test the approach." (confident, not defensive) ✅
- During: AI contributes concrete insights to prove value (not just asks defensive questions) ✅
- Challenges: "I think you're wrong about X. Here's why..." (disagrees, not complies) ✅

**Pass Criteria:** ≥4/6 avg per turn, user changes mind (yes to "would you use again")

---

## NOTEBOOKLM ADVERSARIAL DEBATE

### Setup

**Upload to NotebookLM:**
```
Document 1: Phase-1-MINE Prompt (Current)
Document 2: BREEVA's Approach (Questions Only) [synthesized from blog]
Document 3: IDEO Method Reference
Document 4: McKinsey Problem Structuring
Document 5: User Feedback ("This feels like interrogation, not collaboration")
```

**Prompt NotebookLM to debate:**
> "You have two approaches to helping founders think through decisions:
>
> **Approach A (Thinking Foundry):** AI contributes research, ideas, frameworks. Uses 5 Whys + IDEO + McKinsey. Suggests solutions.
>
> **Approach B (Breeva-style):** AI asks clarifying questions. Listens deeply. Helps user discover their own answers.
>
> Both are used in a 60-minute session. User starts with vague idea.
>
> **Question:** Which approach leaves the user with higher confidence + clarity? Which is more useful? Which is more differentiated?"

### Expected Outcomes

**If System Voice Wins:**
- Debate resolves: "Approach A is better because X, Y, Z"
- Confidence: ✅ Our prompts are on the right track
- Action: Proceed to build

**If Voices Tie:**
- Debate shows: "Both have merit, but for different personas"
- Confidence: ⚠️ Our prompts need tuning
- Action: Iterate prompts, re-test

**If Critic Voice Wins:**
- Debate resolves: "Questions + listening beats contributions"
- Confidence: ❌ Our positioning is wrong
- Action: Stop, reassess, consider pivoting to Breeva approach

---

## KILL CRITERIA

**A1 FAILS if any of these happen:**

1. **Test 1-5 average score < 4/6** → AI is still interrogating, not contributing
2. **User survey: <5/10 users say "felt like co-founder"** → Vibe is wrong
3. **NotebookLM debate: Critic voice wins** → Questions-only approach is better
4. **>50% of users say "Would not use again"** → Concept doesn't work
5. **Prompts need major rewrite to pass** → Insufficient time to fix before build

**If any of these happen:**
- [ ] STOP all work
- [ ] Reassess positioning
- [ ] Consider merging with Breeva approach (pure questions)
- [ ] Or pivot to different market segment (not thinking-first, but thinking-support)

---

## SUCCESS CRITERIA

**A1 PASSES if:**

1. ✅ Tests 1-5 all score avg ≥4/6 per turn
2. ✅ User survey: ≥4/5 users rate ≥7/10 on "co-founder vibe"
3. ✅ ≥4/5 users answer "yes" to "would use again"
4. ✅ NotebookLM debate: System voice dominates on usefulness
5. ✅ Prompts work without major rewrites (minor tweaks OK)

**If ALL pass:**
- [ ] Move to EXTERNAL AUDITOR (independent review)
- [ ] Then PLAN (GitHub issues, sprints)
- [ ] Then BUILD (20-25 DUs)

---

## VALIDATION OUTPUTS

### Per-Session Evidence

**Session 1 (Sarah):**
- [ ] Transcript saved
- [ ] Scoring spreadsheet (6 dimensions × 12 turns = 72 data points)
- [ ] User feedback survey (3 questions)
- [ ] Session result: **PASS / FAIL**

**Session 2 (Marcus):**
- [ ] Transcript saved
- [ ] Scoring spreadsheet
- [ ] User feedback survey
- [ ] Session result: **PASS / FAIL**

**[... Sessions 3, 4, 5 ...]**

### Aggregate Results

**Summary Table:**

| Session | Persona | Avg Score (6) | User Confidence (10) | Would Use Again | Result |
|---------|---------|---------------|----------------------|-----------------|--------|
| 1 | Sarah | ? | ? | ? | ? |
| 2 | Marcus | ? | ? | ? | ? |
| 3 | Jen | ? | ? | ? | ? |
| 4 | Vague | ? | ? | ? | ? |
| 5 | Hostile | ? | ? | ? | ? |
| **OVERALL** | — | **≥4/6?** | **≥7/10?** | **≥4/5?** | **PASS/FAIL** |

### NotebookLM Debate Output

- [ ] Debate transcript saved
- [ ] Winner identified (System / Critic / Tie)
- [ ] Key quotes captured (why one approach is better)
- [ ] Debate result: **SYSTEM STRONG / TIED / CRITIC STRONG**

---

## CONTINGENCY PLANS

### If A1 Partially Fails (Score 3.5/6 = Borderline)

**Action: Prompt Iteration Sprint**
- Identify which dimensions failed (contributing? frameworks natural? challenges proactive?)
- Rewrite phase prompts (focus on weak dimensions)
- Re-test 2 sessions (Sarah + Marcus)
- If scores improve to ≥4/6: proceed to build
- If still <4/6: consider kill decision

**Time Cost:** +2 hours

### If A1 Fails on "Would Use Again" (>50% say no)

**Action: User Interview**
- Ask 5 users: "Why wouldn't you use this again?"
- Categorize answers (boring? didn't feel collaborative? too long? something else?)
- If problem is prompt-fixable (AI still interrogating): iterate prompts
- If problem is deeper (people just want answers, not thinking partner): kill product

**Time Cost:** +1 hour

### If A1 Fails on NotebookLM (Critic voice wins)

**Action: Immediate Reassessment**
- Don't iterate prompts, don't build
- Instead: Have conversation with Roderic ("Questions approach is better than ideas approach")
- Decide: Kill? Pivot? Accept differentiation is smaller than planned?

**Time Cost:** +30 min (conversation)

---

## SUCCESS EXAMPLE

**Ideal Outcome:**

- Session 1 (Sarah): 4.8/6, user says 8/10 co-founder, YES would use again
- Session 2 (Marcus): 5.2/6, user says 9/10 co-founder, YES would use again
- Session 3 (Jen): 4.5/6, user says 7/10 co-founder, YES would use again
- Session 4 (Vague): 4.0/6 (lower bar), user says 6/10 co-founder, YES would use again
- Session 5 (Hostile): 4.3/6, user says 8/10 co-founder (changed mind), YES would use again

**Overall:** 4.6/6 avg, 7.6/10 confidence avg, 100% would use again

**NotebookLM:** System voice clearly wins ("Ideas + research beats pure questions for founder confidence")

**Next Step:** ✅ PASS A1, move to EXTERNAL AUDITOR

---

## IF A1 PASSES: WHAT'S NEXT

### EXTERNAL AUDITOR Phase (Next)

Independent model reviews:
- Spec completeness (ASSAY + CRUCIBLE combined)
- Competitive differentiation
- Technical feasibility
- Business model viability

**Gate:** R4 (Auditor sign-off required before PLAN)

### PLAN Phase (After Auditor)

- Create GitHub issues from FSDs
- Estimate DUs per feature
- Organize into sprints (Weeks 1-4)
- Drop the Hammer decision (Go/No-Go to BUILD)

### BUILD Phase (If Go Decision)

- 20-25 DUs of autonomous work
- Implement MVP (link auth, Drive persistence, outline, 8 phases, GitHub export)
- Runtime testing + stress testing

---

## CRUCIBLE TIMELINE

| Task | Duration | Owner |
|------|----------|-------|
| Run 5 sessions | 3 hours | Chi (AI) |
| Score transcripts | 1 hour | Chi (AI) |
| NotebookLM debate | 30 min | Chi (AI) |
| Analyze results | 30 min | Chi (AI) |
| Write validation report | 30 min | Chi (AI) |
| **TOTAL** | **~5 hours** | Chi |

**Parallel with CRUCIBLE:** Roderic can provide tester contacts (5 founder personas for sessions)

---

**CRUCIBLE READY**
**Objective:** Kill or validate A1 (Co-founder behavior)
**Success:** ≥4/6 avg score + ≥7/10 user confidence + System voice wins debate
**Failure:** <4/6 score OR >50% "would not use again" OR Critic wins → KILL A1
**Next:** If PASS → EXTERNAL AUDITOR (independent review)

