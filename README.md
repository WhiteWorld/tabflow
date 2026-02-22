# TabFlow

Chrome MV3 扩展，通过规则自动管理标签页生命周期。

- 按域名配规则，不活跃/超时自动关闭标签
- 关闭的标签进入 Past（暂存区），保留 7 天可随时恢复
- 5 秒撤销窗口
- 从标签行一键创建规则（意图驱动）

## 快速开始

```bash
npm install
npm run build
```

加载到 Chrome：`chrome://extensions` → 开启开发者模式 → 加载已解压的扩展程序 → 选择 `dist/`

开发模式（热更新）：

```bash
npm run dev
```

## 文档

- [`docs/architecture.md`](docs/architecture.md) — 架构文档（数据模型、组件列表、核心流程）
- [`docs/tabflow-ui-gallery.jsx`](docs/tabflow-ui-gallery.jsx) — UI 原型，可独立运行预览所有界面
- [`docs/tabflow-dev-spec.md`](docs/tabflow-dev-spec.md) — 原始规格文档（历史参考）
