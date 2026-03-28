require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const path = require('path');
const { GeminiLiveManager } = require('./gemini-live');
const { SessionState } = require('./session-state');
const { ContextManager } = require('./context-manager');
const { exportToGitHub } = require('./github-export');
const { DriveManager } = require('./drive-manager');
const { ContextLoader } = require('../context/loader');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── REST Endpoints ───

app.post('/api/export', async (req, res) => {
  try {
    const { sessionName, transcript, phases } = req.body;
    const result = await exportToGitHub({ sessionName, transcript, phases });
    res.json({ ok: true, issueUrl: result.html_url });
  } catch (err) {
    console.error('[EXPORT] Error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/drive/setup', async (req, res) => {
  try {
    const { sessionName, userEmail, phaseOutputs } = req.body;
    const drive = new DriveManager();
    const result = await drive.createSessionFolder(sessionName, userEmail, phaseOutputs);
    res.json({ ok: true, folderId: result.folderId, folderUrl: result.folderUrl });
  } catch (err) {
    console.error('[DRIVE] Error:', err.message);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─── WebSocket (audio + control) ───

wss.on('connection', (clientWs) => {
  console.log('[WS] Client connected');

  const session = new SessionState();
  const context = new ContextManager();
  const knowledgeLoader = new ContextLoader();
  let gemini = null;

  const sendToClient = (type, data) => {
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(JSON.stringify({ type, ...data }));
    }
  };

  const startGemini = async () => {
    // Load knowledge context for current phase
    const knowledgeContext = await knowledgeLoader.load({
      phase: session.currentPhase,
      fullContent: false
    });

    gemini = new GeminiLiveManager({
      apiKey: process.env.GEMINI_API_KEY,
      phase: session.currentPhase,
      contextSummary: context.getCondensedContext(),
      knowledgeContext,

      onTranscript: (role, text) => {
        context.addUtterance(role, text);
        sendToClient('transcript', { role, text });
      },

      onAudio: (audioBase64) => {
        sendToClient('audio', { data: audioBase64 });
      },

      onReconnecting: () => {
        console.log('[GEMINI] Reconnection starting...');
        sendToClient('status', { state: 'reconnecting' });
      },

      onReconnected: () => {
        console.log('[GEMINI] Reconnection complete');
        sendToClient('status', { state: 'connected' });
      },

      onError: (err) => {
        console.error('[GEMINI] Error:', err);
        sendToClient('error', { message: err.message || String(err) });
      },

      onClose: () => {
        console.log('[GEMINI] Connection closed');
        sendToClient('status', { state: 'disconnected' });
      }
    });

    await gemini.connect();
    sendToClient('status', { state: 'connected', phase: session.currentPhase });
  };

  clientWs.on('message', async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      // Binary audio data — forward to Gemini
      if (gemini) gemini.sendAudio(raw);
      return;
    }

    switch (msg.type) {
      case 'start':
        console.log('[WS] Starting session');
        await startGemini();
        break;

      case 'audio':
        // Base64-encoded audio from client
        if (gemini) gemini.sendAudioBase64(msg.data);
        break;

      case 'phase':
        // Advance to specific phase
        const newPhase = msg.phase;
        console.log(`[WS] Phase change: ${session.currentPhase} → ${newPhase}`);
        session.setPhase(newPhase);
        if (gemini) {
          // Reload knowledge context for new phase
          const phaseKnowledge = await knowledgeLoader.load({
            phase: newPhase,
            fullContent: false
          });
          gemini.knowledgeContext = phaseKnowledge;
          await gemini.forceReconnect(newPhase, context.getCondensedContext());
        }
        sendToClient('phase', { phase: newPhase });
        break;

      case 'stop':
        console.log('[WS] Stopping session');
        if (gemini) gemini.close();
        sendToClient('status', { state: 'stopped' });
        break;

      default:
        console.log('[WS] Unknown message type:', msg.type);
    }
  });

  clientWs.on('close', () => {
    console.log('[WS] Client disconnected');
    if (gemini) gemini.close();
  });
});

// ─── Start ───

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n  🔥 Thinking Foundry POC running at http://localhost:${PORT}\n`);
  console.log(`  Gemini API Key: ${process.env.GEMINI_API_KEY ? '✓ configured' : '✗ MISSING'}`);
  console.log(`  GitHub Token:   ${process.env.GITHUB_TOKEN ? '✓ configured' : '✗ MISSING'}`);
  console.log(`  Service Account:${process.env.GOOGLE_SERVICE_ACCOUNT ? ' ✓ configured' : ' ✗ MISSING'}`);
  console.log('');
});
