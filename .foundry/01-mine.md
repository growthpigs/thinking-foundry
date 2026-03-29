# Phase 1: MINE — The Thinking Foundry Raw Firehose

**Date:** 2026-03-29
**Captured by:** Chi CTO
**Duration:** 30-60 minutes
**Mode:** GREENFIELD (new product)

---

## THE PAIN

> "Currently, she still ignores the repo, although she says she's got access but doesn't prove that. But more importantly, it's just question after question rather than a co-founder going back and forth."

> "The real idea is that you could give a couple of user stories like, this is what I want, this is what I'm thinking, but really it's just open-minded because she's trying to nail down the user stories and then she's just trying to nail down everything the whole time. That's completely against the ethos of the whole thing."

> "The problem is it just sounds like an interrogation and it's not helpful."

### Core Problem Statement
People have vague ideas. They can't think clearly about them alone. They need a co-founder in the room — someone who listens, challenges assumptions, brings research, contributes ideas, and helps them discover what they actually want. NOT a questionnaire. NOT an interrogation. A CONVERSATION.

### Secondary Pain
- No place to store the thinking (just words spoken into the air)
- No way to reference what was decided later
- Ideas get lost if you don't write them down immediately
- Can't easily share the thinking with a team or investor
- No connection between "thinking clearly" and "actually building it"

---

## THE VISION

### The User (Founder Persona)
- Has a vague problem/idea/threat/opportunity
- Can't articulate it clearly yet
- Doesn't have a structured thinking process
- Wants to understand it deeply before committing to build
- Needs someone to push back and ask the hard questions
- Wants the thinking organized for later (team, investors, execution)

### The Session (What Happens)
1. User arrives with a "thing" (product idea, business problem, strategic decision, threat)
2. AI opens: "What's your #1 thing?" (not "what's your problem?")
3. User firehoses thinking (5-10 minutes of raw dump)
4. AI immediately:
   - Extracts user stories from what they said
   - Contributes research ("I found that bananas are becoming the new apples...")
   - Applies frameworks (Stoicism, IDEO, McKinsey, YC, Hormozi) naturally
   - Suggests ideas they didn't think of
   - Challenges assumptions proactively
5. Back-and-forth for 60-120 minutes through 8 phases
6. User leaves with:
   - Clear understanding of the problem
   - 2-3 viable paths forward
   - Confidence ≥8/10
   - GitHub issue (public record)
   - Drive folder with phase-by-phase thinking artifacts

### The Philosophy (CRITICAL)
- **AI LEADS, not responds.** Like a co-founder who's been through this 100 times
- **Back-and-forth, not interrogation.** User firehoses → AI contributes → user thinks → repeat
- **Open, not closed.** Don't nail down user stories and lock them. Keep exploring until clarity emerges
- **Research-backed.** AI doesn't just ask questions, it brings findings ("here's what I learned...")
- **Frameworks as tools, not lectures.** Use Stoicism, IDEO, etc. naturally, not as preambles
- **Keep things open.** From Constitution: "the whole point is that we don't close down early"
- **Co-founder vibe.** Sharp, structured, drives the conversation, always asks "what else?"

### Base Knowledge (Always Available)
- **Stoicism** — What's in your control? Accept constraints. Virtue in thinking.
- **IDEO Design Thinking** — Empathize deeply. Generate wildly. Test quickly.
- **McKinsey Problem Structuring** — Break into components. Find the 2-3 that matter.
- **First Principles** — Strip to fundamentals. Rebuild from truth.
- **YC Wisdom** — What problem are you solving? Who's it for? Why now?
- **Alex Hormozi** — Business lens. Money, margins, meaning. What's the business model?
- **Nate B. Jones** — Generalist patterns. Connect across domains.
- **IndyDev Dan** — Solo founder resilience. Doing it alone. Systems thinking.

---

## THE PRODUCT

### 8 Phases (The Thinking Foundry Process)
1. **Phase 0: User Stories** — What's your #1 thing? Extract stories. Define success.
2. **Phase 1: MINE** — Deep listening. 5 Whys. Find root cause.
3. **Phase 2: SCOUT** — Generate 7-10 possibilities. Wild + conventional.
4. **Phase 3: ASSAY** — Filter to your constraints. 2-3 viable paths remain.
5. **Phase 4: CRUCIBLE** — Stress-test. What breaks? War-game scenarios.
6. **Phase 5: AUDITOR** — Quality check. Blind spots? Confidence ≥8?
7. **Phase 6: PLAN** — Clear answers. What to do. Why. First step tomorrow.
8. **Phase 7: VERIFY** — Export. GitHub issue + Drive folder.

