interface TrustBannerProps {
  count: number;
  onDismiss: () => void;
  onShowPast: () => void;
}

export default function TrustBanner({ count, onDismiss, onShowPast }: TrustBannerProps) {
  return (
    <div className="flex items-start gap-2 px-3.5 py-2.5 bg-accent/5 border-b border-accent/10">
      <div className="flex-1 min-w-0">
        <div className="text-xs text-pri font-semibold">
          ✅ {count} tab{count !== 1 ? 's' : ''} cleaned · Nothing lost
        </div>
        <div className="text-[10px] text-ter mt-0.5">
          Everything is safe in{' '}
          <button onClick={onShowPast} className="text-accent hover:underline">
            Past
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-ter hover:text-sec text-xs flex-shrink-0 mt-0.5"
      >
        ✕
      </button>
    </div>
  );
}
