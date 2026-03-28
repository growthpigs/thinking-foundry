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
- Frontend: React + Web Audio API (Vercel)
- Voice: Gemini 3.1 Flash Live API (via Google Ultra account)
- Backend: Cloudflare Workers
- Storage: GitHub Issues (source-of-truth) + Google Drive (user-friendly)
- Auth: Email → PIN (6-digit) + SMS verification (4-digit)
- Plugins: Dynamic satellite systems (pull frameworks/services on-the-fly)
- User Data: Google Drive + Google Docs (organized by phase)

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

### Flow 1: New User (First Session - Free)

```
1. User lands on app
   ↓
2. Enter email
   ↓
3. Create 6-digit PIN
   ↓
4. Verify phone (SMS code)
   ↓
5. System creates Google Drive folder for user
   ↓
6. Click "Start Thinking Session"
   ↓
7. Grant audio permission
   ↓
8. [PHASE 0-7] Guided conversation with AI
   - User speaks problem
   - AI listens, asks questions
   - Conversation recorded + transcribed (real-time display)
   - User can interrupt anytime
   - System pulls relevant frameworks/services on-the-fly (plugins)
   ↓
9. Session ends → GitHub issue created (backend)
   ↓
10. Google Drive organized by phases:
    /MINE/[phase transcript]
    /SCOUT/[possibilities generated]
    /ASSAY/[relevant frameworks]
    /CRUCIBLE/[risks tested]
    /AUDITOR/[quality check]
    /PLAN/[clear answers]
    /VERIFY/[full transcript]
   ↓
11. User sees their Drive folder, can open any phase to review
```

### Flow 2: Follow-Up Session

```
1. User enters PIN + SMS code
   ↓
2. See previous session in Drive
   ↓
3. Click "Continue Thinking"
   ↓
4. AI references previous session folder
   ↓
5. [PHASE 0-7] Same structure, deeper dive on specific topics
   ↓
6. New GitHub issue created, linked to previous one
   ↓
7. Drive folder updated with new phases + thinking
   ↓
8. All previous sessions visible in Drive history
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
┌─────────────────────────────────────────────────────┐
│        Frontend (React + Web Audio — Vercel)        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Auth Layer                                         │
│    ├─ Email input                                   │
│    ├─ PIN creation (6-digit)                        │
│    ├─ SMS verification (4-digit)                    │
│    └─ PIN/SMS login on return visits                │
│                                                     │
│  ThinkingSession                                    │
│    ├─ AudioCapture (Web Audio API)                  │
│    ├─ TranscriptDisplay (real-time)                 │
│    ├─ PhaseIndicator + Timer                        │
│    ├─ InterruptHint (soft indicator)                │
│    └─ Plugin status (which frameworks loaded?)      │
│                                                     │
│  DriveExplorer                                      │
│    └─ Show Google Drive folder structure by phase   │
│        /MINE /SCOUT /ASSAY /CRUCIBLE /AUDITOR       │
│        /PLAN /VERIFY (open any to read)             │
│                                                     │
└─────────────────────────────────────────────────────┘
         ↓ WebSocket + REST APIs ↓
┌─────────────────────────────────────────────────────┐
│   Backend (Cloudflare Workers)                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  AuthHandler (PIN-based)                            │
│    ├─ Email → PIN creation                          │
│    ├─ SMS verification                              │
│    └─ Session tokens (no passwords)                 │
│                                                     │
│  SessionRouter                                      │
│    ├─ Route audio → Gemini Live (your Ultra acct)   │
│    ├─ Real-time transcription                       │
│    └─ Phase state machine                           │
│                                                     │
│  PluginSystem (Satellite Services)                  │
│    ├─ Analyze user's problem statement              │
│    ├─ Extract keywords/domains                      │
│    ├─ Pull relevant frameworks (Nate B., Graham...) │
│    ├─ Fetch web sources on-demand                   │
│    └─ Inject into phase prompts dynamically         │
│                                                     │
│  GitHubExporter                                     │
│    ├─ Create issue per session                      │
│    ├─ Tag by phase (MINE, SCOUT, ASSAY, etc.)       │
│    └─ Link to previous sessions                     │
│                                                     │
│  GoogleDriveManager                                 │
│    ├─ Create user's Drive folder                    │
│    ├─ Organize by phase subdirectories              │
│    ├─ Create Google Docs per phase                  │
│    └─ Expose folder URL to user                     │
│                                                     │
│  SessionState (Durable Objects)                     │
│    ├─ In-memory session history                     │
│    └─ User session data (email, PIN hash)           │
│                                                     │
└─────────────────────────────────────────────────────┘
         ↓ APIs ↓
┌─────────────────────────────────────────────────────┐
│   External Services                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Gemini 3.1 Flash Live (via Google Ultra account)   │
│  GitHub REST API (store thinking issues)            │
│  Google Drive API (user-friendly storage)           │
│  SMS Provider (verification codes)                  │
│  Cloudflare KV (session tokens, no passwords)       │
│  Web Search API (plugin system to fetch sources)    │
│                                                     │
└─────────────────────────────────────────────────────┘
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

### Frontend Auth: PIN-Based Login

```json
POST /api/auth/register
{
  "email": "user@example.com",
  "pin": "123456"
}

