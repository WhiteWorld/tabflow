interface OnboardingBannerProps {
  ruleCount: number;
  onDismiss: () => void;
}

export default function OnboardingBanner({ ruleCount, onDismiss }: OnboardingBannerProps) {
  return (
    <div
      className="flex items-center gap-2.5 mx-3 mt-2 px-3 py-2.5 rounded-[9px]"
      style={{
        background: 'rgba(60,232,130,0.06)',
        border: '1px solid rgba(60,232,130,0.2)',
      }}
    >
      <div
        className="w-7 h-7 rounded-[7px] flex items-center justify-center text-sm flex-shrink-0"
        style={{ background: 'rgba(60,232,130,0.12)' }}
      >
        🎉
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] font-semibold text-accent">
          {ruleCount} rule{ruleCount !== 1 ? 's' : ''} active
        </div>
        <div className="text-[10px] text-ter">Matching tabs will auto-close when inactive.</div>
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
