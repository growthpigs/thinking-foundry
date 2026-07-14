/**
 * Gemini Live API WebSocket Manager
 *
 * Handles the bidirectional streaming connection to Gemini 3.1 Flash Live.
 * CRITICAL: Implements the 15-minute reconnection logic.
 *
 * Gemini Live API uses a WebSocket-based protocol:
 * 1. Client opens WS connection
 * 2. Client sends BidiGenerateContentSetup (system instruction, config)
 * 3. Client streams audio as BidiGenerateContentClientContent
 * 4. Server streams back audio + text as BidiGenerateContentServerContent
 */

const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

// Reconnection timing constants
const RECONNECT_PREPARE_MS = 13 * 60 * 1000;   // 13:00 — start preparing new connection
const RECONNECT_SETUP_MS = 13.5 * 60 * 1000;   // 13:30 — send setup to new connection
const RECONNECT_SWAP_MS = 14 * 60 * 1000;       // 14:00 — swap to new connection

const GEMINI_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

class GeminiLiveManager {
  constructor(opts) {
    this.apiKey = opts.apiKey;
    this.phase = opts.phase || 0;
    this.contextSummary = opts.contextSummary || '';
    this.knowledgeContext = opts.knowledgeContext || '';

    // Framework JIT (Article 12)
    this.frameworkFetcher = opts.frameworkFetcher || null;
    this.toolDeclarations = opts.toolDeclarations || [];

    // Session control tools (advance_phase, set_intent_mode): routed to this
    // handler instead of the framework fetcher. Return value becomes the tool
    // response the model hears.
    this.onControlCall = opts.onControlCall || null;
    this.controlToolNames = opts.controlToolNames || new Set();

    // Callbacks
    this.onTranscript = opts.onTranscript || (() => {});
    this.onAudio = opts.onAudio || (() => {});
    this.onInterrupted = opts.onInterrupted || (() => {});
    this.onReconnecting = opts.onReconnecting || (() => {});
    this.onReconnected = opts.onReconnected || (() => {});
    this.onTurnComplete = opts.onTurnComplete || (() => {});
    this.onError = opts.onError || (() => {});
    this.onClose = opts.onClose || (() => {});

    // Internal state
    this.activeWs = null;
    this.standbyWs = null;
    this.reconnectTimers = [];
    this.connectionStartTime = null;
    this.reconnectionCount = 0;
    this.isSwapping = false;
    this.closed = false;

    // Native session resumption (Live API sessionResumption + contextWindowCompression).
    // The server sends sessionResumptionUpdate handles; passing the latest handle in a
    // new connection's setup resumes the conversation server-side, so the swap no longer
    // depends on our condensed-context injection alone. GoAway messages let us swap
    // BEFORE the server kills the connection instead of guessing at 14:00.
    // Disable with GEMINI_NATIVE_RESUMPTION=0 if the API misbehaves.
    this.nativeResumption = opts.nativeResumption !== undefined
      ? opts.nativeResumption
      : process.env.GEMINI_NATIVE_RESUMPTION !== '0';
    this.resumptionHandle = null;
    this.standbySetupComplete = false;

    // One-shot prompt block (e.g. "the user just shared this, acknowledge it").
    // Set via forceReconnect opts, consumed by the FIRST setup that actually
    // goes out (cleared in sendSetup at delivery) — a reconnect that errors
    // before 'open' keeps it pending for the next setup, and it never leaks
    // into the scheduled 13:30 standby setup 14 minutes later.
    this.oneShotContext = null;
  }

