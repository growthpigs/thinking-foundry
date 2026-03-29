# Phase 3: ASSAY — Deep Spec Thrashing

**Date:** 2026-03-29
**Duration:** 4-6 hours (parallel thrashing)
**Mode:** SPECIFICATION DEEP-DIVE

---

## CRUD MATRIX (Data Operations on Drive)

### Create Operations

| Entity | Operation | Trigger | Drive Location | Idempotent? | Failure Mode |
|--------|-----------|---------|----------------|-------------|--------------|
| Session Folder | Create root `/Thinking Foundry Sessions/session-{id}/` | Session start | Root folder | ❌ (re-create fails) | Retry: check exists first |
| Phase Folder | Create `/Phase-{N}-{name}/` | Phase transition or AI signal | Under session | ❌ (re-create fails) | Batch with phase notes |
| Phase Notes | Create `phase-{N}-notes.md` | After each AI response | Under phase folder | ✅ (append, not overwrite) | Buffer + retry |
| Research Docs | Create `research-{topic}.md` when AI mentions research | AI contributes research | `Research/` subfolder | ✅ (versioned) | Skip if exists, note in current session |
| GitHub Issue | Create issue with transcript + links | Session end / export triggered | GitHub repo | ❌ (duplicate issue) | Check existing issues before create |
| Outline Entry | Create outline item as `{ phase, timestamp, text, type }` | Real-time as AI speaks | In-memory, flush to `/outline.json` | ✅ (merge, not replace) | Write to backup `.outline.json.bak` |

### Read Operations

| Entity | Operation | Trigger | Drive Location | Frequency | Caching |
|--------|-----------|---------|----------------|-----------|---------|
| Session Folder | Fetch metadata (files, tree) | Session open | `/Thinking Foundry Sessions/session-{id}/` | Once at start | 5-min cache |
| Phase Notes | Read current phase notes | UI displays outline | `Phase-{N}-{name}/phase-{N}-notes.md` | Continuous polling | Real-time (no cache) |
| Research Docs | Read all research files | Outline extraction needs research context | `Research/` subfolder | Once per phase | 30-min cache |
| GitHub Context | Fetch repo README + recent issues | Session setup | External (GitHub API) | Once at setup | Session-long |
| Drive Context | Fetch existing Drive files | Session setup | Provided Drive URL | Once at setup | Session-long |

### Update Operations

| Entity | Operation | Trigger | Drive Location | Idempotent? | Merge Logic |
|--------|-----------|---------|----------------|-------------|-------------|
| Phase Notes | Append new AI response | After each AI turn | `Phase-{N}-{name}/phase-{N}-notes.md` | ✅ (append-only) | Line-based merge (no overwrites) |
| Session Metadata | Update `_session.json` (phase, status, timestamps) | Phase transitions or AI events | Under session root | ✅ (JSON merge) | Last-write-wins on status, preserve timestamps |
| Outline | Update `outline.json` with new entries | Real-time as outline items appear | Under session root | ✅ (array append) | Merge: append new, preserve order |
| Drive Context | Update context if user provides new Drive folder | Mid-session | External | ❌ (not supported MVP) | Not in MVP scope |
| Research Docs | Update research doc if AI references it again | Rare | `Research/` subfolder | ✅ (append new findings) | Version control: `research-{topic}-v2.md` if conflicting |

### Delete Operations

| Entity | Operation | Trigger | Drive Location | Risk | Mitigation |
|--------|-----------|---------|----------------|------|-----------|
| Session Folder | Delete session (user request) | "Clear this session" or admin cleanup | `/Thinking Foundry Sessions/session-{id}/` | 🔴 HIGH (irreversible) | Require explicit confirmation, log to audit trail |
| Phase Folder | Delete phase (rare, user edit) | User manually deletes phase from UI | Under session | 🟡 MEDIUM | Prevent deletion if phase has research docs (warn user) |
| Outline Entry | Delete outline item (user edits) | User manually removes insight | In-memory `outline.json` | 🟢 LOW (session only) | No delete needed, just hide in UI |
| Research Docs | Delete research doc (user edit) | User removes research file | `Research/` subfolder | 🟡 MEDIUM | Log deletion + timestamp, don't hard-delete (rename to `.archived`) |

