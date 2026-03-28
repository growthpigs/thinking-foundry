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
const { GitHubConnector } = require('../context/github-connector');
const { DriveConnector } = require('../context/drive-connector');

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

  // Stores session-level external context fetched during setup
  let sessionGithubContext = '';
  let sessionDriveContext = '';
  let sessionFrameworks = [];

  /**
   * Parse a GitHub URL into owner/repo.
   * Handles https://github.com/owner/repo and variants.
   */
  function parseGitHubUrl(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.replace(/^\//, '').replace(/\/$/, '').split('/');
      if (parts.length >= 2) {
        return { owner: parts[0], repo: parts[1] };
      }
    } catch {
      // not a valid URL
    }
    return null;
  }

  /**
   * Parse a Google Drive URL into a file/folder ID.
   * Handles various Drive URL formats.
   */
  function parseDriveUrl(url) {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      // Format: /drive/folders/ID or /file/d/ID or /document/d/ID
      const folderMatch = parsed.pathname.match(/\/folders\/([a-zA-Z0-9_-]+)/);
      if (folderMatch) return { type: 'folder', id: folderMatch[1] };

      const fileMatch = parsed.pathname.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (fileMatch) return { type: 'file', id: fileMatch[1] };
    } catch {
      // not a valid URL
    }
    return null;
  }

  /**
   * Fetch external context from GitHub and/or Drive based on setup config.
   */
  async function fetchExternalContext(config) {
    const { github, drive, frameworks } = config;
    let githubContext = '';
    let driveContext = '';

    // Fetch GitHub context
    if (github) {
      const parsed = parseGitHubUrl(github);
      if (parsed) {
        try {
          const gh = new GitHubConnector();
          githubContext = await gh.fetchRepoContext(parsed.owner, parsed.repo);
          console.log(`[SETUP] GitHub context fetched: ${githubContext.length} chars`);
        } catch (err) {
          console.warn(`[SETUP] GitHub fetch failed (continuing without):`, err.message);
        }
      } else {
        console.warn(`[SETUP] Could not parse GitHub URL: ${github}`);
      }
    }

    // Fetch Drive context
    if (drive) {
      const parsed = parseDriveUrl(drive);
      if (parsed) {
        try {
          const driveConn = new DriveConnector();
          if (parsed.type === 'folder') {
            driveContext = await driveConn.fetchFolderContext(parsed.id);
          } else {
            const content = await driveConn.fetchDocContent(parsed.id);
            driveContext = content || '';
          }
          console.log(`[SETUP] Drive context fetched: ${driveContext.length} chars`);
        } catch (err) {
          console.warn(`[SETUP] Drive fetch failed (continuing without):`, err.message);
        }
      } else {
        console.warn(`[SETUP] Could not parse Drive URL: ${drive}`);
      }
    }

    return { githubContext, driveContext, frameworks: frameworks || [] };
  }

  const startGemini = async () => {
    // Load knowledge context for current phase, including external context and selected frameworks
    const knowledgeContext = await knowledgeLoader.load({
      phase: session.currentPhase,
      frameworks: sessionFrameworks.length > 0 ? sessionFrameworks : undefined,
      fullContent: false,
      githubContext: sessionGithubContext || undefined,
      driveContext: sessionDriveContext || undefined
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
      case 'session-setup':
        // New setup flow: fetch external context + uploaded docs, then start Gemini
        console.log('[WS] Session setup received:', {
          github: msg.github || '(none)',
          documents: msg.documents ? `${msg.documents.length} files` : '(none)',
          frameworks: msg.frameworks || []
        });

        try {
          const external = await fetchExternalContext({
            github: msg.github,
            drive: null,
            frameworks: msg.frameworks
          });
          sessionGithubContext = external.githubContext;
          sessionFrameworks = external.frameworks;

          // Handle uploaded documents as additional context
          if (msg.documents && msg.documents.length > 0) {
            const docSections = ['--- Uploaded Documents ---'];
            for (const doc of msg.documents) {
              const truncated = doc.content.length > 5000
                ? doc.content.substring(0, 5000) + '\n...[truncated]'
                : doc.content;
              docSections.push(`\n--- ${doc.name} ---`);
              docSections.push(truncated);
            }
            sessionDriveContext = docSections.join('\n');
            console.log(`[SETUP] Document context: ${sessionDriveContext.length} chars from ${msg.documents.length} files`);
          }
        } catch (err) {
          console.warn('[SETUP] External context fetch error (continuing):', err.message);
        }

        // Start Gemini with all context loaded
        await startGemini();
        break;

      case 'start':
        // Legacy start message (backwards compat)
        console.log('[WS] Starting session (legacy)');
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
          // Reload knowledge context for new phase, preserving session context
          const phaseKnowledge = await knowledgeLoader.load({
            phase: newPhase,
            frameworks: sessionFrameworks.length > 0 ? sessionFrameworks : undefined,
            fullContent: false,
            githubContext: sessionGithubContext || undefined,
            driveContext: sessionDriveContext || undefined
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