  /**
   * Load prompt file for given phase
   */
  getSystemPrompt(phase, contextSummary) {
    const promptFile = path.join(__dirname, '..', 'prompts', `phase-${phase}-${this.getPhaseSlug(phase)}.txt`);
    let prompt;
    try {
      prompt = fs.readFileSync(promptFile, 'utf-8');
    } catch {
      console.warn(`[GEMINI] No prompt file for phase ${phase}, using default`);
      prompt = 'You are a thoughtful co-founder helping someone think through a problem. Ask probing questions. Keep responses to 2-3 sentences plus a question.';
    }

    // Prepend knowledge context if available
    if (this.knowledgeContext) {
      prompt = `${this.knowledgeContext}\n\n--- PHASE INSTRUCTIONS ---\n${prompt}`;
      console.log(`[GEMINI] Injected ${this.knowledgeContext.length} chars of knowledge context`);
    }

    // Front-load any one-shot directive (mid-session context injection)
    if (this.oneShotContext) {
      prompt = `${this.oneShotContext}\n\n${prompt}`;
    }

    if (contextSummary) {
      prompt += `\n\n--- CONVERSATION CONTEXT (from previous segment) ---\n${contextSummary}\n--- END CONTEXT ---\n\nContinue the conversation naturally from where we left off. Do NOT re-introduce yourself or restart the session. Pick up seamlessly.`;
    }

    return prompt;
  }

  getPhaseSlug(phase) {
    const slugs = {
      0: 'user-stories',
      1: 'mine',
      2: 'scout',
      3: 'assay',
      4: 'crucible',
      5: 'auditor',
      6: 'plan',
      7: 'verify'
    };
    return slugs[phase] || 'user-stories';
  }

  /**
   * Create a WebSocket connection to Gemini Live API
   */
  createConnection() {
    const url = `${GEMINI_WS_URL}?key=${this.apiKey}`;
    console.log(`[GEMINI] Opening WebSocket connection (reconnection #${this.reconnectionCount})`);
    const ws = new WebSocket(url);
    return ws;
  }

