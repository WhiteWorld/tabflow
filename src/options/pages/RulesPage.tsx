import { useState } from 'react';
import type { Rule, Settings } from '../../shared/types';
import RuleCard from '../components/RuleCard';
import RuleSidebar from '../components/RuleSidebar';

interface RulesPageProps {
  rules: Rule[];
  settings: Settings | null;
  onNavigate: (page: 'rules' | 'settings') => void;
}

export default function RulesPage({ rules, settings }: RulesPageProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);

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

  const handleDuplicate = async (rule: Rule) => {
    const newRule: Rule = {
      ...rule,
      id: crypto.randomUUID(),
      name: rule.name + ' (copy)',
      enabled: false,
      stats: { triggeredCount: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const data = await chrome.storage.local.get('rules');
    const allRules = (data.rules as Rule[]) ?? [];
    await chrome.storage.local.set({ rules: [...allRules, newRule] });
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-pri">Rules</h2>
          <p className="text-sm text-ter mt-0.5">
            {rules.filter(r => r.enabled).length} active · {rules.length} total
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-bg1 text-sm font-semibold hover:bg-accent/90 transition-colors"
        >
          + Create Rule
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="text-center py-16 text-ter">
          <div className="text-4xl mb-3">📋</div>
          <div className="text-sm">No rules yet</div>
          <div className="text-xs mt-1">Create a rule to start managing tabs automatically</div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rules.map(rule => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onToggle={handleToggle}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {sidebarOpen && (
        <RuleSidebar
          rule={editingRule}
          settings={settings}
          onSave={handleSave}
          onClose={() => { setSidebarOpen(false); setEditingRule(null); }}
        />
      )}
    </div>
  );
}
