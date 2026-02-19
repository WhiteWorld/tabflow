interface NavBarProps {
  view: 'now' | 'soon' | 'past';
  setView: (v: 'now' | 'soon' | 'past') => void;
  nowCount: number;
  soonCount: number;
  pastCount: number;
}

export default function NavBar({ view, setView, nowCount, soonCount, pastCount }: NavBarProps) {
  const tabs = [
    { id: 'now' as const, label: 'Now', count: nowCount },
    { id: 'soon' as const, label: 'Soon', count: soonCount },
    { id: 'past' as const, label: 'Past', count: pastCount },
  ];

  return (
    <div className="flex bg-bg3 border-b border-white/[0.06]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors relative ${
            view === tab.id ? 'text-accent' : 'text-ter hover:text-sec'
          }`}
        >
          {tab.label}
          <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
            view === tab.id ? 'bg-accent/10 text-accent' : 'bg-bg4 text-ter'
          }`}>
            {tab.count}
          </span>
          {view === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t" />
          )}
        </button>
      ))}
    </div>
  );
}
