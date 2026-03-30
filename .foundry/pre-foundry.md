# Pre-Foundry — Client Intake & Raw Requirements

**Everything that happens BEFORE Phase 0 (LAUNCH).** This is where raw human input becomes structured material that the Foundry can process.

---

## When Pre-Foundry Runs

| Scenario | Pre-Foundry? | Why |
|----------|-------------|-----|
| New client project (IT Concierge, etc.) | YES — full intake | Need interview, requirements, agreement |
| New personal project (LifeModo) | YES — self-intake | Roderic interviews himself via voice memo |
| New feature on existing project | NO — go straight to LAUNCH | Project context exists, skip intake |
| Bug fix | NO — go straight to Post-Foundry triage | Not a new project |

## The Pre-Foundry Flow

```
Step 1: INTERVIEW (Gemini Gem)
   ↓
Step 2: CAPTURE (transcribe, extract, structure)
   ↓
Step 3: QUALIFY (kill criteria — is this worth building?)
   ↓
Step 4: AGREE (Agreement doc — SOW + MOU)
   ↓
Handoff → Phase 0 (LAUNCH) → Phase 1 (MINE)
```

---

## Step 1: INTERVIEW — The AI App Intake Workshop

**Tool:** Gemini Gem — AI App Intake Workshop
**URL:** https://gemini.google.com/gems/edit/7bb143c0ca15

The Gem uses IDEO's human-centered design methodology to run a structured client interview. It captures:
- What the client's business does
- Their pain points and frustrations
- Their goals and aspirations
- What they've tried before
- Who their users are
- Budget and timeline expectations

### For Client Projects (IT Concierge, War Room, etc.)

1. Open the Gemini Gem
2. Tell the client: "I'm going to ask you some questions. Just talk naturally. There are no wrong answers."
3. Run the Gem's interview flow
4. The Gem produces a structured intake document

### For Self-Projects (LifeModo)

When Roderic is both the builder and the client:

1. **Voice memo** — Talk into your phone for 10-30 minutes. Stream of consciousness. Everything about what you want to build and why.
2. **Transcribe** — Use `yt-dlp` or voice transcription to get text
3. **Feed to Gem** — Paste the transcript into the Gemini Gem for structured extraction
4. **Review** — Read the Gem's output. Add what it missed. Correct what it got wrong.

### What the Gem Extracts