### Data Consistency Guarantees

**Write Ordering Requirement:**
1. **Phase notes MUST be written before outline is sent to client** → if write fails, client outline is stale
2. **Session metadata MUST be updated AFTER phase notes complete** → ensures atomic phase transitions
3. **GitHub issue MUST be written LAST** → all Drive data must be stable first

**Retry Strategy:**
```
Attempt 1: Write to Drive API
Attempt 2: (30s delay) Retry with exponential backoff
Attempt 3: (60s delay) Fallback to client-side buffer (store in memory, flush on success)
Failure: Log error, notify user ("Some research may not have saved")
```

**Conflict Resolution:**
- **Drive API concurrent writes:** Drive's native last-write-wins. For critical data (session metadata), use conditional writes (`revisionId` checks).
- **Phase notes:** Append-only, no conflicts.
- **Outline entries:** Merge by timestamp (server is source-of-truth, client reads from server).

---

## FEATURE SCOPING DOCUMENTS (FSD)

### FSD-001: Voice Input & Audio Stream

**Scope:** Client-side audio capture, WebSocket transmission, server-side audio receipt

| Component | Requirement | Acceptance Criteria | Risk |
|-----------|-------------|-------------------|------|
| **Microphone Access** | Request user permission on load | Browser permission dialog appears, user can approve/deny | ❌ User denies = session blocked |
| **Audio Codec** | Capture as PCM 16kHz | Audio transmits to Gemini at correct sample rate, no artifacts | ⚠️ Browser codec varies (Safari vs Chrome) |
| **WebSocket Audio** | Send raw binary audio frames every 100ms | Server receives 16kHz PCM, playback quality ≥ 0.8 MOS | ⚠️ Network jitter may cause gaps |
| **Barge-in Detection** | Server-side via Gemini Live API | User can interrupt AI mid-speech, no awkward pauses (< 200ms) | ❌ Gemini barge-in fails = forced wait |

**Build Steps:** 1) MediaRecorder setup 2) WebSocket binary frames 3) Gemini Audio input 4) Barge-in event handling

---

### FSD-002: AI Conversation Engine

**Scope:** Gemini 3.1 Flash Live connection, prompt injection, context management, phase-driven behavior

| Component | Requirement | Acceptance Criteria | Risk |
|-----------|-------------|-------------------|------|
| **System Prompt** | Load phase-specific prompt from file | Correct prompt injected, visible in logs | ⚠️ Prompt file missing = fallback prompt (generic) |
| **Context Injection** | Prepend (github context + drive context) before phase prompt | Knowledge context visible in logs, length < 8K tokens | ⚠️ Context too large = Gemini truncation |
| **Co-Founder Behavior** | AI contributes ideas, research, frameworks (not just questions) | Manually verified in session: ≥80% of AI turns have contributions | ❌ AI still interrogates = critical failure |
| **Response Length** | 2-3 sentences + question (never lecture) | Measure: avg response word count 30-60 words | ⚠️ Longer responses = less interactive feel |
| **Phase Transitions** | AI naturally signals "moving to Phase X" when ready | Manual verification: AI says "moving to..." or similar | ⚠️ AI may not transition naturally (stays in phase too long or jumps early) |

**Build Steps:** 1) Prompt loader 2) Context builder 3) Knowledge injection 4) Gemini Live connection 5) Response handler 6) Phase detection heuristic

---

### FSD-003: Real-Time Outline Display

**Scope:** Extract key insights from AI responses, stream to client, display on screen

