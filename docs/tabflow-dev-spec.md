# TabFlow MVP — Claude Code 开发规格文档

> 本文档是 TabFlow Chrome 扩展 MVP 版本的完整开发规格。
> 直接作为 Claude Code 的输入使用。

---

## 1. 项目概述

TabFlow 是一个 Chrome 浏览器扩展，帮助用户通过规则自动管理标签页生命周期。

**核心能力**：
- 规则引擎：按域名匹配 + 不活跃/打开超时 → 自动关闭标签并保存到暂存区
- 快速建规则：从标签行一键为当前域名创建规则
- AI 分析：将标签 URL+标题发送给 LLM，获取整理建议并一键执行
- 暂存恢复：所有自动关闭的标签可恢复

---

## 2. 技术栈

```
框架：React 18 + TypeScript (strict mode)
构建：Vite + CRXJS (https://crxjs.dev/vite-plugin)
样式：Tailwind CSS
扩展规范：Chrome Manifest V3
存储：chrome.storage.local (数据) + chrome.storage.sync (Phase 2)
定时器：chrome.alarms API
国际化：chrome.i18n API
```

---

## 3. 项目结构

```
tabflow/
├── manifest.json
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── _locales/
│   ├── en/messages.json
│   └── zh_CN/messages.json
├── public/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── src/
│   ├── background/
│   │   ├── index.ts                 # Service Worker 入口
│   │   ├── rule-engine.ts           # 规则匹配与执行
│   │   ├── alarm-manager.ts         # chrome.alarms 管理(规则定时)
│   │   ├── runtime-state.ts         # RuntimeState CRUD (权威运行态)
│   │   └── stash-manager.ts         # 暂存区 CRUD
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx                  # Popup 根组件
│   │   ├── components/
│   │   │   ├── TopBar.tsx
│   │   │   ├── NavBar.tsx           # Now / Soon / Past
│   │   │   ├── SearchBar.tsx
│   │   │   ├── TabList.tsx          # Now 平铺列表
│   │   │   ├── TabGroupedList.tsx   # Now 域名分组折叠列表
│   │   │   ├── SoonList.tsx         # Soon 倒计时列表
│   │   │   ├── TabRow.tsx
│   │   │   ├── PastList.tsx         # Past 平铺列表
│   │   │   ├── PastGroupedList.tsx  # Past 按时间分组
│   │   │   ├── PastFilterBar.tsx
│   │   │   ├── UndoBanner.tsx       # 5秒即时撤销横幅
│   │   │   ├── TrustBanner.tsx      # 首次自动关闭信任横幅
│   │   │   ├── OnboardingBanner.tsx
│   │   │   ├── AIResults.tsx
│   │   │   ├── SuggestionCard.tsx
│   │   │   └── AIConsentModal.tsx
│   │   └── hooks/
│   │       ├── useTabs.ts
│   │       ├── useRuntime.ts        # 读取 RuntimeState
│   │       ├── useRules.ts
│   │       ├── usePast.ts
│   │       └── useAI.ts
│   ├── options/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx                  # Options 根组件
│   │   ├── pages/
│   │   │   ├── WelcomePage.tsx      # 首次安装引导
│   │   │   ├── QuickSetupPage.tsx   # 模板规则选择
│   │   │   ├── RulesPage.tsx
│   │   │   └── SettingsPage.tsx
│   │   └── components/
│   │       ├── RuleCard.tsx
│   │       ├── RuleCardMenu.tsx     # ⋮ 更多菜单
│   │       ├── IntentCreator.tsx    # 意图驱动规则创建
│   │       ├── RuleEditor.tsx        # 3步规则创建表单
│   │       └── RuleSidebar.tsx
│   ├── ai/
│   │   ├── provider.ts             # LLM Provider 抽象接口
│   │   ├── claude-provider.ts
│   │   ├── deepseek-provider.ts
│   │   ├── prompts.ts              # 多语言 system prompt
│   │   └── parser.ts               # 解析 AI 返回 → AISuggestion[]
│   ├── shared/
│   │   ├── types.ts                 # 全局类型定义
│   │   ├── storage.ts              # chrome.storage 封装
│   │   ├── constants.ts            # 预设规则模板等
│   │   └── i18n.ts                 # chrome.i18n 工具函数
│   └── styles/
│       └── globals.css
```

---

## 4. Manifest V3 配置

```json
{
  "manifest_version": 3,
  "name": "__MSG_extName__",
  "description": "__MSG_extDescription__",
  "version": "0.1.0",
  "default_locale": "en",
  "permissions": [
    "tabs",
    "alarms",
    "storage",
    "contextMenus"
  ],
  "action": {
    "default_popup": "src/popup/index.html",
    "default_icon": {
      "16": "public/icon-16.png",
      "48": "public/icon-48.png",
      "128": "public/icon-128.png"
    }
  },
  "options_page": "src/options/index.html",
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "icons": {
    "16": "public/icon-16.png",
    "48": "public/icon-48.png",
    "128": "public/icon-128.png"
  }
}
```

