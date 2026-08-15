# Mark Pincus — Proven / Better / New

**Source:** Mark Pincus's framework as publicly described; Zynga case studies (FarmVille, Zynga Poker).
**Attribution:** independent tooling. Not affiliated with or endorsed by Mark Pincus or Zynga. Never invent quotes or imply endorsement — name him and cite the public framework.

---

## Overview

Pincus's contribution: **all-new fails.** Moving a market with something nobody has validated takes capital and time most builders do not have, because a genuinely new idea carries the demand risk *and* the execution risk at once. Most attempts run out of runway proving demand exists at all.

So the strategy inverts. Build where demand is **already proven by someone else's revenue**, copy the working parts **literally**, spend the risk budget on being meaningfully **better** at the one thing people hate, and place small cheap **bets** on what is genuinely new.

**In a Thinking Foundry session,** this is the framework that asks: *is this idea worth building in the shape you are describing?* It applies from the very first exchange — knowing what a good idea looks like is what Phase 0 is for.

Crowded is not a reason to stop. Crowded is the evidence you were looking for. Crowded **plus no identified wedge** is the reason to stop.

---

## Core Frameworks & Principles

### 1. Instinct vs Idea — apply this before anything else

The most useful distinction in the framework, and the one people skip.

When Uber appeared, an enormous number of people said *"I had that exact idea."* They did not. They had the **instinct** — *I am holding a computer, I should not be standing in the rain waving at traffic.* That instinct was widely held and basically correct.

The **idea** — the specific implementation — is what separated the outcomes. One implementation was **SMS Taxi**: text the dispatcher, they send a cab. It never got off the ground. Another was: everybody has a phone, so let anyone with a car become the driver. Same instinct. Different idea. Different company.

**How to use it in conversation:**

- The instinct is cheap, shared, and usually right. It is **not** a competitive advantage and must never be treated as one.
- The idea is where all the value and all the risk sit.
- **Generating rival implementations of the same instinct is the highest-value cheap move available.** If the person's idea cannot be distinguished from a rival on a stated axis, that is the finding — say it plainly.
- Include the historical losers among the rivals. SMS Taxi is more instructive than Uber, because it shows a correct instinct producing a dead company.

**Questions that surface it:**
- "What's the instinct underneath this — the thing you believe is true about the world?"
- "Who else has had that same instinct, and what did they build instead?"
- "If someone acted on that instinct tomorrow without knowing you, what would they build?"

---

### 2. PROVEN — copy exactly

The instruction is stronger than it first reads: **copy the working parts literally.** Not "take inspiration from". Not "build our own version of".

Zynga cloned an existing poker client's exact table layout and mechanics. The FarmVille plot-and-plant loop was already a genre with many entrants. Neither was disguised as original, and that was the point — the core loop was validated, so reinventing it would have been unforced risk spent on a solved problem.

**What to establish:**

- **Named incumbents**, not a category. "Nutrition apps" is not an incumbent; MyFitnessPal and Cal AI are.
- **Demand evidence** that is verifiable: revenue, funding, acquisition price, user counts, app-store rank.
- **Table stakes** — the things you must have or nobody will use your version.

The proven column is about what **works**, not what is **liked**. An onboarding paywall users complain about loudly and convert through anyway belongs in this column. Copying a disliked-but-effective mechanism is a correct application of the framework.

**When nothing is proven:** the idea is not dead, it has changed genre. An unproven category means the primary bet is that demand exists at all — the expensive game this framework exists to steer away from. Say that explicitly rather than manufacturing a proven column out of loose analogues.

---

### 3. BETTER — the 9-of-10 switch test

The test is not "is this an improvement". It is: **would a current user of the incumbent, with all their existing data and habits, leave?** Rate it out of ten. Nine or ten counts. Everything below is noise.

The bar is deliberately high because switching costs are systematically underestimated by the person proposing the switch. The incumbent's user has history in the product, muscle memory, possibly a paid plan, possibly social connections inside it. A 6/10 improvement does not overcome that.

**Where "better" genuinely lives:**

- **Removing a required step.** Zynga Poker's entire better was killing the client download. Every step you ask a user to take costs conversion; deleting one is worth more than adding three features.
- **Fixing an accuracy or trust failure.** When users believe they are on track and are not, that is a trust failure with visible, citable complaints — the strongest possible target.
- **Raising craft where craft is visible.** FarmVille's art was meaningfully better than its competitors'. Not a feature; a quality gradient perceived immediately.

**The evidence rule:** a "better" claim without a real, citable complaint is a guess wearing a finding's clothes. Someone must already be saying, in public, that the thing you plan to fix is broken. Ask: *who is already complaining about this, and where?*

---

### 4. NEW — the bets

New is where the wedge lives and where the risk concentrates. Treat every new item as an experiment with a falsification condition, not as a feature.

Zynga's new was consistently social and consistently **visible**: friends visit your farm; your friends' faces appear at the poker table. Small, cheap, immediately perceptible, iterated constantly.

**Two failure modes to name out loud when you see them:**

- **Invisible new.** Genuine technical novelty the user never perceives is engineering satisfaction, not a wedge. Retrieval architecture, orchestration design and data models are all invisible unless they change something the user can feel.
- **New as the whole plan.** If proven and better are thin and all the weight sits in new, the framework has been inverted and the person is back to building all-new.

---

### 5. Tensions worth calling

Say the uncomfortable thing. These recur:

- **Feature sold as outcome.** "It's graph RAG" is not a reason anyone switches. No user has ever chosen a product for its retrieval architecture.
- **Better that is not better enough.** A 3/10 improvement across five dimensions loses to a 9/10 improvement on one.
- **Proven borrowed from the wrong category.** Demand proven for adjacent buyers is not demand proven for yours.
- **Instinct-idea drift.** The stated idea solves a different instinct than the one they opened with.

---

## When to Apply

### Phase 0: User Stories

Establish the **instinct** before accepting the idea. When someone opens with a solution ("I'm building X"), find the instinct underneath it, then confirm the idea is one implementation of that instinct rather than the only conceivable one.

Ask who the switcher is — a person with a current tool, not a market segment — and what they use today. "Nothing" is a valid answer and changes everything downstream.

### Phase 1: MINE

Separate instinct from idea explicitly and record both. Generate rival implementations of the same instinct, including a historical failure where one exists. If the idea cannot be distinguished from a rival, that is the root finding.

### Phase 2: SCOUT

Name real incumbents and gather demand evidence. Expand the rival set. The possibility space here is "other implementations of this instinct", not "other features".

### Phase 3: ASSAY

Run the full sort: what is proven and must be copied exactly, what would have to be better and by how much, what is genuinely new and therefore a bet. Apply the 9-of-10 switch test with a named incumbent and a real complaint behind it.

### Phase 4: CRUCIBLE

Stress-test the wedge. Who tried something adjacent and died, and why? Is the "new" perceivable by a user? Is the "better" better *enough*?

### Phase 5: AUDITOR

Check for instinct-idea drift, and for a feature being sold as an outcome. Confirm no claim in the "better" column rests on assumption rather than a complaint someone actually made.

### Phase 6: PLAN

Name the one thing that would most change the verdict, and the cheapest way to find it out this week.

### Phase 7: VERIFY

The record should show the instinct, the idea, the rivals considered, and the specific reason this implementation was chosen over them.
