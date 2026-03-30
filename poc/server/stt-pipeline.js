/**
 * STT Pipeline — Real-time speech-to-text for user audio.
 *
 * Uses Deepgram's WebSocket streaming API for user speech transcription.
 * AI speech transcription comes from Gemini's output_audio_transcription
 * (configured in gemini-live.js setup), NOT from this pipeline.
 *
 * Architecture:
 *   User speaks → audio → [Gemini Live (for AI response)]
 *                       → [Deepgram STT (for user transcript)]
 *
 * The pipeline outputs:
 *   - Partial transcripts (interim, for real-time display)
 *   - Final transcripts (confirmed, for Supabase persistence)
 */

const { createClient, LiveTranscriptionEvents } = require('@deepgram/sdk');

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

    this.deepgram = createClient(key);
    this.language = language;
    this.model = model;

    // Stream state
    this.connection = null;
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
   * Open the Deepgram streaming connection.
   * @returns {Promise<void>}
   */
  async startStream() {
    if (this.connection) {
      console.warn('[STT] Stream already open');
      return;
    }

    console.log(`[STT] Opening Deepgram stream (model: ${this.model}, lang: ${this.language})`);

    this.connection = this.deepgram.listen.live({
      model: this.model,
      language: this.language,
      smart_format: true,
      punctuate: true,
      interim_results: true,
      utterance_end_ms: 1500,
      vad_events: true,
      encoding: 'linear16',
      sample_rate: 16000,
      channels: 1,
    });

    return new Promise((resolve, reject) => {
      this.connection.on(LiveTranscriptionEvents.Open, () => {
        this.isOpen = true;
        console.log('[STT] Deepgram connection open');

        // Send keep-alive every 10 seconds to prevent timeout
        this._keepAlive = setInterval(() => {
          if (this.connection && this.isOpen) {
            this.connection.keepAlive();
          }
        }, 10000);

        resolve();
      });

      this.connection.on(LiveTranscriptionEvents.Transcript, (data) => {
        const transcript = data.channel?.alternatives?.[0]?.transcript;
        if (!transcript) return;

        const isFinal = data.is_final;

        if (isFinal && transcript.trim()) {
          this.fullTranscript.push(transcript.trim());
        }

        if (this._onTranscript) {
          this._onTranscript(transcript, isFinal);
        }
      });

      this.connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
        // Utterance boundary detected — useful for sentence-level processing
        if (this._onTranscript) {
          this._onTranscript('', true); // Signal utterance end
        }
      });

      this.connection.on(LiveTranscriptionEvents.Error, (err) => {
        console.error('[STT] Deepgram error:', err.message || err);
        if (this._onError) this._onError(err);
        if (!this.isOpen) reject(err);
      });

      this.connection.on(LiveTranscriptionEvents.Close, () => {
        this.isOpen = false;
        console.log('[STT] Deepgram connection closed');
        if (this._keepAlive) {
          clearInterval(this._keepAlive);
          this._keepAlive = null;
        }
      });
    });
  }

  /**
   * Feed raw audio data to Deepgram.
   * Called for every audio chunk from the user's microphone.
   *
   * @param {Buffer|ArrayBuffer} audioChunk - Raw PCM audio (16kHz, 16-bit, mono)
   */
  feedAudio(audioChunk) {
    if (!this.connection || !this.isOpen) return;

    try {
      this.connection.send(audioChunk);
    } catch (err) {
      console.error('[STT] Send error:', err.message);
    }
  }

  /**
   * Feed base64-encoded audio to Deepgram.
   * @param {string} base64Data - Base64-encoded PCM audio
   */
  feedAudioBase64(base64Data) {
    if (!this.connection || !this.isOpen) return;
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

    if (this.connection && this.isOpen) {
      try {
        this.connection.requestClose();
      } catch {
        // Connection may already be closed
      }
    }

    this.connection = null;
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
