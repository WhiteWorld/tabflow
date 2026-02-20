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
      <div className="flex items-center gap-2 bg-bg3 rounded-lg px-3 py-2 border border-white/[0.06] focus-within:border-white/[0.12] transition-colors">
        <span className="text-sm text-ter flex-shrink-0">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-xs text-pri placeholder-ter outline-none"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="w-5 h-5 flex items-center justify-center rounded text-ter hover:text-sec hover:bg-bg4 transition-colors text-xs"
          >
            ✕
          </button>
        )}
        {!value && (
          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-bg4 text-faint">⌘K</span>
        )}
      </div>
    </div>
  );
}
