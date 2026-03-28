# Functional Specification Document (FSD)

**The Thinking Foundry — Product Design**

**Status:** Ready to Build
**Version:** 1.0
**Date:** 2026-03-28
**DU Estimate:** 12-15 (3 weeks)

---

## Executive Summary

The Thinking Foundry is a **voice-first SaaS product** that guides people through structured thinking when facing complex decisions.

**Product in 30 Seconds:**
1. User starts a voice session ($500)
2. AI guide takes them through 8 thinking phases (60-120 min)
3. User can interrupt anytime (natural conversation)
4. Session is transcribed automatically
5. GitHub issue is created with full thinking record
6. User leaves with clarity + a repeatable process

**Tech Stack:**
- Frontend: React + Web Audio API
- Voice: Gemini 3.1 Flash Live API
- Backend: Cloudflare Workers
- Storage: GitHub Issues + Gists
- Auth: GitHub OAuth

---

## Phase Overview (8 Phases)

| Phase | Duration | Goal | AI Role |
|-------|----------|------|---------|
| **0** | 5 min | Capture user stories | Get clarity on what success means |
| **1** | 10 min | MINE — Listen deeply | Understand the real problem |
| **2** | 25 min | SCOUT — Explore widely | Generate possibilities without judgment |
| **3** | 20 min | ASSAY — Find signal | What matters for THIS person? |
| **4** | 20 min | CRUCIBLE — Test ideas | What breaks? War-game scenarios |
| **5** | 15 min | AUDITOR — Quality check | Gaps? Confidence ≥8? |
| **6** | 15 min | PLAN — Give clarity | Here's what you should do. Why. |
| **7** | 5 min | VERIFY — Export | Create GitHub issue + share URL |

**Total:** 60-120 minutes per session

---

## User Flows

### Flow 1: New User (Discovery Session)

```
1. User lands on app
   ↓
2. Sign in with GitHub (OAuth)
   ↓
3. Click "Start Thinking Session"
   ↓
4. Grant audio permission
   ↓
5. [PHASE 0-7] Guided conversation with AI
   - User speaks problem
   - AI listens, asks questions
   - Conversation recorded + transcribed
   - User can interrupt anytime
   ↓
6. Session ends, export screen
   ↓
7. GitHub issue created automatically
   ↓
8. User sees issue URL, can share/fork
   ↓
9. Charged $500 (Stripe)
```

### Flow 2: Follow-Up Session (Already Paid)

```
1. User logs in
   ↓
2. Click "Continue Thinking"
   ↓
3. AI references previous session
   ↓
4. [PHASE 0-7] Same structure, but AI remembers context
   ↓
5. New GitHub issue created, linked to previous one
   ↓
6. User charged $1,000+ (higher value, solved problem)
```

### Flow 3: Team Training (Not MVP, but in architecture)

```
1. VP invites team (share session URL)
   ↓
2. Multiple people join session
   ↓
3. AI guides team through thinking
   ↓
4. Everyone can contribute, see transcript
   ↓
5. One issue created, everyone has access
   ↓
6. Team learns to think independently
```

---

## Component Architecture

```
┌─────────────────────────────────────────────┐
│         Frontend (React + Web Audio)        │
├─────────────────────────────────────────────┤
│                                             │
│  ThinkingSession                            │
│    ├─ AudioCapture (Web Audio API)          │
│    ├─ TranscriptDisplay (real-time)         │
│    ├─ PhaseIndicator (which phase?)         │
│    └─ InterruptHint (soft indicator)        │
│                                             │
│  SessionExport                              │
│    └─ GitHub Issue Preview + Share          │
│                                             │
│  Auth (GitHub OAuth)                        │
│    └─ Login button, token refresh           │
│                                             │
└─────────────────────────────────────────────┘
              ↓ WebSocket ↓
┌─────────────────────────────────────────────┐
│  Backend (Cloudflare Workers)               │
├─────────────────────────────────────────────┤
│                                             │
│  SessionRouter                              │
│    └─ Route audio → Gemini, results → client│
│                                             │
│  GitHubExporter                             │
│    └─ Create issues, manage OAuth tokens    │
│                                             │
│  AuthHandler                                │
│    ├─ GitHub OAuth code → token exchange    │
│    └─ Token refresh logic                   │
│                                             │
│  SessionState (Durable Objects)             │
│    └─ In-memory session history             │
│                                             │
└─────────────────────────────────────────────┘
              ↓ API ↓
┌─────────────────────────────────────────────┐
│   External APIs                             │
├─────────────────────────────────────────────┤
│                                             │
│  Gemini 3.1 Flash Live (voice)              │
│  GitHub REST API (issues)                   │
│  Stripe (payment)                           │
│  Cloudflare KV (token storage)              │
│                                             │
└─────────────────────────────────────────────┘
```

