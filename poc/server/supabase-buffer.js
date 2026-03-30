/**
 * SupabaseBuffer — Real-time write layer between voice session and Supabase.
 *
 * Every utterance → Supabase in <50ms. Batch flush to GitHub every 2-3 min.
 * Implements Articles 15-16 of the Constitution: real-time capture, GitHub as source of truth.
 */

const { createClient } = require('@supabase/supabase-js');

const PHASE_NAMES = [
  'Setup',      // 0
  'Mine',       // 1
  'Scout',      // 2
  'Assay',      // 3
  'Crucible',   // 4
  'Auditor',    // 5
  'Plan',       // 6
  'Verify',     // 7
];

class SupabaseBuffer {
  /**
   * @param {object} options
   * @param {string} options.supabaseUrl - Supabase project URL
   * @param {string} options.supabaseKey - Supabase service role key
   */
  constructor({ supabaseUrl, supabaseKey } = {}) {
    const url = supabaseUrl || process.env.SUPABASE_URL;
    const key = supabaseKey || process.env.SUPABASE_KEY;

    if (!url || !key) {
      throw new Error('SupabaseBuffer: SUPABASE_URL and SUPABASE_KEY required');
    }

    this.supabase = createClient(url, key);
    this.sessionId = null;
  }

  /**
   * Create a new session row in Supabase.
   * @param {string} accessToken - Unique session token (from URL: /s/abc123)
   * @returns {string} sessionId (UUID)
   */
  async startSession(accessToken) {
    const { data, error } = await this.supabase
      .from('sessions')
      .insert({
        access_token: accessToken,
        status: 'in_progress',
        current_phase: 0,
      })
      .select('id')
      .single();

    if (error) throw new Error(`startSession failed: ${error.message}`);

    this.sessionId = data.id;
    console.log(`[SUPABASE] Session started: ${this.sessionId}`);
    return this.sessionId;
  }

  /**
   * Write a single utterance to the utterances table.
   * Target: <50ms latency.
   *
   * @param {number} phase - Current phase (0-7)
   * @param {string} speaker - 'user' | 'ai' | 'system'
   * @param {string} text - Utterance content
   * @param {boolean} [isKeyPoint=false] - Flag as key insight
   */
  async writeUtterance(phase, speaker, text, isKeyPoint = false) {
    if (!this.sessionId) throw new Error('No active session');
    if (!text || text.trim().length === 0) return;

    const { error } = await this.supabase
      .from('utterances')
      .insert({
        session_id: this.sessionId,
        phase,
        speaker,
        text: text.trim(),
        is_key_point: isKeyPoint,
      });

    if (error) {
      console.error(`[SUPABASE] writeUtterance failed: ${error.message}`);
    }
  }

  /**
   * Update the session's current phase.
   * @param {number} phase - New phase number (0-7)
   */
  async updatePhase(phase) {
    if (!this.sessionId) throw new Error('No active session');

    const { error } = await this.supabase
      .from('sessions')
      .update({ current_phase: phase })
      .eq('id', this.sessionId);

    if (error) throw new Error(`updatePhase failed: ${error.message}`);
    console.log(`[SUPABASE] Phase updated to ${phase} (${PHASE_NAMES[phase] || 'unknown'})`);
  }

  /**
   * Pause the session. Increments total_pauses counter.
   * Implements Article 6: Pause is first-class.
   */
  async pauseSession() {
    if (!this.sessionId) throw new Error('No active session');

    // Use RPC or raw SQL to atomically increment
    const { error } = await this.supabase.rpc('increment_pauses', {
      session_uuid: this.sessionId,
    });

    // Fallback: if RPC doesn't exist, do two-step
    if (error) {
      const { data } = await this.supabase
        .from('sessions')
        .select('total_pauses')
        .eq('id', this.sessionId)
        .single();

      await this.supabase
        .from('sessions')
        .update({
          status: 'paused',
          total_pauses: (data?.total_pauses || 0) + 1,
        })
        .eq('id', this.sessionId);
    }

    console.log(`[SUPABASE] Session paused`);
  }

  /**
   * Resume a paused session.
   */
  async resumeSession() {
    if (!this.sessionId) throw new Error('No active session');

    const { error } = await this.supabase
      .from('sessions')
      .update({ status: 'in_progress' })
      .eq('id', this.sessionId);

    if (error) throw new Error(`resumeSession failed: ${error.message}`);
    console.log(`[SUPABASE] Session resumed`);
  }

