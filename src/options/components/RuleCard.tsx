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

  const domainSummary = rule.domains.length <= 2
    ? rule.domains.join(', ')
    : `${rule.domains[0]} +${rule.domains.length - 1}`;
  const triggerLabel = rule.trigger.type === 'inactive' ? 'inactive' : 'open time';
  const timeLabel = rule.trigger.minutes >= 60
    ? `${rule.trigger.minutes / 60}h`
    : `${rule.trigger.minutes}m`;
  const triggeredSuffix = rule.stats.triggeredCount > 0 ? ` · ${rule.stats.triggeredCount}× triggered` : '';

  return (
    <div
      className={`rounded-[10px] relative ${menuOpen ? 'z-10' : ''}`}
      style={{
        background: '#151921',
        border: `1px solid ${rule.enabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
        padding: '11px 14px',
        opacity: rule.enabled ? 1 : 0.6,
      }}
    >
      <div className="flex items-center gap-2">
        {/* Name + summary */}
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold text-pri truncate">{rule.name}</div>
          <div className="font-mono text-[10px] text-ter truncate mt-0.5">
            {domainSummary} · {triggerLabel} {timeLabel}{triggeredSuffix}
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={() => onToggle(rule)}
          className="relative flex-shrink-0 transition-colors"
          style={{
            width: 34,
            height: 19,
            borderRadius: 10,
            background: rule.enabled ? '#3CE882' : '#252B3C',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            className="absolute bg-white rounded-full transition-all"
            style={{ width: 14, height: 14, top: 2.5, left: rule.enabled ? 17.5 : 2.5 }}
          />
        </button>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center justify-center rounded-[6px] text-ter transition-colors"
            style={{
              width: 24,
              height: 24,
              fontSize: 14,
              background: menuOpen ? '#252B3C' : 'transparent',
              border: menuOpen ? '1px solid rgba(255,255,255,0.12)' : '1px solid transparent',
            }}
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
        <div
          className="flex items-center gap-3 mt-2.5 pt-2.5"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span className="text-xs text-danger flex-1">Delete this rule?</span>
          <button onClick={() => setConfirmDelete(false)} className="text-xs text-ter">Cancel</button>
          <button onClick={() => onDelete(rule.id)} className="text-xs text-danger font-semibold">Delete</button>
        </div>
      )}
    </div>
  );
}
