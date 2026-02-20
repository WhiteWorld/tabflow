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
      className="absolute right-0 top-8 z-10 overflow-hidden"
      style={{
        width: 140,
        background: '#1C2230',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 9,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      }}
    >
      {[
        { icon: '✏️', label: 'Edit', color: '#EAF0FA', onClick: onEdit },
        { icon: '📋', label: 'Duplicate', color: '#EAF0FA', onClick: onDuplicate },
        { icon: '🗑', label: 'Delete', color: '#E8455A', onClick: onDelete },
      ].map((item, k) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium transition-colors hover:bg-bg4"
          style={{
            color: item.color,
            borderTop: k > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
          }}
        >
          <span className="text-[12px]">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </div>
  );
}
