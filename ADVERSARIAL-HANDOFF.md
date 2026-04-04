# ADVERSARIAL HANDOFF — Thinking Foundry POC

**Written by:** The AI that built this (biased, blind spots guaranteed)
**For:** A FRESH AI instance with zero loyalty to these decisions
**Date:** 2026-04-04
**Purpose:** Tear this apart. Find what I missed. Break what I said works.

---

## SITREP

### What exists
- Voice-first thinking session app on Railway (Node.js + Express)
- Gemini 3.1 Flash Live Preview for voice (AUDIO-only WebSocket)
- 8-phase structured thinking (Phase 0-7)
- Email + PIN auth (Supabase-backed)
- Google Drive folder output (lazy, on phase transition)
- 78 framework knowledge chunks in Supabase (pgvector)
- 2 Gemini tool declarations (fetch_framework, search_knowledge)
- 37 commits across Mar 31 - Apr 4

### Production URL
- App: https://thinking-foundry-production.up.railway.app
- Health: https://thinking-foundry-production.up.railway.app/health
- Admin: https://thinking-foundry-production.up.railway.app/admin (key: tf-admin-foundry-2026)
- Railway: https://railway.com/project/fbb69e1c-31eb-4063-9b2d-cb83fa82a2d6
- Repo: https://github.com/growthpigs/thinking-foundry
- Supabase project ref: vkizhvkgjimthhfefzhy

### GitHub Issues
- #3 — Master Plan (open, updated)
- #23 — AI-generated phase summaries (open)
- #25 — Prompt rewrite / co-founder ethos (open)
- #26 — AutoResearch architecture (open, critical)

---

## WHAT I CLAIM WORKS — CHALLENGE EVERY ONE

### 1. Voice sessions connect and AI speaks
**My claim:** Gemini Live connects, user speaks, AI responds with audio.
**How to challenge:** Start a session. Does the AI actually speak within 10 seconds? Does the connection survive 5+ minutes? Check Railway logs for `[GEMINI][ACTIVE] WebSocket closed` — if you see error codes, it's dying.

### 2. Phase transitions fire when AI says "I have what I need"
**My claim:** PhaseTransitionHandler detects transition signals and fires onTransition.
**How to challenge:** Run a session, get the AI to say "let's move to Phase 1." Does the phase dot in the UI actually change from 0 to 1? Check Railway logs for `[PHASE] AI-driven transition`. If it never appears, transitions are broken.
**What I'm worried about:** The AI might say something like "we're ready to dig deeper" instead of the exact phrases in TRANSITION_PATTERNS. The fallback regex at phase-transition.js:220 catches "I have what I need" but NOT other phrasings.

### 3. Tool calls work in Gemini AUDIO-only mode
**My claim:** Gemini can call fetch_framework and search_knowledge, and we send toolResponse back.
**How to challenge:** THIS IS THE BIGGEST UNKNOWN. I have ZERO production evidence of a tool call ever happening. Check Railway logs for `[GEMINI][ACTIVE] Tool call:` — if this line NEVER appears across multiple sessions, then tools don't work in AUDIO mode and the entire AutoResearch architecture (Issue #26) collapses.
**What I'm worried about:** The Gemini Live API documentation doesn't explicitly confirm tool use in AUDIO-only mode. We know text clientContent crashes it (error 1007). Tool declarations are ACCEPTED in setup (no error), but acceptance != invocation.

### 4. Semantic search returns relevant results
**My claim:** 768-dim embeddings, pgvector search, 78 chunks.
**How to challenge:** Hit /health — check knowledgeBase.chunks and semanticSearch.ok. Then run a real query:
```
curl -s "https://thinking-foundry-production.up.railway.app/health"
```
Also: do the search results actually make SENSE? "Nightclub in Paris" returning YC startup frameworks is... loosely relevant. Test with something specific like "pricing strategy for SaaS" and see if Hormozi/McKinsey chunks come back.

### 5. Auth system is secure
**My claim:** Deny-by-default whitelist, session nonces, XSS fixed.
**How to challenge:**
- Try hitting /session/new?email=rodericandrews@gmail.com (no nonce) — should get 403
- Try /auth/send-link with a non-whitelisted email — should be rejected
- Check if the admin key (tf-admin-foundry-2026) is hardcoded anywhere besides Railway env vars
- Check if session nonces actually expire (they should after 60 seconds)

