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
    <div className="flex px-2.5 bg-bg2 border-b border-white/[0.06]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setView(tab.id)}
          className="flex items-center justify-center gap-1 px-2.5 py-2 text-[10.5px] font-semibold transition-colors relative"
          style={{
            color: view === tab.id ? '#3CE882' : '#3C4360',
            borderBottom: `2px solid ${view === tab.id ? '#3CE882' : 'transparent'}`,
          }}
        >
          {tab.label}
          <span
            className="font-mono text-[9px] px-1 py-0.5 rounded"
            style={{
              background: view === tab.id ? 'rgba(60,232,130,0.12)' : '#1C2230',
              color: view === tab.id ? '#3CE882' : '#3C4360',
            }}
          >
            {tab.count}
          </span>
        </button>
      ))}
    </div>
  );
}
