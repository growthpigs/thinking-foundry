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
  }

  /**
   * Load prompt file for given phase
   */
  getSystemPrompt(phase, contextSummary) {
    const promptFile = path.join(__dirname, '..', 'prompts', `phase-${phase}-${this.getPhaseSlug(phase)}.txt`);
    let prompt = '';
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

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        // Setup complete acknowledgement
        if (msg.setupComplete) {
          console.log(`[GEMINI][${label}] Setup complete`);
          if (isStandby) {
            // Standby is ready for swap
            console.log(`[GEMINI] Standby connection ready for swap`);
          }
          // NOTE: Do NOT send clientContent text turns in AUDIO-only mode.
          // Gemini Live rejects text input with error 1007 when responseModalities is ['AUDIO'].
          // The AI starts speaking from the system instruction alone.
          return;
        }

        // Server content (audio + text)
        if (msg.serverContent) {
          const parts = msg.serverContent.modelTurn?.parts || [];
          if (parts.length > 0 && !parts[0].inlineData) {
            console.log(`[GEMINI][${label}] Got ${parts.length} parts but NO inlineData. Keys:`, parts.map(p => Object.keys(p)));
          }
          for (const part of parts) {
            if (part.inlineData) {
              if (!isStandby || this.isSwapping) {
                this.onAudio(part.inlineData.data);
              }
            }
          }

          // AI text comes ONLY from outputAudioTranscription (single authoritative source)
          if (msg.serverContent.outputTranscription?.text) {
            if (!isStandby || this.isSwapping) {
              this.onTranscript('model', msg.serverContent.outputTranscription.text);
            }
          }

          // Barge-in: server detected user speech during generation
          if (msg.serverContent.interrupted) {
            console.log(`[GEMINI][${label}] INTERRUPTED (barge-in)`);
            if (!isStandby) {
              this.onInterrupted();
            }
          }

          // Check for turn completion
          if (msg.serverContent.turnComplete) {
            console.log(`[GEMINI][${label}] Turn complete`);
            if (!isStandby || this.isSwapping) {
              this.onTurnComplete();
            }
          }
        }

        // Tool calls — framework JIT fetching (Article 12)
        if (msg.toolCall && this.frameworkFetcher) {
          const calls = msg.toolCall.functionCalls || [];
          for (const fc of calls) {
            console.log(`[GEMINI][${label}] Tool call: ${fc.name}(${JSON.stringify(fc.args)})`);
            this.frameworkFetcher.handleFunctionCall({ name: fc.name, args: fc.args })
              .then(result => {
                // Send function response back to Gemini
                const responseMsg = {
                  toolResponse: {
                    functionResponses: [{
                      id: fc.id,
                      name: result.name,
                      response: result.response,
                    }]
                  }
                };
                if (ws.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify(responseMsg));
                  console.log(`[GEMINI] Sent tool response for ${fc.name}`);
                }
              })
              .catch(err => {
                console.error(`[GEMINI] Tool call error (${fc.name}):`, err.message);
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
      this.standbyWs = this.createConnection();
      this.wireHandlers(this.standbyWs, true);

      this.standbyWs.on('open', () => {
        console.log('[RECONNECT] Standby connection open, waiting for setup phase...');
      });

      this.standbyWs.on('error', (err) => {
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
   * Execute the connection swap
   *
   * CRITICAL FIX (2026-03-29): isSwapping flag is now cleared in the oldWs.once('close') handler,
   * not synchronously. This prevents the race condition where oldWs.close() (async) was followed
   * by isSwapping = false (sync), causing the close event handler to fire with isSwapping already false,
   * which would trigger onClose() when it shouldn't.
   */
  performSwap() {
    if (!this.standbyWs || this.standbyWs.readyState !== WebSocket.OPEN) {
      console.error('[RECONNECT] Cannot swap — standby not ready. Forcing new connection...');
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
  async forceReconnect(phase, contextSummary) {
    console.log(`[GEMINI] Force reconnect: phase=${phase}`);
    this.clearReconnectTimers();
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

        // Close old
        if (oldWs && oldWs.readyState === WebSocket.OPEN) {
          oldWs.close(1000, 'Phase change');
        }

        this.isSwapping = false;
        this.onReconnected();
        resolve();
      });

      this.activeWs.on('error', (err) => {
        this.isSwapping = false;
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
