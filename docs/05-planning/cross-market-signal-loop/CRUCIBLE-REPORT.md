# Crucible Report: Cross-Market Signal Loop POC FSD

**FSD under review:** `docs/05-planning/cross-market-signal-loop/FSD.md` (commit `f3817d6`)
**Reviewer:** Chi, adversarial self-review mode
**Date:** 2026-04-08
**Trigger:** Roderic caught the process error — FSD was drafted and nearly handed to the Scrum Master pipe without any stress-test. Crucible is Phase 4 of the Thinking Foundry methodology; it was skipped. This report retroactively runs that phase.

**Verdict up front:** The FSD has **one blocker**, **four high-severity issues**, **five medium-severity issues**, and a general pattern of **optimistic day-planning**. It should not be handed to the Scrum Master pipe until at least the blocker and the high-severity issues are resolved.

---

## Methodology

For each finding: (a) the assumption being attacked, (b) the counter-argument or evidence, (c) severity (Blocker / High / Medium / Low), (d) proposed FSD revision.

Severity scale:
- **BLOCKER** — the POC cannot succeed as specified until this is resolved
- **HIGH** — the POC can start but will likely fail or embarrass on reveal
- **MEDIUM** — fixable in-flight but will eat days if discovered on Day 3
- **LOW** — cosmetic or deferred

---

## BLOCKER

### C-1: The Mentionlytics cross-reference in the demo is theater, not proof

**Attack:** FSD Section 4 Story 1 describes the reveal demo as producing a document with "cross-referenced Mentionlytics mentions from the demo tenant's feed that relate to the same theme." FR-9 then specifies that the demo tenant has "5-10 Mentionlytics mentions hand-crafted to match the seeded event pairs."

This is theater. Roderic hand-crafts the Polymarket/Kalshi event pairs. Roderic hand-crafts the Mentionlytics mentions. Roderic hand-crafts the keyword overlap. Claude then "discovers" the cross-reference and produces the document. An adversarial Think Big reviewer would see through this in 30 seconds: *"So you wrote the public data, you wrote the private data, and you wrote the prompt that connects them. What exactly did the engine contribute?"*

The entire reveal rests on the claim that the engine **discovered** something the human didn't already know. Hand-seeding both sides of the cross-reference destroys that claim.

**Severity:** BLOCKER. Without fixing this, the POC demo is strictly worse than a slide deck.

**Proposed revision:**
- The Mentionlytics side must be **real**, not hand-crafted. Options:
  - **Option A (recommended):** Seed the demo tenant with a real, non-client public figure or brand as its "subject." E.g., seed keywords for "Federal Reserve" or "Boeing" or "SpaceX." Configure Mentionlytics via a personal trial account (or a dev API key Roderic can justify) to pull real public mentions for that subject over the POC week. Then the cross-reference between Polymarket/Kalshi events and real public mentions is genuine.
  - **Option B:** Skip Mentionlytics entirely for the POC and use only the Polymarket ↔ Kalshi divergence as the "private-data-not-needed" proof. Loses one killer-feature dimension but keeps the POC honest.
  - **Option C:** Use the demo on Roderic's own personal data (e.g., his own keywords, his own alerts) so at least one side is authentically his. Unusual framing but defensible.
- FSD must be explicit: "no hand-crafted cross-references in the reveal document."

---

## HIGH SEVERITY

### C-2: Environmental dependencies for running War Room standalone are handwaved

**Attack:** FR-8 says "isolated Neon + Render + Netlify." FR-10 says worktree "wt-signal-loop." But War Room is a 100+ env-var application with dependencies on: Supabase (separate from Postgres — used for pgvector knowledge base storage), Mentionlytics V1 + V2 auth tokens, Gemini API keys, Perplexity API keys, Google Ads OAuth, Meta Marketing API tokens, Pinecone, Sentry, PostHog, Umami, Socket.IO (depends on both backend and frontend resolving to the same origin in prod or cross-origin in dev), multiple GitHub tokens, Render webhooks, and feature flags managed via Netlify `netlify.toml`.

The FSD Day 1 says "Worktree created, isolated Neon provisioned, migrations applied, upstream `main` baseline confirmed running." This is **at least 2 days of work**, not 1. And "confirmed running" hides the hardest question: which env vars can be stubbed out, which must have real values, and which will cause the app to fail to boot?

**Severity:** HIGH. This risks burning Day 1 and Day 2 on infrastructure and arriving at Day 3 with no connector code written.

