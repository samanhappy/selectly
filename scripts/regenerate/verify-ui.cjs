// Run after pnpm build. Uses an isolated profile and a local OpenAI-compatible SSE fixture.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createServer } = require('node:http');

(async () => {
  const root = path.resolve(__dirname, '../..');
  const artifacts = path.join(root, 'build/regenerate-report');
  fs.mkdirSync(artifacts, { recursive: true });
  const requests = [];
  const server = createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') return res.end();
    if (req.url === '/v1/chat/completions') {
      let body = '';
      for await (const chunk of req) body += chunk;
      requests.push(JSON.parse(body));
      const round = requests.length;
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write(
        `data: ${JSON.stringify({ model: 'local-test-model', choices: [{ delta: { content: `Generation ${round}: ` } }] })}\n\n`
      );
      setTimeout(() => {
        res.end(
          `data: ${JSON.stringify({ model: 'local-test-model', choices: [{ delta: { content: '你好，世界。' } }] })}\n\ndata: [DONE]\n\n`
        );
      }, 1200);
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Selectly regeneration test</title><style>body{font:18px/1.6 system-ui;padding:32px;background:#f8fafc;color:#334155}p{margin-top:40px}</style><h1>Selectly · Regenerate</h1><p id="source">Hello world.</p><p>Local streaming fixture · no paid API calls</p>'
    );
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'selectly-regenerate-'));
  let context;
  try {
    const extension = path.join(root, 'build/chrome-mv3-prod');
    context = await chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      headless: true,
      viewport: { width: 1280, height: 800 },
      args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
    const worker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'));
    const id = worker.url().split('/')[2];
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    page.on('dialog', (dialog) => dialog.accept());
    await page.goto(`chrome-extension://${id}/options.html`);
    await page.getByRole('button', { name: 'Configuration', exact: true }).click();
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    const data = {
      data: {
        userConfig: {
          general: { language: 'en' },
          llm: {
            defaultModel: 'local/local-test-model',
            providers: {
              local: {
                id: 'local',
                name: 'Local test',
                apiKey: 'test-only',
                baseURL: `${origin}/v1`,
                enabled: true,
                isBuiltIn: false,
              },
            },
          },
        },
      },
    };
    await (
      await chooser
    ).setFiles({
      name: 'test-config.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(data)),
    });
    await page.waitForEvent('load');
    await page.goto(origin);
    await page.locator('#selectly-global-actions-host').waitFor({ state: 'attached' });
    // Content initialization still restores highlights before installing selection listeners.
    await page.waitForTimeout(500);
    await page.locator('#source').evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    await page.getByRole('button', { name: 'Translate', exact: true }).click();
    const panel = page.locator('.selectly-streaming-result');
    const regenerate = panel.getByRole('button', { name: 'Regenerate', exact: true });
    await regenerate.waitFor();
    assert.match(await panel.innerText(), /Generation 1: 你好，世界。/);
    await page.screenshot({ path: path.join(artifacts, '01-completed-desktop.png') });
    const originalPanel = await panel.elementHandle();
    await panel.getByRole('button', { name: 'Pin', exact: true }).click();
    await panel.getByRole('button', { name: 'Unpin', exact: true }).waitFor();
    const originalPosition = await panel.boundingBox();
    // The second request must keep the original input even after selection changes.
    await page.evaluate(() => getSelection().removeAllRanges());
    await regenerate.click();
    await panel.getByText('Generation 2:', { exact: false }).waitFor();
    await panel.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished))
    );
    assert.equal(await regenerate.count(), 0, 'Regenerate must be unavailable while streaming');
    await page.screenshot({ path: path.join(artifacts, '02-regenerating-desktop.png') });
    await regenerate.waitFor();
    assert.equal(await panel.count(), 1, 'Pinned regeneration must not create another panel');
    assert.ok(await originalPanel.evaluate((element) => element.isConnected));
    await panel.getByRole('button', { name: 'Unpin', exact: true }).waitFor();
    const regeneratedPosition = await panel.boundingBox();
    assert.equal(regeneratedPosition.x, originalPosition.x);
    assert.equal(regeneratedPosition.y, originalPosition.y);
    assert.match(await panel.innerText(), /Generation 2: 你好，世界。/);
    assert.doesNotMatch(await panel.innerText(), /Generation 1:/);
    assert.deepEqual(requests[1], requests[0], 'Regeneration must reuse the original request');
    await page.screenshot({ path: path.join(artifacts, '03-regenerated-desktop.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await regenerate.click();
    await regenerate.waitFor();
    assert.match(await panel.innerText(), /Generation 3: 你好，世界。/);
    assert.deepEqual(requests[2], requests[0]);
    const bounds = await regenerate.boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 390);
    await page.screenshot({ path: path.join(artifacts, '04-regenerated-mobile.png') });
    await panel.getByRole('button', { name: 'Close', exact: true }).click();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('#source').evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      getSelection().removeAllRanges();
      getSelection().addRange(range);
      element.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    await page.getByRole('button', { name: 'Chat', exact: true }).click();
    const input = panel.locator('input');
    assert.equal(await regenerate.count(), 0, 'An empty conversation cannot regenerate');
    await input.fill('Explain this greeting');
    await panel.getByRole('button', { name: 'Send', exact: true }).click();
    await regenerate.waitFor();
    await input.fill('Keep this draft');
    await panel.getByRole('button', { name: 'Pin', exact: true }).click();
    await regenerate.click();
    await panel.getByText('Generation 5:', { exact: false }).waitFor();
    assert.equal(await regenerate.count(), 0);
    await regenerate.waitFor();
    assert.equal(await panel.count(), 1);
    await panel.getByRole('button', { name: 'Unpin', exact: true }).waitFor();
    assert.equal(await input.inputValue(), 'Keep this draft');
    assert.match(await panel.innerText(), /Generation 5: 你好，世界。/);
    assert.doesNotMatch(await panel.innerText(), /Generation 4:/);
    assert.deepEqual(requests[4], requests[3], 'Chat regeneration must not duplicate the question');
    await page.screenshot({ path: path.join(artifacts, '05-chat-regenerated.png') });
    await panel.getByRole('button', { name: 'Switch to page sidebar', exact: true }).click();
    await regenerate.click();
    await regenerate.waitFor();
    assert.deepEqual(requests[5], requests[3]);
    await input.fill('Follow up');
    await panel.getByRole('button', { name: 'Send', exact: true }).click();
    await regenerate.waitFor();
    assert.deepEqual(requests[6].messages.slice(-2), [
      { role: 'assistant', content: 'Generation 6: 你好，世界。' },
      { role: 'user', content: 'Follow up' },
    ]);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(artifacts, '06-chat-sidebar-mobile.png') });
    fs.writeFileSync(
      path.join(artifacts, 'results.json'),
      JSON.stringify(
        {
          passed: [
            'completed result exposes Regenerate',
            'streaming hides Regenerate',
            'regeneration replaces prior output',
            'pinned regeneration keeps the originating panel, pin state, and position',
            'original text and model reused after selection cleared',
            'repeated regeneration works at 390px',
            'Chat regeneration replaces the last answer, preserves drafts and pin state',
            'Chat sidebar regeneration preserves context for follow-up messages',
          ],
          requests: requests.length,
        },
        null,
        2
      )
    );
    console.log('PASS: regeneration browser checks; screenshots:', artifacts);
  } finally {
    await context?.close();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
