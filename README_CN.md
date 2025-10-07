# Selectly

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensio## 🛠️ 技术栈

| 技术                                                    | 用途                      | 版本   |
| ------------------------------------------------------- | ------------------------- | ------ |
| **[Plasmo](https://plasmo.com/)**                       | 现代浏览器扩展框架        | 0.90.5 |
| **[TypeScript](https://www.typescriptlang.org/)**       | 类型安全开发              | 5.3.3  |
| **[React](https://reactjs.org/)**                       | UI 组件                   | 18.2.0 |
| **[Tailwind CSS](https://tailwindcss.com/)**            | 样式框架                  | 3.4.17 |
| **[OpenAI SDK](https://github.com/openai/openai-node)** | LLM 集成                  | 5.16.0 |
| **[Dexie.js](https://dexie.org/)**                      | 收藏功能的 IndexedDB 封装 | 4.0.8  |
| **[Stripe](https://stripe.com/)**                       | 支付处理                  | 9.8.0  |
| **Chrome Identity API**                                 | OAuth2 认证               | 内置   |

---[TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)

🚀 **Selectly** 是一款 AI 驱动的浏览器扩展，通过智能操作增强文本选择功能。使用大语言模型（LLM）的上下文感知文本处理能力，改变你的浏览体验。

[English](./README.md) | 中文文档

---

## ✨ 功能特性

### 🤖 AI 驱动的操作

利用大语言模型的强大能力即时处理选中的文本：

- **🌐 智能翻译**：自动检测语言并翻译到你偏好的语言
- **✨ 文本润色**：改善表达、清晰度和流畅度
- **💡 内容解释**：获取概念和上下文的详细解释
- **✅ 语法纠正**：修复语法和拼写错误
- **💬 互动聊天**：与选中的文本进行对话

### 🛠️ 实用功能

触手可及的快速实用操作：

- **🔍 快速搜索**：在你偏好的搜索引擎中搜索选中的文本
- **📋 复制**：一键复制到剪贴板
- **🔗 打开链接**：直接打开选中的 URL
- **📚 收藏**：保存有趣的文本片段到个人收藏
- **📤 分享**：生成精美的文本卡片并分享为图片

### � 高级功能

- **👑 订阅系统**：通过灵活的订阅计划解锁高级功能
- **☁️ 云同步**：跨设备同步你的数据
- **🔐 安全认证**：基于 OAuth2 的认证

### 🎛️ 高度可定制

- **🔧 多提供商支持**：兼容 OpenAI、Anthropic、DeepSeek、OpenRouter、SiliconFlow 等
- **⚙️ 功能开关**：根据需要启用/禁用功能
- **📝 自定义提示词**：为每个功能个性化提示词
- **➕ 添加自定义功能**：创建自定义的 AI 驱动功能
- **🌍 多语言**：支持英语、中文、日语、西班牙语、法语、德语和葡萄牙语
- **🎨 灵活的界面**：选择按钮位置（选区上方/下方）

---

## 🚀 快速开始

### 从 Chrome 网上应用店安装

1. 打开 Chrome 浏览器
2. 访问 [Selectly Chrome 网上应用店页面](https://chromewebstore.google.com/detail/selectly-your-personal-ai/cpgfbcghiimbjkkdjaljkhpbdlccfeap)
3. 点击“添加到 Chrome”
4. 确认点击“添加扩展程序”

### 从源码安装

#### 1. 前置要求

- [Node.js](https://nodejs.org/) 16+ 和 [pnpm](https://pnpm.io/)
- Chrome 或基于 Chromium 的浏览器

#### 2. 克隆仓库

```bash
git clone https://github.com/samanhappy/selectly.git
cd selectly
```

#### 3. 安装依赖

```bash
pnpm install
```

#### 4. 开发模式

```bash
pnpm dev
```

这将启动支持热重载的开发服务器。

#### 5. 加载扩展

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 启用"开发者模式"（右上角切换开关）
4. 点击"加载已解压的扩展程序"
5. 选择 `build/chrome-mv3-dev` 目录

#### 6. 配置 LLM

1. 点击工具栏中的扩展图标
2. 切换到"LLM 配置"标签
3. 选择一个提供商并输入你的 API 密钥
4. 点击"测试连接"进行验证
5. 选择你偏好的模型

#### 7. 开始使用

在任意网页选择文本，操作按钮会自动出现！

---

## 📋 配置指南

### 自定义功能

你可以创建自定义的 AI 驱动功能：

#### 示例：代码审查

```
功能键名: code_review
提示词: 请审查以下代码并提供改进建议：\n\n{text}
模型: default（或指定模型）
自动执行: false
```

#### 示例：简化文本

```
功能键名: simplify
提示词: 简化以下文本，使其更易于理解：\n\n{text}
```

#### 示例：生成创意

```
功能键名: brainstorm
提示词: 生成 5 个与以下内容相关的创意想法：\n\n{text}
```

### 特定域名功能

你可以配置功能以：

- **在特定域名自动执行**：在特定网站选择文本时自动运行
- **仅在特定域名显示**：只在特定网站显示功能按钮
- **自动关闭按钮**：执行后自动隐藏按钮

---

## 🛠️ 技术栈

- **框架**: [Plasmo](https://plasmo.com/) - 现代扩展开发框架
- **语言**: TypeScript + React
- **LLM**: OpenAI SDK

## 📁 项目结构

```
selectly/
├── core/                          # 核心业务逻辑
│   ├── config/
│   │   └── llm-config.ts         # 配置管理
│   ├── services/
│   │   ├── llm-service.ts        # LLM 服务（提供商无关）
│   │   ├── action-service.ts     # 操作处理
│   │   ├── collect-service.ts    # 收藏管理
│   │   ├── collect-sync-service.ts # 收藏云同步
│   │   ├── collect-sync-api.ts   # 同步 API 客户端
│   │   ├── collect-sync-types.ts # 同步类型定义
│   │   ├── subscription-service-v2.ts # 订阅管理
│   │   ├── cloud-sync-subscription-service.ts # 云订阅同步
│   │   ├── model-service.ts      # LLM 模型解析
│   │   ├── image-generator-service.ts # 分享图片生成
│   │   └── notification-service.ts # 用户通知
│   ├── storage/
│   │   ├── secure-storage.ts     # 加密存储封装
│   │   ├── collect-db.ts         # 收藏的 IndexedDB
│   │   ├── dictionary-db.ts      # 词典 IndexedDB
│   │   ├── sync-queue-db.ts      # 同步队列数据库
│   │   ├── crypto.ts             # 加密工具
│   │   ├── migration.ts          # 存储迁移
│   │   └── security-test.ts      # 安全测试
│   ├── auth/
│   │   ├── auth-service.ts       # OAuth2 认证
│   │   └── auth-background-bridge.ts # 认证后台桥接
│   ├── i18n/                      # 国际化
│   │   ├── index.ts              # i18n 入口
│   │   ├── types.ts              # i18n 类型定义
│   │   ├── hooks/                # i18n React hooks
│   │   └── locales/              # 翻译文件
│   ├── hooks/
│   │   └── useSubscription.ts    # 订阅 React hook
│   ├── content/
│   │   ├── Selectly.tsx          # 主内容脚本 UI
│   │   └── content-styles.ts     # 内容脚本样式
│   ├── oauth/                     # OAuth 工具
│   ├── premium-api-v2.ts          # 高级 API 客户端
│   └── user-info.tsx              # 用户信息组件
├── components/
│   ├── content/
│   │   ├── ActionButtons.tsx     # 浮动操作按钮
│   │   ├── StreamingResult.tsx   # 流式 LLM 响应显示
│   │   ├── ShareImageRenderer.tsx # 分享图片生成
│   │   ├── SharePreview.tsx      # 分享预览组件
│   │   └── ErrorBoundary.tsx     # 错误处理
│   ├── options/
│   │   ├── GeneralPage.tsx       # 通用设置页面
│   │   ├── LLMPage.tsx           # LLM 配置页面
│   │   ├── FunctionsPage.tsx     # 功能配置页面
│   │   ├── FunctionCard.tsx      # 功能配置卡片
│   │   ├── SubscriptionPage.tsx  # 订阅页面
│   │   ├── SubscriptionManagerV3.tsx # 订阅管理器 UI
│   │   ├── SubscriptionStatus.tsx # 订阅状态显示
│   │   ├── CollectionsPage.tsx   # 收藏管理页面
│   │   ├── DictionaryPage.tsx    # 词典页面
│   │   ├── OptionsHeader.tsx     # 选项页面头部
│   │   ├── PopupHeader.tsx       # 弹窗头部
│   │   ├── Sidebar.tsx           # 选项侧边栏
│   │   ├── TabsBar.tsx           # 设置标签页
│   │   ├── Drawer.tsx            # 抽屉组件
│   │   ├── constants.ts          # UI 常量
│   │   └── forms/                # 表单组件
│   ├── shared/
│   │   └── PremiumCrown.tsx      # 高级标识组件
│   └── ui/                        # 可复用 UI 组件 (shadcn/ui)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── input.tsx
│       └── separator.tsx
├── lib/
│   └── utils.ts                   # 工具函数
├── utils/
│   ├── icon-utils.ts              # 图标工具
│   └── url-utils.ts               # URL 工具
├── locales/                       # 旧版本地化文件
├── scripts/
│   └── generate-keys.js           # 密钥生成工具
├── background.ts                  # Service Worker（事件处理）
├── content.tsx                    # 内容脚本入口
├── popup.tsx                      # 扩展弹窗
├── options.tsx                    # 选项页面
├── style.css                      # 全局样式
├── tailwind.config.js             # Tailwind 配置
├── postcss.config.js              # PostCSS 配置
├── tsconfig.json                  # TypeScript 配置
└── package.json                   # 项目依赖
```

### 架构原则

遵循**单一职责**和**模块化设计**：

- **服务**：每个服务处理一个关注点（LLM、操作、存储等）
- **关注点分离**：UI 组件仅处理展示；业务逻辑存在于服务中
- **提供商无关**：LLM 服务通过适配器支持多个提供商
- **默认安全**：敏感数据静态加密
- **可测试**：小型纯函数，接口清晰

---

## 🔒 隐私与安全

- ✅ **本地优先**：所有配置存储在浏览器本地存储中
- ✅ **无数据收集**：零跟踪或分析
- ✅ **API 密钥保持私密**：密钥永不离开你的浏览器
- ✅ **直接 LLM 通信**：文本仅发送到你配置的 LLM 提供商
- ✅ **加密存储**：使用 Chrome 的安全存储加密敏感数据
- ✅ **开源**：完全透明 - 你可以自行审计代码

---

## 🧪 开发

### 可用命令

```bash
# 开发模式，支持热重载
pnpm dev

# 生产构建
pnpm build

# 打包扩展（创建 zip）
pnpm package

# 生成 OAuth 密钥
pnpm generate-keys

# 格式化所有文件
pnpm format

# 检查格式化状态
pnpm format:check
```

### 代码质量

- **TypeScript**：严格类型检查
- **模块化**：单一职责原则
- **可组合**：小型、可复用的函数
- **无全局状态**：服务尽可能使用依赖注入

---

## 🤝 贡献

欢迎贡献！以下是你可以提供帮助的方式：

### 指南

- 遵循现有代码风格（TypeScript + React）
- 保持服务专注（单一职责）
- 为复杂逻辑添加注释
- 在多种场景下测试
- 如需要，更新文档

### 贡献想法

- 🌍 添加新语言翻译
- � 添加对新 LLM 提供商的支持
- ✨ 创建新的内置功能
- 🐛 修复 bug 并改进错误处理
- 📖 改进文档
- 🎨 增强 UI/UX

---

## 📝 路线图

- [ ] Firefox 和 Edge 支持
- [ ] 更多内置 AI 功能
- [ ] 高级提示词模板
- [ ] 导出/导入配置
- [ ] 功能市场（分享自定义功能）

---

## 🙏 致谢

使用以下优秀的开源项目构建：

- [Plasmo](https://plasmo.com/) - 现代扩展框架
- [Tailwind CSS](https://tailwindcss.com/) - 样式框架

---

## 📄 许可证

本项目采用 **MIT 许可证** - 详见 [LICENSE](LICENSE) 文件。

---

## 💬 支持

如果你遇到问题或有疑问：

1. 查看现有 [Issues](https://github.com/samanhappy/selectly/issues)
2. 搜索 [Discussions](https://github.com/samanhappy/selectly/discussions)
3. 提交包含详细信息的新 issue

---

## ⭐ Star 历史

如果这个项目对你有帮助，请考虑给它一个 ⭐ star！

---

**用 ❤️ 为开源社区打造**
