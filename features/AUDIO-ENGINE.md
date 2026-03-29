# Audio Engine — Capture, Playback, Reconnection

**Status:** MVP Fixed (3.29.2026)
**Last Updated:** 2026-03-29

## Overview

The Thinking Foundry POC uses Web Audio API for bidirectional audio streaming:
- **Capture:** MediaRecorder + AudioContext → PCM 16kHz → WebSocket to server
- **Playback:** Gemini 24kHz PCM → Web Audio → speaker
- **Reconnection:** 15-minute context swap with seamless audio continuation

Three critical bugs were discovered and fixed on 2026-03-29:
1. AudioContext created per playback chunk (browser cap 6-10 contexts)
2. Race condition in connection swap (isSwapping flag cleared before async close completes)
3. iOS audio suspension on screen lock (no recovery mechanism)
4. WebSocket timeout/drive key handling (first-click reliability)

## Accounts & Credentials

No external accounts required. Web Audio API is browser native (works offline).

## Current State (2026-03-29)

### What's Working
- ✅ Bidirectional audio streaming (Gemini Live API)
- ✅ Barge-in detection (server-side, Gemini native)
- ✅ 15-minute reconnection with context preservation
- ✅ Mobile audio capture (iOS Safari supported)

### What Was Fixed Today
- ✅ **AudioContext reuse:** Playback now uses single shared context, not one per chunk (was causing silent failures)
- ✅ **Swap race condition:** isSwapping flag moved to close event handler (was tearing down session every 14 min)
- ✅ **iOS screen lock recovery:** Added visibilitychange listener to resume contexts on screen wake
- ✅ **Connection timeout:** 5s timeout on WebSocket (was freezing UI on server down)

### What's NOT in MVP
- ❌ Audio recording (user mic input is live-streamed, not stored locally)
- ❌ Audio playback download (Gemini output is speaker-only)
- ❌ Noise cancellation (handled by browser AudioContext native)

## Architecture

### Capture Pipeline

```
User mic (getUserMedia)
    ↓
AudioContext @ 16kHz (native or resampled)
    ↓
ScriptProcessor (4096 buffer = 256ms chunks)
    ↓
Convert float32 → int16 PCM
    ↓
Resample if needed (browser default → 16kHz)
    ↓
Base64 encode
    ↓
WebSocket → Server
```

**File:** `poc/public/app.js:160-223` (`startAudioCapture()`)

### Playback Pipeline

```
Server sends base64 PCM (24kHz)
    ↓
Decode base64 → int16 → float32
    ↓
SharedPlaybackContext.createBuffer(1, len, 24000)
    ↓
BufferSource.connect(context.destination)
    ↓
BufferSource.start(0)
    ↓
speaker
```

**File:** `poc/public/app.js:269-334` (`processPlaybackQueue()`)

**Key:** Uses `getPlaybackContext()` (line 283-290) to reuse a single AudioContext across all chunks. Old code created new context per chunk → hit browser limit.

### Reconnection Pipeline

```
Connection active (0:00 - 13:00)
    ↓
Prepare standby WS (13:00)
    ↓
Setup standby with condensed context (13:30)
    ↓
[OLD] isSwapping = false → oldWs.close() [RACE CONDITION]
    ↓
[NEW] oldWs.once('close') → isSwapping = false
    ↓
Swap: activeWs = standbyWs, close old
    ↓
Continue with new connection
```

**File:** `poc/server/gemini-live.js:306-339` (`performSwap()`)

**Fix:** The race condition was synchronously setting `isSwapping = false` BEFORE the async `oldWs.close()` completed. When the close event fired seconds later, the guard `!this.isSwapping` would be false, causing `onClose()` to fire inappropriately, tearing down the session.

Now `isSwapping = false` is inside the `close` event handler, firing AFTER close completes.

## Known Issues & Mitigations

### Issue 1: AudioContext Limited (Browser Cap)
- **Problem:** Chrome/Safari limit ~6-10 concurrent AudioContext instances
- **Old Code:** Created new context per 24kHz audio chunk (~100ms each)
- **After 500ms:** Browser cap hit → audio silently stops
- **Fix:** Reuse single playbackCtx across all chunks, close only on session end
- **Evidence:** Line 283 in app.js, `getPlaybackContext()` checks `if (!playbackCtx || playbackCtx.state === 'closed')`

### Issue 2: iOS Audio Suspension
- **Problem:** Safari suspends all AudioContext on screen lock
- **Symptom:** Unlock phone → audio is dead, session looks live but produces no audio
- **Fix:** `visibilitychange` listener resumes contexts on page visibility resumed
- **Evidence:** Lines 508-520 in app.js, added after `startAudioCapture()`
- **Test:** Lock/unlock phone during Phase 1 session, audio should resume seamlessly

