# Selectly

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)

用 AI 理解任何网页。选中文本即可翻译或解释，打开侧边栏即可总结并追问整页内容。Selectly Cloud 开箱即用，高级用户仍可自带 OpenAI 兼容供应商。

[English](./README.md) | 中文文档

## 功能特性

**核心阅读循环** — 划词翻译 · 结合上下文解释 · 询问整页

**侧边栏** — 页面总结 · 上下文问答 · 绑定标签页的对话历史

**高级动作** — 润色 · 纠错 · 高亮 · 自定义 Prompt

**模型选项** — 默认使用 Selectly Cloud · BYOK 支持 OpenAI、Anthropic、DeepSeek、OpenRouter、SiliconFlow 及兼容 API

## 快速开始

### Chrome 网上应用店

[从 Chrome 网上应用店安装](https://chromewebstore.google.com/detail/selectly-your-personal-ai/cpgfbcghiimbjkkdjaljkhpbdlccfeap)。

### 从源码安装

```bash
git clone https://github.com/samanhappy/selectly.git
cd selectly
pnpm install
pnpm dev
```

在 Chrome 中：`chrome://extensions/` → 开启开发者模式 → 加载已解压的扩展程序 → 选择 `build/chrome-mv3-dev`。

### 配置 LLM

Selectly Cloud 是默认模型路径。如需自带供应商，点击扩展图标 → LLM 配置标签 → 选择提供商，粘贴 API 密钥，选择模型。

## 技术栈

|                                                     |           |        |
| --------------------------------------------------- | --------- | ------ |
| [Plasmo](https://plasmo.com/)                       | 扩展框架  | 0.90.5 |
| [TypeScript](https://www.typescriptlang.org/)       | 语言      | 5.3.3  |
| [React](https://reactjs.org/)                       | UI        | 18.2.0 |
| [Tailwind CSS](https://tailwindcss.com/)            | 样式      | 3.4.17 |
| [OpenAI SDK](https://github.com/openai/openai-node) | LLM 调用  | 5.16.0 |
| [Dexie.js](https://dexie.org/)                      | IndexedDB | 4.0.8  |
| [Stripe](https://stripe.com/)                       | 支付      | 9.8.0  |

## 架构

```
selectly/
├── core/              # 业务逻辑
│   ├── services/      # LLM、操作、收藏、订阅
│   ├── storage/       # 加密存储、IndexedDB、迁移
│   ├── auth/          # OAuth2
│   ├── i18n/          # 7 种语言
│   └── content/       # 内容脚本 UI
├── components/
│   ├── content/       # 浮动按钮、流式结果、分享卡片
│   ├── options/       # 设置页面
│   └── ui/            # shadcn/ui 基础组件
├── background.ts      # Service Worker
├── content.tsx        # 内容脚本入口
├── popup.tsx          # 弹窗
└── options.tsx        # 选项页面
```

每个服务只管一件事。LLM 适配器可以按提供商替换。敏感数据加密存储。一切都在浏览器内完成。

## 隐私

- BYOK 配置和 API 密钥不离开你的浏览器
- 只有当你触发 AI 动作时，文本才会发送到 Selectly Cloud 或你选择的 LLM 提供商
- 无跟踪、无分析
- 通过 Chrome 安全存储加密
- 源码开放

## 开发

```bash
pnpm dev          # 热重载
pnpm build        # 生产构建
pnpm package      # 打包为 zip
pnpm test         # 运行测试
pnpm format       # Prettier 格式化
```

## 贡献

随便挑：翻译、新 LLM 提供商、内置功能、修 bug、文档、UI 改进。保持 TypeScript + React 风格，服务要小，改完要测。

## 路线图

- [ ] Firefox 和 Edge
- [ ] 更强的侧边栏页面理解
- [ ] 需要用户确认的网页操作建议
- [ ] 导出/导入配置

## 许可证

MIT — [LICENSE](LICENSE)

## 支持

[Issues](https://github.com/samanhappy/selectly/issues) · [Discussions](https://github.com/samanhappy/selectly/discussions)
