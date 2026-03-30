# Functional Specification Document (FSD)

**The Thinking Foundry — Product Design**

**Status:** MVP Rearchitecture — GitHub-First, Supabase-Buffered
**Version:** 4.0
**Date:** 2026-03-30
**DU Estimate:** 20-25 (4-5 weeks, autonomous build)
**Supersedes:** v3.0 (Drive-first model). See growthpigs/thinking-foundry#16 for decision rationale.

---

## Executive Summary

The Thinking Foundry is a **voice-first SaaS product** that guides people through structured thinking when facing complex decisions.

**Product in 30 Seconds:**
1. You send someone a link. They open it. Session starts.
2. The AI **leads** the conversation — it drives, asks questions WITH information, challenges assumptions, manages phases
3. User hits PAUSE frequently — AI provides info, humans discuss, then resume
4. Session is transcribed and organized by phase automatically
5. Each phase produces ONE carry-forward document as a GitHub issue
6. User leaves with clarity + optional NotebookLM audio debate of their decision

**Critical Design Principle:** The AI is the co-founder in the room. It doesn't wait for the user to know what to ask. It drives. It challenges. It knows when to push, when to listen, when to move phases. This is NOT a chatbot. Questions come WITH information — "What about X? Because Y suggests Z" — not empty prompts.

**Tech Stack:**
- Frontend: React + Web Audio API (Vercel) — native iOS app for Safari WebSocket issues
- Voice: Gemini 3.1 Flash Live API (Google Cloud billing)
- Backend: Node.js + Express + WebSocket (Railway or Vercel Functions)
- Storage: **GitHub Issues (source-of-truth)** + Supabase (real-time buffer) + Drive (optional export)
- Auth: **MVP = Link-based only** (unique session URL, no login required)
- Database: Supabase for real-time writes, GitHub Issues for durable per-phase documents
- Frameworks: **Tool-use JIT fetching** (Stoicism embedded, everything else on-demand)

**MVP Philosophy:** GitHub Issues ARE the thinking documents. Supabase buffers real-time writes. Drive is an optional human-readable export. One carry-forward document per phase — the rest is history.

