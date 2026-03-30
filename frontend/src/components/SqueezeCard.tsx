type Props = {
  confidence: number;
  notes?: string;
  onDismiss: () => void;
};

export function SqueezeCard({ confidence, notes, onDismiss }: Props) {
  const color = confidence >= 8 ? 'green' : confidence >= 6 ? 'amber' : 'red';
  const colors = {
    green: 'bg-green-950/50 border-green-800/50 text-green-300',
    amber: 'bg-amber-950/50 border-amber-800/50 text-amber-300',
    red: 'bg-red-950/50 border-red-800/50 text-red-300',
  };

  return (
    <div className={`mx-4 my-2 p-4 rounded-xl border ${colors[color]} animate-in slide-in-from-bottom`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold uppercase tracking-wider opacity-70">The Squeeze</span>
        <button onClick={onDismiss} className="text-xs opacity-50 hover:opacity-100">dismiss</button>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-bold">{confidence}/10</span>
        {notes && <p className="text-sm opacity-80 flex-1">{notes}</p>}
      </div>
    </div>
  );
}
