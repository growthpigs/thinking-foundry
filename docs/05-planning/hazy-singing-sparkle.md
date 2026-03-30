# Thinking Foundry — Build Plan

**Context:** The Foundry phases MINE + SCOUT + ASSAY are complete. CRUCIBLE was documented but never executed. Multiple blocking audio bugs were discovered in the POC. AutoResearch (Karpathy) pattern identified as core differentiator for the background research layer. This plan covers three work streams in dependency order.

**Progress:** ✅ Framework Expansions (3,901 lines) + Semantic Chunking (78 chunks) + Supabase Architecture Complete. Ready for knowledge base seeding.

---

## Stream A: Fix Audio Bugs (BLOCKER — must ship first)

**Why:** "If the first thing they click on fails, we are screwed." Three HIGH-severity bugs will kill sessions before they start.

### Bug 1: AudioContext created per chunk
**File:** `poc/public/app.js:317`
**Problem:** `processPlaybackQueue()` creates `new AudioContext()` per chunk. Browser cap ~6-10 contexts → silent failure.
**Fix:** Create ONE shared playback `AudioContext` at module level. Reuse across all chunks. Only `.close()` when session ends.

```js
// At module level (alongside existing capture audioContext)
let playbackCtx = null;
function getPlaybackContext() {
  if (!playbackCtx || playbackCtx.state === 'closed') {
    playbackCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return playbackCtx;
}
// processPlaybackQueue uses getPlaybackContext() instead of new AudioContext()
```

### Bug 2: Swap race condition — `isSwapping` cleared before `close()` fires
**File:** `poc/server/gemini-live.js:327`
**Problem:** `this.isSwapping = false` set synchronously. `oldWs.close()` fires async. Close event arrives when `isSwapping` is already false → `onClose()` fires → session torn down at every 14-min reconnect.
**Fix:** Move `isSwapping = false` and `onReconnected()` into the old WS `close` event handler.

```js
performSwap() {
  this.isSwapping = true;
  const oldWs = this.activeWs;
  this.activeWs = this.standbyWs;
  this.standbyWs = null;
  this.reconnectionCount++;
  this.connectionStartTime = Date.now();
  this.scheduleReconnection();

  if (oldWs && oldWs.readyState === WebSocket.OPEN) {
    oldWs.once('close', () => {
      this.isSwapping = false;   // ← moved here, fires AFTER close completes
      this.onReconnected();
    });
    oldWs.close(1000, 'Reconnection swap');
  } else {
    this.isSwapping = false;
    this.onReconnected();
  }
}
```

### Bug 3: No `visibilitychange` listener — iOS screen lock kills audio
**File:** `poc/public/app.js` (absent)
**Problem:** iOS Safari suspends AudioContext on screen lock. No recovery code exists.
**Fix:** Add `visibilitychange` listener to resume both capture and playback contexts.

```js
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'visible') {
    if (audioContext?.state === 'suspended') await audioContext.resume();
    if (playbackCtx?.state === 'suspended')  await playbackCtx.resume();
  }
});
```

### Bug 4: First-click UX gaps (MEDIUM)
**File:** `poc/public/app.js:499, 351`
- WebSocket not awaited → frozen UI if server down. Add connection timeout (5s) + "retry" button.
- `drive` key in session-setup always `undefined` — remove from message if not provided.
- iOS mic denial shows no actionable message — add iOS-specific prompt copy.

**Files to edit:** `poc/public/app.js`, `poc/server/gemini-live.js`

---

## Stream B: Background Research Agents (MVP2 — AutoResearch Pattern)

**Why:** The problem with LLMs is modal/generic answers. The innovation is: voice conversation extracts THIS person's constraints → background agents research against those constraints → Phase 2 (SCOUT) responds with personalized findings, not average-person findings.

**Key finding from research:** Gemini Live does NOT have NON_BLOCKING tool calls. The workaround is server-side parallelism — Node.js fires background API calls against the transcript while audio continues uninterrupted.

### Architecture

```
Phase 1 (MINE) Active (voice continues)
       |
Every 3-5 user utterances:
       ↓
ConstraintExtractor.extract(transcript)
  - Gemini text API call (NOT Live connection)
  - Extracts: budget, timeline, must-haves, deal-breakers, location, values
  - Stores in session.constraintBuffer
       |
       ↓
ResearchDispatcher.dispatch(constraints)
  - Fires parallel queries: knowledge base lookup + optional web search
  - Uses constraints as query parameters (NOT generic queries)
  - Results accumulate in session.researchBuffer
       |
Phase signal: MINE → SCOUT
       ↓
gemini.forceReconnect(phase=2, contextSummary + researchBuffer)
  - Research results injected into knowledgeContext
  - Gemini Live sees personalized research before speaking in SCOUT
```

### AutoResearch Ratchet Rule
Each research cycle MUST produce new signal or terminate. Implement as:
1. Extract constraints from transcript (new only — diff from last extraction)
2. Dispatch research ONLY for NEW constraints
3. Append findings to `session.programMd` (the persistent scratchpad, inspired by Karpathy)
4. On reconnect, `programMd` is injected as knowledge context