  /**
   * Get utterances that haven't been flushed to GitHub yet.
   * Used by the batch flush interval (every 2-3 min).
   *
   * @returns {Array<{id, phase, speaker, text, is_key_point, created_at}>}
   */
  async getUnflushedUtterances() {
    if (!this.sessionId) return [];

    const { data, error } = await this.supabase
      .from('utterances')
      .select('id, phase, speaker, text, is_key_point, created_at')
      .eq('session_id', this.sessionId)
      .eq('is_flushed_to_github', false)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(`[SUPABASE] getUnflushedUtterances failed: ${error.message}`);
      return [];
    }

    return data || [];
  }

  /**
   * Mark utterances as flushed to GitHub after successful batch write.
   * @param {number[]} utteranceIds - IDs of flushed utterances
   */
  async markFlushed(utteranceIds) {
    if (!utteranceIds.length) return;

    const { error } = await this.supabase
      .from('utterances')
      .update({ is_flushed_to_github: true })
      .in('id', utteranceIds);

    if (error) {
      console.error(`[SUPABASE] markFlushed failed: ${error.message}`);
    } else {
      console.log(`[SUPABASE] Marked ${utteranceIds.length} utterances as flushed`);
    }
  }

  /**
   * Save the carry-forward document for a phase.
   * Implements Article 8: One carry-forward per phase.
   * Implements Article 9: The Squeeze between phases.
   *
   * @param {number} phase - Phase number
   * @param {string} carryForward - Synthesized carry-forward text
   * @param {number} confidence - Confidence score (1-10)
   * @param {string} [squeezeNotes] - Notes from The Squeeze
   * @param {string} [githubIssueUrl] - URL of the phase's GitHub issue
   */
  async saveCarryForward(phase, carryForward, confidence, squeezeNotes, githubIssueUrl) {
    if (!this.sessionId) throw new Error('No active session');

    const { error } = await this.supabase
      .from('phase_summaries')
      .upsert({
        session_id: this.sessionId,
        phase,
        carry_forward: carryForward,
        confidence,
        squeeze_notes: squeezeNotes || null,
        github_issue_url: githubIssueUrl || null,
      }, {
        onConflict: 'session_id,phase',
      });

    if (error) throw new Error(`saveCarryForward failed: ${error.message}`);
    console.log(`[SUPABASE] Carry-forward saved for phase ${phase} (confidence: ${confidence})`);
  }

  /**
   * Get the carry-forward from the previous phase.
   * Used when transitioning to inject context into the next phase.
   *
   * @param {number} phase - Phase to get carry-forward for
   * @returns {object|null} { carry_forward, confidence, squeeze_notes }
   */
  async getCarryForward(phase) {
    if (!this.sessionId) return null;

    const { data, error } = await this.supabase
      .from('phase_summaries')
      .select('carry_forward, confidence, squeeze_notes, github_issue_url')
      .eq('session_id', this.sessionId)
      .eq('phase', phase)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * Record which frameworks were used in this session.
   * @param {string[]} frameworks - Array of framework IDs
   */
  async updateFrameworks(frameworks) {
    if (!this.sessionId) return;

    const { error } = await this.supabase
      .from('sessions')
      .update({ frameworks_used: frameworks })
      .eq('id', this.sessionId);

    if (error) {
      console.error(`[SUPABASE] updateFrameworks failed: ${error.message}`);
    }
  }

  /**
   * Store GitHub issue references for this session.
   * @param {Array<{phase, number, url}>} issues
   */
  async updateGitHubIssues(issues) {
    if (!this.sessionId) return;

    const { error } = await this.supabase
      .from('sessions')
      .update({ github_issues: issues })
      .eq('id', this.sessionId);

    if (error) {
      console.error(`[SUPABASE] updateGitHubIssues failed: ${error.message}`);
    }
  }

  /**
   * End the session. Sets status to 'completed' and records completion time.
   */
  async endSession() {
    if (!this.sessionId) return;

    const { error } = await this.supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', this.sessionId);

    if (error) {
      console.error(`[SUPABASE] endSession failed: ${error.message}`);
    } else {
      console.log(`[SUPABASE] Session ${this.sessionId} completed`);
    }

    this.sessionId = null;
  }

  /**
   * Get session metadata.
   * @returns {object|null} Full session row
   */
  async getSession() {
    if (!this.sessionId) return null;

    const { data, error } = await this.supabase
      .from('sessions')
      .select('*')
      .eq('id', this.sessionId)
      .single();

    if (error) return null;
    return data;
  }
}

module.exports = { SupabaseBuffer, PHASE_NAMES };
