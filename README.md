# Selectly

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)

Select any text on a webpage. Get instant AI-powered actions: translate, explain, polish, correct grammar, or chat about it. Works with OpenAI, Anthropic, DeepSeek, OpenRouter, SiliconFlow, and any OpenAI-compatible API.

English | [中文文档](./README_CN.md)

## Features

**Text Actions** — 🌐 Translate · ✨ Polish · 💡 Explain · ✅ Fix Grammar · 💬 Chat

**Utilities** — 🔍 Search · 📋 Copy · 🔗 Open URL · 📚 Collect · 📤 Share as Image

**Premium** — 👑 Subscription · ☁️ Cloud Sync · 🔐 OAuth2 Login

**Customizable** — 🔧 Multiple LLM providers · ⚙️ Toggle features on/off · 📝 Edit prompts · ➕ Write your own functions · 🌍 7 languages · 🎨 Button position

## Quick Start

### Chrome Web Store

[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/selectly-your-personal-ai/cpgfbcghiimbjkkdjaljkhpbdlccfeap).

### From Source

```bash
git clone https://github.com/samanhappy/selectly.git
cd selectly
pnpm install
pnpm dev
```

In Chrome: `chrome://extensions/` → Developer mode on → Load unpacked → pick `build/chrome-mv3-dev`.

### LLM Setup

Click the extension icon → LLM Config tab → pick a provider, paste your API key, choose a model.

## Tech Stack

| | | |
| --- | --- | --- |
| [Plasmo](https://plasmo.com/) | Extension framework | 0.90.5 |
| [TypeScript](https://www.typescriptlang.org/) | Language | 5.3.3 |
| [React](https://reactjs.org/) | UI | 18.2.0 |
| [Tailwind CSS](https://tailwindcss.com/) | Styling | 3.4.17 |
| [OpenAI SDK](https://github.com/openai/openai-node) | LLM calls | 5.16.0 |
| [Dexie.js](https://dexie.org/) | IndexedDB | 4.0.8 |
| [Stripe](https://stripe.com/) | Payments | 9.8.0 |

## Architecture

```
selectly/
├── core/              # Business logic
│   ├── services/      # LLM, actions, collections, subscriptions
│   ├── storage/       # Encrypted storage, IndexedDB, migrations
│   ├── auth/          # OAuth2
│   ├── i18n/          # 7 languages
│   └── content/       # Content script UI
├── components/
│   ├── content/       # Floating buttons, streaming results, share cards
│   ├── options/       # Settings pages
│   └── ui/            # shadcn/ui primitives
├── background.ts      # Service worker
├── content.tsx        # Content script entry
├── popup.tsx          # Popup
└── options.tsx        # Options page
```

Each service owns one concern. LLM adapters are provider-swappable. Sensitive data is encrypted at rest. Everything stays in the browser.

## Privacy

- Config and API keys never leave your browser
- Text goes only to the LLM provider you choose
- No tracking, no analytics
- Encrypted storage via Chrome's secure storage
- Source code is open

## Development

```bash
pnpm dev          # Hot reload
pnpm build        # Production build
pnpm package      # Zip for distribution
pnpm test         # Run tests
pnpm format       # Format with Prettier
```

## Contributing

Pick anything: translations, new LLM providers, built-in functions, bug fixes, docs, UI improvements. Match the existing TypeScript + React style. Keep services small. Test your changes.

## Roadmap

- [ ] Firefox and Edge
- [ ] More built-in functions
- [ ] Advanced prompt templates
- [ ] Export/import config
- [ ] Function marketplace

## License

MIT — [LICENSE](LICENSE)

## Support

[Issues](https://github.com/samanhappy/selectly/issues) · [Discussions](https://github.com/samanhappy/selectly/discussions)
