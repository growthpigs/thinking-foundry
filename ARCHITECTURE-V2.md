# The Thinking Foundry — Architecture v2 (Final)

**Status:** Ready to Build
**Date:** 2026-03-28
**DU Estimate:** 12-15 (3 weeks)

---

## The Vision

A voice-first, mobile-friendly thinking partner that **leads** people through 8 phases of structured thinking. The AI is the co-founder in the room — it drives the conversation, challenges assumptions, manages phase transitions, and keeps responses short and sharp. Free to use. Open to everyone.

**The AI leads. The human thinks. Together they find clarity.**

---

## What Changed (vs v1)

| Aspect | v1 | v2 | Why |
|--------|----|----|-----|
| **Payment** | Stripe ($500/session) | Free/Open | Make it accessible, focus on thinking quality |
| **Auth** | GitHub OAuth | Link-based (MVP). PIN+SMS (post-MVP) | Zero friction — click a link, start thinking |
| **Backend** | Cloudflare Workers | Cloudflare Workers | ✓ Same (it's right) |
| **Voice** | Gemini Live | Gemini Live (your Ultra) | ✓ Same (use what you have) |
| **Storage** | GitHub Issues only | GitHub (backend) + Drive (frontend) | Users understand Drive, not GitHub |
| **Organization** | Single GitHub issue | Phase-based folders (Drive) | Can drill into MINE/SCOUT/ASSAY/etc. |
| **Plugins** | Fixed frameworks | Base knowledge (MVP). Dynamic plugins (post-MVP) | Stoicism + IDEO + McKinsey baked in. Satellite fetch later. |
| **Frontend** | Web only | Mobile-first (Vercel) | Users are on phones |

---

## Complete Architecture

### Frontend (React + Web Audio API — Vercel)

```
User Journey:
1. User clicks link from Roderic (e.g., thinkingfoundry.app/s/abc123)
2. Session starts immediately — AI says "Tell me what's on your mind."
3. AI LEADS the conversation through 8 phases (60-120 min)
4. User can interrupt anytime (natural barge-in)
5. Session transcribed in real-time (visible on screen)
6. Session ends → Drive folder with phase-by-phase thinking
7. User can open any phase folder and read the Google Doc
```

**Components:**
- `ThinkingSession` (audio capture + real-time transcript + phase display)
- `PhaseIndicator` (which phase? AI decides transitions)
- `DriveExplorer` (browse MINE/SCOUT/ASSAY/CRUCIBLE/AUDITOR/PLAN/VERIFY folders)
- `SessionReconnector` (handles 15-min Gemini session limit transparently)

**Hosted on:** Vercel (auto-deploy, global CDN)

### Backend (Cloudflare Workers)

```
Receives audio → Routes to Gemini → Returns transcripts → Creates GitHub issues + Drive folders

Key Services:
- AuthHandler (PIN + SMS)
- SessionRouter (audio ↔ Gemini)
- PluginSystem (fetch relevant frameworks)
- GitHubExporter (create issues)
- GoogleDriveManager (create folders + docs)
```

**Hosted on:** Cloudflare Workers (serverless, instant scale)

### Storage Architecture

**GitHub (Source of Truth — Backend)**
```
growthpigs/thinking-foundry-sessions/

Issue per session:
- Title: "Session: [Problem Type] — 2026-03-28"
- Body: Full transcript + thinking
- Labels: ["session", "MINE", "SCOUT", "ASSAY", ...]
- Links to previous session (follow-ups)
```

**Google Drive (User Interface — Frontend)**
```
user@example.com/thinking-foundry-[session-id]/
├── MINE/
│   └── Transcription of listening & understanding
├── SCOUT/
│   └── Possibilities generated
├── ASSAY/
│   └── What matters for THIS person
├── CRUCIBLE/
│   └── Risk testing
├── AUDITOR/
│   └── Quality check + confidence
├── PLAN/
│   └── Clear answers + next steps
└── VERIFY/
    └── Full session transcript

User can open any folder, read the Google Doc, understand their thinking journey.
```

### Authentication

**MVP: Link-Based Access (Zero Friction)**
```
1. Roderic generates unique link per user
2. User clicks link → session starts immediately
3. No login. No account. No password. No PIN.
4. Link can be single-use or multi-use (configurable)
```

**Why This Works for MVP:**
- Zero barrier to entry (click and go)
- Roderic controls access (who gets a link)
- No auth system to build or maintain
- Can always add PIN + SMS later (feature flag)
- First 2 months don't need formal auth

**Post-MVP: PIN + SMS (DEFERRED)**
See issue #10 for full PIN auth design.
When ready, existing link users migrate to PIN accounts.

### Voice & Thinking (8 Phases — Mirrors The Foundry)

**This is The Foundry, adapted for thinking instead of coding.**

| Phase | Foundry (Code) | Thinking Foundry (Thinking) | Future Tool Integration |
|-------|---------------|---------------------------|----------------------|
| **0** | User Stories | User Stories (same!) | — |
| **1** | MINE | MINE — Deep listening | — |
| **2** | SCOUT | SCOUT — Explore possibilities | — |
| **3** | ASSAY | ASSAY — Signal from noise | — |
| **4** | CRUCIBLE | CRUCIBLE — Stress-test ideas | **NotebookLM** (multi-source synthesis) |
| **5** | AUDITOR | AUDITOR — Quality check | — |
| **6** | PLAN | PLAN — Clear answers | — |
| **7** | VERIFY | VERIFY — Export & document | — |

**NotebookLM integration (post-MVP):** During Phase 4 (CRUCIBLE), feed the user's problem + possibilities into NotebookLM with relevant sources. Get a synthesized analysis. This mirrors the original Foundry's Crucible where you test ideas against multiple sources.

**Total: 60-120 minutes (4-8 Gemini reconnections)**

### Knowledge System

**MVP: Base Knowledge (Baked into System Prompt)**

The AI guide has deep knowledge of these frameworks built into its prompts:

- **Stoicism** — Foundation for all phases. What's in control? Accept constraints. Virtue in thinking.
- **IDEO Design Thinking** — Empathize, ideate without judgment, prototype to learn.
- **McKinsey Problem Structuring** — Decompose, prioritize, communicate.
- **First Principles** — Strip to fundamentals, rebuild from base truths.
- **The Foundry Methodology** — Spec before build, verify at each gate, user stories anchor everything.
- **Nate B. Jones / Generalist Advantage** — Cross-domain pattern recognition.

The AI uses these naturally in conversation, doesn't lecture.

**Post-MVP: Dynamic Satellite Plugins (DEFERRED)**
See issue #12. Will add web search, framework fetching, domain detection.

---

## Implementation Phases

### Week 1: Engine (Voice + Reconnection)

**The hardest part first. Prove the core works.**

**Days 1-2: Gemini Live POC**
- [ ] Google Cloud project + billing enabled
- [ ] Gemini Live API connection (basic "hello world" voice)
- [ ] **15-minute reconnection POC** — prove we can seamlessly reconnect
- [ ] Test context preservation across reconnections
- [ ] Test barge-in works after reconnection

**Days 3-5: Backend Foundation**
- [ ] Cloudflare Workers + Durable Objects project
- [ ] WebSocket server (audio routing to/from Gemini)
- [ ] Session state machine (Phase 0 → Phase 7)
- [ ] Reconnection manager (auto-reconnect at 14 min)
- [ ] Link-based access (generate unique URLs, validate on connect)

### Week 2: Interface + AI Personality

**Days 6-8: Frontend**
- [ ] React app on Vercel
- [ ] Audio capture (Web Audio API)
- [ ] Real-time transcription display
- [ ] Phase indicator (which phase? AI decides transitions)
- [ ] Mobile responsive (test on phone)
- [ ] Simple, clean UI — voice-first, minimal chrome

**Days 9-10: AI as Leader**
- [ ] Per-phase system prompts (all 8 phases, refined)
- [ ] AI personality: short responses, asks questions, drives conversation
- [ ] Phase transition logic (AI signals when to move, backend transitions)
- [ ] Base knowledge injection (Stoicism, IDEO, McKinsey in system prompt)
- [ ] Test full 60-min session (3-4 reconnections)

### Week 3: Storage + Polish

**Days 11-12: Google Drive + GitHub**
- [ ] Google Drive API: Create user folder on session start
- [ ] Create 7 phase subfolders (MINE/SCOUT/ASSAY/etc.)
- [ ] Create Google Doc per phase with formatted content
- [ ] GitHub issue creation (full session transcript)
- [ ] Test Drive folder structure is clear and useful

**Days 13-15: Polish & Launch**
- [ ] Error handling (network drops, Gemini timeout, Drive failures)
- [ ] E2E testing (real 60-min session, start to end)
- [ ] Monitoring (Sentry for errors, basic latency tracking)
- [ ] Production deploy (Vercel + Cloudflare)
- [ ] Go/No-Go decision

### DU Breakdown (Realistic)

| Component | DUs | Notes |
|-----------|-----|-------|
| Gemini Live + reconnection | 4 | Hardest part. POC first. |
| Cloudflare backend + state | 3 | Durable Objects for WebSocket |
| React frontend + audio | 3 | Simple UI, voice-first |
| AI personality + prompts | 2 | Per-phase prompts, leadership behavior |
| Google Drive integration | 2 | Folder creation, Doc per phase |
| GitHub export | 1 | Well-researched, simple |
| Testing + error handling | 2 | E2E, reconnection, network drops |
| **Total** | **17** | **~3.5 weeks** |

---

## Tech Stack (Final)

| Component | Technology | Why |
|-----------|-----------|-----|
| **Frontend** | React + Web Audio API | Simple, proven, mobile-friendly |
| **Frontend Host** | Vercel | Auto-deploy, global CDN, free tier |
| **Backend** | Cloudflare Workers | Serverless, instant scale, WebSocket native |
| **Backend Communication** | WebSocket | Real-time audio streaming |
| **Voice Engine** | Gemini 3.1 Flash Live | Google Cloud billing, $0.023/min |
| **Transcription** | Gemini Live (automatic) | Included, no extra API |
| **Issue Storage** | GitHub REST API | Free, transparent, link-friendly |
| **User Storage** | Google Drive + Docs | Familiar UI, shareable, web search indexable |
| **Authentication** | Link-based access (MVP) | Zero friction. PIN+SMS deferred. |
| **Monitoring** | Sentry | Error tracking, free tier |

---

## Costs

| Service | Cost | Per Session |
|---------|------|------------|
| **Gemini Live** | $0.005 input + $0.018 output | ~$1.38 |
| **GitHub API** | Free tier (5K req/hr) | ~$0.01 |
| **Google Drive** | Free tier (15GB) | $0 |
| **Cloudflare Workers** | Free tier (100K req/day) | ~$0.01 |
| **Vercel** | Free tier | $0 |
| **Total** | | **~$1.40/session** |

**Revenue Model:** Free to use. Option for paid tier later ($500/month for premium features, analytics, team access).

---

## Success Criteria

- [ ] User clicks link → session starts in <5 seconds
- [ ] AI leads the conversation (user doesn't have to know what to ask)
- [ ] 15-minute reconnection is invisible to user
- [ ] Full 60-min session completes without crash
- [ ] User clarity ≥8/10 (post-session)
- [ ] Drive folder organized by phase (user can browse and understand)
- [ ] AI keeps responses SHORT (2-3 sentences + a question, like a co-founder)
- [ ] Latency <800ms for AI responses (research-validated)
- [ ] Interruption works naturally (barge-in never fails)
- [ ] Mobile experience is smooth

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **15-min reconnection fails** | Session breaks mid-conversation | POC in Week 1 Day 1-2. If fails, evaluate alternatives. |
| **Context lost on reconnection** | AI forgets what was discussed | Condensed transcript injection + test across 4 reconnections |
| **Google Cloud billing suspended** | Can't access Gemini or Drive APIs | Roderic resolves billing (confirmed can pay) |
| **Google Drive OAuth complexity** | Users need Google auth on top of link access | Use service account Drive (shared), OR defer Drive to post-MVP |
| **AI gives long responses** | Feels like lecture, not co-founder | Enforce 2-3 sentence limit in system prompt + testing |
| **Mobile audio issues** | iOS Safari Web Audio quirks | Test on iPhone + Android in Week 2 |
| **Gemini API rate limit** | Concurrent sessions fail | Low risk for MVP (few users). Queue if needed. |

---

## Go/No-Go Decision Points

**After Week 1:**
- PIN auth working? → **GO** (proceed Week 2)
- Gemini Live latency acceptable? → **GO** (proceed Week 2)
- If either fails → **NO-GO** (rethink approach)

**After Week 2:**
- Plugin system working? → **GO** (proceed Week 3)
- Drive organization clear? → **GO** (proceed Week 3)
- Mobile experience smooth? → **GO** (proceed Week 3)

**After Week 3:**
- E2E test successful? → **GO-LIVE** 🚀
- Otherwise → **DELAY** (fix issues, retest)

---

## Deployment Checklist

### Pre-Production
- [ ] All code reviewed
- [ ] All tests passing
- [ ] Error handling for edge cases
- [ ] Monitoring configured (Sentry)
- [ ] Backup plan if Gemini fails
- [ ] Data retention policy (Drive cleanup)

### Production
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Cloudflare
- [ ] GitHub API credentials secured
- [ ] Google Drive API credentials secured
- [ ] SMS provider configured
- [ ] Email monitoring active

### Post-Launch
- [ ] Monitor error rates
- [ ] Monitor session completion
- [ ] Monitor user clarity scores
- [ ] Iterate based on feedback

---

## What's Next

**Phase 2 of The Foundry (Building The Thinking Foundry):**

Now we apply Foundry methodology to build Foundry itself.

- **MINE:** Done (understood the problem)
- **SCOUT:** Done (explored all possibilities)
- **ASSAY:** Done (created this spec)
- **CRUCIBLE:** Week 1-3 (test as we build)
- **AUDITOR:** Week 3 (quality check)
- **PLAN:** Week 3 (go/no-go decision)
- **VERIFY:** Launch (real users vote with clarity)

---

**The Thinking Foundry is not software. It's how thinking happens, made repeatable and teachable.**

**Ready to build? Let's go.** 🚀
