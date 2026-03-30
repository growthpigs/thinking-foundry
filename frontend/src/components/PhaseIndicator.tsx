const PHASES = ['User Stories', 'Mine', 'Scout', 'Assay', 'Crucible', 'Auditor', 'Plan', 'Verify'];

export function PhaseIndicator({ phase, intentMode }: { phase: number; intentMode: string | null }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[#111118] border-b border-[#1a1a24]">
      <div className="flex gap-1">
        {PHASES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < phase ? 'w-6 bg-indigo-500' :
              i === phase ? 'w-10 bg-indigo-400' :
              'w-4 bg-[#2a2a34]'
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-zinc-300 ml-2">
        Phase {phase}: {PHASES[phase]}
      </span>
      {intentMode && (
        <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${
          intentMode === 'explore' ? 'bg-blue-900/50 text-blue-300' :
          intentMode === 'research' ? 'bg-amber-900/50 text-amber-300' :
          'bg-green-900/50 text-green-300'
        }`}>
          {intentMode}
        </span>
      )}
    </div>
  );
}