---

## 5. 数据模型 (src/shared/types.ts)

```typescript
// ======== Rule ========
interface Rule {
  id: string;                          // crypto.randomUUID()
  name: string;                        // 用户自定义 或 自动生成 "x.com · 30min"
  enabled: boolean;
  domains: string[];                   // e.g. ["x.com", "reddit.com"]
                                       // 匹配逻辑: tab hostname === domain || hostname.endsWith('.' + domain)
                                       // 即 "youtube.com" 自动匹配 www.youtube.com, m.youtube.com 等所有子域名
  trigger: {
    type: 'inactive' | 'openDuration'; // inactive: 最后活跃后超时  openDuration: 打开总时长
    minutes: number;
  };
  action: 'closeStash';                // MVP 固定为 closeStash, Phase 2 扩展 notifyOnly
  source: 'manual' | 'ai' | 'template';
  stats: {
    triggeredCount: number;
  };
  createdAt: number;                   // Date.now()
  updatedAt: number;
}

// ======== Stashed Tab ========
interface StashedTab {
  id: string;
  url: string;
  title: string;
  favIconUrl: string;
  closedAt: number;
  closedBy: string;                    // 规则名 | "manual" | "ai"
  expiresAt: number;                   // closedAt + 7天 (可配置)
}

// ======== AI Suggestion ========
interface AISuggestion {
  type: 'close' | 'rule';
  tabs: { url: string; title: string }[];
  reason: string;
  action: {
    ruleDraft?: Partial<Rule>;
  };
}

// ======== Settings ========
interface Settings {
  language: 'auto' | 'en' | 'zh_CN';
  stashExpiryDays: number;             // 默认 7
  aiEnabled: boolean;                  // 默认 false
  aiProvider: 'claude' | 'deepseek';
  aiApiKey: string;                    // 本地存储，不上传
  isFirstInstall: boolean;             // 首次安装标记
  onboardingComplete: boolean;
  protectedDomains: string[];          // 📌 "Important" 意图标记的域名, 永不自动关闭
  pendingCleanCount: number;           // 自动关闭计数, 用于 TrustBanner 显示, 用户看到后清零
}

// ======== Runtime State (权威运行态, 持久化到 storage) ========
// chrome.alarms 只保证触发, 不保证可查询一致性
// popup UI 是查询系统, 需要可靠的数据源
// MV3 Service Worker 随时休眠, 内存变量不可靠, 必须持久化

interface ManagedTabEntry {
  tabId: number;
  ruleId: string;
  ruleName: string;                    // 冗余存储, 避免 popup 每次查 rule
  triggerType: 'inactive' | 'openDuration';
  startedAt: number;                   // alarm 注册时间
  triggerAt: number;                   // 预计触发时间 (startedAt + minutes*60*1000)
  alarmName: string;                   // "rule_{ruleId}_{tabId}_{createdAt}" 防 tabId 复用
}

interface RuntimeState {
  managedTabs: Record<number, ManagedTabEntry>;  // key = tabId
  lastUserInteractionAt: number;                 // Human Activity Guard
  pendingUndoGroup: {                            // 5秒撤销窗口
    stashIds: string[];                          // 刚关闭的 stash 记录 ID
    closedAt: number;                            // 关闭时间
  } | null;
}

// UI 查询方式 (popup 打开时):
//   Soon tabs = Object.values(runtime.managedTabs)
//   倒计时 = entry.triggerAt - Date.now()
//   是否受规则管理 = runtime.managedTabs[tabId] 存在
//   Now tabs = allTabs.filter(t => !runtime.managedTabs[t.id])

// Storage 完整结构:
// chrome.storage.local = {
//   rules: Rule[],
//   stash: StashedTab[],
//   settings: Settings,
//   runtime: RuntimeState
// }
```

---

## 6. 核心流程

### 6.1 Service Worker 启动

```
chrome.runtime.onInstalled →
  if (reason === 'install'):
    settings.isFirstInstall = true
    打开 options page (WelcomePage)
    加载预设规则模板(disabled)
  
chrome.runtime.onStartup →
  从 storage 加载 rules + runtime
  
  // RuntimeState 恢复与一致性检查
  // SW 休眠期间 tab 可能被用户手动关闭
  const allTabs = await chrome.tabs.query({})
  const openTabIds = new Set(allTabs.map(t => t.id))
  
  // 清理已不存在的 tab 的 runtimeState
  for tabId in runtime.managedTabs:
    if !openTabIds.has(tabId):
      delete runtime.managedTabs[tabId]
  
  // 重建 alarm (SW 休眠后 alarm 可能丢失)
  for entry in runtime.managedTabs:
    if entry.triggerAt > Date.now():
      chrome.alarms.create(entry.alarmName, { when: entry.triggerAt })
    else if entry.triggerAt > 0:
      // alarm 已过期但未触发 (SW 休眠导致), 立即执行
      executeClose(entry)
  
  // 清理过期 stash 记录
  清理过期 stash 记录
```

### 6.2 Inactive 定义与检测

