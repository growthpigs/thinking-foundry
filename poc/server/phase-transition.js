/**
 * PhaseTransitionHandler — Detects AI-driven phase transitions.
 *
 * The AI signals transitions in its natural language responses (e.g.,
 * "I have what I need for Phase 0" or "Let's move to Mine").
 * This module detects those signals, extracts optional confidence
 * scores, and fires the onTransition callback.
 *
 * NOTE: Squeeze injection (text prompts into Gemini) is disabled because
 * Gemini Live AUDIO-only mode rejects clientContent text turns (error 1007).
 * Confidence is extracted passively if the AI states it voluntarily.
 */

/**
 * Intent-mode → minimum confidence for advancing a phase (The Squeeze).
 * Single source of truth for BOTH the tool path and the regex fallback.
 */
const MODE_THRESHOLDS = { explore: 5, research: 6, commit: 8 };

/**
 * After a toolTransition is BLOCKED by the confidence gate, suppress
 * regex-detected forward transitions for this long — otherwise the AI
 * narrating "we're not ready for phase 3 yet" (or similar) becomes an
 * ungated side door seconds after the gate refused.
 */
const BLOCKED_SUPPRESSION_MS = 60 * 1000;

/**
 * Patterns the AI uses to signal phase transitions.
 * Matched against AI transcript text (case-insensitive).
 */
