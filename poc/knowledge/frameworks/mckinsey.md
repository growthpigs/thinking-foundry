# McKinsey Problem-Solving Framework

## Core Philosophy

The McKinsey approach to problem-solving is built on a single principle: **structure turns chaos into clarity.** When facing any complex problem, the first step is never to brainstorm solutions -- it's to decompose the problem into mutually exclusive, collectively exhaustive (MECE) components, form a hypothesis, then test it with data.

This framework is used by the world's top consulting firms, Fortune 500 strategy teams, and high-stakes decision-makers. In a Thinking Foundry session, it provides the analytical backbone that turns messy real-world problems into structured, solvable challenges.

---

## Core Principles

### 1. MECE (Mutually Exclusive, Collectively Exhaustive)

The foundation of McKinsey thinking. Every time you break a problem into parts:

- **Mutually Exclusive:** No overlap. Each piece is distinct. If something could fit in two categories, your structure is wrong
- **Collectively Exhaustive:** Nothing is missing. All possibilities are covered. No gaps

**Example - Revenue Problem:**
- Bad (not MECE): "Marketing issues, pricing issues, customer issues, product issues" (overlapping)
- Good (MECE): Revenue = Price x Volume. Volume = New Customers + Returning Customers. Price = List Price - Discounts

**Why it matters:** MECE prevents you from double-counting issues, missing blind spots, or going in circles. It forces completeness and precision.

**AI Prompt Pattern:**
> "Let's structure this. I want to break this problem down so we cover everything without overlap. Here's my first cut at the MECE breakdown -- what am I missing?"

### 2. Hypothesis-Driven Thinking

Don't boil the ocean. Start with a hypothesis about the answer, then test it. This is the opposite of "let's research everything and see what emerges."

**Process:**
1. Form an initial hypothesis: "I believe the root cause is X because of Y"
2. Identify what would need to be true for the hypothesis to hold
3. Design tests/analyses to validate or invalidate each "what would need to be true"
4. If invalidated, pivot to next hypothesis

**Why it matters:** Prevents analysis paralysis. Forces action. Saves massive time compared to undirected research. You're always working toward an answer, not just accumulating data.

**AI Prompt Pattern:**
> "Based on what you've told me, my working hypothesis is [X]. For that to be true, three things would need to hold: [A], [B], [C]. Let's test each one. Starting with [A] -- does that hold up?"

### 3. Issue Trees

Visual decomposition of a problem into sub-problems, sub-sub-problems, etc. The skeleton of structured problem-solving.

**Types:**
- **Diagnostic Issue Tree:** "Why is revenue declining?" branches into causes
- **Solution Issue Tree:** "How can we grow revenue?" branches into options
- **Yes/No Issue Tree:** Each branch is a binary question that narrows the problem

**Building an Issue Tree:**
1. Start with the core question at the top
2. Break into 2-5 MECE branches (first level)
3. Break each branch into 2-4 MECE sub-branches
4. Stop when branches are small enough to test directly
5. Prioritize: which branches have the highest impact and are most testable?

**Example:**
```
Why is customer retention dropping?
├── Product issues
│   ├── Feature gaps vs. competitors
│   ├── Reliability/bugs
│   └── UX friction
├── Service issues
│   ├── Response time
│   ├── Resolution quality
│   └── Proactive communication
├── Pricing/value issues
│   ├── Cheaper alternatives emerged
│   ├── Perceived value decreased
│   └── Pricing model misalignment
└── Market/external issues
    ├── Customer needs shifted
    ├── Industry consolidation
    └── Regulatory changes
```

### 4. The Pyramid Principle (Barbara Minto)

Communicate top-down. Lead with the answer, then support with evidence. Never make someone sit through your analysis journey to get to the conclusion.

**Structure:**
1. **Governing Thought:** The one-sentence answer/recommendation
2. **Key Arguments:** 2-4 supporting reasons (MECE)
3. **Evidence:** Data/facts supporting each argument

**Application in thinking sessions:** When synthesizing findings, always start with "Here's what I think the answer is..." then provide supporting reasoning. Don't narrate the analysis process.

### 5. 80/20 Rule (Pareto Principle)

80% of the value comes from 20% of the effort. In problem-solving:
- 80% of revenue comes from 20% of customers
- 80% of bugs come from 20% of the code
- 80% of complaints come from 20% of issues

**Application:** After building an issue tree, identify the 20% of branches that drive 80% of the impact. Focus there. Ignore the rest until those are solved.

---

## Key Techniques

### Day 1 Answer

Before doing any analysis, write down what you think the answer is right now. This:
- Forces you to commit to a hypothesis
- Creates a baseline to measure learning against
- Prevents the "we need more data" trap
- Often reveals that you know more than you think

### Disagree and Commit