```
Inactive = 该标签不是当前活跃标签的持续时间

检测信号:
  chrome.tabs.onActivated   → 用户切到了别的标签
  chrome.windows.onFocusChanged → 用户切到了别的应用 (windowId === WINDOW_ID_NONE)

开始计时 (标签变为 inactive):
  tabs.onActivated 且 activeTabId !== thisTabId  → 用户切走了
  windows.onFocusChanged(WINDOW_ID_NONE)         → 浏览器整体失焦 (所有标签都 inactive)

重置计时 (标签恢复 active):
  tabs.onActivated 且 activeTabId === thisTabId AND 窗口有焦点

不做的 (MVP):
  页面内滚动/点击/打字检测 → 需要 Content Script + 额外权限, Phase 2 考虑
```

### 6.3 规则匹配与执行

```
域名匹配函数:
  matchDomain(tabUrl: string, domain: string): boolean
    const hostname = new URL(tabUrl).hostname
    return hostname === domain || hostname.endsWith('.' + domain)
  // "youtube.com" 匹配 youtube.com, www.youtube.com, m.youtube.com

registerManagedTab(rule, tab):
  const now = Date.now()
  const triggerAt = now + rule.trigger.minutes * 60 * 1000
  const alarmName = `rule_${rule.id}_${tab.id}_${now}`  // 含时间戳防 tabId 复用
  
  // 1. 写入 RuntimeState (权威状态)
  runtime.managedTabs[tab.id] = {
    tabId: tab.id,
    ruleId: rule.id,
    ruleName: rule.name,
    triggerType: rule.trigger.type,
    startedAt: now,
    triggerAt,
    alarmName,
  }
  await chrome.storage.local.set({ runtime })
  
  // 2. 注册 alarm (定时器)
  chrome.alarms.create(alarmName, { when: triggerAt })

unregisterManagedTab(tabId):
  const entry = runtime.managedTabs[tabId]
  if entry:
    chrome.alarms.clear(entry.alarmName)
    delete runtime.managedTabs[tabId]
    await chrome.storage.local.set({ runtime })

chrome.tabs.onUpdated (url changed) →
  const hostname = new URL(url).hostname
  
  // 白名单优先: protectedDomains 直接阻断, 不创建 runtimeState
  if settings.protectedDomains.some(d => matchDomain(url, d)):
    unregisterManagedTab(tabId)  // 如果之前有, 清除
    return
  
  // 如果 URL 变了, 清除旧的管理状态
  unregisterManagedTab(tabId)
  
  // 遍历 rules 匹配
  for rule in enabledRules:
    if rule.domains.some(d => matchDomain(url, d)):
      if rule.trigger.type === 'openDuration':
        registerManagedTab(rule, tab)  // 立即开始倒计时
      if rule.trigger.type === 'inactive':
        // 标记为待管理, 等 onActivated 切走时才开始倒计时
        runtime.managedTabs[tabId] = { ...entry, triggerAt: 0, alarmName: '' }
        // triggerAt=0 表示"已匹配但未激活倒计时"
      break  // 一个 tab 只匹配第一条规则

chrome.tabs.onActivated (切标签) →
  // 更新 Human Activity Guard
  runtime.lastUserInteractionAt = Date.now()
  
  // 刚切走的标签:
  const entry = runtime.managedTabs[prevTabId]
  if entry && entry.triggerType === 'inactive':
    registerManagedTab(findRule(entry.ruleId), prevTab)  // 开始倒计时
  
  // 刚切到的标签:
  const activeEntry = runtime.managedTabs[activeTabId]
  if activeEntry && activeEntry.triggerType === 'inactive':
    chrome.alarms.clear(activeEntry.alarmName)
    // 重置为"已匹配但未激活"
    activeEntry.triggerAt = 0
    activeEntry.alarmName = ''
  
  // openDuration 类型: 不受切标签影响, 不重置

chrome.windows.onFocusChanged →
  if windowId !== WINDOW_ID_NONE:
    // 浏览器回焦 → 更新 Human Activity Guard
    runtime.lastUserInteractionAt = Date.now()
    // active tab 重置 inactive 倒计时
    unregisterManagedTab(activeTabId)  // 然后重新等 onActivated
  
  if windowId === WINDOW_ID_NONE (浏览器失焦):
    // 注意: 不立即启动所有倒计时
    // 只对该窗口内已匹配 inactive 规则且 triggerAt===0 的标签启动倒计时
    for each managed tab in current window where triggerType=inactive && triggerAt===0:
      registerManagedTab(...)

chrome.tabs.onRemoved →
  // 清理泄漏: tab 关闭后删除 runtimeState
  unregisterManagedTab(tabId)

chrome.alarms.onAlarm →
  解析 alarmName 获取 ruleId + tabId
  const entry = runtime.managedTabs[tabId]
  
  // 防御: 如果 runtimeState 不存在 → 陈旧 alarm, 忽略
  if !entry || entry.alarmName !== alarm.name:
    return
  
  // Human Activity Guard: 如果用户刚操作过, 延迟执行
  if Date.now() - runtime.lastUserInteractionAt < 15000:
    // 延迟 1 分钟重试
    chrome.alarms.create(entry.alarmName, { delayInMinutes: 1 })
    entry.triggerAt = Date.now() + 60000
    return
  
  // 执行关闭
  const tab = await chrome.tabs.get(tabId)
  const stashEntry = saveToStash(tab, entry.ruleName)
  chrome.tabs.remove(tabId)
  unregisterManagedTab(tabId)
  
  // 更新统计
  rule.stats.triggeredCount++
  settings.pendingCleanCount++
  
  // Undo Close: 保存到 pendingUndoGroup (5秒撤销窗口)
  if !runtime.pendingUndoGroup || Date.now() - runtime.pendingUndoGroup.closedAt > 5000:
    runtime.pendingUndoGroup = { stashIds: [stashEntry.id], closedAt: Date.now() }
  else:
    runtime.pendingUndoGroup.stashIds.push(stashEntry.id)
  
  // Badge 提示 (Layer 2 降级方案): 红色数字, 用户看到后点击 popup 可撤销
  const count = runtime.pendingUndoGroup.stashIds.length
  chrome.action.setBadgeText({ text: String(count) })
  chrome.action.setBadgeBackgroundColor({ color: '#E84444' })
  
  // 注册 5秒后清除 undo group + badge 的 alarm
  chrome.alarms.create('undo_expire', { delayInMinutes: 5/60 })
```

