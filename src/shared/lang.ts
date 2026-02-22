// ── Translations ──────────────────────────────────────────────────────────────
// Keep keys flat and descriptive. Interpolation via {key} placeholders.
// Call t('key', { key: value }) to substitute.

export type LangCode = 'en' | 'zh_CN';

export type Strings = typeof en;

export const en = {
  // ── TopBar ──
  topbar_tabs: 'tabs',
  topbar_tabs_tooltip: 'Open tabs in this window',
  topbar_sites: 'sites',
  topbar_sites_tooltip: 'Sites configured — click to manage',
  topbar_settings_tooltip: 'Settings',

  // ── NavBar ──
  nav_now: 'Now',
  nav_soon: 'Soon',
  nav_past: 'Past',

  // ── SearchBar ──
  search_placeholder_now: 'Search tabs...',
  search_placeholder_past: 'Search past tabs...',

  // ── CurrentTabBar ──
  current_tab_manage: 'Manage',
  current_tab_closing: 'closing...',

  // ── TabList ──
  tablist_empty: 'No tabs to show',
  tablist_group_tabs: '{n} tabs',
  tablist_group_tab: '{n} tab',
  tablist_group_ruled: '{n} ruled',
  tablist_manage_title: 'Set rule for this site',
  tablist_opened: 'opened {time}',
  tablist_closing: 'closing...',

  // ── TabRow ──
  tabrow_manage_title: 'Set rule for this site',
  tabrow_manage: 'Manage',

  // ── SoonList ──
  soonlist_empty: 'No rule-managed tabs',
  soonlist_hint: 'These tabs will auto-close when their time is up.',
  soonlist_closing: 'closing...',

  // ── PastList ──
  pastlist_empty_title: 'No stashed tabs yet',
  pastlist_empty_subtitle: 'Auto-closed tabs will appear here',
  pastlist_stat: '{n} tabs · nothing lost',
  pastlist_stat_one: '1 tab · nothing lost',
  pastlist_clear_expired: 'Clear {n} expired',
  pastlist_restore: 'Restore',
  pastlist_restore_all: 'Restore all',
  pastlist_expiry: 'Everything is recoverable for {n} days.',
  pastlist_group_just_now: 'Just now',
  pastlist_group_last_hour: 'Last hour',
  pastlist_group_today: 'Today',
  pastlist_group_two_days_ago: '2 days ago',
  pastlist_group_older: 'Older',
  pastlist_group_tabs: '{n} tabs',
  pastlist_group_tab: '{n} tab',

  // ── UndoBanner ──
  undo_title: '{n} tabs just closed',
  undo_title_one: '1 tab just closed',
  undo_subtitle: 'Safely saved to Past',
  undo_button: 'Undo',

  // ── TrustBanner ──
  trust_title: '{n} tabs cleaned · Nothing lost',
  trust_title_one: '1 tab cleaned · Nothing lost',
  trust_subtitle_prefix: 'Everything is safe in',
  trust_past_link: 'Past',

  // ── OnboardingBanner ──
  onboarding_title: '{n} sites active',
  onboarding_title_one: '1 site active',
  onboarding_subtitle: 'Matching tabs will auto-close when inactive.',

  // ── IntentCreator ──
  intent_current_tab: 'current tab',
  intent_already_covered: 'Already covered by {name}',
  intent_replace: 'Replace',
  intent_question: 'Why is this tab open?',
  intent_browsing_label: 'Just browsing',
  intent_browsing_hint: 'Close after inactive',
  intent_returning_label: "I'll come back later",
  intent_important_label: "Important — don't close",
  intent_important_hint: 'Never auto-close this site',
  intent_selected_hint: 'Close after {time} inactive',
  intent_close_after: 'Close after',
  intent_custom_placeholder: 'Custom',
  intent_min: 'min',
  intent_equals: '= {time}',
  intent_cancel: 'Cancel',
  intent_done: 'Done',
  intent_saving: 'Saving...',
  intent_replace_save: 'Replace & Save',

  // ── Options Nav ──
  options_settings: 'Settings',
  options_sites: 'Sites',

  // ── WelcomePage ──
  welcome_title: 'Welcome to TabFlow',
  welcome_subtitle: 'Take control of your tabs. Set rules,\nand never lose a tab again.',
  welcome_card1_title: 'Auto-close by rules',
  welcome_card1_desc: 'Set time limits for any site. Tabs close automatically.',
  welcome_card2_title: 'Nothing is lost',
  welcome_card2_desc: 'Every closed tab is saved to stash. Restore anytime.',
  welcome_continue: 'Quick Setup (30 seconds) →',
  welcome_skip: "Skip, I'll explore on my own",

  // ── QuickSetupPage ──
  quicksetup_title: '⚡ Quick Setup',
  quicksetup_subtitle: 'Toggle on the presets you want. Each site is added individually.',
  quicksetup_skip: 'Skip all',
  quicksetup_done: 'Done',
  quicksetup_done_with_count: 'Done · Add {n} sites',
  quicksetup_done_with_count_one: 'Done · Add 1 site',

  // ── RulesPage ──
  rules_title: 'Sites',
  rules_count: '{n} configured',
  rules_add_site: '+ Add Site',
  rules_empty_title: 'No sites configured',
  rules_empty_subtitle: 'Add a site to start managing its tabs automatically',

  // ── SettingsPage ──
  settings_section_sites: '🌐 Sites',
  settings_active_sites: 'Active Sites',
  settings_active_sites_count: '{enabled} of {total} sites enabled',
  settings_manage: 'Manage →',
  settings_protected_domains: 'Protected Domains',
  settings_protected_hint: 'These sites will never be auto-closed.',
  settings_section_general: '⚙️ General',
  settings_language: 'Language',
  settings_language_sub: 'Auto-detect from browser',
  settings_language_auto: 'Auto-detect',
  settings_language_en: 'English',
  settings_language_zh_cn: '简体中文',
  settings_expiry: 'Past Expiry',
  settings_expiry_sub: 'How long closed tabs are recoverable',
  settings_expiry_7: '7 days',
  settings_expiry_14: '14 days',
  settings_expiry_30: '30 days',
  settings_section_data: '💾 Data',
  settings_export: '📤 Export Backup',
  settings_import: '📥 Import Backup',
  settings_clear_all: '🗑 Clear All Data',
  settings_import_error: 'Invalid backup file',
  settings_clear_cancel: 'Cancel',
  settings_clear_confirm: 'Confirm Delete',

  // ── RuleCard ──
  rulecard_summary: 'close after {time} {trigger}',
  rulecard_triggered: '· closed {n}×',
  rulecard_trigger_inactive: 'inactive',
  rulecard_trigger_duration: 'open time',
  rulecard_delete_confirm: 'Remove this site?',
  rulecard_cancel: 'Cancel',
  rulecard_remove: 'Remove',

  // ── RuleCardMenu ──
  rulecardmenu_edit: 'Edit',
  rulecardmenu_remove: 'Remove',

  // ── RuleSidebar ──
  rulesidebar_edit: 'Edit Site',
  rulesidebar_add: 'Add Site',

  // ── RuleEditor ──
  ruleeditor_domain_label: 'Domain',
  ruleeditor_domain_hint: 'Subdomains auto-matched.',
  ruleeditor_domain_error_comma: 'Enter one domain at a time',
  ruleeditor_domain_error_spaces: 'Domain cannot contain spaces',
  ruleeditor_domain_error_invalid: 'Not a valid domain',
  ruleeditor_matching_tabs: 'Matches {n} open tabs ▾',
  ruleeditor_matching_tab: 'Matches 1 open tab ▾',
  ruleeditor_no_matching: 'No open tabs match',
  ruleeditor_more: '+{n} more',
  ruleeditor_already_configured: '{domain} is already configured',
  ruleeditor_will_replace: 'Will replace: {names}',
  ruleeditor_close_after: 'Close after',
  ruleeditor_preset_15: '15 min',
  ruleeditor_preset_30: '30 min',
  ruleeditor_preset_1h: '1 hour',
  ruleeditor_preset_2h: '2 hours',
  ruleeditor_custom: 'Custom',
  ruleeditor_min: 'min',
  ruleeditor_start_timer: 'Start timer when',
  ruleeditor_trigger_inactive_label: 'Tab not viewed',
  ruleeditor_trigger_inactive_sub: 'Timer starts when you switch away',
  ruleeditor_trigger_duration_label: 'Tab open time',
  ruleeditor_trigger_duration_sub: 'Timer starts when the tab opens',
  ruleeditor_desc_inactive: '{site} will close {time} after you switch away.',
  ruleeditor_desc_duration: '{site} will close {time} after they were opened.',
  ruleeditor_these_tabs: 'These tabs',
  ruleeditor_cancel: 'Cancel',
  ruleeditor_save: 'Save',
  ruleeditor_replace_save: 'Replace & Save',
} as const;

