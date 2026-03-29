# IndyDev Dan's AI Development Frameworks — Comprehensive Edition

**Version:** 1.0 (Comprehensive)
**Status:** MVP / Active
**Source:** IndyDev Dan frameworks (4000+ insights), Andrej Karpathy's ML systems thinking, industry learnings
**Last Updated:** 2026-03-29

---

## Who is IndyDev Dan

IndyDev Dan (Daniel) is a pioneering AI development practitioner with a comprehensive system for building AI-powered products at scale. His core insight: **AI development is categorically different from traditional software development. Treating them the same causes systematic failures.**

**The core problem Dan solves:**
- Traditional software: Deterministic (input X → output Y, always)
- AI software: Probabilistic (input X → output Y, sometimes; output Z, other times)
- Most teams build AI using traditional software patterns → disasters

Dan's frameworks address:
1. How to structure AI systems for reliability
2. How to learn from AI interactions systematically
3. How to manage AI's probabilistic nature
4. How to design AI-centered products

In a Thinking Foundry session, Dan's frameworks are essential when the problem involves:
- Building with AI as a core component
- Integrating LLMs into products
- Managing AI reliability and consistency
- Designing workflows around AI outputs

---

## Core Frameworks

### 1. The Learning System Architecture (AI That Improves Over Time)

**Dan's most distinctive contribution.** Most AI implementations reset to zero every session. Dan's Learning System means the AI gets better over time — not through fine-tuning, but through accumulated contextual knowledge.

**The Learning Loop (4 Phases):**

**Phase 1: Capture**
Every interaction generates a learning signal:
- What worked? (keep doing this)
- What didn't work? (avoid this)
- What was surprising? (update model)
- What changed? (track evolution)

Example: Prompt A produces great output. Prompt B produces mediocre. Capture both + outcome.

**Phase 2: Index**
Organize learnings with metadata:
```
Learning: "Prompt structure X produces better outputs for constraint type Y"
Category: "prompt_engineering"
Confidence: "high" (tested 50+ times)
Context: "code_generation, edge_cases"
Source: "session_2026_03_15"
Related: ["learning_123", "learning_456"]
```

**Phase 3: Surface**
Before any task, query relevant learnings:
```
Current task: "Generate JavaScript code for async retry logic"
Relevant learnings:
- "For complex async logic, use example-first prompts" (confidence: high)
- "Include failure scenarios in the prompt" (confidence: medium)
- "Avoid ternary operators, use explicit if/else" (confidence: high)
```

**Phase 4: Apply**
Inject learnings into the system prompt:
```
System prompt baseline:
"You are an expert JavaScript developer..."

+ Learning injection:
"Based on similar tasks, we know:
- Example-first prompts work best for async logic
- Always include failure scenarios
- Prefer explicit conditionals"
```

**Why this works:**
- Without: Every session starts at zero. Same mistakes repeated. No compounding.
- With: Each session starts better than the last. Patterns emerge. Reliability increases.

**Implementation patterns:**
- Store in database with search capability (Supabase, vector DB)
- Update learning confidence as you gather more evidence
- Periodically review low-confidence learnings (might be wrong)
- Prune outdated learnings (AI model improvements make old learnings stale)

**The meta-learning insight:**
The system isn't learning on its own. YOU are learning. The system is just making your learning available to future-you.

**AI Prompt Pattern:**
> "What have we learned from similar problems before? Which patterns work? Which don't? Let's inject that knowledge here so we don't repeat mistakes."

### 2. The Blueprint Pattern (Deterministic + Agentic Alternation)

**The insight:** AI excels at generation. Humans excel at verification. Alternate between them.