  /**
   * Send the BidiGenerateContentSetup message
   */
  sendSetup(ws, phase, contextSummary) {
    const systemPrompt = this.getSystemPrompt(phase, contextSummary);
    // Consume the one-shot at delivery: this setup carries it, no later one
    // does. Clearing here (not at the end of forceReconnect) means a failed
    // reconnect leaves it pending instead of silently discarding it.
    this.oneShotContext = null;

    const setupMessage = {
      setup: {
        model: 'models/gemini-3.1-flash-live-preview',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede'
              }
            }
          }
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        // Get text transcription of AI's audio output (no separate STT needed)
        outputAudioTranscription: {},
      }
    };

    if (this.nativeResumption) {
      // Empty object opts in; a stored handle resumes the previous session server-side
      setupMessage.setup.sessionResumption = this.resumptionHandle
        ? { handle: this.resumptionHandle }
        : {};
      // Sliding-window compression lifts the context-size cap on session duration
      setupMessage.setup.contextWindowCompression = { slidingWindow: {} };
      if (this.resumptionHandle) {
        console.log('[GEMINI] Resuming session with native resumption handle');
      }
    }

    // Add framework tool declarations if available (Article 12: JIT)
    if (this.toolDeclarations.length > 0) {
      setupMessage.setup.tools = [{
        functionDeclarations: this.toolDeclarations,
      }];
      console.log(`[GEMINI] Added ${this.toolDeclarations.length} tool declarations`);
    }

    console.log(`[GEMINI] Sending setup for phase ${phase} (context: ${contextSummary ? contextSummary.length + ' chars' : 'none'})`);
    ws.send(JSON.stringify(setupMessage));
  }

  /**
   * Wire up event handlers for a Gemini WS connection
   */
  wireHandlers(ws, isStandby = false) {
    const label = isStandby ? 'STANDBY' : 'ACTIVE';
    // Role is checked LIVE against this.activeWs/this.standbyWs — never the
    // frozen isStandby closure flag. performSwap promotes a standby by
    // reassigning references without rewiring handlers, so a closure flag
    // goes permanently stale after the first swap (audio/GoAway/barge-in
    // would be gated on the wrong role for the rest of the session).
    const isActive = () => ws === this.activeWs;
    const isCurrentStandby = () => ws === this.standbyWs;

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        // Setup complete acknowledgement
        if (msg.setupComplete) {
          console.log(`[GEMINI][${label}] Setup complete`);
          if (isCurrentStandby()) {
            // Only the CURRENT standby may arm the swap — an orphaned
            // standby (superseded by handleGoAway) must not flip the flag.
            this.standbySetupComplete = true;
            console.log(`[GEMINI] Standby connection ready for swap`);
          }
          // NOTE: Do NOT send clientContent text turns in AUDIO-only mode.
          // Gemini Live rejects text input with error 1007 when responseModalities is ['AUDIO'].
          // The AI starts speaking from the system instruction alone.
          return;
        }

        // Server content (audio + text) — delivered only from the connection
        // that is active RIGHT NOW (a just-promoted standby qualifies).
        if (msg.serverContent) {
          const parts = msg.serverContent.modelTurn?.parts || [];
          for (const part of parts) {
            if (part.inlineData && isActive()) {
              this.onAudio(part.inlineData.data);
            }
          }

          // AI text comes ONLY from outputAudioTranscription (single authoritative source)
          if (msg.serverContent.outputTranscription?.text && isActive()) {
            this.onTranscript('model', msg.serverContent.outputTranscription.text);
          }

          // Barge-in: server detected user speech during generation
          if (msg.serverContent.interrupted) {
            console.log(`[GEMINI][${label}] INTERRUPTED (barge-in)`);
            if (isActive()) {
              this.onInterrupted();
            }
          }

          // Check for turn completion
          if (msg.serverContent.turnComplete) {
            console.log(`[GEMINI][${label}] Turn complete`);
            if (isActive()) {
              this.onTurnComplete();
            }
          }
        }

        // Native resumption: store the freshest handle — only from the ACTIVE
        // connection, so a late update from a dying old lineage (or a
        // not-yet-promoted standby) can't overwrite the current handle.
        if (msg.sessionResumptionUpdate) {
          const { newHandle, resumable } = msg.sessionResumptionUpdate;
          if (resumable && newHandle && isActive()) {
            this.resumptionHandle = newHandle;
          }
          return;
        }

        // GoAway: server is about to terminate this connection — swap NOW
        // instead of waiting for the scheduled 14:00 timer.
        if (msg.goAway && isActive()) {
          const timeLeftMs = this._parseDuration(msg.goAway.timeLeft);
          console.log(`[GEMINI][${label}] GoAway received (timeLeft: ${msg.goAway.timeLeft || 'unknown'}) — early swap`);
          this.handleGoAway(timeLeftMs);
          return;
        }

        // Tool calls — session control first, then framework JIT (Article 12)
        if (msg.toolCall) {
          const calls = msg.toolCall.functionCalls || [];
          for (const fc of calls) {
            console.log(`[GEMINI][${label}] Tool call: ${fc.name}`);

            // Session control tools (advance_phase, set_intent_mode).
            // The model BLOCKS waiting for a functionResponse, so every call
            // must be answered — including handler throws and rejections.
            if (this.onControlCall && this.controlToolNames.has(fc.name)) {
              let resultPromise;
              try {
                resultPromise = Promise.resolve(this.onControlCall({ name: fc.name, args: fc.args }));
              } catch (err) {
                resultPromise = Promise.resolve({ message: `Control tool error: ${err.message}. Continue the conversation.` });
              }
              resultPromise
                .catch((err) => ({ message: `Control tool error: ${err.message}. Continue the conversation.` }))
                .then((result) => {
                  this._sendToolResponse(ws, fc.id, fc.name, { result: result?.message || 'ok' });
                  console.log(`[GEMINI] Control tool response for ${fc.name}: ${result?.message}`);
                });
              continue;
            }

            if (!this.frameworkFetcher) continue;
            this.frameworkFetcher.handleFunctionCall({ name: fc.name, args: fc.args })
              .then(result => {
                this._sendToolResponse(ws, fc.id, result.name, result.response);
                console.log(`[GEMINI] Sent tool response for ${fc.name}`);
              })
              .catch(err => {
                console.error(`[GEMINI] Tool call error (${fc.name}):`, err.message);
                this._sendToolResponse(ws, fc.id, fc.name, { error: err.message });
              });
          }
        }

      } catch (err) {
        console.error(`[GEMINI][${label}] Parse error:`, err.message);
      }
    });

    ws.on('error', (err) => {
      console.error(`[GEMINI][${label}] WebSocket error:`, err.message);
      if (!isStandby) {
        this.onError(err);
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`[GEMINI][${label}] WebSocket closed: ${code} ${reason}`);
      if (!isStandby && !this.isSwapping && !this.closed) {
        this.onClose();
      }
    });
  }

  /**
   * Main connect method — opens connection and schedules reconnection
   */
  async connect() {
    if (this.closed) return;

    return new Promise((resolve, reject) => {
      this.activeWs = this.createConnection();
      this.wireHandlers(this.activeWs, false);

      this.activeWs.on('open', () => {
        console.log('[GEMINI] Connection open');
        this.connectionStartTime = Date.now();
        this.sendSetup(this.activeWs, this.phase, this.contextSummary);
        this.scheduleReconnection();
        resolve();
      });

      this.activeWs.on('error', (err) => {
        if (!this.connectionStartTime) {
          reject(err);
        }
      });
    });
  }

  /**
   * CRITICAL: Schedule the three-phase reconnection
   *
   * Timeline:
   *   0:00  — Connection opens
   *  13:00  — Create standby connection
   *  13:30  — Send setup to standby (with condensed context)
   *  14:00  — Swap: route audio to standby, close old connection
   */
  scheduleReconnection() {
    this.clearReconnectTimers();

    const elapsed = Date.now() - this.connectionStartTime;

    // Phase 1: At 13:00 — create standby connection
    const prepareDelay = Math.max(0, RECONNECT_PREPARE_MS - elapsed);
    const t1 = setTimeout(() => {
      if (this.closed) return;
      console.log(`[RECONNECT] === PHASE 1/3: Creating standby connection (${this.reconnectionCount + 1}) ===`);
      this.onReconnecting();
      this.standbySetupComplete = false;
      this.standbyWs = this.createConnection();
      this.wireHandlers(this.standbyWs, true);

      this.standbyWs.on('open', () => {
        console.log('[RECONNECT] Standby connection open, waiting for setup phase...');
      });

      this.standbyWs.once('error', (err) => {
        console.error('[RECONNECT] Standby connection failed:', err.message);
        // If standby fails, try again in 30 seconds
        const retryTimer = setTimeout(() => {
          if (!this.closed) {
            console.log('[RECONNECT] Retrying standby connection...');
            this.standbyWs = this.createConnection();
            this.wireHandlers(this.standbyWs, true);
          }
        }, 30000);
        this.reconnectTimers.push(retryTimer);
      });
    }, prepareDelay);
    this.reconnectTimers.push(t1);

    // Phase 2: At 13:30 — send setup to standby with context
    const setupDelay = Math.max(0, RECONNECT_SETUP_MS - elapsed);
    const t2 = setTimeout(() => {
      if (this.closed || !this.standbyWs) return;
      console.log('[RECONNECT] === PHASE 2/3: Sending setup to standby with condensed context ===');
      if (this.standbyWs.readyState === WebSocket.OPEN) {
        this.sendSetup(this.standbyWs, this.phase, this.contextSummary);
      } else {
        console.warn('[RECONNECT] Standby not ready for setup, will retry on open');
        this.standbyWs.on('open', () => {
          this.sendSetup(this.standbyWs, this.phase, this.contextSummary);
        });
      }
    }, setupDelay);
    this.reconnectTimers.push(t2);

    // Phase 3: At 14:00 — swap connections
    const swapDelay = Math.max(0, RECONNECT_SWAP_MS - elapsed);
    const t3 = setTimeout(() => {
      if (this.closed) return;
      console.log('[RECONNECT] === PHASE 3/3: SWAPPING connections ===');
      this.performSwap();
    }, swapDelay);
    this.reconnectTimers.push(t3);

    console.log(`[RECONNECT] Scheduled: prepare in ${(prepareDelay / 1000).toFixed(0)}s, setup in ${(setupDelay / 1000).toFixed(0)}s, swap in ${(swapDelay / 1000).toFixed(0)}s`);
  }

  /**
   * Send a functionResponse back to Gemini. If the originating socket closed
   * (e.g. a swap finished while the handler ran), fall back to the current
   * active connection — an unanswered tool call stalls the model.
   */
  _sendToolResponse(ws, id, name, response) {
    const msg = JSON.stringify({
      toolResponse: { functionResponses: [{ id, name, response }] }
    });
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    } else if (this.activeWs && this.activeWs.readyState === WebSocket.OPEN) {
      this.activeWs.send(msg);
    } else {
      console.warn(`[GEMINI] Dropped tool response for ${name} — no open connection`);
    }
  }

  /**
   * Parse a protobuf Duration ("10s" string or {seconds, nanos} object) to ms.
   * @returns {number|null}
   */
  _parseDuration(d) {
    if (!d) return null;
    if (typeof d === 'string') {
      const m = d.match(/^([\d.]+)s$/);
      return m ? Math.round(parseFloat(m[1]) * 1000) : null;
    }
    if (typeof d === 'object' && d.seconds !== undefined) {
      return Number(d.seconds) * 1000 + Math.round((d.nanos || 0) / 1e6);
    }
    return null;
  }

  /**
   * GoAway received: the server will drop the active connection soon.
   * Spin up a standby immediately and swap as soon as its setup completes
   * (or just before the server's deadline, whichever comes first).
   */
  handleGoAway(timeLeftMs) {
    if (this.closed || this.isSwapping) return;
    this.clearReconnectTimers();
    this.onReconnecting();

    // A standby from the scheduled 13:00 prepare step may already exist —
    // close it before dialing a new one, or it leaks open against Gemini's
    // connection quota with its handlers still wired.
    if (this.standbyWs) {
      try { this.standbyWs.close(1000, 'Superseded by GoAway swap'); } catch { /* already dead */ }
      this.standbyWs = null;
    }

    this.standbySetupComplete = false;
    this.standbyWs = this.createConnection();
    this.wireHandlers(this.standbyWs, true);
    this.standbyWs.on('open', () => {
      this.sendSetup(this.standbyWs, this.phase, this.contextSummary);
    });

    let swapped = false;
    const finish = () => {
      if (swapped || this.closed) return;
      swapped = true;
      this.performSwap();
    };

    // Swap the moment standby setup completes…
    const poll = setInterval(() => {
      if (this.standbySetupComplete) finish();
    }, 100);
    this.reconnectTimers.push(poll);

    // …or just before the server deadline (bounded 1-10s)
    const deadline = Math.max(1000, Math.min(timeLeftMs || 5000, 10000) - 500);
    const hardStop = setTimeout(finish, deadline);
    this.reconnectTimers.push(hardStop);
  }

  /**
   * Execute the connection swap
   *
   * CRITICAL FIX (2026-03-29): isSwapping flag is now cleared in the oldWs.once('close') handler,
   * not synchronously. This prevents the race condition where oldWs.close() (async) was followed
   * by isSwapping = false (sync), causing the close event handler to fire with isSwapping already false,
   * which would trigger onClose() when it shouldn't.
   */
  performSwap() {
    // Require both an OPEN socket AND an acknowledged setup — swapping onto
    // a connection whose BidiGenerateContentSetup hasn't been acked routes
    // audio into a pre-setup connection, which Gemini rejects.
    if (!this.standbyWs || this.standbyWs.readyState !== WebSocket.OPEN || !this.standbySetupComplete) {
      console.error('[RECONNECT] Cannot swap — standby not ready (open+setup). Forcing new connection...');
      this.forceReconnect(this.phase, this.contextSummary);
      return;
    }

    this.isSwapping = true;
    const oldWs = this.activeWs;

    // Swap active reference
    this.activeWs = this.standbyWs;
    this.standbyWs = null;
    this.reconnectionCount++;
    this.connectionStartTime = Date.now();

    // Schedule NEXT reconnection IMMEDIATELY (doesn't wait for close)
    this.scheduleReconnection();

    // Close old connection gracefully, and clear swapping flag only AFTER close completes
    if (oldWs && oldWs.readyState === WebSocket.OPEN) {
      oldWs.once('close', () => {
        this.isSwapping = false;
        this.onReconnected();
        console.log(`[RECONNECT] Swap complete. Now on connection #${this.reconnectionCount}. Next swap in ~14 minutes.`);
      });
      oldWs.close(1000, 'Reconnection swap');
    } else {
      // If oldWs is already closed, just clear the flag immediately
      this.isSwapping = false;
      this.onReconnected();
      console.log(`[RECONNECT] Swap complete (oldWs was already closed). Now on connection #${this.reconnectionCount}. Next swap in ~14 minutes.`);
    }
  }

  /**
   * Force an immediate reconnection (e.g., phase change)
   */
  async forceReconnect(phase, contextSummary, opts = {}) {
    console.log(`[GEMINI] Force reconnect: phase=${phase}`);
    this.clearReconnectTimers();

    // Phase change = a NEW conversation segment with a new system instruction.
    // Resuming the old phase's server-side session would carry its state into
    // the new phase, fighting the new prompt — drop the handle. Same-phase
    // reconnects (swap-failure fallback) keep it: same conversation.
    // Callers that change the prompt WITHOUT changing phase (live context
    // injection) pass dropResumptionHandle: true — a resumed session may
    // ignore the new systemInstruction, so continuity must come from the
    // condensed context instead, exactly as on a phase change.
    if (phase !== this.phase || opts.dropResumptionHandle) {
      this.resumptionHandle = null;
    }

    if (opts.oneShotContext !== undefined) {
      this.oneShotContext = opts.oneShotContext;
    }

    this.phase = phase;
    this.contextSummary = contextSummary;

    // Close existing connections
    if (this.standbyWs) {
      this.standbyWs.close(1000, 'Force reconnect');
      this.standbyWs = null;
    }

    const oldWs = this.activeWs;
    this.isSwapping = true;

    // Create fresh connection
    await new Promise((resolve) => {
      this.activeWs = this.createConnection();
      this.wireHandlers(this.activeWs, false);

      this.activeWs.on('open', () => {
        this.connectionStartTime = Date.now();
        this.reconnectionCount++;
        this.sendSetup(this.activeWs, phase, contextSummary);
        this.scheduleReconnection();

        // Close old — clear isSwapping when it actually closes
        if (oldWs && oldWs.readyState === WebSocket.OPEN) {
          oldWs.once('close', () => {
            this.isSwapping = false;
            this.onReconnected();
          });
          oldWs.close(1000, 'Phase change');
        } else {
          this.isSwapping = false;
          this.onReconnected();
        }
        resolve();
      });

      this.activeWs.on('error', (err) => {
        // Don't clear isSwapping — old ws close event handles it
        this.onError(err);
        resolve();
      });
    });
  }

  /**
   * Send audio data to Gemini (raw binary)
   */
  sendAudio(audioBuffer) {
    if (!this.activeWs || this.activeWs.readyState !== WebSocket.OPEN) return;

    const msg = {
      realtimeInput: {
        audio: {
          data: Buffer.from(audioBuffer).toString('base64'),
          mimeType: 'audio/pcm;rate=16000'
        }
      }
    };
    this.activeWs.send(JSON.stringify(msg));
  }

  /**
   * Send base64-encoded audio to Gemini
   */
  sendAudioBase64(base64Data) {
    if (!this.activeWs || this.activeWs.readyState !== WebSocket.OPEN) return;

    const msg = {
      realtimeInput: {
        audio: {
          data: base64Data,
          mimeType: 'audio/pcm;rate=16000'
        }
      }
    };
    this.activeWs.send(JSON.stringify(msg));
  }

  /**
   * Clean up timers
   */
  clearReconnectTimers() {
    for (const t of this.reconnectTimers) {
      clearTimeout(t);
    }
    this.reconnectTimers = [];
  }

  /**
   * Close everything
   */
  close() {
    this.closed = true;
    this.clearReconnectTimers();
    if (this.activeWs) {
      this.activeWs.close(1000, 'Session ended');
      this.activeWs = null;
    }
    if (this.standbyWs) {
      this.standbyWs.close(1000, 'Session ended');
      this.standbyWs = null;
    }
  }
}

module.exports = { GeminiLiveManager };
