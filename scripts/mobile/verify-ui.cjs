// Run after pnpm build. Requires pnpm exec playwright install chromium.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createServer } = require('node:http');
(async () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const ext = path.join(projectRoot, 'build/chrome-mv3-prod');
  assert.ok(fs.existsSync(path.join(ext, 'manifest.json')), 'Run pnpm build first');
  const artifacts = path.join(projectRoot, 'build/mobile-ui-report');
  fs.mkdirSync(artifacts, { recursive: true });
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'selectly-mobile-'));
  const server = createServer((_request, response) => {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(fs.readFileSync(path.join(__dirname, 'fixture.html')));
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const fixtureUrl = `http://127.0.0.1:${server.address().port}/`;
  let ctx;
  try {
    ctx = await chromium.launchPersistentContext(profile, {
      channel: 'chromium',
      headless: true,
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
      args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
    });
    ctx.setDefaultTimeout(10000);
    const w = ctx.serviceWorkers()[0] || (await ctx.waitForEvent('serviceworker'));
    const id = w.url().split('/')[2];
    const p = await ctx.newPage();
    const failures = [];
    const checks = [];
    const check = async (name, fn) => {
      try {
        await fn();
        checks.push(name);
        console.log('PASS', name);
      } catch (e) {
        failures.push({ name, error: e.message });
        console.log('FAIL', name, e.message.slice(0, 180));
      }
    };
    const shot = async (name) => p.screenshot({ path: path.join(artifacts, `${name}.png`) });
    await p.goto(`chrome-extension://${id}/options.html`);
    await p.setViewportSize({ width: 1280, height: 800 });
    await p.waitForFunction(
      () => document.querySelector('aside')?.getBoundingClientRect().width === 240
    );
    await check('desktop sidebar toggle stays inside its header', async () => {
      const toggle = p.getByRole('button', { name: 'Toggle sidebar' });
      const bounds = await toggle.evaluate((el) => ({
        button: el.getBoundingClientRect().toJSON(),
        header: el.closest('aside').firstElementChild.getBoundingClientRect().toJSON(),
      }));
      assert.ok(bounds.button.top >= bounds.header.top);
      assert.ok(bounds.button.bottom <= bounds.header.bottom);
    });
    await shot('settings-desktop');
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(700);
    await check('phone settings reserve at least 300px for main', async () =>
      assert.ok((await p.locator('main').evaluate((el) => el.clientWidth)) >= 300)
    );
    await shot('settings');
    for (const width of [320, 360]) {
      await p.setViewportSize({ width, height: 844 });
      await check(`settings content fits ${width}px`, async () => {
        const main = await p
          .locator('main')
          .evaluate((el) => ({ width: el.clientWidth, scroll: el.scrollWidth }));
        assert.ok(main.width >= width - 60);
        assert.ok(main.scroll <= main.width);
      });
    }
    await p.setViewportSize({ width: 390, height: 844 });
    await check('mobile navigation overlays content and closes after navigation', async () => {
      await p.getByRole('button', { name: 'Toggle sidebar' }).tap();
      await p.waitForFunction(
        () => document.querySelector('aside').getBoundingClientRect().width >= 230
      );
      assert.ok((await p.locator('main').evaluate((el) => el.clientWidth)) >= 300);
      await p.getByRole('button', { name: 'LLM', exact: true }).tap();
      await p.waitForFunction(
        () => document.querySelector('aside').getBoundingClientRect().width <= 60
      );
      await p.getByRole('button', { name: 'Functions', exact: true }).tap();
    });
    // The add control must be visible at normal horizontal scroll.
    if ((await p.locator('main').evaluate((el) => el.clientWidth)) < 300) {
      await p.getByRole('button', { name: 'Toggle sidebar' }).tap();
      await p.waitForTimeout(300);
    }
    await p.getByRole('button', { name: 'Add Custom Function', exact: true }).tap();
    await p.waitForTimeout(350);
    await check('phone drawer has usable full-width layout', async () =>
      assert.ok((await p.getByRole('dialog').boundingBox()).width >= 360)
    );
    await check('icon choices do not overlap', async () => {
      const es = await p
        .getByRole('option', { name: /^icon / })
        .evaluateAll((es) => es.slice(0, 12).map((x) => x.getBoundingClientRect().toJSON()));
      for (const r of es) assert.ok(r.width >= 36 && r.height >= 36);
      for (let i = 0; i < es.length; i++)
        for (let j = i + 1; j < es.length; j++) {
          const a = es[i],
            b = es[j];
          assert.ok(
            a.right <= b.left + 1 ||
              a.left >= b.right - 1 ||
              a.bottom <= b.top + 1 ||
              a.top >= b.bottom - 1
          );
        }
    });
    await check('phone drawer close has a 44px touch target', async () => {
      const rect = await p
        .getByRole('dialog')
        .getByRole('button', { name: 'Close', exact: true })
        .boundingBox();
      assert.ok(rect.width >= 44 && rect.height >= 44);
    });
    await shot('drawer');
    await p.getByRole('dialog').locator('.sl-close-btn').tap();
    const c = await ctx.newCDPSession(p);
    const select = async () => {
      const b = await p.locator('#page-text').boundingBox();
      await c.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x: b.x + 40, y: b.y + 10 }],
      });
      await p.locator('#page-text').evaluate((el) => {
        const r = document.createRange();
        r.selectNodeContents(el);
        getSelection().removeAllRanges();
        getSelection().addRange(r);
      });
      await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await p.waitForTimeout(450);
    };
    for (const width of [320, 360, 390, 844]) {
      await p.setViewportSize({ width, height: width === 844 ? 390 : 844 });
      await p.goto(fixtureUrl);
      await p.waitForTimeout(450);
      await select();
      await check(`toolbar fits ${width}px`, async () => {
        const r = await p.locator('.selectly-buttons').boundingBox();
        assert.ok(r.x >= 0 && r.x + r.width <= width, JSON.stringify(r));
      });
      await check(`touch actions stay 44px at ${width}px`, async () => {
        const rect = await p.getByRole('button', { name: 'Translate', exact: true }).boundingBox();
        assert.ok(rect.width >= 44 && rect.height >= 44);
      });
      await shot(`toolbar-${width}`);
      await p.getByRole('button', { name: 'More actions', exact: true }).tap();
      await p
        .getByRole('group', { name: 'More actions', exact: true })
        .waitFor({ state: 'visible' });
      await check(`overflow menu fits ${width}px`, async () => {
        const rect = await p
          .getByRole('group', { name: 'More actions', exact: true })
          .boundingBox();
        assert.ok(rect.x >= 0 && rect.x + rect.width <= width);
      });
      await p.getByRole('button', { name: 'More actions', exact: true }).tap();
    }
    await p.setViewportSize({ width: 390, height: 844 });
    await p.waitForTimeout(300);
    const more = p.getByRole('button', { name: 'More actions', exact: true });
    await more.tap();
    await p.waitForTimeout(350);
    await check('all overflow actions fit 390px', async () => {
      const es = await p.locator('.selectly-buttons button').evaluateAll((es) =>
        es
          .filter((e) => {
            const r = e.getBoundingClientRect();
            return r.width && r.height;
          })
          .map((e) => e.getBoundingClientRect().toJSON())
      );
      for (const r of es) assert.ok(r.x >= 0 && r.right <= 390, JSON.stringify(r));
    });
    await shot('menu');
    await more.tap();
    await p.waitForTimeout(250);
    await check('second tap closes overflow menu', async () =>
      assert.equal(await p.getByRole('button', { name: 'Correct', exact: true }).count(), 0)
    );
    await more.click();
    await p.keyboard.press('Escape');
    await check('Escape closes the overflow menu and restores trigger focus', async () => {
      assert.equal(await p.getByRole('group', { name: 'More actions', exact: true }).count(), 0);
      assert.ok(await more.evaluate((el) => el.getRootNode().activeElement === el));
    });
    await p.getByRole('button', { name: 'Chat', exact: true }).tap();
    const panel = p.locator('.selectly-streaming-result');
    await panel.waitFor();
    await p.waitForTimeout(350);
    await panel.getByRole('button', { name: 'Switch to page sidebar' }).tap();
    await panel.locator('input').fill('Ready to send');
    await check('sidebar send remains tappable', async () =>
      panel.getByRole('button', { name: 'Send', exact: true }).tap({ trial: true, timeout: 1500 })
    );
    await check('phone header buttons have 44px touch targets', async () => {
      const r = await panel.getByRole('button', { name: 'Close', exact: true }).boundingBox();
      assert.ok(r.width >= 44 && r.height >= 44);
    });
    await shot('sidebar');
    await p.setViewportSize({ width: 320, height: 740 });
    await p.goto(`chrome-extension://${id}/popup.html`);
    await p.getByRole('button', { name: 'Open Options', exact: true }).waitFor();
    await check('popup adapts to 320px without horizontal overflow', async () => {
      const dimensions = await p.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.equal(dimensions.width, 320);
      assert.ok(dimensions.scroll <= 320);
    });
    await check('phone popup action has a 44px touch target', async () => {
      assert.ok(
        (await p.getByRole('button', { name: 'Open Options', exact: true }).boundingBox()).height >=
          44
      );
    });
    await shot('popup-320');
    fs.writeFileSync(
      path.join(artifacts, 'results.json'),
      JSON.stringify({ checks, failures }, null, 2)
    );
    assert.equal(
      failures.length,
      0,
      `${failures.length} mobile UI checks failed; see ${artifacts}`
    );
  } finally {
    await ctx?.close();
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(profile, { recursive: true, force: true });
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
