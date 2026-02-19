interface WelcomePageProps {
  onContinue: () => void;
  onSkip: () => void;
}

const CARDS = [
  {
    icon: '⚡',
    title: 'Auto-close tabs',
    desc: 'Set rules to automatically close inactive or long-running tabs',
  },
  {
    icon: '✨',
    title: 'AI analysis',
    desc: 'Let AI suggest which tabs to close based on your patterns',
  },
  {
    icon: '🗂',
    title: 'Always recoverable',
    desc: 'Every closed tab is saved for 7 days — restore anytime',
  },
];

export default function WelcomePage({ onContinue, onSkip }: WelcomePageProps) {
  return (
    <div className="flex flex-col items-center text-center max-w-xl mx-auto">
      {/* Logo */}
      <div
        className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl mb-6"
        style={{ background: 'linear-gradient(135deg, #3EE889, #28B860)' }}
      >
        ⚡
      </div>

      <h1 className="text-3xl font-bold text-pri mb-2">Welcome to TabFlow</h1>
      <p className="text-sec text-sm mb-10">Your intelligent tab lifecycle manager</p>

      {/* Value cards */}
      <div className="grid grid-cols-3 gap-4 w-full mb-10">
        {CARDS.map(card => (
          <div
            key={card.title}
            className="bg-bg2 border border-white/[0.06] rounded-lg p-4 text-left"
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-sm font-semibold text-pri mb-1">{card.title}</div>
            <div className="text-xs text-ter">{card.desc}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onContinue}
        className="w-full max-w-xs py-3 rounded-lg bg-accent text-bg1 font-semibold text-sm hover:bg-accent/90 transition-colors mb-3"
      >
        Quick Setup (30 seconds) →
      </button>
      <button
        onClick={onSkip}
        className="text-xs text-ter hover:text-sec transition-colors"
      >
        Skip, I'll explore on my own
      </button>
    </div>
  );
}