### 6.4 意图驱动规则创建 (从标签行)

```
用户在 popup hover 标签行 → 显示 ⚙️✕ 两个操作按钮
或点击 TopBar "Manage" 按钮 →
  弹出 IntentCreator 覆盖层
  域名自动填充 (从当前标签 URL 提取)
  
  显示问题: "Why is this tab open?"
  三个意图选项:
    ⏳ "Just browsing"        → 创建规则: domains=[域名], trigger={type:'inactive', minutes:15}
    🔄 "I'll come back later" → 创建规则: domains=[域名], trigger={type:'inactive', minutes:120}
    📌 "Important — don't close" → 将域名加入白名单 (Settings.protectedDomains[])
  
  重复检测:
    遍历所有 enabled rules:
      if 域名已匹配 → 显示 "Already covered by [规则名]" + Replace 链接
  
点击 "Done":
  if 选择 ⏳ 或 🔄 → 创建新 Rule 保存到 storage, 立即生效
  if 选择 📌 → 保存到 protectedDomains, 清除该域名相关 alarm
```

### 6.5 规则变更处理

核心原则: **规则变了 → 清除旧 RuntimeState + alarm → 全量重建**

```
规则关闭 (toggle off):
  for each entry in runtime.managedTabs where entry.ruleId === ruleId:
    unregisterManagedTab(entry.tabId)  // 清 alarm + runtimeState
  已在 Past 的标签不受影响

规则编辑 (改域名/时间/触发类型):
  1. 清除该规则所有 managedTabs (同上)
  2. 保存新配置到 storage
  3. rebuildForRule(newRule)

规则删除:
  同 "关闭", 清除所有 managedTabs
  从 storage 删除规则记录

规则创建 (新建/Replace):
  保存到 storage
  rebuildForRule(newRule)

rebuildForRule(rule: Rule):
  if !rule.enabled → return
  const allTabs = await chrome.tabs.query({})
  for tab in allTabs:
    if settings.protectedDomains.some(d => matchDomain(tab.url, d)):
      continue  // 白名单优先
    if rule.domains.some(d => matchDomain(tab.url, d)):
      registerManagedTab(rule, tab)  // 写 runtimeState + 创建 alarm
```

### 6.6 关闭、暂存与即时撤销

```
关闭标签时 (由 alarm 触发):
  // 在 6.3 的 onAlarm 中已处理: saveToStash + pendingUndoGroup

Undo Close (即时撤销, 5秒窗口):
  popup 打开时检查 runtime.pendingUndoGroup:
    if 存在 && Date.now() - closedAt < 5000:
      顶部显示 Undo 横幅: "N tabs closed · Undo?"
      点击 Undo:
        for stashId in pendingUndoGroup.stashIds:
          const stash = getStash(stashId)
          chrome.tabs.create({ url: stash.url })
          deleteStash(stashId)
        settings.pendingCleanCount -= stashIds.length
        runtime.pendingUndoGroup = null
        chrome.action.setBadgeText({ text: '' })  // 清除 badge
  
  alarm 'undo_expire' 触发后:
    runtime.pendingUndoGroup = null  // 撤销窗口关闭
    chrome.action.setBadgeText({ text: '' })  // 清除 badge

恢复标签 (从 Past 页面):
  chrome.tabs.create({ url: stashedTab.url })
  从 storage 删除该 stash 记录

过期清理:
  后台定时 alarm "stash_cleanup" (每小时)
  删除 expiresAt < Date.now() 的记录
```

### 6.7 AI 分析

