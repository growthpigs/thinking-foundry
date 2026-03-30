/**
 * STT Pipeline — Real-time speech-to-text for user audio.
 *
 * Uses Deepgram's WebSocket API directly (not the SDK — v5 SDK changed
 * its API significantly and the lower-level WS is more stable).
 *
 * Architecture:
 *   User speaks → audio → [Gemini Live (for AI response)]
 *                       → [Deepgram STT (for user transcript)]
 */

const WebSocket = require('ws');

const DEEPGRAM_WS_URL = 'wss://api.deepgram.com/v1/listen';

class SttPipeline {
  /**
   * @param {object} options
   * @param {string} [options.apiKey] - Deepgram API key
   * @param {string} [options.language='en'] - Language code
   * @param {string} [options.model='nova-3'] - Deepgram model
   */
  constructor({ apiKey, language = 'en', model = 'nova-3' } = {}) {
    const key = apiKey || process.env.DEEPGRAM_API_KEY;
    if (!key) {
      throw new Error('SttPipeline: DEEPGRAM_API_KEY required');
    }

    this.apiKey = key;
    this.language = language;
    this.model = model;

    // Stream state
    this.ws = null;
    this.isOpen = false;
    this.fullTranscript = [];

    // Callbacks
    this._onTranscript = null;
    this._onError = null;

    // Keep-alive interval
    this._keepAlive = null;
  }

  /**
   * Register transcript callback.
   * @param {function} callback - (text, isFinal) => void
   */
  onTranscript(callback) {
    this._onTranscript = callback;
  }

  /**
   * Register error callback.
   * @param {function} callback - (error) => void
   */
  onError(callback) {
    this._onError = callback;
  }

  /**
   * Open the Deepgram WebSocket streaming connection.
   * @returns {Promise<void>}
   */
  async startStream() {
    if (this.ws) {
      console.warn('[STT] Stream already open');
      return;
    }

    const params = new URLSearchParams({
      model: this.model,
      language: this.language,
      smart_format: 'true',
      punctuate: 'true',
      interim_results: 'true',
      utterance_end_ms: '1500',
      vad_events: 'true',
      encoding: 'linear16',
      sample_rate: '16000',
      channels: '1',
    });

    const url = `${DEEPGRAM_WS_URL}?${params.toString()}`;

    console.log(`[STT] Opening Deepgram WebSocket (model: ${this.model}, lang: ${this.language})`);

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(url, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
        },
      });

      this.ws.on('open', () => {
        this.isOpen = true;
        console.log('[STT] Deepgram WebSocket connected');

        // Send keep-alive every 10 seconds
        this._keepAlive = setInterval(() => {
          if (this.ws && this.isOpen) {
            try {
              this.ws.send(JSON.stringify({ type: 'KeepAlive' }));
            } catch {}
          }
        }, 10000);

        resolve();
      });

      this.ws.on('message', (raw) => {
        try {
          const data = JSON.parse(raw.toString());

          if (data.type === 'Results') {
            const transcript = data.channel?.alternatives?.[0]?.transcript;
            if (!transcript) return;

            const isFinal = data.is_final;

            if (isFinal && transcript.trim()) {
              this.fullTranscript.push(transcript.trim());
            }

            if (this._onTranscript) {
              this._onTranscript(transcript, isFinal);
            }
          }

          if (data.type === 'UtteranceEnd') {
            if (this._onTranscript) {
              this._onTranscript('', true);
            }
          }
        } catch (err) {
          console.error('[STT] Parse error:', err.message);
        }
      });

      this.ws.on('error', (err) => {
        console.error('[STT] WebSocket error:', err.message);
        if (this._onError) this._onError(err);
        if (!this.isOpen) reject(err);
      });

      this.ws.on('close', (code, reason) => {
        this.isOpen = false;
        console.log(`[STT] WebSocket closed: ${code} ${reason}`);
        if (this._keepAlive) {
          clearInterval(this._keepAlive);
          this._keepAlive = null;
        }
      });
    });
  }

  /**
   * Feed raw audio data to Deepgram.
   * @param {Buffer|ArrayBuffer} audioChunk - Raw PCM audio (16kHz, 16-bit, mono)
   */
  feedAudio(audioChunk) {
    if (!this.ws || !this.isOpen) return;
    try {
      this.ws.send(audioChunk);
    } catch (err) {
      console.error('[STT] Send error:', err.message);
    }
  }

  /**
   * Feed base64-encoded audio to Deepgram.
   * @param {string} base64Data - Base64-encoded PCM audio
   */
  feedAudioBase64(base64Data) {
    if (!this.ws || !this.isOpen) return;
    this.feedAudio(Buffer.from(base64Data, 'base64'));
  }

  /**
   * Stop the STT stream gracefully.
   */
  async stopStream() {
    if (this._keepAlive) {
      clearInterval(this._keepAlive);
      this._keepAlive = null;
    }

    if (this.ws && this.isOpen) {
      try {
        // Send close frame
        this.ws.send(JSON.stringify({ type: 'CloseStream' }));
        this.ws.close(1000, 'Session ended');
      } catch {}
    }

    this.ws = null;
    this.isOpen = false;
    console.log('[STT] Stream stopped');
  }

  /**
   * Get the accumulated full transcript.
   * @returns {string}
   */
  getFullTranscript() {
    return this.fullTranscript.join(' ');
  }

  /**
   * Reset transcript history.
   */
  resetTranscript() {
    this.fullTranscript = [];
  }
}

module.exports = { SttPipeline };
