// ======== Rule ========
export interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  domains: string[];
  trigger: {
    type: 'inactive' | 'openDuration';
    minutes: number;
  };
  action: 'closeStash';
  source: 'manual' | 'ai' | 'template';
  stats: {
    triggeredCount: number;
  };
  createdAt: number;
  updatedAt: number;
}

// ======== Stashed Tab ========
export interface StashedTab {
  id: string;
  url: string;
  title: string;
  favIconUrl: string;
  closedAt: number;
  closedBy: string;
  expiresAt: number;
}

// ======== AI Suggestion ========
export interface AISuggestion {
  type: 'close' | 'rule';
  tabs: { url: string; title: string }[];
  reason: string;
  action: {
    ruleDraft?: Partial<Rule>;
  };
}

// ======== Settings ========
export interface Settings {
  language: 'auto' | 'en' | 'zh_CN';
  stashExpiryDays: number;
  aiEnabled: boolean;
  aiProvider: 'claude' | 'deepseek';
  aiApiKey: string;
  isFirstInstall: boolean;
  onboardingComplete: boolean;
  protectedDomains: string[];
  pendingCleanCount: number;
}

// ======== Runtime State ========
export interface ManagedTabEntry {
  tabId: number;
  ruleId: string;
  ruleName: string;
  triggerType: 'inactive' | 'openDuration';
  startedAt: number;
  triggerAt: number; // 0 = matched but not yet counting
  alarmName: string;
}

export interface RuntimeState {
  managedTabs: Record<number, ManagedTabEntry>;
  lastUserInteractionAt: number;
  lastActiveTabId?: number;
  pendingUndoGroup: {
    stashIds: string[];
    closedAt: number;
  } | null;
}

// ======== Message Types ========
export type MessageType =
  | { type: 'UNDO_CLOSE' }
  | { type: 'RULE_CREATED'; rule: Rule }
  | { type: 'RULE_UPDATED'; rule: Rule }
  | { type: 'RULE_DELETED'; ruleId: string }
  | { type: 'GET_SOON_TABS' }
  | { type: 'PROTECT_DOMAIN'; domain: string }
  | { type: 'RESTORE_FROM_STASH'; stashId: string };