When the team can't agree, use structured argumentation:
1. Each person states their position and top 3 supporting reasons
2. Identify where the disagreement actually lies (often it's 1 assumption, not the whole conclusion)
3. Design a test for that specific assumption
4. Commit to following the data, regardless of who was right

### So What? Test

For every analysis, finding, or data point, ask: "So what?" If you can't connect it to an actionable recommendation, it's noise. Keep asking "So what?" until you reach something someone can actually DO.

### Govern by Exception

Don't review everything. Define what "normal" looks like, then only focus on exceptions. In problem-solving: identify what's DIFFERENT about the failing cases versus the successful ones.

### Waterfall Chart Analysis

When analyzing a metric that changed over time:
1. Start with the original value
2. List every factor that added or subtracted
3. Arrive at the current value
4. The biggest waterfall "step" is your priority

---

## Analytical Frameworks (Common Structures)

### Profitability
Revenue - Costs = Profit
- Revenue = Price x Volume
- Costs = Fixed Costs + Variable Costs

### Market Entry
- Market attractiveness (size, growth, profitability, trends)
- Competitive landscape (players, concentration, barriers)
- Company capability (assets, skills, brand, distribution)
- Economics (investment required, payback period, risk)

### Growth Strategy
- Organic: Existing products to existing markets (penetration)
- Adjacent: Existing products to new markets OR new products to existing markets
- Transformational: New products to new markets

### 3C Framework
- Company (strengths, weaknesses, strategy, resources)
- Customers (segments, needs, behaviors, willingness to pay)
- Competitors (positioning, strategy, strengths, vulnerabilities)

### Porter's Five Forces
1. Threat of new entrants
2. Bargaining power of suppliers
3. Bargaining power of buyers
4. Threat of substitutes
5. Competitive rivalry

---

## When to Apply (Session Phases)

| Phase | McKinsey Application |
|-------|---------------------|
| **0 - User Stories** | Day 1 Answer -- capture the initial hypothesis before analysis |
| **1 - MINE** | Issue Tree -- decompose the problem into MECE branches |
| **2 - SCOUT** | Solution Issue Tree -- structure possible solutions MECE-ly |
| **3 - ASSAY** | 80/20 Analysis -- which options drive the most impact? Prioritize |
| **4 - CRUCIBLE** | Hypothesis testing -- what must be true for each option? Test |
| **5 - AUDITOR** | "So What?" test -- does every element connect to an action? |
| **6 - PLAN** | Pyramid Principle -- structure the plan top-down: answer first, then logic |
| **7 - VERIFY** | Governing thought -- can you state the entire plan in one sentence? |

---

## Example AI Prompts

### Phase 0 (User Stories)
- "Before we analyze anything, what do you think the answer is right now? Your gut feeling. We'll come back to this later."
- "Let me capture the core question we're trying to answer. Is it: [reframed question]? Getting this right matters -- it shapes everything else."

### Phase 1 (MINE)
- "Let me build an issue tree. I'm going to break this problem into pieces that don't overlap and cover everything. First level: [branches]. Does that capture the full picture?"
- "Which of these branches do you think matters most? Where's the 80/20 -- the one area driving most of the problem?"

### Phase 2 (SCOUT)
- "Now let's flip from diagnostic to solution mode. For each problem branch, what are the possible solutions? I want them MECE -- distinct options, full coverage."
- "For each solution, what would need to be true for it to work? Let's list the assumptions."

### Phase 3 (ASSAY)
- "Applying 80/20: of these 8 options, which 2 would drive the most impact? Let's focus there and park the rest."
- "For option A, here's my hypothesis: it works if [condition 1], [condition 2], and [condition 3] are all true. Which of these are we most uncertain about?"

### Phase 4 (CRUCIBLE)
- "Let's stress-test. For your top option, what's the one assumption that, if wrong, kills the entire approach? How confident are you in it on a scale of 1-10?"
- "If a competitor was trying to make this fail, what would they attack? That's where we need contingencies."

### Phase 6 (PLAN)
- "Let me structure this as a pyramid. The governing thought -- the one-sentence recommendation -- is: [X]. Supporting that are three pillars: [A], [B], [C]. Does that capture it?"
- "If you had to present this plan in 30 seconds to a skeptical board member, what would you say? That's our test of clarity."

---

## Integration Notes

McKinsey thinking is the analytical engine of the session. It pairs with:
- **Design Thinking** to ensure analysis stays human-centered (McKinsey can be cold)
- **Stoicism** to manage the emotional difficulty of following data over intuition
- **Lean Startup** to turn hypotheses into cheap experiments instead of expensive analyses

The biggest contribution of McKinsey thinking to a session: **it prevents woolly thinking.** Every statement must be precise, structured, and testable. No hand-waving. No "it depends." Force clarity.
