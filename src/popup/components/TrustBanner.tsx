interface TrustBannerProps {
  count: number;
  onDismiss: () => void;
  onShowPast: () => void;
}

export default function TrustBanner({ count, onDismiss, onShowPast }: TrustBannerProps) {
  return (
    <div
      className="flex items-center gap-2.5 mx-3 mt-2 px-3 py-2.5 rounded-[9px]"
      style={{
        background: 'rgba(60,232,130,0.06)',
        border: '1px solid rgba(60,232,130,0.2)',
      }}
    >
      <span className="text-sm flex-shrink-0">✅</span>
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] font-semibold text-accent">
          {count} tab{count !== 1 ? 's' : ''} cleaned · Nothing lost
        </div>
        <div className="text-[10px] text-ter">
          Everything is safe in{' '}
          <button onClick={onShowPast} className="text-accent font-semibold cursor-pointer">
            Past
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-ter text-xs flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
