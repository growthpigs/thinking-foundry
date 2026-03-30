# The Thinking Foundry — Project Context

**Type:** Voice-first SaaS product
**Status:** POC deployed (Railway), building toward MVP
**Repo:** growthpigs/thinking-foundry
**Deploy:** thinking-foundry-production.up.railway.app (Railway, auto-deploys from main)
**Started:** 2026-03-28

---

## TWO SYSTEMS, SEPARATE REPOS

**This repo contains THE THINKING FOUNDRY** (structured thinking for decision-making)

**A separate repo contains THE SOFTWARE FOUNDRY** (structured building from specifications)
- **Repo:** growthpigs/the-foundry
- **Purpose:** Build software from FSDs created by The Thinking Foundry
- **Phases:** LAUNCH → MINE → SCOUT → ASSAY → CRUCIBLE → EXTERNAL-AUDITOR → PLAN → HAMMER → TEMPER → RALPH-LOOP → POST-FOUNDRY
- **See:** [THE SOFTWARE FOUNDRY CLAUDE.md](https://github.com/growthpigs/the-foundry/blob/main/CLAUDE.md)

**They use similar phase structures but apply to different domains:**
- **Thinking Foundry** = "What should I build? What should I decide?"
- **Software Foundry** = "How do I build what I decided?"

---

## WHAT THIS IS

The Thinking Foundry is a **voice-first structured thinking product**. NOT a chatbot. NOT a therapy session. NOT a motivational tool.

It's an **IDEO-style consultation** delivered by AI — a co-founder in the room who drives you through 8 phases of structured thinking, from confusion to clarity.

**The AI LEADS. The human THINKS. Together they find clarity.**

### The 8 Phases (The Foundry Process)

| Phase | Name | Duration | What the AI Does |
|-------|------|----------|-----------------|
| 0 | User Stories | 5 min | Extract what success looks like — the founder IS the user |
| 1 | MINE | 10 min | Deep listening. 5 Whys. Find the ROOT cause, not symptoms |
| 2 | SCOUT | 25 min | Generate 7-10 possibilities. Wide. Unconventional. No judgment |
| 3 | ASSAY | 20 min | Filter to THIS person's constraints, values, timeline |
| 4 | CRUCIBLE | 20 min | Stress-test. What breaks? War-game scenarios |
| 5 | AUDITOR | 15 min | Quality check. Blind spots? Confidence ≥8? |
| 6 | PLAN | 15 min | Concrete answers. What to do, why, first step tomorrow |
| 7 | VERIFY | 5 min | Document everything. Export to GitHub + Drive |
| 7b | AUTORESEARCH | 1-3 hrs | Karpathy experimental loop — validate reasoning with real data |

### Critical Design Principles

1. **AI decides phase transitions** — not the user, not a timer
2. **AI keeps responses SHORT** — 2-3 sentences + a question. Like a sharp friend.
3. **AI challenges assumptions** — "What if that's not true?"
4. **AI uses frameworks NATURALLY** — doesn't lecture about Stoicism, just applies it
5. **AI is NOT a cheerleader** — no "You can do this!", no empty encouragement
6. **AI resists premature closure** — pushes one more round even when user wants quick answer

### What the AI is NOT

- NOT a passive listener waiting for instructions
- NOT a chatbot that answers questions
- NOT a consultant reading a script
- NOT a motivational speaker
- NOT verbose — short, punchy, like talking to a sharp co-founder

---

## ARCHITECTURE

### Tech Stack (Current POC)
- **Frontend:** Vanilla HTML/CSS/JS (poc/public/)
- **Backend:** Node.js + Express + WebSocket (poc/server/)
- **Voice:** Gemini 3.1 Flash Live API (v1alpha, AUDIO modality ONLY)
- **Knowledge:** Markdown files in poc/knowledge/ (frameworks + mentors)
- **Context:** Connectors in poc/context/ (GitHub, Drive, loader)
- **Deploy:** Railway (auto-deploy from main branch)

### Tech Stack (Target MVP)
- **Frontend:** React + Web Audio API (Vercel)
- **Backend:** Cloudflare Workers + Durable Objects
- **Voice:** Gemini 3.1 Flash Live API
- **Storage:** GitHub Issues (source of truth) + Google Drive (user-facing, phase-organized)
- **Auth:** Link-based (MVP), PIN + SMS (post-MVP)

### File Structure
```
thinking-foundry/
├── CLAUDE.md              ← You are here
├── ARCHITECTURE-V2.md     ← System design
├── PHASE-0-USER-STORIES.md
├── docs/
│   └── 04-technical/
│       └── FSD.md         ← THE SPEC. Read this. It's the bible.
├── poc/
│   ├── server/
│   │   ├── index.js           ← Express + WS server
│   │   ├── gemini-live.js     ← Gemini Live API + 15-min reconnection
│   │   ├── session-state.js   ← Phase state machine
│   │   ├── context-manager.js ← Context condensation for reconnections
│   │   ├── github-export.js   ← GitHub issue creation
│   │   └── drive-manager.js   ← Google Drive folder creation
│   ├── public/
│   │   ├── index.html         ← Setup screen + session UI
│   │   ├── app.js             ← Audio capture + WS client + setup flow
│   │   └── style.css          ← Mobile-first dark theme
│   ├── prompts/
│   │   └── phase-{0-7}-*.txt  ← System prompts per phase (CRITICAL)
│   ├── knowledge/
│   │   ├── frameworks/        ← Stoicism, IDEO, McKinsey, YC, Lean
│   │   ├── mentors/           ← Hormozi, Nate B. Jones, IndyDev Dan
│   │   └── index.json         ← Knowledge registry
│   └── context/
│       ├── loader.js          ← Unified context loader
│       ├── drive-connector.js ← Google Drive context fetcher
│       └── github-connector.js← GitHub repo context fetcher
└── .env                       ← API keys (not committed)
```

---

## BUILD RULES

### Gemini Live API Rules
- **responseModalities MUST be ['AUDIO'] only** — ['AUDIO', 'TEXT'] crashes with error 1011
- Transcript comes from separate pipeline (future: Google STT), NOT from Gemini response
- 15-minute connection limit → 3-phase reconnection (prepare at 13:00, setup at 13:30, swap at 14:00)
- Model: `models/gemini-3.1-flash-live-preview`
- Voice: Aoede

### Prompt Writing Rules
- **Read the FSD first** (docs/04-technical/FSD.md) — it has the canonical per-phase prompts
- Phase prompts go in poc/prompts/phase-{N}-{slug}.txt
- AI must explain what phase we're in and what it's trying to achieve
- AI must be structured, not conversational fluff
- AI must drive — always end with a question
- AI must keep responses to 2-3 sentences MAX
- NO cheerleading. NO motivation. NO "you can do this"
- Frameworks referenced naturally, not lectured about

### Data Flow
1. User opens app → Setup screen (paste GitHub/Drive URLs, pick frameworks)
2. User clicks Start → Server fetches context from GitHub/Drive
3. Knowledge frameworks loaded based on selection
4. All context injected into Gemini system prompt
5. AI leads through phases, short responses, always questions
6. Phase transitions decided by AI (not timer, not user)
7. Session ends → GitHub issue created + Drive folder with phase docs

### Deployment
- Push to main → Railway auto-deploys
- URL: thinking-foundry-production.up.railway.app
- Environment variables (Railway — 10 total):
  - GEMINI_API_KEY — Google AI Studio key for Gemini Live
  - SUPABASE_URL — Supabase project URL
  - SUPABASE_KEY — Supabase service role key
  - GITHUB_TOKEN — Fine-grained PAT for thinking-foundry-vault
  - GITHUB_OWNER — growthpigs
  - GITHUB_REPO — thinking-foundry-vault
  - DEEPGRAM_API_KEY — Deepgram key for user STT
  - ADMIN_API_KEY — Link auth admin key
  - GOOGLE_SERVICE_ACCOUNT — Google Drive service account path
  - NOTEBOOKLM_AUTH_B64 — Base64-encoded NotebookLM auth
- Environment variables (Vercel — 2):
  - VITE_WS_URL=wss://thinking-foundry-production.up.railway.app
  - VITE_API_URL=https://thinking-foundry-production.up.railway.app

### What Goes Where
- Phase prompts → poc/prompts/
- Knowledge content → poc/knowledge/
- Context connectors → poc/context/
- UI changes → poc/public/
- Server logic → poc/server/
- Architecture decisions → ARCHITECTURE-V2.md
- Product spec → docs/04-technical/FSD.md

---

## KEY DOCUMENTS

| Document | Purpose |
|----------|---------|
| docs/04-technical/FSD.md | THE SPEC. Product design, flows, API contracts, per-phase prompts |
| ARCHITECTURE-V2.md | System architecture, component design, storage model |
| PHASE-0-USER-STORIES.md | Original user stories for the product itself |
| poc/knowledge/index.json | Knowledge framework registry |

---

## CURRENT STATUS

### What Works
- ✅ Gemini Live API voice sessions (AUDIO modality)
- ✅ 15-minute auto-reconnection (3-phase swap)
- ✅ 8 phase prompts
- ✅ Pre-session setup screen (GitHub, Drive, framework selection)
- ✅ Knowledge base system (8 frameworks, 78 chunks in Supabase pgvector)
- ✅ Context connectors (GitHub + Drive)
- ✅ Pause button (with Supabase persistence + atomic pause counter)
- ✅ Deployed on Railway (10 env vars) + Vercel (React frontend)
- ✅ SupabaseBuffer — real-time session persistence (<50ms writes)
- ✅ GitHubPersistence — ONE issue per phase in thinking-foundry-vault
- ✅ PhaseTransitionHandler — AI-driven phase transitions (Article 10)
- ✅ 2-minute batch flush (Supabase → GitHub coalesced notes)
- ✅ Carry-forward + Squeeze persistence (Articles 8-9)
- ✅ Confidence gate (blocks transitions below 6/10)

### What Needs Work
- ❌ Real-time outline view (show key points, not raw transcript)
- ❌ Google Drive folder creation (built but needs service account setup)
- ❌ Production frontend (React + Vercel, currently vanilla HTML)
- ❌ Authentication (link-based for MVP)
- ❌ Deepgram API key needed for user STT (sign up at deepgram.com, $200 free credit)

---

## WHERE OUTPUTS GO (Three-Tier System)

The Thinking Foundry is the TOOL. The outputs go elsewhere:

```
Session output → growthpigs/thinking-foundry-vault (as GitHub issue)
  → 90% stay as vault issues forever (decisions, ideas, explorations)
  → ~10% promoted to growthpigs/fledgling (folder with FSD + research)
  → ~2-5% graduated to own project repo (full Software Foundry scaffold)
```

**This repo stays clean as methodology/product code.** No session data here.

See: [Thinking Foundry Vault](https://github.com/growthpigs/thinking-foundry-vault) | [Fledgling](https://github.com/growthpigs/fledgling) | [Software Foundry](https://github.com/growthpigs/the-foundry)

---

## PHILOSOPHY

The Thinking Foundry is not software. It's how Roderic thinks, made repeatable and teachable.

The product teaches people how to think clearly when AI provides answers but not context. AI gives you 70% quality answers. The final 30% requires context, constraints, and judgment specific to YOUR situation.

The Foundry bridges that gap through structured voice sessions where an AI co-founder leads you through the thinking process — from confusion to clarity in 60-120 minutes.

**Read the FSD. It's the bible. Everything flows from there.**
