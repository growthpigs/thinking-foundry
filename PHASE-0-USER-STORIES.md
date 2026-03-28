# Phase 0: User Stories

**The Accountability Anchor — Everything Starts Here**

---

## The Principle

**Nothing happens without clarity on what success means.**

Phase 0 comes **BEFORE** MINE, SCOUT, ASSAY — before any thinking, any exploration, any building. You must answer:
- What do you want?
- What does success look like?
- What fails (worst case)?
- What are your real constraints (time, money, team, expertise)?
- What's in your control vs. what's not?

This is not philosophy. This is the anchor that keeps all downstream thinking grounded.

---

## The Product's Phase 0 (For The Thinking Foundry Itself)

### User Story 1: The Client in Discovery Session

**As a** C-suite executive or founder with a messy problem,
**I want to** have a guided thinking conversation (voice) where I can explore possibilities without jumping to solutions,
**So that** I leave with clarity, a repeatable process, and a GitHub artifact I can reference.

**Acceptance Criteria:**
- [ ] I can interrupt the AI guide at any time
- [ ] The interface captures my thinking in real-time (voice transcription visible)
- [ ] I can ask follow-up questions and the guide adjusts
- [ ] At the end, a GitHub issue is created with the entire conversation
- [ ] The GitHub issue is shared (I get the URL)
- [ ] I understand the thinking framework used (the 8 phases are explained)

**Success Metrics:**
- Session takes 60-120 minutes (not more, not less)
- I achieve confidence level ≥8/10 on the solution
- The GitHub repo is shareable with my team
- I can re-use the framework for future problems

**What Fails:**
- If the guide jumps to solutions without exploring (kill it, restart)
- If I can't interrupt (makes me feel unheard)
- If the GitHub issue is messy or confusing (worthless artifact)
- If I leave more confused than when I started (failure)

**Constraints:**
- Time: 60-120 minutes max (I have other work)
- Cost: $500 per session (I'll pay this once, not recurring during trial)
- Technology: I should not need to code or set up anything (one click to start)
- Learning: I should understand how AI thinking differs from mine

---

### User Story 2: The Client in Follow-Up Session

**As a** client who did a discovery session and found value,
**I want to** continue the thinking process with deeper dives on specific sub-problems,
**So that** I can implement the clarity I found and track my thinking over time.

**Acceptance Criteria:**
- [ ] The guide remembers the context from my previous session
- [ ] I can reference my previous GitHub issue
- [ ] The guide proposes what to focus on next (based on my constraints)
- [ ] A new GitHub issue is created linking to the previous one
- [ ] I can see my thinking progression over multiple sessions

**Success Metrics:**
- Each follow-up session costs $1,000+ (higher value expected)
- I've implemented at least 1 decision from the first session
- I feel like a partner in the process, not a customer

**What Fails:**
- If the guide doesn't remember my context (start from scratch = waste)
- If the follow-up is just the same questions again (no progression)
- If the issues aren't linked (I can't see my journey)

---

### User Story 3: The Team Training Client

**As a** VP of Engineering or Product with a team,
**I want to** train my 10+ person team in the thinking process,
**So that** they make better decisions about their own problems and reduce my bottleneck as "the decider."

**Acceptance Criteria:**
- [ ] The guide can run in group mode (I can invite 2-10 people)
- [ ] Everyone can contribute to the thinking (not just me talking)
- [ ] The GitHub issue captures multiple voices
- [ ] After the session, my team can run this process independently
- [ ] I have a "team license" that covers 1 person per week for 4 weeks

**Success Metrics:**
- $5K-10K engagement (team training + follow-up)
- After 4 weeks, my team can run Phase 0-Phase 4 without me
- Decision quality improves (measured by outcomes, not feelings)
- I can allocate my time to higher-level strategy

**What Fails:**
- If only I understand the framework (doesn't scale)
- If the team feels lectured instead of participated (failure)
- If they run it once and never use it again (training didn't stick)

---

## Product Requirements from Phase 0

### Functional Requirements

| Requirement | User Story | Phase | Priority |
|-------------|-----------|-------|----------|
| Real-time voice input | All | MVP | P0 |
| Transcription visible on screen | All | MVP | P0 |
| Interruption support (user can cut AI off) | All | MVP | P0 |
| 8-phase guided workflow | All | MVP | P0 |
| GitHub issue creation at end | 1, 2 | MVP | P0 |
| GitHub issue linking (session history) | 2 | Post-MVP | P1 |
| Group mode (2-10 people) | 3 | Post-MVP | P1 |
| Team license management | 3 | Post-MVP | P1 |
| Export session to PDF | 1 | Post-MVP | P2 |
| Email session summary | All | Post-MVP | P2 |

### Non-Functional Requirements

| Requirement | Why | Phase | Priority |
|-------------|-----|-------|----------|
| Latency <200ms for AI responses | Conversational flow requires responsiveness | MVP | P0 |
| Real-time transcription (not batch) | User needs to see their words as they speak | MVP | P0 |
| Supports interruption mid-sentence | Core to thinking (not just listening) | MVP | P0 |
| Works on desktop + mobile | Client is busy (may be on phone) | MVP | P0 |
| Authentication (GitHub OAuth) | No login friction, auto-pull client context | MVP | P0 |
| Session stored in GitHub (not proprietary DB) | Transparency, client ownership, shareability | MVP | P0 |

---

## Product Scope (MVP)

### What's In (Must Have)

- Single-player voice conversation (1 user)
- 8-phase guided workflow (all phases)
- Real-time transcription
- Interruption support
- GitHub issue export
- Session linking (one issue per session, can reference previous)
- Basic authentication (GitHub OAuth)

**Estimated DUs:** 8-12 (1.5-2 weeks of work)

### What's Out (Post-MVP)

- Group mode (team training)
- Team license management
- PDF export
- Email summaries
- Integrations (Slack, Discord)
- Advanced analytics (thinking score, confidence tracking)
- Custom workflows (user-defined phases)

---

## Success Criteria (Product Level)

The product is done when:

- [ ] A user can start a session, have a 60-minute voice conversation, and end with a GitHub issue
- [ ] The GitHub issue contains the full transcript + AI's summarized thinking
- [ ] A follow-up session can reference the previous one
- [ ] The user can interrupt at any time and the guide responds
- [ ] Confidence ≥8/10 that this teaches people how to think

---

## Open Questions (For Phase 1: MINE)

1. **Gemini Live API Costs** — How much does a 60-minute session cost? Profit margin?
2. **GitHub Integration** — How do we authenticate? Create issues with gists embedded?
3. **Transcription Quality** — Does Gemini Live transcribe reliably? Any edge cases?
4. **Tone Detection** — Can we detect when user is frustrated and adjust?
5. **Interruption UX** — How do we make interruption feel natural (not like "stop button")?
6. **Team Training UX** — How different is group mode from single-player?
7. **Monetization Gate** — Do we charge before or after the session?
8. **Thinking Quality** — How do we measure "achieved clarity"? Confidence score?

---

**Phase 0 is not optional. It is the anchor.**

Everything downstream (Phases 1-8) will be grounded in these user stories and success criteria.