**Deferred to Post-MVP:**
- PIN + SMS authentication (Revolut-style, not OAuth)
- Team collaboration features
- Stripe payment processing (free initially)
- Dual-AI adversarial mode (second AI as devil's advocate)

---

## Phase Overview (8 Phases)

| Phase | Typical | Max | Goal | AI Role |
|-------|---------|-----|------|---------|
| **0** | 1-2 min | 5 min | Capture user stories | Get clarity on what success means |
| **1** | 2-3 min | 10 min | MINE — Listen deeply | Understand the real problem |
| **2** | 3-5 min | 15 min | SCOUT — Explore widely | Generate possibilities (frameworks fetched JIT) |
| **3** | 2-4 min | 10 min | ASSAY — Find signal | What matters for THIS person? |
| **4** | 2-3 min | 10 min | CRUCIBLE — Test ideas | What breaks? War-game scenarios |
| **5** | 1-2 min | 5 min | AUDITOR — Quality check | Gaps? Confidence ≥8? |
| **6** | 2-3 min | 10 min | PLAN — Give clarity | Here's what you should do. Why. |
| **7** | 1-2 min | 5 min | VERIFY — Export | Create GitHub issue + offer Crucible audio |
| **7b** | — | 1-3 hrs | AUTORESEARCH (optional) | Validate reasoning with real data (async, background) |

**Typical session:** <15 minutes. Most decisions don't need 60+ minutes.
**Maximum session:** 30-60 minutes for complex strategic decisions (rare).
**The value is DEPTH per minute, not duration.** A 7-minute session that pushes past confirmation bias beats a 90-minute meander.

**Pause-heavy model:** Users will PAUSE every ~3 minutes. The AI provides information, humans discuss between themselves, then resume. Pause is a FIRST-CLASS feature.

---

## User Flows

### Flow 1: MVP User (Link-Based, Single Session)

```
1. User receives unique link: https://thinkingfoundry.app/s/abc123def456
   ↓
2. Click link → Browser/app opens, auto-requests audio permission
   ↓
3. Grant audio permission
   ↓
4. Server creates:
   - Supabase session record (sessionId, timestamp, status)
   - GitHub issue: "[SESSION] Problem Name — Phase 0" (working document)
   ↓
5. [PHASE 0-7] Real-time session with AI
   - User speaks → captured + transcribed
   - Insights appear on screen in real-time (key points, not verbatim)
   - Supabase buffers real-time writes (every utterance, <50ms)
   - GitHub issue updated every 2-3 min with coalesced notes
   - User hits PAUSE → humans discuss → resume
   - User can interrupt anytime (natural barge-in)
   ↓
6. AI signals phase transition + THE SQUEEZE runs:
   "Before we move on — what did we assume? What did we miss?
    Confidence: 7/10. Ready for Phase 1?"
   ↓
7. Phase carry-forward: ONE synthesized document moves to next phase
   - Previous phase's GitHub issue finalized
   - New GitHub issue created for next phase
   - Carry-forward doc injected as context
   ↓
8. Session completes (all 8 phases or user stops)
   ↓
9. AI offers NotebookLM Crucible audio:
   "Want me to create a 10-minute audio debate of your decision?
    You can listen while walking the dog."
   → If yes: Teng API wrapper generates debate audio
   → Audio file linked to session's GitHub issue
   ↓
10. Client shows: "Session complete! ✅ [GitHub Issues] • [Audio link]"
   ↓
11. User can:
    - Share GitHub issues (one per phase)
    - Listen to Crucible audio
    - Export to Drive (optional forward-sync)
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
│  SupabaseBuffer (Real-Time Scratchpad)              │
│    ├─ Write every utterance (<50ms, no rate limit)  │
│    ├─ Buffer coalesces notes for GitHub flush       │
│    ├─ Session metadata (status, phase, timestamps)  │
│    └─ Survives server restart (durable)             │
│                                                     │
│  GitHubPersistence (Source of Truth)                │
│    ├─ Create issue per phase (working document)     │
│    ├─ Batch-flush from Supabase every 2-3 min      │
│    ├─ Phase carry-forward doc as issue comment      │
│    └─ Tag by phase + session labels                 │
│                                                     │
│  PhaseTransitionHandler                             │
│    ├─ Detect AI's phase end signal                  │
│    ├─ Run The Squeeze (self-check before advancing) │
│    ├─ Finalize current phase's GitHub issue         │
│    ├─ Create new phase issue + inject carry-forward │
│    └─ Send phase_change message to client           │
│                                                     │
│  FrameworkFetcher (JIT Tool Use)                    │
│    ├─ fetch_framework(name) → returns content       │
│    ├─ 8 frameworks as discrete tools (not stuffed)  │
│    ├─ Called by Gemini when conversation needs it    │
│    └─ Stoicism embedded in system prompt always     │
│                                                     │
│  CrucibleAudioGenerator (End-of-Session, Optional)  │
│    ├─ Collect session findings from GitHub issues    │
│    ├─ Generate via teng-lin/notebooklm-py           │
│    ├─ ~10-22 min podcast-style debate               │
│    └─ Link audio file to session's GitHub issue     │
│                                                     │
└─────────────────────────────────────────────────────┘
         ↓ APIs ↓
┌─────────────────────────────────────────────────────┐
│   External Services                                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Gemini 3.1 Flash Live API (bidirectional audio)    │
│  GitHub REST API (issue CRUD — source of truth)     │
│  Supabase (real-time buffer, session metadata)      │
│  NotebookLM API via teng-lin/notebooklm-py          │
│  Google Drive API (optional export, not primary)    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Data Storage Model — GitHub-First, Supabase-Buffered

**The critical architectural decision (v4.0):** GitHub Issues are the source of truth. Supabase buffers real-time writes. Drive is an optional export layer.

### Why GitHub Issues, Not Drive

1. **GitHub Issues are structured** — labels, milestones, comments, cross-references
2. **AI can read them** — `gh issue view` works from any session, any tool
3. **They're the scratchpad AND the archive** — working document during session, permanent record after
4. **Cross-referencing is free** — `#12 relates to #47` just works
5. **One carry-forward document per phase** — clean, not folder sprawl

### The Three Layers

```
Layer 1: Supabase (speed — real-time scratchpad)
  - Every utterance written in <50ms
  - No rate limits for single-user writes
  - Session metadata, timestamps, phase state
  - Survives server restart
  - THE place for real-time data during voice session

Layer 2: GitHub Issues (durability — source of truth)
  - ONE issue per phase (the working document)
  - Batch-flushed from Supabase every 2-3 min
  - At phase end: finalized with carry-forward summary
  - Carry-forward = the ONE document that moves to next phase
  - Permanent record — searchable, cross-referenceable

Layer 3: Google Drive (optional — human-readable export)
  - Forward-sync from GitHub issues at session end
  - Organized by phase for easy reading
  - NOT written to during session
  - User can opt out entirely
```

### Write Pattern (Buffer + Periodic Flush)

```
Session starts (t=0)
  ↓
1. Supabase: Create session record (sessionId, status: "in_progress")
2. GitHub: Create issue "[SESSION] Problem Name — Phase 0"
3. Gemini connects, server enters Phase 0

Every AI response:
  ├─ Supabase: Append utterance (speaker, text, timestamp) — <50ms
  ├─ Client: Send outline_item for real-time display
  └─ Buffer: Accumulate notes for next GitHub flush

Every 2-3 minutes (or natural pause):
  ├─ GitHub: Update current phase issue body with coalesced notes
  └─ Buffer: Reset

AI signals phase end → THE SQUEEZE runs:
  ├─ AI asks: "What did we assume? Confidence? Ready to move?"
  ├─ GitHub: Finalize current phase issue (add carry-forward summary)
  ├─ GitHub: Create new issue for next phase
  ├─ Supabase: Update phase state
  ├─ Client: Send phase_change message
  └─ Gemini: Inject next phase prompt + carry-forward context

Session complete:
  ├─ GitHub: Finalize last phase issue
  ├─ Supabase: Update session (status: "completed")
  ├─ Optional: Generate Crucible audio via teng-lin/notebooklm-py
  ├─ Optional: Forward-sync to Drive
  ├─ Client: Send export_complete with issue URLs
  └─ Close WebSocket
```

### What Gets Written Where

| Data | Destination | Frequency | Format |
|------|-------------|-----------|--------|
| Every utterance | Supabase (buffer) | Real-time (<50ms) | JSON row |
| Phase working doc | GitHub Issue (body) | Every 2-3 min | Markdown |
| Carry-forward summary | GitHub Issue (comment) | At phase end | Markdown |
| Session metadata | Supabase | On phase transitions | JSON |
| Crucible audio | Linked to GitHub issue | End of session (optional) | Audio file |
| Human-readable export | Google Drive | End of session (optional) | Markdown |

### Supabase Schema (MVP)

```sql
-- Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'idle', -- idle, in_progress, paused, completed
  current_phase INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  github_issues JSONB DEFAULT '[]', -- array of {phase, issue_number, issue_url}
  crucible_audio_url TEXT
);

-- Utterances (real-time buffer)
CREATE TABLE utterances (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  phase INTEGER NOT NULL,
  speaker TEXT NOT NULL, -- 'user' or 'ai'
  text TEXT NOT NULL,
  is_key_point BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Phase carry-forwards
CREATE TABLE phase_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id),
  phase INTEGER NOT NULL,
  carry_forward TEXT NOT NULL, -- the ONE document that moves forward
  confidence INTEGER, -- from The Squeeze
  github_issue_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, phase)
);
```

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

### Backend → Supabase: Real-Time Buffer

```
Per AI response (every utterance):
  INSERT INTO utterances (session_id, phase, speaker, text, is_key_point)
  VALUES ($sessionId, $phase, 'ai', $text, $isKeyPoint)
  -- <50ms, no rate limit concerns
```

### Backend → GitHub: Batch Flush (Every 2-3 min)

```
# Update current phase issue body with coalesced notes
PATCH /repos/{owner}/{repo}/issues/{issueNumber}
{
  "body": "# Phase 1: MINE\n\n## Key Points\n- ...\n\n## Raw Notes\n- ..."
}

# At phase end: add carry-forward summary as comment
POST /repos/{owner}/{repo}/issues/{issueNumber}/comments
{
  "body": "## Carry-Forward to Phase 2\n\n[ONE synthesized document]"
}

# New phase: create new issue
POST /repos/{owner}/{repo}/issues
{
  "title": "[SESSION abc123] Phase 2: SCOUT",
  "body": "## Context (from Phase 1)\n[carry-forward]\n\n## Phase 2 Notes\n...",
  "labels": ["session", "phase:scout"]
}
```

### Backend → NotebookLM: Crucible Audio (Session End, Optional)

```python
# Via teng-lin/notebooklm-py (NOT CIC — this is non-negotiable)
from notebooklm import NotebookLM

client = NotebookLM()
notebook = await client.create_notebook("Session: Problem Name")
# Upload all phase carry-forward summaries as sources
for phase_summary in phase_summaries:
    await notebook.add_source(phase_summary)
# Generate debate audio
audio = await notebook.generate_audio(format="debate")
# Link to GitHub issue
```

**Post-MVP (DEFERRED):** PIN + SMS authentication (Revolut-style), team sharing, dual-AI adversarial mode.

---

## Knowledge System (MVP — Tool-Use Architecture)

**Stoicism is embedded in the system prompt as the through-line. Everything else is fetched JIT via tool use.**

### System Prompt (~2000 tokens)

The system prompt contains:
- The Thinking Foundry identity and phase structure
- Stoicism as the decision-making backbone ("What's in your control?")
- Brief 1-sentence descriptions of all 8 frameworks
- Instructions to fetch framework details via tools when needed
- "Questions with information, not empty questions" principle

### Framework Tools (JIT Fetching)

Each framework is a discrete tool that Gemini calls when the conversation needs it:

```
fetch_framework("hormozi")     → Returns Hormozi pricing/scaling/offers content
fetch_framework("yc")          → Returns YC PMF/growth/fundraising content
fetch_framework("ideo")        → Returns IDEO design thinking content
fetch_framework("mckinsey")    → Returns McKinsey strategy/data-driven content
fetch_framework("lean")        → Returns Lean MVP/validated learning content
fetch_framework("stoicism")    → Returns deeper Stoic principles (beyond system prompt)
fetch_framework("nate-b-jones") → Returns Thinking Stack, mental models, decision quality
fetch_framework("indydev-dan") → Returns development methodology, AI patterns
```

**Why tool use, not context stuffing:**
- System prompt stays small (~2000 tokens vs ~30K if all frameworks embedded)
- Context window stays clean for the actual conversation
- Only relevant frameworks are loaded — a pricing discussion pulls Hormozi, not IDEO
- Follows Anthropic's tool_use architecture (proven pattern)
- Frameworks are maintained as discrete files, easy to update independently

### How Frameworks Enter the Conversation

The AI doesn't lecture. It uses frameworks naturally WITH information:

- "Hormozi would say your offer needs to be so good people feel stupid saying no. Right now your pricing is cost-plus — what if we flipped to value-based? His Grand Slam Offer framework suggests..."
- "A stoic would ask: what here is actually in your control? The market response isn't. But the product quality is. Let's focus there."
- "Nate B. Jones has this Decision Quality Framework — Type 1 decisions are reversible, Type 2 aren't. This feels like a Type 1. Should we just try it?"

**Key principle:** Questions come WITH information. Not "What do you think about pricing?" but "Hormozi says X about pricing. Does that apply to your situation, given your constraint of Y?"

### Knowledge Base (Supabase Semantic Search)

Frameworks are chunked and stored in Supabase with semantic search:
- 8 frameworks, ~80 chunks total
- Constraint-matched queries (budget + timeline + domain → relevant chunks)
- Used during AutoResearch phase for deeper validation
- See `chunk-frameworks.js` and `supabase-schema.sql` for implementation

---

## Per-Phase Prompts

Each phase has a custom prompt for Gemini Live. Designed for <15 min typical sessions with frequent pauses. The AI is sharp, dense, and moves at the speed of genuine thinking.

**Constitution preamble (prepended to ALL phase prompts, ~500 tokens):**
```
You are The Thinking Foundry — a structured thinking partner for high-stakes decisions.

CORE RULES:
- You LEAD. You don't wait. You drive the conversation.
- Questions WITH information. Never "What do you think?" — always "X suggests Y. Does that fit your situation?"
- 2-3 sentences max, then a question. Like a sharp co-founder.
- Stoicism is your backbone: What's in their control? What's the worst case? What would a wise person do?
- Resist premature closure. Push one more round even when it feels done.
- When you need framework depth, call fetch_framework(name).
- Pause is normal. Users discuss between themselves. Pick up naturally when they resume.
- You decide phase transitions. Not the user. Not a timer.

PHASES: User Stories → MINE → SCOUT → ASSAY → CRUCIBLE → AUDITOR → PLAN → VERIFY
Between each phase, run The Squeeze: "What did we assume? What did we miss? Confidence?"
```

### Phase 0: User Stories (~1-2 min)

```
[Constitution preamble]

PHASE 0: Get clarity on what they want. Fast.

Ask naturally — not as a checklist:
- What's the actual problem? (not the symptom)
- What would success look like?
- What constraints are real? (time, budget, team)
- What's in their control vs. not?

Your job: Clarity, not advice. Keep asking "what else?" until you understand.
Move to Phase 1 when you can state the problem in one sentence.

Be warm, curious, direct. Not robotic.
```

### Phase 1: MINE (~2-3 min)

```
[Constitution preamble]

PHASE 1: Find the root cause. Go deeper than the surface.

- Ask "why" 3+ times. Get to root cause.
- Challenge gently: "What if that's not true?"
- Reflect back: "So the real issue is [X], not [Y]."
- Ground in stoicism: What's actually in their control here?

Never give solutions. Just understand.
Move to Phase 2 when you can articulate the ROOT problem, not the symptom.
```

### Phase 2: SCOUT (~3-5 min)

```
[Constitution preamble]

PHASE 2: Open the possibility space WIDE. No judgment yet.

Generate 5-7 directions (not 10 — session is focused):
- Include 1-2 unconventional/wild ideas
- Fetch relevant frameworks: fetch_framework("ideo") for empathy, fetch_framework("hormozi") for business
- Bring examples from adjacent domains
- "What if the opposite were true?"

MAX possibilities, not evaluation. Resist narrowing.
Move to Phase 3 when the user has reacted to enough options.
```

### Phase 3: ASSAY (~2-4 min)

```
[Constitution preamble]

PHASE 3: Filter to THIS person. Not what works for most — what works for THEM.

Given their constraints (stated in Phase 0):
- Which directions actually fit? Challenge the ones that don't.
- "This one conflicts with your budget constraint. Still interested?"
- Narrow to 2-3 viable paths with specific reasons.

Person-specific, not generic. Fetch frameworks to support: fetch_framework("mckinsey") for structured analysis.
Move to Phase 4 when 2-3 clear paths remain.
```

### Phase 4: CRUCIBLE (~2-3 min)

```
[Constitution preamble]

PHASE 4: Stress-test. What breaks?

For each remaining path:
- "What's the worst case? What would you do?"
- Test hidden assumptions. What are you betting on?
- Look for what you're NOT seeing.
- Fetch frameworks: fetch_framework("nate-b-jones") for decision quality, Type 1 vs Type 2.

Challenge your OWN recommendation. If you can't find a counter-argument, you haven't looked hard enough.
Move to Phase 5 when confidence is measurable, not vague.
```

### Phase 5: AUDITOR (~1-2 min)

```
[Constitution preamble]

PHASE 5: Quality check. Be honest.

- Did we miss anything?
- Are there logical gaps?
- Did we actually answer the ORIGINAL problem from Phase 0?
- Confidence: ≥8? If not, what's missing?

If something feels off, say so. Don't approve mediocre thinking.
Move to Phase 6 if confidence ≥8. Loop back if not.
```

### Phase 6: PLAN (~2-3 min)

```
[Constitution preamble]

PHASE 6: Give clear, specific answers. No ambiguity.

1. FIRST action (specific, not vague) + why + success metric + fallback
2. SECOND action (if applicable)
3. Timeline (realistic, tied to their constraints)

They leave with CLARITY. Not "things to think about" — things to DO.
Move to Phase 7 when the plan is actionable.
```

### Phase 7: VERIFY (~1-2 min)

```
[Constitution preamble]

PHASE 7: Document and offer Crucible audio.

- Summarize the thinking journey (3-5 bullet points)
- State the decision and confidence score
- Create GitHub issue with findings
- Offer: "Want me to create a 10-minute audio debate of your decision? You can listen while walking."

If they want the Crucible audio: collect all phase carry-forwards for NotebookLM generation.
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
- [ ] **All 8 phases execute:** Full session with all phases (typical <15 min)
- [ ] **Phase transitions:** AI signals phase end, UI updates, new folder created
- [ ] **Drive writes:** Check Drive folder after each phase — notes.md updated
- [ ] **Session end:** GitHub issue created with full transcript + correct labels
- [ ] **Export URLs:** Client receives both GitHub + Drive URLs at end

### Persistence Tests (Supabase + GitHub)
- [ ] Supabase utterance rows created in real-time (<50ms)
- [ ] GitHub issue created per phase with coalesced notes
- [ ] Batch flush to GitHub every 2-3 min (not per-utterance)
- [ ] Phase carry-forward summary in GitHub issue comment
- [ ] The Squeeze runs at every phase transition
- [ ] Session metadata in Supabase reflects phases covered
- [ ] Optional Drive export works at session end

### Pause & Interaction Tests
- [ ] Pause button stops audio capture immediately
- [ ] AI acknowledges resume gracefully ("Where were we?")
- [ ] Multiple rapid pause/resume cycles don't break state
- [ ] Pause duration doesn't count toward session time
- [ ] Context is preserved across long pauses (5+ minutes)

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
- [ ] No audio dropouts in 30-min session
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
| **GitHub Persistence** | 100% | Every phase creates a GitHub issue |
| **Supabase Buffer** | 100% | Every utterance buffered in real-time |
| **Outline Display** | 100% | Real-time insights appear on screen |
| **AI Response Latency** | <500ms | First response <500ms consistently |
| **Barge-In Success** | 100% | Interruption works every time |
| **User Clarity** | 8+/10 | Post-session assessment |
| **Session Duration** | <15 min typical | Full 8 phases, depth over duration |
| **Mobile Experience** | Fully Functional | No degradation on Safari/Chrome mobile |

---

## Build Plan (MVP — Autonomous, 20-25 DUs)

**Assumption:** PoC validated voice + Gemini Live works. Now building real MVP architecture.

### Phase 1: Data Layer (Supabase + GitHub)
**DUs: 5-6**

- [ ] Supabase schema (sessions, utterances, phase_summaries tables)
- [ ] SupabaseBuffer class (real-time writes, batch flush)
- [ ] GitHubPersistence class (issue CRUD per phase, carry-forward)
- [ ] The Squeeze logic (confidence check at phase transitions)
- [ ] Optional Drive export at session end

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

### Phase 4: Phase Transitions + Framework Tool Use
**DUs: 3-4**

- [ ] Phase transition detection (AI signals readiness)
- [ ] The Squeeze at every transition (confidence check)
- [ ] Carry-forward document creation (GitHub issue comment)
- [ ] phase_transition WebSocket message
- [ ] Phase prompt injection to Gemini
- [ ] FrameworkFetcher (8 tool definitions for JIT framework loading)

### Phase 5: Session End + Crucible Audio
**DUs: 2-3**

- [ ] Finalize all phase GitHub issues
- [ ] Offer NotebookLM Crucible audio generation (teng-lin/notebooklm-py)
- [ ] Generate ~10-22 min debate audio from session findings
- [ ] Link audio to session's GitHub issues
- [ ] Optional Drive export (forward-sync from GitHub)

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

## Appendix: Architecture Evolution

### v3.0 → v4.0 Changes (2026-03-30)

| Aspect | v3.0 (Drive-First) | v4.0 (GitHub-First) |
|--------|-----|-----|
| **Storage SOT** | Google Drive | GitHub Issues |
| **Real-time buffer** | Drive API writes | Supabase (<50ms) |
| **Phase documents** | Drive folders/notes.md | GitHub issue per phase |
| **Carry-forward** | Implicit (folder hierarchy) | Explicit (one summary per phase) |
| **Framework loading** | Baked into system prompt | JIT via tool_use (Stoicism embedded, rest on-demand) |
| **Session duration** | 60-120 min | <15 min typical |
| **Interaction model** | Continuous conversation | Pause-heavy (AI speaks → humans discuss → resume) |
| **Audio output** | Not specified | NotebookLM Crucible via teng-lin/notebooklm-py |
| **Drive role** | Primary database | Optional export |
| **Supabase role** | Eliminated | Real-time buffer + session metadata |
| **Phase gates** | None specified | The Squeeze at every transition |

### v1.0 → v2.0 (POC → Architecture)

| Aspect | POC | v2.0 |
|--------|-----|-----|
| **Auth** | Not specified | Link-based |
| **Phase Transitions** | Manual button | AI-driven |
| **Backend** | Railway / Vercel | Node.js + Express + WebSocket |

### Why v4.0 Works

1. **GitHub Issues are the thinking documents** — durable, structured, cross-referenceable
2. **Supabase is fast** — <50ms writes, no rate limits, survives server restart
3. **Batch flush to GitHub** — respects GitHub API limits (5000 req/hr) while staying current
4. **One carry-forward per phase** — clean mental model, no folder sprawl
5. **Tool-use frameworks** — small system prompt, rich knowledge on demand
6. **Pause-heavy model** — the AI is a conversation partner, not a lecture
7. **Cost effective:** ~$0.35 Gemini (15 min session) + ~$0 GitHub/Supabase (free tier)

### Decision Rationale

Full rationale documented in: growthpigs/thinking-foundry#16

---

## Research Complete

✅ **Gemini Live API:** $0.005/min input, $0.018/min output = ~$0.35/session (15 min)
✅ **GitHub API:** 5,000 req/hour — batch flush pattern stays well within limits
✅ **Supabase:** Free tier handles single-user real-time writes easily
✅ **NotebookLM API:** teng-lin/notebooklm-py documented in NOTEBOOKLM-GUIDE.md
✅ **Interruption (Barge-in):** Built-in to Gemini Live, zero extra code
✅ **Tool Use:** Gemini supports function calling for framework JIT fetching

---

**Document Status:** READY FOR AUTONOMOUS BUILD (v4.0)

**Scope:** 20-25 DUs (4-5 weeks)

**Next Step:** Build MVP against this FSD. Validate with 3+ test sessions.

**Decision trail:** growthpigs/thinking-foundry#16, growthpigs/thinking-foundry-vault#1

---

*FSD v4.0 is the complete specification for The Thinking Foundry MVP. Supersedes v3.0 (Drive-first). Autonomous build follows this spec precisely. No deviations without explicit approval.*
