interface WelcomePageProps {
  onContinue: () => void;
  onSkip: () => void;
}

const CARDS = [
  {
    icon: '⏱',
    color: '#F0A030',
    bg: 'rgba(240,160,48,0.12)',
    title: 'Auto-close by rules',
    desc: 'Set time limits for any site. Tabs close automatically.',
  },
  {
    icon: '🛡',
    color: '#5090F0',
    bg: 'rgba(80,144,240,0.12)',
    title: 'Nothing is lost',
    desc: 'Every closed tab is saved to stash. Restore anytime.',
  },
];

export default function WelcomePage({ onContinue, onSkip }: WelcomePageProps) {
  return (
    <div className="flex flex-col items-center max-w-xl mx-auto">
      {/* Logo */}
      <div className="text-center mb-7">
        <div
          className="inline-flex items-center justify-center text-[26px] mb-3.5"
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #3CE882, #28B860)',
          }}
        >
          ⚡
        </div>
        <h1
          className="text-[26px] font-extrabold tracking-tight mb-1.5"
          style={{
            background: 'linear-gradient(135deg, #3CE882, #8BFFC0)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Welcome to TabFlow
        </h1>
        <p className="text-[13px] text-ter leading-relaxed">
          Take control of your tabs. Set rules,<br />
          and never lose a tab again.
        </p>
      </div>

      {/* Value cards — vertical */}
      <div className="flex flex-col gap-3 w-full mb-7">
        {CARDS.map(card => (
          <div
            key={card.title}
            className="flex items-center gap-3 px-3.5 py-3 rounded-[10px]"
            style={{ background: '#151921', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="flex items-center justify-center text-base flex-shrink-0"
              style={{ width: 34, height: 34, borderRadius: 8, background: card.bg, fontSize: 16 }}
            >
              {card.icon}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-pri mb-0.5">{card.title}</div>
              <div className="text-[11.5px] text-ter leading-snug">{card.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex flex-col gap-2 items-center w-full">
        <button
          onClick={onContinue}
          className="w-full py-3 rounded-[10px] text-[14px] font-bold"
          style={{ background: '#3CE882', color: '#080A0F', border: 'none' }}
        >
          Quick Setup (30 seconds) →
        </button>
        <button
          onClick={onSkip}
          className="text-[12px] text-faint"
          style={{ background: 'none', border: 'none' }}
        >
          Skip, I'll explore on my own
        </button>
      </div>
    </div>
  );
}