**Proposed revision:**
- Replace Day 1 with a **Day 0 "boot-from-nothing" spike** that is NOT part of the 7-day POC count: before committing to a 7-day build, spend 2-4 hours trying to boot alpha-war-room `main` against a fresh Neon with a minimal `.env.poc` and a `FEATURE_FLAGS_POC=true` gate that disables: Sentry, PostHog, Umami, Google Ads, Meta Ads, Perplexity fallback chain, SWOT sync job, mention sync job, Crucible audio bridge, all paid services.
- If the boot spike succeeds, commit to the 7-day plan. If it doesn't, the POC scope must shrink (or the setup day must be isolated from the 7).
- Add a "stubbable services" table to the FSD with one row per external dep, marked `required / stubbable / disabled`.

### C-3: Polymarket ↔ Kalshi event matching is harder than 5-10 hand-curated pairs suggests

**Attack:** FR-3 says the event-matching table is "manually curated 5-10 pairs." The FSD defers automatic matching to Phase 2. But the assumption that 5-10 genuinely matched pairs currently exist is untested.

Counter-evidence:
- Kalshi primarily lists CFTC-approved event contracts. Much of its inventory is economic indicators, weather derivatives, and sports. Polymarket is heavy on politics, crypto, entertainment, and media.
- Where both platforms do cover the same broad topic (e.g., "will X happen in 2026"), the exact contract specs, resolution dates, and resolution sources often differ. E.g., a Kalshi contract might resolve on "next BLS report" while a Polymarket contract resolves on "verified by UMA oracle" — technically different events.
- Liquidity: Polymarket's politics market is heavily traded; Kalshi's politics markets post-2024 are smaller. A 10-pp divergence on an illiquid Kalshi market is noise, not signal.

If Roderic spends Day 2 trying to hand-curate 10 pairs and finds only 2-3 that are clean matches with real volume on both sides, the entire divergence premise is weakened.

**Severity:** HIGH. The feature's core unique claim is the divergence signal. If the pairs don't exist, the POC has nothing.

