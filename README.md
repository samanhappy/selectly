# Selectly

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue.svg)](https://developer.chrome.com/docs/extensions/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)

Understand any webpage with AI. Select text for instant translation or explanation, then open the side panel to summarize and ask about the whole page. Selectly Cloud works out of the box, and advanced users can still bring their own OpenAI-compatible provider.

English | [中文文档](./README_CN.md)

## Features

**Core Reading Loop** — Translate selection · Explain in context · Ask the page

**Side Panel** — Page summaries · Contextual Q&A · Tab-scoped chat history

**Advanced Actions** — Polish · Correct grammar · Highlight · Custom prompts

**Model Options** — Selectly Cloud by default · BYOK for OpenAI, Anthropic, DeepSeek, OpenRouter, SiliconFlow, and compatible APIs

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

Selectly Cloud is the default model path. To bring your own provider, click the extension icon → LLM Config tab → pick a provider, paste your API key, choose a model.

## Tech Stack

|                                                     |                     |        |
| --------------------------------------------------- | ------------------- | ------ |
| [Plasmo](https://plasmo.com/)                       | Extension framework | 0.90.5 |
| [TypeScript](https://www.typescriptlang.org/)       | Language            | 5.3.3  |
| [React](https://reactjs.org/)                       | UI                  | 18.2.0 |
| [Tailwind CSS](https://tailwindcss.com/)            | Styling             | 3.4.17 |
| [OpenAI SDK](https://github.com/openai/openai-node) | LLM calls           | 5.16.0 |
| [Dexie.js](https://dexie.org/)                      | IndexedDB           | 4.0.8  |
| [Stripe](https://stripe.com/)                       | Payments            | 9.8.0  |

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

- BYOK config and API keys never leave your browser
- Text is sent to Selectly Cloud or the LLM provider you choose only when you invoke an AI action
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
- [ ] Stronger side panel page understanding
- [ ] Confirmed page-action suggestions
- [ ] Export/import config

## License

MIT — [LICENSE](LICENSE)

## Support

[Issues](https://github.com/samanhappy/selectly/issues) · [Discussions](https://github.com/samanhappy/selectly/discussions)
