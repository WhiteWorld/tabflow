import type { Rule, Settings } from '../../shared/types';
import RuleEditor from './RuleEditor';
import { useT } from '../../shared/LangContext';

interface RuleSidebarProps {
  rule: Rule | null;
  existingRules: Rule[];
  settings: Settings | null;
  onSave: (rule: Rule) => void;
  onClose: () => void;
}

export default function RuleSidebar({ rule, existingRules, onSave, onClose }: RuleSidebarProps) {
  const t = useT();
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: 384,
          background: '#0E1117',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h3 className="text-[16px] font-bold text-pri">
            {rule ? t('rulesidebar_edit') : t('rulesidebar_add')}
          </h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-[6px] text-ter transition-colors"
            style={{ width: 28, height: 28, fontSize: 12 }}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <RuleEditor
            rule={rule}
            existingRules={existingRules}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </>
  );
}
