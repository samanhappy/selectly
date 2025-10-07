# Selectly

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)

🚀 **Selectly** is an AI-powered browser extension that enhances text selection with intelligent actions. Transform your browsing experience with context-aware text processing powered by Large Language Models (LLMs).

English | [中文文档](./README_CN.md)

---

## ✨ Features

### 🤖 AI-Powered Actions

Harness the power of LLMs to process selected text instantly:

- **🌐 Smart Translation**: Automatically detect language and translate to your preferred language
- **✨ Text Polishing**: Improve expression, clarity, and fluency
- **💡 Content Explanation**: Get detailed explanations of concepts and context
- **✅ Grammar Correction**: Fix grammar and spelling errors
- **💬 Interactive Chat**: Have a conversation about selected text

### 🛠️ Utility Functions

Quick, practical actions at your fingertips:

- **🔍 Quick Search**: Search selected text in your preferred search engine
- **📋 Copy**: One-click copy to clipboard
- **🔗 Open URL**: Open selected URLs directly
- **📚 Collect**: Save interesting text snippets to your personal collection
- **📤 Share**: Generate beautiful text cards and share as images

### 💎 Premium Features

- **👑 Subscription System**: Unlock advanced features with flexible plans
- **☁️ Cloud Sync**: Sync your data across devices
- **🔐 Secure Authentication**: OAuth2-based authentication

### 🎛️ Highly Customizable

- **🔧 Multi-Provider Support**: Compatible with OpenAI, Anthropic, DeepSeek, OpenRouter, SiliconFlow, and more
- **⚙️ Function Toggle**: Enable/disable features as needed
- **📝 Custom Prompts**: Personalize prompts for each function
- **➕ Add Your Own**: Create custom AI-powered functions
- **🌍 Multi-language**: Supports English, Chinese, Japanese, Spanish, French, German, and Portuguese
- **🎨 Flexible UI**: Choose button position (above/below selection)

---

## 🚀 Quick Start

### Installation from Chrome Web Store

