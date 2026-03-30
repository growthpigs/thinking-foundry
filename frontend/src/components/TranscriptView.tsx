import { useEffect, useRef } from 'react';
import type { TranscriptEntry } from '../hooks/useWebSocket';

export function TranscriptView({ entries }: { entries: TranscriptEntry[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600">
        <p className="text-center">
          <span className="text-2xl block mb-2">🎙️</span>
          Waiting for conversation to begin...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              entry.speaker === 'user'
                ? 'bg-indigo-600/20 border border-indigo-500/30 text-zinc-200'
                : 'bg-[#1a1a24] border border-[#2a2a34] text-zinc-300'
            } ${!entry.isFinal ? 'opacity-60' : ''}`}
          >
            <div className="text-xs text-zinc-500 mb-1">
              {entry.speaker === 'ai' ? '🤖 AI' : '🗣️ You'}
            </div>
            <p className="text-sm leading-relaxed">{entry.text}</p>
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
