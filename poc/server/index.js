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
const { SupabaseBuffer } = require('./supabase-buffer');
const { GitHubPersistence } = require('./github-persistence');

// ── Condensation thresholds (bullet point generation) ──
const MIN_AI_TEXT_LENGTH = 30;
const MIN_BULLET_COMBINE_LENGTH = 40;
const MAX_BULLET_LENGTH = 80;
const MIN_USER_TEXT_LENGTH = 10;
const MIN_USER_BULLET_COMBINE = 30;
const SUBSTANTIAL_BUFFER_THRESHOLD = 50;
const MAX_CONTEXT_INJECTION_LENGTH = 10000;
const { PhaseTransitionHandler } = require('./phase-transition');
const { FrameworkFetcher } = require('./framework-fetcher');
const { SttPipeline } = require('./stt-pipeline');
const { LinkAuth } = require('./link-auth');
const { EmailAuth } = require('./email-auth');
const { CrucibleAudio } = require('./crucible-audio');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const cors = require('cors');
const ALLOWED_ORIGINS = [
  'https://frontend-jet-psi-12.vercel.app',
  'https://thinking-foundry-production.up.railway.app',
  'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json());

// Link-based auth (routes registered before static to take priority)
let linkAuth = null;
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    linkAuth = new LinkAuth({
      baseUrl: process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : (process.env.BASE_URL || ''),
    });
    linkAuth.registerRoutes(app, path.join(__dirname, '..', 'public'));
    const keySource = process.env.ADMIN_API_KEY ? 'from env' : 'auto-generated';
    console.log(`[AUTH] Link auth initialized (admin key: ${keySource}${keySource === 'auto-generated' ? ' — ' + linkAuth.getAdminKey() : ''})`);
  }
} catch (err) {
  console.warn('[AUTH] Link auth init failed:', err.message);
}

// Email auth (magic link + PIN + device cookie)
try {
  if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
    const emailAuth = new EmailAuth({
      baseUrl: process.env.RAILWAY_PUBLIC_DOMAIN
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : (process.env.BASE_URL || ''),
    });
    emailAuth.registerRoutes(app);

    // Session creation route (after PIN verified)
    // Protected: only accepts requests with a valid email that's in the whitelist
    app.get('/session/new', async (req, res) => {
      const nonce = req.query.nonce || '';
      const userEmail = (req.query.email || '').toLowerCase().trim();

      // Verify session nonce — proves PIN was verified (prevents direct URL bypass)
      const verifiedEmail = emailAuth.verifySessionNonce(nonce);
      if (!verifiedEmail || verifiedEmail !== userEmail) {
        return res.status(403).send('Session expired or unauthorized. Please log in via the homepage.');
      }

      if (linkAuth) {
        const link = await linkAuth.createLink({ label: userEmail, email: userEmail });
        res.redirect('/s/' + link.token);
      } else {
        const token = require('crypto').randomUUID();
        res.redirect('/s/' + token);
      }
    });

    // Admin whitelist management
    app.post('/admin/invite', async (req, res) => {
      const apiKey = req.headers['x-api-key'];
      if (!linkAuth || !linkAuth.isAdminKey(apiKey)) {
        return res.status(401).json({ error: 'Invalid admin key' });
      }
      const { email } = req.body || {};
      if (!email || !email.includes('@')) {
        return res.json({ success: false, message: 'Invalid email' });
      }
      try {
        await emailAuth.addAllowedEmail(email);
        res.json({ success: true, message: 'User invited: ' + email });
      } catch (err) {
        console.error('[AUTH] Invite error:', err.message);
        res.json({ success: false, message: 'Failed to invite: ' + err.message });
      }
    });

    app.delete('/admin/invite', async (req, res) => {
      const apiKey = req.headers['x-api-key'];
      if (!linkAuth || !linkAuth.isAdminKey(apiKey)) {
        return res.status(401).json({ error: 'Invalid admin key' });
      }
      const { email } = req.body || {};
      if (!email) return res.json({ success: false, message: 'No email provided' });
      try {
        await emailAuth.removeAllowedEmail(email);
        res.json({ success: true, message: 'Removed: ' + email });
      } catch (err) {
        console.error('[AUTH] Remove error:', err.message);
        res.json({ success: false, message: 'Failed to remove: ' + err.message });
      }
    });

    app.get('/admin/whitelist', (req, res) => {
      const apiKey = req.headers['x-api-key'] || req.query.key;
      if (!linkAuth || !linkAuth.isAdminKey(apiKey)) {
        return res.status(401).json({ error: 'Invalid admin key' });
      }
      res.json({ emails: emailAuth.getAllowedEmails() });
    });

    console.log('[AUTH] Email auth initialized (magic link + PIN + whitelist)');
  }
} catch (err) {
  console.warn('[AUTH] Email auth init failed:', err.message);
}

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

