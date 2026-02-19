interface OnboardingBannerProps {
  ruleCount: number;
  onDismiss: () => void;
}

export default function OnboardingBanner({ ruleCount, onDismiss }: OnboardingBannerProps) {
  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-info/5 border-b border-info/10">
      <span className="text-xs text-sec flex-1">
        {ruleCount} rule{ruleCount !== 1 ? 's' : ''} active · Matching tabs will auto-close when inactive.
      </span>
      <button
        onClick={onDismiss}
        className="text-ter hover:text-sec text-xs flex-shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