### Issue 3: Reconnection Race Condition (CRITICAL)
- **Problem:** `this.isSwapping = false` set synchronously, but `oldWs.close()` is async
- **Symptom:** Every 14-minute reconnection would fire `onClose()` inappropriately, tearing down the session
- **Symptom Evidence:** Session would end at exactly 14 minutes with "Disconnected" status
- **Fix:** Moved flag clear into `oldWs.once('close')` handler
- **Evidence:** gemini-live.js lines 327-340, flag now cleared inside close event

### Issue 4: WebSocket Not Awaited / Hangs on Dead Server
- **Problem:** `connectWebSocket()` not awaited, WS connection hung indefinitely if server down
- **Symptom:** UI frozen on "Connecting..." button, no timeout
- **Fix:** Added 5s timeout in `onopen` path, shows "Connection timed out" message
- **Evidence:** app.js lines 347-357, `wsConnectTimeout` setTimeout

### Issue 5: Drive Key Always Undefined
- **Problem:** Session-setup always sent `drive: setupConfig.drive` which was never defined
- **Impact:** Drive context fetch always received undefined, wasted server code
- **Fix:** Removed drive key, only include if provided; changed to `documents` array
- **Evidence:** app.js lines 361-367, setup message now only includes github/documents/frameworks

## Edge Cases & Recovery

### User mutes browser mic permissions
- **Behavior:** `getUserMedia()` promise rejects
- **Recovery:** Error caught in `startSession()` try/catch, UI shows "Microphone access denied"
- **Note:** iOS may silently deny instead of prompting if `getUserMedia()` called outside gesture context

### Network drops during Phase 1
- **Behavior:** WebSocket closes, but audio capture continues (no error)
- **Recovery:** `ws.onclose` fires, `updateStatus('disconnected')` shown to user
- **Next:** User must refresh and restart (no auto-reconnect for MVP)

### Audible glitch at 14-minute mark (reconnection)
- **Symptom:** Brief pause or artifact when swapping connections
- **Expected:** Should be seamless (<1s), but network latency may add 200-500ms
- **Mitigation:** Condensed context includes conversation state, AI continues naturally

### Playback queue overflows (rapid Gemini responses)
- **Symptom:** If Gemini generates faster than user's device plays audio, queue grows
- **Current:** No queue size limit (potential memory issue for very long sessions)
- **Mitigation:** For MVP, accept this. In production, cap queue at 100 chunks and log warning

## Testing & Validation

### Unit Tests (Not in POC)
Would need tests for:
- `processPlaybackQueue()` decoding (base64 → float32)
- `resample()` function (PCM resampling logic)
- `getPlaybackContext()` caching behavior
- `visibilitychange` listener cleanup

### Manual Tests (MVP Validation)

**Test 1: 20-minute session with screen lock**
1. Start session
2. At minute 3, lock phone screen
3. At minute 5, unlock
4. Audio should resume seamlessly
5. At minute 14, watch for reconnection (may hear brief pause)
6. Session should complete without "Disconnected" message

**Test 2: Dead server at first click**
1. Stop backend server (`ps aux | grep node`)
2. Click "Start Session"
3. Button should show "Connection timed out" after 5s
4. UI should be responsive for retry

**Test 3: AudioContext count (browser dev tools)**
1. Start session, run in DevTools console:
   ```js
   let count = 0;
   const orig = window.AudioContext;
   window.AudioContext = function() {
     count++;
     console.log(`AudioContext created #${count}`);
     return new orig(...arguments);
   };
   ```
2. Let session run for 2 minutes
3. Count should be 1 or 2 (not 100+)

## Dependencies & Compatibility

| Environment | Status | Notes |
|---|---|---|
| Chrome Desktop | ✅ Full | 16kHz capture, 24kHz playback tested |
| Firefox Desktop | ⚠️ Partial | AudioContext works, ScriptProcessor deprecated but functional |
| Safari macOS | ✅ Full | Uses webkitAudioContext, works at native rate |
| Safari iOS | ✅ Full | Requires user gesture for AudioContext, screen lock fixed |
| Android Chrome | ⚠️ Partial | Mic access sometimes requires extra permission prompt |

**Deprecated API:** `ScriptProcessorNode` (used for raw PCM access) is deprecated in favor of `AudioWorklet`. Firefox shows deprecation warning. For post-MVP, migrate to AudioWorklet (more complex setup, but better performance).

## History

| Date | Change |
|------|--------|
| 2026-03-29 | Fixed 4 bugs: AudioContext reuse, reconnection race, iOS screen lock, WS timeout |
| 2026-03-28 | POC audio pipeline working but with reliability issues |

