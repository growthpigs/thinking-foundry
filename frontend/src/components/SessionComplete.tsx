type Props = {
  issues: Array<{ phase: number; url: string }>;
  onGenerateCrucible: () => void;
  crucibleStatus: 'idle' | 'generating' | 'ready' | 'failed';
  audioUrl: string | null;
};

const PHASES = ['User Stories', 'Mine', 'Scout', 'Assay', 'Crucible', 'Auditor', 'Plan', 'Verify'];

export function SessionComplete({ issues, onGenerateCrucible, crucibleStatus, audioUrl }: Props) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">✅</div>
          <h2 className="text-2xl font-bold text-zinc-100">Session Complete</h2>
          <p className="text-zinc-400 mt-2">Your thinking has been captured and organized.</p>
        </div>

        {issues.length > 0 && (
          <div className="bg-[#111118] rounded-xl border border-[#2a2a34] p-4">
            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Phase Documents</h3>
            <div className="space-y-2">
              {issues.map((issue) => (
                <a
                  key={issue.phase}
                  href={issue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#1a1a24] transition"
                >
                  <span className="text-xs bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded">
                    Phase {issue.phase}
                  </span>
                  <span className="text-sm text-zinc-300">{PHASES[issue.phase]}</span>
                  <span className="text-xs text-zinc-600 ml-auto">→</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Crucible Audio — Article 19: Offered, Not Forced */}
        <div className="bg-[#111118] rounded-xl border border-[#2a2a34] p-4">
          {crucibleStatus === 'idle' && (
            <>
              <button
                onClick={onGenerateCrucible}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
              >
                Generate Audio Debate
              </button>
              <p className="text-center text-xs text-zinc-600 mt-2">
                Creates a ~10 min podcast-style debate of your decision via NotebookLM
              </p>
            </>
          )}

          {crucibleStatus === 'generating' && (
            <div className="text-center py-4">
              <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-zinc-300 font-medium">Creating your audio debate...</p>
              <p className="text-zinc-500 text-sm mt-1">This takes about 2 minutes</p>
            </div>
          )}

          {crucibleStatus === 'ready' && audioUrl && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-zinc-300">Your Audio Debate</p>
              <audio
                controls
                src={audioUrl}
                className="w-full rounded-lg"
                preload="metadata"
              />
              <a
                href={audioUrl}
                download="thinking-foundry-debate.mp4"
                className="block text-center text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                Download MP4
              </a>
            </div>
          )}

          {crucibleStatus === 'failed' && (
            <div className="text-center py-3">
              <p className="text-red-400 text-sm">Audio generation failed.</p>
              <p className="text-zinc-500 text-xs mt-1">Your session is still saved in GitHub.</p>
              <button
                onClick={onGenerateCrucible}
                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