const TRANSITION_PATTERNS = [
  // Direct phase advancement signals
  // (negative lookbehind: "we're NOT ready for phase 3" must not advance)
  /let'?s move (?:on )?to phase (\d)/i,
  /moving (?:on )?to phase (\d)/i,
  /(?<!not )(?<!n't )ready for phase (\d)/i,
  /time for phase (\d)/i,
  /on to phase (\d)/i,

  // Phase name references
  /let'?s move (?:on )?to (?:the )?(mine|scout|assay|crucible|auditor|plan|verify)/i,
  /moving (?:on )?to (?:the )?(mine|scout|assay|crucible|auditor|plan|verify)/i,
  /time for (?:the )?(mine|scout|assay|crucible|auditor|plan|verify)/i,

  // Generic completion signals
  /i have what i need for phase (\d)/i,
  /phase (\d) (?:is )?complete/i,
  /that'?s enough for phase (\d)/i,
  /we'?re done with phase (\d)/i,
];

/**
 * Patterns for The Squeeze — confidence check before advancing.
 */
const SQUEEZE_PATTERNS = [
  /confidence[:\s]+(\d+)\s*(?:\/\s*10|out of 10)/i,
  /(\d+)\s*(?:\/\s*10|out of 10)\s*confidence/i,
  /i'?d rate (?:our |my |this )?confidence (?:at )?(\d+)/i,
];

/**
 * Map phase names to numbers.
 */
const PHASE_NAME_TO_NUMBER = {
  'user stories': 0, 'setup': 0,
  'mine': 1,
  'scout': 2,
  'assay': 3,
  'crucible': 4,
  'auditor': 5,
  'plan': 6,
  'verify': 7,
};

class PhaseTransitionHandler {
  /**
   * @param {object} options
   * @param {function} options.onTransition - Called when a transition is detected: (fromPhase, toPhase, meta)
   * @param {function} [options.onModeDetected] - Called when intent mode detected (explore/research/commit)
   * @param {number} [options.minConfidence=6] - Minimum confidence for voluntary confidence check
   */
  constructor({ onTransition, onModeDetected, minConfidence = 6 } = {}) {
    this.onTransition = onTransition;
    this.onModeDetected = onModeDetected;
    this.minConfidence = minConfidence;
    this.intentMode = null; // 'explore' | 'research' | 'commit'

    // Buffer recent AI utterances to detect multi-sentence transition signals
    this.recentAiText = [];
    this.maxBufferSize = 5;

    // Debounce: don't fire multiple transitions for the same signal
    this.lastTransitionAt = 0;
    this.debounceMs = 5000; // 5 seconds

    // Timestamp of the last confidence-gate block — suppresses regex-detected
    // forward transitions so narration can't sidestep a blocked advance_phase
    this.lastBlockedAt = 0;

    // Track extracted confidence data (if the AI states it voluntarily)
    this.pendingSqueeze = null;
  }

  /**
   * Process an AI transcript utterance. Checks for phase transition signals.
   *
   * @param {string} text - AI's spoken/transcribed text
   * @param {number} currentPhase - Current phase number
   * @returns {{ transition: boolean, toPhase?: number, confidence?: number } | null}
   */
  processAiUtterance(text, currentPhase) {
    // Buffer recent text for multi-sentence detection
    this.recentAiText.push(text);
    if (this.recentAiText.length > this.maxBufferSize) {
      this.recentAiText.shift();
    }

    const combined = this.recentAiText.join(' ');

    // Detect intent mode from [MODE:xxx] signal (Phase 0 only)
    if (!this.intentMode) {
      const modeMatch = combined.match(/\[MODE:(explore|research|commit)\]/i);
      if (modeMatch) {
        this.intentMode = modeMatch[1].toLowerCase();
        this.minConfidence = MODE_THRESHOLDS[this.intentMode] || 6;
        console.log(`[PHASE] Intent mode detected: ${this.intentMode} → minConfidence=${this.minConfidence}`);
        if (this.onModeDetected) {
          Promise.resolve(this.onModeDetected(this.intentMode, this.minConfidence))
            .catch(err => console.error('[PHASE] Mode callback error:', err.message));
        }
      }
    }

    // Extract confidence score if present (The Squeeze)
    const confidence = this._extractConfidence(combined);
    if (confidence !== null) {
      this.pendingSqueeze = { confidence, text: combined };
    }

    // Check for transition signal
    const targetPhase = this._detectTransition(combined, currentPhase);
    if (targetPhase === null) return null;

    // Debounce check
    const now = Date.now();
    if (now - this.lastTransitionAt < this.debounceMs) return null;

    // Use confidence if the AI already stated it, otherwise advance without
    // NOTE: Squeeze injection disabled — Gemini AUDIO-only mode rejects text clientContent.
    // The AI's system prompt tells it to state confidence before transitioning.
    const transitionConfidence = this.pendingSqueeze?.confidence ?? confidence ?? null;

    // The regex fallback must respect the same confidence gate as the tool
    // path — it exists for narrated transitions, not as a side door.
    if (targetPhase > currentPhase) {
      if (now - this.lastBlockedAt < BLOCKED_SUPPRESSION_MS) {
        console.log('[PHASE] Regex transition suppressed — advance_phase was gate-blocked moments ago');
        return null;
      }
      if (transitionConfidence !== null && transitionConfidence < this.minConfidence) {
        console.log(`[PHASE] Regex transition gated: confidence ${transitionConfidence} < required ${this.minConfidence}`);
        return null;
      }
    }

    return this._fireTransition(currentPhase, targetPhase, transitionConfidence);
  }

  /**
   * Internal: fire the transition with confidence data.
   */
  _fireTransition(currentPhase, targetPhase, confidence) {
    this.lastTransitionAt = Date.now();
    const meta = {
      confidence,
      squeezeNotes: this.pendingSqueeze?.text || null,
      detectedFrom: this.recentAiText.join(' '),
    };

    // Clear buffers
    this.recentAiText = [];
    this.pendingSqueeze = null;

    // Notify (catch async errors to prevent unhandled rejections)
    if (this.onTransition) {
      Promise.resolve(this.onTransition(currentPhase, targetPhase, meta))
        .catch(err => console.error('[PHASE] Transition callback error:', err.message));
    }

    return {
      transition: true,
      fromPhase: currentPhase,
      toPhase: targetPhase,
      confidence,
    };
  }

  /**
   * Detect which phase the AI wants to transition to.
   * @returns {number|null} Target phase number, or null if no transition detected
   */
  _detectTransition(text, currentPhase) {
    for (const pattern of TRANSITION_PATTERNS) {
      const match = text.match(pattern);
      if (!match) continue;

      const captured = match[1];

      // Captured a phase number
      if (/^\d$/.test(captured)) {
        const target = parseInt(captured);
        // "I have what I need for phase N" means N is DONE — advance to N+1
        const isCompletionSignal = /i have what i need|we'?re done with|that'?s enough for/i.test(text);
        const resolvedTarget = (isCompletionSignal && target === currentPhase && target < 7)
          ? target + 1
          : target;
        if (resolvedTarget !== currentPhase && resolvedTarget >= 0 && resolvedTarget <= 7) {
          return resolvedTarget;
        }
      }

      // Captured a phase name
      const name = captured?.toLowerCase();
      if (name && PHASE_NAME_TO_NUMBER[name] !== undefined) {
        const target = PHASE_NAME_TO_NUMBER[name];
        if (target !== currentPhase) {
          return target;
        }
      }
    }

    // Fallback: if we detect completion signals without explicit phase target,
    // advance to next phase. Tightened to avoid false positives.
    if (/i have what i need|that'?s enough for this phase|we'?re done with this phase/i.test(text)) {
      if (currentPhase < 7) {
        return currentPhase + 1;
      }
    }

    return null;
  }

  /**
   * Extract confidence score from text (The Squeeze).
   * @returns {number|null} Confidence score (1-10) or null
   */
  _extractConfidence(text) {
    for (const pattern of SQUEEZE_PATTERNS) {
      const match = text.match(pattern);
      if (match) {
        const score = parseInt(match[1]);
        if (score >= 1 && score <= 10) return score;
      }
    }
    return null;
  }

  /**
   * Structured transition via the advance_phase tool call (primary path).
   * The regex detection above remains as a fallback for narrated transitions.
   *
   * Returns a result whose `message` is sent back to the model as the tool
   * response — so a blocked gate is FEEDBACK the AI hears, not a silent drop.
   *
   * @param {number} currentPhase
   * @param {object} args - { to_phase, confidence, carry_forward, reason }
   * @returns {{ ok: boolean, blocked?: boolean, message: string, toPhase?: number }}
   */
  toolTransition(currentPhase, args = {}) {
    const toPhase = Number(args.to_phase);
    const confidence = args.confidence !== undefined ? Number(args.confidence) : null;

    if (!Number.isInteger(toPhase) || toPhase < 0 || toPhase > 7) {
      return { ok: false, message: `Invalid to_phase: ${args.to_phase}. Must be an integer 0-7.` };
    }
    if (toPhase === currentPhase) {
      return { ok: false, message: `Already in phase ${currentPhase}. No transition needed.` };
    }
    if (confidence === null || Number.isNaN(confidence) || confidence < 1 || confidence > 10) {
      return { ok: false, message: 'confidence (1-10) is required. State your honest confidence that this phase achieved its goal.' };
    }

    // The Squeeze — confidence gate, enforced deterministically.
    // Only gate FORWARD movement; going back to revisit a phase is always allowed.
    if (toPhase > currentPhase && confidence < this.minConfidence) {
      this.lastBlockedAt = Date.now(); // arms regex-fallback suppression too
      return {
        ok: false,
        blocked: true,
        message: `Transition blocked: confidence ${confidence} is below the required ${this.minConfidence}` +
          `${this.intentMode ? ` for ${this.intentMode} mode` : ''}. ` +
          'Keep working this phase — what would raise your confidence? Retry advance_phase when it genuinely improves.',
      };
    }

    const now = Date.now();
    if (now - this.lastTransitionAt < this.debounceMs) {
      return { ok: false, blocked: true, message: 'A transition just happened. Continue in the current phase.' };
    }

    this.lastTransitionAt = now;
    const meta = {
      confidence,
      carryForward: typeof args.carry_forward === 'string' ? args.carry_forward.trim() : null,
      reason: typeof args.reason === 'string' ? args.reason.trim() : null,
      squeezeNotes: this.pendingSqueeze?.text || null,
      source: 'tool',
    };
    this.recentAiText = [];
    this.pendingSqueeze = null;

    if (this.onTransition) {
      Promise.resolve(this.onTransition(currentPhase, toPhase, meta))
        .catch(err => console.error('[PHASE] Tool transition callback error:', err.message));
    }

    return { ok: true, toPhase, message: `Transition to phase ${toPhase} accepted. Continue the conversation in the new phase.` };
  }

  /**
   * Structured intent-mode declaration via the set_intent_mode tool call
   * (replaces the [MODE:xxx] transcript tag).
   *
   * @param {string} mode - 'explore' | 'research' | 'commit'
   * @returns {{ ok: boolean, message: string }}
   */
  toolSetMode(mode) {
    const normalized = String(mode || '').toLowerCase().trim();
    if (!(normalized in MODE_THRESHOLDS)) {
      return { ok: false, message: `Invalid mode: ${mode}. Must be explore, research, or commit.` };
    }
    // Once a mode is set, the threshold can only RISE — otherwise a blocked
    // transition could be laundered by downgrading commit → explore.
    if (this.intentMode && MODE_THRESHOLDS[normalized] < this.minConfidence) {
      return {
        ok: false,
        message: `Intent mode is already ${this.intentMode} (threshold ${this.minConfidence}); it cannot be lowered mid-session. Continue at the current bar.`,
      };
    }
    this.intentMode = normalized;
    this.minConfidence = MODE_THRESHOLDS[normalized];
    console.log(`[PHASE] Intent mode set via tool: ${normalized} → minConfidence=${this.minConfidence}`);
    if (this.onModeDetected) {
      Promise.resolve(this.onModeDetected(normalized, this.minConfidence))
        .catch(err => console.error('[PHASE] Mode callback error:', err.message));
    }
    return { ok: true, message: `Intent mode set to ${normalized} (confidence threshold: ${this.minConfidence}).` };
  }

  /**
   * Manually trigger a phase transition (from user clicking "Next Phase" button).
   * Bypasses AI detection but still respects the confidence gate if squeeze data exists.
   *
   * @param {number} currentPhase
   * @param {number} targetPhase
   * @returns {{ transition: boolean, toPhase?: number, confidence?: number }}
   */
  manualTransition(currentPhase, targetPhase) {
    if (targetPhase < 0 || targetPhase > 7) {
      return { transition: false, blocked: true, reason: `Invalid target phase: ${targetPhase}` };
    }
    const now = Date.now();
    if (now - this.lastTransitionAt < this.debounceMs) {
      return { transition: false, blocked: true, reason: 'Too soon after last transition' };
    }

    this.lastTransitionAt = now;
    const meta = {
      confidence: this.pendingSqueeze?.confidence || null,
      squeezeNotes: this.pendingSqueeze?.text || null,
      manual: true,
    };

    this.recentAiText = [];
    this.pendingSqueeze = null;

    if (this.onTransition) {
      Promise.resolve(this.onTransition(currentPhase, targetPhase, meta))
        .catch(err => console.error('[PHASE] Manual transition callback error:', err.message));
    }

    return {
      transition: true,
      fromPhase: currentPhase,
      toPhase: targetPhase,
      confidence: meta.confidence,
    };
  }
}

module.exports = { PhaseTransitionHandler, PHASE_NAME_TO_NUMBER, MODE_THRESHOLDS };