| Output | What It Is | Feeds Into |
|--------|-----------|------------|
| Problem statement | 1-3 sentences | MINE (Phase 1) |
| Pain points | Bulleted list with severity | Client Requirements (Admin doc #2) |
| User descriptions | Who uses this and why | Buyer Personas |
| Existing solutions | What they use now, what's broken | SCOUT competitive research |
| Budget/timeline | What they can spend, when they need it | Agreement (Admin doc #1) |
| Success criteria | "It's working when..." | KPIs (Admin doc #11) |
| Raw quotes | Verbatim client language | Invaluable for Buyer Persona pressure tests |

---

## Step 2: CAPTURE — Structure the Raw Material

The Gem output is structured but not Foundry-ready. Transform it:

1. **Create a GitHub repo** for the project (if it doesn't exist)
2. **Create the Admin milestone** with 18 empty issues (Article 14)
3. **Draft Agreement** (Admin doc #1) from the budget/timeline/scope discussed
4. **Create a raw intake doc** — paste the Gem output + any voice transcripts + screenshots + WhatsApp messages. This lives in `docs/00-intake/`
5. **Tag notable quotes** — anything the client said that reveals deep need or concern. These become Buyer Persona raw material.

---

## Step 3: QUALIFY — Kill Criteria

Before investing in MINE/SCOUT/ASSAY, check the kill criteria:

| Criteria | Signal | Action |
|----------|--------|--------|
| **No buyer persona** | Client can't describe who uses it | SHOWSTOPPER — stop until persona is defined |
| **No pain** | "It would be nice to have" (not "I need this") | SHOWSTOPPER — no pain = no product |
| **Technically infeasible** | Requires technology that doesn't exist | FLAG — don't kill, but flag loudly |
| **Budget mismatch** | Client budget is 10x less than realistic cost | DISCUSS — realign scope or walk away |
| **Competitor already solved it** | Exact solution exists at lower price | PIVOT — find the differentiation or don't build |

If ANY showstopper triggers → have the conversation. Don't proceed to LAUNCH hoping it'll resolve itself.

---

## Step 4: AGREE — The Agreement

Draft the Agreement (Admin doc #1, Article 33 of the Constitution):

- Scope: What will be delivered
- Financial terms: Budget, payment schedule, milestones
- IP ownership: Who owns the code
- Timeline: In DUs, not calendar dates
- Special terms: Debt settlement, partnership, equity — whatever applies

The Agreement is created during Pre-Foundry but lives as a GitHub Issue in the Admin milestone. It's the first Admin doc — everything else flows from what was agreed.

---

## Handoff to The Foundry

Pre-Foundry is complete when you have:

- [ ] Gem interview output (structured)
- [ ] Raw intake doc in `docs/00-intake/`
- [ ] GitHub repo created
- [ ] Admin milestone with 18 empty issues
- [ ] Agreement drafted (Admin doc #1)
- [ ] Kill criteria passed (no showstoppers)
- [ ] At least 1 buyer persona identified (even rough)

**Then:** Run `bin/launch.sh --mode GREENFIELD` and start Phase 1 (MINE).

MINE takes the Gem output as its primary input — the firehose has already been opened during the interview. MINE's job is to supplement it with anything the Gem missed.

---

## Handoff Document Format

The Pre-Foundry output MUST follow this exact structure. This is the data contract between Pre-Foundry and MINE. Any tool (Gemini Gem, manual interview, voice memo) must produce this format:

```markdown
# [Project Name] — Intake Document

## 1. Problem Statement
[1-3 sentences. What pain does this solve? For whom?]

## 2. Client Quotes (verbatim)
- "[Exact words the client used about their pain]"
- "[Exact words about what they wish existed]"
- "[Exact words about what they've tried]"

## 3. Buyer Persona (rough)
- **Name:** [Real or archetypal]
- **Role:** [What they do]
- **Pain:** [Their #1 frustration]
- **Current solution:** [What they use now]
- **Budget signal:** [What they said about money/value]

## 4. Scope Boundaries
- **Must have:** [Non-negotiable features]
- **Nice to have:** [Would be great but can wait]
- **Explicitly out:** [Things we agreed NOT to build]

## 5. Financial Terms
- **Budget:** [Amount, currency]
- **Payment structure:** [Milestones, retainer, equity, debt settlement]
- **Timeline expectation:** [When they need it]

## 6. Existing Materials
- [Links to docs, screenshots, WhatsApp exports, competitor URLs]

## 7. Kill Criteria Assessment
- Buyer persona defined: YES/NO
- Pain articulated: YES/NO
- Technically feasible: YES/NO/FLAG
- Budget realistic: YES/NO/DISCUSS
```

---

## ⚖️ R0: Intake Gate (Soft Gate)

**Question:** "Should this project enter The Foundry?"

**Protocol:**
1. Review the Handoff Document — is it complete?
2. Check kill criteria — any showstoppers?
3. Gut check: does this feel like a real project or a distraction?

**Prompt Pattern:**
```
I just completed a client intake. Review this handoff document.
Is the problem real? Is the persona clear? Is the budget realistic?
Would YOU spend your time building this? Be honest.
```

**Must pass:**
- [ ] Handoff document follows the format above
- [ ] All kill criteria passed (no showstoppers)
- [ ] At least 1 verbatim client quote captured
- [ ] Budget and timeline are stated (even if rough)
- [ ] Confidence ≥ 6/10 (soft gate)

---

## Pre-Foundry Is NOT Speccing

Pre-Foundry captures raw material. It does NOT:
- Write FSDs (that's ASSAY)
- Make architecture decisions (that's ASSAY/CRUCIBLE)
- Create user stories (that's ASSAY)
- Research competitors (that's SCOUT)

Pre-Foundry asks: "What do you need and why?" The Foundry asks: "How do we build it?"