1. Open Chrome browser
2. Go to the [Selectly Chrome Web Store page](https://chromewebstore.google.com/detail/selectly-your-personal-ai/cpgfbcghiimbjkkdjaljkhpbdlccfeap)
3. Click "Add to Chrome"
4. Confirm by clicking "Add Extension"

### Installation from Source

#### 1. Prerequisites

- [Node.js](https://nodejs.org/) 16+ and [pnpm](https://pnpm.io/)
- Chrome or Chromium-based browser

#### 2. Clone Repository

```bash
git clone https://github.com/samanhappy/selectly.git
cd selectly
```

#### 3. Install Dependencies

```bash
pnpm install
```

#### 4. Development Mode

```bash
pnpm dev
```

This starts the development server with hot reload.

#### 5. Load Extension

1. Open Chrome browser
2. Navigate to `chrome://extensions/`
3. Enable "Developer mode" (top-right toggle)
4. Click "Load unpacked"
5. Select the `build/chrome-mv3-dev` directory

#### 6. Configure LLM

1. Click the extension icon in the toolbar
2. Navigate to "LLM Config" tab
3. Select a provider and enter your API key
4. Click "Test Connection" to verify
5. Select your preferred model

#### 7. Start Using

Select any text on a webpage, and action buttons will appear automatically!

---

## 📋 Configuration Guide

### Custom Functions

You can create custom AI-powered functions:

#### Example: Code Review

```
Function Key: code_review
Prompt: Please review the following code and provide suggestions for improvements:\n\n{text}
Model: default (or specific model)
Auto Execute: false
```

#### Example: Simplify Text

```
Function Key: simplify
Prompt: Simplify the following text to make it easier to understand:\n\n{text}
```

#### Example: Generate Ideas

```
Function Key: brainstorm
Prompt: Generate 5 creative ideas related to:\n\n{text}
```

### Domain-Specific Functions

You can configure functions to:

- **Auto-execute on specific domains**: Automatically run when text is selected on certain websites
- **Display only on specific domains**: Show function buttons only on certain websites
- **Auto-close buttons**: Automatically hide buttons after execution

---

## 🛠️ Tech Stack

| Technology                                              | Purpose                            | Version |
| ------------------------------------------------------- | ---------------------------------- | ------- |
| **[Plasmo](https://plasmo.com/)**                       | Modern browser extension framework | 0.90.5  |
| **[TypeScript](https://www.typescriptlang.org/)**       | Type-safe development              | 5.3.3   |
| **[React](https://reactjs.org/)**                       | UI components                      | 18.2.0  |
| **[Tailwind CSS](https://tailwindcss.com/)**            | Styling framework                  | 3.4.17  |
| **[OpenAI SDK](https://github.com/openai/openai-node)** | LLM integration                    | 5.16.0  |
| **[Dexie.js](https://dexie.org/)**                      | IndexedDB wrapper for collections  | 4.0.8   |

---

## 📁 Project Structure

```
selectly/
├── core/                          # Core business logic
│   ├── config/
│   │   └── llm-config.ts         # Configuration management
│   ├── services/
│   │   ├── llm-service.ts        # LLM service (provider-agnostic)
│   │   ├── action-service.ts     # Action handling
│   │   ├── collect-service.ts    # Collection management
│   │   ├── collect-sync-service.ts # Cloud sync for collections
│   │   ├── collect-sync-api.ts   # Sync API client
│   │   ├── collect-sync-types.ts # Sync type definitions
│   │   ├── subscription-service-v2.ts # Subscription management
│   │   ├── cloud-sync-subscription-service.ts # Cloud subscription sync
│   │   ├── model-service.ts      # LLM model resolution
│   │   ├── image-generator-service.ts # Image generation for sharing
│   │   └── notification-service.ts # User notifications
│   ├── storage/
│   │   ├── secure-storage.ts     # Encrypted storage wrapper
│   │   ├── collect-db.ts         # IndexedDB for collections
│   │   ├── dictionary-db.ts      # IndexedDB for dictionary
│   │   ├── sync-queue-db.ts      # Sync queue database
│   │   ├── crypto.ts             # Cryptography utilities
│   │   ├── migration.ts          # Storage migrations
│   │   └── security-test.ts      # Security testing
│   ├── auth/
│   │   ├── auth-service.ts       # OAuth2 authentication
│   │   └── auth-background-bridge.ts # Auth background bridge
│   ├── i18n/                      # Internationalization
│   │   ├── index.ts              # i18n entry
│   │   ├── types.ts              # i18n type definitions
│   │   ├── hooks/                # i18n React hooks
│   │   └── locales/              # Translation files
│   ├── hooks/
│   │   └── useSubscription.ts    # Subscription React hook
│   ├── content/
│   │   ├── Selectly.tsx          # Main content script UI
│   │   └── content-styles.ts     # Content script styles
│   ├── oauth/                     # OAuth utilities
│   ├── premium-api-v2.ts          # Premium API client
│   └── user-info.tsx              # User info component
├── components/
│   ├── content/
│   │   ├── ActionButtons.tsx     # Floating action buttons
│   │   ├── StreamingResult.tsx   # Streaming LLM response display
│   │   ├── ShareImageRenderer.tsx # Image generation for sharing
│   │   ├── SharePreview.tsx      # Share preview component
│   │   └── ErrorBoundary.tsx     # Error handling
│   ├── options/
│   │   ├── GeneralPage.tsx       # General settings page
│   │   ├── LLMPage.tsx           # LLM configuration page
│   │   ├── FunctionsPage.tsx     # Functions configuration page
│   │   ├── FunctionCard.tsx      # Function configuration cards
│   │   ├── SubscriptionPage.tsx  # Subscription page
│   │   ├── SubscriptionManagerV3.tsx # Subscription manager UI
│   │   ├── SubscriptionStatus.tsx # Subscription status display
│   │   ├── CollectionsPage.tsx   # Collections management page
│   │   ├── DictionaryPage.tsx    # Dictionary page
│   │   ├── OptionsHeader.tsx     # Options page header
│   │   ├── PopupHeader.tsx       # Popup header
│   │   ├── Sidebar.tsx           # Options sidebar
│   │   ├── TabsBar.tsx           # Settings tabs
│   │   ├── Drawer.tsx            # Drawer component
│   │   ├── constants.ts          # UI constants
│   │   └── forms/                # Form components
│   ├── shared/
│   │   └── PremiumCrown.tsx      # Premium indicator component
│   └── ui/                        # Reusable UI components (shadcn/ui)
│       ├── badge.tsx
│       ├── button.tsx
│       ├── input.tsx
│       └── separator.tsx
├── lib/
│   └── utils.ts                   # Utility functions
├── utils/
│   ├── icon-utils.ts              # Icon utilities
│   └── url-utils.ts               # URL utilities
├── locales/                       # Legacy locale files
├── scripts/
│   └── generate-keys.js           # Key generation utility
├── background.ts                  # Service worker (event handler)
├── content.tsx                    # Content script entry
├── popup.tsx                      # Extension popup
├── options.tsx                    # Options page
├── style.css                      # Global styles
├── tailwind.config.js             # Tailwind configuration
├── postcss.config.js              # PostCSS configuration
├── tsconfig.json                  # TypeScript configuration
└── package.json                   # Project dependencies
```

### Architecture Principles

Following **single responsibility** and **modular design**:

- **Services**: Each service handles one concern (LLM, actions, storage, etc.)
- **Separation of Concerns**: UI components only handle presentation; business logic lives in services
- **Provider-Agnostic**: LLM service supports multiple providers through adapters
- **Secure by Default**: Sensitive data encrypted at rest
- **Testable**: Small, pure functions with clear interfaces

---

## 🔒 Privacy & Security

- ✅ **Local-First**: All configuration stored locally in browser storage
- ✅ **No Data Collection**: Zero tracking or analytics
- ✅ **API Keys Stay Private**: Keys never leave your browser
- ✅ **Direct LLM Communication**: Text sent only to your configured LLM provider
- ✅ **Encrypted Storage**: Sensitive data encrypted using Chrome's secure storage
- ✅ **Open Source**: Full transparency - audit the code yourself

---

## 🧪 Development

### Available Commands

```bash
# Development with hot reload
pnpm dev

# Production build
pnpm build

# Package extension (creates zip)
pnpm package

# Generate OAuth keys
pnpm generate-keys

# Format all files
pnpm format

# Check formatting status
pnpm format:check
```

### Code Quality

- **TypeScript**: Strict type checking
- **Modular**: Single responsibility principle
- **Composable**: Small, reusable functions
- **No Global State**: Services use dependency injection where possible

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Guidelines

- Follow the existing code style (TypeScript + React)
- Keep services focused (single responsibility)
- Add comments for complex logic
- Test in multiple scenarios
- Update documentation if needed

### Ideas for Contribution

- 🌍 Add new language translations
- 🔌 Add support for new LLM providers
- ✨ Create new built-in functions
- 🐛 Fix bugs and improve error handling
- 📖 Improve documentation
- 🎨 Enhance UI/UX

---

## 📝 Roadmap

- [ ] Firefox and Edge support
- [ ] More built-in AI functions
- [ ] Advanced prompt templates
- [ ] Export/import configurations
- [ ] Function marketplace (share custom functions)

---

## 🙏 Acknowledgments

Built with amazing open-source projects:

- [Plasmo](https://plasmo.com/) - Modern extension framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

If you encounter issues or have questions:

1. Check existing [Issues](https://github.com/samanhappy/selectly/issues)
2. Search [Discussions](https://github.com/samanhappy/selectly/discussions)
3. Open a new issue with detailed information

---

## ⭐ Star History

If this project helps you, please consider giving it a ⭐ star!

---

**Made with ❤️ for the open source community**