---

## State Machine (FSM)

```
[IDLE]
  ↓ User clicks "Start Session"
[LOADING] (Getting OAuth token)
  ↓ Token retrieved
[PHASE_0] (User Stories)
  ↓ User describes problem
[PHASE_1] (MINE)
  ↓ AI asks clarifying questions
[PHASE_2] (SCOUT)
  ↓ AI generates possibilities
[PHASE_3] (ASSAY)
  ↓ Adapt to user's constraints
[PHASE_4] (CRUCIBLE)
  ↓ Test ideas
[PHASE_5] (AUDITOR)
  ↓ Quality check
[PHASE_6] (PLAN)
  ↓ Give final answer
[PHASE_7] (VERIFY)
  ↓ Create GitHub issue
[EXPORT_DONE] (Show issue URL)
  ↓ User clicks "Share"
[IDLE] (Ready for next session)

At any point: User can interrupt → AI responds immediately
             WebSocket disconnects → Offer to resume
             Session timeout → Auto-save, offer to continue
```

---

## API Contracts

### Frontend → Backend: Start Session

```json
POST /api/session/start
{
  "oauth_token": "user's github token",
  "session_type": "discovery | follow_up | team",
  "previous_session_id": "optional, for follow-ups"
}

Response:
{
  "session_id": "uuid",
  "websocket_url": "wss://...",
  "gemini_session_token": "ephemeral token"
}
```

### Frontend ↔ Backend: WebSocket (Continuous)

```json
// Frontend sends audio chunks
{
  "type": "audio_chunk",
  "data": "base64-encoded PCM audio"
}

// Backend sends transcriptions + AI responses
{
  "type": "transcript",
  "speaker": "user | ai",
  "text": "partial transcription",
  "is_final": false
}

{
  "type": "transcript",
  "speaker": "ai",
  "text": "full final response",
  "is_final": true
}

// Server notifies phase change
{
  "type": "phase_change",
  "phase": "PHASE_2",
  "duration_remaining": 1800
}
```

### Backend → GitHub: Create Issue

```
POST /repos/{user}/thinking-foundry-sessions/issues

{
  "title": "Session: Marketing Launch Problem — 2026-03-28",
  "body": "# Thinking Session\n\n**Duration:** 67 minutes\n**Confidence:** 8/10\n\n## Problem\nI have a marketing problem...\n\n## Thinking\n...[full transcript]...\n\n## Answers\n1. Focus on X\n2. Then do Y\n\n[Full Transcript](link-to-gist)",
  "labels": ["session", "completed"]
}

Response:
{
  "html_url": "https://github.com/..."
}
```

### Backend → Stripe: Create Charge

```
POST https://api.stripe.com/v1/payment_intents

{
  "amount": 50000, // $500 in cents
  "currency": "usd",
  "customer": "stripe_customer_id",
  "description": "Thinking Foundry Discovery Session"
}

Response:
{
  "status": "succeeded",
  "id": "pi_..."
}
```

---

## Per-Phase Prompts

Each phase has a custom prompt for Gemini Live that guides the conversation.

### Phase 0: User Stories (Anchor)

```
You are helping someone clarify what they want.

Ask these questions naturally (not as a list):
1. What's the actual problem? (not the symptom)
2. What would success look like?
3. What would failure look like?
4. What constraints are real? (time, budget, team, expertise)
5. What's in their control vs. what's not?

Your job: Get clarity, not give advice.
Never jump to solutions.
Keep asking "what else?" until they feel understood.

Be warm, curious, not robotic.
```

### Phase 1: MINE (Deep Listening)

```
You are a clinical listener. Your job is to understand the root problem.

The user has given you their situation. Now dig deeper:
- Ask "why" 3+ times to get to root cause
- Challenge assumptions gently ("What if that's not true?")
- Reflect back what you hear
- Notice emotional weight (are they frustrated? Overwhelmed?)
- Ground everything in stoicism (what's in their control?)

Your output: "So the real issue is [X], not [Y]."

Never give solutions yet. Just understand.
```

