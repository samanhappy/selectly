# Selectly Copilot Instructions — concise, modular, single-responsibility

Keep this short and actionable. The goal: **modular code**, **single-responsibility**, **reusable pieces**, **direct and precise implementations**. Avoid bicycles (reinventing the wheel), band-aids, verbosity, or over-engineering. When in doubt — split responsibilities, write a small test, and prefer composition over global state.

---

# Project summary

Selectly is a Plasmo Chrome extension that adds AI-powered text actions (translate, summarize, explain) via a floating UI. It includes Stripe-based premium features and secure credential storage.

---

# Core principles (must follow)

1. **Single Responsibility** — each module / file / component has one clear job.
2. **Modularity + Reuse** — implement small, composable functions; export utilities for reuse across popup, content, background.
3. **Straightforward & Precise** — implement only what’s required; avoid ambiguous behavior and feature creep.
4. **Don’t reinvent** — use battle-tested libs (OpenAI SDK, small crypto libs) instead of homegrown replacements unless there’s a clear gap.
5. **No band-aids** — fix root cause; avoid fragile quick fixes that hide complexity.
6. **Testable** — code should be easy to unit/integration test (small pure functions, clear interfaces).
7. **Explicit boundaries** — separate UI, service layer, storage, and platform integration clearly.

---

# Architecture (short)

- **Framework**: Plasmo + React + TypeScript.
- **Styling**: Tailwind (use a single `PALETTE` and design tokens).
- **State & IPC**: Background handles long-lived state; content scripts are thin UI + event handlers; popup only reads/updates config via service APIs.
- **LLM layer**: Provider-agnostic adapter layer that resolves model strings → client instances.

---

# Key components & responsibilities

- `core/content/Selectly.tsx` — _UI only_: selection detection, render buttons in shadow DOM, forward actions to `ActionService`.
- `popup.tsx` — _Settings UI only_: read/update config, run connection tests, trigger migrations.
- `background.ts` — _Coordinator only_: lifecycle, migrations, subscription refresh loop, centralized event router.
- `core/services/*` — _Business logic_: LLMService, ActionService, SubscriptionService, ConfigManager. Each service: single responsibility, well-typed public API, no direct DOM.
- `core/storage/*` — _Persistence only_: secure wrapper around Chrome storage (encryption/obfuscation), migration helpers.
- `core/config/*` — _Config only_: schema, defaults, `getDefaultConfig()` (i18n-aware but simple).

---

# Service patterns (preferred)

- **Dependency Injection over globals**: prefer constructing services and passing them where needed. Use singletons only when lifecycle truly requires a single instance (and make that explicit).
- **Public interfaces**: export small, typed interfaces for each service (e.g., `ILLMService`, `IActionService`).
- **Stateless helpers**: keep pure functions for transformations so they’re trivially testable.

---

# LLM / Provider design

- **Provider adapter**: `providers/<provider>/adapter.ts` implements `sendPrompt()` and streaming hooks. `LLMService` composes adapters.
- **Client pool**: `LLMService.clients: Map<ProviderKey, Client>` — lazy-init, explicit lifecycle (dispose/renew).
- **Model resolution**: `ConfigManager.resolveModel('openai/gpt-4')` → provider + model metadata.
- **Fallbacks & timeouts**: explicit timeout + retry policy; surface clear errors to UI.

---

# Secure storage & config

- **Single secure wrapper**: `secureStorage` is the only code that knows encryption and Chrome storage APIs.
- **No crypto in UI**: UI components call `secureStorage.get('key')`, never handle raw secrets.
- **Migration on startup**: `migration.ts` runs once in background; keep migrations idempotent and versioned.

---

# Premium & subscription

- **SubscriptionService**: single responsibility — determine entitlement. Background orchestrates polling; UI queries service.
- **Feature gating**: check `SubscriptionService.isActive()` at action entry points; fail fast with a clear error path.
- **Stripe integration**: keep payment links and flows in a small payment adapter. Secret keys never in client builds.

---

# Content script best practices

- **Shadow DOM** for isolation; style tokens only from `PALETTE`.
- **Event delegation**: single `handleTextSelection()` that validates and debounces selection changes.
- **Minimal exposure**: avoid mutating `window`. If a bridge is needed, expose a minimal, documented API object and version it.

---

# UI guidelines

- **Small components** (≤ \~120 LOC) with clear props; compose rather than conditionally growing a single file.
- **No heavy logic in components** — delegate to services/hooks.
- **Accessibility**: keyboard operable floating actions; aria labels for icons.
- **Design tokens**: use `PALETTE` + Tailwind utilities; avoid ad-hoc styles.

---

# Error handling & logging

- **Surface friendly messages** in UI (i18n) with actionable steps (e.g., reconfigure API key).
- **Logs**: background-level structured logs; limit console noise in content/popup.
- **LLM errors**: map common HTTP codes to clear messages (401 → auth, 429 → rate-limit, 5xx → provider issue).

---

# Testing & CI

- **Unit tests** for services and pure utils.
- **Integration tests** for provider adapters (mock network).
- **Manual scenarios**: `test.html` for content injection + streaming.
- **CI**: lint, type-check, unit tests on PRs; fail fast.

---

# Development commands

```bash
pnpm dev       # hot reload
pnpm build     # production build
pnpm package   # zip for store
node scripts/generate-keys.js  # dev keys
```

---

# File touchpoints (where to change things)

- Config: `core/config/llm-config.ts`
- i18n: `core/i18n/locales/*`
- Actions: `core/services/action-service.ts` (`executeAction()` single entry)
- LLM: `core/services/llm-service.ts` (adapter registration, streaming)
- Subscription: `core/services/subscription-service.ts`
- UI: `components/content/ActionButtons.tsx`, `components/content/StreamingResult.tsx`, `popup.tsx`

---

# PR / Code-review checklist

- [ ] One responsibility per file/function.
- [ ] Small public API surface and clear types.
- [ ] No duplicated logic (extract shared util).
- [ ] Secure secrets only via `secureStorage`.
- [ ] Unit tests for new logic; integration tests for providers.
- [ ] No global mutable state unless intentionally single-instance and documented.
- [ ] Error messages i18n-ready.
- [ ] No console.log leaks in production.

---

# Quick do/don't (one-liners)

- Do: create small adapters and reuse them.
- Do: inject dependencies instead of importing singletons everywhere.
- Don’t: copy-paste provider logic across files.
- Don’t: patch behavior with DOM hacks — fix the underlying flow.
- Don’t: store secrets in plain storage or code.
