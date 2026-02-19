import { useEffect, useRef } from 'react';

interface RuleCardMenuProps {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function RuleCardMenu({ onEdit, onDuplicate, onDelete, onClose }: RuleCardMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-8 z-10 bg-bg3 border border-white/[0.08] rounded-lg shadow-xl py-1 min-w-[120px]"
    >
      <button
        onClick={onEdit}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sec hover:bg-bg4 hover:text-pri transition-colors"
      >
        ✏️ Edit
      </button>
      <button
        onClick={onDuplicate}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-sec hover:bg-bg4 hover:text-pri transition-colors"
      >
        📋 Duplicate
      </button>
      <div className="border-t border-white/[0.06] my-1" />
      <button
        onClick={onDelete}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-danger hover:bg-danger/10 transition-colors"
      >
        🗑 Delete
      </button>
    </div>
  );
}