### New Files Needed
- `poc/server/constraint-extractor.js` — Gemini text API wrapper, constraint parsing
- `poc/server/research-dispatcher.js` — Parallel query fan-out, result aggregation
- `poc/server/program-md.js` — Persistent session scratchpad (the ratchet state)

### Existing Infrastructure to Extend
- `poc/server/context-manager.js:52` — `extractKeyPoint()` extended to call ConstraintExtractor
- `poc/server/gemini-live.js:65` — `knowledgeContext` receives `programMd` content on reconnect
- `poc/server/index.js:169-177` — `knowledgeLoader.load()` receives research buffer

### Open Question (Issue #14 decisions needed first)
Stream B implementation depends on Q1 (repo architecture) and Q2 (delivery mechanism) from https://github.com/growthpigs/thinking-foundry/issues/14. These must be decided before research dispatcher can query correctly.

---

## Stream C: CRUCIBLE Execution (Technical Only)

**Why:** The spec is ready. The critical technical assumption is: "Does the prompt architecture produce co-founder behavior (contributes ideas, challenges assumptions) vs. interrogator behavior (endless questions)?"

**Scope:** Technical testing ONLY. No business model, no marketing, no competitive analysis.

**Tool:** `notebooklm-py` (`/Users/rodericandrews/clawd/notebooklm-py/`, auth at `~/.notebooklm/storage_state.json`)

### Documents to upload
1. `poc/prompts/phase-0-user-stories.txt` — Does it open with "What's your #1 thing?"
2. `poc/prompts/phase-1-mine.txt` — Does it probe without interrogating?
3. `poc/prompts/phase-2-scout.txt` — Does it contribute possibilities or ask "what do you think?"
4. `docs/04-technical/FSD.md` sections on AI Conversation Engine (FSD-002)
5. A sample 20-turn transcript (generated by running phase 0-1 prompts manually against Gemini)

### Debate Prompt (Technical)
```
You have 5 phase prompts for a voice AI system that helps founders think through decisions.

Technical Question 1: Do these prompts produce a system that CONTRIBUTES (adds research, ideas, challenges)
vs. INTERROGATES (asks questions sequentially without adding value)?

Technical Question 2: What specific prompt patterns cause the AI to interrogate instead of contribute?
What should be changed?

Technical Question 3: Can the 15-minute reconnection architecture preserve enough context
for the AI to continue behaving coherently, or does it "reset" personality between segments?
```

### Scoring (Technical Only)
| Dimension | Pass | Fail |
|-----------|------|------|
| Co-founder behavior signal in prompts | Explicit contribution directives present | Pure question-asking prompts |
| Context preservation | Reconnect prompt includes conversation state | Generic restart each time |
| Framework naturalness | Frameworks referenced as tools, not lectures | Explicit preambles like "Using IDEO Design Thinking..." |

### Output
- NotebookLM notebook created with 5 documents
- Debate transcript saved to `.foundry/04-crucible-results.md`
- Pass/fail verdict on each technical dimension
- Specific prompt changes recommended

---

## Dependency Order

```
Issue #14 decisions (Q1/Q2/Q3)    ← Roderic decides
         |
    Stream A (audio bugs)          ← Fix first, non-negotiable
         |
    Stream C (crucible)            ← Technical validation before build
         |
    Issue #14 knowledge base build ← After Q1/Q2 resolved
         |
    Stream B (background agents)   ← MVP2, after Stream A is stable
```

## File List

**Stream A (to edit):**
- `poc/public/app.js` (AudioContext reuse, visibilitychange, WS timeout, drive fix)
- `poc/server/gemini-live.js` (swap race condition fix)

**Stream B (to create):**
- `poc/server/constraint-extractor.js`
- `poc/server/research-dispatcher.js`
- `poc/server/program-md.js`

**Stream C (execution):**
- Run `notebooklm-py` script with 5 documents
- Save results to `.foundry/04-crucible-results.md`

**Documentation (PAI structure):**
- `features/AUDIO-ENGINE.md` — Audio capture, playback, reconnection patterns
- `features/RESEARCH-AGENTS.md` — Background agent architecture, constraint extraction
- `docs/04-technical/BACKGROUND-AGENTS.md` — Full spec for Stream B

---

## Verification

**Stream A:** Record a 20-minute session. Screen-lock phone at minute 3. Audio should resume after unlock. Reconnect at minute 14 must be seamless (no `onClose` firing). Count AudioContext instances — must stay at 1.

**Stream B:** After Phase 1 session (MINE), check `session.constraintBuffer` — must contain structured constraints extracted from transcript. Check `session.programMd` — must contain research results. Phase 2 (SCOUT) first response must reference at least one specific finding relevant to what the user said in Phase 1.

**Stream C:** NotebookLM notebook must exist with 5 uploaded documents. Debate must run. Results file must exist with verdict.
