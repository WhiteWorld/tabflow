import type { Rule, Settings } from '../../shared/types';
import RuleEditor from './RuleEditor';

interface RuleSidebarProps {
  rule: Rule | null;
  settings: Settings | null;
  onSave: (rule: Rule) => void;
  onClose: () => void;
}

export default function RuleSidebar({ rule, onSave, onClose }: RuleSidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 bg-bg2 border-l border-white/[0.06] z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-base font-semibold text-pri">
            {rule ? 'Edit Rule' : 'Create Rule'}
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg3 text-ter hover:text-sec transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <RuleEditor
            rule={rule}
            onSave={onSave}
            onCancel={onClose}
          />
        </div>
      </div>
    </>
  );
}
