# Functional Specification Document (FSD)

**The Thinking Foundry — Product Design**

**Status:** MVP Rearchitecture — Drive-First Data Model
**Version:** 3.0
**Date:** 2026-03-29
**DU Estimate:** 20-25 (4-5 weeks, autonomous build)

---

## Executive Summary

The Thinking Foundry is a **voice-first SaaS product** that guides people through structured thinking when facing complex decisions.

**Product in 30 Seconds:**
1. You send someone a link. They open it. Session starts.
2. The AI **leads** the conversation — it drives, asks questions, challenges assumptions, manages phases
3. User can interrupt anytime (natural barge-in)
4. Session is transcribed and organized by phase automatically
5. Google Drive folder created with phase-by-phase thinking artifacts
6. User leaves with clarity + a repeatable process they understand

**Critical Design Principle:** The AI is the co-founder in the room. It doesn't wait for the user to know what to ask. It drives. It challenges. It knows when to push, when to listen, when to move phases. This is NOT a chatbot.

**Tech Stack:**
- Frontend: React + Web Audio API (Vercel)
- Voice: Gemini 3.1 Flash Live API (Google Cloud billing)
- Backend: Node.js + Express + WebSocket (Railway or Vercel Functions)
- Storage: **Google Drive (source-of-truth database)** + GitHub Issues (public record)
- Auth: **MVP = Link-based only** (unique session URL, no login required)
- Database: Drive folders organized by phase, no Supabase

**MVP Philosophy:** Drive IS the database. GitHub Issues point to Drive. No separate persistence layer.

**Deferred to Post-MVP:**
- PIN + SMS authentication (not needed for first launch)
- Database migration (if needed for scale)
- Team collaboration features
- Stripe payment processing (free initially)

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

### Flow 1: MVP User (Link-Based, Single Session)

```
1. User receives unique link: https://thinkingfoundry.app/s/abc123def456
   ↓
2. Click link → Browser opens, auto-requests audio permission
   ↓
3. Grant audio permission (Safari/Chrome popup)
   ↓
4. Server creates Google Drive folder structure:
   /Thinking Foundry Sessions/
   └── session-abc123def456/
       ├── metadata.json (sessionId, timestamp, status)
       ├── Phase-0-User-Stories/
       ├── Phase-1-MINE/
       ├── Phase-2-SCOUT/
       ├── Phase-3-ASSAY/
       ├── Phase-4-CRUCIBLE/
       ├── Phase-5-AUDITOR/
       ├── Phase-6-PLAN/
       └── Phase-7-VERIFY/
   ↓
5. [PHASE 0-7] Real-time session with AI
   - User speaks → captured + transcribed
   - Insights appear on screen in real-time (not verbatim, key points)
   - Server writes phase summaries to Drive Docs as session progresses
   - User can interrupt anytime (natural barge-in)
   ↓
6. AI signals phase transition:
   "OK, I think I understand Phase 0. We have these user stories.
    Let's move to Phase 1 and dig deeper. Ready?"
   ↓
7. Phase 1 folder gets populated in Drive with Phase 1 notes (in real-time)
   ↓
8. Session completes (all 8 phases or user stops)
   ↓
9. Server creates GitHub issue:
   Title: "Session: [Problem Name] — 2026-03-29"
   Body: Full transcript + link to Drive folder
   Labels: session, phase-0, phase-1, ... (phases covered)
   ↓
10. Client shows: "Session complete! ✅ [GitHub Issue URL] • [Drive Folder URL]"
   ↓
11. User can:
    - Share GitHub issue
    - Share Drive folder
    - Download transcript
    - Continue thinking (new session)
```

### Flow 2: Follow-Up Session (Deferred to Post-MVP)

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

## Component Architecture (MVP)

