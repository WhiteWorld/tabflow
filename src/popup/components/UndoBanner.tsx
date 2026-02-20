interface UndoBannerProps {
  count: number;
  onUndo: () => void;
}

export default function UndoBanner({ count, onUndo }: UndoBannerProps) {
  return (
    <>
      <div
        className="flex items-center gap-2.5 mx-3 mt-2 px-3 py-2.5 rounded-md"
        style={{
          background: 'rgba(240,160,48,0.12)',
          border: '1px solid rgba(240,160,48,0.25)',
        }}
      >
        <div
          className="w-7 h-7 rounded-[7px] flex items-center justify-center text-sm flex-shrink-0"
          style={{ background: 'rgba(240,160,48,0.15)' }}
        >
          ⚡
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-warn">{count} tab{count !== 1 ? 's' : ''} just closed</div>
          <div className="font-mono text-[9.5px] text-ter truncate">Safely saved to Past</div>
        </div>
        <button
          onClick={onUndo}
          className="px-3 py-1 rounded text-[11px] font-bold flex-shrink-0"
          style={{ background: '#F0A030', color: '#1A1C22' }}
        >
          Undo
        </button>
      </div>
      {/* Countdown bar */}
      <div className="mx-3 mt-0.5 h-[2px] rounded-sm overflow-hidden bg-bg3">
        <div className="w-3/5 h-full rounded-sm" style={{ background: '#F0A030' }} />
      </div>
    </>
  );
}
