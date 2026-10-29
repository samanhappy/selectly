# Mobile UI regression

```sh
pnpm install
pnpm exec playwright install chromium
pnpm build
pnpm test:mobile
```

Loads the production MV3 extension in an isolated Chromium profile with touch emulation. Covers phone settings, full-width forms, toolbar bounds at 320/360/390px and landscape, click-operated overflow actions, sidebar send-button hit testing, and touch target sizes. Screenshots and assertion results are written to `build/mobile-ui-report/`. The temporary profile and local fixture server are removed after the run.

The fixture has no horizontal overflow. Selection is established with a DOM Range and touch events; native Android text-selection handles, the soft keyboard, IME composition, and Quetta's extension container still require physical-device testing. The regression does not call an LLM service or use real credentials.
