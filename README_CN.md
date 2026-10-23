# Selectly

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)

选中网页上的任意文本，立刻获得 AI 操作：翻译、润色、解释、纠正语法、对话。支持 OpenAI、Anthropic、DeepSeek、OpenRouter、SiliconFlow 及所有 OpenAI 兼容 API。

[English](./README.md) | 中文文档

## 功能特性

**文本操作** — 🌐 翻译 · ✨ 润色 · 💡 解释 · ✅ 纠正语法 · 💬 对话

**实用工具** — 🔍 搜索 · 📋 复制 · 🔗 打开链接 · 📚 收藏 · 📤 分享为图片

**高级功能** — 👑 订阅 · ☁️ 云同步 · 🔐 OAuth2 登录

**可定制** — 🔧 多 LLM 提供商 · ⚙️ 开关功能 · 📝 编辑提示词 · ➕ 自定义功能 · 🌍 7 种语言 · 🎨 按钮位置

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

点击扩展图标 → LLM 配置标签 → 选择提供商，粘贴 API 密钥，选择模型。

## 技术栈

| | | |
| --- | --- | --- |
| [Plasmo](https://plasmo.com/) | 扩展框架 | 0.90.5 |
| [TypeScript](https://www.typescriptlang.org/) | 语言 | 5.3.3 |
| [React](https://reactjs.org/) | UI | 18.2.0 |
| [Tailwind CSS](https://tailwindcss.com/) | 样式 | 3.4.17 |
| [OpenAI SDK](https://github.com/openai/openai-node) | LLM 调用 | 5.16.0 |
| [Dexie.js](https://dexie.org/) | IndexedDB | 4.0.8 |
| [Stripe](https://stripe.com/) | 支付 | 9.8.0 |

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

- 配置和 API 密钥不离开你的浏览器
- 文本只发送到你选择的 LLM 提供商
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
- [ ] 更多内置功能
- [ ] 高级提示词模板
- [ ] 导出/导入配置
- [ ] 功能市场

## 许可证

MIT — [LICENSE](LICENSE)

## 支持

[Issues](https://github.com/samanhappy/selectly/issues) · [Discussions](https://github.com/samanhappy/selectly/discussions)

### 本地模式、付费入口与赞赏开关

默认关闭 Selectly 官方云端服务：不初始化云端登录、不查询订阅、不进行云同步，
也不提供官方云端模型。配置写入 `chrome.storage.local`；首次使用会复制原有
Chrome 同步存储中的设置，不覆盖已有本地值，也不删除旧副本。
收藏、高亮及聊天记录继续存放于本地 IndexedDB。

AI 功能需要自行配置模型接口。完全离线使用时，请配置本机的 OpenAI 兼容接口；
如果自行配置第三方远程服务商，请求仍会发送给该服务商。
未配置模型或保留旧云端模型时，不会调用或回退到官方云端。
赞赏链接仅在主动点击时打开。

在 `.env.development.local` 或 `.env.production.local` 设置构建开关：

```dotenv
PLASMO_PUBLIC_CLOUD_ENABLED=false
PLASMO_PUBLIC_PAID_UI_ENABLED=false
PLASMO_PUBLIC_SUPPORT_ENABLED=true
PLASMO_PUBLIC_SUPPORT_URL=https://ko-fi.com/samanhappy
```

仅在明确设为 `PLASMO_PUBLIC_CLOUD_ENABLED=true` 后恢复官方云端；
付费入口还需单独设为 `PLASMO_PUBLIC_PAID_UI_ENABLED=true`。
赞赏开关和 HTTPS 链接可独立配置。修改后需重启开发服务或重新构建。
这些开关不授予会员权益，也不绕过服务端额度限制。
