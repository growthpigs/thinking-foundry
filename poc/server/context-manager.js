/**
 * Context Manager
 *
 * Maintains a rolling transcript and produces condensed summaries
 * for injection into new Gemini connections on reconnection.
 *
 * The 15-minute limit means we need to pass context forward.
 * Strategy: Keep last N exchanges + a running summary of key points.
 */

const MAX_RECENT_EXCHANGES = 10;
const MAX_KEYPOINTS = 20;
const KEYPOINTS_TRIM_TO = 15;
const KEYPOINTS_IN_CONTEXT = 10;
const RECENT_IN_CONTEXT = 6;
const KEYPOINT_MAX_LENGTH = 200;
const PHASE_OUTPUT_PREVIEW = 300;
const EXCHANGE_PREVIEW = 150;
const MIN_ASSISTANT_KEYPOINT = 20;
const MIN_USER_KEYPOINT = 30;
const ASSISTANT_INSIGHT_LENGTH = 100;

class ContextManager {
  constructor() {
    // Full transcript (for export)
    this.fullTranscript = [];

    // Rolling window of recent exchanges (for reconnection context)
    this.recentExchanges = [];
    this.maxRecentExchanges = MAX_RECENT_EXCHANGES;

    // Key points extracted during conversation
    this.keyPoints = [];

    // Phase-specific outputs
    this.phaseOutputs = {};
  }

  /**
   * Add an utterance to the transcript
   */
  addUtterance(role, text) {
    const entry = {
      role, // 'user' or 'assistant'
      text,
      timestamp: new Date().toISOString()
    };

    this.fullTranscript.push(entry);
    this.recentExchanges.push(entry);

    // Trim recent exchanges to window size
    if (this.recentExchanges.length > this.maxRecentExchanges) {
      // Before trimming, extract key points from the oldest exchange
      const removed = this.recentExchanges.shift();
      this.extractKeyPoint(removed);
    }
  }

  /**
   * Extract a key point from a transcript entry
   * Simple heuristic: keep assistant statements that contain questions or decisions
   */
  extractKeyPoint(entry) {
    if (entry.role === 'assistant' && entry.text.length > MIN_ASSISTANT_KEYPOINT) {
      // Keep if it contains a question or seems like a key insight
      if (entry.text.includes('?') || entry.text.length > ASSISTANT_INSIGHT_LENGTH) {
        this.keyPoints.push({
          text: entry.text.substring(0, KEYPOINT_MAX_LENGTH), // Truncate long entries
          timestamp: entry.timestamp
        });
      }
    }
    if (entry.role === 'user' && entry.text.length > MIN_USER_KEYPOINT) {
      this.keyPoints.push({
        text: `User said: ${entry.text.substring(0, KEYPOINT_MAX_LENGTH)}`,
        timestamp: entry.timestamp
      });
    }

    // Keep key points manageable
    if (this.keyPoints.length > MAX_KEYPOINTS) {
      this.keyPoints = this.keyPoints.slice(-KEYPOINTS_TRIM_TO);
    }
  }

  /**
   * Record the output of a completed phase
   */
  setPhaseOutput(phase, output) {
    this.phaseOutputs[phase] = {
      output,
      completedAt: new Date().toISOString()
    };
  }

  /**
   * Get condensed context for reconnection
   * This is injected into the new connection's system prompt
   */
  getCondensedContext() {
    const parts = [];

    // Phase outputs (most important — structured knowledge)
    if (Object.keys(this.phaseOutputs).length > 0) {
      parts.push('PHASE RESULTS SO FAR:');
      for (const [phase, data] of Object.entries(this.phaseOutputs)) {
        parts.push(`  Phase ${phase}: ${data.output.substring(0, PHASE_OUTPUT_PREVIEW)}`);
      }
    }

    // Key points from conversation
    if (this.keyPoints.length > 0) {
      parts.push('\nKEY POINTS FROM CONVERSATION:');
      for (const kp of this.keyPoints.slice(-KEYPOINTS_IN_CONTEXT)) {
        parts.push(`  - ${kp.text}`);
      }
    }

    // Recent exchanges (last few turns for natural continuation)
    if (this.recentExchanges.length > 0) {
      parts.push('\nRECENT CONVERSATION:');
      for (const ex of this.recentExchanges.slice(-RECENT_IN_CONTEXT)) {
        const label = ex.role === 'user' ? 'User' : 'You';
        parts.push(`  ${label}: ${ex.text.substring(0, EXCHANGE_PREVIEW)}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Get full transcript for export
   */
  getFullTranscript() {
    return this.fullTranscript.map(e => {
      const role = e.role === 'user' ? 'User' : 'Foundry';
      return `**${role}** (${e.timestamp}): ${e.text}`;
    }).join('\n\n');
  }

  /**
   * Get all phase outputs for Drive export
   */
  getPhaseOutputs() {
    return this.phaseOutputs;
  }
}

module.exports = { ContextManager };