### Real-Time Output (On Screen)
- **Outline view** — Not verbatim transcript, key insights appearing as AI speaks
- **User stories** extracted from user's firehose
- **Research findings** when AI mentions them
- **Framework references** when AI applies them
- **Phase progression** visible (when AI says "moving to Phase X", UI updates)

### Persistent Output (After Session)
- **GitHub issue** — Full transcript + link to Drive folder + labels by phase
- **Drive folder** — /Thinking Foundry Sessions/session-{id}/ with subfolders per phase
  - Phase-0-User-Stories/notes.md
  - Phase-1-MINE/notes.md
  - Phase-2-SCOUT/notes.md
  - ...Phase-7-VERIFY/full-transcript.md
- **Shareable** — User can share GitHub issue or Drive folder with team/investors

---

## TECHNICAL FOUNDATION (Constraints & Enablers)

### What We Know Works
- ✅ Gemini 3.1 Flash Live API (bidirectional audio, 128K context, $1.38/session)
- ✅ Voice barge-in (natural interruption, server-side detection)
- ✅ 15-minute reconnection strategy (seamless, user doesn't notice)
- ✅ Google Drive API (real-time persistence, scales forever)
- ✅ GitHub API (issue creation, labels, links)

### MVP Architecture (Drive as Database)
- **Auth:** Link-based only. User clicks URL → session starts. No login.
- **Storage:** Google Drive IS the database. Real-time writes, not batch at end.
- **Data Flow:** Server → Drive (not client polling)
- **Outline:** Real-time extraction + WebSocket messages
- **Export:** GitHub issue + Drive folder (both links given at end)

### What's Different From PoC
- PoC: Transcript display (but Gemini only outputs audio, not text)
- MVP: Outline view (key insights, not verbatim)
- PoC: Client-side export button
- MVP: Server-side auto-export (background task)
- PoC: Manual phase transitions
- MVP: AI-detected phase transitions

---

## USE CASES (Who & Why)

### Primary: Founder Thinking Clearly
- "I have a product idea but can't articulate it"
- "Should I pivot or double down?"
- "What's the real problem I'm solving?"
- **Output:** GitHub issue + Drive folder → share with team/investors

### Secondary: Team Alignment
- "We all have different ideas about the problem"
- "Let's think through this together"
- **Output:** Shared Drive folder → team can read phase notes

### Tertiary: Pre-Development Clarity
- "Before we build, I need to understand what we're building"
- **Output:** FSD-ready understanding → bridge to actual Foundry development process

### Future (Post-MVP): The Intake Step
- **Bridge:** "Hey, I did a Thinking Foundry session. Take my GitHub issue + Drive folder → create an FSD for development"
- This is where Thinking Foundry connects to the actual Foundry (software development)

---

## CONSTRAINTS & REALITY

### Technical Constraints
- Gemini Live: 15-minute connection limit (solved: seamless reconnection)
- Gemini Live: AUDIO modality only (no text from Gemini, need extraction)
- Google Drive: No real-time collaboration (not an issue for MVP)
- No SMS/authentication complexity (MVP: link-based only)

### Time Constraints
- Session duration: 60-120 minutes (8 phases)
- Phase durations hardcoded in prompts (Phase 0: 5min, Phase 1: 10min, etc.)
- Build timeline: 20-25 DUs = 4-5 weeks autonomous

### Business Constraints
- MVP: Link-based access only (no PIN/SMS until post-MVP)
- MVP: No team sharing (just individual sessions)
- MVP: No follow-up sessions (each session is standalone)
- Free initially (no Stripe, no payment processing)

### Design Constraints
- Mobile-first (works on Safari iOS + Chrome)
- No forms or complexity on setup screen
- Pause button (user can pause/resume)
- Real-time outline (not raw transcript)

---

## CRITICAL REQUIREMENTS (Non-Negotiable)

### AI Behavior
- **Phase 0 opening:** "What's your #1 thing?" NOT "What's your problem?"
- **Response length:** 2-3 sentences + question (never a lecture)
- **Contribution:** AI provides research + ideas, not just questions
- **Open-mindedness:** Don't close things down early. Keep exploring.
- **Frameworks:** Use naturally, don't lecture about them
- **Challenges:** Proactive assumption-testing, not passive listening

### Real-Time Experience
- **Outline appears as AI speaks** — not verbatim, key points only
- **Phase transitions visible** — UI updates when AI signals phase change
- **Barge-in works perfectly** — interruption feels natural, no awkward pauses
- **No buffering or lag** — <500ms latency on first response

### Persistence
- **Drive folder created on session start** — not at end
- **Phase notes written real-time** — updated after each AI response
- **GitHub issue created on session end** — with full transcript + correct labels
- **User gets both URLs** — GitHub + Drive, shareable immediately

---

## RISKS & GAPS (What Could Go Wrong)

### Architecture Risks
- Outline extraction might extract wrong things (need good heuristics)
- Real-time Drive writes might lag (could cache, flush per phase)
- GitHub issue creation might fail (retry logic needed)
- Barge-in might not work smoothly (test thoroughly)

### Behavior Risks
- AI might still interrogate, not collaborate (need strong prompt)
- AI might close down too early (need rubric for "when to move phases")
- AI might forget to reference the repo (need cite-specific details pattern)
- Frameworks might feel forced (need natural integration test)

### User Experience Risks
- Link-based access might feel insecure (explain: Roderic controls link distribution)
- Real-time outline might be confusing (need good visual design)
- 120-minute session might be too long (need break/pause support)
- Outline on phone might be too small (need mobile-optimized layout)

### Scale Risks
- Drive API rate limits (shouldn't hit them, but monitor)
- Gemini cost per session ($1.38 × N sessions = scaling cost)
- Concurrent session limits (5-10 concurrent in MVP, scale later)

---

## EXISTING MATERIALS (Ready to Ingest)

### Specification
- `docs/04-technical/FSD.md` — v3.0, complete MVP spec with Drive model

### Philosophy
- `CLAUDE.md` — Project context, 8 phases, design principles
- `docs/04-technical/FSD.md` (sections 217-257) — AI as conversation leader

### Code (PoC)
- `poc/server/gemini-live.js` — Gemini Live connection + reconnection logic
- `poc/server/session-state.js` — Phase state machine
- `poc/server/context-manager.js` — Transcript capture + context condensation
- `poc/server/github-export.js` — GitHub issue creation
- `poc/server/drive-manager.js` — Drive folder creation (old approach, needs refactor)
- `poc/public/app.js` — Client-side audio capture + WebSocket client
- `poc/public/style.css` — Mobile-first dark theme

### Phase Prompts
- `poc/prompts/phase-0-user-stories.txt` — Updated with "What's your #1 thing?" framing
- `poc/prompts/phase-1-mine.txt` through `phase-7-verify.txt` — All 8 phase prompts

### Knowledge Base
- `poc/knowledge/frameworks/` — Stoicism, IDEO, McKinsey, YC, Lean, Hormozi files
- `poc/knowledge/mentors/` — Nate B. Jones, IndyDev Dan, others

---

## WHAT WE HAVEN'T FIGURED OUT YET (Pre-SCOUT)

- [ ] Exact outline extraction heuristics (what counts as a "key point"?)
- [ ] How to make frameworks feel natural in conversation (not forced)
- [ ] How to detect when user is ready to move phases (AI judgment call vs. rule-based)
- [ ] Mobile UI for outline view (how to display insights on small screen?)
- [ ] Backup plan if Drive API fails (fallback storage?)
- [ ] How to handle multi-hour sessions (session limits? breaks?)
- [ ] Whether to include "Research" documents as separate Drive docs (not just in phase notes)

---

## KILL CRITERIA (SHOWSTOPPERS)

- [ ] Client can't articulate the pain → STOP. (✅ PAIN IS CLEAR: people need thinking help)
- [ ] No buyer personas → STOP. (✅ PERSONA: founders, teams, pre-development thinkers)
- [ ] Technically infeasible → FLAG. (✅ FEASIBLE: Gemini Live works, Drive API works, GitHub works)
- [ ] AI can't do co-founder style → STOP. (⚠️ FLAGGED: needs strong prompt + real-time testing)
- [ ] No business model → STOP. (⚠️ FLAGGED: MVP free, monetization post-launch)

---

## CONFIDENCE CHECK (R1 Gate)

**Is this worth building?** ✅ YES
**Is it scoped right?** ✅ YES (MVP is tight, tight scope)
**Problem clear?** ✅ YES (people need thinking help, AI can provide it)
**Persona identified?** ✅ YES (founders, teams)
**80-20 check?** ✅ YES (link access, Drive persistence, basic 8 phases = 80% of value)
**Showstoppers?** ⚠️ ONE FLAG: "AI does co-founder not interrogation" needs validation

**Confidence score:** 8/10
**Rationale:** Everything is clear except whether the prompts + interactions will produce co-founder behavior, not interrogation. This is critical. Need to test in CRUCIBLE.

---

**MINE COMPLETE**
**Outputs:** Raw firehose captured, problem statement clear, personas identified, one critical assumption flagged
**Next phase:** SCOUT — research competitors, patterns, technical architecture options
