import { useState } from 'react';
import type { Rule, Settings } from '../../shared/types';
import RuleCard from '../components/RuleCard';
import RuleSidebar from '../components/RuleSidebar';
import { useT } from '../../shared/LangContext';

interface RulesPageProps {
  rules: Rule[];
  settings: Settings | null;
  onNavigate: (page: 'rules' | 'settings') => void;
}

export default function RulesPage({ rules, settings }: RulesPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const t = useT();

  const handleCreate = () => {
    setEditingRule(null);
    setSidebarOpen(true);
  };

  const handleEdit = (rule: Rule) => {
    setEditingRule(rule);
    setSidebarOpen(true);
  };

  const handleToggle = async (rule: Rule) => {
    const data = await chrome.storage.local.get('rules');
    const allRules = (data.rules as Rule[]) ?? [];
    const updated = allRules.map(r =>
      r.id === rule.id ? { ...r, enabled: !r.enabled, updatedAt: Date.now() } : r
    );
    await chrome.storage.local.set({ rules: updated });

    const updatedRule = updated.find(r => r.id === rule.id)!;
    if (updatedRule.enabled) {
      await chrome.runtime.sendMessage({ type: 'RULE_CREATED', rule: updatedRule });
    } else {
      await chrome.runtime.sendMessage({ type: 'RULE_DELETED', ruleId: rule.id });
    }
  };

  const handleDelete = async (ruleId: string) => {
    const data = await chrome.storage.local.get('rules');
    const allRules = (data.rules as Rule[]) ?? [];
    await chrome.storage.local.set({ rules: allRules.filter(r => r.id !== ruleId) });
    await chrome.runtime.sendMessage({ type: 'RULE_DELETED', ruleId });
  };

  const handleSave = async (rule: Rule) => {
    const data = await chrome.storage.local.get('rules');
    const allRules = (data.rules as Rule[]) ?? [];

    if (editingRule) {
      const updated = allRules.map(r => r.id === rule.id ? rule : r);
      await chrome.storage.local.set({ rules: updated });
      await chrome.runtime.sendMessage({ type: 'RULE_UPDATED', rule });
    } else {
      await chrome.storage.local.set({ rules: [...allRules, rule] });
      await chrome.runtime.sendMessage({ type: 'RULE_CREATED', rule });
    }

    setSidebarOpen(false);
    setEditingRule(null);
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[15px] font-bold text-pri">{t('rules_title')}</span>
          {rules.length > 0 && (
            <span className="ml-2 font-mono text-[10px] text-ter">{t('rules_count', { n: rules.length })}</span>
          )}
        </div>
        <button
          onClick={handleCreate}
          className="text-[11px] font-semibold px-3 py-1.5 rounded-[7px]"
          style={{ background: '#3CE882', color: '#080A0F', border: 'none' }}
        >
          {t('rules_add_site')}
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-16 text-ter">
          <div className="text-4xl mb-3">🌐</div>
          <div className="text-sm">{t('rules_empty_title')}</div>
          <div className="text-xs mt-1">{t('rules_empty_subtitle')}</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {[...rules].sort((a, b) => (a.domains[0] ?? '').localeCompare(b.domains[0] ?? '')).map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {sidebarOpen && (
        <RuleSidebar
          rule={editingRule}
          existingRules={rules}
          settings={settings}
          onSave={handleSave}
          onClose={() => { setSidebarOpen(false); setEditingRule(null); }}
        />
      )}
    </div>
  );
}
