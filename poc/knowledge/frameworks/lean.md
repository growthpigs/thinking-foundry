# Lean Methodology Framework

## Core Philosophy

Lean methodology, developed from Toyota's production system and adapted for startups by Eric Ries in "The Lean Startup," is built on one central insight: **the biggest risk in any venture isn't building it wrong -- it's building the wrong thing.** Lean eliminates waste by treating every assumption as a hypothesis, every feature as an experiment, and every user interaction as data.

In a Thinking Foundry session, Lean thinking prevents over-planning and over-building. It forces the question: "What's the cheapest, fastest way to learn whether this idea works?"

---

## Core Principles

### 1. Build-Measure-Learn Loop

The engine of Lean. Every decision cycles through:

**BUILD** -- Create the minimum artifact needed to test your hypothesis
- Not a full product. Not a polished prototype. The MINIMUM thing that generates learning
- Could be a landing page, a spreadsheet, a manual process, a conversation
- Speed matters more than quality at this stage

**MEASURE** -- Collect data on what actually happened
- Define your success metric BEFORE building (prevents post-hoc rationalization)
- Measure behavior, not opinions
- Use cohort analysis: compare groups over time, not just totals
- Innovation accounting: track leading indicators, not just revenue

**LEARN** -- Draw conclusions and decide next move
- Did the hypothesis hold? Pivot or persevere?
- What surprised you? Surprises contain the most learning
- What new hypothesis emerged from the data?

**Cycle Speed is Everything:**
- Faster loops = more learning per unit time = higher chance of success
- Target: complete one full loop per week minimum
- Each loop should invalidate at least one assumption

**AI Prompt Pattern:**
> "What's the one assumption that, if wrong, invalidates this entire idea? How could we test it this week with zero code?"

### 2. Minimum Viable Product (MVP)

The smallest thing you can build that delivers value AND generates learning. Not a crappy version of the full product -- a focused experiment testing one hypothesis.

**Types of MVP:**
- **Concierge MVP:** Deliver the service manually to a few users. Zero technology
- **Wizard of Oz MVP:** Users interact with what looks like technology, but a human is behind the curtain
- **Landing Page MVP:** Describe the product, add a signup/buy button, measure interest
- **Video MVP:** Explain the product in a video, measure response (Dropbox did this)
- **Single Feature MVP:** Build ONLY the one feature that delivers core value
- **Pre-order MVP:** Sell it before building it (Kickstarter model)

**MVP Rules:**
1. An MVP is NOT an excuse for bad quality -- it's a test of a specific hypothesis
2. Define what you'll learn BEFORE building the MVP
3. Set a success threshold BEFORE launching ("if fewer than 20% convert, we pivot")
4. Ship it to real users, not friends and family
5. Resist the urge to add "just one more feature"

**Common Mistake:** Building an MVP that tests nothing. "We built the app with fewer features" is not an MVP if you didn't define what you're learning.

**AI Prompt Pattern:**
> "What hypothesis does this MVP test? What's the success threshold? What will you do if it fails? If you can't answer these, it's not an MVP -- it's just a small product."

### 3. Validated Learning

The only progress that matters is learning backed by data. Everything else is "success theater" (looking productive without actually learning).

**What counts as validated learning:**
- "We hypothesized X. We tested with [experiment]. Results showed Y. We now know Z."
- Quantitative: conversion rates, retention rates, usage frequency
- Qualitative: user behavior patterns, unexpected use cases, pain points

**What does NOT count:**
- "We built 12 features this month" (output, not learning)
- "Users said they liked it" (opinion, not behavior)
- "We got 10,000 signups" (vanity metric unless they convert)
- "We feel good about the direction" (feeling, not data)

### 4. Pivot or Persevere

After each Build-Measure-Learn cycle, make an explicit decision:

**Persevere** when:
- Key metrics are trending in the right direction
- User behavior matches your hypothesis
- Early adopters are passionate (not just polite)
- You're learning things that strengthen your conviction

**Pivot** when:
- Metrics plateau despite iteration
- Users like a feature you didn't intend as core
- Your hypothesis was invalidated
- You discover a better opportunity in adjacent space

**Types of Pivot:**
- **Zoom-in:** One feature becomes the whole product
- **Zoom-out:** Whole product becomes one feature of something bigger
- **Customer segment:** Same product, different audience
- **Customer need:** Same audience, different problem
- **Platform:** Product becomes a platform (or vice versa)
- **Business model:** Same product, different monetization
- **Channel:** Same product, different distribution
- **Technology:** Same user experience, different technical approach

**AI Prompt Pattern:**
> "Based on what you've learned so far, is this a 'persevere and iterate' or a 'pivot to something adjacent'? What data supports that decision?"

### 5. Eliminate Waste

Anything that doesn't contribute to validated learning is waste. Common sources:

