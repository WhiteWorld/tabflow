# TabFlow — 架构文档

> 基于实际实现（截至 2026-02）整理，反映当前代码状态。

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈](#2-技术栈)
3. [目录结构](#3-目录结构)
4. [数据模型](#4-数据模型)
5. [Storage 结构](#5-storage-结构)
6. [Background Service Worker](#6-background-service-worker)
7. [Popup](#7-popup)
8. [Options Page](#8-options-page)
9. [Shared 工具层](#9-shared-工具层)
10. [设计规范](#10-设计规范)
11. [构建与开发](#11-构建与开发)

---

## 1. 项目概览

TabFlow 是一个 Chrome MV3 扩展，通过规则引擎自动管理标签页生命周期：

- **规则引擎**：按域名匹配，支持 `inactive`（不活跃超时）和 `openDuration`（打开总时长）两种触发类型
- **自动关闭 + 暂存**：关闭的标签保存到 Past（暂存区），可随时恢复，保留 7 天
- **即时撤销**：5 秒 Undo 窗口，badge + popup UndoBanner 双层提示
- **意图驱动创建**：从标签行一键弹出 IntentCreator，选择意图自动生成规则

**当前状态**：核心功能完整，AI 模块未实现。

---

## 2. 技术栈

| 层 | 技术 |
|----|------|
| 语言 | TypeScript (strict mode) |
| UI | React 18 + Tailwind CSS |
| 构建 | Vite + CRXJS (`@crxjs/vite-plugin`) |
| 扩展规范 | Chrome Manifest V3 |
| 存储 | `chrome.storage.local` |
| 定时器 | `chrome.alarms` API（SW 安全） |
| 国际化 | `chrome.i18n` API |

**关键配置**：`package.json` 必须有 `"type": "module"`，否则 CRXJS 的 `crx` export 无法加载。

---

## 3. 目录结构

```
tabflow/
├── manifest.json                    # Chrome MV3 配置
├── package.json                     # "type": "module" 必须存在
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── _locales/
│   ├── en/messages.json
│   └── zh_CN/messages.json
├── public/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png                 # 由 scripts/generate-icons.js 生成
├── scripts/
│   └── generate-icons.js
├── docs/
│   ├── architecture.md              # 本文档
│   ├── tabflow-dev-spec.md          # 原始规格文档（历史参考）
│   └── tabflow-ui-gallery.jsx       # UI 原型（可独立运行预览）
└── src/
    ├── background/
    │   ├── index.ts                 # SW 入口：事件注册、消息分发
    │   ├── rule-engine.ts           # 规则匹配与执行（tab 事件处理）
    │   ├── alarm-manager.ts         # chrome.alarms 管理
    │   ├── stash-manager.ts         # 暂存区 CRUD
    │   └── runtime-state.ts        # RuntimeState 读写封装
    ├── popup/
    │   ├── index.html
    │   ├── main.tsx
    │   ├── App.tsx                  # Popup 根组件，视图路由
    │   ├── utils.ts                 # formatCountdown, getRootDomain 等
    │   ├── components/
    │   │   ├── TopBar.tsx
    │   │   ├── NavBar.tsx           # Now / Soon / Past tab 导航
    │   │   ├── SearchBar.tsx
    │   │   ├── CurrentTabBar.tsx    # 当前 tab 域名 + 规则状态条
    │   │   ├── TabList.tsx          # Now 视图（含域名分组逻辑）
    │   │   ├── TabRow.tsx
    │   │   ├── SoonList.tsx         # 倒计时列表
    │   │   ├── PastList.tsx         # 暂存区（含时间分组逻辑）
    │   │   ├── IntentCreator.tsx    # 意图驱动规则创建覆盖层
    │   │   ├── UndoBanner.tsx       # 5 秒撤销横幅
    │   │   ├── TrustBanner.tsx      # 首次自动关闭信任横幅
    │   │   └── OnboardingBanner.tsx
    │   └── hooks/
    │       ├── useTabs.ts           # chrome.tabs 实时状态
    │       ├── useRuntime.ts        # RuntimeState 订阅
    │       ├── useRules.ts          # 规则列表订阅
    │       └── usePast.ts          # 暂存区订阅 + restore 操作
    ├── options/
    │   ├── index.html
    │   ├── main.tsx
    │   ├── App.tsx                  # Options 根组件，页面路由
    │   ├── pages/
    │   │   ├── WelcomePage.tsx      # 首次安装引导（2 卡片）
    │   │   ├── QuickSetupPage.tsx   # 模板规则开关
    │   │   ├── RulesPage.tsx        # 规则列表管理
    │   │   └── SettingsPage.tsx     # 通用设置
    │   └── components/
    │       ├── RuleCard.tsx         # 规则卡片（含二次确认删除）
    │       ├── RuleCardMenu.tsx     # ⋮ 菜单（Edit/Duplicate/Delete）
    │       ├── RuleEditor.tsx       # 3 步规则创建表单
    │       └── RuleSidebar.tsx      # 侧边栏容器（包裹 RuleEditor）
    └── shared/
        ├── types.ts                 # 全局类型定义
        ├── storage.ts               # chrome.storage 读写封装
        ├── constants.ts             # RULE_TEMPLATES, INTENT_PRESETS 等
        ├── utils.ts                 # extractRootDomain, normalizeDomain
        └── i18n.ts                  # chrome.i18n 工具函数
```

---

## 4. 数据模型

### Rule

```typescript
interface Rule {
  id: string;                          // crypto.randomUUID()
  name: string;                        // 自动生成："youtube.com · 30min"
  enabled: boolean;
  domains: string[];                   // 根域名，如 ["youtube.com", "bilibili.com"]
  trigger: {
    type: 'inactive' | 'openDuration';
    // inactive: 用户切走后超时
    // openDuration: 标签打开总时长超时
    minutes: number;
  };
  action: 'closeStash';               // MVP 固定值
  source: 'manual' | 'ai' | 'template';
  stats: { triggeredCount: number };
  createdAt: number;
  updatedAt: number;
}
```

**域名匹配规则**：`hostname === domain || hostname.endsWith('.' + domain)`
即 `youtube.com` 自动匹配 `www.youtube.com`、`m.youtube.com` 等所有子域名。

### StashedTab

```typescript
interface StashedTab {
  id: string;
  url: string;
  title: string;
  favIconUrl: string;
  closedAt: number;
  closedBy: string;    // 规则名 | "manual" | "ai"
  expiresAt: number;   // closedAt + stashExpiryDays * 86400000
}
```

### Settings

```typescript
interface Settings {
  language: 'auto' | 'en' | 'zh_CN';
  stashExpiryDays: number;        // 默认 7
  aiEnabled: boolean;             // 默认 false
  aiProvider: 'claude' | 'deepseek';
  aiApiKey: string;
  isFirstInstall: boolean;
  onboardingComplete: boolean;
  protectedDomains: string[];     // 永不自动关闭的域名白名单
  pendingCleanCount: number;      // TrustBanner 计数器
}
```

### RuntimeState

```typescript
interface ManagedTabEntry {
  tabId: number;
  ruleId: string;
  ruleName: string;               // 冗余存储，避免 popup 额外查询
  triggerType: 'inactive' | 'openDuration';
  startedAt: number;
  triggerAt: number;              // 0 = 已匹配但未激活倒计时（inactive 类型等待切走）
  alarmName: string;              // "rule_{ruleId}_{tabId}_{timestamp}"
  pausedAt?: number;              // inactive tab 切回时保存的 triggerAt 快照
}

interface RuntimeState {
  managedTabs: Record<number, ManagedTabEntry>;  // key = tabId
  tabCreatedAt: Record<number, number>;          // tab 创建时间戳
  lastUserInteractionAt: number;                 // Human Activity Guard 时间戳
  lastActiveTabId?: number;
  pendingUndoGroup: {
    stashIds: string[];
    closedAt: number;
  } | null;
}
```

---

## 5. Storage 结构

```typescript
// chrome.storage.local
{
  rules: Rule[],
  stash: StashedTab[],
  settings: Settings,
  runtime: RuntimeState,
  onboardingBannerDismissed: boolean
}
```

所有状态持久化到 `chrome.storage.local`，不依赖内存变量（MV3 Service Worker 随时休眠）。

---

## 6. Background Service Worker

### 入口 (`src/background/index.ts`)

注册以下事件监听：

| 事件 | 处理 |
|------|------|
| `chrome.runtime.onInstalled` | 初始化 settings、加载模板规则（disabled）、注册右键菜单、首次安装打开 options |
| `chrome.runtime.onStartup` | 一致性检查（清理已关闭 tab 的 runtimeState）、重建 alarm、stash 过期清理 |
| `chrome.tabs.onUpdated` | URL 变化时重新匹配规则 |
| `chrome.tabs.onActivated` | 切标签：启动/暂停 inactive 倒计时 |
| `chrome.tabs.onCreated` | 记录 tabCreatedAt |
| `chrome.tabs.onRemoved` | 清理 runtimeState（防泄漏） |
| `chrome.windows.onFocusChanged` | 浏览器失焦时启动 inactive 倒计时 |
| `chrome.alarms.onAlarm` | 执行关闭（串行队列，防并发） |
| `chrome.contextMenus.onClicked` | manage-tab / ai-analyze / settings |
| `chrome.runtime.onMessage` | 处理 popup 发来的消息 |

**Alarm 串行队列**：`onAlarm` 使用 Promise 队列顺序执行，防止并发竞争导致状态不一致。

### 规则引擎 (`src/background/rule-engine.ts`)

核心流程：

```
tab URL 变化 → 匹配 protectedDomains（白名单优先）→ 遍历 enabledRules 找第一条匹配
  openDuration → registerManagedTab（立即开始倒计时）
  inactive     → registerManagedTabPending（triggerAt=0，等切走时再计时）

tab 切走（onActivated prevTab）→ inactive 规则 → registerManagedTab（开始倒计时）
tab 切回（onActivated activeTab）→ inactive 规则 → 清除 alarm，重置 triggerAt=0

alarm 触发 →
  Human Activity Guard: lastUserInteractionAt < 15s → 延迟 1min 重试
  正常执行: saveToStash → tabs.remove → 更新 stats → 写 pendingUndoGroup → 设置 badge
```

### Alarm Manager (`src/background/alarm-manager.ts`)

- `alarmName` 格式：`rule_{ruleId}_{tabId}_{timestamp}`（含时间戳防 tabId 复用）
- `registerManagedTab`：写 runtimeState + 创建 alarm
- `registerManagedTabPending`：只写 runtimeState（`triggerAt=0`，不创建 alarm）
- `unregisterManagedTab`：清除 alarm + 删除 runtimeState 条目
- `rebuildForRule`：规则变更后全量扫描所有 tab 重建

### Stash Manager (`src/background/stash-manager.ts`)

- `saveToStash(tab, closedBy)`：创建 StashedTab 记录，`expiresAt = now + stashExpiryDays * 86400000`
- `restoreFromStash(stashId)`：`chrome.tabs.create` + 删除记录
- `cleanupExpiredStash()`：删除 `expiresAt < Date.now()` 的记录（每小时 alarm 触发）

### 消息类型

```typescript
type MessageType =
  | { type: 'UNDO_CLOSE' }
  | { type: 'RULE_CREATED'; rule: Rule }
  | { type: 'RULE_UPDATED'; rule: Rule }
  | { type: 'RULE_DELETED'; ruleId: string }
  | { type: 'GET_SOON_TABS' }
  | { type: 'PROTECT_DOMAIN'; domain: string }
  | { type: 'RESTORE_FROM_STASH'; stashId: string };
```

---

## 7. Popup

**尺寸**：380px 宽，高度自适应（max 580px）

### App.tsx — 根组件

管理视图状态（`now` / `soon` / `past`）和覆盖层（IntentCreator）。

数据订阅：
- `useTabs()` → 所有打开的 tab
- `useRuntime()` → managedTabs、pendingUndoGroup
- `useRules()` → 规则列表
- `usePast()` → 暂存区 + restore 操作

### 组件列表

| 组件 | 功能 |
|------|------|
| `TopBar` | Logo + 总 tab 数 + 活跃规则数 |
| `CurrentTabBar` | 当前 tab 域名 + favicon；无规则时显示 ⚙️ Manage 按钮；有规则时显示规则总时间（暂停时）或剩余倒计时（计时中）|
| `NavBar` | Now / Soon / Past tab 导航 + 数量 badge |
| `SearchBar` | 实时过滤（标题 + 域名），支持 ⌘K 聚焦 |
| `TabList` | Now 视图：≤15 tabs 平铺，>15 tabs 按域名分组折叠 |
| `TabRow` | 单条 tab 行：favicon + 标题 + 域名 + hover 操作 |
| `SoonList` | 倒计时列表，<5 分钟红色闪烁 |
| `PastList` | 暂存区：≤20 条平铺，>20 条按时间分组（justNow/lastHour/today/twoDaysAgo/older） |
| `IntentCreator` | 意图驱动覆盖层：Just browsing(15m) / I'll come back(2h) / Important(白名单) |
| `UndoBanner` | 5 秒撤销窗口横幅 |
| `TrustBanner` | 首次自动关闭后的信任提示 |
| `OnboardingBanner` | 首次使用引导提示 |

### CurrentTabBar 状态逻辑

```
tab 有规则 + triggerAt > 0（倒计时中）→ 显示实时剩余时间（红/黄 pill）
tab 有规则 + triggerAt = 0（inactive 暂停）→ 显示规则总配置时间（如 "30m"）
tab 无规则 → 显示 ⚙️ Manage 按钮
```

### 工具函数 (`popup/utils.ts`)

- `formatCountdown(ms)` → `"42:10"` / `"1:02:30"`
- `getRootDomain(hostname)` → 调用 `extractRootDomain`
- `getPastTimeGroup(closedAt)` → `'justNow' | 'lastHour' | 'today' | 'twoDaysAgo' | 'older'`
- `formatRelativeTime(ts)` → `"5m ago"` / `"2h ago"`

---

## 8. Options Page

### 页面路由

`welcome` → `quickSetup` → `rules` / `settings`

首次安装（`isFirstInstall=true`）从 `welcome` 开始；后续直接进 `rules`。

### 页面列表

| 页面 | 功能 |
|------|------|
| `WelcomePage` | 首次安装引导，2 张价值卡片，Quick Setup 入口 |
| `QuickSetupPage` | 3 个模板规则开关（Social/Video/Shopping），一键激活 |
| `RulesPage` | 规则列表：enable/disable 开关、⋮ 菜单、+ Create Rule |
| `SettingsPage` | 语言、暂存过期天数、保护域名、AI 配置（UI 存在，AI 功能未接线）、数据导入导出 |

### RuleEditor — 表单字段

1. **Site**：域名输入框（逗号分隔），显示匹配中的 open tab 数（debounce 300ms）
2. **Close after**：15min / 30min / 1h / 2h 快捷按钮 + 自定义输入
3. **Start timer when**：Tab not viewed（inactive）/ Tab open time（openDuration），带子标签说明
4. **Live description**：底部实时描述句，如 `"youtube.com tabs will close 30 minutes after you switch away."`
5. **冲突处理**：检测到域名已被其他规则覆盖时，Save 按钮变为 **Replace & Save**，点击后自动删除冲突规则再保存

### RuleCard — 二次确认删除

点 ⋮ → Delete → 卡片底部展开确认行 → 再次点 Delete 才真正删除。

---

## 9. Shared 工具层

### `shared/utils.ts`

- `extractRootDomain(hostname)` → eTLD+1 根域名（处理 `.co.uk` 等多段 TLD）
- `normalizeDomain(input)` → 接受完整 URL 或裸域名，返回根域名

### `shared/constants.ts`

- `RULE_TEMPLATES` — 3 个预设模板（Social/Video/Shopping）
- `INTENT_PRESETS` — IntentCreator 意图映射
- `generateRuleName(domains, minutes)` — 自动生成规则名

### `shared/storage.ts`

封装所有 `chrome.storage.local` 读写，提供带默认值的 get/set 函数：
`getRules / setRules / getSettings / setSettings / getRuntime / setRuntime / getStash / setStash / getOnboardingBannerDismissed / setOnboardingBannerDismissed`

---

## 10. 设计规范

### 颜色（Tailwind 自定义 token）

| Token | 值 | 用途 |
|-------|-----|------|
| `accent` | `#3EE889` | 主色（绿） |
| `warn` | `#F5A623` | 警告（橙） |
| `danger` | `#F45B69` | 危险（红） |
| `info` | `#5B9CF4` | 信息（蓝） |
| `bg1` | `#090B10` | 最深背景 |
| `bg2` | `#0F1118` | 次深背景 |
| `bg3` | `#161923` | 组件背景 |
| `bg4` | `#1D2130` | 输入框背景 |
| `pri` | `#EDF0F7` | 主文字 |
| `sec` | `#9BA2B8` | 副文字 |
| `ter` | `#5D6380` | 弱文字 |
| `faint` | `#3E4359` | 最弱文字 |

### 字体

- UI 文字：Outfit（Google Fonts）
- 数字/代码：JetBrains Mono

### 圆角

- 小：`rounded-[7px]`
- 中：`rounded-[10px]`
- 大：`rounded-[14px]`

---

## 11. 构建与开发

```bash
npm install        # 安装依赖
npm run dev        # 开发模式（watch，热更新）
npm run build      # 生产构建 → dist/
```

**加载到 Chrome**：`chrome://extensions` → 开启开发者模式 → 加载已解压的扩展程序 → 选择 `dist/`

**生成图标**：

```bash
node scripts/generate-icons.js
# → public/icon-{16,48,128}.png
```

---

## 附：未实现功能

| 功能 | 状态 | 说明 |
|------|------|------|
| AI 模块（`src/ai/`） | ❌ 未实现 | LLM 接入、AIResults 组件、AI 按钮 |
| SettingsPage AI 区块 | ⚠️ UI 存在，未接线 | provider 下拉、API key 输入未实装 |
| Content Script Snackbar | ❌ 延后 | Phase 2，需 `<all_urls>` 权限 |
| PastList 过滤栏 | ❌ 延后 | By Rule / By Site 过滤 |