### Phase 2: SCOUT (Possibility Space)

```
You are a creative brainstormer. Put everything on the table.

Generate 7-10 different directions the user could take:
- Include wild/unconventional ideas
- Reference different frameworks (lean, agile, first principles, etc.)
- Bring in examples from adjacent industries
- Surface contradictions ("This idea conflicts with that idea")
- Ask "what if the opposite were true?"

Your goal: MAX possibilities, not evaluation yet.
Resist the urge to narrow down.
Stay in brainstorm mode.

Format: "Here are 7 directions we could take:
1. Direction A (reference: Framework X)
2. Direction B (reference: Case study Y)
..."
```

### Phase 3: ASSAY (Signal from Noise)

```
You are a filter. Take the wide possibility space and find what matters for THIS person.

Given their constraints (time, budget, team, values), which directions fit?
- Adapt frameworks to their situation
- Ask "which of these resonates with you?"
- Challenge the ones that don't fit
- Narrow from 7 possibilities to 3 viable paths

Your goal: Person-specific optimization, not modal (what works for most).

Format: "Given your constraints, here are the 3 most viable paths:
1. Path A because [specific reason for you]
2. Path B because [specific reason for you]
3. Path C because [specific reason for you]"
```

### Phase 4: CRUCIBLE (Test Ideas)

```
You are a stress-tester. War-game the scenarios.

For each remaining path:
- "What could break?"
- "What's the worst case?"
- "What would you do if that happened?"
- Test edge cases
- Look for hidden assumptions

Your goal: Increase confidence by reducing unknowns.

Format: "Let's test path A:
- Risk 1: [outcome] → Mitigation: [what to do]
- Risk 2: [outcome] → Mitigation: [what to do]
- Confidence after testing: 7/10 → why?"
```

### Phase 5: AUDITOR (Quality Check)

```
You are a quality auditor. Is this thinking solid?

Check:
- Did we miss anything?
- Are there logical gaps?
- Did we actually answer the original problem?
- Confidence level: are we ≥8/10?

Be honest. If something feels off, say so.

Format: "Confidence check: [score]/10
- We covered: [what]
- We missed: [what]
- Gap to solve: [what]
- Recommended next step: [what]"
```

### Phase 6: PLAN (Clear Answers)

```
You are a strategist. Give clear answers.

Based on everything above, here's what they should do:
1. Next action (specific, not vague)
2. Why this (connect to their values/constraints)
3. Success metric (how do they know it worked?)
4. Fallback plan (if X happens, do Y)

Your goal: They leave with clarity, not confusion.

Format: "Here's your plan:
1. FIRST: [specific action] because [reason]
   Success looks like: [metric]
   Fallback: [if X, do Y]
2. SECOND: [specific action]
   ..."
```

### Phase 7: VERIFY (Export)

```
You are a documenter. Create the final transcript export.

The session is complete. Now:
- Summarize the thinking journey
- Extract the key insights
- Format for GitHub issue
- Offer to share/iterate

Format: "Perfect. Let me create your GitHub issue.
[Showing preview of issue]
Ready to share? I'll give you the link."
```

---

## Error Handling & Edge Cases

### Network Disconnects

**During Session:**
```
1. WebSocket drops
2. Client detects (no heartbeat for 5s)
3. User sees: "Connection lost. Attempting to reconnect..."
4. Try to reconnect for 30 seconds
5. If successful: Resume from last audio chunk
6. If failed: Offer to save transcript, offer to resume next session
```

**After Session:**
```
1. GitHub issue creation fails
2. User sees: "Issue creation failed. Retry?"
3. Provide manual export link (download transcript)
4. Retry issue creation (idempotent)
```

### Transcription Errors

**Garbled transcript:**
```
1. System detects low confidence (<70%)
2. Marks [UNCLEAR] in transcript
3. User sees warning: "Some words unclear. Review before export?"
4. Allow manual editing of transcript
```

### Token Expiration

**OAuth token expires during session:**
```
1. GitHub API returns 401
2. Attempt token refresh
3. If refresh fails: Ask user to re-authenticate
4. Resume session (don't lose progress)
```