| Component | Requirement | Acceptance Criteria | Risk |
|-----------|-------------|-------------------|------|
| **Insight Extraction** | Parse AI transcript, identify key points | Heuristic: sentences with "because", "important", "finding" flagged | ⚠️ Extraction may flag noise (not all flagged = insights) |
| **Outline Item Creation** | Format: `{ phase, timestamp, text, type }` | Item appears in outline within 500ms of AI completion | ⚠️ Latency > 500ms = outline lags behind speech |
| **Real-Time Display** | Push outline item to client via WebSocket | Outline item appears on UI in real-time (no page refresh) | ⚠️ WebSocket may lose message (add retry logic) |
| **Outline Persistence** | Write outline to `outline.json` after each item | File exists at end of session with all items | ⚠️ File write may fail (use background queue) |
| **Mobile Display** | Outline readable on mobile Safari (small screen) | Text wraps, font size ≥ 14px, scrollable | ❌ Outline unreadable on mobile = UX fail |

**Build Steps:** 1) Heuristic extractor 2) Outline item generator 3) WebSocket publisher 4) Drive file writer 5) Mobile CSS

---

### FSD-004: Drive Persistence

**Scope:** Real-time folder creation, phase note updates, GitHub issue export

| Component | Requirement | Acceptance Criteria | Risk |
|-----------|-------------|-------------------|------|
| **Folder Creation** | Create `/Thinking Foundry Sessions/session-{UUID}/` on session start | Folder exists in Drive with correct structure | ⚠️ Folder creation may fail (rate limit, permission) |
| **Phase Folders** | Create `Phase-{N}-{name}/` for each phase | Folders appear as phases transition | ⚠️ Drive API rate limit = folder creation blocked |
| **Real-Time Note Writes** | Append AI responses to `Phase-{N}/phase-{N}-notes.md` after each turn | File exists and is updated in real-time (visible in Drive UI) | ⚠️ Race condition: client exports before server finishes write |
| **GitHub Issue Creation** | Create issue with transcript + Drive folder link + labels (by phase) | Issue appears in repo with correct metadata | ❌ GitHub API fails = session work not exported |
| **Error Handling** | If Drive write fails, queue in memory and retry | User is notified ("Some notes may not have saved") | ⚠️ Server crash = queued notes lost |

**Build Steps:** 1) Drive API init 2) Folder creator 3) Real-time appender 4) GitHub exporter 5) Error handler + queue

---

### FSD-005: Phase State Machine

**Scope:** Track current phase, enforce phase ordering, detect when to transition

| Component | Requirement | Acceptance Criteria | Risk |
|-----------|-------------|-------------------|------|
| **Phase Tracking** | Server maintains `session.currentPhase` (0-7) | Correct phase visible in logs + client state | ⚠️ Phase state gets out of sync (client ≠ server) |
| **Phase Duration** | Each phase has target duration (Phase 0: 5min, Phase 1: 10min, etc.) | Timer shown on client, can be overridden | ⚠️ User ignores timer, session exceeds 120 minutes (hard limit) |
| **Phase Transitions** | AI signals "moving to Phase X" → server detects → increments phase | Transition visible in logs + outline shows new phase | ⚠️ AI doesn't signal naturally (transition delay) |
| **Manual Override** | User can click "Next Phase" or "Restart Phase" | Phase changes immediately | ⚠️ User gets confused (jumps to wrong phase) |
| **Session End** | After Phase 7, session must end gracefully (export + show links) | User sees GitHub issue + Drive folder URLs, session closed | ⚠️ Export fails = user can't access their work |

**Build Steps:** 1) State machine 2) Timer 3) Phase detection 4) Override button 5) Export trigger

---

### FSD-006: 15-Minute Reconnection Logic

**Scope:** Handle Gemini Live API 15-minute connection limit seamlessly

