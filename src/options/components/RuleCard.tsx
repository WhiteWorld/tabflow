import { useState } from 'react';
import type { Rule } from '../../shared/types';
import RuleCardMenu from './RuleCardMenu';

interface RuleCardProps {
  rule: Rule;
  onToggle: (rule: Rule) => void;
  onEdit: (rule: Rule) => void;
  onDelete: (ruleId: string) => void;
  onDuplicate: (rule: Rule) => void;
}

export default function RuleCard({ rule, onToggle, onEdit, onDelete, onDuplicate }: RuleCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(rule.id);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <div className={`bg-bg2 rounded-lg border transition-colors relative ${
      menuOpen ? 'z-10' : ''
    } ${rule.enabled ? 'border-white/[0.08]' : 'border-white/[0.04]'}`}>
      <div className={`flex items-start gap-3 p-4 ${!rule.enabled ? 'opacity-60' : ''}`}>
        {/* Toggle */}
        <button
          onClick={() => onToggle(rule)}
          className={`w-9 h-5 rounded-full relative flex-shrink-0 mt-0.5 transition-colors ${
            rule.enabled ? 'bg-accent' : 'bg-bg4'
          }`}
        >
          <div
            className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all ${
              rule.enabled ? 'left-[18px]' : 'left-0.5'
            }`}
          />
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-pri">{rule.name}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
              rule.source === 'template' ? 'bg-info/10 text-info' :
              rule.source === 'ai' ? 'bg-warn/10 text-warn' :
              'bg-bg4 text-ter'
            }`}>
              {rule.source === 'template' ? 'Template' : rule.source === 'ai' ? 'AI' : 'Manual'}
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-2">
            {rule.domains.slice(0, 3).map(d => (
              <span key={d} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-info/10 text-info">
                {d}
              </span>
            ))}
            {rule.domains.length > 3 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-bg4 text-ter">
                +{rule.domains.length - 3}
              </span>
            )}
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-warn/10 text-warn">
              {rule.trigger.type === 'inactive' ? 'inactive' : 'open'} {rule.trigger.minutes}min
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-danger/10 text-danger">
              close+stash
            </span>
          </div>

          {/* Stats */}
          <div className="text-[10px] text-ter font-mono">
            Triggered {rule.stats.triggeredCount} time{rule.stats.triggeredCount !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-bg3 text-ter hover:text-sec transition-colors"
          >
            ⋮
          </button>
          {menuOpen && (
            <RuleCardMenu
              onEdit={() => { setMenuOpen(false); onEdit(rule); }}
              onDuplicate={() => { setMenuOpen(false); onDuplicate(rule); }}
              onDelete={() => { setMenuOpen(false); handleDelete(); }}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="px-4 pb-3 flex items-center gap-3 border-t border-white/[0.06] pt-3">
          <span className="text-xs text-danger flex-1">Delete this rule?</span>
          <button
            onClick={() => setConfirmDelete(false)}
            className="text-xs text-ter hover:text-sec"
          >
            Cancel
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="text-xs text-danger font-semibold hover:underline"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