export const zh_CN: Strings = {
  // ── TopBar ──
  topbar_tabs: '个标签页',
  topbar_tabs_tooltip: '当前窗口打开的标签页',
  topbar_sites: '个站点',
  topbar_sites_tooltip: '已配置站点 — 点击管理',
  topbar_settings_tooltip: '设置',

  // ── NavBar ──
  nav_now: '当前',
  nav_soon: '即将',
  nav_past: '历史',

  // ── SearchBar ──
  search_placeholder_now: '搜索标签页...',
  search_placeholder_past: '搜索历史标签页...',

  // ── CurrentTabBar ──
  current_tab_manage: '管理',
  current_tab_closing: '关闭中...',

  // ── TabList ──
  tablist_empty: '没有标签页',
  tablist_group_tabs: '{n} 个标签页',
  tablist_group_tab: '{n} 个标签页',
  tablist_group_ruled: '{n} 个规则',
  tablist_manage_title: '为此站点设置规则',
  tablist_opened: '{time}前打开',
  tablist_closing: '关闭中...',

  // ── TabRow ──
  tabrow_manage_title: '为此站点设置规则',
  tabrow_manage: '管理',

  // ── SoonList ──
  soonlist_empty: '没有规则管理的标签页',
  soonlist_hint: '这些标签页将在计时结束后自动关闭。',
  soonlist_closing: '关闭中...',

  // ── PastList ──
  pastlist_empty_title: '还没有存档的标签页',
  pastlist_empty_subtitle: '自动关闭的标签页会出现在这里',
  pastlist_stat: '{n} 个标签页 · 一个都没少',
  pastlist_stat_one: '1 个标签页 · 一个都没少',
  pastlist_clear_expired: '清除 {n} 个已过期',
  pastlist_restore: '恢复',
  pastlist_restore_all: '全部恢复',
  pastlist_expiry: '所有标签页可在 {n} 天内恢复。',
  pastlist_group_just_now: '刚刚',
  pastlist_group_last_hour: '1小时内',
  pastlist_group_today: '今天',
  pastlist_group_two_days_ago: '2天前',
  pastlist_group_older: '更早',
  pastlist_group_tabs: '{n} 个标签页',
  pastlist_group_tab: '{n} 个标签页',

  // ── UndoBanner ──
  undo_title: '{n} 个标签页刚刚关闭',
  undo_title_one: '1 个标签页刚刚关闭',
  undo_subtitle: '已安全保存到历史记录',
  undo_button: '撤销',

  // ── TrustBanner ──
  trust_title: '{n} 个标签页已清理 · 一个都没少',
  trust_title_one: '1 个标签页已清理 · 一个都没少',
  trust_subtitle_prefix: '一切都安全保存在',
  trust_past_link: '历史',

  // ── OnboardingBanner ──
  onboarding_title: '{n} 个站点已启用',
  onboarding_title_one: '1 个站点已启用',
  onboarding_subtitle: '匹配的标签页在不活跃时将自动关闭。',

  // ── IntentCreator ──
  intent_current_tab: '当前标签页',
  intent_already_covered: '已被 {name} 覆盖',
  intent_replace: '替换',
  intent_question: '这个标签页为什么打开？',
  intent_browsing_label: '随便看看',
  intent_browsing_hint: '不活跃后关闭',
  intent_returning_label: '稍后还会回来',
  intent_important_label: '重要 — 不要关闭',
  intent_important_hint: '此站点永不自动关闭',
  intent_selected_hint: '不活跃 {time} 后关闭',
  intent_close_after: '关闭时间',
  intent_custom_placeholder: '自定义',
  intent_min: '分钟',
  intent_equals: '= {time}',
  intent_cancel: '取消',
  intent_done: '完成',
  intent_saving: '保存中...',
  intent_replace_save: '替换并保存',

  // ── Options Nav ──
  options_settings: '设置',
  options_sites: '站点',

  // ── WelcomePage ──
  welcome_title: '欢迎使用 TabFlow',
  welcome_subtitle: '掌控你的标签页。设置规则，\n再也不会丢失标签页。',
  welcome_card1_title: '按规则自动关闭',
  welcome_card1_desc: '为任意站点设置时间限制，标签页自动关闭。',
  welcome_card2_title: '一个都不会少',
  welcome_card2_desc: '每个关闭的标签页都保存到存档，随时恢复。',
  welcome_continue: '快速设置（30秒）→',
  welcome_skip: '跳过，我自己探索',

  // ── QuickSetupPage ──
  quicksetup_title: '⚡ 快速设置',
  quicksetup_subtitle: '开启你想要的预设，每个站点单独添加。',
  quicksetup_skip: '全部跳过',
  quicksetup_done: '完成',
  quicksetup_done_with_count: '完成 · 添加 {n} 个站点',
  quicksetup_done_with_count_one: '完成 · 添加 1 个站点',

  // ── RulesPage ──
  rules_title: '站点',
  rules_count: '已配置 {n} 个',
  rules_add_site: '+ 添加站点',
  rules_empty_title: '尚未配置站点',
  rules_empty_subtitle: '添加站点以自动管理其标签页',

  // ── SettingsPage ──
  settings_section_sites: '🌐 站点',
  settings_active_sites: '已启用站点',
  settings_active_sites_count: '{total} 个站点中 {enabled} 个已启用',
  settings_manage: '管理 →',
  settings_protected_domains: '保护域名',
  settings_protected_hint: '这些站点永远不会被自动关闭。',
  settings_section_general: '⚙️ 通用',
  settings_language: '语言',
  settings_language_sub: '自动检测浏览器语言',
  settings_language_auto: '自动检测',
  settings_language_en: 'English',
  settings_language_zh_cn: '简体中文',
  settings_expiry: '历史保留时长',
  settings_expiry_sub: '关闭的标签页可恢复的时间',
  settings_expiry_7: '7 天',
  settings_expiry_14: '14 天',
  settings_expiry_30: '30 天',
  settings_section_data: '💾 数据',
  settings_export: '📤 导出备份',
  settings_import: '📥 导入备份',
  settings_clear_all: '🗑 清除所有数据',
  settings_import_error: '无效的备份文件',
  settings_clear_cancel: '取消',
  settings_clear_confirm: '确认删除',

  // ── RuleCard ──
  rulecard_summary: '{trigger}后 {time} 关闭',
  rulecard_triggered: '· 已关闭 {n} 次',
  rulecard_trigger_inactive: '不活跃',
  rulecard_trigger_duration: '打开时长',
  rulecard_delete_confirm: '移除此站点？',
  rulecard_cancel: '取消',
  rulecard_remove: '移除',

  // ── RuleCardMenu ──
  rulecardmenu_edit: '编辑',
  rulecardmenu_remove: '移除',

  // ── RuleSidebar ──
  rulesidebar_edit: '编辑站点',
  rulesidebar_add: '添加站点',

  // ── RuleEditor ──
  ruleeditor_domain_label: '域名',
  ruleeditor_domain_hint: '子域名自动匹配。',
  ruleeditor_domain_error_comma: '每次只能输入一个域名',
  ruleeditor_domain_error_spaces: '域名不能包含空格',
  ruleeditor_domain_error_invalid: '不是有效的域名',
  ruleeditor_matching_tabs: '匹配 {n} 个已打开的标签页 ▾',
  ruleeditor_matching_tab: '匹配 1 个已打开的标签页 ▾',
  ruleeditor_no_matching: '没有匹配的标签页',
  ruleeditor_more: '+{n} 个更多',
  ruleeditor_already_configured: '{domain} 已经配置过了',
  ruleeditor_will_replace: '将替换：{names}',
  ruleeditor_close_after: '关闭时间',
  ruleeditor_preset_15: '15 分钟',
  ruleeditor_preset_30: '30 分钟',
  ruleeditor_preset_1h: '1 小时',
  ruleeditor_preset_2h: '2 小时',
  ruleeditor_custom: '自定义',
  ruleeditor_min: '分钟',
  ruleeditor_start_timer: '何时开始计时',
  ruleeditor_trigger_inactive_label: '标签页未查看',
  ruleeditor_trigger_inactive_sub: '切换到其他标签页时开始',
  ruleeditor_trigger_duration_label: '标签页打开时长',
  ruleeditor_trigger_duration_sub: '标签页打开时立即开始',
  ruleeditor_desc_inactive: '{site} 将在切换后 {time} 关闭。',
  ruleeditor_desc_duration: '{site} 将在打开后 {time} 关闭。',
  ruleeditor_these_tabs: '这些标签页',
  ruleeditor_cancel: '取消',
  ruleeditor_save: '保存',
  ruleeditor_replace_save: '替换并保存',
};

const TRANSLATIONS: Record<LangCode, Strings> = { en, zh_CN };

/** Substitute {key} placeholders in a string */
export function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** Detect browser language and map to supported LangCode */
export function detectBrowserLang(): LangCode {
  const lang = navigator.language || 'en';
  if (lang.startsWith('zh')) return 'zh_CN';
  return 'en';
}

/** Resolve the effective LangCode from settings value */
export function resolveLang(setting: 'auto' | 'en' | 'zh_CN'): LangCode {
  if (setting === 'auto') return detectBrowserLang();
  return setting;
}

/** Create a t() function for the given language */
export function createT(lang: LangCode) {
  const strings = TRANSLATIONS[lang] ?? TRANSLATIONS.en;
  return function t(key: keyof Strings, vars?: Record<string, string | number>): string {
    const template = strings[key] as string;
    return interpolate(template, vars);
  };
}