### 6. Drive folders create on phase transition (not eagerly)
**My claim:** Folders only create when the first phase completes.
**How to challenge:** Start a session, don't complete any phase, end it. Check Google Drive — NO new folder should appear. Then complete a session through Phase 0 → Phase 1 and verify a folder WITH content appears.

### 7. Mic muting prevents echo barge-in
**My claim:** Silence frames sent while AI plays, real mic audio blocked.
**How to challenge:** During a session, does the AI get interrupted by its own audio playing through your speakers? If yes, the muting isn't working. Check if `isPlaying` flag is correctly synchronized with audio queue state.

### 8. The preamble/prompt rewrite improves behavior
**My claim:** The new preamble makes the AI listen instead of interrogate.
**How to challenge:** Start a session. Say one sentence about an idea. Does the AI ask 3 follow-up questions (BAD — interviewer) or does it say "here's what I'm hearing" and contribute something (GOOD — co-founder)?

---

## WHAT I KNOW IS BROKEN BUT HAVEN'T FIXED

1. **ConstraintExtractor doesn't exist** — the entry point for the AutoResearch pipeline is not built
2. **ResearchDispatcher is not wired** — 258 lines of code, never imported in index.js
3. **program.md (session scratchpad) doesn't exist** — research findings have nowhere to accumulate
4. **MAX_CONTEXT_INJECTION_LENGTH (10000) is dead code** — declared but never enforced
5. **The AI probably won't use tools naturally** — even with the updated preamble, Gemini may not call tools in AUDIO mode
6. **No automated tests** — everything is manual testing only
7. **Resend can only send to account owner email** — magic links won't reach real users without domain verification

---

## ARCHITECTURE DECISIONS I MADE — SECOND-GUESS THEM

1. **Single HTML file (no React/framework)** — I chose this for simplicity. Is it maintainable at 820 lines?
2. **In-memory Maps for auth state + Supabase fallback** — dual-write pattern. Is this a consistency risk?
3. **Silence frames instead of pausing mic** — I send zero-value PCM. Is there a Gemini config to mute input instead?
4. **Removed squeeze gate entirely** — Article 9 of the Constitution says squeeze is mandatory. I removed it because text injection crashes AUDIO mode. Is there another way to implement squeeze?
5. **Phase numbers 0-7 instead of 1-8** — I matched the internal representation. Users see "Phase 0: User Stories." Is "Phase 0" confusing for normal humans?
6. **Tool responses as research channel** — untested assumption. Should we use phase-transition-injection-only instead?

---

## FILES TO AUDIT (Priority Order)

1. `poc/server/index.js` (945 lines) — the monolith. Everything lives here.
2. `poc/server/gemini-live.js` (502 lines) — Gemini WebSocket lifecycle
3. `poc/public/session.html` (820 lines) — all client code in one file
4. `poc/server/email-auth.js` (612 lines) — auth system
5. `poc/server/phase-transition.js` (290 lines) — transition detection
6. `poc/server/framework-fetcher.js` (246 lines) — tool declarations + search
7. `poc/server/research-dispatcher.js` (258 lines) — NOT WIRED, needs review
8. `poc/prompts/phase-0-user-stories.txt` (83 lines) — the prompt that shapes behavior

---

## THE ONE TEST THAT MATTERS MOST

Start a session. Say "I'm thinking about starting a nightclub in Paris." Wait.

Check Railway logs for: `[GEMINI][ACTIVE] Tool call: search_knowledge`

If that line appears: the entire AutoResearch architecture is viable.
If it doesn't: we need to redesign how research gets into the voice session.

This is the single most important validation for the next phase of the product.

---

## HOW TO RUN THE ADVERSARIAL CHECK

1. Read this file first
2. Read the Constitution: /Users/rodericandrews/_PAI/operations/thinking-foundry/CONSTITUTION.md
3. Read Issue #26: https://github.com/growthpigs/thinking-foundry/issues/26
4. Hit /health endpoint and verify everything is green
5. Start a live session and test claims 1-8 above
6. Check Railway logs for tool call evidence
7. Report: what's ACTUALLY broken vs what I said works

**Be brutal. I built this. I'm blind to its flaws.**
