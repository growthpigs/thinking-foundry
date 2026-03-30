import { useCallback, useRef, useState } from 'react';

const SAMPLE_RATE = 16000;

export function useAudioCapture(onAudioChunk: (buffer: ArrayBuffer) => void) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { sampleRate: SAMPLE_RATE, channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;
      setPermissionGranted(true);

      const ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
      contextRef.current = ctx;

      // Use ScriptProcessorNode as fallback (AudioWorklet needs a separate file)
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const float32 = e.inputBuffer.getChannelData(0);
        // Convert Float32 → Int16 PCM
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          const s = Math.max(-1, Math.min(1, float32[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        onAudioChunk(int16.buffer);
      };

      source.connect(processor);
      processor.connect(ctx.destination);
      setIsCapturing(true);
    } catch (err) {
      console.error('Microphone access failed:', err);
      setPermissionGranted(false);
    }
  }, [onAudioChunk]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (contextRef.current) {
      contextRef.current.close();
      contextRef.current = null;
    }
    workletRef.current = null;
    setIsCapturing(false);
  }, []);

  return { isCapturing, permissionGranted, start, stop };
}