// Legacy /api/drive/setup removed — Drive folders are now created
// automatically on first phase transition via the WebSocket session flow.

// ─── WebSocket (audio + control) ───

wss.on('connection', (clientWs, req) => {
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    console.log(`[WS] Rejected connection from origin: ${origin}`);
    clientWs.close(1008, 'Origin not allowed');
    return;
  }
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
  let crucibleAudio = null;
  let flushInterval = null;
  let phaseHandler = null;
  const FLUSH_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

  const sendToClient = (type, data) => {
    if (clientWs.readyState === clientWs.OPEN) {
      clientWs.send(JSON.stringify({ type, ...data }));
    }
  };

  // --- Outline Item Condensation (Option D-Fixed) ---
  let aiTurnBuffer = '';

  function flushAiTurnBuffer() {
    const text = aiTurnBuffer.trim();
    aiTurnBuffer = '';
    if (text.length < MIN_AI_TEXT_LENGTH) return;

    // Strip internal signals before creating bullet
    const cleaned = text
      .replace(/\[MODE:\w+\]/gi, '')
      .replace(/\[PHASE_COMPLETE\]/gi, '')
      .replace(/\[SYSTEM\][^\n]*/gi, '')
      .trim();
    if (cleaned.length < MIN_AI_TEXT_LENGTH) return;

    // Take FIRST sentence — prompts enforce insight-first, question-last
    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    let bullet = sentences[0] || cleaned;

    // If first sentence is very short, concatenate first two
    if (bullet.length < MIN_BULLET_COMBINE_LENGTH && sentences.length > 1) {
      bullet = sentences[0] + ' ' + sentences[1];
    }

    // Cap at ~80 chars
    if (bullet.length > MAX_BULLET_LENGTH) {
      bullet = bullet.substring(0, MAX_BULLET_LENGTH - 3) + '...';
    }

    sendToClient('outline_item', { speaker: 'ai', text: bullet, phase: session.currentPhase });

    // Persist as key point
    if (supabaseBuffer) {
      supabaseBuffer.writeUtterance(session.currentPhase, 'ai', bullet, true)
        .catch(err => console.error('[OUTLINE] Supabase write error:', err.message));
    }
  }

  // Accumulate user speech into complete thoughts (Deepgram fires many isFinals per turn)
  let userTurnBuffer = '';
  let userFlushTimer = null;

  function condensUserTranscript(text) {
    if (!text || text.trim().length < 3) return;
    userTurnBuffer += text.trim() + ' ';

    // Flush after 2 seconds of silence (user stopped speaking)
    clearTimeout(userFlushTimer);
    userFlushTimer = setTimeout(flushUserTurnBuffer, 2000);
  }

  function flushUserTurnBuffer() {
    clearTimeout(userFlushTimer);
    const text = userTurnBuffer.trim();
    userTurnBuffer = '';
    if (text.length < MIN_USER_TEXT_LENGTH) return;

    const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
    let bullet = sentences[0] || text;
    if (bullet.length < MIN_USER_BULLET_COMBINE && sentences.length > 1) bullet = sentences[0] + ' ' + sentences[1];
    if (bullet.length > MAX_BULLET_LENGTH) bullet = bullet.substring(0, MAX_BULLET_LENGTH - 3) + '...';

    sendToClient('outline_item', { speaker: 'user', text: bullet, phase: session.currentPhase });

    if (supabaseBuffer) {
      supabaseBuffer.writeUtterance(session.currentPhase, 'user', bullet, true)
        .catch(function(err) { console.error('[OUTLINE] Supabase write error:', err.message); });
    }
  };

  let serverPaused = false;
  let driveManager = null;

  // Stores session-level external context fetched during setup
  let sessionGithubContext = '';
  let sessionDocContext = '';
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
  /**
   * Fetch external context from GitHub based on setup config.
   */
  async function fetchExternalContext(config) {
    const { github, frameworks } = config;
    let githubContext = '';

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

    return { githubContext, frameworks: frameworks || [] };
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
      driveContext: sessionDocContext || undefined
    });

    gemini = new GeminiLiveManager({
      apiKey: process.env.GEMINI_API_KEY,
      phase: session.currentPhase,
      contextSummary: context.getCondensedContext(),
      knowledgeContext,
      frameworkFetcher: frameworkFetcher || null,
      toolDeclarations: frameworkFetcher ? FrameworkFetcher.getGeminiFunctionDeclarations() : [],

      onTurnComplete: () => {
        // AI finished speaking — flush accumulated text as condensed bullet
        flushAiTurnBuffer();
        sendToClient('turn_complete', {});
      },

      onTranscript: (role, text) => {
        context.addUtterance(role, text);

        if (role === 'model') {
          // Accumulate AI text — don't send raw to client
          aiTurnBuffer += text + ' ';
          // Still write raw to Supabase for full persistence
          if (supabaseBuffer) {
            supabaseBuffer.writeUtterance(session.currentPhase, 'ai', text)
              .catch(err => console.error('[SUPABASE] Write error:', err.message));
          }
        } else {
          // User text — write raw to Supabase
          if (supabaseBuffer) {
            supabaseBuffer.writeUtterance(session.currentPhase, 'user', text)
              .catch(err => console.error('[SUPABASE] Write error:', err.message));
          }
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
        // Flush partial buffer if substantial, otherwise discard
        if (aiTurnBuffer.trim().length > SUBSTANTIAL_BUFFER_THRESHOLD) {
          flushAiTurnBuffer();
        } else {
          aiTurnBuffer = '';
        }
        sendToClient('interrupted', {});
      },

      onReconnecting: () => {
        console.log('[GEMINI] Reconnection starting...');
        // Flush any accumulated buffer before reconnecting
        if (aiTurnBuffer.trim().length > 30) flushAiTurnBuffer();
        else aiTurnBuffer = '';
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
      // Binary audio data — fork to Gemini AND STT (gated by pause)
      if (!serverPaused && gemini) gemini.sendAudio(raw);
      if (!serverPaused && sttPipeline) sttPipeline.feedAudio(raw);
      return;
    }

    try {
    switch (msg.type) {
      case 'session-setup':
        // Guard against double-setup (client reconnect, duplicate messages)
        if (gemini) {
          console.warn('[WS] Ignoring duplicate session-setup (already initialized)');
          break;
        }
        // New setup flow: fetch external context + uploaded docs, then start Gemini
        console.log('[WS] Session setup received:', {
          github: msg.github || '(none)',
          documents: msg.documents ? `${msg.documents.length} files` : '(none)',
          frameworks: msg.frameworks || []
        });

        // Initialize AI-driven phase transition handler (Article 10)
        phaseHandler = new PhaseTransitionHandler({
          onModeDetected: async (mode, minConfidence) => {
            console.log(`[SESSION] Intent mode: ${mode} (confidence threshold: ${minConfidence})`);
            sendToClient('intent_mode', { mode, minConfidence });
            if (supabaseBuffer) {
              const sess = await supabaseBuffer.getSession();
              const metadata = { ...(sess?.metadata || {}), intent_mode: mode };
              const { error: modeErr } = await supabaseBuffer.supabase
                .from('sessions')
                .update({ metadata })
                .eq('id', supabaseBuffer.sessionId);
              if (modeErr) console.error('[SUPABASE] Mode update error:', modeErr.message);
            }
          },
          onSqueezeNeeded: async (currentPhase) => {
            // NOTE: Cannot inject text prompts into Gemini AUDIO-only mode (error 1007).
            // The AI handles squeeze naturally via the system prompt which tells it to
            // state confidence before transitioning. We just log and let it proceed.
            console.log(`[SQUEEZE] Phase ${currentPhase} squeeze needed — AI handles via system prompt`);
          },
          onTransition: async (fromPhase, toPhase, meta) => {
            console.log(`[PHASE] AI-driven transition: ${fromPhase} → ${toPhase} (confidence: ${meta.confidence || 'N/A'})`);

            // Orchestrate the full transition
            session.setPhase(toPhase);

            // Build carry-forward text from squeeze notes or synthesize from recent context
            const carryForwardText = meta.squeezeNotes
              || context.getCondensedContext()
              || 'No carry-forward generated for this phase.';

            if (supabaseBuffer) {
              await flushToGitHub();
              // Save carry-forward to Supabase (Article 8)
              await supabaseBuffer.saveCarryForward(
                fromPhase, carryForwardText, meta.confidence, meta.squeezeNotes || null,
                githubPersistence?.phaseIssues.get(fromPhase)?.url || null
              ).catch(err => console.error('[SUPABASE] Carry-forward error:', err.message));
              await supabaseBuffer.updatePhase(toPhase);
            }

            if (githubPersistence) {
              const oldIssue = githubPersistence.phaseIssues.get(fromPhase);
              if (oldIssue) {
                // Add carry-forward to the closing issue (Article 8)
                await githubPersistence.addCarryForward(
                  oldIssue.number, carryForwardText, meta.confidence, meta.squeezeNotes
                ).catch(err => console.error('[GITHUB] Carry-forward error:', err.message));
                await githubPersistence.closePhaseIssue(oldIssue.number)
                  .catch(err => console.error('[GITHUB] Close error:', err.message));
              }
              const sessionName = `Session ${new Date().toLocaleDateString()}`;
              await githubPersistence.createPhaseIssue(sessionName, toPhase)
                .catch(err => console.error('[GITHUB] Create error:', err.message));
            }

            // Retrieve previous carry-forward to inject into next phase
            let prevCarryForward = '';
            if (supabaseBuffer) {
              const cf = await supabaseBuffer.getCarryForward(fromPhase);
              prevCarryForward = cf?.carry_forward || '';
            }

            // Reconnect Gemini with new phase context + carry-forward
            if (gemini) {
              let phaseKnowledge = await knowledgeLoader.load({
                phase: toPhase,
                frameworks: sessionFrameworks.length > 0 ? sessionFrameworks : undefined,
                fullContent: false,
                githubContext: sessionGithubContext || undefined,
                driveContext: sessionDocContext || undefined,
              });
              // Inject carry-forward into knowledge context
              if (prevCarryForward) {
                phaseKnowledge = `--- CARRY-FORWARD FROM PREVIOUS PHASE ---\n${prevCarryForward}\n--- END CARRY-FORWARD ---\n\n${phaseKnowledge}`;
              }
              gemini.knowledgeContext = phaseKnowledge;
              await gemini.forceReconnect(toPhase, context.getCondensedContext());
            }

            // Forward sync to Google Drive — create folders on first transition, then write
            if (driveManager) {
              try {
                // Lazy-create session folders on first phase transition
                if (!driveManager.sessionFolderId) {
                  const driveResult = await driveManager.createSessionWithPhases(
                    driveManager._sessionLabel, driveManager._userEmail
                  );
                  console.log(`[DRIVE] Session folder created on first transition: ${driveResult.sessionFolderUrl}`);
                  sendToClient('drive_status', { connected: true, folderUrl: driveResult.sessionFolderUrl });
                }
                const result = await driveManager.writePhaseDoc(fromPhase, carryForwardText, {
                  confidence: meta.confidence,
                  squeezeNotes: meta.squeezeNotes
                });
                if (result) {
                  const { PHASE_NAMES } = require('./drive-manager');
                  sendToClient('drive_sync', { phase: fromPhase, phaseName: PHASE_NAMES[fromPhase] });
                }
              } catch (err) {
                console.error('[DRIVE] Phase doc write failed:', err.message);
              }
            }

            sendToClient('phase', { phase: toPhase, fromPhase, confidence: meta.confidence, aiDriven: true });
          },
        });

        // Token already validated at GET /s/:token — just use it for session ID
        const accessToken = msg.accessToken || `session_${Date.now()}`;

        // Initialize persistence layers
        try {
          if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
            supabaseBuffer = new SupabaseBuffer();
            await supabaseBuffer.startSession(accessToken);
            // Mark link token as used (single-use enforcement)
            if (linkAuth && msg.accessToken) {
              linkAuth.markUsed(msg.accessToken, supabaseBuffer.sessionId);
            }
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

        // Initialize Google Drive — init only, create folders on first phase transition
        if (DriveManager.isConfigured()) {
          try {
            driveManager = new DriveManager();
            await driveManager.init();
            // Store email for later folder sharing (created on first phase transition)
            driveManager._sessionLabel = msg.label || 'Thinking Session';
            driveManager._userEmail = msg.userEmail || null;
            console.log('[DRIVE] Initialized (folders created on first phase transition)');
            sendToClient('drive_status', { connected: true });
          } catch (err) {
            console.warn('[DRIVE] Init failed (continuing without):', err.message);
            driveManager = null;
            sendToClient('drive_status', { connected: false, error: err.message });
          }
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

        // Initialize Crucible audio (Article 19-20)
        try {
          if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
            crucibleAudio = new CrucibleAudio();
            console.log('[SETUP] Crucible audio initialized');
          }
        } catch (err) {
          console.warn('[SETUP] Crucible audio init failed (continuing without):', err.message);
          crucibleAudio = null;
        }

        // Initialize STT pipeline for user speech transcription
        try {
          if (process.env.DEEPGRAM_API_KEY) {
            sttPipeline = new SttPipeline();
            sttPipeline.onTranscript((text, isFinal) => {
              if (!text || !text.trim()) return;
              // Only emit condensed bullet for final transcripts
              if (isFinal) {
                condensUserTranscript(text);
                // Also write raw to Supabase
                if (supabaseBuffer) {
                  supabaseBuffer.writeUtterance(session.currentPhase, 'user', text.trim())
                    .catch(err => console.error('[STT] Supabase write error:', err.message));
                }
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
            sessionDocContext = docSections.join('\n');
            console.log(`[SETUP] Document context: ${sessionDocContext.length} chars from ${msg.documents.length} files`);
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
        // Base64-encoded audio from client — fork to Gemini AND STT (gated by pause)
        if (!serverPaused && gemini) gemini.sendAudioBase64(msg.data);
        if (!serverPaused && sttPipeline) sttPipeline.feedAudioBase64(msg.data);
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
            let phaseKnowledge = await knowledgeLoader.load({
              phase: msg.phase,
              frameworks: sessionFrameworks.length > 0 ? sessionFrameworks : undefined,
              fullContent: false,
              githubContext: sessionGithubContext || undefined,
              driveContext: sessionDocContext || undefined
            });
            gemini.knowledgeContext = phaseKnowledge;
            await gemini.forceReconnect(msg.phase, context.getCondensedContext());
          }
          sendToClient('phase', { phase: msg.phase });
        }
        break;

      case 'pause':
        console.log('[WS] Session paused');
        serverPaused = true;
        if (supabaseBuffer) {
          await supabaseBuffer.pauseSession()
            .catch(err => console.error('[SUPABASE] Pause error:', err.message));
        }
        sendToClient('status', { state: 'paused' });
        break;

      case 'resume':
        console.log('[WS] Session resumed');
        serverPaused = false;
        if (supabaseBuffer) {
          await supabaseBuffer.resumeSession()
            .catch(err => console.error('[SUPABASE] Resume error:', err.message));
        }
        // Reconnect Gemini if the connection died during pause
        if (gemini && (!gemini.activeWs || gemini.activeWs.readyState !== 1)) {
          console.log('[WS] Gemini connection lost during pause — reconnecting');
          sendToClient('status', { state: 'reconnecting' });
          try {
            await gemini.forceReconnect(session.currentPhase, context.getCondensedContext());
            sendToClient('status', { state: 'connected' });
          } catch (err) {
            console.error('[WS] Gemini reconnect failed:', err.message);
            sendToClient('error', { message: 'Failed to reconnect AI. Try ending and starting a new session.' });
          }
        } else {
          sendToClient('status', { state: 'resumed' });
        }
        break;

      case 'add-context':
        // Mid-session text/document context — store for next Gemini reconnection
        // NOTE: Cannot inject text directly into AUDIO-only Gemini Live sessions
        // (causes error 1007). Instead, add to context manager so it's included
        // in the next phase transition or reconnection's system prompt.
        if (Array.isArray(msg.documents) && msg.documents.length > 0) {
          const contextParts = msg.documents
            .filter(d => d && d.content)
            .map(d => `[User shared: ${d.name || 'document'}]\n${d.content}`)
            .join('\n\n');
          const truncated = contextParts.length > MAX_CONTEXT_INJECTION_LENGTH
            ? contextParts.substring(0, 9997) + '...'
            : contextParts;

          // Add to context manager (picked up on next reconnect/phase change)
          context.addUtterance('user', truncated);
          console.log(`[WS] Stored mid-session context: ${msg.documents.length} doc(s), ${truncated.length} chars (applied on next reconnect)`);

          // Persist to Supabase
          if (supabaseBuffer) {
            supabaseBuffer.writeUtterance(session.currentPhase, 'user', truncated)
              .catch(err => console.error('[SUPABASE] Context write error:', err.message));
          }

          sendToClient('outline_item', {
            speaker: 'system',
            text: 'Context saved. It will be included at the next phase transition.',
            phase: session.currentPhase
          });
        }
        break;

      case 'generate_crucible':
        // Article 19: Offered, Not Forced. User chose to generate.
        console.log('[WS] Crucible audio generation requested');
        if (!crucibleAudio || !supabaseBuffer?.sessionId) {
          sendToClient('crucible_failed', {
            error: 'Crucible audio not available',
            message: 'Audio generation failed. Your session is still saved in GitHub.'
          });
          break;
        }
        sendToClient('crucible_status', { status: 'generating' });
        crucibleAudio.generateCrucibleAudio(
          supabaseBuffer.sessionId,
          msg.sessionName || 'Thinking Session'
        ).then(result => {
          sendToClient('crucible_ready', { audioUrl: result.audioUrl, status: 'ready' });
        }).catch(err => {
          sendToClient('crucible_failed', {
            error: err.message,
            message: 'Audio generation failed. Your session is still saved in GitHub.'
          });
        });
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
    } catch (err) {
      console.error('[WS] Message handler error:', err.message, err.stack?.split('\n')[1]);
      sendToClient('error', { message: 'Internal error: ' + err.message });
    }
  });

  clientWs.on('close', async () => {
    console.log('[WS] Client disconnected');
    if (flushInterval) clearInterval(flushInterval);
    clearTimeout(userFlushTimer);
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

// ─── Crucible Audio Auth Restoration ───
CrucibleAudio.restoreAuth();

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
