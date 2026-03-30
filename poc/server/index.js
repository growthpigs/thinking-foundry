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
const { SupabaseBuffer } = require('./supabase-buffer');
const { GitHubPersistence } = require('./github-persistence');
const { PhaseTransitionHandler } = require('./phase-transition');
const { FrameworkFetcher } = require('./framework-fetcher');
const { SttPipeline } = require('./stt-pipeline');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ─── REST Endpoints ───

app.get('/api/github-preview', async (req, res) => {
  const { owner, repo } = req.query;
  if (!owner || !repo) return res.json({ ok: false, error: 'Missing owner or repo' });

  try {
    const gh = new GitHubConnector();
    const readme = await gh.fetchReadme(owner, repo);
    const issues = await gh.fetchRecentIssues(owner, repo, 5);
    const summary = `${owner}/${repo} — README ${readme ? `(${readme.length} chars)` : '(none)'}, ${issues.length} open issues`;
    res.json({ ok: true, summary });
  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

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

  // Persistence layers (initialized on session-setup)
  let supabaseBuffer = null;
  let githubPersistence = null;
  let frameworkFetcher = null;
  let sttPipeline = null;
  let flushInterval = null;
  let phaseHandler = null;
  const FLUSH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

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

  /**
   * Batch-flush unflushed utterances from Supabase to GitHub.
   * Runs every 2 minutes. Coalesces notes and updates the phase issue.
   * Guard prevents concurrent flushes from overlapping.
   */
  let flushing = false;
  const flushToGitHub = async () => {
    if (!supabaseBuffer || !githubPersistence) return;
    if (flushing) return; // Prevent concurrent flushes
    flushing = true;

    try {
      const unflushed = await supabaseBuffer.getUnflushedUtterances();
      if (unflushed.length === 0) return;

      // Group by phase
      const byPhase = {};
      for (const u of unflushed) {
        if (!byPhase[u.phase]) byPhase[u.phase] = [];
        byPhase[u.phase].push(u);
      }

      for (const [phase, utterances] of Object.entries(byPhase)) {
        const phaseNum = parseInt(phase);
        let issue = githubPersistence.phaseIssues.get(phaseNum);

        // Create phase issue if it doesn't exist yet
        if (!issue) {
          const sessionName = `Session ${new Date().toLocaleDateString()}`;
          issue = await githubPersistence.createPhaseIssue(sessionName, phaseNum);
        }

        // Coalesce and update
        const notes = GitHubPersistence.coalesceNotes(utterances);
        await githubPersistence.updatePhaseIssue(issue.number, notes);
      }

      // Mark all as flushed
      const ids = unflushed.map(u => u.id);
      await supabaseBuffer.markFlushed(ids);

      // Update session's github_issues reference
      await supabaseBuffer.updateGitHubIssues(githubPersistence.getSessionIssues());

      console.log(`[FLUSH] Flushed ${unflushed.length} utterances to GitHub`);
    } catch (err) {
      console.error(`[FLUSH] Error: ${err.message}`);
    } finally {
      flushing = false;
    }
  };

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
      frameworkFetcher: frameworkFetcher || null,
      toolDeclarations: frameworkFetcher ? FrameworkFetcher.getGeminiFunctionDeclarations() : [],

      onTranscript: (role, text) => {
        context.addUtterance(role, text);
        sendToClient('transcript', { role, text });

        // Write to Supabase in real-time (<50ms target)
        if (supabaseBuffer) {
          supabaseBuffer.writeUtterance(
            session.currentPhase,
            role === 'model' ? 'ai' : 'user',
            text
          ).catch(err => console.error('[SUPABASE] Write error:', err.message));
        }

        // Check AI responses for phase transition signals (Article 10)
        if (role === 'model' && phaseHandler) {
          const result = phaseHandler.processAiUtterance(text, session.currentPhase);
          if (result?.blocked) {
            sendToClient('phase_blocked', { reason: result.reason, confidence: result.confidence });
          }
          // If transition detected, onTransition callback handles everything
        }
      },

      onAudio: (audioBase64) => {
        sendToClient('audio', { data: audioBase64 });
      },

      onInterrupted: () => {
        console.log('[GEMINI] Barge-in detected — clearing client playback');
        sendToClient('interrupted', {});
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
      // Binary audio data — fork to Gemini AND STT
      if (gemini) gemini.sendAudio(raw);
      if (sttPipeline) sttPipeline.feedAudio(raw);
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

        // Initialize AI-driven phase transition handler (Article 10)
        phaseHandler = new PhaseTransitionHandler({
          onTransition: async (fromPhase, toPhase, meta) => {
            console.log(`[PHASE] AI-driven transition: ${fromPhase} → ${toPhase} (confidence: ${meta.confidence || 'N/A'})`);

            // Orchestrate the full transition
            session.setPhase(toPhase);

            if (supabaseBuffer) {
              await flushToGitHub();
              if (meta.squeezeNotes) {
                await supabaseBuffer.saveCarryForward(
                  fromPhase, meta.squeezeNotes, meta.confidence, meta.squeezeNotes,
                  githubPersistence?.phaseIssues.get(fromPhase)?.url || null
                ).catch(err => console.error('[SUPABASE] Carry-forward error:', err.message));
              }
              await supabaseBuffer.updatePhase(toPhase);
            }

            if (githubPersistence) {
              const oldIssue = githubPersistence.phaseIssues.get(fromPhase);
              if (oldIssue) {
                await githubPersistence.closePhaseIssue(oldIssue.number)
                  .catch(err => console.error('[GITHUB] Close error:', err.message));
              }
              const sessionName = `Session ${new Date().toLocaleDateString()}`;
              await githubPersistence.createPhaseIssue(sessionName, toPhase)
                .catch(err => console.error('[GITHUB] Create error:', err.message));
            }

            // Reconnect Gemini with new phase context
            if (gemini) {
              const phaseKnowledge = await knowledgeLoader.load({
                phase: toPhase,
                frameworks: sessionFrameworks.length > 0 ? sessionFrameworks : undefined,
                fullContent: false,
                githubContext: sessionGithubContext || undefined,
                driveContext: sessionDriveContext || undefined,
              });
              gemini.knowledgeContext = phaseKnowledge;
              await gemini.forceReconnect(toPhase, context.getCondensedContext());
            }

            sendToClient('phase', { phase: toPhase, fromPhase, confidence: meta.confidence, aiDriven: true });
          },
        });

        // Initialize persistence layers
        try {
          if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
            supabaseBuffer = new SupabaseBuffer();
            const accessToken = msg.accessToken || `session_${Date.now()}`;
            await supabaseBuffer.startSession(accessToken);
            console.log('[SETUP] Supabase buffer initialized');
          }
        } catch (err) {
          console.warn('[SETUP] Supabase init failed (continuing without):', err.message);
          supabaseBuffer = null;
        }

        try {
          if (process.env.GITHUB_TOKEN) {
            githubPersistence = new GitHubPersistence();
            console.log('[SETUP] GitHub persistence initialized');

            // Start flush interval (every 2 min)
            flushInterval = setInterval(flushToGitHub, FLUSH_INTERVAL_MS);
          }
        } catch (err) {
          console.warn('[SETUP] GitHub persistence init failed (continuing without):', err.message);
          githubPersistence = null;
        }

        // Initialize framework JIT fetcher (Article 12)
        try {
          if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
            frameworkFetcher = new FrameworkFetcher();
            console.log('[SETUP] Framework fetcher initialized');
          }
        } catch (err) {
          console.warn('[SETUP] Framework fetcher init failed (continuing without):', err.message);
          frameworkFetcher = null;
        }

        // Initialize STT pipeline for user speech transcription
        try {
          if (process.env.DEEPGRAM_API_KEY) {
            sttPipeline = new SttPipeline();
            sttPipeline.onTranscript((text, isFinal) => {
              if (!text) return;
              // Send transcript to client for real-time display
              sendToClient('user_transcript', { text, isFinal });
              // Write final transcripts to Supabase
              if (isFinal && text.trim() && supabaseBuffer) {
                supabaseBuffer.writeUtterance(
                  session.currentPhase, 'user', text.trim()
                ).catch(err => console.error('[STT] Supabase write error:', err.message));
              }
            });
            sttPipeline.onError((err) => {
              console.error('[STT] Pipeline error:', err.message || err);
            });
            await sttPipeline.startStream();
            console.log('[SETUP] STT pipeline initialized (Deepgram)');
          }
        } catch (err) {
          console.warn('[SETUP] STT pipeline init failed (continuing without):', err.message);
          sttPipeline = null;
        }

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
        // Base64-encoded audio from client — fork to Gemini AND STT
        if (gemini) gemini.sendAudioBase64(msg.data);
        if (sttPipeline) sttPipeline.feedAudioBase64(msg.data);
        break;

      case 'phase':
        // Manual phase advance — delegate to PhaseTransitionHandler
        // which fires the same onTransition callback (no duplicated logic)
        console.log(`[WS] Manual phase change requested: ${session.currentPhase} → ${msg.phase}`);
        if (phaseHandler) {
          const result = phaseHandler.manualTransition(session.currentPhase, msg.phase);
          if (result?.blocked) {
            sendToClient('phase_blocked', { reason: result.reason });
          }
          // onTransition callback handles all persistence + Gemini reconnection
        } else {
          // Fallback: no phase handler, just update state and reconnect
          session.setPhase(msg.phase);
          if (gemini) {
            const phaseKnowledge = await knowledgeLoader.load({
              phase: msg.phase,
              frameworks: sessionFrameworks.length > 0 ? sessionFrameworks : undefined,
              fullContent: false,
              githubContext: sessionGithubContext || undefined,
              driveContext: sessionDriveContext || undefined
            });
            gemini.knowledgeContext = phaseKnowledge;
            await gemini.forceReconnect(msg.phase, context.getCondensedContext());
          }
          sendToClient('phase', { phase: msg.phase });
        }
        break;

      case 'pause':
        console.log('[WS] Session paused');
        if (supabaseBuffer) {
          await supabaseBuffer.pauseSession()
            .catch(err => console.error('[SUPABASE] Pause error:', err.message));
        }
        sendToClient('status', { state: 'paused' });
        break;

      case 'resume':
        console.log('[WS] Session resumed');
        if (supabaseBuffer) {
          await supabaseBuffer.resumeSession()
            .catch(err => console.error('[SUPABASE] Resume error:', err.message));
        }
        sendToClient('status', { state: 'resumed' });
        break;

      case 'stop':
        console.log('[WS] Stopping session');

        // Final flush + cleanup
        if (flushInterval) clearInterval(flushInterval);
        await flushToGitHub(); // Final flush

        if (githubPersistence) {
          // Close the current phase issue
          const currentIssue = githubPersistence.phaseIssues.get(session.currentPhase);
          if (currentIssue) {
            await githubPersistence.closePhaseIssue(currentIssue.number)
              .catch(err => console.error('[GITHUB] Close error:', err.message));
          }
          // Cross-reference all session issues
          const allIssues = githubPersistence.getSessionIssues();
          if (allIssues.length > 1) {
            await githubPersistence.linkSessionIssues(allIssues)
              .catch(err => console.error('[GITHUB] Link error:', err.message));
          }
        }

        if (supabaseBuffer) {
          await supabaseBuffer.endSession()
            .catch(err => console.error('[SUPABASE] End error:', err.message));
        }

        if (sttPipeline) {
          await sttPipeline.stopStream().catch(() => {});
        }
        if (gemini) gemini.close();
        sendToClient('status', { state: 'stopped' });
        break;

      default:
        console.log('[WS] Unknown message type:', msg.type);
    }
  });

  clientWs.on('close', async () => {
    console.log('[WS] Client disconnected');
    if (flushInterval) clearInterval(flushInterval);
    if (sttPipeline) {
      sttPipeline.stopStream().catch(() => {});
    }

    // Best-effort final flush on disconnect
    try { await flushToGitHub(); } catch (err) {
      console.warn('[WS] Final flush on disconnect failed:', err.message);
    }

    if (supabaseBuffer) {
      try { await supabaseBuffer.endSession(); } catch (err) {
        console.warn('[WS] End session on disconnect failed:', err.message);
      }
    }

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
  console.log(`  Supabase URL:   ${process.env.SUPABASE_URL ? '✓ configured' : '✗ MISSING (session persistence disabled)'}`);
  console.log(`  Supabase Key:   ${process.env.SUPABASE_KEY ? '✓ configured' : '✗ MISSING (session persistence disabled)'}`);
  console.log(`  Deepgram Key:   ${process.env.DEEPGRAM_API_KEY ? '✓ configured' : '✗ MISSING (user STT disabled)'}`);
  console.log('');
});
