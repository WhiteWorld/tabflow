interface UndoBannerProps {
  count: number;
  onUndo: () => void;
}

export default function UndoBanner({ count, onUndo }: UndoBannerProps) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-danger/10 border-b border-danger/20">
      <span className="text-xs text-danger flex-1">
        ⚡ {count} tab{count !== 1 ? 's' : ''} just closed
      </span>
      <button
        onClick={onUndo}
        className="px-3 py-1 rounded text-xs font-semibold bg-danger text-white hover:bg-danger/80 transition-colors"
      >
        Undo
      </button>
    </div>
  );
}
