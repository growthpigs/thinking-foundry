# The Thinking Foundry — Proof of Concept

Voice-first thinking sessions powered by Gemini Live API with seamless 15-minute reconnection.

## What This Proves

| Unknown | Approach | Status |
|---------|----------|--------|
| 15-min Gemini Live reconnection | 3-phase swap (prepare → setup → swap) at 13/13.5/14 min | Built |
| Google Drive folder creation | Service account (no user OAuth) | Built |
| Audio capture on mobile | Web Audio API (ScriptProcessorNode → PCM) | Built |

## Quick Start

```bash
cd poc
npm install
cp .env.example .env
# Fill in your API keys in .env
npm start
# Open http://localhost:3000 on your phone or browser
```

## Required API Keys

### Gemini API Key
1. Go to https://aistudio.google.com/apikey
2. Create an API key
3. Set `GEMINI_API_KEY` in `.env`

### GitHub Token (optional — for export)
1. Go to https://github.com/settings/tokens
2. Create a token with `repo` scope
3. Set `GITHUB_TOKEN` in `.env`

### Google Service Account (optional — for Drive)
1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. Create a service account
3. Enable Google Drive API in the project
4. Download JSON key file
5. Set `GOOGLE_SERVICE_ACCOUNT=./service-account.json` in `.env`

## Architecture

```
Browser                  Server                    Gemini Live API
┌──────────┐            ┌──────────────┐           ┌──────────────┐
│ Web Audio│───PCM 16k──│ WebSocket    │───WS──────│ BidiGenerate │
│ API      │            │ Server       │           │ Content      │
│          │◄──Audio 24k│              │◄──────────│              │
│          │  +Text     │ Reconnection │           │              │
│          │            │ Manager      │           │              │
└──────────┘            └──────────────┘           └──────────────┘
```

## Reconnection Strategy

The Gemini Live API has a 15-minute connection limit. Our approach:

1. **13:00** — Create standby WebSocket to Gemini in background
2. **13:30** — Send setup message to standby with condensed context (key points + recent exchanges)
3. **14:00** — Swap audio routing to standby, close old connection
4. **Result** — User experiences ~1-2 second pause, conversation continues seamlessly

The `ContextManager` maintains a rolling window of recent exchanges plus extracted key points, which get injected into the new connection's system prompt.

## Phases

| # | Name | Purpose |
|---|------|---------|
| 0 | User Stories | Capture the raw problem |
| 1 | MINE | Deep listening, 5 Whys |
| 2 | SCOUT | Generate 7-10 possibilities |
| 3 | ASSAY | Filter to constraints |
| 4 | CRUCIBLE | Stress-test paths |
| 5 | AUDITOR | Quality check, confidence |
| 6 | PLAN | Concrete action items |
| 7 | VERIFY | Summarize and export |

## File Structure

```
poc/
├── server/
│   ├── index.js              Express + WS server
│   ├── gemini-live.js        Gemini connection + reconnection
│   ├── session-state.js      Phase state machine
│   ├── context-manager.js    Context condensation for reconnection
│   ├── github-export.js      GitHub issue creation
│   └── drive-manager.js      Google Drive folder creation
├── public/
│   ├── index.html            Single page app
│   ├── app.js                Audio capture + WS client
│   └── style.css             Mobile-first styles
└── prompts/
    └── phase-{0-7}-*.txt     System prompts per phase
```

## Testing on Mobile

1. Run `npm start` on your machine
2. Find your local IP: `ifconfig | grep "inet " | grep -v 127`
3. Open `http://<your-ip>:3000` on your phone
4. Allow microphone access when prompted
5. Tap "Start Session" and speak

## Known Limitations (POC)

- Audio playback creates a new AudioContext per chunk (not ideal for production)
- ScriptProcessorNode is deprecated (production should use AudioWorklet)
- No persistent storage — transcript lives in memory only
- Reconnection tested with timers, not under real 15-minute load
- No authentication or session management
