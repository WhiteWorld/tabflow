import { useEffect, useRef } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Search tabs...' }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="px-3 py-2">
      <div
        className="flex items-center gap-[7px] px-2.5 py-1.5 rounded-lg border transition-colors"
        style={{
          background: '#1C2230',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <span className="text-xs text-ter flex-shrink-0">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[11.5px] text-pri placeholder-ter outline-none"
        />
        {value ? (
          <button
            onClick={() => onChange('')}
            className="w-5 h-5 flex items-center justify-center rounded text-ter hover:text-sec hover:bg-bg4 transition-colors text-xs"
          >
            ✕
          </button>
        ) : (
          <span
            className="font-mono text-[9.5px] px-1 py-0.5 rounded"
            style={{ background: '#252B3C', color: '#3C4360' }}
          >
            ⌘K
          </span>
        )}
      </div>
    </div>
  );
}
