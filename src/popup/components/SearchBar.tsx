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
    <div className="px-3 py-2 border-b border-white/[0.06]">
      <div className="flex items-center gap-2 bg-bg1 rounded px-2.5 py-1.5 border border-white/[0.06] focus-within:border-white/[0.12]">
        <svg className="w-3 h-3 text-ter flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-xs text-pri placeholder-ter outline-none"
        />
        {value && (
          <button onClick={() => onChange('')} className="text-ter hover:text-sec text-xs">✕</button>
        )}
        {!value && (
          <span className="font-mono text-[10px] text-faint">⌘K</span>
        )}
      </div>
    </div>
  );
}
