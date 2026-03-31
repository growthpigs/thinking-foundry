/**
 * CrucibleAudio — Orchestrates NotebookLM debate audio generation.
 *
 * Implements Constitution Article 19: NotebookLM Audio Is Offered, Not Forced.
 * Implements Constitution Article 20: Use teng-lin/notebooklm-py. Never CIC.
 *
 * Flow: collect phase summaries → spawn Python worker → upload to Supabase Storage → return URL
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { createClient } = require('@supabase/supabase-js');

const PHASE_NAMES = ['Setup', 'Mine', 'Scout', 'Assay', 'Crucible', 'Auditor', 'Plan', 'Verify'];
const WORKER_PATH = path.join(__dirname, 'crucible-worker.py');
const GENERATION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes max

class CrucibleAudio {
  /**
   * @param {object} options
   * @param {string} [options.supabaseUrl]
   * @param {string} [options.supabaseKey]
   */
  constructor({ supabaseUrl, supabaseKey } = {}) {
    const url = supabaseUrl || process.env.SUPABASE_URL;
    const key = supabaseKey || process.env.SUPABASE_KEY;

    if (!url || !key) {
      throw new Error('CrucibleAudio: SUPABASE_URL and SUPABASE_KEY required');
    }

    this.supabase = createClient(url, key);
    this.activeJobs = new Map(); // sessionId → { status, audioUrl, error }
  }

  /**
   * Restore NotebookLM auth from env var (for Railway deployment).
   * Call this at server startup.
   */
  static restoreAuth() {
    if (process.env.NOTEBOOKLM_AUTH_B64) {
      const authDir = path.join(os.homedir(), '.notebooklm');
      const authPath = path.join(authDir, 'storage_state.json');

      if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authDir, { recursive: true });
        fs.writeFileSync(
          authPath,
          Buffer.from(process.env.NOTEBOOKLM_AUTH_B64, 'base64')
        );
        console.log('[CRUCIBLE] Restored NotebookLM auth from env');
      }
    }
  }

  /**
   * Generate Crucible debate audio for a completed session.
   *
   * @param {string} sessionId - Supabase session UUID
   * @param {string} sessionName - Human-readable session name
   * @returns {{ audioUrl: string, status: string }}
   */
  async generateCrucibleAudio(sessionId, sessionName) {
    // Check if already generating
    const existing = this.activeJobs.get(sessionId);
    if (existing?.status === 'generating') {
      return { status: 'generating', audioUrl: null };
    }

    this.activeJobs.set(sessionId, { status: 'generating', audioUrl: null, error: null });

    try {
      // 1. Collect phase summaries from Supabase
      const { data: summaries, error } = await this.supabase
        .from('phase_summaries')
        .select('phase, carry_forward, confidence, squeeze_notes')
        .eq('session_id', sessionId)
        .order('phase', { ascending: true });

      if (error || !summaries || summaries.length === 0) {
        throw new Error('No phase summaries found for this session');
      }

      // 2. Format as sources for the Python worker
      const sources = summaries.map(s => ({
        phase: s.phase,
        phase_name: PHASE_NAMES[s.phase] || `Phase ${s.phase}`,
        text: [
          s.carry_forward,
          s.confidence ? `\nConfidence: ${s.confidence}/10` : '',
          s.squeeze_notes ? `\nSqueeze Notes: ${s.squeeze_notes}` : '',
        ].filter(Boolean).join(''),
      }));

      console.log(`[CRUCIBLE] Generating audio for session ${sessionId} (${sources.length} phases)`);

      // 3. Spawn Python worker
      const result = await this._runPythonWorker({
        session_id: sessionId,
        session_name: sessionName,
        sources,
      });

      if (result.status !== 'success') {
        throw new Error(result.error || 'Audio generation failed');
      }

      // 4. Upload to Supabase Storage
      const audioUrl = await this._uploadToStorage(sessionId, result.audio_path);

      // 5. Update session record
      await this.supabase
        .from('sessions')
        .update({ crucible_audio_url: audioUrl })
        .eq('id', sessionId);

      this.activeJobs.set(sessionId, { status: 'ready', audioUrl, error: null });
      console.log(`[CRUCIBLE] Audio ready: ${audioUrl}`);

      return { audioUrl, status: 'ready' };
    } catch (err) {
      console.error(`[CRUCIBLE] Failed: ${err.message}`);
      this.activeJobs.set(sessionId, { status: 'failed', audioUrl: null, error: err.message });
      throw err;
    }
  }

  /**
   * Call the Crucible worker — either via HTTP (production) or subprocess (local dev).
   * Production: CRUCIBLE_SERVICE_URL env var points to separate Python service.
   * Local: falls back to spawning crucible-worker.py subprocess.
   * @returns {Promise<object>} Worker result JSON
   */
  _runPythonWorker(input) {
    const serviceUrl = process.env.CRUCIBLE_SERVICE_URL;

    // Production path: HTTP call to separate Crucible service
    if (serviceUrl) {
      return this._runViaHttp(serviceUrl, input);
    }

    // Local dev fallback: subprocess
    return this._runViaSubprocess(input);
  }

  async _runViaHttp(serviceUrl, input) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

    try {
      const res = await fetch(serviceUrl + '/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Crucible service error ${res.status}: ${body}`);
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error('Crucible audio generation timed out (10 min)');
      throw err;
    }
  }

  _runViaSubprocess(input) {
    return new Promise((resolve, reject) => {
      const proc = spawn('python3', [WORKER_PATH], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data.toString(); });
      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        const lines = data.toString().split('\n').filter(Boolean);
        lines.forEach(line => console.log(line));
      });

      proc.stdin.write(JSON.stringify(input));
      proc.stdin.end();

      const timer = setTimeout(() => {
        proc.kill('SIGTERM');
        reject(new Error('Crucible audio generation timed out (10 min)'));
      }, GENERATION_TIMEOUT_MS);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0) {
          reject(new Error(`Python worker exited with code ${code}: ${stderr}`));
          return;
        }
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error(`Invalid JSON from worker: ${stdout}`));
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        if (err.code === 'ENOENT') {
          reject(new Error('Python3 not found. Install Python 3.10+'));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Upload audio file to Supabase Storage.
   * @returns {string} Public URL
   */
  async _uploadToStorage(sessionId, filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `${sessionId}/debate.mp4`;

    const { error } = await this.supabase.storage
      .from('crucible-audio')
      .upload(storagePath, fileBuffer, {
        contentType: 'audio/mp4',
        upsert: true,
      });

    if (error) {
      console.error(`[CRUCIBLE] Storage upload failed: ${error.message}`);
      // Fallback: return local file path info
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data } = this.supabase.storage
      .from('crucible-audio')
      .getPublicUrl(storagePath);

    // Clean up local file
    try { fs.unlinkSync(filePath); } catch {}

    return data.publicUrl;
  }

  /**
   * Get generation status for a session.
   * @param {string} sessionId
   * @returns {{ status: string, audioUrl: string | null, error: string | null }}
   */
  getStatus(sessionId) {
    return this.activeJobs.get(sessionId) || { status: 'idle', audioUrl: null, error: null };
  }
}

module.exports = { CrucibleAudio };
