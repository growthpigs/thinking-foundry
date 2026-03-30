import { useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAudioCapture } from '../hooks/useAudioCapture';
import { PhaseIndicator } from '../components/PhaseIndicator';
import { TranscriptView } from '../components/TranscriptView';
import { PauseButton } from '../components/PauseButton';
import { SqueezeCard } from '../components/SqueezeCard';
import { SessionComplete } from '../components/SessionComplete';

export function SessionPage() {
  const { token } = useParams<{ token: string }>();
  const ws = useWebSocket(token || null);

  const onAudioChunk = useCallback((buffer: ArrayBuffer) => {
    ws.sendRawAudio(buffer);
  }, [ws.sendRawAudio]);

  const audio = useAudioCapture(onAudioChunk);

  // Connect WebSocket + start audio on mount
  useEffect(() => {
    if (token && ws.status === 'disconnected') {
      ws.connect();
    }
  }, [token, ws.status, ws.connect]);

  // Start audio capture once connected
  useEffect(() => {
    if (ws.status === 'connected' && !audio.isCapturing) {
      audio.start();
    }
  }, [ws.status, audio.isCapturing, audio.start]);

  // Stop audio on pause, restart on resume
  useEffect(() => {
    if (ws.status === 'paused' && audio.isCapturing) {
      audio.stop();
    }
  }, [ws.status, audio.isCapturing, audio.stop]);

  // Clean up on unmount
  useEffect(() => {
    return () => { audio.stop(); };
  }, [audio.stop]);

  if (ws.status === 'stopped') {
    return (
      <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
        <PhaseIndicator phase={ws.phase} intentMode={ws.intentMode} />
        <SessionComplete
          issues={ws.sessionIssues}
          onGenerateCrucible={ws.generateCrucible}
          crucibleStatus={ws.crucibleStatus}
          audioUrl={ws.audioUrl}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0f]">
      <PhaseIndicator phase={ws.phase} intentMode={ws.intentMode} />

      {ws.squeezeInfo && (
        <SqueezeCard
          confidence={ws.squeezeInfo.confidence}
          notes={ws.squeezeInfo.notes}
          onDismiss={() => {}}
        />
      )}

      <TranscriptView entries={ws.transcript} />

      <PauseButton
        status={ws.status}
        onPause={ws.pause}
        onResume={() => { ws.resume(); audio.start(); }}
        onStop={() => { ws.stop(); audio.stop(); }}
      />
    </div>
  );
}