```
用户点击 "AI Analyze All Tabs":
  if !settings.aiEnabled → 弹出 AIConsentModal
  
分析流程:
  chrome.tabs.query({}) → 获取所有标签 url + title
  
  // Tab Clustering 预处理 (防止 token 爆炸)
  // 120 tabs 直接发 → token 爆炸 + LLM 截断 + 半 JSON
  // 聚类后发送 → token ↓ 90%, 稳定性 ↑
  clusterTabs(tabs):
    按 hostname 分组
    每组取最多 3 个代表性标签 (标题最不同的)
    相同标题的合并
    输出格式:
      [{ domain: "youtube.com", count: 8, examples: ["React 19", "Rust compiler"] }]
  
  根据 settings.aiProvider 选择 LLM Provider
  发送请求:
    system prompt (根据语言选择 en/zh)
    user content: JSON.stringify(clusterTabs(tabs))
    // 不是原始 tabs, 而是聚类后的 clusters
  
解析返回:
  JSON → AISuggestion[]
  安全解析: 去掉 ```json 围栏, try/catch
  渲染建议卡片
  
一键执行:
  close → chrome.tabs.remove(tabIds) + 保存到 stash
  rule → 打开 IntentCreator 预填数据
```

---

## 7. 右键菜单 (chrome.contextMenus)

扩展图标右键菜单，需在 manifest 添加 `"contextMenus"` 权限。

```typescript
// src/background/index.ts — onInstalled 时注册
chrome.contextMenus.create({ id: 'manage-tab', title: '⚙️ Manage this site', contexts: ['action'] });
chrome.contextMenus.create({ id: 'ai-analyze', title: '✨ AI Analyze all tabs', contexts: ['action'] });
chrome.contextMenus.create({ id: 'sep', type: 'separator', contexts: ['action'] });
chrome.contextMenus.create({ id: 'settings', title: 'Settings', contexts: ['action'] });

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === 'manage-tab') {
    // 获取当前标签域名, 打开 options page 带 ?action=intent&domain=xxx 参数
    // Options 页解析参数后直接弹出 IntentCreator
  }
  if (info.menuItemId === 'ai-analyze') {
    // 触发 AI 分析流程, 完成后打开 popup 展示结果
  }
  if (info.menuItemId === 'settings') {
    chrome.runtime.openOptionsPage();
  }
});
```

---

## 8. 组件行为规格

### 8.1 Popup (380×580px)

#### TopBar
- 左侧: TabFlow logo (⚡图标 + "TabFlow" 文字)
- 右侧: 当前标签总数 + 活跃规则数 (实时更新)

#### Current Tab Context Bar (TopBar 下方常驻)
- 获取方式: chrome.tabs.query({ active: true, currentWindow: true })
- 显示: favicon + 域名
- 两种状态:
  - 无规则匹配: 绿色 "⚙️ Manage" 按钮 → 点击弹出 IntentCreator (域名预填)
  - 有规则匹配: 黄色 pill 显示规则名 + 剩余时间 (如 "Video 1hr · 42:10")

#### NavBar
- 3 个 tab: Now / Soon / Past (带各自计数 badge)
  - Now: 所有打开的标签 (= chrome.tabs.query)
  - Soon: 有规则匹配、正在倒计时的标签 (即将关闭)
  - Past: 已自动关闭保存的标签 (= 暂存区, 可恢复)
- 选中态: 绿色文字 + 绿色底部线条
- Rules 不再是导航维度, 移到 Settings 页作为配置入口

#### SearchBar (常驻)
- placeholder: Now → "Search tabs..." / Past → "Search past tabs..."
- 支持 ⌘K 快捷键聚焦
- 实时过滤: 匹配标题或域名

#### Now 视图 (TabList / TabGroupedList)
- 显示所有没有活跃倒计时的标签
- 标签 ≤ 15 个: 平铺列表, > 15 个: 域名分组折叠
- 每行: favicon + 标题 + 域名·活跃时间
- hover 显示 2 个操作按钮: ⚙️ Manage / ✕关闭

#### Soon 视图
- 显示所有正在倒计时的标签 (有规则匹配且 alarm 活跃)
- 顶部灰色说明: "These tabs will auto-close when their time is up."
- 每行: favicon + 标题 + 域名·规则名 + 倒计时 pill
- 倒计时样式:
  - 黄色 pill "18:32" = 正常倒计时
  - 红色闪烁 pill "02:15" + 红色边框 = <5 分钟即将关闭

#### Past 视图 (PastList / PastGroupedList)
- 原暂存区, 显示所有自动关闭的标签
- ≤ 20 条: 平铺列表, > 20 条: 按时间分组
  - 新的默认展开, 旧的折叠
  - 每个展开组有 "Restore all" 批量恢复
- PastFilterBar: All / By Rule / By Site
- 每行: favicon + 标题 + 规则名·关闭时间 + Restore 按钮
- 顶部: 总数统计 + "Clear expired" 按钮
- 底部: "Everything is recoverable for 7 days."

#### Undo Close (即时撤销, 5秒窗口) — 双层实现

自动关闭发生在用户浏览网页时, 不在 popup 里
所以撤销提示必须出现在用户视野中

**Layer 1: Content Script Snackbar (主方案)**
- 权限: `"permissions": ["scripting"]` + `"host_permissions": ["<all_urls>"]`
- 实现: 关闭标签后, 对当前 active tab 注入 snackbar
  ```
  chrome.scripting.executeScript({
    target: { tabId: activeTab.id },
    func: showUndoSnackbar,
    args: [{ count: 3, domains: ["x.com", "reddit.com", "instagram.com"] }]
  })
  ```
- 视觉: 页面右下角黑色半透明条, 不抢焦点, 不改布局
  - "✔ 3 tabs cleaned · Undo (5s)"
  - 5秒倒计时进度条, 自动消失
  - 点击 Undo → chrome.runtime.sendMessage → SW 恢复标签
- Shadow DOM 封装, 不受页面 CSS 影响
- 不堆叠: 新 snackbar 替换旧 snackbar

**Layer 2: Badge + Popup 降级 (零权限回退)**
- 如果用户拒绝 host_permissions 或 MVP 先不申请:
  - 关闭后: 扩展图标 badge 显示 "3" (红色)
  - 用户点击图标: popup 顶部显示 UndoBanner
  - "⚡ 3 tabs just closed · Undo"
  - 5秒内打开 popup 可撤销, 否则进入 Past

**MVP 决策: 先实现 Layer 2 (零权限), Phase 2 加 Layer 1**
- MVP 最小权限原则, 不申请 `<all_urls>`
- Phase 2 用 `optional_permissions` 让用户选择开启 Snackbar
  ```json
  "optional_permissions": ["scripting"],
  "optional_host_permissions": ["<all_urls>"]
  ```
- Settings 页面: "Enable in-page undo notification" toggle
  - 开启时触发 `chrome.permissions.request()`
  - 用户可随时关闭

#### IntentCreator (Popup 覆盖层, 从 TopBar "Manage" 或标签行 ⚙️ 触发)
- 域名展示行 (只读): favicon + 域名 + "current tab" 标签
- 重复检测警告 (条件显示): "Already covered by [规则名]" + "Replace" 链接
- 意图驱动问题: "Why is this tab open?"
- 三个意图按钮 (用户只需点一个):
  - ⏳ "Just browsing" → 内部映射: 15m inactive
  - 🔄 "I'll come back later" → 内部映射: 2h inactive
  - 📌 "Important — don't close" → 内部映射: 加入白名单, 永不自动关闭
- 用户不需要理解规则, 选意图即可
- Cancel / Done 按钮

#### AIResults
- 返回按钮 "← Back to Tabs"
- AI 模型标签 (如 "Claude Haiku")
- 隐私提示: "Only URLs and titles sent. No page content."
- 4 类建议卡片 (各自颜色):
  - 🗑 Close (红) + "Close All" 按钮
  - ⚙️ Create Rule (黄) + "Apply" 按钮 (为匹配域名创建规则)
  - ⚙️ Rule (绿) + "Create" 按钮
- 底部输入框: "Ask about your tabs..."

#### AIConsentModal
- 首次启用 AI 时弹出
- 说明发送什么 / 不发送什么 / API Key 存储位置
- "Not Now" / "I Understand, Enable AI"

#### OnboardingBanner
- 首次使用后显示在 Now 列表顶部
- "1 rule active · [规则名]. Matching tabs will auto-close when inactive."
- 可关闭 (✕), 关闭后写 storage 不再显示

#### TrustBanner (关键留存组件)
- 触发条件: 上次关闭 popup 后有标签被自动关闭
- 显示在 Now 列表顶部 (OnboardingBanner 之后)
- 内容: "✅ [N] tabs cleaned · Nothing lost"
- 副文: "Everything is safe in **Past**" (Past 可点击跳转)
- 可关闭 (✕), 关闭后清除 pending 计数
- 存储: chrome.storage.local "pendingCleanCount" (number)
  - 每次自动关闭 +1
  - 用户打开 popup 看到 banner 后清零
- 首次显示时极其重要 → 决定用户是否继续使用还是卸载

#### AI Analyze 按钮
- 底部常驻: "✨ AI Analyze All Tabs"
- 标签多时显示数量: "✨ AI Analyze All 33 Tabs"

### 8.2 Options Page (宽屏)

#### WelcomePage (首次安装)
- 3 个价值卡片 (规则/AI/暂存)
- "Quick Setup (30 seconds) →" 主按钮
- "Skip, I'll explore on my own" 跳过链接
- 完成后 settings.isFirstInstall = false

#### QuickSetupPage
- 3 个预设规则模板, 每个有 on/off 开关:
  - 🎭 Social Media · 30min (x.com, reddit.com, instagram.com)
  - 🎬 Video Sites · 1hr (youtube.com, bilibili.com)
  - 🛒 Shopping · 20min (amazon.com, taobao.com)
- 域名标签可点 "+edit" 修改
- AI 功能开关 (默认 off)
- "Done · Activate N rules" 按钮 (文案实时反映选择数量)

#### RulesPage (从 Settings 进入)
- 规则列表:
  - 标题 + 描述 + 开关
  - 域名标签(蓝) + 触发标签(黄) + 动作标签(红)
  - 统计: 触发次数
  - 来源: Manual / AI Generated
  - ⋮ 更多菜单: Edit / Duplicate / Delete
  - Delete 需二次确认弹窗
- "+ Create Rule" 按钮 → 打开 RuleEditor

#### IntentCreator (从标签行触发)
- 域名展示 (只读, favicon + 域名 + "current tab")
- 重复检测警告 (条件显示)
- 意图选择: "Just browsing" / "I'll come back later" / "Important — don't close"
- Cancel / Done 按钮

#### RuleEditor (从 Rules 页面 "+ Create Rule")
- 三步竖排表单, 零术语:
  - Step 1 "Which site?": 域名输入框 (逗号分隔), 提示 "Subdomains auto-matched"
  - Step 2 "Close after": 快捷按钮 15 min / 30 min / 1 hour / 2 hours
  - Step 3 "Start counting when...": 两个选项卡片
    - "I stop looking at it" (= inactive, 默认选中)
    - "It's been open (total)" (= openDuration)
    - 底部灰色提示: "Most people pick the first option"
- Rule Name 永远自动生成 (域名 · 时间), 不暴露给用户
- Action 永远 closeStash, 不暴露给用户 (notifyOnly 留到 Phase 2)
- Cancel / Save Rule 按钮

#### SettingsPage
- Rules:
  - "Manage Rules →" 链接 → 打开 RulesPage
  - Protected Domains: 列出所有 📌 "Important" 标记的域名, 可删除
- General:
  - Language: English / 简体中文 (auto-detect)
  - Past Expiry: 7 / 14 / 30 days
- AI Configuration:
  - AI Analysis 开关 (默认 off)
  - LLM Provider: Claude Haiku / DeepSeek
  - API Key 输入框 + 连接状态
  - 隐私说明卡片
- Data Management:
  - Export Rules (下载 JSON)
  - Import Rules (上传 JSON)
  - Clear All Data (红色, 需确认)

---

## 9. AI 模块

### 9.1 LLM Provider 接口

```typescript
// src/ai/provider.ts
interface LLMProvider {
  name: string;
  analyze(tabs: { url: string; title: string }[], locale: string): Promise<AISuggestion[]>;
  testConnection(): Promise<boolean>;
}
```

### 9.2 Prompt 设计

```typescript
// src/ai/prompts.ts
export const SYSTEM_PROMPTS = {
  en: `You are TabFlow AI assistant. Analyze the user's browser tabs and return a JSON object with these 2 arrays:
- close: tabs to close (duplicates, already-read articles, stale searches)
- rule: if you detect a pattern, suggest a reusable auto-close rule

Each item: { urls: string[], reason: string, ruleDomain?: string, ruleMinutes?: number }
Return ONLY valid JSON. No markdown, no explanation.`,

  zh_CN: `你是 TabFlow AI 助手。分析用户的浏览器标签页并返回 JSON 对象，包含以下 2 个数组：
- close：建议关闭（重复、已读文章、过期搜索）
- rule：检测到规律时建议生成自动关闭规则

每项：{ urls: string[], reason: string, ruleDomain?: string, ruleMinutes?: number }
仅返回有效 JSON，不要 markdown 和解释。`
};
```

### 9.3 API 调用

```typescript
// Claude Provider 示例
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  },
  body: JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: SYSTEM_PROMPTS[locale],
    messages: [{ role: 'user', content: JSON.stringify(tabs) }]
  })
});
```

---

## 10. Storage 结构

```typescript
// chrome.storage.local
{
  "rules": Rule[],
  "stash": StashedTab[],
  "settings": Settings,
  "onboardingBannerDismissed": boolean
}
```

---

## 11. 国际化

```json
// _locales/en/messages.json (部分示例)
{
  "extName": { "message": "TabFlow" },
  "extDescription": { "message": "Smart tab lifecycle manager" },
  "allTabs": { "message": "All Tabs" },
  "past": { "message": "Past" },
  "rules": { "message": "Rules" },
  "searchTabs": { "message": "Search tabs..." },
  "aiAnalyze": { "message": "AI Analyze All Tabs" },
  "restore": { "message": "Restore" },
  "saveRule": { "message": "Save Rule" },
  "quickRule": { "message": "Create Rule for this site" }
}
```

```json
// _locales/zh_CN/messages.json (部分示例)
{
  "extName": { "message": "TabFlow" },
  "extDescription": { "message": "智能标签页生命周期管理" },
  "allTabs": { "message": "所有标签" },
  "stashed": { "message": "已暂存" },
  "rules": { "message": "规则" },
  "searchTabs": { "message": "搜索标签..." },
  "aiAnalyze": { "message": "AI 分析全部标签" },
  "restore": { "message": "恢复" },
  "saveRule": { "message": "保存规则" },
  "quickRule": { "message": "为此网站创建规则" }
}
```

---

## 12. 设计规范

```
色彩:
  背景层级: #090B10 → #0F1118 → #161923 → #1D2130
  主色(accent): #3EE889
  警告(warn): #F5A623
  危险(danger): #F45B69
  信息(info): #5B9CF4
  文字: #EDF0F7(主) / #9BA2B8(副) / #5D6380(弱) / #3E4359(最弱)
  边框: rgba(255,255,255,0.06) / hover: rgba(255,255,255,0.12)