| Component | Requirement | Acceptance Criteria | Risk |
|-----------|-------------|-------------------|------|
| **Standby Connection** | At 13:00 (13 min mark), create standby WS to Gemini | Standby WS established, user doesn't notice | ⚠️ Standby creation fails = no backup |
| **Context Condensation** | Before swap, create condensed context summary | Summary ≤ 2K tokens, includes key decisions | ⚠️ Condensation loses important context (AI confused after swap) |
| **Seamless Swap** | At 14:00 (14 min mark), swap active → standby, close old WS | User can continue talking, no pauses > 1 second | ⚠️ Swap causes 5+ second pause (user notices, UX fail) |
| **Recovery** | If standby fails to connect, force new connection immediately | No user interruption, session continues | ⚠️ Force reconnect takes 10+ seconds (noticeable) |
| **Cycle Limit** | For 120-minute sessions, support 8+ reconnection cycles | All cycles succeed without user intervention | ⚠️ 8th reconnection fails = session stuck |

**Build Steps:** 1) Reconnect timer 2) Standby WS manager 3) Context condenser 4) Swap executor 5) Recovery handler

---

## ASSUMPTION TABLE (Critical Bets)

| # | Assumption | Evidence FOR | Evidence AGAINST | Risk Level | Validation Method | Owner |
|---|-----------|--------------|------------------|-----------|-------------------|-------|
| **A1** | AI can behave as co-founder (contributes ideas, not just questions) | User feedback ("this is different"), IDEO frameworks in prompts | Breeva also tries (Breeva's generic questions may fail too) | 🔴 CRITICAL | CRUCIBLE phase: 5x test sessions, manual scoring | Chi |
| **A2** | Outline extraction heuristic works (identifies real insights, not noise) | Simple heuristics ("because", "finding") in pilot | Heuristic over-flags common words, misses subtle insights | 🟡 HIGH | ASSAY: test on 10 real transcripts, measure precision/recall | Chi |
| **A3** | Drive as database is fast enough (real-time feel, <500ms latency on writes) | Drive API promises 40 queries/min, Cloudflare edge <50ms | Drive batch writes may lag, network jitter adds 200-500ms | 🟡 HIGH | Build + load test: 100 concurrent sessions, measure latency | Chi |
| **A4** | Frameworks feel natural in conversation (not forced, not preachy) | Prompts designed to reference naturally, examples in FSD-002 | Framework name-dropping still feels forced, users get tired | 🟡 HIGH | CRUCIBLE: test with real users, survey "did frameworks feel natural?" | Chi |
| **A5** | 15-minute reconnection is truly seamless | Gemini API spec + Cloudflare Hibernation API docs | Network conditions vary, reconnect may take 3-5s, users notice | 🟡 HIGH | Build + test: 8+ minute sessions on poor network | Chi |
| **A6** | Users will use Drive folder + GitHub issue (persistence matters) | MVP assumes users want organized thinking artifacts | Users want real-time clarity only, don't care about persistence | 🟡 MEDIUM | Post-session survey: "Did you open the GitHub issue? The Drive folder?" | Roderic |
| **A7** | Link-based access is secure enough (Roderic controls distribution) | No auth needed, link is unique, hard to guess | Link could be shared, forked, replayed (though no auth needed anyway) | 🟡 MEDIUM | Document threat model, accept (MVP scope) | Roderic |
| **A8** | Condensed context after 14 min doesn't lose critical understanding | Context condenser includes decisions + state + research | Condenser misses nuance, AI confused after reconnect | 🟡 HIGH | Build + test: run full 120-min session, score clarity before/after each reconnect | Chi |
| **A9** | Co-founder persona style + frameworks + session structure = differentiation vs Breeva | Market gap analysis (no one combines all 3) | Breeva launches with same combo, better marketing | 🔴 CRITICAL | Monitor Breeva launch, CRUCIBLE user sessions | Roderic |
| **A10** | Free MVP is sustainable at reasonable scale (100 sessions/month) | Gemini cost $1.38/session, Drive free, Cloudflare $10/mo = $148/month | Usage grows to 1000+/month = $1.5K/month (unsustainable free) | 🟡 MEDIUM | Monitor usage growth, plan monetization gate | Roderic |

---

## PERSONA WALKTHROUGHS

### Persona 1: Sarah (Solo Founder, Product Idea)

**Background:** 2 years SaaS experience, building new product, uncertain if market exists

**Scenario:** Sarah has a vague product idea ("marketplace for X") but can't articulate the core value prop or business model. She's afraid of building the wrong thing.

**Walkthrough:**

| Phase | What Sarah Does | What AI Does | Drive Output | GitHub |
|-------|-----------------|-------------|--------------|--------|
| **0: User Stories** | "I have an idea for a marketplace... but I'm not sure if it's the right problem. I've been thinking about it for 3 weeks but can't nail down what makes it unique." | AI: "Let's zoom out. What's the #1 thing you're trying to solve?" (neutral, not problem-focused) | `Phase-0-User-Stories/phase-0-notes.md`: "Sarah's marketplace idea - user stories extracted: solve X, deliver Y, ensure Z" | Issue created with story list |
| **1: MINE** | User firehoses for 10 min: "The problem is that existing solutions are... and my idea is..." | AI: "I see. So you're saying [summary]. What happens if you remove that constraint?" (5 Whys) | Phase-1 notes with root causes identified | Issue updated |
| **2: SCOUT** | Listens as AI generates 7 possibilities | AI: "Here's what I found: [research]. Here are 7 paths: (1) Niche marketplace, (2) Vertical SaaS, (3) Agency model..." | Phase-2 notes with research + options | Issue updated with research docs |
| **3: ASSAY** | AI filters 7 → 3: "Given your constraints (no funding, solo founder, 10 hrs/week), these 3 are viable" | AI: "Let's filter by what you can actually do. Your constraints are X, Y, Z. That rules out 1-4." | Phase-3 notes with constraints + filtered options | Options labeled in issue |
| **4: CRUCIBLE** | AI stress-tests: "What if X happens? What if competitor Y launches?" | AI: "War-game: if this player launches first, what's your advantage?" | Phase-4 notes with war games + scenarios | Scenarios documented |
| **5: AUDITOR** | AI checks blind spots: "You've assumed X, but what if it's wrong?" | AI: "I'm noticing you haven't talked about retention. That's a blind spot for marketplaces. Should we explore?" | Phase-5 notes with blind spots + confidence score | Issue tagged with confidence |
| **6: PLAN** | AI synthesizes: "Here's your next 30 days" | AI: "Based on everything, here's what I'd do: Month 1 = customer research, Month 2 = MVP spec" | Phase-6 notes with action plan | Plan in issue |
| **7: VERIFY** | Sarah reviews Google Drive folder + GitHub issue | Export complete, Sarah shares with co-founder | All phases in Drive folder, transcript in GitHub | Issue closed with link |

**Success Metric:** Sarah leaves with confidence ≥8/10 ("I know what problem I'm solving, who it's for, and why now")

---

### Persona 2: Marcus (Team Lead, Strategic Decision)

**Background:** 5 engineers, 50K MRR, needs to decide: pivot vs double down on current product

**Scenario:** Marcus is torn. Current product growth is flat but profitable. New idea could 10x but needs 3-month build. He wants to think through the decision systematically.

**Walkthrough:**

| Phase | What Marcus Does | What AI Does | Drive Output |
|-------|-----------------|-------------|--------------|
| **0: User Stories** | "I need to decide if we pivot or stay the course. The pressure is real." | AI: "What's your #1 thing? The decision itself, or something else?" | `Phase-0-notes.md`: "Marcus's pivot decision - success = clarity + confidence" |
| **1: MINE** | "Here's what I'm worried about..." | AI: 5 Whys → root fear is opportunity cost | Phase-1: root causes documented |
| **2: SCOUT** | Marcus listens to 7 scenarios | AI: "Scenario 1: stay + optimize. Scenario 2: pivot + crew. Scenario 3: parallel..." | Phase-2: scenarios with win/loss per scenario |
| **3: ASSAY** | AI filters by team constraints | AI: "You have 3 months, 5 engineers, $50K burn. These 3 paths are feasible." | Phase-3: viable paths documented |
| **4: CRUCIBLE** | "What if competitor launches pivot first?" | AI: "War game: lose 2 months of growth, but capture market first" | Phase-4: war games documented |
| **5: AUDITOR** | AI flags: "You haven't talked about co-founder alignment" | AI: "Have your co-founder do this session too. Your answers might differ." | Phase-5: blind spots, recommendation to align with co-founder |
| **6: PLAN** | "So what do I do?" | AI: "Month 1: align team. Month 2: spec pivot or validate current. Month 3: decide." | Phase-6: next 90 days |

**Success Metric:** Marcus leaves with confidence ≥8/10 ("I know what decision to make and can defend it to my team")

---

### Persona 3: Jen (Pre-Dev Team, Clarity Before Build)

**Background:** Designer + 2 engineers, have rough spec, want to stress-test before committing to 4-week build

**Scenario:** Jen's team has a feature spec but wants external validation before coding. They want to catch misalignments and edge cases.

**Walkthrough:**

| Phase | What Jen Does | What AI Does | Drive Output |
|-------|---------------|-------------|--------------|
| **0: User Stories** | "We have a spec for [feature]. We want to make sure we're building the right thing." | AI: "What's the #1 user problem this solves?" | Phase-0: user stories extracted + aligned |
| **1: MINE** | Jen firehoses the feature context | AI: "So your core assumption is X. What if that changes?" | Phase-1: assumptions documented |
| **2: SCOUT** | AI generates 7 implementation approaches | AI: "Here's how you could build this: approach 1, 2, 3..." | Phase-2: implementation options compared |
| **3: ASSAY** | Jen's constraints (2 eng, 4 weeks): filters 7 → 2 | AI: "Given your team size and timeline, these 2 are feasible." | Phase-3: feasible approaches |
| **4: CRUCIBLE** | "What edge cases will break this?" | AI: "What if user clicks button twice? What if network fails mid-upload?" | Phase-4: edge cases documented |
| **5: AUDITOR** | "Are we missing anything?" | AI: "Mobile UX, offline mode, error states — I'd add those to spec" | Phase-5: missing pieces identified |
| **6: PLAN** | "Here's our build plan" | AI: "Week 1: core logic. Week 2: edge cases. Week 3: mobile. Week 4: polish." | Phase-6: sprint breakdown |

**Success Metric:** Jen's team leaves with confidence ≥8/10 ("We've caught misalignments before coding, reduced build risk")

---

## EDGE CASES & FAILURE MODES

### User Interaction Edge Cases

| Scenario | Expected Behavior | Actual Behavior | Mitigation |
|----------|-------------------|-----------------|-----------|
| User interrupts AI mid-sentence (barge-in) | Client stops AI playback, user speaks uninterrupted | Gemini detects interruption, sends `interrupted` flag | Test: interrupt at 0%, 50%, 100% of AI turn |
| User silent for 30+ seconds in middle of phase | AI waits, doesn't prompt aggressively | Gemini times out? AI repeats question? | **TBD:** What should happen? Add to blind spots |
| User wants to restart Phase 1 (redo it) | Click "Restart Phase" → AI resets to Phase 1 | Phase counter resets, context preserved | Verify: outline doesn't duplicate phase 1 entries |
| User closes browser mid-session | Session saved to Drive, can resume with link | Session data lost (no resume link on MVP) | **MVP:** Accept loss, note for future |
| User talks for 2+ minutes without pausing | AI still generating, outline filling up | Outline items pile up, client scrolls infinitely | Limit outline display to last 20 items |
| User asks AI off-topic question ("What's the weather?") | AI stays in character, redirects to decision/problem | AI answers the question (breaks character) | **TBD:** Prompt guidance needed |

### Technical Edge Cases

| Scenario | Expected Behavior | Actual Behavior | Mitigation |
|----------|-------------------|-----------------|-----------|
| Drive API rate limit hit (40 queries/min) | Phase notes queue in memory, retry after 1 min | Write blocked, user not notified | Log error + notify: "Some notes queued" |
| Google API token expires mid-session | Refresh token automatically, continue | Session stops, user gets error | Refresh before 1:00 remaining |
| Network disconnects for 10 seconds | WebSocket reconnects, conversation resumes | Gemini connection dies, can't reconnect | Implement exponential backoff + manual "Reconnect" button |
| Outline extraction produces 100+ items in phase | Display only latest 20, scrollable | UI becomes slow (100 DOM nodes) | Virtualize outline display, show "X more items" |
| GitHub issue creation fails (repo permissions) | Retry 3x, show user error message | Silent failure, user thinks issue was created | Always show success/failure confirmation |
| Session exceeds 120 minutes hard limit | Auto-close, force export | Session continues past 2 hours (cost escalation) | Add countdown timer: "Session ends in X min" |

### Data Consistency Edge Cases

| Scenario | Expected Behavior | Actual Behavior | Mitigation |
|----------|-------------------|-----------------|-----------|
| Phase notes file missing when reading outline | Read succeeds (file created just-in-time) | FileNotFound error, outline blank | Create placeholder file on phase start |
| Server crash, 20 pending Drive writes | Writes replayed on restart, no loss | Writes lost, user work missing | Persist queue to disk (not just memory) |
| Two sessions writing to same Drive folder | Should not happen (unique session IDs) | Race condition, files overwrite | Validate: session IDs are UUIDs, unique per session |
| Outline.json exists but is corrupted | Gracefully repair (restore from backup) | JSON.parse fails, outline lost | Write backup before every update |
| GitHub issue created but Drive folder creation fails | Issue has "Drive folder pending" note | Issue references non-existent folder | Retry Drive creation, update issue when folder appears |

---

## ADMIN DOCUMENTATION (18 Docs)

### System Docs (3)

1. **ARCHITECTURE.md** — System diagram, data flow, component interactions, latency targets
2. **API-CONTRACTS.md** — WebSocket message formats, Drive API calls, GitHub API calls
3. **DEPLOYMENT-CHECKLIST.md** — Step-by-step deploy to production, rollback procedure

### Operations Docs (5)

4. **MONITORING-DASHBOARD.md** — Key metrics (session count, latency, error rate), alerts
5. **ERROR-RECOVERY.md** — How to handle Drive API failures, GitHub API failures, network issues
6. **SESSION-AUDIT-LOG.md** — What to log per session for compliance + debugging
7. **SCALING-GUIDE.md** — How to scale from 10 to 100 to 1000 concurrent sessions
8. **INCIDENT-RESPONSE.md** — Procedure for production incidents (user data loss, outage, etc.)

### Data Docs (4)

9. **DRIVE-SCHEMA.md** — Folder structure, file naming, metadata format
10. **GITHUB-ISSUE-FORMAT.md** — Template for exported issues, label conventions
11. **CONTEXT-CONDENSATION-SPEC.md** — Algorithm for summarizing context at 14-min mark
12. **OUTLINE-EXTRACTION-HEURISTICS.md** — Rules for flagging insights vs noise

### Feature Docs (3)

13. **PHASE-PROMPTS-REFERENCE.md** — All 8 phase system prompts, versioning
14. **BARGE-IN-DETECTION-TUNING.md** — Gemini barge-in sensitivity settings
15. **FRAMEWORK-INJECTION-PATTERNS.md** — Examples of how frameworks appear naturally in responses

### User-Facing Docs (3)

16. **USER-GUIDE.md** — How to start a session, what to expect, FAQs
17. **ROADMAP.md** — What's coming next (phases, features, timeline)
18. **SUPPORT-RUNBOOK.md** — Common user issues + solutions

**Build Plan:** Ship 3 critical (ARCHITECTURE, DRIVE-SCHEMA, PHASE-PROMPTS) at launch. Defer others to post-MVP.

---

## R3 GATE — SPECIFICATION GATE (Requires ≥8/10 Confidence)

### Checklist

- [x] CRUD matrix complete + no missing operations
- [x] All 6 FSDs written (Voice, AI, Outline, Drive, Phase Machine, Reconnection)
- [x] 10 critical assumptions documented + validation methods defined
- [x] 3 persona walkthroughs show system working end-to-end
- [x] Edge cases identified + mitigation strategies defined
- [x] 18 admin docs scoped (3 critical, 15 deferred)
- [x] Data consistency guarantees documented
- [x] Failure modes identified

### Outstanding Unknowns

- **A1 (Co-founder behavior):** Still unknown if AI can consistently contribute ideas instead of interrogating. **Resolution:** CRUCIBLE phase.
- **A2 (Outline heuristics):** Extraction rules are simple (keyword matching). May miss subtle insights. **Resolution:** Test on 10 real transcripts.
- **A5 (Reconnection seamlessness):** Assumes 14-min swap < 1 second. Real network may vary. **Resolution:** Load test with poor network conditions.
- **Phase transition detection:** Assumes AI naturally signals "moving to Phase X". May stay in phase too long or jump early. **Resolution:** Test with real users, measure phase duration variance.

### Risk-Adjusted Confidence

| Aspect | Confidence | Blocker? |
|--------|-----------|----------|
| Architecture is sound | 9/10 | No |
| Data flow is correct | 9/10 | No |
| AI can be "co-founder not interrogator" | 6/10 | **YES** |
| Outline extraction will work | 7/10 | No (degraded UX if fails) |
| 15-min reconnection seamless | 7/10 | No (user notices, but session continues) |
| Drive persistence works at scale | 8/10 | No |
| **Overall R3 Confidence** | **7.5/10** | **CRITICAL BLOCKER: A1** |

### Gate Decision

**SPEC is READY to proceed to CRUCIBLE, contingent on:**
1. CRUCIBLE phase must resolve A1 ("Can AI do co-founder style?")
2. If A1 fails in CRUCIBLE → STOP, don't build
3. If A1 passes → proceed to EXTERNAL AUDITOR (independent model review)
4. If auditor approves → PLAN phase (GitHub issues, sprints, "Drop the Hammer" decision)

**Critical Path Risk:** If AI interrogates instead of collaborates, entire product positioning fails. This is THE blocker.

**Next Gate:** CRUCIBLE (adversarial testing of assumption A1)

---

## SYNTHESIS: What R3 Validates

### Specification Is Ready When:
✅ All 6 FSDs written + no ambiguity
✅ CRUD operations complete + data flow clear
✅ 3 personas walk through system successfully
✅ Edge cases identified + mitigations planned
✅ Admin docs scoped (critical ones planned for launch)
✅ Data consistency guarantees defined

### Specification Is NOT Ready When:
❌ Critical assumptions untested (A1: co-founder behavior)
❌ Phase transition detection undefined
❌ Outline extraction heuristics too simple
❌ Reconnection strategy not validated under poor network

### The Blocker:
🔴 **ASSUMPTION A1: "AI can do co-founder not interrogation"**

This is the core of the product. If the AI still interrogates (Breeva approach), the differentiation fails. Everything else in the spec is executable, but this assumption MUST be validated in CRUCIBLE before committing to build.

---

**ASSAY COMPLETE**
**Outputs:** 6 FSDs, CRUD matrix, assumption table (10 critical bets), 3 persona walkthroughs, edge cases with mitigations, 18 admin docs scoped, R3 gate decision
**Next phase:** CRUCIBLE — Test the critical assumption (AI collaboration vs. interrogation) with adversarial stress-testing
**Confidence:** 7.5/10 (blocked on A1 validation)

