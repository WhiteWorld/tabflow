interface TopBarProps {
  tabCount: number;
  ruleCount: number;
}

export default function TopBar({ tabCount, ruleCount }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2.5 bg-bg2 border-b border-white/[0.06]">
      {/* Logo */}
      <div className="flex items-center gap-1.5">
        <div
          className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center text-bg0 text-[11px] font-bold"
          style={{ background: 'linear-gradient(135deg, #3CE882, #28B860)' }}
        >
          ⚡
        </div>
        <span className="font-bold text-[13px] text-pri">TabFlow</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-[10px] text-ter">
          <b className="text-sec">{tabCount}</b> tabs
        </span>
        <span className="font-mono text-[10px] text-ter">
          <b className="text-sec">{ruleCount}</b> rules
        </span>
      </div>
    </div>
  );
}