- **Building features nobody uses** (the #1 source of waste in startups)
- **Over-engineering for scale you don't have** (premature optimization)
- **Long planning cycles** (planning is guessing -- plan less, test more)
- **Waiting for perfection** (shipping imperfect things generates learning)
- **Batch processing** (small batches = faster feedback loops)

---

## Key Techniques

### Innovation Accounting

Traditional accounting measures revenue and profit. Innovation accounting measures progress toward product-market fit:

**Three stages:**
1. **Establish baseline:** What are your current metrics? (conversion, retention, etc.)
2. **Tune the engine:** Each experiment should move a specific metric
3. **Pivot or persevere:** If metrics stall despite efforts, pivot

**Leading indicators to track:**
- Activation rate (% who complete core action)
- Retention rate (% who come back day 7, day 30)
- Referral rate (% who invite others)
- Revenue per user
- Customer acquisition cost (CAC) trend

### The Five Whys (Root Cause Analysis)

When something goes wrong, ask "Why?" five times to get to root cause:

1. "The deployment failed." Why?
2. "A test wasn't run." Why?
3. "The developer forgot." Why?
4. "There's no checklist." Why?
5. "We never created a deployment process." -- Root cause: process gap

**Rule:** Make proportional investment at each level. Small problem = small fix. Recurring problem = systemic fix.

### Small Batches

Do less at a time, ship more frequently:
- Ship daily instead of weekly
- Test one hypothesis at a time, not five
- Release to 10 users, then 100, then 1,000
- Smaller batches = faster feedback = less wasted effort

### Continuous Deployment

Every change goes live immediately (or nearly):
- Forces small, safe changes
- Provides immediate feedback
- Prevents "big bang" launches that fail catastrophically
- Builds deployment as a muscle, not an event

### The Kanban Board Approach

Limit work-in-progress. Don't start new things until current things are validated:
- **To Test** (hypotheses waiting for experiments)
- **Building** (experiments under construction) -- limit to 2-3
- **Measuring** (experiments live, collecting data) -- limit to 2-3
- **Learning** (data collected, conclusions being drawn)
- **Done** (validated learning captured, decision made)

---

## Lean Canvas (One-Page Business Model)

Replace the 40-page business plan with a single page:

| Element | Question |
|---------|----------|
| **Problem** | Top 3 problems you're solving |
| **Customer Segments** | Who has these problems? |
| **Unique Value Prop** | Single clear message of why you're different |
| **Solution** | Top 3 features that solve the problems |
| **Channels** | How do you reach customers? |
| **Revenue Streams** | How do you make money? |
| **Cost Structure** | What are your main costs? |
| **Key Metrics** | What numbers tell you you're succeeding? |
| **Unfair Advantage** | What can't be easily copied? |

**Rules:** Fill it in in 20 minutes. Revisit weekly. Most boxes will change as you learn.

---

## When to Apply (Session Phases)

| Phase | Lean Application |
|-------|-----------------|
| **0 - User Stories** | Identify the core assumption -- what's the riskiest assumption in this problem? |
| **1 - MINE** | Five Whys -- dig to root cause. Lean Canvas -- map the landscape quickly |
| **2 - SCOUT** | MVP thinking -- for each option, what's the cheapest experiment? |
| **3 - ASSAY** | Innovation accounting -- which option has the fastest learning loop? |
| **4 - CRUCIBLE** | Pivot analysis -- does data support this path? What type of pivot is available? |
| **5 - AUDITOR** | Waste elimination -- what are we building that nobody asked for? |
| **6 - PLAN** | Small batches -- break the plan into weekly BML loops |
| **7 - VERIFY** | Success thresholds -- define what "validated" looks like for each step |

---

## Example AI Prompts

### Phase 0 (User Stories)
- "What's the riskiest assumption hiding in this problem? The one thing that, if wrong, makes everything else irrelevant?"
- "Forget the solution for a moment. Tell me about the problem. How do you know it's real? What evidence do you have beyond your own experience?"

### Phase 1 (MINE)
- "Let's do the Five Whys on this. You said [problem]. Why does that happen? [Answer.] And why does THAT happen? Keep going -- we need the root cause, not the symptom."
- "Let's fill out a quick Lean Canvas. Don't overthink it -- 20 minutes, gut feel. We'll revise it as we learn."

### Phase 2 (SCOUT)
- "For each of these options, what's the MVP? Not the product -- the experiment. What's the cheapest way to test whether this works?"
- "Which of these options could you validate in one week? That's the one we should prioritize."

### Phase 3 (ASSAY)
- "Which option has the fastest Build-Measure-Learn loop? The one where you can learn the most in the least time wins."
- "Before we pick, define the success threshold for each. What metric, at what level, tells you this is working?"

### Phase 4 (CRUCIBLE)
- "You've been working on this for a while. Is the data telling you to persevere or pivot? Let's be honest -- what does the data actually show?"
- "If you were going to pivot, what type would it be? Zoom-in? Customer segment? Channel? Sometimes naming the pivot option makes persevering more intentional."

### Phase 6 (PLAN)
- "Break this plan into weekly Build-Measure-Learn loops. Week 1: build [X], measure [Y], learn [Z]. What does each week look like?"
- "What can we cut from this plan? Every feature that doesn't directly test our core hypothesis is waste right now."

### Phase 7 (VERIFY)
- "For each step in this plan, what's the validation gate? What specific result means 'proceed to next step' vs. 'stop and rethink'?"
- "Are we default alive or default dead after executing this plan? Run the numbers."

---

## Integration Notes

Lean is the execution methodology. It works alongside:
- **Design Thinking** for the empathy and ideation phases
- **YC** for the urgency and user-centricity
- **McKinsey** for the analytical rigor when evaluating experiments
- **Hormozi** for the value equation when designing MVPs

The biggest contribution of Lean to a thinking session: **it converts abstract plans into concrete experiments with clear success criteria.** No more "let's see how it goes." Every step has a hypothesis, a test, and a decision gate.
