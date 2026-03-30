import { useCallback, useEffect, useRef, useState } from 'react';
import { getWsUrl } from '../lib/api';

export type WsMessage = {
  type: string;
  [key: string]: unknown;
};

export type TranscriptEntry = {
  id: number;
  speaker: 'user' | 'ai';
  text: string;
  isFinal: boolean;
  timestamp: number;
};

export type SessionStatus = 'disconnected' | 'connecting' | 'connected' | 'recording' | 'paused' | 'stopped';

export function useWebSocket(token: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<SessionStatus>('disconnected');
  const [phase, setPhase] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [intentMode, setIntentMode] = useState<string | null>(null);
  const [squeezeInfo, setSqueezeInfo] = useState<{ confidence: number; notes?: string } | null>(null);
  const [sessionIssues, setSessionIssues] = useState<Array<{ phase: number; url: string }>>([]);
  const [crucibleStatus, setCrucibleStatus] = useState<'idle' | 'generating' | 'ready' | 'failed'>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const idCounter = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current) return;
    setStatus('connecting');

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: 'session-setup',
        accessToken: token,
        frameworks: ['stoicism'],
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'status':
            if (msg.state === 'connected') setStatus('connected');
            else if (msg.state === 'paused') setStatus('paused');
            else if (msg.state === 'resumed') setStatus('connected');
            else if (msg.state === 'stopped') setStatus('stopped');
            else if (msg.state === 'reconnecting') setStatus('connecting');
            break;

          case 'transcript':
          case 'user_transcript': {
            const speaker = msg.type === 'user_transcript' ? 'user' : (msg.role === 'model' || msg.speaker === 'ai' ? 'ai' : 'user');
            const text = (msg.text as string) || '';
            const isFinal = msg.type === 'user_transcript' ? (msg.isFinal as boolean) : true;
            if (!text.trim()) break;

            setTranscript(prev => {
              // For interim results, update the last entry from same speaker
              if (!isFinal && prev.length > 0 && prev[prev.length - 1].speaker === speaker && !prev[prev.length - 1].isFinal) {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], text, timestamp: Date.now() };
                return updated;
              }
              return [...prev, { id: idCounter.current++, speaker, text, isFinal, timestamp: Date.now() }];
            });
            break;
          }

          case 'phase':
          case 'phase_transition':
            setPhase((msg.phase as number) ?? (msg.to as number) ?? 0);
            break;

          case 'phase_blocked':
            setSqueezeInfo({ confidence: (msg.confidence as number) || 0, notes: msg.reason as string });
            break;

          case 'intent_mode':
            setIntentMode(msg.mode as string);
            break;

          case 'squeeze':
            setSqueezeInfo({ confidence: msg.confidence as number, notes: msg.notes as string });
            break;

          case 'session_complete':
            setStatus('stopped');
            if (msg.issues) setSessionIssues(msg.issues as Array<{ phase: number; url: string }>);
            break;

          case 'crucible_status':
            setCrucibleStatus('generating');
            break;

          case 'crucible_ready':
            setCrucibleStatus('ready');
            setAudioUrl(msg.audioUrl as string);
            break;

          case 'crucible_failed':
            setCrucibleStatus('failed');
            break;
        }
      } catch {}
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (status !== 'stopped') setStatus('disconnected');
    };

    ws.onerror = () => {
      wsRef.current = null;
      setStatus('disconnected');
    };
  }, [token, status]);

  const sendAudio = useCallback((base64: string) => {
    wsRef.current?.send(JSON.stringify({ type: 'audio', data: base64 }));
  }, []);

  const sendRawAudio = useCallback((buffer: ArrayBuffer) => {
    wsRef.current?.send(buffer);
  }, []);

  const pause = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'pause' }));
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'resume' }));
    setStatus('connected');
  }, []);

  const stop = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'stop' }));
    setStatus('stopped');
  }, []);

  const generateCrucible = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'generate_crucible' }));
  }, []);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return {
    status, phase, transcript, intentMode, squeezeInfo, sessionIssues,
    crucibleStatus, audioUrl,
    connect, sendAudio, sendRawAudio, pause, resume, stop, generateCrucible,
  };
}