Response:
{
  "session_token": "ephemeral_token",
  "sms_required": true
}

POST /api/auth/verify-sms
{
  "session_token": "ephemeral_token",
  "sms_code": "1234"
}

Response:
{
  "auth_token": "long_lived_token",
  "drive_folder_url": "https://drive.google.com/drive/folders/..."
}

// On return visit: Just PIN + SMS (no email)
POST /api/auth/login
{
  "pin": "123456"
}
// → Same response as verify-sms
```

---

## Plugin System (Satellite Services)

**How It Works:**

During each phase, the system analyzes the user's problem statement and dynamically pulls relevant frameworks/services.

```typescript
// Phase 2 (SCOUT) example:
User says: "I'm struggling with marketing my AI product to enterprises"

PluginSystem triggers:
1. Extract keywords: ["marketing", "AI product", "enterprises"]
2. Identify domain: B2B SaaS marketing
3. Fetch relevant sources:
   - Paul Graham essays on startups
   - Recent articles on enterprise sales
   - Case studies from similar products
   - Nate B. Jones on messaging
   - GTM frameworks (Reforge, Lenny Rachitsky)
4. Inject into AI prompt:
   "Here are 7 directions we could explore:
    1. ... (reference: Paul Graham on distribution)
    2. ... (reference: Enterprise GTM framework)
    3. ... (reference: Recent case study from similar product)"
```

**Available Satellite Services:**

| Domain | Services | Source |
|--------|----------|--------|
| **Strategy** | Paul Graham, Naval, Y Combinator | Web search + cached knowledge |
| **Business** | Nate B. Jones, First Principles | Web search |
| **Product** | Lenny Rachitsky, Reforge, IDEO | Web search + base knowledge |
| **Marketing** | Case studies, GTM frameworks | Web search |
| **Technical** | Architecture patterns, tools | Web search |
| **Leadership** | Stoic philosophy, delegation | Base knowledge |

**Base Knowledge (Always Available):**
- Stoicism (foundation for all thinking)
- IDEO methodology (design thinking)
- McKinsey methodology (business thinking)
- The 8-phase Foundry pipeline (structure)
- First principles thinking (how to break down problems)

**Dynamic Plugins:**
- Pull any framework/source based on user's problem
- No need to pre-define all possibilities
- System adapts as new domains emerge

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
- [ ] Email + PIN creation works
- [ ] SMS verification works
- [ ] PIN login on return visit (no email needed)
- [ ] Audio capture works (desktop + mobile)
- [ ] Real-time transcription displays correctly
- [ ] All 8 phases execute (take manual session)
- [ ] Interruption works (cut off AI mid-sentence)
- [ ] GitHub issue created with full transcript + phase tags
- [ ] Google Drive folder created with phase subfolders
- [ ] Google Docs created for each phase
- [ ] Issue links to previous session (follow-up)
- [ ] User can access Drive folder and open any phase
- [ ] Session data persists (disconnect/reconnect)
- [ ] Plugin system fetches relevant frameworks (SCOUT phase)
- [ ] Plugin results appear in AI prompts

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
| **Auth Success** | 100% | PIN creation → SMS verification → login works |
| **Completion Rate** | 90%+ | Sessions that finish without error |
| **User Clarity** | 8+/10 avg | Post-session survey |
| **Session Duration** | 60-120 min | WebSocket duration |
| **GitHub Issues Created** | 100% | Sessions → Issues (no failures) |
| **Google Drive Organization** | 100% | Folders created, Docs per phase |
| **Plugin System Working** | 80%+ | Frameworks fetched for relevant domains |
| **Latency (AI Response)** | <500ms | WebSocket message timestamps |
| **Interruption Success** | 100% | Works every time user tries |
| **Mobile Usability** | 90%+ | Easy to use on phone (not just desktop) |

---

## Deployment Plan

### Week 1: Setup & Testing
- [ ] Gemini Live API account (Google Ultra account configured)
- [ ] GitHub project + API token (for issue creation)
- [ ] Google Cloud project + Drive API (for user folders)
- [ ] SMS provider account (Twilio or similar for verification)
- [ ] Cloudflare Workers project
- [ ] Local development environment
- [ ] Web search API (for plugin system)

### Week 2: Core Build
- [ ] Frontend: React scaffold (Vercel)
- [ ] PIN auth system (email → PIN → SMS)
- [ ] Audio capture + Gemini Live integration
- [ ] Real-time transcription display
- [ ] Phase transitions + plugin system skeleton
- [ ] Google Drive folder creation + permissions
- [ ] WebSocket server (Cloudflare Workers)

### Week 3: Integration & Launch
- [ ] GitHub issue export (by phase, with tags)
- [ ] Google Drive folder organization (subfolders per phase)
- [ ] Google Docs creation for each phase
- [ ] Plugin system completion (fetch frameworks for SCOUT)
- [ ] E2E testing with real sessions
- [ ] Deploy to production (Vercel frontend + Cloudflare backend)
- [ ] Monitoring + error tracking (Sentry)
- [ ] Go/No-Go decision

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