**Pure Agentic (Problems):**
- ✗ Unreliable (same input → different outputs)
- ✗ Hallucinates (confident wrong answers)
- ✗ Misses edge cases (didn't think of scenario X)
- ✗ Can't verify itself (self-evaluation is biased)

**Pure Deterministic (Problems):**
- ✗ Too slow (all analysis, no creativity)
- ✗ No flexibility (can't handle novel situations)
- ✗ Brittle (breaks on unexpected inputs)
- ✗ Human bottleneck (only as smart as programmer)

**The Blueprint: Alternate Them**

```
PLAN (deterministic)
  ↓ [Define criteria, structure, constraints]
GENERATE (agentic)
  ↓ [AI generates freely, multiple options]
VERIFY (deterministic)
  ↓ [Test against criteria, catch failures]
EVALUATE (separate agent or human)
  ↓ [Fresh perspective, explicit scoring]
DECIDE (deterministic)
  ↓ [Human chooses, commits to direction]
```

**Concrete example: Generate test cases for edge case handling**

```
PLAN (deterministic): "List all possible error states in login flow:
  - Wrong password (1000x)
  - Account locked (after 5 attempts)
  - Email not verified
  - Expired token
  - Database unavailable
  - Rate limited
  - etc."

GENERATE (agentic): "AI: Here's a comprehensive test suite covering all scenarios"

VERIFY (deterministic): "Check:
  - Does each test actually test what we claimed?
  - Are there edge cases in edge cases? (double-lock scenarios?)
  - Do tests run fast? Under 5 seconds?"

EVALUATE (separate agent): "Fresh perspective: Are there failure modes we missed?
  Try to break the test suite."

DECIDE (deterministic): "Approve test suite. Merge to main."
```

**Why alternation works:**
- AI handles creativity (100x faster than brainstorming)
- Deterministic handles verification (100x more reliable than human review)
- Separate evaluator catches blind spots (human biases don't survive two eyes)

**Application beyond coding:**
- Strategy: Agentic brainstorm → Deterministic evaluation → Human decision
- Writing: AI draft → Deterministic fact-check → Human edit
- Product design: AI wireframes → Deterministic usability review → Human gut check

### 3. The Prompt Architecture System

Dan advocates for treating prompts as architecture, not afterthoughts:

**Prompt Layers:**
1. **System Layer:** Identity, rules, non-negotiable behaviors (constitutional)
2. **Context Layer:** What the AI needs to know about the current situation
3. **Task Layer:** What specifically to do right now
4. **Memory Layer:** Relevant past interactions and learnings
5. **Constraint Layer:** Guardrails, format requirements, quality gates

**Key Principles:**
- Prompts are code. Version them. Test them. Review them
- The system prompt is your application's most important architecture decision
- Context injection at the right time is more powerful than fine-tuning
- Constraints in the prompt are more reliable than post-processing filters

**Pattern for Thinking Sessions:**
- Phase prompt = System Layer + Task Layer
- Context from previous phases = Memory Layer
- Knowledge base content = Context Layer
- Session rules = Constraint Layer

### 4. The Stress Test Protocol (Make Quality Non-Negotiable)

**The problem Dan solves:** AI agents self-evaluate positively on mediocre work. They claim "done" at 80% confidence. The last 20% — the part that catches real bugs — only happens under adversarial pressure.

**The protocol (4 stages):**

**Stage 1: Runtime-First Verification**
Don't just review — execute.

```
❌ "This looks like good code" (review only, false confidence)
✓ "Does this code actually run without errors?" (runtime verification)
✓ "Does it handle the edge case we discussed?" (test with real data)
✓ "Did performance improve or degrade?" (measure impact)
```

Examples:
- Don't review plans on paper — simulate the first week
- Don't review code by reading — actually run it
- Don't review prompts by eye — test with real examples

**Stage 2: Adversarial Self-Review**
After generating, switch to QA mode:

```
"I just generated a plan for user onboarding. Now let me try to break it:
- What if the payment provider is down? (not handled)
- What if the user closes the browser mid-flow? (not handled)
- What if they get the verification email in spam? (not mentioned)
- What happens on day 1? Day 7? Day 30? (only planned day 1)

Now fix each gap."
```

**Stage 3: Confidence Scoring**
Rate each component 1-10 with evidence:

```
Component: "User will complete onboarding in <10 minutes"
Confidence: 4/10
Why low: Only tested with tech-savvy users, no payment friction, didn't measure slower connections
To increase confidence: Run with 10 diverse users, measure actual time, include payment

Component: "Error messages are clear"
Confidence: 7/10
Why not higher: Didn't test with non-native English speakers, no user testing
To reach 9: Run with 5 non-native speakers, refine language
```

Rule: Anything below 8 = you need to fix it before shipping.

**Stage 4: Fresh Eyes Pass**
Re-read as if you've never seen it:

```
"Ignoring everything I know about this project:
- Is this confusing? (yes, this section is)
- Are any steps missing? (yes, what about X)
- Could someone execute this without my help? (no, they'd get stuck here)
- What would an outsider critique?" (this assumes knowledge they don't have)
```

**Why this matters:**
- Skipping verification: 50% of AI-generated plans have critical gaps
- With stress test: 95% catch rate (not perfect, but acceptable)

**Application to thinking sessions:**
- Never accept first answer as final
- Always ask: "What would break this? What am I assuming?"
- Score confidence explicitly (not just "yes/no" or "looks good")
- Have someone else review if it's critical

### 5. The Context Management Strategy

AI systems degrade as context grows. Dan's approach:

**Progressive Summarization:**
- Fresh context: full detail
- Aging context: condensed to key points
- Old context: one-liner summaries
- Ancient context: metadata only (when, what category, key conclusion)

**Context Windows are Precious:**
- Don't fill them with noise
- Prioritize: relevant > recent > comprehensive
- Condensation is not deletion -- it's compression
- The system should know what it has forgotten and where to find it

**Hot/Warm/Cold Context:**
- **Hot:** Currently relevant, full detail (current phase's knowledge, recent conversation)
- **Warm:** Might be relevant, condensed (previous phase summaries, related but not active knowledge)
- **Cold:** Background, metadata only (session history, archived decisions)

---

## Key Principles

### AI is Probabilistic, Not Deterministic
Every AI output is a sample from a distribution. Same input can produce different outputs. Build systems that:
- Verify before trusting
- Generate multiple options and select the best
- Have fallback behaviors for unexpected outputs
- Never assume a working prompt will always work

### The 90% x 7 Problem (Karpathy's Insight)
If each AI step is 90% reliable and your workflow has 7 steps, your end-to-end reliability is 0.9^7 = 47.8%. Solutions:
- Reduce the number of sequential AI steps
- Increase reliability at each step (better prompts, verification)
- Add checkpoints and human review at critical junctures
- Use deterministic logic where possible (don't use AI for deterministic tasks)

### Build for AI Continuity
AI sessions crash, context compacts, and agents switch. Build systems assuming discontinuity:
- Persistent state outside the AI (files, databases, APIs)
- Every session should be able to start fresh and get up to speed quickly
- State machines > conversation flow for multi-step processes
- Write things down immediately -- context is ephemeral

### The Evaluator Pattern
Never have the same agent evaluate its own work. Use a separate evaluation step:
- Generator agent creates the work
- Evaluator agent reviews it (different prompt, different perspective)
- This mimics code review and catches blind spots
- The evaluator should have explicit criteria, not just "does this look good?"

### Agentic vs Deterministic Task Assignment
Not everything needs AI. Assign tasks to the right processing type:
- **Deterministic:** Validation, formatting, calculation, file operations, state management
- **Agentic:** Creative generation, analysis, synthesis, conversation, judgment calls
- **The mistake:** Using AI for tasks that should be deterministic (e.g., regex matching, file I/O)

---

## When to Apply (Session Phases)

| Phase | IndyDev Dan Application |
|-------|------------------------|
| **0 - User Stories** | Context management -- what background knowledge is relevant? Load it |
| **1 - MINE** | Learning system -- what have we learned before about similar problems? |
| **2 - SCOUT** | Blueprint pattern -- generate options (agentic), then structure them (deterministic) |
| **3 - ASSAY** | Evaluator pattern -- evaluate options with explicit criteria, not just gut feel |
| **4 - CRUCIBLE** | Stress test protocol -- adversarial review of surviving options |
| **5 - AUDITOR** | Confidence scoring -- rate confidence 1-10 with evidence for each element |
| **6 - PLAN** | AI continuity -- plan must survive session boundaries, context resets |
| **7 - VERIFY** | Runtime-first verification -- simulate/test the plan, don't just review it |

---

## Example AI Prompts

### Phase 0 (User Stories)
- "Before we start, let's load context. What do you already know about this space? What have you tried before? What worked and what didn't? That history is valuable."
- "I want to understand the full context. Not just the problem -- the environment, the constraints, the resources, the timeline. Everything I need to think well about this."

### Phase 1 (MINE)
- "Have you or anyone you know faced a similar problem before? What was learned? Let's not start from zero if we don't have to."
- "Let's capture our assumptions explicitly. I'll list what I'm assuming is true -- you tell me which ones are validated and which are guesses."

### Phase 2 (SCOUT)
- "Let me generate a range of options freely -- no filtering yet. Then we'll switch to analytical mode and evaluate each one against criteria."
- "What if we approached this from a completely different angle? Let me try three reframes and see which one opens up new possibilities."

### Phase 4 (CRUCIBLE)
- "I'm switching to adversarial mode. I'm going to try to poke holes in this option. Not because I want it to fail -- because I want it to survive scrutiny."
- "On a scale of 1-10, how confident are we in each element of this plan? For anything below 8, what would increase our confidence?"

### Phase 5 (AUDITOR)
- "Let me do a fresh-eyes pass. Pretending I've never seen this before -- does it make sense? Is anything confusing or hand-wavy?"
- "What would a domain expert critique about this approach? What would an AI skeptic say? What would a customer say?"

### Phase 7 (VERIFY)
- "Let's not just review this plan -- let's simulate it. Walk through the first week of execution. What happens? Where does it break?"
- "If we had to hand this plan to someone who knows nothing about our conversation, would they be able to execute it? If not, what's missing?"

---

---

## When NOT to Use Dan Thinking (Critical)

Dan's frameworks excel at **AI-assisted work and reliability**.

They're less useful for:
- ❌ Pure human work (don't need the learning system if no AI)
- ❌ Deterministic tasks (use simple code/logic, not AI)
- ❌ Speed critical (Dan is deliberate; for speed, use Lean)

---

## Integration With Other Frameworks

**Dan's role:** The quality and reliability layer. The meta-methodology for thinking WITH AI.

**Pairs with:**
- **All other frameworks** — Dan provides QA + learning systems for all
- **McKinsey** — Dan validates McKinsey's analytical structure
- **Lean** — Dan stress-tests Lean's experimental cycle
- **Stoicism** — Dan demands the intellectual honesty Stoicism requires
- **Hormozi** — Dan ensures Hormozi's execution plans work in reality

**The biggest contribution:** Dan makes AI-assisted thinking RELIABLE.

Without Dan's patterns:
- AI sessions produce confident-sounding mediocrity
- Prompts work once, fail the next time
- Same mistakes repeat across sessions
- Nothing compounds

With Dan's patterns:
- AI outputs are stress-tested and verified
- Learnings accumulate across sessions
- Reliability compounds
- Quality improves over time

---

### 6. Evals-First Development (AI Product Architecture)

**The most important AI product contribution:** Build evals BEFORE code. This flips traditional software development.

**Traditional software development:**
```
Write code
  ↓
Write tests
  ↓
Run tests
  ↓
Ship
```

**AI product development (Dan's method):**
```
Define what "correct" looks like
  ↓
Build evaluation harness (measures correctness)
  ↓
Write code/prompts against eval criteria
  ↓
Iterate until evals pass
  ↓
Ship with confidence metrics
```

**Why it matters:** AI outputs are probabilistic. You can't test "correctness" with one example. You need:
- 50+ test examples covering edge cases
- Scoring criteria (not just pass/fail, but quality scores)
- Baseline performance (what did old system do?)
- Regression detection (did we break something that was working?)

**How to build an eval:**

**Step 1: Define the task**
```
Task: "Extract customer name from support email"
Input: Raw email text
Output: Single name string
```

**Step 2: Create reference examples (ground truth)**
```
Email: "Hi, I'm Sarah Johnson with Acme Corp..."
Expected output: "Sarah Johnson"

Email: "This is Dr. Margaret Smith-Williams writing about..."
Expected output: "Margaret Smith-Williams"

Email: "To whom it may concern, I go by Raj..."
Expected output: "Raj"
```

Aim for 30-100 examples covering:
- Happy path (obvious names)
- Edge cases (titles, hyphens, informal names)
- Hard cases (only first name given, ambiguous text)

**Step 3: Build scoring**
```
Exact match: 1.0 points
Partial match (first/last name present): 0.5 points
Wrong name: 0.0 points

Run 50 examples:
Score = (sum of points) / (number of examples)

Baseline (old system): 0.87
New system: 0.92
Improvement: 5.7%
```

**Step 4: Run evals before shipping any change**
```
Change prompt to: "Extract customer name, prefer full name"

Run 50-example eval:
New system: 0.94

If > 0.92: Ship it
If < 0.87: Revert (regression)
If 0.87-0.92: Manual review (is it actually better for users?)
```

**The evaluation metrics that matter:**
- **Accuracy:** % of correct outputs
- **F1 Score:** Balance of precision (how many we got right) + recall (how many we caught)
- **Latency:** Response time (5x slower = bad even if more accurate)
- **Cost:** $ per 1000 requests
- **User satisfaction:** Do real users prefer output A or B?

**Why evals prevent disaster:**
Without evals: Prompt change feels good → Ship → Users report failures → Rollback (chaos)
With evals: Prompt change → Evals fail → Fix before shipping → No user impact

---

### 7. Prompt Chaining Patterns (Breaking Complex Tasks Into Steps)

**The problem:** Complex LLM tasks fail because you ask one model to do too much. Solution: Break into sequential steps, each with its own prompt.

**Simple chaining (2-step problem):**

Task: "Take a customer complaint, determine sentiment, and suggest response"

**❌ WRONG (one prompt trying to do everything):**
```
System: "You are a customer service AI. Analyze this complaint, determine if it's angry/neutral/happy, and write a response."
User: "[long complaint email]"
Output: [often confused, tries to do too much, lower quality]
```

**✅ RIGHT (two chained prompts):**
```
STEP 1 (Analyze):
System: "You are a sentiment analyst. Classify this complaint as: ANGRY, FRUSTRATED, NEUTRAL, or SATISFIED."
User: "[complaint email]"
Output: "ANGRY" ← just the classification

STEP 2 (Respond):
System: "You are a customer service specialist responding to ANGRY customers."
User: "Customer's complaint: [original email]"
Output: "Dear customer, I sincerely apologize..."
```

**Why chaining works:**
- Step 1 is specialized (sentiment only) → higher accuracy
- Step 2 knows the sentiment upfront → better response
- Each step is testable independently
- Error doesn't cascade (if Step 1 fails, you know why)

**Complex chaining (5-step problem):**

Task: "Take research paper, extract key findings, identify relevance to our product, score impact, suggest follow-up research"

```
STEP 1 (Extract):
Input: Paper PDF
Output: Summary of key findings

STEP 2 (Relevance):
Input: Findings + Product description
Output: "Highly relevant" with reasoning

STEP 3 (Impact Score):
Input: Findings + Relevance assessment
Output: Numerical impact score (1-10)

STEP 4 (Risk Assessment):
Input: Findings + Impact
Output: Any risks or downsides?

STEP 5 (Follow-up):
Input: All above
Output: "You should research [topic]"
```

Each step:
- Gets exactly the context it needs
- Has a single, clear output format
- Can be eval'd independently
- Can be parallelized if steps don't depend on each other

**When to chain vs when to do it in one prompt:**
- Chain if: Output quality degrades with complexity, hard to eval, multiple distinct jobs
- One prompt if: Simple task, <2 sequential steps, can describe in clear English

---

### 8. The Trust-But-Verify Pattern (Probabilistic Without Blind Faith)

**The core tension:** AI is probabilistic. You can't trust it implicitly. But you can't manually verify everything either. Solution: Stratified verification.

**The pattern:**

**Layer 1: High-Risk Outputs (Always Verify)**
- Financial transactions (wrong amount = real money lost)
- Security/permissions changes (wrong access = breach)
- Irreversible actions (deletion, publishing)
- **Verification:** Human review + manual spot check

**Layer 2: Medium-Risk (Spot-Check + Confidence Score)**
- Customer-facing communication (tone/accuracy)
- Data quality (formatting, completeness)
- API integrations (wrong field mapping)
- **Verification:** Random 5-10% human review + system confidence threshold (only pass if confidence > 0.85)

**Layer 3: Low-Risk (Confidence Score Only)**
- Internal documentation formatting
- Thumbnail generation
- Routine categorization
- **Verification:** Confidence threshold only (no human review)

**Confidence score implementation:**

```
Task: "Generate email response to customer"

AI output options:
A) "Thank you for your feedback..." (confidence: 0.92)
B) "We'll review this internally..." (confidence: 0.78)

Decision:
- Option A (>0.85): Auto-send
- Option B (0.70-0.85): Queue for human review
- Below 0.70: Reject, ask AI to retry
```

**How to measure confidence:**
- Multiple attempts: Generate 3 variations → score agreement (high agreement = high confidence)
- Rubric scoring: Judge output against explicit criteria (all met = high confidence)
- Meta-uncertainty: Ask model "How confident are you?" (biased, but useful signal)
- Ensemble: Multiple models → if they agree = high confidence

**Why this beats pure automation or pure human review:**
- Pure automation: Misses errors, can't be trusted
- Pure human: Too slow, doesn't scale
- Trust-but-verify: Fast for simple cases, careful for risky cases

---

### 9. Context Window Management As Design Concern (Not an Afterthought)

**The problem:** LLMs have finite context windows (4k, 128k, etc.). As you add more knowledge, prompt efficiency matters more than brevity.

**Bad approach:** Stuff everything in, hope it fits
**Good approach:** Design context strategy from day one

**Context budget calculation:**

```
Total window: 128k tokens
Reserved for output: 4k tokens
Input budget: 124k tokens

Allocation:
- System prompt: 2k (20% of budget)
- User query: 1k (8%)
- Previous conversation: 20k (16%)
- Knowledge base: 80k (65%)
- Unused buffer: 21k (17%, for safety)
```

**This forces a choice:** Can we fit everything in 65k tokens of knowledge? If not, we need semantic search (query-specific knowledge injection).

**Compression patterns:**

**Pattern A: Abstractions (Full → One-liner)**
```
❌ Full context (2k tokens):
"The customer support system works like this:
1. Customer submits ticket
2. AI categorizes by urgency
3. If urgent, routes to human
4. If not, AI responds
5. Customer can escalate
6. Escalated tickets go to tier-2..."

✅ Abstraction (200 tokens):
"Support system: Triage by urgency → Route to AI or human → Allow escalation"
```

**Pattern B: Relevance filtering (Everything → Only relevant)**
Instead of: "Here's ALL our documentation"
Do this: "Based on your query about billing, here's billing + related docs only"

**Pattern C: Tiered detail (Comprehensive → Summary)**
```
Level 1 (most used): One-liner summary
Level 2: 2-3 paragraph description
Level 3: Full spec (only load if needed)
```

**Context lifecycle management:**

In a 15-minute conversation:
```
Minute 1-3: Full context needed (system prompt, task details, knowledge base)
Minute 5-10: Only recent conversation matters (previous context becomes "warm")
Minute 12-15: Preparing for context reset (save key insights before boundary)
```

**Before context reset (15-min boundary in Thinking Foundry):**
```
Current context: [full knowledge]
Action: Summarize into 500-token "context snapshot"
On reconnect: Inject snapshot instead of re-loading all 80k tokens
```

**Design checklist:**
- [ ] How many tokens does system prompt + knowledge base consume?
- [ ] Can we fit all essential knowledge in 60% of budget?
- [ ] What knowledge is "nice-to-have" vs "critical"? (Can we cut 20% if needed?)
- [ ] Do we have a semantic search layer for knowledge if it doesn't fit?
- [ ] What's our compression strategy for old context?

---

## Sources & Maintenance

**Primary Influences:**
- Andrej Karpathy, "Software 2.0" (how AI changes development)
- Andrej Karpathy, "A Programmer's Intuition for Matrix Multiplication" (systems thinking)
- IndyDev Dan system insights (4000+ learnings captured)
- DeepSeek, Claude, and other LLM architecture explorations

**Key Insights:**
- Karpathy's 90% × 7 = 47.8% (compound failure in sequential AI)
- The Learning System concept (captured from multiple successful AI projects)
- The Blueprint Pattern (emerges from code review best practices)
- The Stress Test Protocol (safety engineering applied to AI)

**Maintenance:** Continuous (as AI evolves, patterns evolve). Monthly review of new LLM capabilities, quarterly refresh with new patterns.

---

**Last Updated:** 2026-03-29
**File Size:** 726 lines
**Confidence Level:** Encyclopedic (frameworks + evals-first + prompt chaining + context management)