### Timeout

**Session runs >2 hours:**
```
1. Warn user: "Session approaching limit"
2. Offer to wrap up ("Should we finish?")
3. If no response after warning, close gracefully
4. Save everything to GitHub
```

---

## Testing Checklist (Pre-Launch)

### Functional Tests
- [ ] Audio capture works (desktop + mobile)
- [ ] Real-time transcription displays correctly
- [ ] All 8 phases execute (take manual session)
- [ ] Interruption works (cut off AI mid-sentence)
- [ ] GitHub issue created with full transcript
- [ ] Issue links to previous session (follow-up)
- [ ] Payment processing (Stripe)
- [ ] User can download transcript
- [ ] Session data persists (disconnect/reconnect)

### Performance Tests
- [ ] Latency <500ms (first response)
- [ ] Transcription appears <1s after speech
- [ ] No audio dropouts in 60-min session
- [ ] 10 concurrent sessions (test scaling)

### Edge Case Tests
- [ ] Network disconnect mid-session
- [ ] GitHub API rate limit (rapid follow-ups)
- [ ] Noisy environment (user still understood)
- [ ] Fast speech (VAD catches it)
- [ ] User doesn't speak (timeouts)
- [ ] All 7 phases with no errors
- [ ] Delete session, create new one

### User Experience Tests
- [ ] Can new user understand how to use it?
- [ ] Interruption feels natural?
- [ ] GitHub issue is clear/useful?
- [ ] User leaves with clarity (confidence ≥8/10)?

---

## Success Metrics (MVP)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Completion Rate** | 90%+ | Sessions that finish without error |
| **User Clarity** | 8+/10 avg | Post-session survey |
| **Session Duration** | 60-120 min | WebSocket duration |
| **GitHub Issues Created** | 100% | Sessions → Issues (no failures) |
| **Latency (AI Response)** | <500ms | WebSocket message timestamps |
| **Interruption Success** | 100% | Works every time user tries |

---

## Deployment Plan

### Week 1: Setup & Testing
- [ ] Gemini Live API account + credentials
- [ ] GitHub OAuth app setup
- [ ] Stripe account + test mode
- [ ] Cloudflare Workers project
- [ ] Local development environment

### Week 2: Core Build
- [ ] Frontend: React scaffold + audio capture
- [ ] WebSocket server (Cloudflare)
- [ ] Gemini Live integration
- [ ] Real-time transcription display
- [ ] Phase transitions

### Week 3: Integration & Launch
- [ ] GitHub OAuth login
- [ ] Issue export to GitHub
- [ ] Stripe payment integration
- [ ] E2E testing with real sessions
- [ ] Deploy to production (Vercel + Cloudflare)
- [ ] Monitoring + error tracking

### Launch Checklist
- [ ] All FSD requirements met
- [ ] 3+ test sessions completed (manual)
- [ ] Error handling for all edge cases
- [ ] Support plan (how to handle issues)
- [ ] Monitoring dashboard (Sentry/PostHog)
- [ ] Go/No-Go decision

---

## Post-MVP Roadmap

### Phase 2: Team Training (Week 4-6)
- Group sessions (2-10 people)
- Team-level permissions + sharing
- Team license management

### Phase 3: Enhancements (Week 7-8)
- Session summaries (AI-generated)
- Email transcript export
- Integration with Slack
- Analytics (thinking patterns)

### Phase 4: Monetization (Week 9-10)
- Subscription tier ($99/month for unlimited sessions)
- API for 3rd-party apps
- White-label version

---

## Appendix: Research Summary

**All Technical Research Complete:**

✅ **RESEARCH-01:** Gemini Live API ($0.005/min input, $0.018/min output = $1.38/session)
✅ **RESEARCH-02:** GitHub API (5,000 req/hour, sufficient for 800+ sessions/hour)
✅ **RESEARCH-03:** Transcription (Automatic, real-time, 95%+ accuracy)
✅ **RESEARCH-04:** Interruption (Barge-in built-in, natural UX, zero extra code)

**Ready to Build:** ✅ YES

---

**Document Status:** APPROVED FOR BUILDING

**Next Step:** Start frontend development (React scaffold + audio capture)

---

*This FSD represents the complete design of The Thinking Foundry MVP. Every component, flow, and edge case is specified. Implementation should follow this spec precisely.*
