import { useT } from '../../shared/LangContext';

interface WelcomePageProps {
  onContinue: () => void;
  onSkip: () => void;
}

const CARDS_META = [
  {
    icon: '⏱',
    color: '#F0A030',
    bg: 'rgba(240,160,48,0.12)',
    titleKey: 'welcome_card1_title' as const,
    descKey: 'welcome_card1_desc' as const,
  },
  {
    icon: '🛡',
    color: '#5090F0',
    bg: 'rgba(80,144,240,0.12)',
    titleKey: 'welcome_card2_title' as const,
    descKey: 'welcome_card2_desc' as const,
  },
];

export default function WelcomePage({ onContinue, onSkip }: WelcomePageProps) {
  const t = useT();
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
          {t('welcome_title')}
        </h1>
        <p className="text-[13px] text-ter leading-relaxed" style={{ whiteSpace: 'pre-line' }}>
          {t('welcome_subtitle')}
        </p>
      </div>

      {/* Value cards — vertical */}
      <div className="flex flex-col gap-3 w-full mb-7">
        {CARDS_META.map(card => (
          <div
            key={card.titleKey}
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
              <div className="text-[13px] font-semibold text-pri mb-0.5">{t(card.titleKey)}</div>
              <div className="text-[11.5px] text-ter leading-snug">{t(card.descKey)}</div>
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
          {t('welcome_continue')}
        </button>
        <button
          onClick={onSkip}
          className="text-[12px] text-faint"
          style={{ background: 'none', border: 'none' }}
        >
          {t('welcome_skip')}
        </button>
      </div>
    </div>
  );
}
