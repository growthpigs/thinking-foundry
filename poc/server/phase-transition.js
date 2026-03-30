/**
 * PhaseTransitionHandler — Detects AI-driven phase transitions and orchestrates them.
 *
 * Implements Articles 9-10 of the Constitution:
 * - Article 9: The Squeeze between phases (confidence check)
 * - Article 10: AI decides phase transitions (not user, not timer)
 *
 * The AI signals transitions in its natural language responses. This module
 * detects those signals, extracts carry-forward data, and coordinates the
 * Supabase + GitHub persistence layers during the transition.
 */

const { PHASE_NAMES } = require('./supabase-buffer');

/**
 * Patterns the AI uses to signal phase transitions.
 * Matched against AI transcript text (case-insensitive).
 */
const TRANSITION_PATTERNS = [
  // Direct phase advancement signals
  /let'?s move (?:on )?to phase (\d)/i,
  /moving (?:on )?to phase (\d)/i,
  /ready for phase (\d)/i,
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
   * @param {number} [options.minConfidence=6] - Minimum confidence to allow transition (Article 9)
   */
  constructor({ onTransition, onSqueezeNeeded, onModeDetected, minConfidence = 6 } = {}) {
    this.onTransition = onTransition;
    this.onSqueezeNeeded = onSqueezeNeeded; // Called to inject squeeze prompt into Gemini
    this.onModeDetected = onModeDetected; // Called when intent mode detected from AI
    this.minConfidence = minConfidence;
    this.intentMode = null; // 'explore' | 'research' | 'commit'

    // Buffer recent AI utterances to detect multi-sentence transition signals
    this.recentAiText = [];
    this.maxBufferSize = 5;

    // Debounce: don't fire multiple transitions for the same signal
    this.lastTransitionAt = 0;
    this.debounceMs = 5000; // 5 seconds

    // Track extracted Squeeze data
    this.pendingSqueeze = null;

    // Active Squeeze state (Article 9 — mandatory, not passive)
    this.awaitingSqueeze = false;
    this.squeezeTargetPhase = null;
    this.squeezeRetries = 0;
    this.maxSqueezeRetries = 2;
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
        const thresholds = { explore: 5, research: 6, commit: 8 };
        this.minConfidence = thresholds[this.intentMode] || 6;
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

    // If we're waiting for The Squeeze response, check for confidence
    if (this.awaitingSqueeze) {
      if (confidence !== null) {
        // Got the confidence — now decide whether to advance
        this.awaitingSqueeze = false;
        this.squeezeRetries = 0;

        if (confidence < this.minConfidence) {
          console.log(`[PHASE] Squeeze: confidence ${confidence} < ${this.minConfidence} — looping back`);
          this.squeezeTargetPhase = null;
          return {
            transition: false,
            blocked: true,
            reason: `Confidence ${confidence}/10 is below minimum ${this.minConfidence}/10. Phase must loop back.`,
            confidence,
          };
        }

        // Confidence sufficient — fire transition
        return this._fireTransition(currentPhase, this.squeezeTargetPhase, confidence);
      }

      // No confidence in this utterance — retry if under limit
      this.squeezeRetries++;
      if (this.squeezeRetries >= this.maxSqueezeRetries) {
        console.log(`[PHASE] Squeeze: no confidence after ${this.squeezeRetries} retries — advancing without score`);
        this.awaitingSqueeze = false;
        this.squeezeRetries = 0;
        return this._fireTransition(currentPhase, this.squeezeTargetPhase, null);
      }

      // Still waiting for confidence response
      return null;
    }

    // Check for transition signal
    const targetPhase = this._detectTransition(combined, currentPhase);
    if (targetPhase === null) return null;

    // Debounce check
    const now = Date.now();
    if (now - this.lastTransitionAt < this.debounceMs) return null;

    // If we already have a confidence score, use it directly
    if (this.pendingSqueeze?.confidence != null) {
      return this._fireTransition(currentPhase, targetPhase, this.pendingSqueeze.confidence);
    }

    // No confidence yet — ACTIVELY request The Squeeze (Article 9)
    console.log(`[PHASE] Transition detected → requesting Squeeze before advancing to phase ${targetPhase}`);
    this.awaitingSqueeze = true;
    this.squeezeTargetPhase = targetPhase;
    this.squeezeRetries = 0;

    if (this.onSqueezeNeeded) {
      Promise.resolve(this.onSqueezeNeeded(currentPhase))
        .catch(err => console.error('[PHASE] Squeeze injection error:', err.message));
    }

    return { transition: false, squeezePending: true, targetPhase };
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
    this.squeezeTargetPhase = null;

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

module.exports = { PhaseTransitionHandler, PHASE_NAME_TO_NUMBER };
