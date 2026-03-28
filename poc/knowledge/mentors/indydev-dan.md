# IndyDev Dan's AI Development Frameworks

## Who is IndyDev Dan

IndyDev Dan (Daniel) is a pioneering AI development practitioner who has developed a comprehensive system for building AI-powered products effectively. His core insight: **AI development is fundamentally different from traditional software development, and treating it the same way leads to failure.** His approaches focus on structured AI integration, learning systems, prompt engineering patterns, and the unique challenges of building products where a probabilistic model is a core component.

In a Thinking Foundry session, Dan's frameworks are essential when the problem involves building with AI, integrating LLMs, designing AI-powered products, or managing the unique risks of AI systems.

---

## Core Frameworks

### 1. The Learning System Architecture

Dan's most distinctive contribution. Instead of treating AI outputs as static, build systems that learn from every interaction:

**The Learning Loop:**
1. **Capture:** Every AI interaction generates a learning signal (what worked, what didn't)
2. **Index:** Organize learnings by domain, pattern, and context
3. **Surface:** Make relevant learnings available at the right time
4. **Apply:** Inject learnings into future prompts, decisions, and system behavior

**Why it matters:** Most AI implementations reset to zero every session. A learning system means the AI gets better over time -- not through fine-tuning, but through accumulated contextual knowledge.

**Implementation Pattern:**
- Store insights with metadata (category, confidence, context)
- Before any AI task, search for relevant prior learnings
- After any AI task, capture new insights
- Periodically condense and prune (progressive summarization)

**AI Prompt Pattern:**
> "What have we learned from previous attempts at this? What patterns have we seen? Let's not repeat mistakes or rediscover things we already know."

### 2. The Blueprint Pattern (Deterministic + Agentic Alternation)

Dan's approach to reliable AI coding and product development. The key insight: **alternate between deterministic verification and agentic creativity.**

**The Cycle:**
```
PLAN (deterministic) → GENERATE (agentic/creative) → VERIFY (deterministic) → EVALUATE (separate agent) → DECIDE (deterministic)
```

**Why this works:**
- Pure agentic = unreliable, hallucinates, misses edge cases
- Pure deterministic = too slow, no creativity, can't handle ambiguity
- Alternating = creative solutions with verified correctness

**Application beyond coding:**
- Use this for any creative-then-analytical workflow
- Brainstorm freely (agentic), then structure and verify (deterministic)
- Generate options (agentic), then evaluate with criteria (deterministic)

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

### 4. The Stress Test Protocol

Dan's approach to quality assurance for AI-powered outputs:

**The Protocol:**
1. **Runtime-First Verification:** Don't trust that code compiles -- run it. Don't trust that a plan looks good -- simulate it
2. **Adversarial Self-Review:** After generating output, switch to "QA mode." What would break? What was assumed? What's hiding?
3. **Confidence Scoring:** Rate confidence 1-10 with specific evidence. Below 9 = keep fixing
4. **Fresh Eyes Pass:** Re-read the output as if you've never seen the problem before. What's confusing?

**Why this matters:** AI agents self-evaluate positively on mediocre work. They say "done" at 80%. The last 20% -- the part that catches real bugs -- only happens under adversarial pressure.

**Application to thinking sessions:**
- Don't accept the first answer as the best answer
- Challenge every conclusion with "what would a skeptic say?"
- Test plans against reality, not just logic
- Score confidence and make it explicit

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

## Integration Notes

Dan's frameworks are the meta-methodology -- how to think about thinking with AI. They pair with:
- **All other frameworks** as the quality assurance layer
- **McKinsey** for the analytical structure that the Blueprint Pattern validates
- **Lean** for the experimental loop that the Stress Test Protocol verifies
- **Stoicism** for the intellectual honesty that adversarial self-review demands

The biggest contribution of Dan's thinking: **it makes AI-assisted thinking reliable.** Without these patterns, AI sessions produce confident-sounding mediocrity. With them, they produce verified, stress-tested conclusions.