**Proposed revision:**
- Add a **Day 0 research spike** (part of C-2's spike): before starting the build, spend 1-2 hours browsing both platforms manually to answer: "Are there currently 5+ matched event pairs between Polymarket and Kalshi with >$100k combined volume and resolution criteria that are close enough to treat as the same event?"
- If yes, commit to the 7-day plan.
- If no, either (a) defer the POC until the calendar has more matched events (probably around a major election or Fed meeting), (b) expand the bench to include a third source like PredictIt or a polling aggregator so "divergence across multiple consensus feeds" can still be the headline, or (c) pivot the POC headline from "divergence" to "single-source consensus probability × War Room first-party data" — weaker but still unique.
- The outcome of the spike goes into an "Event Matching Viability Assessment" section in the FSD before Day 1 starts.

### C-4: The "10pp for 15 minutes" threshold is fabricated

**Attack:** FR-4 specifies `|divergence| > 0.10` sustained for 15 minutes as the trigger. I made both numbers up. No empirical basis. If real-world baseline divergence for matched events is routinely 5-15pp due to liquidity and contract-spec differences, the threshold either fires constantly (alert fatigue) or never (no signal). Either way the demo is bad.

**Severity:** HIGH. This is the exact kind of arbitrary parameter that looks defensible in an FSD and ruins a demo.

**Proposed revision:**
- Replace FR-4 with a two-part specification:
  - Part 1 (observational, Day 2-3): Run the connectors in data-collection mode only, logging divergences for all matched pairs. Compute the distribution of baseline divergence.
  - Part 2 (empirical, Day 4): Set the trigger threshold at **1.5× standard deviation of observed baseline**, not a hardcoded 10pp. Set the duration based on observed noise (if baseline churns on a 30-second cycle, require 5 minutes above threshold; if it's stable, 30 seconds is enough).
- Success condition: at least one trigger fires during POC testing from a genuine divergence, not a hardcoded threshold.

### C-5: Risk R-6 is hand-waved, but it's the only risk that matters

**Attack:** FSD Section 10 Risk R-6 is "The whole POC ships and Think Big reacts with 'that's not impressive' rather than 'that's a killer feature.'" Severity: HIGH. Mitigation: *"Mitigation is the reveal strategy, not the build."*

This is punting. Every other risk mitigation is a concrete engineering action. R-6's mitigation is "figure it out later." That's the risk that determines whether the entire POC was worth building.

**Severity:** HIGH. R-6 is existential and the FSD should treat it that way.

**Proposed revision:**
- Add a **Reveal Readiness Criterion (RRC)** section to the FSD with a checklist Roderic MUST be able to check before scheduling a reveal:
  - [ ] The demo document contains at least one insight Roderic genuinely did not know before the POC ran (not "cool, the system found what I seeded")
  - [ ] A person unfamiliar with the methodology can watch the demo and articulate the unique value in one sentence
  - [ ] The divergence signal caught at least one real movement during POC week that was later corroborated by news or a market move
  - [ ] The demo runs end-to-end in <3 minutes without any "oh wait, let me refresh" moments
  - [ ] Roderic has a one-page hand-out ready
  - [ ] The Polymarket/Kalshi promotion in alpha-war-room#717 has been accepted by Carlos, signaling data-substrate alignment
- If any RRC item is unchecked, do NOT reveal.

---

## MEDIUM SEVERITY

### C-6: The day-by-day plan is optimistic by roughly 50%

**Attack:** Section 8 Day 2 bundles "Polymarket + Kalshi connectors with poll job; 5-10 matched events hand-seeded." Realistic sizing: Polymarket connector is a day, Kalshi connector is a day (different auth patterns, different contract schemas, different pagination), matched events research is half a day, poll job infrastructure is half a day. That's 3 days, compressed into 1 in the plan.

Day 6 "Claude call with Polymarket + Kalshi + Mentionlytics composition" is another compression. Building and iterating on the composition prompt alone typically takes a day. Integrating into the workspaceReportGenerator.ts flow is another day.

**Severity:** MEDIUM. The POC can still ship, just not in 7 days. Calling this a 2-week POC would be more honest.

**Proposed revision:**
- Expand the plan to 10-14 days, OR explicitly de-scope: drop either Polymarket or Kalshi (keep divergence by adding a third source like PredictIt later), drop Mentionlytics cross-reference (defer with C-1), or drop the full composition prompt in favor of a simpler structured-output render.
- State the plan length honestly. Roderic has other work; a realistic 10-day plan is better than an optimistic 7-day plan that slips to 14.

### C-7: Upstream rebase risk R-3 has no real mitigation

**Attack:** R-3 is "Upstream War Room `main` refactors the Workspace Editor during the week." Mitigation: *"Keep changes additive; pull daily; worst case accept a full merge."*

But alpha-war-room#620 (Workspace Editor V2 redesign) is actively in flight per the `WORKSPACE-EDITOR.md` feature doc (23 DUs of work including `setActiveCategory` refactor, new state blocks, 3-tab system overhaul). If that work merges mid-POC, the POC's Insert tab additions AND the Configure tab new report type additions will both conflict structurally, not just textually. "Pull daily" doesn't help.

**Severity:** MEDIUM. Manageable but underspecified.

**Proposed revision:**
- Before Day 1, check the state of alpha-war-room#620. Options:
  - If #620 has already merged: good, the POC builds on the V2 architecture
  - If #620 is in active PRs: fork from the same commit the PR is based on, so a rebase later is merge-of-merges, not a conflict war
  - If #620 is scoped but not started: the POC should ship BEFORE #620 starts, or after
- Add an "Upstream Posture Check" step as Day 0.

### C-8: The FSD Section 13 Reveal Strategy bleeds out-of-scope content into the FSD

**Attack:** Section 13 is explicitly "not part of the build" but is in the FSD. That's a scope hygiene violation I warned myself about in the Analyst phase ("zero tolerance for scope creep"). The reveal strategy should be a separate doc (`REVEAL-STRATEGY.md`) or a Running Notes item.

**Severity:** MEDIUM. Cosmetic but sets a bad pattern.

**Proposed revision:**
- Move Section 13 content to a sibling doc `docs/05-planning/cross-market-signal-loop/REVEAL-STRATEGY.md`
- Leave a one-line pointer in the FSD: "Reveal strategy: see REVEAL-STRATEGY.md, out of build scope."

### C-9: SM-2 is subjective and therefore unmeasurable

**Attack:** Success Metric SM-2 is "Generating a Cross-Market Signal Loop report produces a document that Roderic would personally want to read (subjective, self-rated ≥8/10)." A subjective self-rating is not a success metric — it's a hope.

**Severity:** MEDIUM. The metric needs a harder test.

**Proposed revision:**
- Replace SM-2 with: "A person unfamiliar with the Cross-Market Signal Loop methodology reads the demo document and can correctly identify (a) what the divergence signal is, (b) why the cross-reference matters, (c) one action they would take based on the document — all without being prompted." Test subject: a family member, a friend, or a non-Think-Big colleague.

### C-10: The Socket.IO emit path makes an assumption about the tenant model

**Attack:** FR-7 says the POC emits `signalLoop:match` events on `company:${companyId}` rooms using the existing `useSwotNotifications` infrastructure. But the existing Socket.IO code assumes multi-tenant isolation: users join the room for their own `companyId`, and emits are scoped to that room. The POC has a SINGLE fabricated demo tenant. Roderic's own browser needs to be authenticated as that demo tenant, not as himself or any Think Big tenant, for the toast to appear. How does that auth work in the isolated stack?

**Severity:** MEDIUM. Fixable but not specified.

**Proposed revision:**
- Add FR-11: "The POC SHALL ship a bypass-auth mode accessible only in the isolated environment (`FEATURE_POC_BYPASS_AUTH=true`) that auto-authenticates any browser session as the fabricated demo tenant. The bypass MUST NOT be deployable to any environment with Think Big's env vars present — guard with an assertion that the DB hostname does not contain `thinkbig` or `warroom-prod`."

---

## LOW SEVERITY

### C-11: New report type requires backend whitelist edit, not just reportTypeData.ts

**Attack:** Section 7 says the new report type only touches `client/src/data/reportTypeData.ts`. But per `features/WORKSPACE-EDITOR.md`, the V2 design also has a "backend whitelist" of valid report types. Adding a new type requires touching both sides.

**Severity:** LOW. 10 extra minutes on Day 5, not a blocker.

**Proposed revision:** Update Section 7 to include the backend whitelist file path (location to be confirmed by code-reading on Day 0).

### C-12: Claude model choice NFR-5 mentions Haiku 4.5 but the composition may need Sonnet

**Attack:** NFR-5 defaults all Claude calls to Haiku 4.5 for cost. But the composition call has to weave Polymarket data + Kalshi data + Mentionlytics mentions + divergence interpretation + suggested actions into a single structured document. Haiku is great for simple calls; multi-source composition with structured output is where Sonnet shines.

**Severity:** LOW. Iteration-time decision.

**Proposed revision:** Change NFR-5 to: "Default to Haiku 4.5 for connector-level processing and divergence classification. Use Sonnet 4.6 for the single report-composition call only. Justified cost delta: ~$0.05 per generated document for a substantially better demo artifact."

### C-13: Five open questions in Section 11 should be answered before Day 1, not during

**Attack:** Section 11 has five open questions including "which 5-10 matched event pairs to seed" and "what's the demo tenant name." These are not open questions — they are tasks that must be closed before any code is written. Leaving them open in the FSD is a documentation smell.

**Severity:** LOW. Rename Section 11 to "Day 0 Closures Required."

**Proposed revision:** Change Section 11 header to "Day 0 Closures Required" with the explicit note: "The Scrum Master pipe must not run until every item in this section has a resolved answer."

---

## Summary of required FSD changes before Scrum Master pipe

| ID | Change | Must close before Scrum Master? |
|---|---|---|
| C-1 | Replace hand-crafted Mentionlytics with real data OR drop Mentionlytics from POC reveal | YES (blocker) |
| C-2 | Add Day 0 environmental spike + stubbable services table | YES |
| C-3 | Add Day 0 event-matching viability assessment | YES |
| C-4 | Replace fabricated 10pp/15min threshold with observed baseline + statistical trigger | YES |
| C-5 | Add Reveal Readiness Criterion checklist | YES |
| C-6 | Expand day-by-day plan to realistic 10-14 days OR de-scope | YES |
| C-7 | Check alpha-war-room#620 state; choose upstream posture | YES |
| C-8 | Move Section 13 Reveal Strategy to sibling doc | Nice to have |
| C-9 | Replace subjective SM-2 with external-reader comprehension test | YES |
| C-10 | Add FR-11 for bypass-auth mode with environment guard | YES |
| C-11 | Add backend whitelist to touch points | Nice to have |
| C-12 | Clarify Haiku vs Sonnet per call | Nice to have |
| C-13 | Rename open questions → Day 0 closures | Nice to have |

**Items marked YES must be resolved before `foundry-pipe-02-scrum-master` runs.**

---

## What this Crucible pass did NOT cover (intentional scope limits)

- The methodology itself (was already stress-tested in thinking-foundry session #29's Phase 4 Crucible — don't re-litigate)
- The commercial/regulatory framing (covered by #31 Section 10)
- The reveal timing strategy (out of FSD scope by definition)
- Phase 2 backlog items (by definition out of POC scope)

---

## Auditor handoff

This Crucible report hands off to the next phase: **Auditor** (Phase 5 of the Thinking Foundry methodology). The Auditor's job is to verify: (a) the Crucible findings are real and not invented, (b) the blocker + high-severity items have been addressed in a revised FSD, (c) confidence in the revised plan is ≥ 8/10. Only then does the Scrum Master pipe run.

**Confidence in the CURRENT (pre-revision) FSD: 4/10.** It was written with momentum, not with adversarial discipline. The revisions above should bring it to 8/10.
