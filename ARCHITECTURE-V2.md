# The Thinking Foundry — Architecture v2 (Final)

**Status:** Ready to Build
**Date:** 2026-03-28
**DU Estimate:** 12-15 (3 weeks)

---

## The Vision

A voice-first, mobile-friendly thinking partner that guides people through 8 phases of structured thinking. **Free to use, open to everyone, no payments required.**

---

## What Changed (vs v1)

| Aspect | v1 | v2 | Why |
|--------|----|----|-----|
| **Payment** | Stripe ($500/session) | Free/Open | Make it accessible, focus on thinking quality |
| **Auth** | GitHub OAuth | PIN (email → PIN → SMS) | Simpler UX, no GitHub required |
| **Backend** | Cloudflare Workers | Cloudflare Workers | ✓ Same (it's right) |
| **Voice** | Gemini Live | Gemini Live (your Ultra) | ✓ Same (use what you have) |
| **Storage** | GitHub Issues only | GitHub (backend) + Drive (frontend) | Users understand Drive, not GitHub |
| **Organization** | Single GitHub issue | Phase-based folders (Drive) | Can drill into MINE/SCOUT/ASSAY/etc. |
| **Plugins** | Fixed frameworks | Dynamic satellite services | Pull relevant knowledge on-the-fly |
| **Frontend** | Web only | Mobile-first (Vercel) | Users are on phones |

---

## Complete Architecture

### Frontend (React + Web Audio API — Vercel)

```
User Journey:
1. Land on app
2. Enter email
3. Create 6-digit PIN
4. Verify with SMS (4-digit code)
5. See their Google Drive folder
6. Click "Start Thinking Session"
7. Speak their problem
8. 60-120 min guided conversation
9. View results in Drive (organized by phase)
```

**Components:**
- `AuthFlow` (PIN creation + SMS verification)
- `ThinkingSession` (audio capture + real-time transcript)
- `DriveExplorer` (browse MINE/SCOUT/ASSAY folders)
- `PhaseIndicator` (which phase? time remaining?)
- `PluginStatus` (which frameworks loaded?)

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

### Authentication (PIN-Based)

**First Login:**
```
1. User enters email: user@example.com
2. Creates PIN: 123456 (something memorable)
3. System sends SMS: "Enter code: 4729"
4. User enters code
5. Account created, logged in
```

**Return Visit:**
```
1. User enters PIN: 123456
2. System sends SMS: "Enter code: 5847"
3. User enters code
4. Logged in (no email needed!)
```

**Why This Works:**
- No passwords (annoying)
- No 2FA (redundant with SMS)
- No GitHub account (barrier)
- Memorable PIN (not random token)
- Works on any device
- Simple copy/paste pattern

### Voice & Thinking (8 Phases)

**Same as always:**
- Phase 0: User Stories (anchor)
- Phase 1: MINE (listen)
- Phase 2: SCOUT (explore + plugins pull frameworks)
- Phase 3: ASSAY (filter to this person)
- Phase 4: CRUCIBLE (test)
- Phase 5: AUDITOR (quality check)
- Phase 6: PLAN (answers)
- Phase 7: VERIFY (export)

**Total: 60-120 minutes**

### Plugin System (Satellite Services)

**What It Does:**

During Phase 2 (SCOUT), the system identifies the user's domain and pulls relevant frameworks on-the-fly.

**Example:**
```
User: "I'm stuck on marketing my AI product to enterprises"

System:
1. Extracts keywords: [marketing, AI, enterprises]
2. Identifies domain: B2B SaaS
3. Queries web for:
   - Paul Graham on distribution
   - Enterprise GTM case studies
   - Product positioning frameworks
   - Articles on AI trust/compliance
4. Injects into AI prompt:
   "Here are 7 directions we could explore:
    1. ... (reference: Paul Graham)
    2. ... (reference: Enterprise GTM framework)
    3. ..."
```

**Base Knowledge (Always Available):**
- Stoicism (foundation)
- IDEO methodology (design)
- McKinsey methodology (business)
- 8-phase Foundry pipeline (structure)
- First principles (thinking)

**No extra cost — just web search + summarization**

---

## Implementation Phases

### Week 1: Foundation

**Days 1-3:**
- [ ] PIN auth system (email → PIN → SMS)
- [ ] Cloudflare Workers WebSocket server
- [ ] Gemini Live API integration
- [ ] Basic React frontend (just auth + button)

**Days 4-5:**
- [ ] Google Drive API setup (folder creation)
- [ ] GitHub API issue creation
- [ ] Test full flow end-to-end

### Week 2: Features

**Days 6-8:**
- [ ] Real-time transcription display
- [ ] Phase transitions + timer
- [ ] Google Drive folder organization (MINE/SCOUT/ASSAY/etc.)
- [ ] Google Docs creation per phase

**Days 9-10:**
- [ ] Plugin system (keyword extraction + web search)
- [ ] Phase 2 prompt injection (reference frameworks)
- [ ] Session state management

### Week 3: Polish & Launch

**Days 11-12:**
- [ ] Mobile responsiveness (test on phone)
- [ ] Error handling (network drops, timeouts)
- [ ] E2E testing (manual session from start to end)
- [ ] Monitoring (Sentry for errors)

**Days 13-15:**
- [ ] Production deploy (Vercel frontend + Cloudflare backend)
- [ ] Performance testing (latency, transcription lag)
- [ ] Go/No-Go decision
- [ ] Celebration! 🎉

---

## Tech Stack (Final)

| Component | Technology | Why |
|-----------|-----------|-----|
| **Frontend** | React + Web Audio API | Simple, proven, mobile-friendly |
| **Frontend Host** | Vercel | Auto-deploy, global CDN, free tier |
| **Backend** | Cloudflare Workers | Serverless, instant scale, WebSocket native |
| **Backend Communication** | WebSocket | Real-time audio streaming |
| **Voice Engine** | Gemini 3.1 Flash Live | Your Google Ultra account, $0.023/min |
| **Transcription** | Gemini Live (automatic) | Included, no extra API |
| **Issue Storage** | GitHub REST API | Free, transparent, link-friendly |
| **User Storage** | Google Drive + Docs | Familiar UI, shareable, web search indexable |
| **Authentication** | Email + PIN + SMS | Simple, no passwords, memorable |
| **SMS Provider** | Twilio/AWS SNS | Standard for verification codes |
| **Web Search** | Google Search API or free tier | For plugin system |
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
| **SMS** | ~$0.10 per code | $0.10 |
| **Web Search** | Free tier (100 req/day) | $0 |
| **Total** | | **~$1.50/session** |

**Revenue Model:** Free to use. Option for paid tier later (analytics, team features, etc.).

---

## Success Criteria

- [ ] 100% auth success rate (PIN creation works every time)
- [ ] User clarity ≥8/10 (post-session survey)
- [ ] Session completion ≥90% (no crashes)
- [ ] Drive folder organized by phase (user can browse)
- [ ] Plugins pull relevant frameworks (Phase 2)
- [ ] Mobile experience is smooth (90% of tests pass)
- [ ] Latency <500ms for AI responses
- [ ] Interruption works naturally (barge-in never fails)

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Google auth quota** | Can't access Drive | Cache permissions, handle gracefully |
| **Gemini API rate limit** | Concurrent sessions fail | Queue requests, graceful degradation |
| **SMS delivery slow** | Poor auth UX | Offer email verification fallback |
| **Plugin fetch fails** | Phase 2 has no references | Use cached frameworks + manual fallback |
| **Phone number blocked** | Can't verify | Allow email verification instead |

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