```
┌─────────────────────────────────────────────────────┐
│        Frontend (React + Web Audio — Vercel)        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  LinkAuth (Stateless)                               │
│    └─ Extract sessionId from URL path               │
│       (/s/abc123def456 → session_abc123def456)      │
│       No forms, no login, just click link            │
│                                                     │
│  ThinkingSession                                    │
│    ├─ AudioCapture (Web Audio API)                  │
│    ├─ OutlineView (real-time insights)              │
│    │   └─ User stories, research, framework refs    │
│    ├─ PhaseIndicator + Timer                        │
│    ├─ InterruptHint (soft indicator)                │
│    ├─ PauseButton                                   │
│    └─ ExportButton (end-of-session, show URLs)      │
│                                                     │
└─────────────────────────────────────────────────────┘
         ↓ WebSocket ↓
┌─────────────────────────────────────────────────────┐
│   Backend (Node.js + Express + WS on Railway)      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  SessionManager                                     │
│    ├─ Create sessionId from link token              │
│    ├─ Persist session state in memory (Durable)     │
│    └─ Drive folder initialization                   │
│                                                     │
│  AudioProcessor                                     │
│    ├─ Receive audio chunks from client              │
│    ├─ Send to Gemini Live (bidirectional)           │
│    ├─ Handle barge-in interruption                  │
│    └─ Stream responses back to client               │
│                                                     │
│  TranscriptExtractor                                │
│    ├─ Parse AI responses for key points             │
│    ├─ Generate outline items (user stories, etc.)   │
│    ├─ Send real-time outline to client              │
│    └─ Store raw transcript in memory                │
│                                                     │
│  DriveDatabase (Core Persistence)                   │
│    ├─ Create Drive folder per session               │
│    ├─ Create phase subfolders (Phase-0, Phase-1...) │
│    ├─ Write phase summaries as docs (real-time)     │
│    ├─ Update metadata.json per update               │
│    └─ Share folder with user email (if provided)    │
│                                                     │
│  PhaseTransitionHandler                             │
│    ├─ Detect AI's phase end signal                  │
│    ├─ Send phase_change message to client           │
│    ├─ Create new phase folder in Drive              │
│    └─ Inject new phase prompt to Gemini             │
│                                                     │
│  GitHubExporter (End-of-Session)                    │
│    ├─ Collect full transcript from memory           │
│    ├─ Create GitHub issue with transcript           │
│    ├─ Link to Drive folder URL                      │
│    └─ Tag by phases covered                         │
│                                                     │
└─────────────────────────────────────────────────────┘
         ↓ APIs ↓
┌─────────────────────────────────────────────────────┐
│   External Services                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Gemini 3.1 Flash Live API (bidirectional audio)    │
│  GitHub REST API (issue creation + labels)          │
│  Google Drive API (real-time persistence)           │
│  (No SMS, no Supabase, no Cloudflare KV for MVP)    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Data Storage Model — Drive as Database

**The critical architectural decision:** Google Drive IS the database. Not supplemental storage. The source of truth.

### Drive Folder Structure

```
Google Drive (User's Personal Drive)
└── Thinking Foundry Sessions/
    └── session-abc123def456/
        ├── metadata.json
        │   {
        │     "sessionId": "abc123def456",
        │     "createdAt": "2026-03-29T14:32:00Z",
        │     "phases": [0, 1, 2, 3, 4, 5, 6, 7],
        │     "githubIssueUrl": "https://github.com/...",
        │     "status": "completed" | "in-progress" | "paused",
        │     "totalDuration": 3600
        │   }
        │
        ├── Phase-0-User-Stories/
        │   └── notes.md (updated in real-time)
        │
        ├── Phase-1-MINE/
        │   └── notes.md
        │
        ├── Phase-2-SCOUT/
        │   └── notes.md
        │
        ├── Phase-3-ASSAY/
        │   └── notes.md
        │
        ├── Phase-4-CRUCIBLE/
        │   └── notes.md
        │
        ├── Phase-5-AUDITOR/
        │   └── notes.md
        │
        ├── Phase-6-PLAN/
        │   └── notes.md
        │
        └── Phase-7-VERIFY/
            └── full-transcript.md
```

### Write Pattern (Server → Drive)

**Real-time updates, NOT batch at end:**

```
Session starts (t=0)
  ↓
1. Server creates /session-abc123/
2. Server creates /session-abc123/metadata.json (status: "in_progress")
3. Gemini connects, server enters Phase 0

Every AI response:
  ├─ Parse response for key points
  ├─ Append to /session-abc123/Phase-0/notes.md
  ├─ Send outline_item to client (for real-time display)
  └─ Store full transcript in memory

AI signals phase end ("Ready to move to Phase 1?"):
  ├─ Create /session-abc123/Phase-1/
  ├─ Initialize Phase-1/notes.md
  ├─ Send phase_change message to client
  └─ Inject Phase 1 prompt to Gemini

...repeat for all 8 phases...

Session complete:
  ├─ Finalize metadata.json (status: "completed")
  ├─ Create /session-abc123/Phase-7/full-transcript.md
  ├─ Create GitHub issue (body = full transcript, link = Drive folder)
  ├─ Send export_complete to client
  └─ Close WebSocket
```

### What Gets Written Where

| Data | Destination | Frequency | Format |
|------|-------------|-----------|--------|
| Phase summaries | Drive (Phase-X/notes.md) | Real-time, after each AI response | Markdown |
| Full transcript | Drive (Phase-7/full-transcript.md) | Once at session end | Markdown |
| Session metadata | Drive (metadata.json) | On phase transitions + end | JSON |
| Public record | GitHub Issue | Once at session end | Markdown + labels |

### Why Drive as Database

1. **User ownership:** Folder lives in user's Drive, they control it
2. **No migration risk:** If we change backends, data is already in user's hands
3. **Simple persistence:** Write markdown + JSON, no schemas
4. **Real-time accessible:** User can open notes mid-session if they refresh browser
5. **No vendor lock-in:** Pure Google APIs, portable to competitors if needed

---

## The AI as Conversation Leader

**This is the single most important design decision in the product.**

The AI doesn't respond. It LEADS. Like a co-founder who's been through this before.

### How the AI Drives Each Phase

**Phase 0 (User Stories):** AI opens with: "Tell me what's on your mind. What's the problem you're wrestling with?" Then actively probes: "You said X — what makes that the real issue and not a symptom?" Keeps asking until it has clarity. Decides when to move to Phase 1.

**Phase 1 (MINE):** AI says: "OK, I think I understand the surface. Let me dig deeper." Uses the 5 Whys. Reflects back. Challenges gently. "What if that assumption is wrong?" Decides when root cause is found.

**Phase 2 (SCOUT):** AI says: "Good — now let's open this up. I'm going to throw some directions at you. Don't evaluate yet, just react." Generates 7-10 possibilities. References frameworks. Asks "what else?" Decides when possibility space is wide enough.

**Phase 3 (ASSAY):** AI says: "We've got a lot on the table. Let's narrow. Given your constraints — [lists them] — which of these actually fits YOUR situation?" Adapts frameworks. Decides when 2-3 viable paths remain.

**Phase 4 (CRUCIBLE):** AI says: "Let's stress-test these. What breaks? What's the worst case?" War-games each path. Decides when confidence is sufficient.

**Phase 5 (AUDITOR):** AI says: "Before I give you a plan — did we miss anything? Any blind spots?" Honest quality check. Decides if we need to loop back.

**Phase 6 (PLAN):** AI says: "Here's what I think you should do, and here's why." Gives specific, actionable answers tied to their constraints.

**Phase 7 (VERIFY):** AI says: "Let me organize everything we discussed." Creates the export.

### Key Behaviors

- **AI decides phase transitions** (not the user, not a timer)
- **AI asks follow-ups** without being asked
- **AI challenges assumptions** proactively
- **AI brings in frameworks** from base knowledge (Stoicism, IDEO, McKinsey, First Principles)
- **AI keeps responses SHORT** — like a co-founder, not a lecture. 2-3 sentences, then a question.
- **AI reads emotional tone** — if user sounds frustrated, acknowledge it before continuing
- **AI resists premature closure** — even when user wants an answer, push one more round if warranted

### What the AI is NOT

- NOT a passive listener waiting for instructions
- NOT a chatbot that answers questions
- NOT a consultant reading a script
- NOT verbose (short, punchy, like talking to a sharp friend)

---

## 15-Minute Session Reconnection Strategy

**Problem:** Gemini Live API caps sessions at 15 minutes for audio-only.
**Solution:** Seamless reconnection every ~14 minutes. User should never notice.

### How It Works

```
Session Start (t=0)
  │
  ├── Gemini connection 1 (0:00 - 14:00)
  │     At 13:00: Backend starts preparing reconnection
  │     At 14:00: Connection 1 closes gracefully
  │
  ├── Reconnection gap (~1-2 seconds)
  │     Backend opens connection 2
  │     Injects system prompt + condensed transcript so far
  │     AI continues naturally: "Sorry, where were we? Right — you were saying..."
  │
  ├── Gemini connection 2 (14:02 - 28:00)
  │     Same pattern at 27:00
  │
  ├── Gemini connection 3 (28:02 - 42:00)
  │     ...
  │
  └── Session End (42:00 - 90:00, as many connections as needed)
```

### Context Preservation Across Reconnections

Each reconnection injects a condensed context:
```
System prompt: [Phase-specific prompt]
+ "Session context: User's problem is [X]. We're currently in Phase [N].
   Key findings so far: [bullet points from previous phases].
   Last thing discussed: [last 2-3 exchanges].
   Continue naturally from here."
```

### UX During Reconnection

- User hears brief silence (1-2 seconds) — acceptable in conversation
- AI resumes naturally (no "reconnecting" message)
- If reconnection fails: "Hold on one second... [retry]... OK, I'm back."
- Transcript continues seamlessly (no gap visible to user)

### Context Window Management

Gemini 3.1 Flash Live: 128K token context window.
- Each reconnection: ~2K tokens for system prompt + ~5K for condensed history
- After 4 reconnections (60 min): ~28K tokens used for context
- Leaves ~100K for conversation — sufficient

### Testing Required (POC)

- [ ] Can we reconnect within 2 seconds?
- [ ] Does the AI maintain conversation coherence across reconnections?
- [ ] Does barge-in work immediately after reconnection?
- [ ] Can we handle reconnection during user's speech? (defer: wait for silence)

---

## State Machine (FSM)

```
[IDLE]
  ↓ User opens link
[SESSION_INIT] (Create Gemini connection + Drive folder)
  ↓ Connection established
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

## API Contracts (MVP)

### Link-Based Access (No Authentication Required)

**User clicks:** `https://thinkingfoundry.app/s/abc123def456`

```
GET /s/:accessToken
  ↓
1. Validate token (simple check: token exists + not expired)
2. Extract sessionId from token (deterministic)
3. Create Drive folder: session-{sessionId}
4. Redirect to /session/{sessionId} with WebSocket URL embedded
5. Client connects to WS, session begins
```

**Why link-based:**
- No form complexity (MVP constraint)
- Roderic controls who gets a link (external access control)
- Simple token generation (UUID or HMAC-based)
- Easy to share/revoke if needed

### Frontend → Backend: WebSocket Connection

```
WS /session/{sessionId}

Client immediately sends:
{
  "type": "start",
  "sessionId": "abc123def456",
  "frameworks": ["stoicism", "ideo", "mckinsey", "yc", "lean", "hormozi", "nate-b-jones", "indydev-dan"]
}

Server responds:
{
  "type": "ready",
  "sessionId": "abc123def456",
  "driveFolder": "https://drive.google.com/drive/folders/...",
  "phase": 0
}
```

### Frontend ↔ Backend: WebSocket Messages (Continuous)

**Client → Server (Audio):**
```json
{
  "type": "audio",
  "data": "base64-encoded PCM audio chunk",
  "timestamp": 1234567890
}
```

**Server → Client (Transcript + Outline):**
```json
// Real-time transcript
{
  "type": "transcript",
  "speaker": "user | ai",
  "text": "Partial or complete utterance",
  "isFinal": true
}

// Real-time outline items (key points, user stories, research)
{
  "type": "outline_item",
  "phase": 0,
  "label": "USER_STORY | RESEARCH | FRAMEWORK | INSIGHT",
  "text": "One-line summary for display",
  "icon": "📖 | 🔍 | 🏛️ | 💡"
}

// Phase transition signal from AI
{
  "type": "phase_transition",
  "from": 0,
  "to": 1,
  "aiMessage": "Ready to move to Phase 1 — MINE. Agreed?"
}

// Status updates
{
  "type": "status",
  "state": "connected | recording | reconnecting | paused"
}

// Error handling
{
  "type": "error",
  "message": "Audio timeout — no speech for 30s. Still here?"
}
```

### Backend → Drive: Real-Time Writes

```
Per AI response:
  PUT /drive/files/{phaseFolder}/notes.md
  {
    "summary": "Appended markdown summary",
    "timestamp": "2026-03-29T14:32:00Z"
  }

Per phase transition:
  POST /drive/folders
  {
    "parent": "session-abc123def456",
    "name": "Phase-1-MINE"
  }

Session end:
  PUT /drive/files/{sessionFolder}/metadata.json
  {
    "status": "completed",
    "githubIssueUrl": "https://github.com/...",
    "completedAt": "2026-03-29T15:30:00Z"
  }
```

### Backend → GitHub: Issue Creation (Session End)

```
POST /repos/growthpigs/thinking-foundry/issues
{
  "title": "Session: [Problem Name] — 2026-03-29",
  "body": "# Thinking Foundry Session\n\n[Full Transcript]\n\n## Next Steps\n[Drive Folder](https://drive.google.com/...)",
  "labels": ["session", "phase-0", "phase-1", "phase-2", ... (phases covered)]
}

Response:
{
  "html_url": "https://github.com/growthpigs/thinking-foundry/issues/123"
}
```

**Post-MVP (DEFERRED):** PIN + SMS authentication, team sharing, follow-up sessions.

---

## Base Knowledge System (MVP)

**The AI guide has built-in knowledge of these frameworks. No dynamic fetching needed for MVP.**

### Always Available (Baked into System Prompt)

| Domain | Framework | How It's Used |
|--------|-----------|--------------|
| **Foundation** | Stoic philosophy | Anchor for all phases — what's in control? Accept constraints. Virtue in thinking. |
| **Business Thinking** | McKinsey problem structuring | Phase 1 (MINE): Break problem into components. Phase 3 (ASSAY): Prioritize. |
| **Design Thinking** | IDEO methodology | Phase 2 (SCOUT): Empathize, ideate without judgment, prototype to learn. |
| **First Principles** | Elon Musk / physics thinking | Phase 4 (CRUCIBLE): Strip to fundamentals, rebuild from base truths. |
| **Specification** | The Foundry methodology | Phase 0: User stories first. Spec before build. Verify at each gate. |
| **Generalist Advantage** | Nate B. Jones | Phase 2 (SCOUT): Connect across domains. Pattern recognition. |

### How Base Knowledge Enters the Conversation

The AI doesn't lecture about frameworks. It uses them naturally:

- "Let's strip this to first principles — what's actually true here, not assumed?"
- "An IDEO approach would say: before we solve, let's make sure we deeply understand the user."
- "McKinsey would structure this as three sub-problems. Let's try that."
- "What would a stoic say? What's actually in your control here?"

The AI references frameworks when relevant, doesn't force them. Adapts to the person.

### Dynamic Plugin System (DEFERRED — Post-MVP)

After launch, we'll add:
- Keyword extraction from problem statement
- Web search for domain-specific sources
- Real-time framework injection
- Cached popular frameworks

See issue #12 for full plugin system design.

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

## Testing Checklist (Pre-Launch MVP)

### Critical Path Tests
- [ ] **Link-based access:** Click unique link → session starts immediately
- [ ] **Drive folder creation:** Folder created with correct structure (Phase-0, Phase-1, etc.)
- [ ] **Audio capture:** Works on desktop + mobile (Safari + Chrome)
- [ ] **Gemini connection:** Connects successfully, receives audio, sends back speech
- [ ] **Barge-in (interruption):** AI stops mid-sentence when user speaks
- [ ] **Real-time outline:** Outline items appear on screen as AI speaks
- [ ] **All 8 phases execute:** Full 60-120 min session with all phases
- [ ] **Phase transitions:** AI signals phase end, UI updates, new folder created
- [ ] **Drive writes:** Check Drive folder after each phase — notes.md updated
- [ ] **Session end:** GitHub issue created with full transcript + correct labels
- [ ] **Export URLs:** Client receives both GitHub + Drive URLs at end

### Drive Persistence Tests
- [ ] Drive folder exists with correct structure
- [ ] Phase-X/notes.md files are created and populated
- [ ] metadata.json exists and updates correctly
- [ ] Folder is shared with user email (if provided)
- [ ] User can open Drive folder and read phase notes
- [ ] Real-time updates work (notes appear while session running)
- [ ] Session metadata accurately reflects phases covered

### Outline View Tests
- [ ] Outline items appear in real-time (not verbatim transcript)
- [ ] User stories extracted and displayed
- [ ] Research findings appear with context
- [ ] Framework references appear when AI mentions them
- [ ] Outline items are concise (one-liners for screen display)

### AI Behavior Tests
- [ ] AI stays in Phase 0 until user stories are clear
- [ ] AI transitions to Phase 1 at the right moment
- [ ] AI uses frameworks naturally (doesn't lecture)
- [ ] AI keeps responses short (2-3 sentences + question)
- [ ] AI challenges assumptions proactively
- [ ] All 8 phases have distinct behavior (per prompt specs)

### Error Handling Tests
- [ ] Network disconnect mid-session → offer to resume
- [ ] GitHub API fails → show Drive folder anyway
- [ ] Drive API fails → show error but don't crash
- [ ] Long silence (30s+) → AI asks "Still here?"
- [ ] Audio permission denied → clear error message
- [ ] WebSocket drops → client shows "reconnecting..."

### Performance Tests
- [ ] First AI response <500ms
- [ ] Audio playback has <200ms latency
- [ ] No audio dropouts in 90-min session
- [ ] 5 concurrent sessions work (load test)

### User Experience Tests
- [ ] User can start session in <5 seconds
- [ ] Interruption feels natural (no awkward pauses)
- [ ] User can follow progress (phase indicator clear)
- [ ] Final GitHub + Drive URLs are discoverable
- [ ] User leaves with 8+/10 clarity confidence

---

## Success Metrics (MVP Launch)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| **Link Access** | 100% | Unique link → session starts (no login) |
| **Completion Rate** | 90%+ | Sessions complete all 8 phases |
| **Drive Persistence** | 100% | Every phase creates folder with notes.md |
| **GitHub Export** | 100% | Every session → one GitHub issue |
| **Outline Display** | 100% | Real-time insights appear on screen |
| **AI Response Latency** | <500ms | First response <500ms consistently |
| **Barge-In Success** | 100% | Interruption works every time |
| **User Clarity** | 8+/10 | Post-session assessment |
| **Session Duration** | 60-120 min | Full 8 phases with no timeouts |
| **Mobile Experience** | Fully Functional | No degradation on Safari/Chrome mobile |

---

## Build Plan (MVP — Autonomous, 20-25 DUs)

**Assumption:** PoC validated voice + Gemini Live works. Now building real MVP architecture.

### Phase 1: Data Layer (DriveDatabase)
**DUs: 5-6**

- [ ] DriveDatabase class (wrapper around googleapis)
- [ ] Session folder initialization
- [ ] Real-time writes to Drive (Phase-X/notes.md)
- [ ] Metadata.json creation + updates
- [ ] Share folder with user email (optional MVP)

### Phase 2: Link-Based Auth + Session Init
**DUs: 3-4**

- [ ] Link token validation (/s/{token} route)
- [ ] SessionManager (create + persist in memory)
- [ ] WebSocket connection + authentication
- [ ] Drive folder creation on session start

### Phase 3: Real-Time Outline Extraction
**DUs: 4-5**

- [ ] TranscriptExtractor (parse AI responses)
- [ ] Outline item generation (user stories, research, frameworks)
- [ ] Real-time outline_item WebSocket messages
- [ ] Client-side outline display (OutlineView component)

### Phase 4: Phase Transitions + Drive Integration
**DUs: 3-4**

- [ ] Phase transition detection (AI signals readiness)
- [ ] New phase folder creation in Drive
- [ ] phase_transition WebSocket message
- [ ] Phase prompt injection to Gemini

### Phase 5: GitHub Export
**DUs: 2-3**

- [ ] Collect full transcript from memory
- [ ] Create GitHub issue (title + body + labels)
- [ ] Link to Drive folder in issue
- [ ] Tag by phases covered

### Phase 6: Testing + Refinement
**DUs: 3-4**

- [ ] Manual end-to-end session (all 8 phases)
- [ ] Verify Drive folder structure
- [ ] Verify GitHub issue creation
- [ ] Verify outline view display
- [ ] Error handling edge cases

### Deployment Sequence

**Step 1 (Local):** Build + test all components locally with Railway/Vercel staging
**Step 2 (Staging):** Deploy to Railway backend + Vercel frontend (staging URLs)
**Step 3 (Production):** Blue-green deploy (keep PoC running, parallel MVP on new URLs)
**Step 4 (Go/No-Go):** Run 3+ test sessions, validate all critical path items

**No rollback risk:** PoC stays alive during MVP build, parallel deployment

---

## Post-MVP Roadmap (Deferred)

### Post-MVP 1: User Persistence (Week 1-2 after launch)
- PIN + SMS authentication (replace link-based)
- User accounts + session history
- Follow-up sessions (reference previous session in new session)
- Session resumption (reconnect to incomplete session)

### Post-MVP 2: Team + Sharing (Week 3-4)
- Share session link with others (co-listening)
- Group sessions (multiple people contribute)
- Team license management
- Shared Drive folder permissions

### Post-MVP 3: Enhancements (Week 5-6)
- AI-generated session summaries (replace manual outline)
- Email transcript export
- Slack integration (share results → Slack)
- Analytics dashboard (thinking patterns, common problems)

### Post-MVP 4: Monetization (Week 7-8)
- Subscription tier ($29-99/month)
- API for 3rd-party apps
- White-label / custom branding
- Audit logs + compliance

---

## Appendix: MVP Architecture Changes (v3.0)

**From POC → MVP: The Rearchitecture**

### What Changed

| Aspect | POC | MVP |
|--------|-----|-----|
| **Auth** | Not specified | Link-based (click → start) |
| **Storage** | Unclear persistence | Drive as database (source-of-truth) |
| **Data Flow** | Client-driven export | Server-driven real-time writes |
| **Outline View** | Transcript display | Real-time insights extraction |
| **Phase Transitions** | Manual button | AI-driven (system detects) |
| **Write Pattern** | Batch at end | Real-time per response |
| **Backend** | Railway / Vercel | Node.js + Express + WebSocket |
| **Database** | Not specified | Google Drive only |

### Why This Works

1. **Simplicity:** Link-based MVP = zero auth complexity
2. **User Control:** Drive folders in user's own Drive
3. **Transparency:** User can watch session unfold in Drive
4. **No Vendor Lock:** Pure Drive + GitHub, portable
5. **Scalable:** Drive API scales to millions of sessions
6. **Cost Effective:** ~$1.38 Gemini + ~$0 Drive/GitHub (free tier)

### Technical Debt Eliminated

- ❌ No Supabase (added complexity)
- ❌ No Cloudflare Workers (overkill for MVP)
- ❌ No SMS/PIN system (not needed for link access)
- ❌ No dynamic plugin system (base knowledge sufficient)

---

## Research Complete

✅ **Gemini Live API:** $0.005/min input, $0.018/min output = $1.38/session
✅ **GitHub API:** 5,000 req/hour, sufficient for scale
✅ **Drive API:** Scales to millions, no rate limit concerns
✅ **Interruption (Barge-in):** Built-in, zero extra code
✅ **Real-time Persistence:** Drive API supports concurrent writes

---

**Document Status:** READY FOR AUTONOMOUS BUILD

**Scope:** 20-25 DUs (4-5 weeks)

**Next Step:** Chi builds MVP in parallel worktree, tests end-to-end, validates against this FSD

---

*FSD v3.0 is the complete specification for The Thinking Foundry MVP. Autonomous build follows this spec precisely. No deviations without explicit approval.*
