# Interruption Handling Research — Technical Findings

**Research Issue:** [RESEARCH-04](https://github.com/growthpigs/thinking-foundry/issues/7)
**Date Completed:** 2026-03-28
**Status:** Ready for FSD integration

---

## Executive Summary

✅ **Verdict: NATURAL & BUILT-IN**

Gemini Live API handles interruption (barge-in) automatically and naturally. Users can cut off the AI at any time without special UI or configuration.

**Key Facts:**
- Barge-in happens automatically (no special button needed)
- Voice Activity Detection (VAD) detects interruption instantly
- Ongoing AI generation canceled and discarded
- Feels natural (like a real conversation)
- Can be configured for "smart barge-in" (context-aware interruption)
- No latency penalty

---

## Detailed Findings

### 1. How Barge-In Works ✅

**The Mechanism:**

1. AI is speaking (output audio streaming to user)
2. User starts speaking (new audio input detected)
3. Gemini's VAD (Voice Activity Detection) recognizes overlap
4. Ongoing generation is **instantly canceled**
5. Only information already sent to client remains
6. New user audio is processed immediately
7. AI generates response to interruption

**Timeline Example:**
```
AI: "Alright, let's think about your market positioning
     strategy. The key aspects to consider are..."

User: "Wait, I only have 10 minutes left."
(User interrupts mid-sentence at 5 seconds of "strategy")

Gemini's Response:
- Cancels rest of market positioning explanation
- Processes "Wait, I only have 10 minutes left"
- AI pivots: "Got it. Short version: focus on..."
```

**No UI Required:**
The user just speaks. No button press, no "stop" gesture. It's as natural as interrupting a human.

---

### 2. Voice Activity Detection (VAD) ✅

**What Is VAD?**
Software that detects when someone is speaking vs. silence.

**Gemini Live VAD Configuration:**

```typescript
const setupMessage = {
  setup: {
    model: "models/gemini-3.1-flash-live",
    realtimeInputConfig: {
      automaticActivityDetection: {
        // How much silence = user finished speaking?
        silenceDurationMs: 800, // Default: 800ms

        // Capture speech onset (avoid truncating first word)
        prefixPaddingMs: 300,   // Default: 300ms
      }
    }
  }
};
```

**How It Works:**
1. Gemini listens for audio input continuously
2. When audio starts, `prefixPaddingMs` buffers 300ms before processing
3. When silence lasts 800ms, VAD concludes user is done
4. AI processes the complete statement

**For The Thinking Foundry:**
Defaults are good. No tuning needed for MVP.

---

### 3. "Smart Barge-In" (Context-Aware) ✅

**Advanced Option:**
Beyond simple VAD, Gemini can use "proactive audio" to intelligently decide when to accept interruption.

**Scenario 1: Accept Interruption**
```
AI: "So in Phase 1, we focus on..."
User: "Can I ask about..."
Result: AI stops, listens to question (natural)
```

**Scenario 2: Defer Interruption (Smart)**
```
AI: "This is critical: if you don't do this,..."
User: *starts to interrupt*
Result: AI continues briefly, then accepts (not jarring)
```

**Configuration:**
```typescript
const setupMessage = {
  setup: {
    realtimeInputConfig: {
      // Smart interruption handling
      proactiveAudio: {
        // When to listen vs. speak
        mode: "ADAPTIVE" // Context-aware
      }
    }
  }
};
```

**For The Thinking Foundry:**
Use default mode for MVP. Smart barge-in is nice-to-have for later.

---

### 4. UI/UX Design ✅

**Challenge:** How do users know they *can* interrupt?

**Solution 1: Visual Indicator (Recommended)**

```typescript
// Show waveform + "Listening for interruption" indicator
<div className="thinking-interface">
  <AudioWaveform isListening={true} />
  <div className="ai-speaking">
    <span className="interrupt-hint">
      💬 You can interrupt anytime
    </span>
  </div>
</div>
```

**Visual Elements:**
- Animated waveform (shows AI is talking)
- Soft hint text (not intrusive)
- Cursor ready (not blocked)
- Maybe: visual feedback when interruption detected

**Solution 2: Implicit (Works Fine)**

Users naturally understand they can speak during voice conversations. No hint needed. Just let them talk.

**For The Thinking Foundry:**
Recommend Solution 1 initially. Users expect the hint.

---

### 5. Session State During Interruption ✅

**What Happens to Session History:**

When user interrupts:
- Everything AI said *before* interruption = saved
- Everything AI said *after* interruption = discarded
- User's new speech = processed as continuation

**Example:**
```
User: "I have a marketing problem"
AI: "Great! Let's explore this. First, tell me about..."
     (user interrupts here)
User: "Actually, let me start over"
AI: "Of course. Go ahead."

Session History:
- User statement 1: "I have a marketing problem"
- AI response 1: "Great! Let's explore this. First, tell me about"
- User statement 2: "Actually, let me start over"
- AI response 2: "Of course. Go ahead."

Note: The full "First, tell me about..." sentence was NOT sent to user,
so it doesn't appear in session history.
```

**For Transcript Export:**
Only completed sentences appear in the GitHub issue. Interrupted text is clean (no fragment sentences).

---

### 6. Edge Cases & Solutions ✅

**Edge Case 1: Rapid Interruptions**
```
User: "I think we should... no wait, maybe..."
```

Gemini handles this naturally. Each time VAD detects new user speech, it processes a new turn.

**Edge Case 2: User Interrupts During Critical Phase**
```
Phase 6: PLAN (AI giving final recommendations)
User: "Wait, I forgot to mention something"
```

Recommendation: Allow interruption always. User's new info may be critical. Phase can be restarted if needed.

**Edge Case 3: Network Latency**
```
User speaks → Internet delay → AI finally cancels old response
```

Latency should be <500ms (mostly unnoticeable). If >1s, user notices jarring delay.

**Solution:** Optimize network path (use CDN, close data centers). Not a problem for MVP.

**Edge Case 4: User Speaks While Thinking**
```
AI: [long pause, internal thinking]
User: "You there?"
```

VAD interprets silence as "can interrupt". This is fine. User's "Are you there?" triggers new response.

---

### 7. Technical Implementation ✅

**Frontend (React) - Interrupt-Ready UI:**

```typescript
function ThinkingInterface() {
  const [audioStream, setAudioStream] = useState(null);
  const [wsOpen, setWsOpen] = useState(false);

  useEffect(() => {
    // Start audio capture
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });
    setAudioStream(stream);

    // Connect to Gemini Live
    const ws = new WebSocket(
      'wss://generativelanguage.googleapis.com/ws/...'
    );

    ws.onopen = () => {
      // VAD is automatic, just stream audio
      streamAudioToGemini(stream, ws);
      setWsOpen(true);
    };
  }, []);

  return (
    <div className="thinking-session">
      <div className="transcript">
        {/* Transcripts appear here */}
      </div>

      <div className="interrupt-indicator">
        {wsOpen && <span>🎤 Listening (say anything to interrupt)</span>}
      </div>
    </div>
  );
}

// Audio is streamed continuously
function streamAudioToGemini(stream, ws) {
  const audioContext = new AudioContext();
  const processor = audioContext.createScriptProcessor(4096, 1, 1);

  const mediaStream = audioContext.createMediaStreamSource(stream);
  mediaStream.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = (event) => {
    // Send audio chunks as they arrive (continuous stream)
    const audioData = event.inputBuffer.getChannelData(0);
    ws.send(convertToPCM(audioData));
  };
}
```

**Backend (Gemini Live Setup):**

```typescript
const setupMessage = {
  setup: {
    model: "models/gemini-3.1-flash-live",
    systemInstruction: {
      parts: [{
        text: "You are a thinking guide. User can interrupt anytime..."
      }]
    },
    realtimeInputConfig: {
      automaticActivityDetection: {
        silenceDurationMs: 800,   // User finished speaking
        prefixPaddingMs: 300,     // Capture speech onset
      }
    }
  }
};

// That's it. VAD + barge-in happen automatically.
```

---

### 8. Testing Strategy

**Test 1: Simple Interruption**
- Start session
- AI begins explaining something
- User says "stop"
- ✅ Verify: AI stops, responds to "stop"

**Test 2: Rapid Interruption**
- User: "I think... no wait... actually..."
- ✅ Verify: Each statement processed cleanly

**Test 3: During Phase Change**
- Interruption happens as phase transitions
- ✅ Verify: Session continues smoothly

**Test 4: In Noisy Environment**
- Background TV or traffic
- User interrupts
- ✅ Verify: VAD correctly detects user speech vs noise

**Test 5: Network Latency**
- Simulate 500ms+ latency
- User interrupts
- ✅ Verify: Interrupt still works, acceptable delay

---

## Comparison: Manual vs Automatic Interruption

| Aspect | Manual (Button) | Automatic (Barge-In) |
|--------|-----------------|-------------------|
| **UX** | Jarring (stop button) | Natural (like human) |
| **Discovery** | Users must find button | Intuitive (people talk) |
| **Latency** | Variable (button press) | Instant (VAD detection) |
| **Errors** | User forgets to click | Can't really fail |
| **Conversation Flow** | Interrupted by UI | Flows naturally |

**Clear Winner:** Automatic barge-in (Gemini Live default).

---

## Recommendation

✅ **PROCEED with Automatic Barge-In (Default Gemini Live)**

This is the right choice because:
1. **Natural** (feels like talking to a human)
2. **Automatic** (no special UI button)
3. **Reliable** (VAD is proven technology)
4. **Built-in** (no extra code needed)
5. **Configurable** (tune VAD if needed)
6. **Zero latency** (as fast as user speech)

**Implementation:** ~2 hours to set up audio capture + WebSocket streaming

**MVP Scope:** Use defaults (no "smart barge-in" tuning needed)

---

## Sources

- [Gemini Live API Capabilities](https://ai.google.dev/gemini-api/docs/live-api/capabilities)
- [Live API Overview](https://ai.google.dev/gemini-api/docs/live-api)
- [Enhancing Natural Flow in Gemini Live: Testing Interruptions](https://dev.to/jxlee007/enhancing-natural-flow-in-gemini-live-testing-interruptions-and-a-proposed-context-layer-43ll)
- [Google Cloud Gemini Live Blog](https://cloud.google.com/blog/topics/developers-practitioners/how-to-use-gemini-live-api-native-audio-in-vertex-ai)
- [Real-Time Voice Detection with Gemini Live API](https://www.qed42.com/insights/real-time-voice-detection-with-vector-tts-in-gemini-live-api/)
- [Gemini Live API Web Console (GitHub)](https://github.com/google-gemini/live-api-web-console)
- [Real-Time Voice Apps with Gemini Live](https://markaicode.com/gemini-live-api-real-time-voice-apps/)

---

**Status:** All 4 Research Issues Complete ✅
**Next:** Write FSD (Functional Specification Document) consolidating all findings
