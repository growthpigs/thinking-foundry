import type { SessionStatus } from '../hooks/useWebSocket';

type Props = {
  status: SessionStatus;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
};

export function PauseButton({ status, onPause, onResume, onStop }: Props) {
  const isPaused = status === 'paused';
  const isActive = status === 'connected' || status === 'recording';

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#111118] border-t border-[#1a1a24]">
      {/* Main pause/resume button — LARGE and obvious (Article 6) */}
      <button
        onClick={isPaused ? onResume : onPause}
        disabled={!isActive && !isPaused}
        className={`flex-1 py-4 rounded-xl text-lg font-semibold transition-all ${
          isPaused
            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
            : isActive
              ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
              : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
        }`}
      >
        {isPaused ? '▶ Resume' : isActive ? '⏸ Pause' : status === 'stopped' ? 'Session Ended' : 'Connecting...'}
      </button>

      {/* Stop button */}
      {(isActive || isPaused) && (
        <button
          onClick={onStop}
          className="px-4 py-4 rounded-xl bg-red-950/50 hover:bg-red-900/50 text-red-400 border border-red-900/50 text-sm font-medium"
        >
          End
        </button>
      )}

      {/* Recording indicator */}
      {isActive && (
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Live
        </div>
      )}
    </div>
  );
}