字体:
  UI 文字: Outfit (Google Fonts)
  数字/代码: JetBrains Mono

圆角: 8px(小) / 12px(中) / 16px(大)

Popup 尺寸: 380px × 自适应高度(max 580px)
Options 页面: 响应式, max-width 960px 居中
```

---

## 13. 预设规则模板

```typescript
// src/shared/constants.ts
export const RULE_TEMPLATES: Omit<Rule, 'id' | 'stats' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Social Media · 30min',
    enabled: false,
    domains: ['x.com', 'twitter.com', 'reddit.com', 'instagram.com', 'weibo.com'],
    trigger: { type: 'inactive', minutes: 30 },
    action: 'closeStash',
    source: 'template',
  },
  {
    name: 'Video Sites · 1hr',
    enabled: false,
    domains: ['youtube.com', 'bilibili.com'],
    trigger: { type: 'openDuration', minutes: 60 },
    action: 'closeStash',
    source: 'template',
  },
  {
    name: 'Shopping · 20min',
    enabled: false,
    domains: ['amazon.com', 'taobao.com', 'jd.com'],
    trigger: { type: 'inactive', minutes: 20 },
    action: 'closeStash',
    source: 'template',
  },
];
```

---

## 14. 开发注意事项

### Service Worker 限制
- MV3 Service Worker 会在不活跃时休眠
- 必须用 chrome.alarms 而非 setTimeout/setInterval
- 所有状态必须持久化到 chrome.storage, 不能依赖内存变量
- Service Worker 唤醒时需要从 storage 恢复状态

### chrome.alarms 限制
- 最小间隔: 1 分钟 (开发模式下无限制)
- alarm name 必须唯一: 用 "rule_{ruleId}_{tabId}" 格式

### Popup 生命周期
- Popup 每次打开都是新实例, 关闭即销毁
- 倒计时显示: Popup 打开时从 background 获取各 alarm 剩余时间
- 用 chrome.runtime.sendMessage 与 background 通信

### AI API Key 安全
- 存储在 chrome.storage.local, 不上传到任何服务器
- 直接从浏览器端调用 LLM API (不经过中间服务器)
- Claude API 需要 'anthropic-dangerous-direct-browser-access' header

---

## 15. 开发顺序

按以下顺序实现, 每步完成后可独立测试:

```
Week 1: 基础架构
  ① 项目脚手架 (Vite + CRXJS + React + TS + Tailwind)
  ② Manifest V3 配置, popup/options 空壳渲染
  ③ chrome.storage 封装 + types.ts 数据模型
  ④ popup TopBar + NavBar + SearchBar 组件

Week 2: 规则引擎
  ⑤ Rule CRUD (storage 读写)
  ⑥ RulesPage + RuleCard + RuleSidebar 组件
  ⑦ IntentCreator + RuleEditor 组件
  ⑧ RuleCardMenu (⋮ 菜单: Edit/Duplicate/Delete)
  ⑨ Service Worker: rule-engine.ts 规则匹配逻辑

Week 3: 定时关闭 + 暂存
  ⑩ alarm-manager.ts + chrome.alarms 注册/取消 (规则定时)
  ⑪ stash-manager.ts (保存/恢复/过期清理)
  ⑫ IntentCreator (Popup 覆盖层, 从标签行 ⚙️ 触发)
  ⑬ TabList + TabRow (含规则倒计时状态显示)
  ⑮ PastList + PastGroupedList

Week 4: AI 模块
  ⑰ LLM Provider 抽象层 + Claude/DeepSeek 实现
  ⑱ prompts.ts 多语言 prompt
  ⑲ parser.ts 解析 AI 返回
  ⑳ AIResults + SuggestionCard 组件
  ㉑ 一键执行逻辑 (close/rule)
  ㉒ AIConsentModal

Week 5: 国际化 + 引导 + 设置
  ㉓ chrome.i18n 全量替换硬编码文字
  ㉔ _locales/en + zh_CN 翻译文件
  ㉕ WelcomePage + QuickSetupPage (首次安装引导)
  ㉖ OnboardingBanner
  ㉗ SettingsPage (语言/AI配置/数据导出导入)
  ㉘ Export/Import Rules JSON

Week 6: 测试 + 上架
  ㉙ 全流程测试 (规则→定时→通知→关闭→暂存→恢复)
  ㉚ 50 标签 + 10 规则 压力测试
  ㉛ Service Worker 休眠/唤醒 稳定性测试
  ㉜ Chrome Web Store 素材 + 提审
```
